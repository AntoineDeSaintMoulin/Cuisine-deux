import { useState, useEffect, useCallback, useRef } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Recipe, Meal, ShoppingItem, RecipeIngredient, Slot } from '../types';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { useOnlineStatus } from './useOnlineStatus';

// v2 : les anciennes clés (v1) contenaient des données de démonstration, on repart de zéro.
const STORAGE_RECIPES = 'a_deux_recipes_v2';
const STORAGE_MEALS = 'a_deux_meals_v2';
const STORAGE_SHOPPING = 'a_deux_shopping_v2';
const STORAGE_PENDING_QUEUE = 'a_deux_pending_sync_v2';
const LEGACY_KEYS = ['a_deux_recipes_v1', 'a_deux_meals_v1', 'a_deux_shopping_v1', 'a_deux_pending_sync_v1'];

type Table = 'recipes' | 'recipe_ingredients' | 'meals' | 'shopping_items';

/**
 * Une opération d'écriture vers Supabase. Toutes les opérations sont rejouables
 * sans effet de bord (upsert, update, delete), ce qui permet de les réessayer
 * sans risque après une coupure réseau.
 */
type Op =
  | { kind: 'upsert'; table: Table; rows: any[] }
  | { kind: 'update'; table: Table; id: string; data: any }
  | { kind: 'delete'; table: Table; ids: string[] }
  | { kind: 'delete_ingredients_of_recipe'; recipeId: string };

type OpResult = 'ok' | 'retry' | 'fatal';

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('Erreur sauvegarde locale', key, e);
  }
}

function readQueue(): Op[] {
  return readJson<Op[]>(STORAGE_PENDING_QUEUE, []);
}

function writeQueue(queue: Op[]) {
  if (queue.length === 0) {
    try {
      localStorage.removeItem(STORAGE_PENDING_QUEUE);
    } catch {
      /* ignore */
    }
  } else {
    writeJson(STORAGE_PENDING_QUEUE, queue);
  }
}

/**
 * Exécute une opération. supabase-js ne lève pas d'exception : il renvoie { error }.
 * - erreur sans code Postgres (réseau coupé, timeout…) → 'retry' : on garde l'opération en file
 * - erreur avec code Postgres (contrainte, table manquante…) → 'fatal' : la réessayer ne servirait à rien
 */
async function runOp(supabase: SupabaseClient, op: Op): Promise<{ result: OpResult; message?: string }> {
  try {
    let res: { error: any };
    switch (op.kind) {
      case 'upsert':
        if (op.rows.length === 0) return { result: 'ok' };
        res = await supabase.from(op.table).upsert(op.rows);
        break;
      case 'update':
        res = await supabase.from(op.table).update(op.data).eq('id', op.id);
        break;
      case 'delete':
        if (op.ids.length === 0) return { result: 'ok' };
        res = await supabase.from(op.table).delete().in('id', op.ids);
        break;
      case 'delete_ingredients_of_recipe':
        res = await supabase.from('recipe_ingredients').delete().eq('recipe_id', op.recipeId);
        break;
    }
    if (!res.error) return { result: 'ok' };
    const code = res.error.code;
    const isServerError = typeof code === 'string' && code.length > 0;
    return { result: isServerError ? 'fatal' : 'retry', message: res.error.message };
  } catch (err: any) {
    return { result: 'retry', message: err?.message };
  }
}

