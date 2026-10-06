import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface ClearCheckedConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  count: number;
}

export const ClearCheckedConfirmModal: React.FC<ClearCheckedConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  count,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="w-full max-w-sm bg-[#FFFDF9] rounded-2xl border border-[#E8DDD2] shadow-2xl p-5 text-[#3E2C23] animate-in fade-in-50 zoom-in-95 duration-150">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3.5 mx-auto">
          <Trash2 className="w-6 h-6" />
        </div>

        <h3 className="text-base font-serif font-bold text-center text-[#3E2C23]">
          Vider les articles cochés ?
        </h3>
        <p className="mt-2 text-xs text-[#7E6F65] text-center leading-relaxed">
          Vous êtes sur le point de retirer définitivement <strong>{count} article{count > 1 ? 's' : ''}</strong> de votre liste de courses.
        </p>

        <div className="mt-5 flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-[#E8DDD2] text-[#7E6F65] text-xs font-semibold hover:bg-[#E8DDD2]/50 transition"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 py-2.5 rounded-xl bg-[#C65D3B] text-white text-xs font-semibold hover:bg-[#AF4F30] transition shadow-xs flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>Vider</span>
          </button>
        </div>
      </div>
    </div>
  );
};
