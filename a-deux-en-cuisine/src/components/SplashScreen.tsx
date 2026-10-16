import React, { useEffect, useState } from 'react';

const IMAGE = '/bon-appetit.webp';
const VISIBLE_MS = 2000; // durée d'affichage
const FADE_MS = 500; // durée du fondu de sortie

// Animations d'entrée (désactivées si le téléphone demande moins d'animations)
const STYLES = `
@keyframes splash-photo-in { from { opacity: 0; transform: scale(1.06); } to { opacity: 1; transform: scale(1); } }
@keyframes splash-title-in { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
.splash-photo { animation: splash-photo-in 900ms ease-out both; }
.splash-title { animation: splash-title-in 700ms ease-out 450ms both; }
@media (prefers-reduced-motion: reduce) { .splash-photo, .splash-title { animation: none; } }
`;

/**
 * Écran d'accueil affiché à chaque ouverture de l'app : la photo apparaît en fondu,
 * « Bon appétit ! » s'affiche par-dessus, puis tout disparaît en douceur.
 * Un toucher permet de passer directement à l'app.
 */
export const SplashScreen: React.FC = () => {
  const [phase, setPhase] = useState<'in' | 'out' | 'done'>('in');

  useEffect(() => {
    const out = setTimeout(() => setPhase('out'), VISIBLE_MS);
    const done = setTimeout(() => setPhase('done'), VISIBLE_MS + FADE_MS);
    return () => {
      clearTimeout(out);
      clearTimeout(done);
    };
  }, []);

  if (phase === 'done') return null;

  const skip = () => {
    setPhase('out');
    setTimeout(() => setPhase('done'), FADE_MS);
  };

  return (
    <div
      onClick={skip}
      role="presentation"
      className="fixed inset-0 z-[100] overflow-hidden bg-[#3E2C23] cursor-pointer select-none"
      style={{ opacity: phase === 'out' ? 0 : 1, transition: `opacity ${FADE_MS}ms ease` }}
    >
      <style>{STYLES}</style>
      {/* Fond : la même photo, floutée, pour remplir l'écran en portrait */}
      <img
        src={IMAGE}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl brightness-75"
      />

      {/* Photo entière, centrée, qui apparaît en fondu avec un léger zoom */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <img
          src={IMAGE}
          alt="Un couple cuisine ensemble"
          className="splash-photo w-full max-w-xl max-h-full object-contain rounded-2xl shadow-2xl"
        />
      </div>

      {/* Dégradé + message */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-[14%] flex justify-center pointer-events-none">
        <h1 className="splash-title font-serif italic font-bold text-5xl sm:text-6xl text-[#FFFDF9] drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
          Bon appétit !
        </h1>
      </div>
    </div>
  );
};
