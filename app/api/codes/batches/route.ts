import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { listRecentBatches } from '@/lib/services/codes';
import { ADMIN_SESSION_COOKIE, isValidSession } from '@/lib/auth/session';

/**
 * GET /api/codes/batches - 获取最近批次列表
 */
export async function GET() {
  const authResponse = await ensureAuthorized();
  if (authResponse) return authResponse;

  try {
    const result = await listRecentBatches();
    return NextResponse.json(result);
  } catch (error) {
    console.error('[codes/batches][GET]', error);
    return NextResponse.json({ message: '获取批次列表失败', details: String(error) }, { status: 500 });
  }
}

async function ensureAuthorized() {
  const cookieStore = cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!(await isValidSession(token))) {
    return NextResponse.json({ message: '未授权访问' }, { status: 401 });
  }
  return undefined;
}
