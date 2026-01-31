import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Google Sheets CSV URLs
// Sheet1 (gid=139400129): Main SIM inventory with SimID column
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1QRO-BroqUQWccWjOkRT7iICdTbQu3Y_NC1NWCeG0M0Y/export?format=csv&gid=139400129';

// SIM_SOLD tab: List of sold SIMs with SoThueBao column (contains SimID values)
// Using gviz API with sheet name to reliably access the correct tab
const SIM_SOLD_CSV_URL = 'https://docs.google.com/spreadsheets/d/1QRO-BroqUQWccWjOkRT7iICdTbQu3Y_NC1NWCeG0M0Y/gviz/tq?tqx=out:csv&sheet=SIM_SOLD';

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

// Valid CSV headers for main sheet
const VALID_HEADERS = [
  'SỐ THUÊ BAO', 'SO THUE BAO', 'SỐTHUÊBAO', 'SOTHUEBAO',
  'THUÊ BAO CHUẨN', 'THUE BAO CHUAN', 'THUÊBAOCHUẨN', 'THUEBAOCHUAN'
];

// Normalize identifier for comparison (trim whitespace, uppercase)
const normalizeId = (value: string): string => {
  return String(value || '').trim().toUpperCase();
};

// Validate CSV text - reject HTML/login pages
function validateCSV(text: string, requiredHeaders: string[] = VALID_HEADERS): { valid: boolean; reason?: string } {
  const lowerText = text.toLowerCase().slice(0, 2000);
  
  // Check for invalid patterns
  for (const pattern of INVALID_CSV_PATTERNS) {
    if (lowerText.includes(pattern.toLowerCase())) {
      return { valid: false, reason: `Invalid response: contains "${pattern}"` };
    }
  }
  
  // Check for valid headers
  const upperText = text.toUpperCase();
  const hasValidHeader = requiredHeaders.some(header => 
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
  const sheetName = url.includes('gid=0') ? 'SIM_SOLD' : 'Sheet1';
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      console.log(`[fetch-sim-data] Attempt ${attempt + 1}/${retries} for ${sheetName}`);
      
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
      console.log(`[fetch-sim-data] Received ${text.length} bytes from ${sheetName}`);
      
      return text;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error(`[fetch-sim-data] Attempt ${attempt + 1} failed for ${sheetName}:`, errorMessage);
      
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

// Parse CSV line handling quoted fields
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  
  return values;
}

// Parse SIM_SOLD CSV to get set of sold SimIDs from SoThueBao column
function parseSoldSimIds(csvText: string): Set<string> {
  const result = new Set<string>();
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return result;
  
  // Parse header row
  const headerLine = lines[0].replace(/^\uFEFF/, '');
  const headers = headerLine.split(',').map(h => 
    h.trim().replace(/^"|"$/g, '').trim().toUpperCase()
  );
  
  // Find SoThueBao column index
  let columnIndex = headers.findIndex(h => 
    h === 'SOTHUEBAO' || h === 'SO THUE BAO' || h === 'SỐTHUÊBAO'
  );
  
  if (columnIndex === -1) {
    console.warn('[fetch-sim-data] SoThueBao column not found in SIM_SOLD headers:', headers);
    return result;
  }
  
  console.log(`[fetch-sim-data] SoThueBao column found at index ${columnIndex}`);
  
  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    const values = parseCSVLine(line);
    
    if (columnIndex < values.length) {
      const value = values[columnIndex].replace(/^"|"$/g, '').trim();
      if (value) {
        // Normalize and add to set (e.g., "SIM036227" -> "SIM036227")
        const normalized = normalizeId(value);
        if (normalized) {
          result.add(normalized);
        }
      }
    }
  }
  
  return result;
}

// Find SimID column index in main sheet
function findSimIdColumnIndex(headerLine: string): number {
  const headers = headerLine.split(',').map(h => 
    h.trim().replace(/^"|"$/g, '').trim().toUpperCase()
  );
  
  // Look for SimID column (exact match first)
  const exactIndex = headers.findIndex(h => h === 'SIMID');
  if (exactIndex !== -1) return exactIndex;
  
  // Look for variations
  const simIdNames = ['SIM_ID', 'SIM ID', 'SIMREF'];
  for (const name of simIdNames) {
    const index = headers.findIndex(h => h === name);
    if (index !== -1) return index;
  }
  
  // Partial match
  const partialIndex = headers.findIndex(h => h.includes('SIMID'));
  if (partialIndex !== -1) return partialIndex;
  
  return -1;
}

