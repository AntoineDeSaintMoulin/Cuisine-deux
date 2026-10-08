import React, { useState } from 'react';
import { TabType, Recipe } from './types';
import { useData } from './hooks/useData';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { OfflineIndicator } from './components/OfflineIndicator';
import { SupabaseSettingsModal } from './components/SupabaseSettingsModal';
import { ShoppingTab } from './components/shopping/ShoppingTab';
import { CalendarTab } from './components/calendar/CalendarTab';
import { RecipesTab } from './components/recipes/RecipesTab';
import { ManageCategoriesModal } from './components/shopping/ManageCategoriesModal';
import { AislesProvider } from './lib/aisles';

// test de déploiement antoine

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('courses');
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  // Recette à planifier : transmise au calendrier, qui ouvre le formulaire avec la recette présélectionnée  
  const [planRequest, setPlanRequest] = useState<Recipe | null>(null);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);

  const {
    aisleNames,
    aisleCategories,
    aislesTableMissing,
    addAisle,
    renameAisle,
    deleteAisle,
    moveAisle,
    recipes,
    meals,
    shoppingItems,
    isOnline,
    isSyncing,
    isSupabaseLive,
    syncError,
    pendingCount,
    lastSyncTime,
    reloadFromSupabase,
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
  } = useData();

  // Unchecked items count for bottom nav badge
  const uncheckedShoppingCount = shoppingItems.filter((i) => !i.checked).length;

  const handlePlanRecipeFromTab = (recipe: Recipe) => {
    setPlanRequest(recipe);
    setCurrentTab('calendrier');
  };

  return (
  return (
    <AislesProvider aisles={aisleNames}>
    <div className="min-h-screen bg-[#FBF6EE] text-[#3E2C23] flex flex-col selection:bg-[#C65D3B]/20 selection:text-[#C65D3B]">
      {/* Top Header */}
      <Header
        isOnline={isOnline}
        isSupabaseLive={isSupabaseLive}
        isSyncing={isSyncing}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-3xl mx-auto">
        {currentTab === 'courses' && (
          <ShoppingTab
            items={shoppingItems}
            recipes={recipes}
            onToggleItem={toggleShoppingItem}
            onAddItem={addShoppingItem}
            onUpdateItem={updateShoppingItem}
            onDeleteItem={deleteShoppingItem}
            onClearChecked={clearCheckedShoppingItems}
            onSwitchToCalendar={() => setCurrentTab('calendrier')}
            onOpenCategories={() => setIsCategoriesOpen(true)}
          />
        )}

        {currentTab === 'calendrier' && (
          <CalendarTab
            meals={meals}
            recipes={recipes}
            onAddMeal={addMeal}
            onUpdateMeal={updateMeal}
            onDeleteMeal={deleteMeal}
            onAddIngredientsToShopping={addMultipleShoppingItems}
            onUpdateRecipe={updateRecipe}
            onDeleteRecipe={deleteRecipe}
            shoppingItems={shoppingItems}
            planRequest={planRequest}
            onPlanRequestHandled={() => setPlanRequest(null)}
          />
        )}

        {currentTab === 'recettes' && (
          <RecipesTab
            recipes={recipes}
            meals={meals}
            onAddRecipe={addRecipe}
            onUpdateRecipe={updateRecipe}
            onDeleteRecipe={deleteRecipe}
            onPlanRecipe={handlePlanRecipeFromTab}
            onAddIngredientsToShopping={addMultipleShoppingItems}
            shoppingItems={shoppingItems}
          />
        )}
      </main>

      {/* Discrete Offline Indicator */}
      <OfflineIndicator
        isOnline={isOnline}
        pendingCount={pendingCount}
        syncError={syncError}
        onRetry={reloadFromSupabase}
      />

      {/* Supabase Realtime & Config Drawer Modal */}
      <SupabaseSettingsModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        isOnline={isOnline}
        isSupabaseLive={isSupabaseLive}
        isSyncing={isSyncing}
        syncError={syncError}
        lastSyncTime={lastSyncTime}
        onRefresh={reloadFromSupabase}
      />

      {/* Gestion des catégories d'aliments */}
      <ManageCategoriesModal
        isOpen={isCategoriesOpen}
        onClose={() => setIsCategoriesOpen(false)}
        aisleNames={aisleNames}
        aisleCategories={aisleCategories}
        tableMissing={aislesTableMissing}
        shoppingItems={shoppingItems}
        recipes={recipes}
        onAdd={addAisle}
        onRename={renameAisle}
        onDelete={deleteAisle}
        onMove={moveAisle}
      />

      {/* Fixed Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onChangeTab={setCurrentTab}
        shoppingItemsCount={uncheckedShoppingCount}
      />
    </div>
    </AislesProvider>
  );
}
