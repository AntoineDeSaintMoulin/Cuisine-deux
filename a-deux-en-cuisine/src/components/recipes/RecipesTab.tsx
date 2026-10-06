import React, { useState, useMemo } from 'react';
import { Search, Plus, Sparkles, Clock, Flame, BookHeart, ChefHat, Tag, X } from 'lucide-react';
import { Recipe, Meal, ShoppingItem } from '../../types';
import { SUGGESTED_TAGS } from '../../lib/constants';
import { searchMatches, getTodayDateString, oneMonthBefore, formatFrenchDate } from '../../lib/utils';
import { RecipeModal } from './RecipeModal';
import { EditRecipeModal } from './EditRecipeModal';

interface RecipesTabProps {
  recipes: Recipe[];
  meals: Meal[];
  onAddRecipe: (
    recipe: { name: string; instructions: string; tags: string[] },
    ingredients: Array<{ name: string; quantity: number | null; unit: string | null; aisle: any }>
  ) => void;
  onUpdateRecipe: (
    id: string,
    recipe: Partial<Recipe>,
    ingredients?: Array<{ name: string; quantity: number | null; unit: string | null; aisle: any }>
  ) => void;
  onDeleteRecipe: (id: string) => void;
  onPlanRecipe: (recipe: Recipe) => void;
  onAddIngredientsToShopping: (items: Array<Omit<ShoppingItem, 'id' | 'created_at'>>) => void;
  shoppingItems: ShoppingItem[];
}

