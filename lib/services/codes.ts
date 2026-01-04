import { createAdminClient } from '@/lib/supabase/server';
import { deriveCodeStatus, generatePlainCode, hashCode } from '@/lib/codes';
import { BULK_GENERATION_LIMIT, UNLIMITED_MAX_USES } from '@/lib/constants/codes';
import type { AccessCode } from '@/types/database';
import type {
  CodeBatchSummary,
  CodeFilters,
  CodeListResponse,
  CreateCodeInput,
  CreateCodeResult,
  UpdateCodeInput,
  UiCode
} from '@/types/codes';

const DEFAULT_PAGE_SIZE = 20;
const MAX_STATUS_FILTER_FETCH = 1000;

export function maskHash(hash: string) {
  return `${hash.slice(0, 3)}****${hash.slice(-3)}`;
}

export function formatDisplayCode(code: AccessCode) {
  return code.plain_code?.trim() || maskHash(code.code_hash);
}

function mapToUi(code: AccessCode): UiCode {
  const status = deriveCodeStatus(code);
  const usageMaxLabel = code.max_uses >= UNLIMITED_MAX_USES ? '∞' : String(code.max_uses);
  return {
    id: code.id,
    displayCode: formatDisplayCode(code),
    status,
    expiresAt: code.expires_at,
    usage: `${code.used_count}/${usageMaxLabel}`,
    description: code.description
  };
}

/**
 * 获取验证码列表（带分页和过滤）
 */
export async function listCodes(filters: CodeFilters = {}): Promise<CodeListResponse> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(50, filters.pageSize ?? DEFAULT_PAGE_SIZE);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = createAdminClient();

  const buildQuery = () => {
    let query = supabase.from('access_codes').select('*', { count: 'exact' }).order('created_at', { ascending: false });
    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      query = query.ilike('description', searchTerm);
    }
    if (filters.expiresFrom) {
      query = query.gte('expires_at', filters.expiresFrom);
    }
    if (filters.expiresTo) {
      query = query.lte('expires_at', filters.expiresTo);
    }
    return query;
  };

  if (filters.status && filters.status !== 'all') {
    const { data, error } = await buildQuery().limit(MAX_STATUS_FILTER_FETCH);
    if (error) throw error;
    const rows = ((data as AccessCode[]) ?? []).map(mapToUi).filter((code) => code.status === filters.status);
    const sliced = rows.slice(from, to + 1);
    return {
      items: sliced,
      total: rows.length
    };
  }

  const { data, error, count } = await buildQuery().range(from, to);
  if (error) throw error;
  const items = ((data as AccessCode[]) ?? []).map(mapToUi);

  return {
    items,
    total: count ?? 0
  };
}

/**
 * 创建验证码（随机生成或自定义）
 */
export async function createCode(payload: CreateCodeInput): Promise<CreateCodeResult> {
  const supabase = createAdminClient();
  const expiresAtISO = new Date(payload.expiresAt).toISOString();
  const description = payload.description?.trim() || null;
  const maxUses = Number.isFinite(payload.maxUses) && payload.maxUses > 0 ? payload.maxUses : UNLIMITED_MAX_USES;

  if (payload.mode === 'custom') {
    const plain = payload.plainCode?.trim().toUpperCase();
    if (!plain) {
      throw new Error('自定义验证码不能为空');
    }
    if (plain.length < 6) {
      throw new Error('验证码至少 6 位');
    }
    const codeHash = await hashCode(plain);
    const { data, error } = await supabase
      .from('access_codes')
      .insert({
        code_hash: codeHash,
        plain_code: plain,
        expires_at: expiresAtISO,
        max_uses: maxUses,
        description
      })
      .select('id, created_at')
      .single();
    if (error) throw error;
    return { ids: [data.id], plainCodes: [plain], batchCreatedAt: data.created_at };
  }

  const quantity = Math.min(BULK_GENERATION_LIMIT, Math.max(1, payload.quantity ?? 1));
  const plainCodes = Array.from({ length: quantity }, () => generatePlainCode());
  const rows = await Promise.all(
    plainCodes.map(async (plain) => ({
      code_hash: await hashCode(plain),
      plain_code: plain,
      expires_at: expiresAtISO,
      max_uses: maxUses,
      description
    }))
  );

  const { data, error } = await supabase
    .from('access_codes')
    .insert(rows)
    .select('id, created_at');

  if (error) throw error;
  const inserted = (data as AccessCode[]) ?? [];
  return {
    ids: inserted.map((row) => row.id),
    plainCodes,
    batchCreatedAt: inserted[0]?.created_at ?? new Date().toISOString()
  };
}

/**
 * 更新验证码信息
 */
export async function updateCode(id: string, patch: UpdateCodeInput) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('access_codes')
    .update({
      expires_at: patch.expires_at ? new Date(patch.expires_at).toISOString() : undefined,
      max_uses: patch.max_uses,
      description: patch.description
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return mapToUi(data as AccessCode);
}

/**
 * 删除验证码
 */
export async function deleteCode(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('access_codes').delete().eq('id', id);
  if (error) throw error;
}

/**
 * 获取最近的批次列表
 */
export async function listRecentBatches(limit = 20): Promise<CodeBatchSummary[]> {
  const supabase = createAdminClient();
  const fetchLimit = limit * 20;
  const { data, error } = await supabase
    .from('access_codes')
    .select('id, created_at')
    .order('created_at', { ascending: false })
    .limit(fetchLimit);
  if (error) throw error;

  const groups = new Map<string, CodeBatchSummary>();
  (data as AccessCode[]).forEach((record) => {
    if (!record?.created_at) return;
    const key = record.created_at;
    const existing = groups.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      groups.set(key, { createdAt: key, count: 1 });
    }
  });

  return Array.from(groups.values())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}
