import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy singleton — only instantiated on first use at runtime (not build time)
let _supabase: SupabaseClient | null = null;
let _supabasePublic: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
    }
    _supabase = createClient(url, key);
  }
  return _supabase;
}

export function getSupabasePublic(): SupabaseClient {
  if (!_supabasePublic) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be set');
    }
    _supabasePublic = createClient(url, key);
  }
  return _supabasePublic;
}

// Convenience proxy so existing `supabase.from(...)` calls keep working
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as any)[prop];
  },
});
