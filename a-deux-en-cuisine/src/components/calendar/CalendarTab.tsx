import React, { useState, useMemo, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  ShoppingBasket,
  Utensils,
  BookHeart,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Meal, Recipe, Slot, ShoppingItem } from '../../types';
import { SLOTS, MIN_DATE } from '../../lib/constants';
import {
  getTodayDateString,
  getMondayOfWeek,
  getWeekDates,
  addDays,
  addMonths,
  formatFrenchDate,
  formatShortFrenchDate,
  isSameDay,
} from '../../lib/utils';
import { AddMealModal } from './AddMealModal';
import { GenerateGroceryModal } from './GenerateGroceryModal';
import { RecipeModal } from '../recipes/RecipeModal';
import { EditRecipeModal } from '../recipes/EditRecipeModal';

interface CalendarTabProps {
  meals: Meal[];
  recipes: Recipe[];
  onAddMeal: (meal: Omit<Meal, 'id' | 'created_at'>) => void;
  onUpdateMeal: (id: string, updates: Partial<Meal>) => void;
  onDeleteMeal: (id: string) => void;
  onAddIngredientsToShopping: (items: Array<Omit<ShoppingItem, 'id' | 'created_at'>>) => void;
  onUpdateRecipe: (
    id: string,
    recipe: Partial<Recipe>,
    ingredients?: Array<{ name: string; quantity: number | null; unit: string | null; aisle: any }>
  ) => void;
  onDeleteRecipe: (id: string) => void;
  shoppingItems: ShoppingItem[];
  /** Recette à planifier, envoyée depuis l'onglet Recettes */
  planRequest?: Recipe | null;
  onPlanRequestHandled?: () => void;
}

