import { createClient } from '@supabase/supabase-js';
import { ADMIN_SUPABASE_URL, ADMIN_SUPABASE_PUBLISHABLE_KEY } from './config';
import type { Database } from './types';

/**
 * Full Supabase JS client — auth (admin login) plus RLS-guarded reads/writes
 * on `profiles` and `blog_posts`. Points at the separate admin project (see
 * ADMIN_SUPABASE_URL in config.ts), not the one `edgeFunctions.ts` uses.
 * Unlike `edgeFunctions.ts`, this pulls in GoTrue/postgrest, which is the
 * right tradeoff here: the admin panel and the blog actually need sessions
 * and typed table queries, not just two one-off HTTP calls.
 */
export const supabase = createClient<Database>(ADMIN_SUPABASE_URL, ADMIN_SUPABASE_PUBLISHABLE_KEY);
