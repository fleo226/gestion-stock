# Ma Boutique

Application de gestion de stock pour commerçants.

## Stack

- Next.js 16 (App Router) + React 19 + Tailwind CSS 4
- Prisma ORM + PostgreSQL (Supabase)
- Auth: NextAuth (credentials) + custom session hook
- Déploiement Vercel
- PWA (Service Worker + IndexedDB)
- IA Assistant (GLM 4.5 Flash)

## Développement

```bash
npm run dev
npm run build
npm run db:push
```

## Déploiement

```bash
vercel --prod
```