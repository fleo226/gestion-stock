-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "taille" TEXT,
    "couleur" TEXT,
    "prixAchat" INTEGER NOT NULL,
    "prixVente" INTEGER NOT NULL,
    "quantite" INTEGER NOT NULL DEFAULT 0,
    "unite" TEXT NOT NULL DEFAULT 'pièce',
    "photoUrl" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mouvement" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL,
    "prixUnitaire" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "Mouvement_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Mouvement" ADD CONSTRAINT "Mouvement_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
