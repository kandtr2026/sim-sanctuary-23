import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './config';
import type { Database } from './types';

/**
 * Full Supabase JS client — auth (admin login) plus RLS-guarded reads/writes
 * on `profiles` and `blog_posts`. Unlike `edgeFunctions.ts`, this pulls in
 * GoTrue/postgrest, which is the right tradeoff here: the admin panel and the
 * blog actually need sessions and typed table queries, not just two one-off
 * HTTP calls.
 */
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
