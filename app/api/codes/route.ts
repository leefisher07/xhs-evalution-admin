import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { listCodes, createCode } from '@/lib/services/codes';
import { ADMIN_SESSION_COOKIE, isValidSession } from '@/lib/auth/session';
import type { CodeFilters, CreateCodeInput } from '@/types/codes';

/**
 * GET /api/codes - 获取验证码列表
 */
export async function GET(request: Request) {
  const authResponse = await ensureAuthorized();
  if (authResponse) return authResponse;

  const { searchParams } = new URL(request.url);
  const filters: CodeFilters = {
    page: Number(searchParams.get('page') ?? '1'),
    pageSize: Number(searchParams.get('pageSize') ?? '20'),
    search: searchParams.get('search') ?? undefined,
    status: (searchParams.get('status') as CodeFilters['status']) ?? 'all',
    expiresFrom: searchParams.get('expiresFrom') ?? undefined,
    expiresTo: searchParams.get('expiresTo') ?? undefined
  };

  try {
    const result = await listCodes(filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[codes][GET]', error);
    return NextResponse.json({ message: '获取验证码失败', details: String(error) }, { status: 500 });
  }
}

/**
 * POST /api/codes - 创建验证码
 */
export async function POST(request: Request) {
  const authResponse = await ensureAuthorized();
  if (authResponse) return authResponse;

  try {
    const body = (await request.json()) as CreateCodeInput;
    const result = await createCode(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('[codes][POST]', error);
    return NextResponse.json({ message: '创建验证码失败', details: String(error) }, { status: 400 });
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
