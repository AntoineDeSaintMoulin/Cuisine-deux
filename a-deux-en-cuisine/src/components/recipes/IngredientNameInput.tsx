import React, { useMemo, useState } from 'react';
import { Recipe, ShoppingItem, Aisle } from '../../types';
import { normalizeText, ingredientKey } from '../../lib/utils';
import { useRecipeOptions } from '../../lib/recipeOptions';

/** Un ingrédient déjà utilisé quelque part dans l'app, avec sa dernière catégorie connue */
export interface KnownIngredient {
  name: string;
  aisle: Aisle;
}

/**
 * Liste des ingrédients connus : ceux des recettes et ceux de la liste de courses.
 * Si un même ingrédient a été rangé dans plusieurs catégories, on garde la plus récente.
 */
export function buildKnownIngredients(recipes: Recipe[], shoppingItems: ShoppingItem[]): KnownIngredient[] {
  const entries: { name: string; aisle: Aisle; date: string }[] = [];
  for (const r of recipes) {
    for (const ing of r.ingredients || []) {
      if (ing.name?.trim()) entries.push({ name: ing.name.trim(), aisle: ing.aisle, date: ing.created_at || r.created_at || '' });
    }
  }
  for (const item of shoppingItems) {
    if (item.name?.trim()) entries.push({ name: item.name.trim(), aisle: item.aisle, date: item.created_at || '' });
  }
  entries.sort((a, b) => a.date.localeCompare(b.date)); // le plus récent écrase le plus ancien
  const map = new Map<string, KnownIngredient>();
  for (const e of entries) map.set(ingredientKey(e.name), { name: e.name, aisle: e.aisle });
  return Array.from(map.values());
}

interface IngredientNameInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Appelé quand on choisit une proposition : nom + catégorie déjà connue */
  onPick: (ingredient: KnownIngredient) => void;
  className?: string;
  placeholder?: string;
}

/** Champ « nom d'ingrédient » qui propose les ingrédients existants dès 2 lettres tapées */
export const IngredientNameInput: React.FC<IngredientNameInputProps> = ({ value, onChange, onPick, className, placeholder }) => {
  const { knownIngredients } = useRecipeOptions();
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);

  const suggestions = useMemo(() => {
    const q = normalizeText(value);
    if (q.length < 2) return [];
    const scored = knownIngredients
      .map((ing) => {
        const n = normalizeText(ing.name);
        if (ing.name === value.trim()) return null; // déjà tapé tel quel : rien à proposer
        // d'abord ceux qui commencent par la saisie, puis ceux dont un mot commence par la saisie, puis le reste
        const score = n.startsWith(q) ? 0 : n.split(/[\s'-]+/).some((w) => w.startsWith(q)) ? 1 : n.includes(q) ? 2 : -1;
        return score < 0 ? null : { ing, score };
      })
      .filter((x): x is { ing: KnownIngredient; score: number } => x !== null)
      .sort((a, b) => a.score - b.score || a.ing.name.localeCompare(b.ing.name, 'fr'));
    return scored.slice(0, 6).map((x) => x.ing);
  }, [value, knownIngredients]);

  const pick = (ing: KnownIngredient) => {
    onPick(ing);
    setOpen(false);
  };

  return (
    <div className="relative flex-1 w-full">
      <input
        type="text"
        value={value}
        autoComplete="off"
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setHighlight(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (!open || suggestions.length === 0) return;
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlight((h) => (h + 1) % suggestions.length);
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlight((h) => (h - 1 + suggestions.length) % suggestions.length);
          } else if (e.key === 'Enter') {
            e.preventDefault();
            pick(suggestions[highlight]);
          } else if (e.key === 'Escape') {
            setOpen(false);
          }
        }}
        placeholder={placeholder}
        className={className}
      />
      {open && suggestions.length > 0 && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1 z-20 bg-white border border-[#E8DDD2] rounded-lg shadow-lg overflow-hidden"
        >
          {suggestions.map((ing, i) => (
            <li
              key={ing.name}
              role="option"
              aria-selected={i === highlight}
              // onMouseDown (et pas onClick) pour choisir avant que le champ ne perde le focus
              onMouseDown={(e) => {
                e.preventDefault();
                pick(ing);
              }}
              onMouseEnter={() => setHighlight(i)}
              className={`px-2.5 py-2 text-xs cursor-pointer flex items-center justify-between gap-2 ${
                i === highlight ? 'bg-[#F9EDE8]' : 'bg-white'
              }`}
            >
              <span className="font-medium text-[#3E2C23] truncate">{ing.name}</span>
              <span className="text-[10px] text-[#7A8B69] shrink-0">{ing.aisle}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
