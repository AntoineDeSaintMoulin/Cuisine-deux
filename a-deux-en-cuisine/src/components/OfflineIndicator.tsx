import React from 'react';
import { WifiOff, AlertTriangle, X } from 'lucide-react';

interface OfflineIndicatorProps {
  isOnline: boolean;
  pendingCount?: number;
  syncError?: string | null;
  onRetry?: () => void;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ isOnline, pendingCount = 0, syncError, onRetry }) => {
  const [dismissedError, setDismissedError] = React.useState<string | null>(null);

  if (!isOnline) {
    return (
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-30 max-w-sm w-[90%] pointer-events-none">
        <div className="bg-[#3E2C23]/95 backdrop-blur-md text-[#FFFDF9] border border-amber-500/30 px-3.5 py-2 rounded-full shadow-lg flex items-center justify-center gap-2 text-xs font-medium">
          <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>
            Hors ligne
            {pendingCount > 0
              ? ` • ${pendingCount} modification${pendingCount > 1 ? 's' : ''} en attente d'envoi`
              : ' • Vos modifications seront envoyées au retour du réseau'}
          </span>
        </div>
      </div>
    );
  }

  if (syncError && syncError !== dismissedError) {
    return (
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-30 max-w-sm w-[92%]">
        <div className="bg-[#FFF4E5] text-[#7A4B12] border border-amber-300 px-3.5 py-2 rounded-2xl shadow-lg flex items-start gap-2 text-xs font-medium">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span className="flex-1">
            {syncError}
            {onRetry && (
              <button onClick={onRetry} className="ml-1 underline font-semibold">
                Réessayer
              </button>
            )}
          </span>
          <button onClick={() => setDismissedError(syncError)} aria-label="Fermer" className="shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return null;
};
