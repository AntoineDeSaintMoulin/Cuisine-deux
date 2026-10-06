# À Deux en Cuisine

Application mobile (PWA) pour gérer à deux la liste de courses, le calendrier des repas et le carnet de recettes. Les données sont stockées dans Supabase et synchronisées en temps réel entre les deux téléphones.

## Fonctionnalités

- **Courses** : ajout rapide, regroupement par rayon, cases à cocher en magasin, notes par article, consultable et modifiable hors ligne (les modifications sont envoyées au retour du réseau).
- **Calendrier** : à partir du 1er septembre 2026, vue semaine (matin / midi / soir) et vue mois, historique des repas passés et planification des repas à venir.
- **Recettes** : ingrédients structurés, tags, recherche par plat, ingrédient ou thème (insensible aux accents), section Inspiration.
- **Planification → courses** : « Générer les courses » ajoute les ingrédients des recettes planifiées de la semaine, sans doublonner ce qui est déjà dans la liste.

## Mise en place

### 1. Supabase

1. Créez un projet sur [supabase.com](https://supabase.com).
2. Dans **SQL Editor**, collez et exécutez le contenu de `supabase/schema.sql` (tables, index, accès, temps réel). Le script peut être relancé sans risque.
3. Dans **Project Settings → API**, récupérez l'URL du projet et la clé `anon`.

### 2. En local

```bash
npm install
cp .env.example .env.local   # puis renseignez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY
npm run dev
```

### 3. Mise en ligne (Vercel, Netlify…)

- Commande de build : `npm run build` — dossier publié : `dist`
- Variables d'environnement : `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`

Sur chaque téléphone, ouvrez l'adresse du site puis « Ajouter à l'écran d'accueil » pour installer l'application.

## Sécurité

Il n'y a pas de comptes : toute personne qui connaît l'adresse de l'application peut lire et modifier les données. Ne partagez l'adresse qu'entre vous deux.
