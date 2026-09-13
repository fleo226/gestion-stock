"use server";

// Simples fonctions de démo pour éviter les erreurs TypeScript
export async function creerArticle(data: any) {
  console.log('Création article (démo):', data);
  return { success: true, id: `demo-${Date.now()}` };
}

export async function modifierArticle(id: string, data: any) {
  console.log('Modification article (démo):', id, data);
  return { success: true, id };
}

export async function televerserPhoto(file: File) {
  console.log('Upload photo (démo):', file.name);
  return { success: true, url: `https://via.placeholder.com/300x300?text=Demo+${Date.now()}` };
}

export async function getArticles() {
  // Données de démo
  return [
    {
      id: '1',
      nom: 'Robe traditionnelle',
      taille: 'M',
      couleur: 'Rouge',
      prixAchat: 5000,
      prixVente: 8000,
      quantite: 10,
      unite: 'pièce',
      photoUrl: null,
      creeLe: new Date().toISOString(),
      entreeTotal: 10,
      vendu: 0,
      valeurStock: 50000,
      benefice: 0,
      ca: 0
    }
  ];
}

export async function getArticle(id: string) {
  return null; // Simule une recherche
}

export async function entreeArticle(id: string, quantite: number, prixUnitaire: number, note?: string) {
  console.log('Entrée article (démo):', id, quantite, prixUnitaire);
  return { success: true, id };
}

export async function sortieArticle(id: string, quantite: number, prixUnitaire: number, note?: string) {
  console.log('Sortie article (démo):', id, quantite, prixUnitaire);
  return { success: true, id };
}

export async function supprimerArticle(id: string) {
  console.log('Suppression article (démo):', id);
  return { success: true, id };
}