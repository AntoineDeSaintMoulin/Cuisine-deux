import React, { useState, useEffect, useMemo } from 'react';
import { X, Check, Search, BookHeart, Utensils, History, Trash2, Calendar } from 'lucide-react';
import { Meal, Recipe, Slot } from '../../types';
import { SLOTS, MIN_DATE } from '../../lib/constants';
import { formatFrenchDate, searchMatches } from '../../lib/utils';

interface AddMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipes: Recipe[];
  pastMeals: Meal[];
  defaultDate: string;
  defaultSlot: Slot;
  editingMeal?: Meal | null;
  onSave: (meal: { date: string; slot: Slot; title: string; recipe_id?: string | null; note?: string | null }) => void;
  onDelete?: (id: string) => void;
  /** Recette à présélectionner (bouton « Planifier ce repas ») */
  presetRecipe?: Recipe | null;
}

type MealSource = 'recipe' | 'custom' | 'past';

export const AddMealModal: React.FC<AddMealModalProps> = ({
  isOpen,
  onClose,
  recipes,
  pastMeals,
  defaultDate,
  defaultSlot,
  editingMeal,
  onSave,
  onDelete,
  presetRecipe,
}) => {
  const [source, setSource] = useState<MealSource>('recipe');
  const [date, setDate] = useState(defaultDate);
  const [slot, setSlot] = useState<Slot>(defaultSlot);
  const [title, setTitle] = useState('');
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingMeal) {
      setDate(editingMeal.date);
      setSlot(editingMeal.slot);
      setTitle(editingMeal.title);
      setSelectedRecipeId(editingMeal.recipe_id || null);
      setNote(editingMeal.note || '');
      setSource(editingMeal.recipe_id ? 'recipe' : 'custom');
    } else {
      setDate(defaultDate);
      setSlot(defaultSlot);
      setTitle(presetRecipe ? presetRecipe.name : '');
      setSelectedRecipeId(presetRecipe ? presetRecipe.id : null);
      setNote('');
      setSource('recipe');
    }
    setSearchQuery('');
    setError('');
  }, [editingMeal, defaultDate, defaultSlot, isOpen, presetRecipe]);

  // Filter recipes based on search query
  const filteredRecipes = useMemo(() => {
    if (!searchQuery) return recipes;
    return recipes.filter((r) => {
      const matchName = searchMatches(r.name, searchQuery);
      const matchTags = r.tags.some((t) => searchMatches(t, searchQuery));
      const matchIngredients = r.ingredients?.some((ing) => searchMatches(ing.name, searchQuery));
      return matchName || matchTags || matchIngredients;
    });
  }, [recipes, searchQuery]);

  // Filter past meals (unique by title)
  const uniquePastMeals = useMemo(() => {
    const map = new Map<string, Meal>();
    for (const m of pastMeals) {
      if (!map.has(m.title)) {
        map.set(m.title, m);
      }
    }
    const list = Array.from(map.values());
    if (!searchQuery) return list;
    return list.filter((m) => searchMatches(m.title, searchQuery));
  }, [pastMeals, searchQuery]);

  if (!isOpen) return null;

  const handleSelectRecipe = (recipe: Recipe) => {
    setSelectedRecipeId(recipe.id);
    setTitle(recipe.name);
    setError('');
  };

  const handleSelectPastMeal = (pastMeal: Meal) => {
    setTitle(pastMeal.title);
    setSelectedRecipeId(pastMeal.recipe_id || null);
    if (pastMeal.note) setNote(pastMeal.note);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Veuillez renseigner ou sélectionner un repas');
      return;
    }

    // Minimum date check
    if (date < MIN_DATE) {
      setError(`La date ne peut pas être antérieure au ${formatFrenchDate(MIN_DATE, true)}`);
      return;
    }

    onSave({
      date,
      slot,
      title: title.trim(),
      recipe_id: selectedRecipeId,
      note: note.trim() || null,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-[#FFFDF9] rounded-t-3xl sm:rounded-2xl border border-[#E8DDD2] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-6 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E8DDD2] bg-[#FBF6EE] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#C65D3B] text-white flex items-center justify-center">
              <Utensils className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-[#3E2C23]">
                {editingMeal ? 'Modifier le repas' : 'Planifier un repas'}
              </h2>
              <p className="text-[11px] text-[#7E6F65]">
                {formatFrenchDate(date)} • {slot}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#7E6F65] hover:text-[#3E2C23] hover:bg-[#E8DDD2]/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {/* Date & Slot pickers */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#3E2C23] mb-1">
                Date
              </label>
              <input
                type="date"
                min={MIN_DATE}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#E8DDD2] focus:outline-none focus:ring-2 focus:ring-[#C65D3B] text-[#3E2C23]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#3E2C23] mb-1">
                Créneau
              </label>
              <div className="grid grid-cols-3 gap-1 bg-[#FBF6EE] p-1 rounded-xl border border-[#E8DDD2]">
                {SLOTS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSlot(s.id)}
                    className={`py-1 text-[11px] font-semibold rounded-lg transition ${
                      slot === s.id
                        ? 'bg-[#C65D3B] text-white shadow-xs'
                        : 'text-[#7E6F65] hover:text-[#3E2C23]'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          {!editingMeal && (
            <div className="grid grid-cols-3 gap-1 bg-[#FBF6EE] p-1 rounded-xl border border-[#E8DDD2]">
              <button
                type="button"
                onClick={() => setSource('recipe')}
                className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${
                  source === 'recipe'
                    ? 'bg-[#FFFDF9] text-[#C65D3B] shadow-xs'
                    : 'text-[#7E6F65] hover:text-[#3E2C23]'
                }`}
              >
                <BookHeart className="w-3.5 h-3.5" />
                <span>Recette</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSource('custom');
                  setSelectedRecipeId(null);
                }}
                className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${
                  source === 'custom'
                    ? 'bg-[#FFFDF9] text-[#C65D3B] shadow-xs'
                    : 'text-[#7E6F65] hover:text-[#3E2C23]'
                }`}
              >
                <Utensils className="w-3.5 h-3.5" />
                <span>Texte libre</span>
              </button>

              <button
                type="button"
                onClick={() => setSource('past')}
                className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${
                  source === 'past'
                    ? 'bg-[#FFFDF9] text-[#C65D3B] shadow-xs'
                    : 'text-[#7E6F65] hover:text-[#3E2C23]'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Passé</span>
              </button>
            </div>
          )}

          {/* Source = Recipe */}
          {source === 'recipe' && (
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7E6F65]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher une recette (ex: saumon, gratin...)"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-[#E8DDD2] focus:outline-none focus:ring-2 focus:ring-[#C65D3B] text-[#3E2C23]"
                />
              </div>

              {title && (
                <div className="p-2.5 rounded-xl bg-[#EFF3ED] border border-[#C8D6C0] flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#4A633F]">
                    ✓ Recette sélectionnée : {title}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setTitle('');
                      setSelectedRecipeId(null);
                    }}
                    className="text-[11px] text-[#7A8B69] hover:underline"
                  >
                    Changer
                  </button>
                </div>
              )}

              <div className="max-h-44 overflow-y-auto divide-y divide-[#E8DDD2]/60 border border-[#E8DDD2] rounded-xl bg-white">
                {filteredRecipes.length === 0 ? (
                  <div className="p-4 text-center text-xs text-[#7E6F65]">
                    Aucune recette trouvée
                  </div>
                ) : (
                  filteredRecipes.map((r) => {
                    const isSelected = selectedRecipeId === r.id;
                    return (
                      <div
                        key={r.id}
                        onClick={() => handleSelectRecipe(r)}
                        className={`p-2.5 flex items-center justify-between cursor-pointer transition text-xs ${
                          isSelected
                            ? 'bg-[#F9EDE8] font-bold text-[#C65D3B]'
                            : 'hover:bg-[#FBF6EE] text-[#3E2C23]'
                        }`}
                      >
                        <div>
                          <div className="font-medium">{r.name}</div>
                          {r.tags.length > 0 && (
                            <div className="flex gap-1 mt-0.5">
                              {r.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="text-[9px] px-1.5 py-0.2 rounded bg-[#FBF6EE] text-[#7E6F65] border border-[#E8DDD2]"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[#C65D3B]" />}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Source = Custom Free Text */}
          {source === 'custom' && (
            <div>
              <label className="block text-xs font-semibold text-[#3E2C23] mb-1">
                Titre du repas
              </label>
              <input
                type="text"
                autoFocus
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Ex: Restes, Resto chez Paul, Pique-nique..."
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white border border-[#E8DDD2] focus:outline-none focus:ring-2 focus:ring-[#C65D3B] text-[#3E2C23]"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {['Restes du frigo', 'Resto en amoureux', 'Pizzas & film', 'Salade rapide', 'Brunch dominical'].map((sugg) => (
                  <button
                    key={sugg}
                    type="button"
                    onClick={() => setTitle(sugg)}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-[#FBF6EE] border border-[#E8DDD2] text-[#7E6F65] hover:bg-[#E8DDD2]"
                  >
                    {sugg}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Source = Past Meals */}
          {source === 'past' && (
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7E6F65]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher dans les repas passés..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-[#E8DDD2] focus:outline-none focus:ring-2 focus:ring-[#C65D3B] text-[#3E2C23]"
                />
              </div>

              {title && (
                <div className="p-2 rounded-xl bg-[#EFF3ED] border border-[#C8D6C0] text-xs font-semibold text-[#4A633F]">
                  ✓ Repas sélectionné : {title}
                </div>
              )}

              <div className="max-h-44 overflow-y-auto divide-y divide-[#E8DDD2]/60 border border-[#E8DDD2] rounded-xl bg-white">
                {uniquePastMeals.length === 0 ? (
                  <div className="p-4 text-center text-xs text-[#7E6F65]">
                    Aucun repas passé trouvé
                  </div>
                ) : (
                  uniquePastMeals.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => handleSelectPastMeal(m)}
                      className="p-2.5 flex items-center justify-between cursor-pointer hover:bg-[#FBF6EE] transition text-xs text-[#3E2C23]"
                    >
                      <div>
                        <div className="font-medium">{m.title}</div>
                        <div className="text-[10px] text-[#7E6F65]">
                          Cuisiné le {formatFrenchDate(m.date)} ({m.slot})
                        </div>
                      </div>
                      <span className="text-[11px] text-[#C65D3B] font-semibold">
                        Dupliquer
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold text-[#3E2C23] mb-1">
              Note (optionnel)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex: Réservation à 20h, avec une salade verte..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#E8DDD2] focus:outline-none focus:ring-2 focus:ring-[#C65D3B] text-[#3E2C23]"
            />
          </div>

          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

          {/* Actions */}
          <div className="pt-2 flex items-center gap-2">
            {editingMeal && onDelete && (
              <button
                type="button"
                onClick={() => {
                  onDelete(editingMeal.id);
                  onClose();
                }}
                className="p-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition"
                title="Supprimer ce repas"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[#E8DDD2] text-[#7E6F65] text-xs font-semibold hover:bg-[#E8DDD2]/50 transition"
            >
              Annuler
            </button>

            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-[#C65D3B] text-white text-xs font-semibold hover:bg-[#AF4F30] transition shadow-xs flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{editingMeal ? 'Enregistrer' : 'Planifier'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
