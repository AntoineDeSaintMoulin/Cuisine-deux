import React, { useState } from 'react';
import { Sparkles, Wifi, WifiOff, RefreshCw, Settings2, Download, Check } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface HeaderProps {
  isOnline: boolean;
  isSupabaseLive: boolean;
  isSyncing: boolean;
  onOpenSupabaseModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isOnline,
  isSupabaseLive,
  isSyncing,
  onOpenSupabaseModal,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-[#FBF6EE]/95 backdrop-blur-md border-b border-[#E8DDD2] px-4 py-3 safe-pt transition-colors">
      <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
        {/* Brand identity */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#C65D3B] text-white flex items-center justify-center shadow-sm shadow-[#C65D3B]/20">
            <svg
              className="w-5 h-5 fill-current"
              viewBox="0 0 24 24"
            >
              <path d="M18 10h-1V6c0-1.1-.9-2-2-2H9c-1.1 0-2 .9-2 2v4H6c-1.1 0-2 .9-2 2v2c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4v-2c0-1.1-.9-2-2-2zm-3-4v4h-2V6h2zm-4 0v4H9V6h2zm8 8c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2v-2h14v2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-serif font-bold text-[#3E2C23] leading-tight tracking-tight">
              À Deux en Cuisine
            </h1>
            <p className="text-[11px] text-[#7E6F65] leading-none mt-0.5">
              Courses & festins partagés
            </p>
          </div>
        </div>

        {/* Status badges & action buttons */}
        <div className="flex items-center gap-2">
          {/* PWA Install Button */}
          {!isInstalled && isInstallable && (
            <button
              onClick={install}
              aria-label="Installer l'application"
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-[#7A8B69] text-white hover:bg-[#627252] transition shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Installer</span>
            </button>
          )}

          {!isInstalled && isIOS && (
            <button
              onClick={() => setShowIOSModal(true)}
              aria-label="Installer sur iPhone"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-[#7A8B69]/15 text-[#627252] border border-[#7A8B69]/30 hover:bg-[#7A8B69]/25 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">App</span>
            </button>
          )}

          {/* Realtime / Supabase status badge */}
          <button
            onClick={onOpenSupabaseModal}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition ${
              !isOnline
                ? 'bg-amber-100 text-amber-800 border-amber-300'
                : isSyncing
                ? 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse'
                : isSupabaseLive
                ? 'bg-[#EFF3ED] text-[#4A633F] border-[#C8D6C0]'
                : 'bg-stone-100 text-[#7E6F65] border-stone-200'
            }`}
            title="Statut de la synchronisation Supabase"
          >
            {!isOnline ? (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-700" />
                <span className="text-[11px]">Hors-ligne</span>
              </>
            ) : isSyncing ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
                <span className="text-[11px]">Synchro...</span>
              </>
            ) : isSupabaseLive ? (
              <>
                <span className="w-2 h-2 rounded-full bg-[#7A8B69] animate-pulse" />
                <span className="text-[11px] font-semibold">Temps réel</span>
              </>
            ) : (
              <>
                <Wifi className="w-3 h-3 text-stone-500" />
                <span className="text-[11px]">Local</span>
              </>
            )}
            <Settings2 className="w-3 h-3 ml-0.5 opacity-60 hover:opacity-100" />
          </button>
        </div>
      </div>

      {/* iOS Safari installation guide modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#FFFDF9] border border-[#E8DDD2] p-5 shadow-2xl text-[#3E2C23]">
            <div className="w-12 h-12 rounded-xl bg-[#F9EDE8] text-[#C65D3B] flex items-center justify-center mb-3">
              <Download className="w-6 h-6" />
            </div>
            <h3 className="text-base font-serif font-bold text-[#3E2C23]">
              Installer sur iPhone ou iPad
            </h3>
            <p className="mt-2 text-xs text-[#7E6F65] leading-relaxed">
              Pour utiliser l'application en plein écran comme une vraie appli sur vos deux téléphones :
            </p>
            <ol className="mt-3 space-y-2 text-xs text-[#3E2C23] font-medium">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#E8DDD2] flex items-center justify-center text-[10px] shrink-0">1</span>
                <span>Touchez l'icône de <strong>Partage</strong> (carré avec flèche vers le haut en bas de Safari).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#E8DDD2] flex items-center justify-center text-[10px] shrink-0">2</span>
                <span>Faites défiler vers le bas et appuyez sur <strong>« Sur l'écran d'accueil »</strong>.</span>
              </li>
            </ol>
            <button
              onClick={() => setShowIOSModal(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-[#C65D3B] text-white text-xs font-semibold hover:bg-[#AF4F30] transition"
            >
              C'est compris !
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
