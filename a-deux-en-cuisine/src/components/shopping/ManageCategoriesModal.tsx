import React, { useState } from 'react';
import { X, Tags, ChevronUp, ChevronDown, Pencil, Trash2, Check, Plus, Lock, AlertTriangle } from 'lucide-react';
import { AisleCategory, ShoppingItem, Recipe } from '../../types';
import { FALLBACK_AISLE } from '../../lib/constants';

interface ManageCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Noms dans l'ordre affiché */
  aisleNames: string[];
  /** Lignes Supabase (vide tant que la liste par défaut n'a jamais été modifiée) */
  aisleCategories: AisleCategory[];
  tableMissing: boolean;
  shoppingItems: ShoppingItem[];
  recipes: Recipe[];
  onAdd: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
}

export const ManageCategoriesModal: React.FC<ManageCategoriesModalProps> = ({
  isOpen,
  onClose,
  aisleNames,
  aisleCategories,
  tableMissing,
  shoppingItems,
  recipes,
  onAdd,
  onRename,
  onDelete,
  onMove,
}) => {
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Identifiant d'une ligne : l'id Supabase, ou le nom tant que la liste par défaut est utilisée
  const rows = aisleNames.map((name) => ({ id: aisleCategories.find((a) => a.name === name)?.id ?? name, name }));

  const usage = (name: string) => {
    const items = shoppingItems.filter((i) => i.aisle === name).length;
    const ingredients = recipes.reduce((n, r) => n + (r.ingredients || []).filter((i) => i.aisle === name).length, 0);
    return { items, ingredients };
  };

  const nameTaken = (name: string, exceptId?: string) =>
    rows.some((r) => r.id !== exceptId && r.name.toLowerCase() === name.trim().toLowerCase());

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newName.trim();
    if (!clean) return;
    if (nameTaken(clean)) {
      setError(`La catégorie « ${clean} » existe déjà.`);
      return;
    }
    onAdd(clean);
    setNewName('');
    setError('');
  };

  const saveRename = (id: string) => {
    const clean = editingValue.trim();
    if (!clean) return;
    if (nameTaken(clean, id)) {
      setError(`La catégorie « ${clean} » existe déjà.`);
      return;
    }
    onRename(id, clean);
    setEditingId(null);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-[#FFFDF9] rounded-t-3xl sm:rounded-2xl border border-[#E8DDD2] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* En-tête */}
        <div className="px-5 py-4 border-b border-[#E8DDD2] bg-[#FBF6EE] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#7A8B69] text-white flex items-center justify-center">
              <Tags className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-[#3E2C23]">Catégories d'aliments</h2>
              <p className="text-[11px] text-[#7E6F65]">
                L'ordre ici est celui de la liste de courses : rangez-les comme le parcours du magasin.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#7E6F65] hover:text-[#3E2C23] hover:bg-[#E8DDD2]/50 transition"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {tableMissing && (
          <div className="px-5 py-2.5 bg-[#FFF4E5] border-b border-amber-200 text-[11px] text-[#7A4B12] flex gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>
              Vos modifications ne pourront pas être enregistrées tant que le script <code>supabase/schema.sql</code> n'aura
              pas été relancé dans le SQL Editor de Supabase.
            </span>
          </div>
        )}

        {/* Liste */}
        <div className="p-4 overflow-y-auto space-y-2">
          {rows.map((row, idx) => {
            const isFallback = row.name === FALLBACK_AISLE;
            const isEditing = editingId === row.id;
            const isConfirming = confirmDeleteId === row.id;
            const { items, ingredients } = usage(row.name);

            if (isConfirming) {
              return (
                <div key={row.id} className="p-3 rounded-xl border border-red-200 bg-red-50/60 text-xs space-y-2">
                  <p className="text-[#3E2C23]">
                    Supprimer <strong>« {row.name} »</strong> ?
                    {items + ingredients > 0 && (
                      <>
                        {' '}
                        {items > 0 && `${items} article${items > 1 ? 's' : ''} de la liste`}
                        {items > 0 && ingredients > 0 && ' et '}
                        {ingredients > 0 && `${ingredients} ingrédient${ingredients > 1 ? 's' : ''} de recettes`}
                        {' '}passeront dans « {FALLBACK_AISLE} ».
                      </>
                    )}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="flex-1 py-2 rounded-lg border border-[#E8DDD2] bg-white font-semibold text-[#7E6F65]"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={() => {
                        onDelete(row.id);
                        setConfirmDeleteId(null);
                      }}
                      className="flex-1 py-2 rounded-lg bg-red-600 text-white font-semibold"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={row.id}
                className="flex items-center gap-2 p-2 rounded-xl border border-[#E8DDD2] bg-white"
              >
                {/* Ordre */}
                <div className="flex flex-col shrink-0">
                  <button
                    onClick={() => onMove(row.id, -1)}
                    disabled={idx === 0}
                    className="p-1 rounded text-[#7E6F65] hover:text-[#C65D3B] disabled:opacity-20"
                    aria-label={`Monter ${row.name}`}
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onMove(row.id, 1)}
                    disabled={idx === rows.length - 1}
                    className="p-1 rounded text-[#7E6F65] hover:text-[#C65D3B] disabled:opacity-20"
                    aria-label={`Descendre ${row.name}`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Nom */}
                {isEditing ? (
                  <form
                    className="flex-1 flex items-center gap-1.5"
                    onSubmit={(e) => {
                      e.preventDefault();
                      saveRename(row.id);
                    }}
                  >
                    <input
                      autoFocus
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      className="flex-1 min-w-0 px-2.5 py-1.5 text-sm rounded-lg border border-[#E8DDD2] focus:outline-none focus:ring-2 focus:ring-[#C65D3B]"
                    />
                    <button type="submit" className="p-2 rounded-lg bg-[#C65D3B] text-white" aria-label="Enregistrer">
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="p-2 rounded-lg border border-[#E8DDD2] text-[#7E6F65]"
                      aria-label="Annuler"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </form>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-[#3E2C23] truncate">{row.name}</div>
                      <div className="text-[10px] text-[#7E6F65]">
                        {isFallback
                          ? 'Catégorie par défaut'
                          : items > 0
                          ? `${items} article${items > 1 ? 's' : ''} dans la liste`
                          : 'Aucun article en ce moment'}
                      </div>
                    </div>
                    {isFallback ? (
                      <span className="p-2 text-[#C4B5A5]" title="Cette catégorie ne peut pas être modifiée">
                        <Lock className="w-4 h-4" />
                      </span>
                    ) : (
                      <div className="flex items-center shrink-0">
                        <button
                          onClick={() => {
                            setEditingId(row.id);
                            setEditingValue(row.name);
                            setConfirmDeleteId(null);
                            setError('');
                          }}
                          className="p-2 rounded-lg text-[#7E6F65] hover:text-[#C65D3B] hover:bg-[#FBF6EE]"
                          aria-label={`Renommer ${row.name}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setConfirmDeleteId(row.id);
                            setEditingId(null);
                          }}
                          className="p-2 rounded-lg text-[#7E6F65] hover:text-red-600 hover:bg-red-50"
                          aria-label={`Supprimer ${row.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Ajout */}
        <form onSubmit={handleAdd} className="px-4 py-3 border-t border-[#E8DDD2] bg-[#FBF6EE] space-y-1.5">
          <div className="flex gap-2">
            <input
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                if (error) setError('');
              }}
              placeholder="Nouvelle catégorie (ex : Bio, Apéro, Bébé…)"
              className="flex-1 min-w-0 px-3 py-2.5 text-sm rounded-xl bg-white border border-[#E8DDD2] focus:outline-none focus:ring-2 focus:ring-[#C65D3B]"
            />
            <button
              type="submit"
              disabled={!newName.trim()}
              className="px-4 rounded-xl bg-[#C65D3B] text-white text-xs font-semibold flex items-center gap-1 disabled:opacity-40"
            >
              <Plus className="w-4 h-4" />
              Ajouter
            </button>
          </div>
          {error && <p className="text-[11px] text-red-600 font-medium">{error}</p>}
        </form>
      </div>
    </div>
  );
};
