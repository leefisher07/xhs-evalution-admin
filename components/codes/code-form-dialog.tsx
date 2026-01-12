'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { format, addDays } from 'date-fns';
import { createCodeAction, updateCodeAction } from '@/app/(protected)/codes/actions';
import type { UiCode } from '@/types/codes';
import { UNLIMITED_MAX_USES } from '@/lib/constants/codes';

interface CodeFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingCode?: UiCode | null;
}

export function CodeFormDialog({
  isOpen,
  onClose,
  onSuccess,
  editingCode
}: CodeFormDialogProps) {
  const isEditMode = !!editingCode;

  // 表单状态
  const [mode, setMode] = useState<'random' | 'custom'>('random');
  const [quantity, setQuantity] = useState(1);
  const [plainCode, setPlainCode] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [maxUses, setMaxUses] = useState<number | ''>(10);
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // 初始化编辑模式数据
  useEffect(() => {
    if (isEditMode && editingCode) {
      // 编辑模式下，从 expiresAt 字符串解析
      if (editingCode.expiresAt) {
        const date = new Date(editingCode.expiresAt);
        setExpiresAt(format(date, "yyyy-MM-dd'T'HH:mm"));
      }

      // 解析使用次数
      const usageParts = editingCode.usage.split('/');
      const maxUsesValue = usageParts[1];
      if (maxUsesValue === '∞') {
        setIsUnlimited(true);
        setMaxUses('');
      } else {
        setIsUnlimited(false);
        setMaxUses(parseInt(maxUsesValue, 10) || 10);
      }

      setDescription(editingCode.description || '');
    } else {
      // 创建模式下，默认72小时后过期
      const defaultExpiry = addDays(new Date(), 3);
      setExpiresAt(format(defaultExpiry, "yyyy-MM-dd'T'HH:mm"));
    }
  }, [isEditMode, editingCode]);

  // 重置表单
  const resetForm = () => {
    setMode('random');
    setQuantity(1);
    setPlainCode('');
    const defaultExpiry = addDays(new Date(), 3);
    setExpiresAt(format(defaultExpiry, "yyyy-MM-dd'T'HH:mm"));
    setMaxUses(10);
    setIsUnlimited(false);
    setDescription('');
    setError('');
    setSuccessMessage('');
    setIsSubmitting(false);
  };

  // 处理关闭
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // 表单验证
  const validateForm = () => {
    if (!isEditMode) {
      if (mode === 'custom' && !plainCode.trim()) {
        setError('请输入验证码');
        return false;
      }
      if (mode === 'custom' && plainCode.trim().length < 6) {
        setError('验证码至少需要 6 位');
        return false;
      }
      if (mode === 'random' && (quantity < 1 || quantity > 100)) {
        setError('生成数量必须在 1-100 之间');
        return false;
      }
    }

    if (!expiresAt) {
      setError('请选择过期时间');
      return false;
    }

    if (!isUnlimited && (maxUses === '' || maxUses < 1)) {
      setError('使用次数至少为 1');
      return false;
    }

    return true;
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      if (isEditMode && editingCode) {
        // 编辑模式
        const result = await updateCodeAction(editingCode.id, {
          expires_at: expiresAt,
          max_uses: isUnlimited ? UNLIMITED_MAX_USES : (maxUses as number),
          description: description.trim() || undefined
        });

        if (!result) {
          setError('服务器响应异常，请刷新页面后重试');
          return;
        }

        if (result.success) {
          setSuccessMessage('message' in result ? result.message : '更新成功');
          setTimeout(() => {
            onSuccess();
            handleClose();
          }, 1000);
        } else {
          setError('error' in result ? result.error : '更新失败');
        }
      } else {
        // 创建模式
        const result = await createCodeAction({
          mode,
          quantity: mode === 'random' ? quantity : undefined,
          plainCode: mode === 'custom' ? plainCode.trim().toUpperCase() : undefined,
          expiresAt,
          maxUses: isUnlimited ? UNLIMITED_MAX_USES : (maxUses as number),
          description: description.trim() || undefined
        });

        if (!result) {
          setError('服务器响应异常，请刷新页面后重试');
          return;
        }

        if (result.success) {
          setSuccessMessage('message' in result ? result.message : '创建成功');
          setTimeout(() => {
            onSuccess();
            handleClose();
          }, 1000);
        } else {
          setError('error' in result ? result.error : '创建失败');
        }
      }
    } catch (err: any) {
      setError(err.message || '操作失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-start justify-between">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    {isEditMode ? '编辑验证码' : '创建验证码'}
                  </Dialog.Title>
                  <button
                    type="button"
                    className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={handleClose}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                  {/* 创建模式选择（仅创建时显示） */}
                  {!isEditMode && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        创建模式
                      </label>
                      <div className="mt-2 flex gap-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            value="random"
                            checked={mode === 'random'}
                            onChange={(e) => setMode(e.target.value as 'random')}
                            className="mr-2 h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">随机生成</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            value="custom"
                            checked={mode === 'custom'}
                            onChange={(e) => setMode(e.target.value as 'custom')}
                            className="mr-2 h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">自定义</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* 随机生成数量 */}
                  {!isEditMode && mode === 'random' && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        生成数量 (1-100)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                        className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                  )}

                  {/* 自定义验证码 */}
                  {!isEditMode && mode === 'custom' && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        验证码 (至少6位)
                      </label>
                      <input
                        type="text"
                        value={plainCode}
                        onChange={(e) => setPlainCode(e.target.value.toUpperCase())}
                        placeholder="例如：ABC123"
                        className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 font-mono shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                  )}

                  {/* 过期时间 */}
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      过期时间
                    </label>
                    <input
                      type="datetime-local"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                    />
                  </div>

                  {/* 使用次数 */}
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      最大使用次数
                    </label>
                    <div className="mt-2 flex items-center gap-4">
                      <input
                        type="number"
                        min="1"
                        value={maxUses}
                        onChange={(e) => setMaxUses(parseInt(e.target.value, 10) || '')}
                        disabled={isUnlimited}
                        className="block w-32 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 sm:text-sm"
                      />
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={isUnlimited}
                          onChange={(e) => setIsUnlimited(e.target.checked)}
                          className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">不限次数</span>
                      </label>
                    </div>
                  </div>

                  {/* 备注 */}
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      备注（可选）
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      placeholder="例如：2024年春季推广活动"
                      className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                    />
                  </div>

                  {/* 错误提示 */}
                  {error && (
                    <div className="rounded-md bg-red-50 p-4">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  )}

                  {/* 成功提示 */}
                  {successMessage && (
                    <div className="rounded-md bg-green-50 p-4">
                      <p className="text-sm text-green-800">{successMessage}</p>
                    </div>
                  )}

                  {/* 按钮组 */}
                  <div className="flex justify-end gap-3 border-t pt-4">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isSubmitting}
                      className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                      {isSubmitting ? '提交中...' : isEditMode ? '保存' : '创建'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
