import { Buffer } from 'node:buffer';
import ExcelJS from 'exceljs';
import { getDbPool } from '@/lib/supabase/server';
import { deriveCodeStatus } from '@/lib/codes';
import { UNLIMITED_MAX_USES } from '@/lib/constants/codes';
import type { AccessCode } from '@/types/database';

export type ExportPayload = {
  content: 'all' | 'summary';
  scope: 'batch' | 'range';
  batchKey?: string;
  rangeStart?: string;
  rangeEnd?: string;
};

export type ExportOptions = ExportPayload & {
  operator: string;
};

const CORE_COLUMNS = [
  { header: '验证码', key: 'code', width: 26 },
  { header: '状态', key: 'status', width: 10 },
  { header: '过期时间', key: 'expiresAt', width: 20 },
  { header: '使用情况', key: 'usage', width: 12 }
];

const EXTRA_COLUMNS = [
  { header: '创建时间', key: 'createdAt', width: 20 },
  { header: '备注', key: 'description', width: 30 }
];

function formatDate(value: string) {
  return new Date(value).toLocaleString('zh-CN');
}

/**
 * 构建验证码Excel工作簿
 */
export async function buildCodesWorkbook(options: ExportOptions) {
  const pool = getDbPool();

  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (options.scope === 'batch' && options.batchKey) {
    conditions.push(`created_at = $${paramIndex}`);
    params.push(options.batchKey);
    paramIndex++;
  }
  if (options.scope === 'range') {
    if (options.rangeStart) {
      conditions.push(`created_at >= $${paramIndex}`);
      params.push(options.rangeStart);
      paramIndex++;
    }
    if (options.rangeEnd) {
      conditions.push(`created_at <= $${paramIndex}`);
      params.push(options.rangeEnd);
      paramIndex++;
    }
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const query = `
    SELECT * FROM access_codes
    ${whereClause}
    ORDER BY created_at DESC
  `;

  const result = await pool.query<AccessCode>(query, params);
  const enriched = (result.rows ?? []).map((record) => ({
    ...record,
    expires_at: record.expires_at instanceof Date ? record.expires_at.toISOString() : record.expires_at,
    created_at: record.created_at instanceof Date ? record.created_at.toISOString() : record.created_at,
    status: deriveCodeStatus(record)
  }));

  const workbook = new ExcelJS.Workbook();
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Data');
  sheet.columns = options.content === 'all' ? [...CORE_COLUMNS, ...EXTRA_COLUMNS] : CORE_COLUMNS;
  enriched.forEach((record) => {
    const usageMaxLabel = record.max_uses >= UNLIMITED_MAX_USES ? '∞' : record.max_uses;
    sheet.addRow({
      code: record.plain_code ?? record.code_hash,
      status: record.status === 'active' ? '启用' : '停用',
      expiresAt: formatDate(record.expires_at),
      usage: `${record.used_count}/${usageMaxLabel}`,
      createdAt: formatDate(record.created_at),
      description: record.description ?? ''
    });
  });

  const summary = workbook.addWorksheet('说明');
  const summaryRows: Array<[string, string]> = [
    ['导出操作者', options.operator],
    ['字段范围', options.content === 'all' ? '全部字段' : '核心字段'],
    ['导出方式', options.scope === 'batch' ? '按批次' : '自定义时间'],
    ['总记录', enriched.length.toString()],
    ['导出时间', formatDate(new Date().toISOString())]
  ];

  if (options.scope === 'batch') {
    summaryRows.splice(3, 0, ['批次时间', options.batchKey ? formatDate(options.batchKey) : '未选择']);
  } else {
    summaryRows.splice(3, 0, ['起始时间', options.rangeStart ?? '不限'], ['结束时间', options.rangeEnd ?? '不限']);
  }

  summary.addRows(summaryRows);

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
