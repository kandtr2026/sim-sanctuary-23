import { EDGE_FUNCTIONS_URL, SUPABASE_PUBLISHABLE_KEY } from './config';

/**
 * Minimal Edge Function caller.
 *
 * The app only ever needs two things from Supabase: the `fetch-sim-data` CSV and
 * the Make webhook proxy. Both functions are declared `verify_jwt = false` in
 * supabase/config.toml, so they need no session and no auth handshake — plain
 * `fetch` is behaviourally identical to `supabase.functions.invoke` here.
 *
 * Using the full JS client for this pulled ~350 KB of GoTrue/realtime/postgrest/
 * storage code into the entry chunk for two HTTP requests. This replaces it.
 *
 * The publishable (anon) key is still sent because Supabase's gateway expects an
 * apikey on the /functions/v1 route. It is a public value — it is compiled into
 * the bundle either way — and carries no privileges beyond RLS-guarded anon
 * access.
 */
export const invokeEdgeFunction = async (
  name: string,
  init?: { method?: string; body?: string; headers?: Record<string, string>; signal?: AbortSignal },
): Promise<Response> => {
  const response = await fetch(`${EDGE_FUNCTIONS_URL}/${name}`, {
    method: init?.method ?? 'POST',
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      ...init?.headers,
    },
    body: init?.body,
    signal: init?.signal,
  });

  if (!response.ok) {
    throw new Error(`Edge function "${name}" failed: HTTP ${response.status} ${response.statusText}`);
  }

  return response;
};

/** Invoke an Edge Function and return its body as text. */
export const invokeEdgeFunctionText = async (
  name: string,
  init?: Parameters<typeof invokeEdgeFunction>[1],
): Promise<string> => (await invokeEdgeFunction(name, init)).text();