export const RecipesTab: React.FC<RecipesTabProps> = ({
  recipes,
  meals,
  onAddRecipe,
  onUpdateRecipe,
  onDeleteRecipe,
  onPlanRecipe,
  onAddIngredientsToShopping,
  shoppingItems,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Modals
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

  const today = getTodayDateString();

  // Statistiques : uniquement les repas déjà passés (aujourd'hui inclus), pas ceux planifiés
  const cookingCounts = useMemo(() => {
    const counts = new Map<string, number>();
    const latestDate = new Map<string, string>();

    for (const m of meals) {
      if (m.recipe_id && m.date <= today) {
        counts.set(m.recipe_id, (counts.get(m.recipe_id) || 0) + 1);
        const prev = latestDate.get(m.recipe_id);
        if (!prev || m.date > prev) {
          latestDate.set(m.recipe_id, m.date);
        }
      }
    }
    return { counts, latestDate };
  }, [meals, today]);

  // Section Inspiration:
  // 1. Les plus cuisinées
  const mostCookedRecipes = useMemo(() => {
    return [...recipes]
      .filter((r) => (cookingCounts.counts.get(r.id) || 0) > 0)
      .sort((a, b) => (cookingCounts.counts.get(b.id) || 0) - (cookingCounts.counts.get(a.id) || 0))
      .slice(0, 4);
  }, [recipes, cookingCounts]);

  // 2. Pas cuisinées depuis plus d'un mois
  const oneMonthAgoDate = oneMonthBefore(today);
  const forgottenRecipes = useMemo(() => {
    return recipes.filter((r) => {
      const lastCooked = cookingCounts.latestDate.get(r.id);
      return !lastCooked || lastCooked <= oneMonthAgoDate;
    }).slice(0, 4);
  }, [recipes, cookingCounts, oneMonthAgoDate]);

  // Collect all available tags across all recipes
  const allTags = useMemo(() => {
    const set = new Set<string>(SUGGESTED_TAGS as readonly string[]);
    for (const r of recipes) {
      for (const t of r.tags) {
        set.add(t);
      }
    }
    return Array.from(set);
  }, [recipes]);

  // Filtered recipes: Accent & Case Insensitive search across name, ingredients, tags
  const filteredRecipes = useMemo(() => {
    return recipes.filter((r) => {
      // Tag filter
      if (selectedTag && !r.tags.includes(selectedTag)) {
        return false;
      }

      // Search query filter
      if (!searchQuery.trim()) return true;

      const matchName = searchMatches(r.name, searchQuery);
      const matchTags = r.tags.some((t) => searchMatches(t, searchQuery));
      const matchIngredients = r.ingredients?.some((ing) => searchMatches(ing.name, searchQuery));
      return matchName || matchTags || matchIngredients;
    });
  }, [recipes, selectedTag, searchQuery]);

  return (
    <div className="pb-28 max-w-2xl mx-auto px-4 pt-3 space-y-6">
      {/* Top Title & Add Button */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-serif font-bold text-[#3E2C23]">
            Carnet de Recettes
          </h2>
          <p className="text-xs text-[#7E6F65]">
            {recipes.length} plat{recipes.length > 1 ? 's' : ''} répertorié{recipes.length > 1 ? 's' : ''} à cuisiner à deux
          </p>
        </div>

        <button
          onClick={() => {
            setEditingRecipe(null);
            setIsEditModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#C65D3B] text-white text-xs font-semibold hover:bg-[#AF4F30] transition shadow-xs active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle recette</span>
        </button>
      </div>

      {/* SECTION INSPIRATION (en haut de l'onglet) */}
      <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8DDD2] p-4 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#C65D3B]">
          <Sparkles className="w-4 h-4" />
          <span>Inspiration Culinaire</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Les plus cuisinées */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-[#3E2C23] flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-[#C65D3B]" />
              Les grands classiques du couple
            </h4>
            {mostCookedRecipes.length === 0 ? (
              <p className="text-[11px] text-[#7E6F65] italic">
                Planifiez des repas pour découvrir vos favoris !
              </p>
            ) : (
              <div className="space-y-1.5">
                {mostCookedRecipes.map((r) => {
                  const count = cookingCounts.counts.get(r.id) || 0;
                  return (
                    <div
                      key={r.id}
                      onClick={() => setViewingRecipe(r)}
                      className="p-2 rounded-xl bg-[#FBF6EE]/70 hover:bg-[#F9EDE8] border border-[#E8DDD2]/60 cursor-pointer transition flex items-center justify-between text-xs"
                    >
                      <span className="font-medium text-[#3E2C23] truncate pr-2">
                        {r.name}
                      </span>
                      <span className="text-[10px] font-bold text-[#C65D3B] bg-[#FFFDF9] px-2 py-0.5 rounded-full border border-[#E8DDD2] shrink-0">
                        {count} fois
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pas cuisinées depuis plus d'un mois */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-[#3E2C23] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#7A8B69]" />
              À redécouvrir (pas cuisinées depuis 1 mois)
            </h4>
            {forgottenRecipes.length === 0 ? (
              <p className="text-[11px] text-[#7E6F65] italic">
                Toutes vos recettes ont été cuisinées récemment !
              </p>
            ) : (
              <div className="space-y-1.5">
                {forgottenRecipes.map((r) => {
                  const last = cookingCounts.latestDate.get(r.id);
                  return (
                    <div
                      key={r.id}
                      onClick={() => setViewingRecipe(r)}
                      className="p-2 rounded-xl bg-[#FBF6EE]/70 hover:bg-[#EFF3ED] border border-[#E8DDD2]/60 cursor-pointer transition flex items-center justify-between text-xs"
                    >
                      <span className="font-medium text-[#3E2C23] truncate pr-2">
                        {r.name}
                      </span>
                      <span className="text-[10px] text-[#7A8B69] font-medium shrink-0">
                        {last ? formatFrenchDate(last) : 'Jamais testé'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Barre de recherche (accent & case insensitive) */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7E6F65]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par plat, ingrédient (ex: poireau, saumon, gratin)..."
            className="w-full pl-10 pr-9 py-2.5 text-xs rounded-2xl bg-[#FFFDF9] border border-[#E8DDD2] shadow-xs focus:outline-none focus:ring-2 focus:ring-[#C65D3B] text-[#3E2C23]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7E6F65] hover:text-[#3E2C23]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filtres par Tag cliquables */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
          <button
            onClick={() => setSelectedTag(null)}
            className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition ${
              selectedTag === null
                ? 'bg-[#3E2C23] text-white shadow-xs'
                : 'bg-[#FFFDF9] border border-[#E8DDD2] text-[#7E6F65] hover:bg-[#FBF6EE]'
            }`}
          >
            Tous ({recipes.length})
          </button>
          {allTags.map((tag) => {
            const isSelected = selectedTag === tag;
            const count = recipes.filter((r) => r.tags.includes(tag)).length;
            if (count === 0) return null;

            return (
              <button
                key={tag}
                onClick={() => setSelectedTag(isSelected ? null : tag)}
                className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition ${
                  isSelected
                    ? 'bg-[#C65D3B] text-white shadow-xs'
                    : 'bg-[#FFFDF9] border border-[#E8DDD2] text-[#7E6F65] hover:bg-[#FBF6EE]'
                }`}
              >
                {tag} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Liste des Recettes sous forme de cartes */}
      {filteredRecipes.length === 0 ? (
        <div className="py-12 px-6 rounded-3xl bg-[#FFFDF9] border border-[#E8DDD2] text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-[#F9EDE8] text-[#C65D3B] flex items-center justify-center mx-auto mb-4">
            <BookHeart className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-serif font-bold text-[#3E2C23]">
            {searchQuery || selectedTag
              ? 'Aucune recette ne correspond à votre recherche'
              : 'Aucune recette pour l’instant — ajoutez votre premier plat !'}
          </h3>
          <p className="mt-2 text-xs text-[#7E6F65] max-w-sm mx-auto">
            {searchQuery || selectedTag
              ? 'Essayez de réinitialiser la recherche ou de sélectionner un autre tag.'
              : 'Créez les recettes fétiches de votre couple pour planifier vos repas en un clic.'}
          </p>
          <div className="mt-5">
            {searchQuery || selectedTag ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedTag(null);
                }}
                className="px-4 py-2 rounded-xl bg-[#E8DDD2] text-[#3E2C23] text-xs font-semibold hover:bg-[#DBCDBE]"
              >
                Effacer les filtres
              </button>
            ) : (
              <button
                onClick={() => {
                  setEditingRecipe(null);
                  setIsEditModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-[#C65D3B] text-white text-xs font-semibold hover:bg-[#AF4F30] transition shadow-xs"
              >
                + Ajouter votre premier plat
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filteredRecipes.map((recipe) => {
            const count = cookingCounts.counts.get(recipe.id) || 0;
            const ingCount = recipe.ingredients?.length || 0;

            return (
              <div
                key={recipe.id}
                onClick={() => setViewingRecipe(recipe)}
                className="bg-[#FFFDF9] rounded-2xl border border-[#E8DDD2] p-4.5 hover:border-[#C65D3B]/40 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {recipe.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FBF6EE] text-[#7E6F65] border border-[#E8DDD2]/60"
                      >
                        {tag}
                      </span>
                    ))}
                    {recipe.tags.length > 3 && (
                      <span className="text-[10px] text-[#7E6F65] font-medium self-center">
                        +{recipe.tags.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-serif font-bold text-[#3E2C23] group-hover:text-[#C65D3B] transition leading-snug">
                    {recipe.name}
                  </h3>

                  {/* Preview of ingredients or instructions */}
                  <p className="text-xs text-[#7E6F65] mt-1.5 line-clamp-2 leading-relaxed">
                    {recipe.instructions.replace(/\n/g, ' ')}
                  </p>
                </div>

                {/* Card footer */}
                <div className="mt-4 pt-3 border-t border-[#E8DDD2]/50 flex items-center justify-between text-[11px] text-[#7E6F65]">
                  <span>{ingCount} ingrédient{ingCount > 1 ? 's' : ''}</span>
                  <span className="font-medium text-[#C65D3B]">
                    {count > 0 ? `Cuisiné ${count} fois` : 'Nouveau'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recipe Details Modal */}
      <RecipeModal
        recipe={viewingRecipe}
        isOpen={Boolean(viewingRecipe)}
        onClose={() => setViewingRecipe(null)}
        meals={meals}
        onPlanMeal={(recipe) => {
          setViewingRecipe(null);
          onPlanRecipe(recipe);
        }}
        onEditRecipe={(recipe) => {
          setViewingRecipe(null);
          setEditingRecipe(recipe);
          setIsEditModalOpen(true);
        }}
        onDeleteRecipe={(id) => {
          onDeleteRecipe(id);
          setViewingRecipe(null);
        }}
        onAddIngredientsToShopping={onAddIngredientsToShopping}
        shoppingItems={shoppingItems}
      />

      {/* Edit Recipe Modal */}
      <EditRecipeModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingRecipe(null);
        }}
        editingRecipe={editingRecipe}
        onSave={(data, ingredients) => {
          if (editingRecipe) {
            onUpdateRecipe(editingRecipe.id, data, ingredients);
          } else {
            onAddRecipe(data, ingredients);
          }
        }}
      />
    </div>
  );
};
