'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD } from '@/lib/constants/auth';
import { ADMIN_SESSION_COOKIE, ADMIN_SESSION_MAX_AGE, createSessionToken } from '@/lib/auth/session';

export type LoginState = {
  error?: string;
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
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: ADMIN_SESSION_MAX_AGE,
    path: '/'
  });

  redirect(redirectTo);
}
