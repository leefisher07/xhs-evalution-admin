import { createClient } from '@supabase/supabase-js';
import { ensureServerEnv } from '@/lib/env';

let supabaseAdminClient: ReturnType<typeof createClient> | null = null;

export function createAdminClient() {
  if (supabaseAdminClient) {
    return supabaseAdminClient;
  }

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = ensureServerEnv();

  supabaseAdminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return supabaseAdminClient;
}
