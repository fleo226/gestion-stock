const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateUsers() {
  try {
    console.log('🚀 Démarrage de la migration des utilisateurs...');
    
    // Exécuter le SQL de migration
    const migrationSql = `
      -- Ajout du modèle User et relation avec Article
      CREATE TABLE IF NOT EXISTS "User" (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
          email TEXT UNIQUE NOT NULL,
          nom TEXT NOT NULL,
          passwordHash TEXT NOT NULL,
          couleur TEXT DEFAULT '#2563eb',
          creeLe TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS "idx_user_email" ON "User"(email);
      
      ALTER TABLE "Article" ADD COLUMN "userId" TEXT;
      
      ALTER TABLE "Article" ADD CONSTRAINT "fk_article_user" 
          FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE;
      
      CREATE INDEX IF NOT EXISTS "idx_article_user_id" ON "Article"("userId");
      
      INSERT INTO "User" (id, email, nom, passwordHash) 
      VALUES (
          'default-user-id',
          'demo@ma-boutique.com', 
          'Ma Boutique Demo',
          '$2a$10$hashedpasswordplaceholder'
      ) ON CONFLICT (email) DO NOTHING;
    `;
    
    await prisma.$executeRaw`${migrationSql}`;
    console.log('✅ Migration SQL exécutée avec succès');
    
    // Mettre à jour tous les articles existants pour les lier à l'utilisateur par défaut
    await prisma.article.updateMany({
      where: { userId: null },
      data: { userId: 'default-user-id' }
    });
    
    console.log('✅ Tous les articles existants liés à l\'utilisateur par défaut');
    
    // Vérifier le résultat
    const userCount = await prisma.user.count();
    const articleCount = await prisma.article.count();
    
    console.log(`📊 Statistiques après migration:`);
    console.log(`- Utilisateurs: ${userCount}`);
    console.log(`- Articles: ${articleCount}`);
    console.log(`- Articles liés à l'utilisateur par défaut: ${await prisma.article.count({ where: { userId: 'default-user-id' } })}`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateUsers()
  .then(() => {
    console.log('🎉 Migration terminée avec succès !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration échouée:', error);
    process.exit(1);
  });