/** Réapplique localement les opérations encore en attente, par-dessus les données reçues du serveur. */
function applyPendingOps(
  queue: Op[],
  data: { recipes: Recipe[]; meals: Meal[]; shopping: ShoppingItem[] }
) {
  let { recipes, meals, shopping } = data;

  const upsertById = <T extends { id: string }>(list: T[], rows: T[]) => {
    const map = new Map(list.map((x) => [x.id, x]));
    for (const r of rows) map.set(r.id, { ...(map.get(r.id) || {}), ...r });
    return Array.from(map.values());
  };

  for (const op of queue) {
    if (op.kind === 'upsert') {
      if (op.table === 'shopping_items') shopping = upsertById(shopping, op.rows);
      if (op.table === 'meals') meals = upsertById(meals, op.rows);
      if (op.table === 'recipes') {
        recipes = upsertById(
          recipes,
          op.rows.map((r) => ({ ...r, ingredients: recipes.find((x) => x.id === r.id)?.ingredients || [] }))
        );
      }
      if (op.table === 'recipe_ingredients') {
        for (const ing of op.rows as RecipeIngredient[]) {
          recipes = recipes.map((r) =>
            r.id === ing.recipe_id
              ? { ...r, ingredients: upsertById(r.ingredients || [], [ing]) }
              : r
          );
        }
      }
    } else if (op.kind === 'update') {
      if (op.table === 'shopping_items') shopping = shopping.map((x) => (x.id === op.id ? { ...x, ...op.data } : x));
      if (op.table === 'meals') meals = meals.map((x) => (x.id === op.id ? { ...x, ...op.data } : x));
      if (op.table === 'recipes') recipes = recipes.map((x) => (x.id === op.id ? { ...x, ...op.data } : x));
    } else if (op.kind === 'delete') {
      const ids = new Set(op.ids);
      if (op.table === 'shopping_items') shopping = shopping.filter((x) => !ids.has(x.id));
      if (op.table === 'meals') meals = meals.filter((x) => !ids.has(x.id));
      if (op.table === 'recipes') {
        recipes = recipes.filter((x) => !ids.has(x.id));
        meals = meals.map((m) => (m.recipe_id && ids.has(m.recipe_id) ? { ...m, recipe_id: null } : m));
      }
    } else if (op.kind === 'delete_ingredients_of_recipe') {
      recipes = recipes.map((r) => (r.id === op.recipeId ? { ...r, ingredients: [] } : r));
    }
  }

  return { recipes, meals, shopping };
}

function sortMeals(list: Meal[]) {
  return [...list].sort((a, b) => a.date.localeCompare(b.date) || (a.created_at || '').localeCompare(b.created_at || ''));
}

