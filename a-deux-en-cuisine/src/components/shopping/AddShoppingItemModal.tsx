import React, { useState, useEffect } from 'react';
import { X, Check, Trash2, Plus } from 'lucide-react';
import { ShoppingItem, Aisle } from '../../types';
import { AISLES } from '../../lib/constants';

interface AddShoppingItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: { name: string; quantity: string; aisle: Aisle; note: string }) => void;
  onDelete?: (id: string) => void;
  editingItem?: ShoppingItem | null;
  defaultAisle?: Aisle;
}

const QUICK_QUANTITIES = ['x1', 'x2', '500 g', '1 kg', '1 botte', '1 paquet', '1 boîte'];

export const AddShoppingItemModal: React.FC<AddShoppingItemModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editingItem,
  defaultAisle,
}) => {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [aisle, setAisle] = useState<Aisle>(defaultAisle || 'Fruits & légumes');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name);
      setQuantity(editingItem.quantity || '');
      setAisle(editingItem.aisle);
      setNote(editingItem.note || '');
    } else {
      setName('');
      setQuantity('');
      setAisle(defaultAisle || 'Fruits & légumes');
      setNote('');
    }
    setError('');
  }, [editingItem, defaultAisle, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Le nom de l'article est obligatoire");
      return;
    }
    onSave({
      name: name.trim(),
      quantity: quantity.trim(),
      aisle,
      note: note.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-[#FFFDF9] rounded-t-3xl sm:rounded-2xl border border-[#E8DDD2] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-6 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E8DDD2] flex items-center justify-between bg-[#FBF6EE]">
          <h2 className="text-base font-serif font-bold text-[#3E2C23]">
            {editingItem ? "Modifier l'article" : 'Ajouter un article aux courses'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#7E6F65] hover:text-[#3E2C23] hover:bg-[#E8DDD2]/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {/* Item Name */}
          <div>
            <label className="block text-xs font-semibold text-[#3E2C23] mb-1.5">
              Nom de l'article <span className="text-[#C65D3B]">*</span>
            </label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="Ex: Avocats mûrs, Crème fraîche..."
              className={`w-full px-3.5 py-2.5 text-sm rounded-xl bg-white border ${
                error ? 'border-red-400 ring-1 ring-red-400' : 'border-[#E8DDD2]'
              } focus:outline-none focus:ring-2 focus:ring-[#C65D3B] text-[#3E2C23]`}
            />
            {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
          </div>

          {/* Quantity & Quick Chips */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-[#3E2C23]">
                Quantité (optionnel)
              </label>
            </div>
            <input
              type="text"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Ex: 500 g, 2 pièces, 1 botte..."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white border border-[#E8DDD2] focus:outline-none focus:ring-2 focus:ring-[#C65D3B] text-[#3E2C23]"
            />
            {/* Quick shortcuts */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {QUICK_QUANTITIES.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQuantity(q)}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition active:scale-95 ${
                    quantity === q
                      ? 'bg-[#C65D3B] text-white border-[#C65D3B]'
                      : 'bg-[#FBF6EE] text-[#7E6F65] border-[#E8DDD2] hover:bg-[#E8DDD2]'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Rayon / Aisle */}
          <div>
            <label className="block text-xs font-semibold text-[#3E2C23] mb-1.5">
              Rayon du supermarché
            </label>
            <select
              value={aisle}
              onChange={(e) => setAisle(e.target.value as Aisle)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white border border-[#E8DDD2] focus:outline-none focus:ring-2 focus:ring-[#C65D3B] text-[#3E2C23]"
            >
              {AISLES.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold text-[#3E2C23] mb-1.5">
              Note pour l'autre personne (optionnel)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex: Marque bio, si pas de framboises prends myrtilles..."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white border border-[#E8DDD2] focus:outline-none focus:ring-2 focus:ring-[#C65D3B] text-[#3E2C23]"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center gap-2">
            {editingItem && onDelete && (
              <button
                type="button"
                onClick={() => {
                  onDelete(editingItem.id);
                  onClose();
                }}
                className="p-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition"
                title="Supprimer l'article"
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
              <span>{editingItem ? 'Enregistrer' : 'Ajouter'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
