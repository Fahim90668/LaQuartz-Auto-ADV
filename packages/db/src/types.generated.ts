export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type TableShape = {
  Row: Record<string, unknown>;
  Insert: Record<string, unknown>;
  Update: Record<string, unknown>;
};

type ViewShape = {
  Row: Record<string, unknown>;
};

type FunctionShape = {
  Args: Record<string, unknown>;
  Returns: unknown;
};

export interface Database {
  public: {
    Tables: {
      profiles: TableShape;
      redeem_codes: TableShape;
      entitlements: TableShape;
      discord_accounts: TableShape;
      account_servers: TableShape;
      account_channels: TableShape;
      playgrounds: TableShape;
      playground_channels: TableShape;
      playground_messages: TableShape;
      scheduled_jobs: TableShape;
      delivery_logs: TableShape;
      audit_logs: TableShape;
      rate_limit_buckets: TableShape;
      worker_heartbeats: TableShape;
      app_settings: TableShape;
    };
    Views: {
      v_user_access: ViewShape;
      v_playground_overview: ViewShape;
    };
    Functions: {
      fn_has_access: FunctionShape;
      fn_effective_playground_limit: FunctionShape;
      get_my_access: FunctionShape;
      redeem_code: FunctionShape;
      bot_create_code: FunctionShape;
      bot_destroy_code: FunctionShape;
      expire_entitlements: FunctionShape;
      recover_stale_jobs: FunctionShape;
      claim_due_jobs: FunctionShape;
      complete_job: FunctionShape;
      fail_job: FunctionShape;
      rehydrate_runtime: FunctionShape;
    };
    Enums: Record<string, string>;
  };
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T];