// Filter out sold SIMs from main CSV
function filterSoldSims(mainCsvText: string, soldSet: Set<string>): string {
  if (soldSet.size === 0) {
    console.log('[fetch-sim-data] No sold SIMs to filter, returning original CSV');
    return mainCsvText;
  }
  
  const lines = mainCsvText.trim().split('\n');
  if (lines.length < 2) return mainCsvText;
  
  const headerLine = lines[0];
  const simIdIndex = findSimIdColumnIndex(headerLine);
  
  if (simIdIndex === -1) {
    console.warn('[fetch-sim-data] SimID column not found in main sheet, cannot filter sold SIMs');
    return mainCsvText;
  }
  
  console.log(`[fetch-sim-data] SimID column found at index ${simIdIndex}`);
  
  const filteredLines = [headerLine];
  let filteredCount = 0;
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    const values = parseCSVLine(line);
    
    if (simIdIndex < values.length) {
      const simId = values[simIdIndex].replace(/^"|"$/g, '').trim();
      const normalizedSimId = normalizeId(simId);
      
      // Check if this SIM is in the sold set
      if (soldSet.has(normalizedSimId)) {
        filteredCount++;
        continue; // Skip this SIM (it's sold)
      }
    }
    
    filteredLines.push(line);
  }
  
  console.log(`[fetch-sim-data] Filtered out ${filteredCount} sold SIMs from ${lines.length - 1} total`);
  return filteredLines.join('\n');
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[fetch-sim-data] Starting CSV fetch from Google Sheets');
    
    // Fetch both sheets in parallel
    const [mainCsvResult, soldCsvResult] = await Promise.allSettled([
      fetchWithRetry(GOOGLE_SHEET_CSV_URL),
      fetchWithRetry(SIM_SOLD_CSV_URL)
    ]);
    
    // Handle main sheet
    if (mainCsvResult.status === 'rejected') {
      throw new Error(`Failed to fetch main sheet: ${mainCsvResult.reason}`);
    }
    
    let mainCsvText = mainCsvResult.value;
    
    // Validate main CSV
    const mainValidation = validateCSV(mainCsvText, VALID_HEADERS);
    if (!mainValidation.valid) {
      throw new Error(mainValidation.reason || 'Invalid main CSV response');
    }
    
    console.log(`[fetch-sim-data] Main CSV validated successfully`);
    
    // Handle SIM_SOLD sheet (fail-safe: if it fails, continue without filtering)
    let soldSet = new Set<string>();
    
    if (soldCsvResult.status === 'fulfilled') {
      const soldCsvText = soldCsvResult.value;
      
      // Check if we got valid content (not HTML error page)
      const hasContent = soldCsvText.trim().split('\n').length >= 2;
      const isNotHtml = !soldCsvText.trim().toLowerCase().startsWith('<');
      
      if (hasContent && isNotHtml) {
        soldSet = parseSoldSimIds(soldCsvText);
        console.log(`[fetch-sim-data] Parsed ${soldSet.size} sold SIMs from SIM_SOLD tab`);
        
        // Log first few sold IDs for debugging
        if (soldSet.size > 0) {
          const sample = Array.from(soldSet).slice(0, 5).join(', ');
          console.log(`[fetch-sim-data] Sample sold IDs: ${sample}...`);
        }
      } else {
        console.warn('[fetch-sim-data] SIM_SOLD tab appears empty or returned HTML');
      }
    } else {
      console.warn(`[fetch-sim-data] Failed to fetch SIM_SOLD tab (fail-safe: continuing without filter): ${soldCsvResult.reason}`);
    }
    
    // Filter out sold SIMs from main sheet
    const filteredCsvText = filterSoldSims(mainCsvText, soldSet);
    
    // Count lines for logging
    const originalLineCount = mainCsvText.split('\n').filter(line => line.trim()).length;
    const filteredLineCount = filteredCsvText.split('\n').filter(line => line.trim()).length;
    
    console.log(`[fetch-sim-data] Successfully fetched ${filteredLineCount} rows (filtered from ${originalLineCount})`);
    
    return new Response(filteredCsvText, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv; charset=utf-8',
        'X-Row-Count': String(filteredLineCount),
        'X-Original-Count': String(originalLineCount),
        'X-Sold-Count': String(soldSet.size),
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
