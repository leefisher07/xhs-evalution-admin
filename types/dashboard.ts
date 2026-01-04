export type DashboardStats = {
  total: number;
  active: number;
  expiringSoon: number;
  usageRate: number | null;
};

export type TrendPoint = {
  date: string;
  count: number;
};

export type RecentCode = {
  id: string;
  displayCode: string;
  status: 'active' | 'inactive';
  expiresAt: string;
  usage: string;
  description: string | null;
  mode: 'random' | 'custom';
};

export type DashboardGeneration = {
  lastBatchAt: string | null;
  lastBatchCount: number;
  lastBatchMode: 'random' | 'custom' | null;
  batches7d: number;
  customs7d: number;
};

export type DashboardPayload = {
  stats: DashboardStats;
  trend: TrendPoint[];
  recent: RecentCode[];
  generation: DashboardGeneration;
};
