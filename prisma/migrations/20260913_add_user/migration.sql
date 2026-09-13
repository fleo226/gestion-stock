-- Add User table
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "couleur" TEXT NOT NULL DEFAULT '#2563eb',
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- Add userId to Article (nullable first to allow existing data)
ALTER TABLE "Article" ADD COLUMN "userId" TEXT;

-- Update existing articles to have a default user (first user created)
-- We'll handle this by making userId nullable for now, then update after first user creation

-- Add foreign key
ALTER TABLE "Article" ADD CONSTRAINT "Article_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add index
CREATE INDEX "Article_userId_idx" ON "Article"("userId");