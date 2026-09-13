-- Ajout du modèle User et relation avec Article
-- Migration pour Ma Boutique V2

-- Création de la table User
CREATE TABLE IF NOT EXISTS "User" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    nom TEXT NOT NULL,
    passwordHash TEXT NOT NULL,
    couleur TEXT DEFAULT '#2563eb',
    creeLe TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Création de l'index pour les performances
CREATE INDEX IF NOT EXISTS "idx_user_email" ON "User"(email);

-- Ajout de la colonne userId à Article
ALTER TABLE "Article" ADD COLUMN "userId" TEXT;

-- Création de la relation entre Article et User
ALTER TABLE "Article" ADD CONSTRAINT "fk_article_user" 
    FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE;

-- Création de l'index pour les performances
CREATE INDEX IF NOT EXISTS "idx_article_user_id" ON "Article"("userId");

-- Insertion d'un utilisateur par défaut pour la migration
INSERT INTO "User" (id, email, nom, passwordHash) 
VALUES (
    'default-user-id',
    'demo@ma-boutique.com', 
    'Ma Boutique Demo',
    '$2a$10$hashedpasswordplaceholder' -- À remplacer par un vrai hash
) ON CONFLICT (email) DO NOTHING;