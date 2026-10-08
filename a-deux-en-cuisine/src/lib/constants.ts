import { Aisle, Slot } from '../types';

export const DEFAULT_AISLES: readonly Aisle[] = [
  'Fruits & légumes',
  'Boucherie & poisson',
  'Frais & crèmerie',
  'Boulangerie',
  'Épicerie salée',
  'Épicerie sucrée',
  'Surgelés',
  'Boissons',
  'Hygiène & maison',
  'Autre',
];

/** Catégorie de repli : ne peut être ni supprimée ni renommée */
export const FALLBACK_AISLE: Aisle = 'Autre';

export const SUGGESTED_TAGS = [
  'Rapide',
  'Végétarien',
  'Poisson',
  'Viande',
  'Batch cooking',
  'Été',
  'Hiver',
  'Réception',
  'Dessert',
  'Petit-déjeuner',
] as const;

export const SLOTS: { id: Slot; label: string; short: string; emoji: string }[] = [
  { id: 'matin', label: 'Matin', short: 'Matin', emoji: '☀️' },
  { id: 'midi', label: 'Midi', short: 'Midi', emoji: '🍲' },
  { id: 'soir', label: 'Soir', short: 'Soir', emoji: '🌙' },
];

export const MIN_DATE = '2026-09-01';
