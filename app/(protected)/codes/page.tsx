'use client';

import { useState, useEffect } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { CodeTable } from '@/components/codes/code-table';
import { CodeFormDialog } from '@/components/codes/code-form-dialog';
import { CodeFilters, FilterValues } from '@/components/codes/code-filters';
import { Pagination } from '@/components/codes/pagination';
import { getCodesAction } from './actions';
import type { UiCode } from '@/types/codes';

const PAGE_SIZE = 20;

export default function CodesPage() {
  // 状态管理
  const [codes, setCodes] = useState<UiCode[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 对话框状态
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<UiCode | null>(null);

  // 过滤器状态
  const [filters, setFilters] = useState<FilterValues>({
    search: '',
    status: 'all'
  });

  // 加载验证码列表
  const loadCodes = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getCodesAction({
        page: currentPage,
        pageSize: PAGE_SIZE,
        search: filters.search || undefined,
        status: filters.status !== 'all' ? filters.status : undefined
      });

      if (result.success && result.data) {
        setCodes(result.data.items);
        setTotalItems(result.data.total);
      } else {
        setError(result.error || '加载失败');
      }
    } catch (err) {
      setError('加载验证码列表失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 初始加载和依赖变化时重新加载
  useEffect(() => {
    loadCodes();
  }, [currentPage, filters]);

  // 处理创建按钮点击
  const handleCreateClick = () => {
    setEditingCode(null);
    setIsFormOpen(true);
  };

  // 处理编辑按钮点击
  const handleEditClick = (code: UiCode) => {
    setEditingCode(code);
    setIsFormOpen(true);
  };

  // 处理表单成功提交
  const handleFormSuccess = () => {
    loadCodes();
  };

  // 处理删除成功
  const handleDeleteSuccess = () => {
    loadCodes();
  };

  // 处理过滤器变化
  const handleFilterChange = (newFilters: FilterValues) => {
    setFilters(newFilters);
    setCurrentPage(1); // 重置到第一页
  };

  // 处理页码变化
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 计算总页数
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase text-gray-500">验证码管理</p>
          <h2 className="text-2xl font-semibold text-gray-900">创建、筛选与导出</h2>
        </div>
        <button
          onClick={handleCreateClick}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <PlusIcon className="h-5 w-5" />
          创建验证码
        </button>
      </div>

      {/* 统计信息 */}
      <div className="rounded-lg bg-blue-50 p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-blue-800">
            当前共有 <span className="font-bold">{totalItems}</span> 个验证码
          </div>
          {filters.status !== 'all' && (
            <div className="text-sm text-blue-600">
              已筛选：{filters.status === 'active' ? '启用' : '停用'}
            </div>
          )}
        </div>
      </div>

      {/* 搜索和过滤 */}
      <CodeFilters filters={filters} onFilterChange={handleFilterChange} />

      {/* 错误提示 */}
      {error && (
        <div className="rounded-lg bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* 加载状态 */}
      {isLoading ? (
        <div className="rounded-lg bg-white p-12 text-center shadow">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-sm text-gray-500">加载中...</p>
        </div>
      ) : (
        <>
          {/* 验证码表格 */}
          <CodeTable
            codes={codes}
            onEdit={handleEditClick}
            onDeleteSuccess={handleDeleteSuccess}
          />

          {/* 分页 */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={PAGE_SIZE}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}

      {/* 创建/编辑对话框 */}
      <CodeFormDialog
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingCode(null);
        }}
        onSuccess={handleFormSuccess}
        editingCode={editingCode}
      />
    </div>
  );
}
