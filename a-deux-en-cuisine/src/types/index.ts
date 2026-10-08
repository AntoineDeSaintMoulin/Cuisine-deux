/** Nom d'une catégorie d'aliments (rayon). Les catégories sont gérées dans l'app. */
export type Aisle = string;

export interface AisleCategory {
  id: string;
  name: string;
  position: number;
  created_at?: string;
}

export type Slot = 'matin' | 'midi' | 'soir';

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  name: string;
  quantity?: number | null;
  unit?: string | null;
  aisle: Aisle;
  created_at?: string;
}

export interface Recipe {
  id: string;
  name: string;
  instructions: string;
  tags: string[];
  created_at?: string;
  ingredients?: RecipeIngredient[];
}

export interface Meal {
  id: string;
  date: string; // Format 'YYYY-MM-DD'
  slot: Slot;
  title: string;
  recipe_id?: string | null;
  note?: string | null;
  created_at?: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity?: string | null; // Free text, e.g. "2", "500 g", "1 botte"
  aisle: Aisle;
  note?: string | null;
  checked: boolean;
  recipe_id?: string | null;
  created_at?: string;
}

export type TabType = 'courses' | 'calendrier' | 'recettes';
