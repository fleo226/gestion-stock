// ============================================================
// Session signée (audit S1) — un cookie httpOnly contenant un JWT
// signé avec SESSION_SECRET. Aucune donnée dérivable d'un identifiant
// public n'authentifie plus une requête.
// SESSION_SECRET doit exister : l'application refuse de démarrer sans
// elle (aucune valeur par défaut, volontairement).
// ============================================================
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { db } from './db';

export const SESSION_COOKIE = 'session';
// Ancien cookie non signé (audit S1) : il est supprimé à la connexion
// et à la déconnexion, et n'est plus jamais lu.
export const LEGACY_COOKIE = 'userId';

const secretValue = process.env.SESSION_SECRET;
if (!secretValue || secretValue.length < 32) {
  throw new Error(
    'SESSION_SECRET manquante ou trop courte : 32 caractères minimum requis. ' +
      'Aucune valeur par défaut nest utilisée volontairement.'
  );
}
const secretKey = new TextEncoder().encode(secretValue);

const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 jours

export type SessionUser = {
  id: string;
  email: string;
  nom: string;
  couleur: string;
};

export async function signSessionToken(userId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secretKey);
}

export async function setSessionCookie(userId: string): Promise<void> {
  const token = await signSessionToken(userId);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
  // Supprime l'ancien cookie non signé s'il traîne encore
  cookieStore.delete(LEGACY_COOKIE);
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete(LEGACY_COOKIE);
}

// Unique point de lecture de session pour toute l'application.
// Toute valeur invalide, expirée, falsifiée ou inconnue renvoie null.
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey, { algorithms: ['HS256'] });
    const userId = typeof payload.sub === 'string' ? payload.sub : null;
    if (!userId) return null;
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, nom: true, couleur: true },
    });
    return user ?? null;
  } catch {
    return null;
  }
}
