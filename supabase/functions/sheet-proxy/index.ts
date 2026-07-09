import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALLOWED_HOSTS = new Set([
  'docs.google.com',
  'sheets.googleapis.com',
]);

const MAX_RESPONSE_BYTES = 10 * 1024 * 1024; // 10MB
const FETCH_TIMEOUT_MS = 10_000;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const targetUrl = url.searchParams.get('url');

    if (!targetUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing url parameter', code: 'MISSING_URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse & validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(targetUrl);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid URL', code: 'INVALID_URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (parsedUrl.protocol !== 'https:') {
      return new Response(
        JSON.stringify({ error: 'Only HTTPS URLs allowed', code: 'INVALID_PROTOCOL' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const hostname = parsedUrl.hostname.toLowerCase();

    // Block localhost / private ranges (defense-in-depth)
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.16.') ||
      hostname.startsWith('169.254.')
    ) {
      return new Response(
        JSON.stringify({ error: 'Access denied', code: 'FORBIDDEN_HOST' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!ALLOWED_HOSTS.has(hostname)) {
      return new Response(
        JSON.stringify({ error: 'Domain not in allowlist', code: 'FORBIDDEN_HOST' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[sheet-proxy] Fetching allowed host: ${hostname}`);

    const separator = targetUrl.includes('?') ? '&' : '?';
    const bustUrl = `${targetUrl}${separator}t=${Date.now()}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(bustUrl, {
        headers: {
          'Accept': 'text/csv,*/*',
          'User-Agent': 'Mozilla/5.0 (compatible; LovableProxy/1.0)',
        },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      console.error(`[sheet-proxy] Upstream HTTP ${response.status}`);
      return new Response(
        JSON.stringify({ error: 'Upstream fetch failed', code: 'UPSTREAM_ERROR' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_RESPONSE_BYTES) {
      return new Response(
        JSON.stringify({ error: 'Response too large', code: 'PAYLOAD_TOO_LARGE' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const text = await response.text();
    if (text.length > MAX_RESPONSE_BYTES) {
      return new Response(
        JSON.stringify({ error: 'Response too large', code: 'PAYLOAD_TOO_LARGE' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const lineCount = text.split('\n').filter(line => line.trim()).length;
    console.log(`[sheet-proxy] Fetched ${text.length} bytes, ${lineCount} rows`);

    return new Response(text, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv; charset=utf-8',
        'X-Row-Count': String(lineCount),
        'X-Fetched-At': new Date().toISOString(),
      },
    });
  } catch (err) {
    // Log full detail server-side only; return generic message to client.
    console.error('[sheet-proxy] Error:', err instanceof Error ? err.message : String(err));
    if (err instanceof Error && err.stack) console.error('[sheet-proxy] Stack:', err.stack);

    return new Response(
      JSON.stringify({
        error: 'Failed to fetch data',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
