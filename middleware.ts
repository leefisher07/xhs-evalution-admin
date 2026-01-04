import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ADMIN_SESSION_COOKIE, isValidSession } from '@/lib/auth/session';

const PROTECTED_PREFIXES = ['/dashboard', '/codes'];
const AUTH_PREFIX = '/login';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const hasSession = await isValidSession(token);

  const pathname = req.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isAuthRoute = pathname.startsWith(AUTH_PREFIX);

  if (isProtected && !hasSession) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (isAuthRoute && hasSession) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    redirectUrl.searchParams.delete('redirectTo');
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next|.*\\.[\w]+$).*)']
};
