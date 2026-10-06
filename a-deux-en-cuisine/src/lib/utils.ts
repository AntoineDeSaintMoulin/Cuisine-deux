import { RecipeIngredient } from '../types';

/**
 * Remove accents and lowercase text for seamless culinary search
 * e.g., "poireau" matches "Poireaux", "creme" matches "Crème fraîche"
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Clé de comparaison d'un nom d'article : sans accents ni majuscules, au singulier
 * (« Poireaux » et « poireau », « Tomates » et « tomate » donnent la même clé)
 */
export function ingredientKey(name: string): string {
  const n = normalizeText(name).replace(/\s+/g, ' ');
  return n.length > 3 ? n.replace(/(s|x)$/, '') : n;
}

export function searchMatches(haystack: string, query: string): boolean {
  if (!query) return true;
  const normHaystack = normalizeText(haystack);
  const normQuery = normalizeText(query);
  return normHaystack.includes(normQuery);
}

/**
 * Format a YYYY-MM-DD date string to French display format
 * e.g., "mardi 6 octobre" or "mardi 6 octobre 2026"
 */
export function formatFrenchDate(dateStr: string, includeYear = false): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);

  const formatted = date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    ...(includeYear ? { year: 'numeric' } : {}),
  });

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function formatShortFrenchDate(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const dayName = date.toLocaleDateString('fr-FR', { weekday: 'short' });
  return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${d}`;
}

/**
 * Date du jour au format YYYY-MM-DD, dans le fuseau horaire local de l'appareil
 */
export function getTodayDateString(): string {
  return toIsoDateString(new Date());
}

/**
 * Même jour, un mois plus tôt (YYYY-MM-DD)
 */
export function oneMonthBefore(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return toIsoDateString(new Date(y, m - 2, d));
}

/**
 * Mois au format YYYY-MM, décalé de `delta` mois (calcul local, sans UTC)
 */
export function addMonths(monthStr: string, delta: number): string {
  const [y, m] = monthStr.split('-').map(Number);
  const date = new Date(y, m - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Returns the Monday of the week for a given YYYY-MM-DD date string
 */
export function getMondayOfWeek(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  // Sunday is 0, Monday is 1...
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);

  return toIsoDateString(monday);
}

/**
 * Generates the 7 days of the week starting from Monday
 */
export function getWeekDates(mondayStr: string): string[] {
  const [y, m, d] = mondayStr.split('-').map(Number);
  const days: string[] = [];

  for (let i = 0; i < 7; i++) {
    const current = new Date(y, m - 1, d + i);
    days.push(toIsoDateString(current));
  }

  return days;
}

export function toIsoDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Add or subtract days from a YYYY-MM-DD string
 */
export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d + days);
  return toIsoDateString(date);
}

/**
 * Compare two dates (YYYY-MM-DD)
 */
export function isBefore(dateA: string, dateB: string): boolean {
  return dateA < dateB;
}

export function isSameDay(dateA: string, dateB: string): boolean {
  return dateA === dateB;
}

/**
 * Deduplicate and aggregate list of ingredients
 */
export interface ConsolidatedIngredient {
  id: string;
  name: string;
  quantityStr: string;
  aisle: RecipeIngredient['aisle'];
  count: number;
}

export function consolidateIngredients(ingredients: RecipeIngredient[]): ConsolidatedIngredient[] {
  const map = new Map<string, { name: string; quantity: number | null; unit: string; aisle: RecipeIngredient['aisle']; count: number }>();

  for (const ing of ingredients) {
    const norm = ingredientKey(ing.name);
    const unitKey = (ing.unit || '').trim().toLowerCase();
    const key = `${norm}__${unitKey}__${ing.aisle}`;

    if (!map.has(key)) {
      map.set(key, {
        name: ing.name,
        quantity: ing.quantity ?? null,
        unit: ing.unit ?? '',
        aisle: ing.aisle,
        count: 1,
      });
    } else {
      const existing = map.get(key)!;
      existing.count += 1;
      if (existing.quantity !== null && ing.quantity !== null && ing.quantity !== undefined) {
        existing.quantity += ing.quantity;
      }
    }
  }

  return Array.from(map.entries()).map(([key, item]) => {
    let quantityStr = '';
    if (item.quantity !== null) {
      quantityStr = `${item.quantity}${item.unit ? ' ' + item.unit : ''}`;
    } else if (item.unit) {
      quantityStr = item.unit;
    } else if (item.count > 1) {
      quantityStr = `x${item.count}`;
    }

    return {
      id: key,
      name: item.name,
      quantityStr,
      aisle: item.aisle,
      count: item.count,
    };
  });
}
