'use client';

import { useState } from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { UiCode } from '@/types/codes';
import { DeleteConfirmDialog } from './delete-confirm-dialog';
import { deleteCodeAction } from '@/app/(protected)/codes/actions';

interface CodeTableProps {
  codes: UiCode[];
  onEdit: (code: UiCode) => void;
  onDeleteSuccess: () => void;
}

export function CodeTable({ codes, onEdit, onDeleteSuccess }: CodeTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (code: UiCode) => {
    setDeletingId(code.id);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;

    setIsDeleting(true);
    try {
      const result = await deleteCodeAction(deletingId);
      if (result.success) {
        setDeletingId(null);
        onDeleteSuccess();
      } else {
        alert(result.error || '删除失败');
      }
    } catch (error) {
      alert('删除失败');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, 'yyyy-MM-dd HH:mm', { locale: zhCN });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return (
        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
          启用
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
        停用
      </span>
    );
  };

  if (codes.length === 0) {
    return (
      <div className="rounded-lg bg-white p-12 text-center shadow">
        <p className="text-gray-500">暂无验证码数据</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  验证码
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  状态
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  过期时间
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  使用情况
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  备注
                </th>
                <th
                  scope="col"
                  className="relative px-6 py-3"
                >
                  <span className="sr-only">操作</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {codes.map((code) => (
                <tr key={code.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="font-mono text-sm font-medium text-gray-900">
                      {code.displayCode}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {getStatusBadge(code.status)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {formatDate(code.expiresAt)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {code.usage}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="max-w-xs truncate">
                      {code.description || '-'}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => onEdit(code)}
                        className="text-blue-600 hover:text-blue-900"
                        title="编辑"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(code)}
                        className="text-red-600 hover:text-red-900"
                        title="删除"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 删除确认对话框 */}
      <DeleteConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDeleteConfirm}
        title="确认删除验证码"
        message="删除后无法恢复，确定要删除这个验证码吗？"
        isDeleting={isDeleting}
      />
    </>
  );
}
