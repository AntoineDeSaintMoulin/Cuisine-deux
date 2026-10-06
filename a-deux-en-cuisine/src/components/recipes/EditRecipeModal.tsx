import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Check, Tag } from 'lucide-react';
import { Recipe, RecipeIngredient, Aisle } from '../../types';
import { AISLES, SUGGESTED_TAGS } from '../../lib/constants';

interface IngredientRow {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  aisle: Aisle;
}

interface EditRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingRecipe?: Recipe | null;
  onSave: (
    recipe: { name: string; instructions: string; tags: string[] },
    ingredients: Array<{ name: string; quantity: number | null; unit: string | null; aisle: Aisle }>
  ) => void;
}

export const EditRecipeModal: React.FC<EditRecipeModalProps> = ({
  isOpen,
  onClose,
  editingRecipe,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [instructions, setInstructions] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [ingredients, setIngredients] = useState<IngredientRow[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingRecipe) {
      setName(editingRecipe.name);
      setInstructions(editingRecipe.instructions);
      setTags(editingRecipe.tags || []);
      setIngredients(
        (editingRecipe.ingredients || []).map((ing) => ({
          id: ing.id || crypto.randomUUID(),
          name: ing.name,
          quantity: ing.quantity !== null && ing.quantity !== undefined ? String(ing.quantity) : '',
          unit: ing.unit || '',
          aisle: ing.aisle || 'Fruits & légumes',
        }))
      );
    } else {
      setName('');
      setInstructions('');
      setTags(['Rapide']);
      setIngredients([
        { id: crypto.randomUUID(), name: '', quantity: '', unit: '', aisle: 'Fruits & légumes' },
        { id: crypto.randomUUID(), name: '', quantity: '', unit: '', aisle: 'Frais & crèmerie' },
      ]);
    }
    setCustomTagInput('');
    setError('');
  }, [editingRecipe, isOpen]);

  if (!isOpen) return null;

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleAddCustomTag = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customTagInput.trim();
    if (clean && !tags.includes(clean)) {
      setTags((prev) => [...prev, clean]);
      setCustomTagInput('');
    }
  };

  const addIngredientRow = () => {
    setIngredients((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: '', quantity: '', unit: '', aisle: 'Fruits & légumes' },
    ]);
  };

  const updateIngredient = (id: string, field: keyof IngredientRow, value: string) => {
    setIngredients((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const removeIngredientRow = (id: string) => {
    setIngredients((prev) => prev.filter((row) => row.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Veuillez donner un nom à la recette');
      return;
    }

    // Clean up ingredients
    const validIngredients = ingredients
      .filter((row) => row.name.trim().length > 0)
      .map((row) => {
        const numQty = parseFloat(row.quantity.replace(',', '.'));
        return {
          name: row.name.trim(),
          quantity: isNaN(numQty) ? null : numQty,
          unit: row.unit.trim() || null,
          aisle: row.aisle,
        };
      });

    onSave(
      {
        name: name.trim(),
        instructions: instructions.trim() || 'Préparer et déguster chaud à deux.',
        tags,
      },
      validIngredients
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/45 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-[#FFFDF9] rounded-2xl border border-[#E8DDD2] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E8DDD2] bg-[#FBF6EE] flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-serif font-bold text-[#3E2C23]">
            {editingRecipe ? 'Modifier la recette' : 'Créer une nouvelle recette'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#7E6F65] hover:text-[#3E2C23] hover:bg-[#E8DDD2]/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5 text-xs text-[#3E2C23]">
          {/* Recipe Name */}
          <div>
            <label className="block text-xs font-semibold text-[#3E2C23] mb-1">
              Nom du plat <span className="text-[#C65D3B]">*</span>
            </label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="Ex: Gratin dauphinois fondant, Risotto aux cèpes..."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white border border-[#E8DDD2] focus:outline-none focus:ring-2 focus:ring-[#C65D3B] text-[#3E2C23]"
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-[#3E2C23] mb-1.5">
              Tags & catégories
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {SUGGESTED_TAGS.map((tag) => {
                const isSelected = tags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                      isSelected
                        ? 'bg-[#C65D3B] text-white border-[#C65D3B]'
                        : 'bg-[#FBF6EE] text-[#7E6F65] border-[#E8DDD2] hover:bg-[#E8DDD2]'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
              {/* Show custom tags added by user */}
              {tags
                .filter((t) => !(SUGGESTED_TAGS as readonly string[]).includes(t))
                .map((customTag) => (
                  <button
                    key={customTag}
                    type="button"
                    onClick={() => toggleTag(customTag)}
                    className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#7A8B69] text-white border border-[#7A8B69]"
                  >
                    {customTag} ✕
                  </button>
                ))}
            </div>

            {/* Custom tag input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                placeholder="Créer un nouveau tag..."
                className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-white border border-[#E8DDD2] focus:outline-none focus:ring-1 focus:ring-[#C65D3B]"
              />
              <button
                type="button"
                onClick={handleAddCustomTag}
                disabled={!customTagInput.trim()}
                className="px-3 py-1.5 rounded-xl bg-[#FBF6EE] border border-[#E8DDD2] text-[#3E2C23] font-semibold hover:bg-[#E8DDD2] disabled:opacity-40"
              >
                + Ajouter
              </button>
            </div>
          </div>

          {/* Structured Ingredients */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[#3E2C23]">
                Ingrédients nécessaires
              </label>
              <button
                type="button"
                onClick={addIngredientRow}
                className="text-xs text-[#C65D3B] font-semibold flex items-center gap-1 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter un ingrédient</span>
              </button>
            </div>

            <div className="space-y-2">
              {ingredients.map((row, idx) => (
                <div
                  key={row.id}
                  className="p-2.5 rounded-xl bg-white border border-[#E8DDD2] flex flex-col sm:flex-row gap-2 items-start sm:items-center"
                >
                  <span className="text-[10px] text-[#7E6F65] font-mono shrink-0 hidden sm:inline">
                    #{idx + 1}
                  </span>

                  {/* Name */}
                  <input
                    type="text"
                    value={row.name}
                    onChange={(e) => updateIngredient(row.id, 'name', e.target.value)}
                    placeholder="Nom (ex: Saumon, Farine...)"
                    className="flex-1 w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#E8DDD2] focus:outline-none focus:ring-1 focus:ring-[#C65D3B]"
                  />

                  {/* Quantity & Unit in row */}
                  <div className="flex gap-1.5 w-full sm:w-auto">
                    <input
                      type="text"
                      value={row.quantity}
                      onChange={(e) => updateIngredient(row.id, 'quantity', e.target.value)}
                      placeholder="Qté (ex: 2, 500)"
                      className="w-20 px-2 py-1.5 text-xs rounded-lg border border-[#E8DDD2] focus:outline-none focus:ring-1 focus:ring-[#C65D3B]"
                    />

                    <input
                      type="text"
                      value={row.unit}
                      onChange={(e) => updateIngredient(row.id, 'unit', e.target.value)}
                      placeholder="Unité (g, ml, c. à soupe...)"
                      className="w-24 px-2 py-1.5 text-xs rounded-lg border border-[#E8DDD2] focus:outline-none focus:ring-1 focus:ring-[#C65D3B]"
                    />
                  </div>

                  {/* Aisle */}
                  <div className="flex items-center gap-1.5 w-full sm:w-auto">
                    <select
                      value={row.aisle}
                      onChange={(e) => updateIngredient(row.id, 'aisle', e.target.value as Aisle)}
                      className="flex-1 sm:w-36 px-2 py-1.5 text-xs rounded-lg border border-[#E8DDD2] bg-[#FBF6EE] focus:outline-none focus:ring-1 focus:ring-[#C65D3B]"
                    >
                      {AISLES.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => removeIngredientRow(row.id)}
                      className="p-1.5 rounded-lg text-[#7E6F65] hover:text-red-600 hover:bg-red-50 transition shrink-0"
                      title="Supprimer la ligne"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-xs font-semibold text-[#3E2C23] mb-1">
              Instructions & étapes de préparation
            </label>
            <textarea
              rows={5}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder={`1. Préchauffer le four à 180°C.\n2. Éplucher les légumes et les couper en dés.\n3. Faire revenir à la poêle avec un filet d'huile d'olive...`}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-[#E8DDD2] focus:outline-none focus:ring-2 focus:ring-[#C65D3B] text-[#3E2C23] leading-relaxed"
            />
            <p className="text-[10px] text-[#7E6F65] mt-1">
              Astuce : Sautez des lignes ou numérotez vos étapes pour les afficher joliment sur la fiche recette !
            </p>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#E8DDD2]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#E8DDD2] text-[#7E6F65] font-semibold hover:bg-[#E8DDD2]/50 transition"
            >
              Annuler
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#C65D3B] text-white font-semibold hover:bg-[#AF4F30] transition shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{editingRecipe ? 'Mettre à jour' : 'Créer la recette'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
