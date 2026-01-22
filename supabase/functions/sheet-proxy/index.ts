import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get URL from query parameter
    const url = new URL(req.url);
    const targetUrl = url.searchParams.get('url');
    
    if (!targetUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing url parameter' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`[sheet-proxy] Fetching: ${targetUrl}`);
    
    // Add cache-busting parameter
    const separator = targetUrl.includes('?') ? '&' : '?';
    const bustUrl = `${targetUrl}${separator}t=${Date.now()}`;
    
    const response = await fetch(bustUrl, {
      headers: {
        'Accept': 'text/csv,*/*',
        'User-Agent': 'Mozilla/5.0 (compatible; LovableProxy/1.0)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const text = await response.text();
    console.log(`[sheet-proxy] Received ${text.length} bytes`);
    
    // Count lines for logging
    const lineCount = text.split('\n').filter(line => line.trim()).length;
    console.log(`[sheet-proxy] Successfully fetched ${lineCount} rows`);
    
    return new Response(text, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv; charset=utf-8',
        'X-Row-Count': String(lineCount),
        'X-Fetched-At': new Date().toISOString()
      }
    });
    
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('[sheet-proxy] Error:', errorMessage);
    
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch data',
        message: errorMessage,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
