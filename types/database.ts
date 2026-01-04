export type AccessCode = {
  id: string;
  code_hash: string;
  plain_code: string | null;
  expires_at: string;
  max_uses: number;
  used_count: number;
  description: string | null;
  created_at: string;
};
