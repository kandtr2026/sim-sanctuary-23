/**
 * Supabase connection config.
 *
 * These are read from `process.env` when present and otherwise fall back to
 * literals. The fallbacks are deliberate, not an oversight:
 *
 *  - Every `NEXT_PUBLIC_`-prefixed variable is inlined into the client bundle at
 *    build time, so none of this is secret. The publishable key is the `anon` key,
 *    which is designed to ship to browsers and is governed by row-level
 *    security on the Supabase side.
 *  - The same project id and anon key were already hardcoded in
 *    `src/hooks/useCheapSimData.ts`, `src/lib/simInventorySheet.ts` and
 *    `src/pages/SimPhongThuy.tsx`, so this centralises a value that was already
 *    duplicated three times rather than introducing a new exposure.
 *  - Without a fallback, a deploy whose environment is missing these variables
 *    silently builds `undefined` into the URL and every Supabase call fails at
 *    runtime. That is exactly what would have happened when `.env` stopped
 *    being committed.
 *
 * Anything that must stay private belongs in a Supabase Edge Function (see
 * `supabase/functions/`), never in this file.
 */
const FALLBACK_PROJECT_ID = 'pfeyyyvhzsuoccwoweco';

export const SUPABASE_PROJECT_ID: string =
  process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID || FALLBACK_PROJECT_ID;

export const SUPABASE_URL: string =
  process.env.NEXT_PUBLIC_SUPABASE_URL || `https://${SUPABASE_PROJECT_ID}.supabase.co`;

export const SUPABASE_PUBLISHABLE_KEY: string =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmZXl5eXZoenN1b2Njd293ZWNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0NTIzODEsImV4cCI6MjA4NDAyODM4MX0.RGOXDxNXOZn93fnZliCy48Hn2dH4tjogfAcdhp8KQiQ';

/** Base URL for Edge Functions, e.g. `${EDGE_FUNCTIONS_URL}/sheet-proxy`. */
export const EDGE_FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;
