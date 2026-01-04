import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { buildCodesWorkbook, type ExportPayload } from '@/lib/services/export';
import { ADMIN_SESSION_COOKIE, isValidSession } from '@/lib/auth/session';
import { DEFAULT_ADMIN_EMAIL } from '@/lib/constants/auth';

/**
 * POST /api/codes/export - 导出验证码Excel
 */
export async function POST(request: Request) {
  const authResponse = await ensureAuthorized();
  if (authResponse) return authResponse;

  try {
    const body = (await request.json()) as ExportPayload;
    const buffer = await buildCodesWorkbook({
      ...body,
      operator: DEFAULT_ADMIN_EMAIL,
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `verification-codes-${timestamp}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('[codes/export][POST]', error);
    return NextResponse.json({ message: '导出失败', details: String(error) }, { status: 500 });
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
