import { useState, useEffect, useCallback, useRef } from 'react';
import { Recipe } from '../types';
import { SUGGESTED_TAGS } from '../lib/constants';
import { getSupabase } from '../lib/supabase';
import { readQueue, type Op } from './useData';

const STORAGE_TAGS = 'a_deux_tags_v1';

export interface TagItem {
  id: string;
  name: string;
  position: number;
  created_at?: string;
}

function readCache(): TagItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_TAGS);
    return raw ? (JSON.parse(raw) as TagItem[]) : [];
  } catch {
    return [];
  }
}

const sortTags = (list: TagItem[]) =>
  [...list].sort((a, b) => a.position - b.position || a.name.localeCompare(b.name, 'fr'));

/** Réapplique les ajouts / suppressions de tags pas encore envoyés à Supabase */
function applyPendingTagOps(list: TagItem[]): TagItem[] {
  let result = [...list];
  for (const op of readQueue()) {
    if (op.kind === 'upsert' && op.table === 'tags') {
      for (const row of op.rows as TagItem[]) {
        result = result.some((t) => t.id === row.id) ? result.map((t) => (t.id === row.id ? row : t)) : [...result, row];
      }
    } else if (op.kind === 'delete' && op.table === 'tags') {
      result = result.filter((t) => !op.ids.includes(t.id));
    }
  }
  return sortTags(result);
}

interface UseTagsParams {
  recipes: Recipe[];
  setRecipes: React.Dispatch<React.SetStateAction<Recipe[]>>;
  persist: (ops: Op[]) => void;
  isOnline: boolean;
}

/**
 * Liste des tags de recettes, partagée entre les deux téléphones (table Supabase « tags »).
 * Tant que la table est vide ou absente, on affiche les tags proposés par défaut.
 */
export function useTags({ recipes, setRecipes, persist, isOnline }: UseTagsParams) {
  const [tagRows, setTagRows] = useState<TagItem[]>(readCache);
  const [tagsTableMissing, setTagsTableMissing] = useState(false);
  const tagRowsRef = useRef(tagRows);
  tagRowsRef.current = tagRows;
  const recipesRef = useRef(recipes);
  recipesRef.current = recipes;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_TAGS, JSON.stringify(tagRows));
    } catch {
      /* ignore */
    }
  }, [tagRows]);

  const fetchTags = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    const { data, error } = await supabase.from('tags').select('*').order('position', { ascending: true });
    if (error) {
      const missing = error.code === '42P01' || error.code === 'PGRST205' || /does not exist|schema cache/i.test(error.message || '');
      setTagsTableMissing(missing);
      return;
    }
    setTagsTableMissing(false);
    setTagRows(applyPendingTagOps((data || []) as TagItem[]));
  }, []);

  // Chargement + temps réel + resynchronisation au retour au premier plan
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !isOnline) return;
    void fetchTags();
    const channel = supabase
      .channel('a-deux-tags')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tags' }, () => void fetchTags())
      .subscribe();
    const onVisible = () => {
      if (document.visibilityState === 'visible') void fetchTags();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      void supabase.removeChannel(channel);
    };
  }, [isOnline, fetchTags]);

  /** Tags affichés : la liste gérée + ceux déjà utilisés par des recettes mais absents de la liste */
  const baseNames = tagRows.length > 0 ? tagRows.map((t) => t.name) : [...SUGGESTED_TAGS];
  const used = recipes.flatMap((r) => r.tags || []).filter((t) => !baseNames.includes(t));
  const tagNames: string[] = [...baseNames, ...Array.from(new Set(used))];

  /** À la première modification, on enregistre la liste par défaut dans Supabase */
  const ensureRows = (): { rows: TagItem[]; ops: Op[] } => {
    const current = tagRowsRef.current;
    if (current.length > 0) return { rows: current, ops: [] };
    const now = Date.now();
    const rows = SUGGESTED_TAGS.map((name, i) => ({
      id: crypto.randomUUID(),
      name,
      position: i,
      created_at: new Date(now + i).toISOString(),
    }));
    return { rows, ops: [{ kind: 'upsert', table: 'tags', rows }] };
  };

  const addTag = useCallback(
    (name: string) => {
      const clean = name.trim();
      if (!clean) return;
      const { rows, ops } = ensureRows();
      if (rows.some((t) => t.name.toLowerCase() === clean.toLowerCase())) {
        if (ops.length) {
          setTagRows(rows);
          persist(ops);
        }
        return;
      }
      const row: TagItem = { id: crypto.randomUUID(), name: clean, position: rows.length, created_at: new Date().toISOString() };
      setTagRows([...rows, row]);
      persist([...ops, { kind: 'upsert', table: 'tags', rows: [row] }]);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [persist]
  );

  /** Supprime un tag de la liste ET de toutes les recettes qui l'utilisent */
  const deleteTag = useCallback(
    (name: string) => {
      const { rows, ops } = ensureRows();
      const row = rows.find((t) => t.name === name);
      const recipeOps: Op[] = recipesRef.current
        .filter((r) => (r.tags || []).includes(name))
        .map((r) => ({ kind: 'update', table: 'recipes', id: r.id, data: { tags: r.tags.filter((t) => t !== name) } }));

      setTagRows(rows.filter((t) => t.name !== name));
      setRecipes((prev) => prev.map((r) => ((r.tags || []).includes(name) ? { ...r, tags: r.tags.filter((t) => t !== name) } : r)));
      persist([...ops, ...(row ? [{ kind: 'delete', table: 'tags', ids: [row.id] } as Op] : []), ...recipeOps]);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [persist, setRecipes]
  );

  /** Nombre de recettes qui utilisent un tag (pour le message de confirmation) */
  const tagUsage = (name: string) => recipes.filter((r) => (r.tags || []).includes(name)).length;

  return { tagNames, tagsTableMissing, addTag, deleteTag, tagUsage };
}
