-- Fix: update NULL userId in Article to first user, then add constraints
-- First, check if there are any NULL userId rows and fix them
DO $$
DECLARE
    first_user_id TEXT;
BEGIN
    SELECT id INTO first_user_id FROM "User" LIMIT 1;
    
    IF first_user_id IS NOT NULL THEN
        UPDATE "Article" SET "userId" = first_user_id WHERE "userId" IS NULL;
    END IF;
END $$;

-- Create Categorie table if not exists
CREATE TABLE IF NOT EXISTS "Categorie" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "couleur" TEXT NOT NULL DEFAULT '#2563eb',
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Categorie_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Categorie_userId_idx" ON "Categorie"("userId");

-- Add foreign key for Categorie if not exists
DO $$ BEGIN
    ALTER TABLE "Categorie" ADD CONSTRAINT "Categorie_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add categorieId column if not exists
DO $$ BEGIN
    ALTER TABLE "Article" ADD COLUMN "categorieId" TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Add foreign key for categorie if not exists
DO $$ BEGIN
    ALTER TABLE "Article" ADD CONSTRAINT "Article_categorieId_fkey" FOREIGN KEY ("categorieId") REFERENCES "Categorie"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "Article_categorieId_idx" ON "Article"("categorieId");