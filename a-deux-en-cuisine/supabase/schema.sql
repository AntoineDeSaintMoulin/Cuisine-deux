-- ==============================================================================
-- SCHEMA SUPABASE POUR "À DEUX EN CUISINE"
-- Gestion collaborative des courses, repas et recettes pour un couple
-- ==============================================================================

-- 1. SUPPRESSION PREVENTIVE DES TABLES (POUR INITIALISATION PROPRE SI REJOUE)
-- DROP TABLE IF EXISTS shopping_items CASCADE;
-- DROP TABLE IF EXISTS meals CASCADE;
-- DROP TABLE IF EXISTS recipe_ingredients CASCADE;
-- DROP TABLE IF EXISTS recipes CASCADE;

-- 2. TABLE DES RECETTES
CREATE TABLE IF NOT EXISTS recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    instructions TEXT NOT NULL, -- Texte libre ou étapes numérotées
    tags TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. TABLE DES INGRÉDIENTS DE RECETTES
CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    quantity NUMERIC, -- Numérique optionnel (ex: 500, 2, 0.5)
    unit TEXT,        -- Unité optionnelle (ex: "g", "ml", "c. à soupe", "pièce")
    aisle TEXT NOT NULL DEFAULT 'Autre', -- Rayon du supermarché
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. TABLE DES REPAS DU CALENDRIER
CREATE TABLE IF NOT EXISTS meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL, -- Ex: '2026-10-06'
    slot TEXT NOT NULL CHECK (slot IN ('matin', 'midi', 'soir')),
    title TEXT NOT NULL,
    recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. TABLE DES ARTICLES DE COURSES
CREATE TABLE IF NOT EXISTS shopping_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    quantity TEXT, -- Texte libre (ex: "2", "500 g", "1 botte")
    aisle TEXT NOT NULL DEFAULT 'Autre',
    note TEXT,
    checked BOOLEAN NOT NULL DEFAULT FALSE,
    recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. INDEX POUR LES PERFORMANCES
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_meals_date ON meals(date);
CREATE INDEX IF NOT EXISTS idx_meals_recipe_id ON meals(recipe_id);
CREATE INDEX IF NOT EXISTS idx_shopping_items_checked ON shopping_items(checked);
CREATE INDEX IF NOT EXISTS idx_shopping_items_aisle ON shopping_items(aisle);

-- 7. POLITIQUES DE SECURITE RLS (ACCES PUBLIC / ANON SANS AUTHENTIFICATION)
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;

-- Autoriser la lecture et l'écriture complète à la clé anon
DROP POLICY IF EXISTS "Anon full access recipes" ON recipes;
CREATE POLICY "Anon full access recipes" ON recipes
    FOR ALL TO anon, authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Anon full access recipe_ingredients" ON recipe_ingredients;
CREATE POLICY "Anon full access recipe_ingredients" ON recipe_ingredients
    FOR ALL TO anon, authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Anon full access meals" ON meals;
CREATE POLICY "Anon full access meals" ON meals
    FOR ALL TO anon, authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Anon full access shopping_items" ON shopping_items;
CREATE POLICY "Anon full access shopping_items" ON shopping_items
    FOR ALL TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 8. ACTIVATION DU TEMPS RÉEL (SUPABASE REALTIME)
-- Permet aux deux téléphones de recevoir instantanément chaque INSERT, UPDATE, DELETE
-- (bloc relançable : n'ajoute une table que si elle n'est pas déjà publiée)
DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['recipes', 'recipe_ingredients', 'meals', 'shopping_items'] LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables
            WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
        ) THEN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
        END IF;
    END LOOP;
END $$;

