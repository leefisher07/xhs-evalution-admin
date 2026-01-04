'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_SESSION_COOKIE } from '@/lib/auth/session';

export async function logoutAction() {
  const cookieStore = cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
  redirect('/login');
}
