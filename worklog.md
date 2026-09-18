# Worklog

## Task 4+5 — 2025-03-04

### Task 1: Dark mode added to ALL pages
Added `dark:` Tailwind variants to every page that lacked them:
- `app/page.tsx` — Landing page
- `app/auth/login/page.tsx` — Login page
- `app/stock/page.tsx` — Stock listing
- `app/article/[id]/page.tsx` — Article detail
- `app/article/[id]/modifier/page.tsx` — Edit article
- `app/article/nouveau/page.tsx` — New article
- `app/activite/page.tsx` — Activity
- `app/parametres/page.tsx` — Settings
- `app/stats/page.tsx` — Statistics
- `app/caisse/page.tsx` — POS/Cash register
- `app/boutique/[vendeurId]/page.tsx` — Public storefront

Pattern applied:
- `bg-white` → `dark:bg-gray-800` / `dark:bg-gray-900`
- `bg-gray-50` → `dark:bg-gray-900`
- `bg-gray-100` → `dark:bg-gray-700`
- `text-gray-900` → `dark:text-gray-100`
- `text-gray-500` → `dark:text-gray-400`
- `border-gray-100/200/300` → `dark:border-gray-700/600`
- Inputs → `dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100`
- Cards → `dark:bg-gray-800`
- Colored backgrounds → `dark:bg-*-900/30` for subtle dark variants

### Task 2: Category selector in article forms + category badge in stock listing
- **Updated `lib/actions.ts`**: Added `categorieId` and `categorie` to `ArticleAvecVentes` type; included `categorie` relation in `getArticles()` and `getArticle()` Prisma queries
- **`app/article/nouveau/page.tsx`**: Added `categorieId` to form state, fetches `/api/categories` on mount, renders a `<select>` with "Sans catégorie" default and all category options, sends `categorieId` in the POST body
- **`app/article/[id]/modifier/page.tsx`**: Same category dropdown, pre-populated with the article's existing `categorieId`, also sends `categorieId` on update
- **`app/stock/page.tsx`**: Added category badge display next to article names — shows a small colored pill with the category name (using `categorie.couleur` as background) when an article has a category
- **`app/article/[id]/page.tsx`**: Added category badge in the hero card alongside taille/couleur badges

### Task 3: Export button functional in stats page + stock listing
- **`app/stats/page.tsx`**: Made the "Exporter" button functional — on click, generates a CSV with columns: Nom, Catégorie, Quantité, Prix Achat (FCFA), Prix Vente (FCFA), Valeur Stock (FCFA). Downloads via `document.createElement('a')` + Blob with BOM for Excel UTF-8 compatibility. Also stores `articles` data from the stock API for the export.
- **`app/stock/page.tsx`**: Added a Download icon button in the header (next to stats/settings) that exports the same CSV format for the stock listing page.
