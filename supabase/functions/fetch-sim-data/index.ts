import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Google Sheets CSV URL
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1QRO-BroqUQWccWjOkRT7iICdTbQu3Y_NC1NWCeG0M0Y/export?format=csv&gid=139400129';

// Invalid CSV patterns (HTML responses, login pages, etc.)
const INVALID_CSV_PATTERNS = [
  '<html',
  '<!doctype',
  'accounts.google.com',
  'servicelogin',
  'sign in',
  'you need access',
  'request access',
  'access denied'
];

// Valid CSV headers to look for
const VALID_HEADERS = [
  'SỐ THUÊ BAO', 'SO THUE BAO', 'SỐTHUÊBAO', 'SOTHUEBAO',
  'THUÊ BAO CHUẨN', 'THUE BAO CHUAN', 'THUÊBAOCHUẨN', 'THUEBAOCHUAN'
];

// Validate CSV text - reject HTML/login pages
function validateCSV(text: string): { valid: boolean; reason?: string } {
  const lowerText = text.toLowerCase().slice(0, 2000);
  
  // Check for invalid patterns
  for (const pattern of INVALID_CSV_PATTERNS) {
    if (lowerText.includes(pattern.toLowerCase())) {
      return { valid: false, reason: `Invalid response: contains "${pattern}"` };
    }
  }
  
  // Check for valid headers
  const upperText = text.toUpperCase();
  const hasValidHeader = VALID_HEADERS.some(header => 
    upperText.includes(header.toUpperCase())
  );
  
  if (!hasValidHeader) {
    return { valid: false, reason: 'Missing required CSV headers' };
  }
  
  // Check for minimum content (header + at least 1 data row)
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length < 2) {
    return { valid: false, reason: 'CSV has no data rows' };
  }
  
  return { valid: true };
}

// Fetch with retry logic
async function fetchWithRetry(url: string, retries = 3): Promise<string> {
  const delays = [500, 1000, 2000];
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      console.log(`[fetch-sim-data] Attempt ${attempt + 1}/${retries}`);
      
      // Add cache-busting parameter
      const separator = url.includes('?') ? '&' : '?';
      const bustUrl = `${url}${separator}t=${Date.now()}`;
      
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
      console.log(`[fetch-sim-data] Received ${text.length} bytes`);
      
      // Validate CSV content
      const validation = validateCSV(text);
      if (!validation.valid) {
        throw new Error(validation.reason || 'Invalid CSV response');
      }
      
      console.log(`[fetch-sim-data] CSV validated successfully`);
      return text;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error(`[fetch-sim-data] Attempt ${attempt + 1} failed:`, errorMessage);
      
      if (attempt < retries - 1) {
        console.log(`[fetch-sim-data] Waiting ${delays[attempt]}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delays[attempt]));
      } else {
        throw err;
      }
    }
  }
  
  throw new Error('All retries failed');
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[fetch-sim-data] Starting CSV fetch from Google Sheets');
    
    const csvText = await fetchWithRetry(GOOGLE_SHEET_CSV_URL);
    
    // Count lines for logging
    const lineCount = csvText.split('\n').filter(line => line.trim()).length;
    console.log(`[fetch-sim-data] Successfully fetched ${lineCount} rows`);
    
    return new Response(csvText, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv; charset=utf-8',
        'X-Row-Count': String(lineCount),
        'X-Fetched-At': new Date().toISOString()
      }
    });
    
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('[fetch-sim-data] Error:', errorMessage);
    
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch SIM data',
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