import type { AccessCode } from './database';

export type CodeFilters = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: 'all' | 'active' | 'inactive';
  expiresFrom?: string;
  expiresTo?: string;
};

export type UiCode = {
  id: string;
  displayCode: string;
  status: 'active' | 'inactive';
  expiresAt: string;
  usage: string;
  description: string | null;
};

export type CodeListResponse = {
  items: UiCode[];
  total: number;
};

export type CreateCodeInput = {
  mode: 'random' | 'custom';
  plainCode?: string;
  expiresAt: string;
  maxUses: number;
  quantity?: number;
  description?: string;
};

export type UpdateCodeInput = Partial<Pick<AccessCode, 'expires_at' | 'max_uses' | 'description'>>;

export type CreateCodeResult = {
  ids: string[];
  plainCodes: string[];
  batchCreatedAt: string;
};

export type CodeBatchSummary = {
  createdAt: string;
  count: number;
};

export type ExportRequestPayload = {
  content: 'all' | 'summary';
  scope: 'batch' | 'range';
  batchKey?: string;
  rangeStart?: string;
  rangeEnd?: string;
};
