import React, { createContext, useContext } from 'react';
import { SUGGESTED_TAGS } from './constants';

/** Outils partagés avec l'éditeur de recettes : tags gérés et accès à l'écran des catégories */
export interface RecipeOptions {
  tagNames: string[];
  tagsTableMissing: boolean;
  addTag: (name: string) => void;
  deleteTag: (name: string) => void;
  tagUsage: (name: string) => number;
  openCategories: () => void;
}

const RecipeOptionsContext = createContext<RecipeOptions>({
  tagNames: [...SUGGESTED_TAGS],
  tagsTableMissing: false,
  addTag: () => {},
  deleteTag: () => {},
  tagUsage: () => 0,
  openCategories: () => {},
});

export const RecipeOptionsProvider: React.FC<{ value: RecipeOptions; children: React.ReactNode }> = ({ value, children }) => (
  <RecipeOptionsContext.Provider value={value}>{children}</RecipeOptionsContext.Provider>
);

export function useRecipeOptions(): RecipeOptions {
  return useContext(RecipeOptionsContext);
}
