import { createClient } from '@supabase/supabase-js';
import { ensureServerEnv } from '@/lib/env';
import type { Database } from '@/types/supabase';

let supabaseAdminClient: ReturnType<typeof createClient<Database>> | null = null;

export function createAdminClient() {
  if (supabaseAdminClient) {
    return supabaseAdminClient;
  }

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = ensureServerEnv();

  supabaseAdminClient = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return supabaseAdminClient;
}
