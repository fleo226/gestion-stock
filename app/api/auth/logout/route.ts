import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST() {
  try {
    const session = await auth();
    if (session) {
      // The actual signOut is handled client-side via NextAuth
      // This endpoint just ensures the cookie is cleared server-side too
    }
    const response = NextResponse.json({ success: true });
    response.cookies.delete('userId');
    response.cookies.delete('next-auth.session-token');
    response.cookies.delete('__session');
    return response;
  } catch (error) {
    console.error('Erreur déconnexion:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}