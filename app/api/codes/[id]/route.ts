import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { updateCode, deleteCode } from '@/lib/services/codes';
import { ADMIN_SESSION_COOKIE, isValidSession } from '@/lib/auth/session';
import type { UpdateCodeInput } from '@/types/codes';

/**
 * PUT /api/codes/[id] - 更新验证码
 */
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const authResponse = await ensureAuthorized();
  if (authResponse) return authResponse;

  try {
    const body = (await request.json()) as UpdateCodeInput;
    const result = await updateCode(params.id, body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[codes][PUT]', error);
    return NextResponse.json({ message: '更新验证码失败', details: String(error) }, { status: 400 });
  }
}

/**
 * DELETE /api/codes/[id] - 删除验证码
 */
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const authResponse = await ensureAuthorized();
  if (authResponse) return authResponse;

  try {
    await deleteCode(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[codes][DELETE]', error);
    return NextResponse.json({ message: '删除验证码失败', details: String(error) }, { status: 400 });
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