export const CalendarTab: React.FC<CalendarTabProps> = ({
  meals,
  recipes,
  onAddMeal,
  onUpdateMeal,
  onDeleteMeal,
  onAddIngredientsToShopping,
  onUpdateRecipe,
  onDeleteRecipe,
  shoppingItems,
  planRequest,
  onPlanRequestHandled,
}) => {
  const today = getTodayDateString();
  // Le calendrier commence le 1er septembre 2026 : on ne s'ouvre jamais avant
  const anchorDate = today < MIN_DATE ? MIN_DATE : today;
  const initialMonday = getMondayOfWeek(anchorDate);
  const minMonth = MIN_DATE.slice(0, 7);

  const [currentMonday, setCurrentMonday] = useState(initialMonday);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [selectedMonth, setSelectedMonth] = useState(anchorDate.slice(0, 7));

  // Recette présélectionnée dans le formulaire « Planifier un repas »
  const [presetRecipe, setPresetRecipe] = useState<Recipe | null>(null);
  // Modification d'une recette depuis le calendrier
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

  // Modals state
  const [isAddMealOpen, setIsAddMealOpen] = useState(false);
  const [modalDate, setModalDate] = useState(today);
  const [modalSlot, setModalSlot] = useState<Slot>('midi');
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);

  // Recipe view modal (when tapping a recipe meal)
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);
  const [viewingLinkedMeal, setViewingLinkedMeal] = useState<Meal | null>(null);

  // Grocery generation modal
  const [isGenerateGroceryOpen, setIsGenerateGroceryOpen] = useState(false);

  // Week dates
  const weekDates = useMemo(() => getWeekDates(currentMonday), [currentMonday]);
  const weekSunday = weekDates[6];

  // Disable "Previous" button if the previous week ends before 2026-09-01
  const prevWeekMonday = addDays(currentMonday, -7);
  const prevWeekSunday = addDays(prevWeekMonday, 6);
  const canGoPrevWeek = prevWeekSunday >= MIN_DATE;

  // Recipe map for quick lookup
  const recipeMap = useMemo(() => {
    const map = new Map<string, Recipe>();
    for (const r of recipes) {
      map.set(r.id, r);
    }
    return map;
  }, [recipes]);

  // Group meals by date and slot
  const mealsByDateAndSlot = useMemo(() => {
    const map = new Map<string, Meal[]>();
    for (const m of meals) {
      const key = `${m.date}__${m.slot}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return map;
  }, [meals]);

  // Repas par jour (vue mois), triés matin → midi → soir
  const mealsByDate = useMemo(() => {
    const order: Record<Slot, number> = { matin: 0, midi: 1, soir: 2 };
    const map = new Map<string, Meal[]>();
    for (const m of meals) {
      if (!map.has(m.date)) map.set(m.date, []);
      map.get(m.date)!.push(m);
    }
    for (const list of map.values()) list.sort((a, b) => order[a.slot] - order[b.slot]);
    return map;
  }, [meals]);

  // Find past meals for inspiration / duplication
  const pastMeals = useMemo(() => {
    return meals
      .filter((m) => m.date < today)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [meals, today]);

  // Ingredients for the displayed week (from today onwards)
  const weekUpcomingIngredients = useMemo(() => {
    const ings: any[] = [];
    for (const date of weekDates) {
      if (date >= today) {
        for (const s of SLOTS) {
          const list = mealsByDateAndSlot.get(`${date}__${s.id}`) || [];
          for (const m of list) {
            if (m.recipe_id && recipeMap.has(m.recipe_id)) {
              const r = recipeMap.get(m.recipe_id)!;
              if (r.ingredients) {
                ings.push(...r.ingredients);
              }
            }
          }
        }
      }
    }
    return ings;
  }, [weekDates, today, mealsByDateAndSlot, recipeMap]);

  const handleOpenAdd = (date: string, slot: Slot, recipe: Recipe | null = null) => {
    setModalDate(date < MIN_DATE ? MIN_DATE : date);
    setModalSlot(slot);
    setEditingMeal(null);
    setPresetRecipe(recipe);
    setIsAddMealOpen(true);
  };

  // « Planifier ce repas » depuis l'onglet Recettes : on ouvre le formulaire avec la recette choisie
  useEffect(() => {
    if (planRequest) {
      handleOpenAdd(anchorDate, 'soir', planRequest);
      onPlanRequestHandled?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planRequest]);

  const handleMealClick = (meal: Meal) => {
    if (meal.recipe_id && recipeMap.has(meal.recipe_id)) {
      setViewingRecipe(recipeMap.get(meal.recipe_id)!);
      setViewingLinkedMeal(meal);
    } else {
      setEditingMeal(meal);
      setModalDate(meal.date);
      setModalSlot(meal.slot);
      setIsAddMealOpen(true);
    }
  };

  // Grille du mois : cases vides avant le 1er pour aligner sur le bon jour de la semaine (lundi en premier)
  const monthCells = useMemo(() => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const firstWeekday = (new Date(y, m - 1, 1).getDay() + 6) % 7; // 0 = lundi
    const daysInMonth = new Date(y, m, 0).getDate();
    const cells: (string | null)[] = Array(firstWeekday).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(`${selectedMonth}-${String(d).padStart(2, '0')}`);
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [selectedMonth]);

  const openWeekOf = (dateStr: string) => {
    setCurrentMonday(getMondayOfWeek(dateStr));
    setViewMode('week');
  };

  return (
    <div className="pb-28 max-w-2xl mx-auto px-4 pt-3 space-y-4">
      {/* Top Header & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-serif font-bold text-[#3E2C23]">
            Planning des Repas
          </h2>
          <p className="text-xs text-[#7E6F65]">
            Historique & organisation des déjeuners et dîners
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Switch Semaine / Mois */}
          <div className="bg-[#FFFDF9] border border-[#E8DDD2] p-1 rounded-xl flex gap-1">
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                viewMode === 'week'
                  ? 'bg-[#C65D3B] text-white shadow-xs'
                  : 'text-[#7E6F65] hover:text-[#3E2C23]'
              }`}
            >
              Semaine
            </button>
            <button
              onClick={() => {
                setSelectedMonth(currentMonday < MIN_DATE ? minMonth : addDays(currentMonday, 3).slice(0, 7));
                setViewMode('month');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                viewMode === 'month'
                  ? 'bg-[#C65D3B] text-white shadow-xs'
                  : 'text-[#7E6F65] hover:text-[#3E2C23]'
              }`}
            >
              Mois
            </button>
          </div>

          {/* Bouton Générer les courses */}
          <button
            onClick={() => setIsGenerateGroceryOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#7A8B69] hover:bg-[#627252] text-white text-xs font-semibold shadow-xs transition active:scale-95"
            title="Générer les courses à partir des recettes planifiées"
          >
            <ShoppingBasket className="w-4 h-4" />
            <span>Générer les courses</span>
          </button>
        </div>
      </div>

      {/* Week Navigator */}
      {viewMode === 'week' ? (
        <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8DDD2] p-3 shadow-xs flex items-center justify-between">
          <button
            disabled={!canGoPrevWeek}
            onClick={() => setCurrentMonday(addDays(currentMonday, -7))}
            className="p-2 rounded-xl text-[#7E6F65] hover:text-[#3E2C23] hover:bg-[#FBF6EE] disabled:opacity-30 disabled:hover:bg-transparent transition"
            title={canGoPrevWeek ? 'Semaine précédente' : 'Début au 1er septembre 2026'}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center">
            <h3 className="text-xs sm:text-sm font-serif font-bold text-[#3E2C23]">
              Semaine du {formatShortFrenchDate(currentMonday)} au {formatShortFrenchDate(weekSunday)}
            </h3>
            {currentMonday !== initialMonday && (
              <button
                onClick={() => setCurrentMonday(initialMonday)}
                className="text-[11px] text-[#C65D3B] font-semibold hover:underline mt-0.5 inline-block"
              >
                Revenir à cette semaine
              </button>
            )}
          </div>

          <button
            onClick={() => setCurrentMonday(addDays(currentMonday, 7))}
            className="p-2 rounded-xl text-[#7E6F65] hover:text-[#3E2C23] hover:bg-[#FBF6EE] transition"
            title="Semaine suivante"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      ) : (
        /* Month Selector */
        <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8DDD2] p-3 shadow-xs flex items-center justify-between">
          <button
            disabled={selectedMonth <= minMonth}
            onClick={() => setSelectedMonth(addMonths(selectedMonth, -1))}
            className="p-2 rounded-xl text-[#7E6F65] hover:text-[#3E2C23] disabled:opacity-30"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center font-serif font-bold text-sm text-[#3E2C23] capitalize">
            {new Date(Number(selectedMonth.split('-')[0]), Number(selectedMonth.split('-')[1]) - 1).toLocaleDateString('fr-FR', {
              month: 'long',
              year: 'numeric',
            })}
          </div>

          <button
            onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
            className="p-2 rounded-xl text-[#7E6F65] hover:text-[#3E2C23]"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* VUE SEMAINE (Default) */}
      {viewMode === 'week' && (
        <div className="space-y-3.5">
          {weekDates.filter((d) => d >= MIN_DATE).map((dateStr) => {
            const isToday = isSameDay(dateStr, today);
            const isPast = dateStr < today;

            return (
              <div
                key={dateStr}
                className={`rounded-2xl border transition-all ${
                  isToday
                    ? 'bg-[#FFFDF9] border-[#C65D3B] shadow-md shadow-[#C65D3B]/5 ring-1 ring-[#C65D3B]'
                    : isPast
                    ? 'bg-[#FFFDF9]/70 border-[#E8DDD2]'
                    : 'bg-[#FFFDF9] border-[#E8DDD2]'
                }`}
              >
                {/* Day Header */}
                <div
                  className={`px-4 py-2 rounded-t-2xl flex items-center justify-between border-b ${
                    isToday
                      ? 'bg-[#F9EDE8] border-[#C65D3B]/20 text-[#C65D3B]'
                      : 'bg-[#FBF6EE]/60 border-[#E8DDD2]/60 text-[#3E2C23]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-serif font-bold">
                      {formatFrenchDate(dateStr)}
                    </span>
                    {isToday && (
                      <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-[#C65D3B] text-white">
                        Aujourd'hui
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-[#7E6F65] italic">
                    {isPast ? 'Historique' : 'À venir'}
                  </span>
                </div>

                {/* Slots: Matin, Midi, Soir */}
                <div className="divide-y divide-[#E8DDD2]/50 p-2 sm:p-3 space-y-2 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-2 sm:divide-y-0">
                  {SLOTS.map((slot) => {
                    const slotMeals = mealsByDateAndSlot.get(`${dateStr}__${slot.id}`) || [];

                    return (
                      <div
                        key={slot.id}
                        className="bg-[#FBF6EE]/50 rounded-xl p-2 border border-[#E8DDD2]/40 flex flex-col justify-between min-h-[90px]"
                      >
                        {/* Slot label & quick add */}
                        <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-[#E8DDD2]/40">
                          <span className="text-[11px] font-semibold text-[#7E6F65] flex items-center gap-1">
                            <span>{slot.emoji}</span>
                            <span>{slot.label}</span>
                          </span>

                          <button
                            onClick={() => handleOpenAdd(dateStr, slot.id)}
                            className="p-1 rounded-md text-[#7E6F65] hover:text-[#C65D3B] hover:bg-white transition"
                            title={`Ajouter un repas le ${slot.label}`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Meals List inside slot */}
                        <div className="space-y-1.5 flex-1">
                          {slotMeals.map((meal) => {
                            const isRecipe = Boolean(meal.recipe_id);

                            return (
                              <div
                                key={meal.id}
                                onClick={() => handleMealClick(meal)}
                                className={`p-2 rounded-lg cursor-pointer transition text-xs shadow-2xs select-none ${
                                  isRecipe
                                    ? 'bg-white border border-[#C8D6C0] text-[#3E2C23] hover:border-[#7A8B69]'
                                    : 'bg-white border border-[#E8DDD2] text-[#3E2C23] hover:border-[#C65D3B]'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-1">
                                  <span className="font-semibold text-xs leading-snug line-clamp-2">
                                    {meal.title}
                                  </span>
                                  {isRecipe && (
                                    <span className="text-[10px] text-[#7A8B69] shrink-0" title="Recette liée">
                                      🍲
                                    </span>
                                  )}
                                </div>
                                {meal.note && (
                                  <p className="text-[10px] text-[#7E6F65] mt-0.5 truncate italic">
                                    {meal.note}
                                  </p>
                                )}
                              </div>
                            );
                          })}

                          {slotMeals.length === 0 && (
                            <button
                              onClick={() => handleOpenAdd(dateStr, slot.id)}
                              className="w-full h-10 border border-dashed border-[#E8DDD2] rounded-lg flex items-center justify-center text-[11px] text-[#7E6F65]/60 hover:text-[#C65D3B] hover:border-[#C65D3B]/40 transition group"
                            >
                              <span className="group-hover:scale-105 transition-transform">+ Prévoir</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VUE MOIS (Optionnelle) */}
      {viewMode === 'month' && (
        <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8DDD2] p-2 sm:p-4 shadow-xs space-y-2">
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-[#7E6F65] pb-2 border-b border-[#E8DDD2]">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {monthCells.map((dateStr, idx) => {
              if (!dateStr) return <div key={`empty-${idx}`} className="min-h-[64px]" />;

              const isBeforeStart = dateStr < MIN_DATE;
              const dayMeals = mealsByDate.get(dateStr) || [];
              const isToday = isSameDay(dateStr, today);
              const dayNumber = Number(dateStr.slice(8, 10));

              return (
                <button
                  key={dateStr}
                  type="button"
                  disabled={isBeforeStart}
                  onClick={() => openWeekOf(dateStr)}
                  title={formatFrenchDate(dateStr)}
                  className={`min-h-[64px] p-1 rounded-lg border text-left flex flex-col gap-0.5 transition overflow-hidden ${
                    isBeforeStart
                      ? 'opacity-30 border-transparent cursor-default'
                      : isToday
                      ? 'bg-[#F9EDE8] border-[#C65D3B]'
                      : 'bg-[#FBF6EE]/40 border-[#E8DDD2] hover:border-[#C65D3B]/50'
                  }`}
                >
                  <span className={`text-[11px] font-bold ${isToday ? 'text-[#C65D3B]' : 'text-[#3E2C23]'}`}>
                    {dayNumber}
                  </span>
                  {dayMeals.slice(0, 3).map((m) => (
                    <span
                      key={m.id}
                      className={`block w-full truncate text-[9px] leading-tight px-1 py-0.5 rounded ${
                        m.recipe_id ? 'bg-[#EFF3ED] text-[#4A633F]' : 'bg-white text-[#3E2C23]'
                      }`}
                    >
                      {m.title}
                    </span>
                  ))}
                  {dayMeals.length > 3 && (
                    <span className="text-[9px] text-[#7E6F65]">+{dayMeals.length - 3}</span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-[#7E6F65] italic text-center pt-1">
            Touchez un jour pour ouvrir sa semaine.
          </p>
        </div>
      )}

      {/* Modals */}
      <AddMealModal
        isOpen={isAddMealOpen}
        onClose={() => {
          setIsAddMealOpen(false);
          setEditingMeal(null);
          setPresetRecipe(null);
        }}
        presetRecipe={presetRecipe}
        recipes={recipes}
        pastMeals={pastMeals}
        defaultDate={modalDate}
        defaultSlot={modalSlot}
        editingMeal={editingMeal}
        onSave={(data) => {
          if (editingMeal) {
            onUpdateMeal(editingMeal.id, data);
          } else {
            onAddMeal(data);
          }
        }}
        onDelete={onDeleteMeal}
      />

      <GenerateGroceryModal
        isOpen={isGenerateGroceryOpen}
        onClose={() => setIsGenerateGroceryOpen(false)}
        title="Générer les courses de la semaine"
        subtitle="Ingrédients de toutes les recettes prévues à partir d'aujourd'hui"
        ingredients={weekUpcomingIngredients}
        onConfirmAdd={onAddIngredientsToShopping}
        existingItems={shoppingItems}
      />

      {/* Recipe Modal when clicking on recipe in calendar */}
      <RecipeModal
        recipe={viewingRecipe}
        isOpen={Boolean(viewingRecipe)}
        onClose={() => {
          setViewingRecipe(null);
          setViewingLinkedMeal(null);
        }}
        meals={meals}
        onPlanMeal={(recipe) => {
          setViewingRecipe(null);
          setViewingLinkedMeal(null);
          handleOpenAdd(anchorDate, 'soir', recipe);
        }}
        onEditRecipe={(recipe) => {
          setViewingRecipe(null);
          setViewingLinkedMeal(null);
          setEditingRecipe(recipe);
        }}
        onDeleteRecipe={(id) => {
          // La confirmation est affichée par RecipeModal avant d'arriver ici
          onDeleteRecipe(id);
          setViewingRecipe(null);
          setViewingLinkedMeal(null);
        }}
        onAddIngredientsToShopping={onAddIngredientsToShopping}
        shoppingItems={shoppingItems}
        linkedMeal={viewingLinkedMeal}
        onEditLinkedMeal={(meal) => {
          setViewingRecipe(null);
          setEditingMeal(meal);
          setModalDate(meal.date);
          setModalSlot(meal.slot);
          setIsAddMealOpen(true);
        }}
        onDeleteLinkedMeal={onDeleteMeal}
      />

      {/* Modification d'une recette ouverte depuis le calendrier */}
      <EditRecipeModal
        isOpen={Boolean(editingRecipe)}
        onClose={() => setEditingRecipe(null)}
        editingRecipe={editingRecipe}
        onSave={(data, ingredients) => {
          if (editingRecipe) onUpdateRecipe(editingRecipe.id, data, ingredients);
        }}
      />
    </div>
  );
};
