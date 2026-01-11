import { DEFAULT_ADMIN_EMAIL } from '@/lib/constants/auth';

export const ADMIN_SESSION_COOKIE = 'xhs_admin_session';
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 6; // 6 hours

const SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET ??
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  'xhs-admin-fallback-secret';

function sha256(value: string) {
  // 检查是否在浏览器/Edge 环境中
  if (typeof globalThis.crypto?.subtle !== 'undefined') {
    // 浏览器环境使用 Web Crypto API (异步)
    return new Promise((resolve, reject) => {
      const encoder = new TextEncoder();
      globalThis.crypto.subtle.digest('SHA-256', encoder.encode(value))
        .then(buffer => {
          resolve(Array.from(new Uint8Array(buffer))
            .map((byte) => byte.toString(16).padStart(2, '0'))
            .join(''));
        })
        .catch(reject);
    });
  } else {
    // Node.js 环境使用 crypto 模块 (同步)
    try {
      const crypto = require('crypto');
      return Promise.resolve(crypto.createHash('sha256').update(value).digest('hex'));
    } catch (error) {
      return Promise.reject(new Error('No suitable SHA-256 implementation found'));
    }
  }
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
