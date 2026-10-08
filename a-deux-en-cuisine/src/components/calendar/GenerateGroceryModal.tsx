import React, { useState, useMemo } from 'react';
import { X, Check, ShoppingBasket, CheckSquare, Square } from 'lucide-react';
import { RecipeIngredient, ShoppingItem, Aisle } from '../../types';
import { consolidateIngredients, ingredientKey } from '../../lib/utils';
import { useAisles, groupByAisle } from '../../lib/aisles';

interface GenerateGroceryModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  ingredients: RecipeIngredient[];
  onConfirmAdd: (items: Array<Omit<ShoppingItem, 'id' | 'created_at'>>) => void;
  /** Liste de courses actuelle, pour ne pas ajouter deux fois le même article */
  existingItems?: ShoppingItem[];
}

const nameKey = ingredientKey;

export const GenerateGroceryModal: React.FC<GenerateGroceryModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  ingredients,
  onConfirmAdd,
  existingItems = [],
}) => {
  const aisles = useAisles();
  const consolidated = useMemo(() => consolidateIngredients(ingredients), [ingredients]);

  // Articles déjà présents (non cochés) dans la liste de courses
  const alreadyInList = useMemo(() => {
    const keys = new Set(existingItems.filter((i) => !i.checked).map((i) => nameKey(i.name)));
    const result = new Set<string>();
    for (const item of consolidated) {
      if (keys.has(nameKey(item.name))) result.add(item.id);
    }
    return result;
  }, [existingItems, consolidated]);

  // Map of selected ingredient keys
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});

  // À l'ouverture : tout est coché, sauf ce qui est déjà dans la liste de courses
  React.useEffect(() => {
    if (isOpen) {
      const initial: Record<string, boolean> = {};
      for (const item of consolidated) {
        initial[item.id] = !alreadyInList.has(item.id);
      }
      setSelectedIds(initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, consolidated]);

  if (!isOpen) return null;

  const toggleItem = (id: string) => {
    setSelectedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const selectAll = () => {
    const next: Record<string, boolean> = {};
    for (const item of consolidated) {
      next[item.id] = true;
    }
    setSelectedIds(next);
  };

  const deselectAll = () => {
    const next: Record<string, boolean> = {};
    for (const item of consolidated) {
      next[item.id] = false;
    }
    setSelectedIds(next);
  };

  const selectedCount = Object.values(selectedIds).filter(Boolean).length;

  const handleConfirm = () => {
    const itemsToAdd: Array<Omit<ShoppingItem, 'id' | 'created_at'>> = consolidated
      .filter((item) => selectedIds[item.id])
      .map((item) => ({
        name: item.name,
        quantity: item.quantityStr,
        aisle: item.aisle,
        note: item.count > 1 ? `Requis pour ${item.count} repas` : '',
        checked: false,
        recipe_id: null,
      }));

    onConfirmAdd(itemsToAdd);
    onClose();
  };

  // Group consolidated ingredients by aisle
  const groupedByAisle = groupByAisle(consolidated, aisles);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/45 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-[#FFFDF9] rounded-2xl border border-[#E8DDD2] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in-50 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E8DDD2] bg-[#FBF6EE] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#7A8B69] text-white flex items-center justify-center">
              <ShoppingBasket className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-[#3E2C23]">
                {title}
              </h2>
              {subtitle && <p className="text-xs text-[#7E6F65]">{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#7E6F65] hover:text-[#3E2C23] hover:bg-[#E8DDD2]/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instructions banner */}
        <div className="px-5 py-2.5 bg-[#EFF3ED] border-b border-[#C8D6C0] text-xs text-[#4A633F] flex items-center justify-between">
          <span>Décochez ce que vous avez déjà dans vos placards :</span>
          <div className="flex gap-2 font-medium">
            <button
              type="button"
              onClick={selectAll}
              className="hover:underline text-[11px]"
            >
              Tout cocher
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={deselectAll}
              className="hover:underline text-[11px]"
            >
              Tout décocher
            </button>
          </div>
        </div>

        {/* Ingredient list */}
        <div className="p-4 overflow-y-auto space-y-4">
          {consolidated.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#7E6F65]">
              Aucun ingrédient à ajouter. Vérifiez que des recettes sont planifiées !
            </div>
          ) : (
            groupedByAisle.map(({ aisle, items }) => (
              <div
                key={aisle}
                className="bg-white rounded-xl border border-[#E8DDD2] overflow-hidden"
              >
                <div className="px-3.5 py-1.5 bg-[#FBF6EE] border-b border-[#E8DDD2] text-[11px] font-bold uppercase tracking-wider text-[#7E6F65]">
                  {aisle}
                </div>
                <div className="divide-y divide-[#E8DDD2]/40">
                  {items.map((item) => {
                    const isChecked = Boolean(selectedIds[item.id]);

                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleItem(item.id)}
                        className={`flex items-center justify-between px-3.5 py-2.5 cursor-pointer transition select-none ${
                          isChecked ? 'hover:bg-[#FBF6EE]/40' : 'bg-stone-50/60 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            className="text-[#7A8B69] shrink-0"
                          >
                            {isChecked ? (
                              <CheckSquare className="w-5 h-5 fill-[#EFF3ED]" />
                            ) : (
                              <Square className="w-5 h-5 text-[#C4B5A5]" />
                            )}
                          </button>
                          <span className="flex flex-col">
                            <span
                              className={`text-xs font-medium ${
                                isChecked ? 'text-[#3E2C23]' : 'text-[#7E6F65] line-through'
                              }`}
                            >
                              {item.name}
                            </span>
                            {alreadyInList.has(item.id) && (
                              <span className="text-[10px] font-semibold text-[#7A8B69] no-underline">
                                Déjà dans la liste
                              </span>
                            )}
                          </span>
                        </div>

                        {item.quantityStr && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#F9EDE8] text-[#C65D3B] shrink-0 ml-2">
                            {item.quantityStr}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#E8DDD2] bg-[#FBF6EE] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-[#E8DDD2] text-[#7E6F65] text-xs font-semibold hover:bg-[#E8DDD2]/50 transition"
          >
            Annuler
          </button>

          <button
            type="button"
            disabled={selectedCount === 0}
            onClick={handleConfirm}
            className="flex-1 py-2.5 rounded-xl bg-[#C65D3B] text-white text-xs font-semibold hover:bg-[#AF4F30] transition shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-40"
          >
            <Check className="w-4 h-4" />
            <span>Ajouter {selectedCount} article{selectedCount > 1 ? 's' : ''} aux courses</span>
          </button>
        </div>
      </div>
    </div>
  );
};
