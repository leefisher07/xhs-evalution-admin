'use server';

import { revalidatePath } from 'next/cache';
import { createCode, deleteCode, listCodes, updateCode } from '@/lib/services/codes';
import type { CodeFilters, CreateCodeInput, UpdateCodeInput } from '@/types/codes';

/**
 * Server Action: 获取验证码列表
 */
export async function getCodesAction(filters?: CodeFilters) {
  try {
    const result = await listCodes(filters);
    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to fetch codes:', error);
    return { success: false, error: '获取验证码列表失败' };
  }
}

/**
 * Server Action: 创建验证码
 */
export async function createCodeAction(input: CreateCodeInput) {
  console.log('[createCodeAction] Called with input:', input);
  try {
    const result = await createCode(input);
    console.log('[createCodeAction] Success, created:', result.plainCodes?.length || 1, 'codes');
    revalidatePath('/codes');
    revalidatePath('/dashboard'); // 刷新仪表盘数据
    const response = {
      success: true,
      data: result,
      message: input.mode === 'random'
        ? `成功生成 ${result.plainCodes.length} 个验证码`
        : '验证码创建成功'
    };
    console.log('[createCodeAction] Returning response:', response);
    return response;
  } catch (error: any) {
    console.error('[createCodeAction] Error:', error);
    const errorResponse = { success: false, error: error.message || '创建验证码失败' };
    console.log('[createCodeAction] Returning error response:', errorResponse);
    return errorResponse;
  }
}

/**
 * Server Action: 更新验证码
 */
export async function updateCodeAction(id: string, patch: UpdateCodeInput) {
  console.log('[updateCodeAction] Called with id:', id, 'patch:', patch);
  try {
    await updateCode(id, patch);
    console.log('[updateCodeAction] Success');
    revalidatePath('/codes');
    revalidatePath('/dashboard'); // 刷新仪表盘数据
    const response = { success: true, message: '验证码更新成功' };
    console.log('[updateCodeAction] Returning response:', response);
    return response;
  } catch (error: any) {
    console.error('[updateCodeAction] Error:', error);
    const errorResponse = { success: false, error: error.message || '更新验证码失败' };
    console.log('[updateCodeAction] Returning error response:', errorResponse);
    return errorResponse;
  }
}

/**
 * Server Action: 删除验证码
 */
export async function deleteCodeAction(id: string) {
  try {
    await deleteCode(id);
    revalidatePath('/codes');
    revalidatePath('/dashboard'); // 刷新仪表盘数据
    return { success: true, message: '验证码删除成功' };
  } catch (error: any) {
    console.error('Failed to delete code:', error);
    return { success: false, error: error.message || '删除验证码失败' };
  }
}
