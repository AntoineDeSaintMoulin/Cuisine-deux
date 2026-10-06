import React, { useState, useEffect } from 'react';
import { X, Database, CheckCircle2, AlertCircle, Copy, Check, ExternalLink, RefreshCw } from 'lucide-react';
import { getSupabaseCredentials, saveSupabaseCredentials, isSupabaseConfigured } from '../lib/supabase';

interface SupabaseSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isOnline: boolean;
  isSupabaseLive: boolean;
  isSyncing: boolean;
  syncError: string | null;
  lastSyncTime: Date | null;
  onRefresh: () => void;
}

export const SupabaseSettingsModal: React.FC<SupabaseSettingsModalProps> = ({
  isOpen,
  onClose,
  isOnline,
  isSupabaseLive,
  isSyncing,
  syncError,
  lastSyncTime,
  onRefresh,
}) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const creds = getSupabaseCredentials();
      setUrl(creds.url);
      setAnonKey(creds.anonKey);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseCredentials(url, anonKey);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      // Recharge l'app pour recréer le client Supabase et l'abonnement temps réel
      window.location.reload();
    }, 600);
  };

  const handleCopySqlHint = async () => {
    try {
      await navigator.clipboard.writeText('Voir le fichier supabase/schema.sql');
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-[#FFFDF9] rounded-2xl border border-[#E8DDD2] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E8DDD2] flex items-center justify-between bg-[#FBF6EE]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#7A8B69]/15 text-[#627252] flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-[#3E2C23]">
                Synchronisation Supabase
              </h2>
              <p className="text-xs text-[#7E6F65]">
                Partage en direct entre vos deux téléphones
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#7E6F65] hover:text-[#3E2C23] hover:bg-[#E8DDD2]/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-[#3E2C23]">
          {/* Status box */}
          <div className="p-3.5 rounded-xl border bg-[#FBF6EE] border-[#E8DDD2] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-[#3E2C23]">Statut de connexion :</span>
              {isSupabaseLive ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EFF3ED] text-[#4A633F] font-semibold text-[11px] border border-[#C8D6C0]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Connecté en temps réel
                </span>
              ) : isSyncing ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold text-[11px]">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Synchronisation...
                </span>
              ) : isSupabaseConfigured() ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 font-semibold text-[11px] border border-amber-200">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Attente connexion
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-stone-100 text-[#7E6F65] font-semibold text-[11px]">
                  Mode local (hors-ligne)
                </span>
              )}
            </div>

            {lastSyncTime && (
              <p className="text-[11px] text-[#7E6F65]">
                Dernière synchro : {lastSyncTime.toLocaleTimeString('fr-FR')}
              </p>
            )}

            {syncError && (
              <p className="text-[11px] text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
                {syncError}
              </p>
            )}

            <div className="pt-1 flex items-center justify-between text-[11px] text-[#7E6F65]">
              <span>Réseau : {isOnline ? '🟢 Connecté à Internet' : '🟠 Hors-ligne'}</span>
              <button
                type="button"
                onClick={onRefresh}
                className="inline-flex items-center gap-1 text-[#C65D3B] font-semibold hover:underline"
              >
                <RefreshCw className="w-3 h-3" />
                Actualiser
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-3.5">
            <h3 className="font-semibold text-xs text-[#3E2C23] uppercase tracking-wider">
              Identifiants Supabase (Couple)
            </h3>

            <div>
              <label className="block text-[11px] font-medium text-[#7E6F65] mb-1">
                URL du projet (VITE_SUPABASE_URL)
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#E8DDD2] focus:outline-none focus:ring-2 focus:ring-[#C65D3B] text-[#3E2C23]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#7E6F65] mb-1">
                Clé publique Anon (VITE_SUPABASE_ANON_KEY)
              </label>
              <input
                type="password"
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#E8DDD2] focus:outline-none focus:ring-2 focus:ring-[#C65D3B] text-[#3E2C23]"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-[#C65D3B] text-white text-xs font-semibold hover:bg-[#AF4F30] transition shadow-xs flex items-center justify-center gap-1.5"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Enregistré !
                  </>
                ) : (
                  'Enregistrer & Connecter'
                )}
              </button>
            </div>
          </form>

          {/* How to setup with Supabase */}
          <div className="p-3.5 rounded-xl bg-[#EFF3ED] border border-[#C8D6C0] space-y-2">
            <h4 className="font-bold text-xs text-[#4A633F] flex items-center gap-1.5">
              <span>💡</span> Comment activer le temps réel sur Supabase ?
            </h4>
            <p className="text-[11px] text-[#4A633F] leading-relaxed">
              1. Créez un projet gratuit sur <strong>supabase.com</strong>.
              <br />
              2. Ouvrez l'onglet <strong>SQL Editor</strong> de Supabase.
              <br />
              3. Collez et exécutez le script complet situé dans le fichier <code className="bg-white/70 px-1 py-0.5 rounded font-mono text-[10px]">supabase/schema.sql</code>.
              <br />
              4. Renseignez l'URL et la clé anon ci-dessus (ou dans les variables d'environnement). Les deux téléphones seront automatiquement reliés !
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#E8DDD2] bg-[#FBF6EE] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#E8DDD2] text-[#3E2C23] font-medium text-xs hover:bg-[#DBCDBE] transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
