import React, { createContext, useContext } from 'react';
import { Aisle } from '../types';
import { DEFAULT_AISLES, FALLBACK_AISLE } from './constants';

/** Liste ordonnée des noms de catégories d'aliments, partagée dans toute l'app */
const AislesContext = createContext<readonly Aisle[]>(DEFAULT_AISLES);

export const AislesProvider: React.FC<{ aisles: readonly Aisle[]; children: React.ReactNode }> = ({ aisles, children }) => (
  <AislesContext.Provider value={aisles}>{children}</AislesContext.Provider>
);

export function useAisles(): readonly Aisle[] {
  return useContext(AislesContext);
}

/**
 * Regroupe des éléments par catégorie, dans l'ordre défini par l'utilisateur.
 * Les éléments dont la catégorie n'existe plus (supprimée sur l'autre téléphone…)
 * sont affichés à la fin, sous leur ancien nom, pour ne jamais rien perdre.
 */
export function groupByAisle<T extends { aisle: Aisle }>(items: T[], aisles: readonly Aisle[]): { aisle: Aisle; items: T[] }[] {
  const known = new Set(aisles);
  const groups: { aisle: Aisle; items: T[] }[] = [];
  for (const aisle of aisles) {
    const list = items.filter((i) => i.aisle === aisle);
    if (list.length > 0) groups.push({ aisle, items: list });
  }
  const orphans = Array.from(new Set(items.filter((i) => !known.has(i.aisle)).map((i) => i.aisle)));
  for (const aisle of orphans) {
    groups.push({ aisle: aisle || FALLBACK_AISLE, items: items.filter((i) => i.aisle === aisle) });
  }
  return groups;
}

/** Catégorie par défaut pour un nouvel article : la première de la liste */
export function defaultAisle(aisles: readonly Aisle[]): Aisle {
  return aisles[0] ?? FALLBACK_AISLE;
}

/** Liste pour un menu déroulant : ajoute la valeur actuelle si elle n'existe plus dans les catégories */
export function withCurrent(aisles: readonly Aisle[], current?: Aisle | null): Aisle[] {
  return current && !aisles.includes(current) ? [...aisles, current] : [...aisles];
}
