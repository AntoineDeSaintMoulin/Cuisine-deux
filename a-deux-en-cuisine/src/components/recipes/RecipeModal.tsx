import React, { useState } from 'react';
import { X, Calendar, ShoppingBasket, Edit, Trash2, Clock, Check, ChefHat, Sparkles } from 'lucide-react';
import { Recipe, Meal, RecipeIngredient, ShoppingItem } from '../../types';
import { formatFrenchDate, getTodayDateString } from '../../lib/utils';
import { GenerateGroceryModal } from '../calendar/GenerateGroceryModal';

interface RecipeModalProps {
  recipe: Recipe | null;
  isOpen: boolean;
  onClose: () => void;
  meals: Meal[];
  onPlanMeal: (recipe: Recipe) => void;
  onEditRecipe: (recipe: Recipe) => void;
  onDeleteRecipe: (id: string) => void;
  onAddIngredientsToShopping: (items: Array<Omit<ShoppingItem, 'id' | 'created_at'>>) => void;
  linkedMeal?: Meal | null;
  onEditLinkedMeal?: (meal: Meal) => void;
  onDeleteLinkedMeal?: (mealId: string) => void;
  shoppingItems?: ShoppingItem[];
}

export const RecipeModal: React.FC<RecipeModalProps> = ({
  recipe,
  isOpen,
  onClose,
  meals,
  onPlanMeal,
  onEditRecipe,
  onDeleteRecipe,
  onAddIngredientsToShopping,
  linkedMeal,
  onEditLinkedMeal,
  onDeleteLinkedMeal,
  shoppingItems = [],
}) => {
  const [isGroceryModalOpen, setIsGroceryModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen || !recipe) return null;

  // Dates où la recette a été cuisinée (passé) et dates où elle est prévue (futur)
  const today = getTodayDateString();
  const recipeMeals = meals.filter((m) => m.recipe_id === recipe.id);
  const cookedDates = recipeMeals
    .filter((m) => m.date <= today)
    .sort((a, b) => b.date.localeCompare(a.date));
  const plannedDates = recipeMeals
    .filter((m) => m.date > today)
    .sort((a, b) => a.date.localeCompare(b.date));

  // Parse instruction steps
  const steps = recipe.instructions
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/45 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-[#FFFDF9] rounded-2xl border border-[#E8DDD2] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        {/* Header with warm cookbook aesthetic */}
        <div className="relative px-6 pt-6 pb-4 border-b border-[#E8DDD2] bg-[#FBF6EE]">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-[#7E6F65] hover:text-[#3E2C23] hover:bg-[#E8DDD2]/50 transition"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {recipe.tags.map((tag) => (
              <span
                key={tag}
                className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#E8DDD2]/60 text-[#3E2C23]"
              >
                {tag}
              </span>
            ))}
          </div>

          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#3E2C23] pr-8 leading-snug">
            {recipe.name}
          </h2>

          {/* Linked Meal Notice (if opened from calendar) */}
          {linkedMeal && (
            <div className="mt-2.5 p-2.5 rounded-xl bg-[#EFF3ED] border border-[#C8D6C0] flex items-center justify-between text-xs">
              <span className="text-[#4A633F]">
                📅 Planifié pour le <strong>{formatFrenchDate(linkedMeal.date)} ({linkedMeal.slot})</strong>
                {linkedMeal.note ? ` • ${linkedMeal.note}` : ''}
              </span>
              <div className="flex gap-1.5 shrink-0 ml-2">
                {onEditLinkedMeal && (
                  <button
                    onClick={() => onEditLinkedMeal(linkedMeal)}
                    className="px-2 py-0.5 rounded bg-white text-[#4A633F] font-semibold hover:bg-[#E3EBE0]"
                  >
                    Modifier le repas
                  </button>
                )}
                {onDeleteLinkedMeal && (
                  <button
                    onClick={() => {
                      onDeleteLinkedMeal(linkedMeal.id);
                      onClose();
                    }}
                    className="px-2 py-0.5 rounded bg-white text-red-600 font-semibold hover:bg-red-50"
                  >
                    Retirer du jour
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-[#3E2C23]">
          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => setIsGroceryModalOpen(true)}
              className="py-2.5 px-3 rounded-xl bg-[#7A8B69] hover:bg-[#627252] text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition active:scale-95"
            >
              <ShoppingBasket className="w-4 h-4" />
              <span>Courses ({recipe.ingredients?.length || 0})</span>
            </button>

            <button
              onClick={() => onPlanMeal(recipe)}
              className="py-2.5 px-3 rounded-xl bg-[#C65D3B] hover:bg-[#AF4F30] text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition active:scale-95"
            >
              <Calendar className="w-4 h-4" />
              <span>Planifier au calendrier</span>
            </button>
          </div>

          {/* Ingredients list */}
          <div>
            <h3 className="font-serif font-bold text-base text-[#3E2C23] mb-3 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C65D3B]" />
              Ingrédients requis
            </h3>

            {(!recipe.ingredients || recipe.ingredients.length === 0) ? (
              <p className="text-xs text-[#7E6F65] italic">
                Aucun ingrédient répertorié pour cette recette.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {recipe.ingredients.map((ing) => (
                  <div
                    key={ing.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#FBF6EE]/70 border border-[#E8DDD2]/80 text-xs"
                  >
                    <span className="font-medium text-[#3E2C23]">{ing.name}</span>
                    <span className="font-bold text-[#C65D3B] bg-[#F9EDE8] px-2 py-0.5 rounded-md text-[11px] shrink-0 ml-2">
                      {ing.quantity ? `${ing.quantity} ` : ''}{ing.unit || ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Steps / Instructions */}
          <div>
            <h3 className="font-serif font-bold text-base text-[#3E2C23] mb-3 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#7A8B69]" />
              Préparation & cuisson
            </h3>

            <div className="space-y-3">
              {steps.map((step, idx) => (
                <div key={idx} className="flex gap-3 text-xs leading-relaxed">
                  <span className="w-5 h-5 rounded-full bg-[#E8DDD2] text-[#3E2C23] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="flex-1 text-[#3E2C23]">{step.replace(/^\d+[\.\)]\s*/, '')}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Cooked History */}
          <div className="pt-2 border-t border-[#E8DDD2]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#7E6F65] mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Historique des festins ({cookedDates.length})
            </h4>

            {cookedDates.length === 0 ? (
              <p className="text-xs text-[#7E6F65] italic">
                Pas encore cuisinée.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {cookedDates.map((m) => (
                  <span
                    key={m.id}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-[#FBF6EE] border border-[#E8DDD2] text-[#3E2C23]"
                  >
                    {formatFrenchDate(m.date)} ({m.slot})
                  </span>
                ))}
              </div>
            )}
          </div>

          {plannedDates.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#7E6F65] mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Prévue ({plannedDates.length})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {plannedDates.map((m) => (
                  <span
                    key={m.id}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-[#EFF3ED] border border-[#C8D6C0] text-[#4A633F]"
                  >
                    {formatFrenchDate(m.date)} ({m.slot})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-3.5 border-t border-[#E8DDD2] bg-[#FBF6EE] flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => onEditRecipe(recipe)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E8DDD2] text-[#3E2C23] text-xs font-semibold hover:bg-white transition"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Modifier</span>
            </button>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Supprimer</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#E8DDD2] text-[#3E2C23] text-xs font-semibold hover:bg-[#DBCDBE] transition"
          >
            Fermer
          </button>
        </div>

        {/* Delete Confirmation Overlay */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-[#FFFDF9]/95 backdrop-blur-xs p-6 flex flex-col items-center justify-center text-center z-20">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-serif font-bold text-[#3E2C23]">
              Supprimer cette recette ?
            </h4>
            <p className="text-xs text-[#7E6F65] mt-1 max-w-xs">
              « {recipe.name} » sera retirée de votre carnet de recettes.
            </p>
            <div className="mt-5 flex gap-2.5 w-full max-w-xs">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#E8DDD2] text-xs font-semibold text-[#7E6F65]"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  onDeleteRecipe(recipe.id);
                  onClose();
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700"
              >
                Supprimer
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Nested Grocery Modal for this single recipe */}
      <GenerateGroceryModal
        isOpen={isGroceryModalOpen}
        onClose={() => setIsGroceryModalOpen(false)}
        title={`Courses pour : ${recipe.name}`}
        subtitle="Sélectionnez les ingrédients à ajouter à votre liste de courses"
        ingredients={recipe.ingredients || []}
        onConfirmAdd={onAddIngredientsToShopping}
        existingItems={shoppingItems}
      />
    </div>
  );
};
