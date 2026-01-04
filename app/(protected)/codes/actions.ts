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
  try {
    const result = await createCode(input);
    revalidatePath('/codes');
    revalidatePath('/dashboard'); // 刷新仪表盘数据
    return {
      success: true,
      data: result,
      message: input.mode === 'random'
        ? `成功生成 ${result.plainCodes.length} 个验证码`
        : '验证码创建成功'
    };
  } catch (error: any) {
    console.error('Failed to create code:', error);
    return { success: false, error: error.message || '创建验证码失败' };
  }
}

/**
 * Server Action: 更新验证码
 */
export async function updateCodeAction(id: string, patch: UpdateCodeInput) {
  try {
    await updateCode(id, patch);
    revalidatePath('/codes');
    revalidatePath('/dashboard'); // 刷新仪表盘数据
    return { success: true, message: '验证码更新成功' };
  } catch (error: any) {
    console.error('Failed to update code:', error);
    return { success: false, error: error.message || '更新验证码失败' };
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
