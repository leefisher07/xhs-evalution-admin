'use client';

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export interface FilterValues {
  search: string;
  status: 'all' | 'active' | 'inactive';
}

interface CodeFiltersProps {
  filters: FilterValues;
  onFilterChange: (filters: FilterValues) => void;
}

export function CodeFilters({ filters, onFilterChange }: CodeFiltersProps) {
  const handleSearchChange = (search: string) => {
    onFilterChange({ ...filters, search });
  };

  const handleStatusChange = (status: FilterValues['status']) => {
    onFilterChange({ ...filters, status });
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* 搜索框 */}
      <div className="relative flex-1 max-w-md">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="搜索备注..."
          value={filters.search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="block w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* 状态过滤 */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">状态：</span>
        <div className="flex gap-2">
          <button
            onClick={() => handleStatusChange('all')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              filters.status === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            全部
          </button>
          <button
            onClick={() => handleStatusChange('active')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              filters.status === 'active'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            启用
          </button>
          <button
            onClick={() => handleStatusChange('inactive')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              filters.status === 'inactive'
                ? 'bg-gray-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            停用
          </button>
        </div>
      </div>
    </div>
  );
}
