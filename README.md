# Ma Boutique — Gestion de stock

Application web simple pour commerçants de vêtements : **ce qui entre, ce qui sort, ce qui reste**, avec photo, prix, et argent (valeur du stock, chiffre d'affaires, bénéfice).

Pensée pour une utilisation sur téléphone (navigateur, rien à installer). Français, montants en FCFA.

## Fonctionnalités

- **Stock** : liste des articles (photo, reste, prix), recherche rapide, résumé (valeur, en stock, CA)
- **Ajouter un article** : photo (appareil/galerie), nom, taille, couleur, prix d'achat, prix de vente, quantité, unité
- **Fiche article** : entrée ➕ / sortie (vente) ➖ en quelques secondes, historique daté, valeur du stock, CA, bénéfice
- **Modifier / supprimer** un article
- **Code PIN** optionnel : protège les prix et marges (le client qui regarde l'écran ne voit rien)

## Calculs automatiques

- `Vendu = Entré − Reste` (jamais rien à compter)
- `Valeur du stock = Reste × prix d'achat`
- `CA ventes = Vendu × prix de vente`
- `Bénéfice = Vendu × (prix de vente − prix d'achat)`

## Technique

- **Next.js 16** (App Router, React 19, Tailwind CSS 4, TypeScript)
- **Base de données** : Supabase Postgres (base dédiée `gestion-stock-neurones`, région EU)
- **Photos** : Supabase Storage (bucket public `photos`)
- **ORM** : Prisma
- **Déploiement** : Vercel (serverless)

## En local

```bash
npm install
# copiez .env.example vers .env.local et remplissez
npx prisma migrate dev   # crée les tables
npm run dev              # http://localhost:3000
```