export function useData() {
  const isOnline = useOnlineStatus();

  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    LEGACY_KEYS.forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch {
        /* ignore */
      }
    });
    return readJson<Recipe[]>(STORAGE_RECIPES, []);
  });
  const [meals, setMeals] = useState<Meal[]>(() => readJson<Meal[]>(STORAGE_MEALS, []));
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>(() => readJson<ShoppingItem[]>(STORAGE_SHOPPING, []));

  const [isSyncing, setIsSyncing] = useState(false);
  const [isSupabaseLive, setIsSupabaseLive] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [pendingCount, setPendingCount] = useState<number>(() => readQueue().length);

  const isOnlineRef = useRef(isOnline);
  isOnlineRef.current = isOnline;
  const shoppingItemsRef = useRef(shoppingItems);
  shoppingItemsRef.current = shoppingItems;
  const mealsRef = useRef(meals);
  mealsRef.current = meals;
  const flushingRef = useRef<Promise<void> | null>(null);

  // Cache local (lecture hors ligne)
  useEffect(() => writeJson(STORAGE_RECIPES, recipes), [recipes]);
  useEffect(() => writeJson(STORAGE_MEALS, meals), [meals]);
  useEffect(() => writeJson(STORAGE_SHOPPING, shoppingItems), [shoppingItems]);

  // ==========================================
  // FILE D'ATTENTE & SYNCHRONISATION
  // ==========================================

  /** Envoie la file d'attente à Supabase, dans l'ordre. S'arrête à la première erreur réseau. */
  const flushQueue = useCallback(async (): Promise<void> => {
    if (flushingRef.current) return flushingRef.current;
    const supabase = getSupabase();
    if (!supabase || !isOnlineRef.current) return;

    const task = (async () => {
      let queue = readQueue();
      if (queue.length === 0) return;
      setIsSyncing(true);
      try {
        while (queue.length > 0) {
          const { result, message } = await runOp(supabase, queue[0]);
          if (result === 'retry') {
            setSyncError('Connexion instable : les modifications seront envoyées dès que possible.');
            break;
          }
          if (result === 'fatal') {
            console.error('Modification refusée par Supabase', queue[0], message);
            setSyncError(`Une modification a été refusée par la base de données : ${message || 'erreur inconnue'}`);
          }
          // 'ok' ou 'fatal' : on retire l'opération de la file
          queue = queue.slice(1);
          writeQueue(queue);
          // Des opérations ont pu être ajoutées pendant l'envoi : on relit la file
          queue = readQueue();
        }
        if (queue.length === 0) setLastSyncTime(new Date());
      } finally {
        setPendingCount(readQueue().length);
        setIsSyncing(false);
      }
    })();

    flushingRef.current = task;
    try {
      await task;
    } finally {
      flushingRef.current = null;
    }
  }, []);

  /** Enregistre des opérations : file d'attente locale puis envoi immédiat si possible. */
  const persist = useCallback(
    (ops: Op[]) => {
      writeQueue([...readQueue(), ...ops]);
      setPendingCount(readQueue().length);
      if (isOnlineRef.current && isSupabaseConfigured()) {
        void flushQueue();
      }
    },
    [flushQueue]
  );

  const fetchRecipes = useCallback(async (supabase: SupabaseClient): Promise<Recipe[]> => {
    const [{ data: recData, error: recError }, { data: ingData, error: ingError }] = await Promise.all([
      supabase.from('recipes').select('*').order('created_at', { ascending: false }),
      supabase.from('recipe_ingredients').select('*').order('created_at', { ascending: true }),
    ]);
    if (recError) throw recError;
    if (ingError) throw ingError;

    const ingMap: Record<string, RecipeIngredient[]> = {};
    for (const ing of ingData || []) {
      (ingMap[ing.recipe_id] ||= []).push(ing);
    }
    return (recData || []).map((r: any) => ({
      ...r,
      tags: Array.isArray(r.tags) ? r.tags : [],
      ingredients: ingMap[r.id] || [],
    }));
  }, []);

  /** Envoie d'abord les modifications locales, puis recharge tout depuis Supabase. */
  const loadDataFromSupabase = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !isOnlineRef.current) {
      setIsSupabaseLive(false);
      return;
    }

    await flushQueue();
    setIsSyncing(true);

    try {
      const [remoteRecipes, mealRes, shopRes] = await Promise.all([
        fetchRecipes(supabase),
        supabase.from('meals').select('*').order('date', { ascending: true }),
        supabase.from('shopping_items').select('*').order('created_at', { ascending: true }),
      ]);
      if (mealRes.error) throw mealRes.error;
      if (shopRes.error) throw shopRes.error;

      // Les modifications pas encore envoyées restent visibles
      const merged = applyPendingOps(readQueue(), {
        recipes: remoteRecipes,
        meals: mealRes.data || [],
        shopping: shopRes.data || [],
      });

      setRecipes(merged.recipes);
      setMeals(sortMeals(merged.meals));
      setShoppingItems(merged.shopping);
      setSyncError(null);
      setLastSyncTime(new Date());
    } catch (err: any) {
      console.error('Erreur synchronisation Supabase:', err);
      setSyncError(err?.message ? `Impossible de joindre Supabase : ${err.message}` : 'Impossible de joindre Supabase');
    } finally {
      setIsSyncing(false);
    }
  }, [flushQueue, fetchRecipes]);

  const reloadRecipesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleRecipesReload = useCallback(() => {
    if (reloadRecipesTimer.current) clearTimeout(reloadRecipesTimer.current);
    // Une modification de recette génère plusieurs événements : on attend qu'ils soient tous arrivés
    reloadRecipesTimer.current = setTimeout(async () => {
      const supabase = getSupabase();
      if (!supabase) return;
      try {
        const remote = await fetchRecipes(supabase);
        const merged = applyPendingOps(readQueue(), { recipes: remote, meals: mealsRef.current, shopping: shoppingItemsRef.current });
        setRecipes(merged.recipes);
      } catch (err) {
        console.warn('Erreur rechargement recettes', err);
      }
    }, 400);
  }, [fetchRecipes]);

  // Chargement initial + abonnement temps réel (relancés au retour du réseau)
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !isOnline) {
      setIsSupabaseLive(false);
      return;
    }

    void loadDataFromSupabase();

    const channel = supabase
      .channel('a-deux-realtime-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shopping_items' }, (payload) => {
        const { eventType, new: newRec, old: oldRec } = payload as any;
        if (eventType === 'INSERT' || eventType === 'UPDATE') {
          setShoppingItems((prev) =>
            prev.some((i) => i.id === newRec.id)
              ? prev.map((i) => (i.id === newRec.id ? (newRec as ShoppingItem) : i))
              : [...prev, newRec as ShoppingItem]
          );
        } else if (eventType === 'DELETE') {
          setShoppingItems((prev) => prev.filter((i) => i.id !== oldRec.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meals' }, (payload) => {
        const { eventType, new: newRec, old: oldRec } = payload as any;
        if (eventType === 'INSERT' || eventType === 'UPDATE') {
          setMeals((prev) =>
            sortMeals(
              prev.some((m) => m.id === newRec.id)
                ? prev.map((m) => (m.id === newRec.id ? (newRec as Meal) : m))
                : [...prev, newRec as Meal]
            )
          );
        } else if (eventType === 'DELETE') {
          setMeals((prev) => prev.filter((m) => m.id !== oldRec.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recipes' }, scheduleRecipesReload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recipe_ingredients' }, scheduleRecipesReload)
      .subscribe((status) => {
        setIsSupabaseLive(status === 'SUBSCRIBED');
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [isOnline, loadDataFromSupabase, scheduleRecipesReload]);

  // Quand l'app revient au premier plan (téléphone déverrouillé, PWA rouverte), on resynchronise
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && isOnlineRef.current && isSupabaseConfigured()) {
        void loadDataFromSupabase();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [loadDataFromSupabase]);

  // ==========================================
  // COURSES
  // ==========================================
  const addShoppingItem = useCallback(
    async (item: Omit<ShoppingItem, 'id' | 'created_at' | 'checked'> & { checked?: boolean }) => {
      const newItem: ShoppingItem = {
        id: crypto.randomUUID(),
        name: item.name,
        quantity: item.quantity ?? null,
        aisle: item.aisle,
        note: item.note ?? null,
        checked: item.checked ?? false,
        recipe_id: item.recipe_id ?? null,
        created_at: new Date().toISOString(),
      };
      setShoppingItems((prev) => [...prev, newItem]);
      persist([{ kind: 'upsert', table: 'shopping_items', rows: [newItem] }]);
    },
    [persist]
  );

  const addMultipleShoppingItems = useCallback(
    async (items: Array<Omit<ShoppingItem, 'id' | 'created_at'>>) => {
      const now = Date.now();
      const newItems: ShoppingItem[] = items.map((item, i) => ({
        ...item,
        id: crypto.randomUUID(),
        created_at: new Date(now + i).toISOString(),
      }));
      if (newItems.length === 0) return;
      setShoppingItems((prev) => [...prev, ...newItems]);
      persist([{ kind: 'upsert', table: 'shopping_items', rows: newItems }]);
    },
    [persist]
  );

  const toggleShoppingItem = useCallback(
    async (id: string) => {
      const current = shoppingItemsRef.current.find((i) => i.id === id);
      if (!current) return;
      const checked = !current.checked;
      setShoppingItems((prev) => prev.map((i) => (i.id === id ? { ...i, checked } : i)));
      persist([{ kind: 'update', table: 'shopping_items', id, data: { checked } }]);
    },
    [persist]
  );

  const updateShoppingItem = useCallback(
    async (id: string, updates: Partial<ShoppingItem>) => {
      const { id: _id, created_at: _c, ...data } = updates;
      setShoppingItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...data } : i)));
      persist([{ kind: 'update', table: 'shopping_items', id, data }]);
    },
    [persist]
  );

  const deleteShoppingItem = useCallback(
    async (id: string) => {
      setShoppingItems((prev) => prev.filter((i) => i.id !== id));
      persist([{ kind: 'delete', table: 'shopping_items', ids: [id] }]);
    },
    [persist]
  );

  const clearCheckedShoppingItems = useCallback(async () => {
    const ids = shoppingItemsRef.current.filter((i) => i.checked).map((i) => i.id);
    if (ids.length === 0) return;
    setShoppingItems((prev) => prev.filter((i) => !i.checked));
    persist([{ kind: 'delete', table: 'shopping_items', ids }]);
  }, [persist]);

  // ==========================================
  // REPAS
  // ==========================================
  const addMeal = useCallback(
    async (meal: Omit<Meal, 'id' | 'created_at'>) => {
      const newMeal: Meal = {
        id: crypto.randomUUID(),
        date: meal.date,
        slot: meal.slot,
        title: meal.title,
        recipe_id: meal.recipe_id ?? null,
        note: meal.note ?? null,
        created_at: new Date().toISOString(),
      };
      setMeals((prev) => sortMeals([...prev, newMeal]));
      persist([{ kind: 'upsert', table: 'meals', rows: [newMeal] }]);
    },
    [persist]
  );

  const updateMeal = useCallback(
    async (id: string, updates: Partial<Meal>) => {
      const { id: _id, created_at: _c, ...data } = updates;
      setMeals((prev) => sortMeals(prev.map((m) => (m.id === id ? { ...m, ...data } : m))));
      persist([{ kind: 'update', table: 'meals', id, data }]);
    },
    [persist]
  );

  const deleteMeal = useCallback(
    async (id: string) => {
      setMeals((prev) => prev.filter((m) => m.id !== id));
      persist([{ kind: 'delete', table: 'meals', ids: [id] }]);
    },
    [persist]
  );

  const duplicateMeal = useCallback(
    async (mealId: string, targetDate: string, targetSlot: Slot) => {
      const source = mealsRef.current.find((m) => m.id === mealId);
      if (!source) return;
      await addMeal({
        date: targetDate,
        slot: targetSlot,
        title: source.title,
        recipe_id: source.recipe_id,
        note: source.note,
      });
    },
    [addMeal]
  );

  // ==========================================
  // RECETTES
  // ==========================================
  const buildIngredients = (
    recipeId: string,
    ingredients: Array<Omit<RecipeIngredient, 'id' | 'recipe_id' | 'created_at'>>
  ): RecipeIngredient[] => {
    const now = Date.now();
    return ingredients.map((ing, i) => ({
      id: crypto.randomUUID(),
      recipe_id: recipeId,
      name: ing.name,
      quantity: ing.quantity ?? null,
      unit: ing.unit ?? null,
      aisle: ing.aisle,
      // horodatage croissant pour conserver l'ordre de saisie
      created_at: new Date(now + i).toISOString(),
    }));
  };

  const addRecipe = useCallback(
    async (
      recipe: Omit<Recipe, 'id' | 'created_at' | 'ingredients'>,
      ingredients: Array<Omit<RecipeIngredient, 'id' | 'recipe_id' | 'created_at'>>
    ) => {
      const id = crypto.randomUUID();
      const recipeRow = {
        id,
        name: recipe.name,
        instructions: recipe.instructions,
        tags: recipe.tags,
        created_at: new Date().toISOString(),
      };
      const newIngredients = buildIngredients(id, ingredients);
      const newRecipe: Recipe = { ...recipeRow, ingredients: newIngredients };

      setRecipes((prev) => [newRecipe, ...prev]);
      persist([
        { kind: 'upsert', table: 'recipes', rows: [recipeRow] },
        { kind: 'upsert', table: 'recipe_ingredients', rows: newIngredients },
      ]);
      return newRecipe;
    },
    [persist]
  );

  const updateRecipe = useCallback(
    async (
      id: string,
      recipeUpdates: Partial<Recipe>,
      newIngredients?: Array<Omit<RecipeIngredient, 'id' | 'recipe_id' | 'created_at'>>
    ) => {
      const { ingredients: _i, id: _id, created_at: _c, ...data } = recipeUpdates;
      const ings = newIngredients ? buildIngredients(id, newIngredients) : null;

      setRecipes((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...data, ingredients: ings ?? r.ingredients } : r))
      );

      const ops: Op[] = [];
      if (Object.keys(data).length > 0) ops.push({ kind: 'update', table: 'recipes', id, data });
      if (ings) {
        ops.push({ kind: 'delete_ingredients_of_recipe', recipeId: id });
        ops.push({ kind: 'upsert', table: 'recipe_ingredients', rows: ings });
      }
      persist(ops);
    },
    [persist]
  );

  const deleteRecipe = useCallback(
    async (id: string) => {
      setRecipes((prev) => prev.filter((r) => r.id !== id));
      // La base fait ON DELETE SET NULL : on reflète la même chose localement
      setMeals((prev) => prev.map((m) => (m.recipe_id === id ? { ...m, recipe_id: null } : m)));
      setShoppingItems((prev) => prev.map((i) => (i.recipe_id === id ? { ...i, recipe_id: null } : i)));
      persist([{ kind: 'delete', table: 'recipes', ids: [id] }]);
    },
    [persist]
  );

  return {
    recipes,
    meals,
    shoppingItems,
    isOnline,
    isSyncing,
    isSupabaseLive,
    syncError,
    lastSyncTime,
    pendingCount,
    reloadFromSupabase: loadDataFromSupabase,
    addShoppingItem,
    addMultipleShoppingItems,
    toggleShoppingItem,
    updateShoppingItem,
    deleteShoppingItem,
    clearCheckedShoppingItems,
    addMeal,
    updateMeal,
    deleteMeal,
    duplicateMeal,
    addRecipe,
    updateRecipe,
    deleteRecipe,
  };
}
