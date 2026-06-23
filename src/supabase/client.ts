import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { env } from '../lib/env';

const url = env.VITE_SUPABASE_URL;
const anonKey = env.VITE_SUPABASE_ANON_KEY;

/** Cliente Supabase, ou null se as credenciais não estiverem configuradas. */
export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null;

export const hasSupabase = supabase !== null;
