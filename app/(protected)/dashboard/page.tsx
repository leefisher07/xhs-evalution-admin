import { Suspense } from 'react';
import { fetchDashboardData } from '@/lib/services/dashboard';

async function DashboardContent() {
  const data = await fetchDashboardData();

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="text-sm font-medium text-gray-500">验证码总数</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">{data.stats.total}</div>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="text-sm font-medium text-gray-500">活跃验证码</div>
          <div className="mt-2 text-3xl font-bold text-green-600">{data.stats.active}</div>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="text-sm font-medium text-gray-500">即将过期</div>
          <div className="mt-2 text-3xl font-bold text-orange-600">{data.stats.expiringSoon}</div>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="text-sm font-medium text-gray-500">使用率</div>
          <div className="mt-2 text-3xl font-bold text-blue-600">
            {data.stats.usageRate !== null ? `${data.stats.usageRate}%` : 'N/A'}
          </div>
        </div>
      </div>

      {/* 最近记录 */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="text-lg font-semibold text-gray-900">最近创建</h3>
        <div className="mt-4 space-y-3">
          {data.recent.map((code) => (
            <div key={code.id} className="flex items-center justify-between border-b pb-3">
              <div>
                <div className="font-mono text-sm font-medium">{code.displayCode}</div>
                <div className="text-xs text-gray-500">{code.description || '无备注'}</div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-medium ${code.status === 'active' ? 'text-green-600' : 'text-gray-400'}`}>
                  {code.status === 'active' ? '活跃' : '停用'}
                </div>
                <div className="text-xs text-gray-500">{code.usage}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase text-gray-500">仪表盘</p>
        <h2 className="text-2xl font-semibold text-gray-900">运营概览</h2>
      </div>
      <Suspense fallback={<p className="text-sm text-gray-500">载入概览...</p>}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
