import { subDays, addDays, formatISO, parseISO } from 'date-fns';
import { getDbPool } from '@/lib/supabase/server';
import { deriveCodeStatus } from '@/lib/codes';
import { formatDisplayCode } from '@/lib/services/codes';
import { UNLIMITED_MAX_USES } from '@/lib/constants/codes';
import type { DashboardPayload, DashboardGeneration, DashboardStats, TrendPoint, RecentCode } from '@/types/dashboard';
import type { AccessCode } from '@/types/database';

type EnrichedCode = AccessCode & {
  status: 'active' | 'inactive';
  mode: 'random' | 'custom';
};

/**
 * 获取仪表盘数据（统计、趋势、最近记录等）
 */
export async function fetchDashboardData(): Promise<DashboardPayload> {
  const pool = getDbPool();
  const now = new Date();
  const expiringThreshold = addDays(now, 7);

  const query = `
    SELECT id, code_hash, plain_code, expires_at, used_count, max_uses, description, created_at
    FROM access_codes
    ORDER BY created_at DESC
  `;

  const result = await pool.query<AccessCode>(query);
  const rows = result.rows ?? [];
  const groupedByCreatedAt = rows.reduce<Record<string, AccessCode[]>>((acc, record) => {
    const key = record.created_at;
    if (!acc[key]) acc[key] = [];
    acc[key].push(record);
    return acc;
  }, {});

  const determinateMode = (createdAt: string) => {
    const groupSize = groupedByCreatedAt[createdAt]?.length ?? 0;
    return groupSize > 1 ? 'random' : 'custom';
  };

  const enriched: EnrichedCode[] = rows.map((code) => ({
    ...code,
    status: deriveCodeStatus(code),
    mode: determinateMode(code.created_at)
  }));

  const limitedCodes = enriched.filter((row) => row.max_uses < UNLIMITED_MAX_USES);
  const limitedMax = limitedCodes.reduce((sum, row) => sum + row.max_uses, 0);
  const limitedUsed = limitedCodes.reduce((sum, row) => sum + row.used_count, 0);
  const usageRate =
    limitedMax > 0 ? Math.min(100, Math.round((limitedUsed / limitedMax) * 100)) : null;

  const stats: DashboardStats = {
    total: enriched.length,
    active: enriched.filter((row) => row.status === 'active').length,
    expiringSoon: enriched.filter(
      (row) => row.status === 'active' && new Date(row.expires_at) <= expiringThreshold
    ).length,
    usageRate
  };

  const trendStart = subDays(now, 6);
  const trendBuckets: Record<string, number> = {};
  for (let i = 0; i < 7; i += 1) {
    const date = formatISO(subDays(now, 6 - i), { representation: 'date' });
    trendBuckets[date] = 0;
  }
  enriched.forEach((row) => {
    const createdAt = parseISO(row.created_at);
    if (createdAt < trendStart) {
      return;
    }
    const createdDate = formatISO(createdAt, { representation: 'date' });
    if (trendBuckets[createdDate] !== undefined) {
      trendBuckets[createdDate] += 1;
    }
  });
  const trend: TrendPoint[] = Object.entries(trendBuckets).map(([date, count]) => ({ date, count }));

  const batchEntries = Object.entries(groupedByCreatedAt).sort(
    ([a], [b]) => new Date(b).getTime() - new Date(a).getTime()
  );

  let batches7d = 0;
  let customs7d = 0;
  batchEntries.forEach(([createdAt, records]) => {
    if (new Date(createdAt) < trendStart) return;
    if (records.length > 1) {
      batches7d += 1;
    } else {
      customs7d += 1;
    }
  });

  const latestBatch = batchEntries[0];
  const generation: DashboardGeneration = {
    lastBatchAt: latestBatch ? latestBatch[0] : null,
    lastBatchCount: latestBatch ? latestBatch[1].length : 0,
    lastBatchMode: latestBatch ? (latestBatch[1].length > 1 ? 'random' : 'custom') : null,
    batches7d,
    customs7d
  };

  const recent: RecentCode[] = enriched.slice(0, 5).map((code) => ({
    id: code.id,
    displayCode: formatDisplayCode(code),
    status: code.status,
    expiresAt: code.expires_at,
    usage: `${code.used_count}/${code.max_uses >= UNLIMITED_MAX_USES ? '∞' : code.max_uses}`,
    description: code.description ?? null,
    mode: code.mode
  }));

  return { stats, trend, recent, generation };
}
