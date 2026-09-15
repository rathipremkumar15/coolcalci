export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; email: string | null; display_name: string | null; created_at: string; updated_at: string };
        Insert: { id: string; email?: string | null; display_name?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: string; email?: string | null; display_name?: string | null; created_at?: string; updated_at?: string };
      };
      subscriptions: {
        Row: { user_id: string; plan: string; status: string; trial_ends_at: string | null; current_period_end: string | null; created_at: string; updated_at: string };
        Insert: { user_id: string; plan?: string; status?: string; trial_ends_at?: string | null; current_period_end?: string | null; created_at?: string; updated_at?: string };
        Update: { user_id?: string; plan?: string; status?: string; trial_ends_at?: string | null; current_period_end?: string | null; created_at?: string; updated_at?: string };
      };
      usage_daily: {
        Row: { user_id: string; usage_date: string; calculation_count: number; updated_at: string };
        Insert: { user_id: string; usage_date?: string; calculation_count?: number; updated_at?: string };
        Update: { user_id?: string; usage_date?: string; calculation_count?: number; updated_at?: string };
      };
      calculation_history: {
        Row: { id: string; user_id: string; query: string; title: string; result: string; formula: string | null; created_at: string };
        Insert: { id?: string; user_id: string; query: string; title: string; result: string; formula?: string | null; created_at?: string };
        Update: { id?: string; user_id?: string; query?: string; title?: string; result?: string; formula?: string | null; created_at?: string };
      };
      saved_calculations: {
        Row: { id: string; user_id: string; query: string; title: string; result: string; formula: string | null; created_at: string };
        Insert: { id?: string; user_id: string; query: string; title: string; result: string; formula?: string | null; created_at?: string };
        Update: { id?: string; user_id?: string; query?: string; title?: string; result?: string; formula?: string | null; created_at?: string };
      };
    };
    Functions: {
      consume_calculation: { Args: Record<string, never>; Returns: { allowed: boolean; calculation_count: number; daily_limit: number; plan: string }[] };
    };
  };
}
