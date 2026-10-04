// ============================================================
// Cycle de vie des commandes (audit B1) :
// - annulation par la vendeuse, avec restitution du stock
// - expiration automatique des commandes non payées depuis 2h
// La restitution est incrémentale et tracée (mouvements ENTREE),
// dans la même transaction que le changement de statut.
// ============================================================
import { Prisma } from '@prisma/client';
import { db, getDbDirect } from './db';

export const DELAI_EXPIRATION_MS = 2 * 60 * 60 * 1000; // 2 heures

type Tx = Prisma.TransactionClient;

// Restitue le stock de chaque ligne : incrément atomique + mouvement
// ENTREE tracé (prix de revient actuel de l'article). Les mouvements
// SORTIE de la commande annulée sont supprimés : sinon le CA et le
// bénéfice compteraient des ventes qui n'ont jamais eu lieu.
async function restaurerStockCommande(tx: Tx, commandeId: string, motif: string): Promise<void> {
  const reference = `Commande ${commandeId.slice(0, 8).toUpperCase()} :`;
  const lignes = await tx.commandeLigne.findMany({
    where: { commandeId },
    select: { articleId: true, quantite: true },
  });
  for (const ligne of lignes) {
    await tx.article.update({
      where: { id: ligne.articleId },
      data: { quantite: { increment: ligne.quantite } },
    });
    const article = await tx.article.findUnique({
      where: { id: ligne.articleId },
      select: { prixAchat: true },
    });
    await tx.mouvement.create({
      data: {
        articleId: ligne.articleId,
        type: 'ENTREE',
        quantite: ligne.quantite,
        prixUnitaire: article?.prixAchat ?? 0,
        note: motif,
      },
    });
    if (reference) {
      await tx.mouvement.deleteMany({
        where: {
          articleId: ligne.articleId,
          type: 'SORTIE',
          note: { contains: reference },
        },
      });
    }
  }
}

// Annule une commande non confirmée et restitue son stock.
// `vendeurId` est null pour l'expiration automatique (système).
export async function annulerCommande(
  commandeId: string,
  vendeurId: string | null,
  par: 'vendeuse' | 'systeme'
): Promise<{ error?: string; status?: number }> {
  const commande = vendeurId
    ? await db.commande.findFirst({ where: { id: commandeId, vendeurId } })
    : await db.commande.findUnique({ where: { id: commandeId } });
  if (!commande) return { error: 'Commande introuvable', status: 404 };
  if (commande.statut === 'CONFIRMEE') {
    return { error: "Impossible d'annuler une commande déjà confirmée", status: 409 };
  }
  if (commande.statut === 'ANNULEE') {
    return { error: 'Cette commande est déjà annulée', status: 409 };
  }

  const motif =
    par === 'systeme'
      ? `Expiration auto commande ${commande.id.slice(0, 8).toUpperCase()} : paiement non recu sous 2h`
      : `Annulation commande ${commande.id.slice(0, 8).toUpperCase()} (vendeuse)`;

  await getDbDirect().$transaction(async (tx) => {
    // Garde de statut re-vérifiée dans la transaction : deux annulations
    // simultanées (vendeuse + expiration) ne peuvent pas doubler la restitution.
    const res = await tx.commande.updateMany({
      where: {
        id: commandeId,
        statut: { in: ['EN_ATTENTE_PAIEMENT', 'EN_ATTENTE_VALIDATION'] },
      },
      data: { statut: 'ANNULEE' },
    });
    if (res.count === 0) return; // déjà annulée/confirmée entre-temps
    await restaurerStockCommande(tx, commandeId, motif);
  });

  return {};
}

// Libère le stock des commandes restées en attente de paiement trop
// longtemps. Appelée par le cron /api/ping et à l'ouverture de la liste
// des commandes côté vendeuse.
export async function expirerCommandesPerimees(): Promise<number> {
  const limite = new Date(Date.now() - DELAI_EXPIRATION_MS);
  const perimees = await db.commande.findMany({
    where: { statut: 'EN_ATTENTE_PAIEMENT', creeLe: { lt: limite } },
    select: { id: true },
    take: 50,
  });
  let expirees = 0;
  for (const c of perimees) {
    const res = await annulerCommande(c.id, null, 'systeme');
    if (!res.error) expirees++;
  }
  return expirees;
}
