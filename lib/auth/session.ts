import { DEFAULT_ADMIN_EMAIL } from '@/lib/constants/auth';

export const ADMIN_SESSION_COOKIE = 'xhs_admin_session';
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 6; // 6 hours

const SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET ??
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  'xhs-admin-fallback-secret';

const encoder = new TextEncoder();

async function sha256(value: string) {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Web Crypto API is not available to hash session tokens.');
  }
  const buffer = await globalThis.crypto.subtle.digest('SHA-256', encoder.encode(value));
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function safeEqual(expected: string, received: string) {
  if (expected.length !== received.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i += 1) {
    diff |= expected.charCodeAt(i) ^ received.charCodeAt(i);
  }
  return diff === 0;
}

async function expectedToken() {
  return sha256(`${DEFAULT_ADMIN_EMAIL}:${SESSION_SECRET}`);
}

export async function createSessionToken() {
  return expectedToken();
}

export async function isValidSession(token?: string | null) {
  if (!token) return false;
  const expected = await expectedToken();
  return safeEqual(expected, token);
}
