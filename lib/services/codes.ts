import { getDbPool } from '@/lib/supabase/server';
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
  const pool = getDbPool();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(50, filters.pageSize ?? DEFAULT_PAGE_SIZE);
  const offset = (page - 1) * pageSize;

  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (filters.search) {
    conditions.push(`description ILIKE $${paramIndex}`);
    params.push(`%${filters.search}%`);
    paramIndex++;
  }
  if (filters.expiresFrom) {
    conditions.push(`expires_at >= $${paramIndex}`);
    params.push(filters.expiresFrom);
    paramIndex++;
  }
  if (filters.expiresTo) {
    conditions.push(`expires_at <= $${paramIndex}`);
    params.push(filters.expiresTo);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  if (filters.status && filters.status !== 'all') {
    const query = `
      SELECT * FROM access_codes
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex}
    `;
    params.push(MAX_STATUS_FILTER_FETCH);

    const result = await pool.query<AccessCode>(query, params);
    const normalizedRows = result.rows.map(row => ({
      ...row,
      expires_at: typeof row.expires_at === 'string' ? row.expires_at : (row.expires_at as Date).toISOString(),
      created_at: typeof row.created_at === 'string' ? row.created_at : (row.created_at as Date).toISOString()
    }));
    const rows = normalizedRows.map(mapToUi).filter((code) => code.status === filters.status);
    const sliced = rows.slice(offset, offset + pageSize);
    return {
      items: sliced,
      total: rows.length
    };
  }

  const countQuery = `SELECT COUNT(*) FROM access_codes ${whereClause}`;
  const dataQuery = `
    SELECT * FROM access_codes
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;
  params.push(pageSize, offset);

  const [countResult, dataResult] = await Promise.all([
    pool.query(countQuery, params.slice(0, paramIndex - 1)),
    pool.query<AccessCode>(dataQuery, params)
  ]);

  const normalizedRows = dataResult.rows.map(row => ({
    ...row,
    expires_at: typeof row.expires_at === 'string' ? row.expires_at : (row.expires_at as Date).toISOString(),
    created_at: typeof row.created_at === 'string' ? row.created_at : (row.created_at as Date).toISOString()
  }));
  const items = normalizedRows.map(mapToUi);

  return {
    items,
    total: parseInt(countResult.rows[0]?.count || '0', 10)
  };
}

/**
 * 创建验证码（随机生成或自定义）
 */
export async function createCode(payload: CreateCodeInput): Promise<CreateCodeResult> {
  const pool = getDbPool();
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
    const query = `
      INSERT INTO access_codes (code_hash, plain_code, expires_at, max_uses, description)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, created_at
    `;
    const result = await pool.query(query, [codeHash, plain, expiresAtISO, maxUses, description]);
    const row = result.rows[0];
    const normalizedCreatedAt = typeof row.created_at === 'string' ? row.created_at : (row.created_at as Date).toISOString();
    return { ids: [row.id], plainCodes: [plain], batchCreatedAt: normalizedCreatedAt };
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

  const values = rows.map((_, i) => {
    const base = i * 5;
    return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`;
  }).join(', ');

  const params = rows.flatMap(r => [r.code_hash, r.plain_code, r.expires_at, r.max_uses, r.description]);

  const query = `
    INSERT INTO access_codes (code_hash, plain_code, expires_at, max_uses, description)
    VALUES ${values}
    RETURNING id, created_at
  `;

  const result = await pool.query(query, params);
  const firstRow = result.rows[0];
  const normalizedCreatedAt = firstRow && typeof firstRow.created_at === 'string'
    ? firstRow.created_at
    : (firstRow?.created_at as Date)?.toISOString() ?? new Date().toISOString();

  return {
    ids: result.rows.map((row) => row.id),
    plainCodes,
    batchCreatedAt: normalizedCreatedAt
  };
}

/**
 * 更新验证码信息
 */
export async function updateCode(id: string, patch: UpdateCodeInput) {
  const pool = getDbPool();
  const updates: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (patch.expires_at) {
    updates.push(`expires_at = $${paramIndex}`);
    params.push(new Date(patch.expires_at).toISOString());
    paramIndex++;
  }
  if (patch.max_uses !== undefined) {
    updates.push(`max_uses = $${paramIndex}`);
    params.push(patch.max_uses);
    paramIndex++;
  }
  if (patch.description !== undefined) {
    updates.push(`description = $${paramIndex}`);
    params.push(patch.description);
    paramIndex++;
  }

  if (updates.length === 0) {
    throw new Error('No fields to update');
  }

  const query = `
    UPDATE access_codes
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;
  params.push(id);

  const result = await pool.query<AccessCode>(query, params);
  if (result.rows.length === 0) {
    throw new Error('Code not found');
  }
  const row = result.rows[0];
  const normalizedRow = {
    ...row,
    expires_at: typeof row.expires_at === 'string' ? row.expires_at : (row.expires_at as Date).toISOString(),
    created_at: typeof row.created_at === 'string' ? row.created_at : (row.created_at as Date).toISOString()
  };
  return mapToUi(normalizedRow);
}

/**
 * 删除验证码
 */
export async function deleteCode(id: string) {
  const pool = getDbPool();
  const query = 'DELETE FROM access_codes WHERE id = $1';
  await pool.query(query, [id]);
}

/**
 * 获取最近的批次列表
 */
export async function listRecentBatches(limit = 20): Promise<CodeBatchSummary[]> {
  const pool = getDbPool();
  const fetchLimit = limit * 20;
  const query = `
    SELECT id, created_at
    FROM access_codes
    ORDER BY created_at DESC
    LIMIT $1
  `;

  const result = await pool.query<AccessCode>(query, [fetchLimit]);

  const groups = new Map<string, CodeBatchSummary>();
  result.rows.forEach((record) => {
    if (!record?.created_at) return;
    const normalizedCreatedAt = typeof record.created_at === 'string'
      ? record.created_at
      : (record.created_at as Date).toISOString();
    const key = normalizedCreatedAt;
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
