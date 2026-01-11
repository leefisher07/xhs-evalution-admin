import { Pool } from 'pg';
import { ensureServerEnv } from '@/lib/env';

let pool: Pool | null = null;

export function getDbPool() {
  if (pool) {
    return pool;
  }

  const { DATABASE_URL } = ensureServerEnv();

  pool = new Pool({
    connectionString: DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  return pool;
}
