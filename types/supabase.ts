export interface Database {
  public: {
    Tables: {
      access_codes: {
        Row: {
          id: string;
          code_hash: string;
          plain_code: string | null;
          expires_at: string;
          max_uses: number;
          used_count: number;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          code_hash: string;
          plain_code?: string | null;
          expires_at: string;
          max_uses: number;
          used_count?: number;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          code_hash?: string;
          plain_code?: string | null;
          expires_at?: string;
          max_uses?: number;
          used_count?: number;
          description?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

