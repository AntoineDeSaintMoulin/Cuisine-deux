import React, { useState, useMemo } from 'react';
import { Plus, Check, Trash2, ShoppingBasket, Edit2, Sparkles, ChevronDown, Tags } from 'lucide-react';
import { ShoppingItem, Aisle, Recipe } from '../../types';
import { useAisles, groupByAisle, defaultAisle, withCurrent } from '../../lib/aisles';
import { AddShoppingItemModal } from './AddShoppingItemModal';
import { ClearCheckedConfirmModal } from './ClearCheckedConfirmModal';

interface ShoppingTabProps {
  items: ShoppingItem[];
  recipes: Recipe[];
  onToggleItem: (id: string) => void;
  onAddItem: (item: { name: string; quantity: string; aisle: Aisle; note: string }) => void;
  onUpdateItem: (id: string, updates: Partial<ShoppingItem>) => void;
  onDeleteItem: (id: string) => void;
  onClearChecked: () => void;
  onSwitchToCalendar: () => void;
  onOpenCategories: () => void;
}

export const ShoppingTab: React.FC<ShoppingTabProps> = ({
  items,
  recipes,
  onToggleItem,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onClearChecked,
  onSwitchToCalendar,
  onOpenCategories,
}) => {
  const aisles = useAisles();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [selectedAisleForAdd, setSelectedAisleForAdd] = useState<Aisle | undefined>(undefined);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  // Quick inline add state
  const [quickName, setQuickName] = useState('');
  const [quickAisleChoice, setQuickAisle] = useState<Aisle | null>(null);
  // Si la catégorie choisie a été supprimée entre-temps, on revient à la première
  const quickAisle: Aisle = quickAisleChoice && aisles.includes(quickAisleChoice) ? quickAisleChoice : defaultAisle(aisles);

  const recipeMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of recipes) {
      map.set(r.id, r.name);
    }
    return map;
  }, [recipes]);

  // Articles regroupés par catégorie, dans l'ordre choisi par l'utilisateur
  const groupedItems = useMemo(() => {
    return groupByAisle(items, aisles).map(({ aisle, items: aisleItems }) => ({
      aisle,
      // non cochés d'abord, cochés en bas
      items: [...aisleItems].sort((a, b) => (a.checked === b.checked ? 0 : a.checked ? 1 : -1)),
    }));
  }, [items, aisles]);

  const checkedCount = useMemo(() => items.filter((i) => i.checked).length, [items]);
  const uncheckedCount = items.length - checkedCount;

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName.trim()) return;
    onAddItem({
      name: quickName.trim(),
      quantity: '',
      aisle: quickAisle,
      note: '',
    });
    setQuickName('');
  };

  const openAddForAisle = (aisle: Aisle) => {
    setSelectedAisleForAdd(aisle);
    setEditingItem(null);
    setIsAddModalOpen(true);
  };

  return (
    <div className="pb-28 max-w-2xl mx-auto px-4 pt-3">
      {/* Top Banner / Stats & Clear Action */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-[#3E2C23]">
            Liste de Courses
          </h2>
          <p className="text-xs text-[#7E6F65]">
            {items.length === 0
              ? 'Aucun article à acheter'
              : `${uncheckedCount} article${uncheckedCount > 1 ? 's' : ''} à prendre • ${checkedCount} dans le panier`}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onOpenCategories}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFFDF9] border border-[#E8DDD2] hover:bg-[#FBF6EE] text-[#3E2C23] text-xs font-semibold transition active:scale-95"
          title="Gérer les catégories d'aliments"
        >
          <Tags className="w-3.5 h-3.5 text-[#7A8B69]" />
          <span>Catégories</span>
        </button>
        {checkedCount > 0 && (
          <button
            onClick={() => setIsClearModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E8DDD2]/60 hover:bg-[#E8DDD2] text-[#3E2C23] text-xs font-semibold transition active:scale-95"
          >
            <Trash2 className="w-3.5 h-3.5 text-[#C65D3B]" />
            <span>Vider ({checkedCount})</span>
          </button>
        )}
        </div>

      {/* Quick Add Bar */}
      <form
        onSubmit={handleQuickAdd}
        className="mb-5 bg-[#FFFDF9] border border-[#E8DDD2] rounded-2xl p-2.5 shadow-sm shadow-[#3E2C23]/5 flex flex-col sm:flex-row gap-2"
      >
        <div className="flex-1 flex items-center gap-2">
          <input
            type="text"
            value={quickName}
            onChange={(e) => setQuickName(e.target.value)}
            placeholder="Ajout rapide (ex: Lait, Pain, Poireaux...)"
            className="flex-1 px-3 py-2 text-sm bg-transparent border-none focus:outline-none text-[#3E2C23] placeholder-[#7E6F65]/60"
          />
        </div>

        <div className="flex items-center gap-2 pt-1 sm:pt-0 border-t sm:border-t-0 border-[#E8DDD2]">
          <select
            value={quickAisle}
            onChange={(e) => setQuickAisle(e.target.value as Aisle)}
            className="text-xs bg-[#FBF6EE] border border-[#E8DDD2] rounded-xl px-2.5 py-2 text-[#3E2C23] focus:outline-none focus:ring-1 focus:ring-[#C65D3B]"
          >
            {withCurrent(aisles, quickAisle).map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={!quickName.trim()}
            className="h-9 px-3.5 rounded-xl bg-[#C65D3B] text-white text-xs font-semibold hover:bg-[#AF4F30] transition disabled:opacity-40 flex items-center justify-center gap-1 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden xs:inline">Ajouter</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedAisleForAdd(quickAisle);
              setEditingItem(null);
              setIsAddModalOpen(true);
            }}
            className="h-9 px-2.5 rounded-xl bg-[#FBF6EE] border border-[#E8DDD2] text-[#7E6F65] hover:text-[#3E2C23] text-xs font-medium transition shrink-0"
            title="Ajouter avec note ou quantité détaillée"
          >
            Détails
          </button>
        </div>
      </form>

      {/* Empty State */}
      {items.length === 0 ? (
        <div className="py-12 px-6 rounded-3xl bg-[#FFFDF9] border border-[#E8DDD2] text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-[#F9EDE8] text-[#C65D3B] flex items-center justify-center mx-auto mb-4">
            <ShoppingBasket className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-serif font-bold text-[#3E2C23]">
            Le panier est vide !
          </h3>
          <p className="mt-2 text-xs text-[#7E6F65] max-w-sm mx-auto leading-relaxed">
            Ajoutez vos premiers articles ci-dessus, ou planifiez vos repas dans le calendrier pour générer automatiquement la liste des ingrédients.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row justify-center gap-2.5">
            <button
              onClick={() => {
                setSelectedAisleForAdd(undefined);
                setEditingItem(null);
                setIsAddModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-[#C65D3B] text-white text-xs font-semibold hover:bg-[#AF4F30] transition shadow-xs flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Ajouter un article
            </button>
            <button
              onClick={onSwitchToCalendar}
              className="px-4 py-2.5 rounded-xl bg-[#EFF3ED] text-[#4A633F] border border-[#C8D6C0] text-xs font-semibold hover:bg-[#E3EBE0] transition flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              Planifier la semaine
            </button>
          </div>
        </div>
      ) : (
        /* Aisle Groups */
        <div className="space-y-4">
          {groupedItems.map(({ aisle, items: aisleItems }) => {
            const aisleChecked = aisleItems.filter((i) => i.checked).length;
            const aisleTotal = aisleItems.length;

            return (
              <div
                key={aisle}
                className="bg-[#FFFDF9] rounded-2xl border border-[#E8DDD2] overflow-hidden shadow-xs"
              >
                {/* Aisle Header */}
                <div className="px-4 py-2.5 bg-[#FBF6EE]/70 border-b border-[#E8DDD2]/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#C65D3B]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#3E2C23]">
                      {aisle}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[#7E6F65] font-medium">
                      {aisleChecked}/{aisleTotal}
                    </span>
                    <button
                      onClick={() => openAddForAisle(aisle)}
                      className="p-1 rounded-md text-[#7E6F65] hover:text-[#C65D3B] hover:bg-white transition"
                      title={`Ajouter un article dans ${aisle}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Items List */}
                <div className="divide-y divide-[#E8DDD2]/50">
                  {aisleItems.map((item) => {
                    const recipeTitle = item.recipe_id ? recipeMap.get(item.recipe_id) : null;

                    return (
                      <div
                        key={item.id}
                        className={`group flex items-start gap-3 px-4 py-3 transition-colors ${
                          item.checked
                            ? 'bg-[#FBF6EE]/40 text-[#7E6F65]'
                            : 'hover:bg-[#FBF6EE]/30 text-[#3E2C23]'
                        }`}
                      >
                        {/* Large Touch Checkbox (min 44px area for store ergonomics) */}
                        <button
                          type="button"
                          onClick={() => onToggleItem(item.id)}
                          aria-label={item.checked ? `Décocher ${item.name}` : `Cocher ${item.name}`}
                          className="mt-0.5 w-7 h-7 sm:w-6 sm:h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all active:scale-90"
                          style={{
                            borderColor: item.checked ? '#7A8B69' : '#C4B5A5',
                            backgroundColor: item.checked ? '#7A8B69' : '#FFFDF9',
                          }}
                        >
                          {item.checked && <Check className="w-4 h-4 text-white stroke-[3]" />}
                        </button>

                        {/* Item Details (tap to toggle or edit) */}
                        <div
                          className="flex-1 min-w-0 cursor-pointer select-none"
                          onClick={() => onToggleItem(item.id)}
                        >
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span
                              className={`text-sm font-medium transition-all ${
                                item.checked
                                  ? 'line-through text-[#7E6F65]/80'
                                  : 'text-[#3E2C23]'
                              }`}
                            >
                              {item.name}
                            </span>
                            {item.quantity && (
                              <span
                                className={`text-xs px-2 py-0.5 rounded-md font-semibold ${
                                  item.checked
                                    ? 'bg-[#E8DDD2]/50 text-[#7E6F65]/80'
                                    : 'bg-[#F9EDE8] text-[#C65D3B]'
                                }`}
                              >
                                {item.quantity}
                              </span>
                            )}
                          </div>

                          {/* Notes */}
                          {item.note && (
                            <p
                              className={`text-xs mt-0.5 italic ${
                                item.checked ? 'text-[#7E6F65]/60' : 'text-[#7E6F65]'
                              }`}
                            >
                              📝 {item.note}
                            </p>
                          )}

                          {/* Origin Recipe Pill */}
                          {recipeTitle && (
                            <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-[#7A8B69] bg-[#EFF3ED] px-1.5 py-0.5 rounded">
                              <span>🍲</span> {recipeTitle}
                            </span>
                          )}
                        </div>

                        {/* Item Actions (Edit / Delete) */}
                        <div className="flex items-center gap-1 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setEditingItem(item);
                              setIsAddModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-[#7E6F65] hover:text-[#3E2C23] hover:bg-[#E8DDD2]/50 transition"
                            title="Modifier"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteItem(item.id)}
                            className="p-1.5 rounded-lg text-[#7E6F65] hover:text-red-600 hover:bg-red-50 transition"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* Floating Action Button for Adding an Item */}
      <div className="fixed bottom-20 right-4 z-30">
        <button
          onClick={() => {
            setSelectedAisleForAdd(undefined);
            setEditingItem(null);
            setIsAddModalOpen(true);
          }}
          className="w-13 h-13 rounded-full bg-[#C65D3B] text-white shadow-lg shadow-[#C65D3B]/30 flex items-center justify-center hover:bg-[#AF4F30] transition active:scale-95"
          aria-label="Ajouter un article"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>

      {/* Modals */}
      <AddShoppingItemModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingItem(null);
        }}
        onSave={(data) => {
          if (editingItem) {
            onUpdateItem(editingItem.id, data);
          } else {
            onAddItem(data);
          }
        }}
        onDelete={onDeleteItem}
        editingItem={editingItem}
        defaultAisle={selectedAisleForAdd}
      />

      <ClearCheckedConfirmModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={onClearChecked}
        count={checkedCount}
      />
    </div>
  );
};
