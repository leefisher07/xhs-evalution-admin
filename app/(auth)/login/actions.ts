'use server';

import { cookies } from 'next/headers';
import { DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD } from '@/lib/constants/auth';
import { ADMIN_SESSION_COOKIE, ADMIN_SESSION_MAX_AGE, createSessionToken } from '@/lib/auth/session';

export type LoginState = {
  error?: string;
  success?: boolean;
  redirectTo?: string;
};

export async function loginAction(
  prevState: LoginState | undefined,
  formData: FormData
): Promise<LoginState | void> {
  const email = formData.get('email')?.toString().trim();
  const password = formData.get('password')?.toString();
  const redirectTo = formData.get('redirectTo')?.toString() || '/dashboard';

  if (!email || !password) {
    return { error: '请输入邮箱和密码' };
  }

  if (email !== DEFAULT_ADMIN_EMAIL || password !== DEFAULT_ADMIN_PASSWORD) {
    return { error: '账号或密码错误' };
  }

  const cookieStore = cookies();
  const token = await createSessionToken();

  console.log('[Login Action] Setting session cookie:', {
    token: token.substring(0, 10) + '...',
    path: '/',
    maxAge: ADMIN_SESSION_MAX_AGE,
    redirectTo
  });

  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: ADMIN_SESSION_MAX_AGE,
    path: '/'
  });

  console.log('[Login Action] Cookie set successfully, returning success');
  return {
    success: true,
    redirectTo
  };
}
