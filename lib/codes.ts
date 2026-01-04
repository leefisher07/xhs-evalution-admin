import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { AccessCode } from '@/types/database';

const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/**
 * 生成随机验证码
 * 使用易于识别的字符集，排除容易混淆的字符（I、L、O、0、1等）
 */
export function generatePlainCode(length = 12) {
  const bytes = crypto.randomBytes(length);
  const chars = [] as string[];
  for (let i = 0; i < length; i += 1) {
    const index = bytes[i] % alphabet.length;
    chars.push(alphabet[index]);
  }
  return chars.join('');
}

/**
 * 使用 bcrypt 哈希验证码
 */
export async function hashCode(plain: string) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

/**
 * 根据验证码的过期时间和使用次数判断状态
 */
export function deriveCodeStatus(code: Pick<AccessCode, 'expires_at' | 'used_count' | 'max_uses'>) {
  const now = Date.now();
  const expiresAt = new Date(code.expires_at).getTime();
  if (Number.isNaN(expiresAt) || expiresAt <= now) {
    return 'inactive';
  }
  if (code.used_count >= code.max_uses) {
    return 'inactive';
  }
  return 'active';
}
