// Similar SIM Suggestions Engine - UI-only helper
// Does NOT modify existing filtering logic

import type { NormalizedSIM } from './simUtils';
import type { FilterState } from '@/hooks/useSimData';
import { PRICE_RANGES } from './simUtils';

interface SuggestionParams {
  allSims: NormalizedSIM[];
  searchQuery: string;
  activeFilters: FilterState;
  limit?: number;
}

interface ScoredSIM {
  sim: NormalizedSIM;
  score: number;
}

// Sanitize query to digits only (for similarity matching)
const sanitizeToDigits = (query: string): string => {
  return query.replace(/[^0-9]/g, '');
};

// Calculate fuzzy match score for last N digits
const fuzzyLastNScore = (simDigits: string, queryDigits: string, n: number): number => {
  if (simDigits.length < n || queryDigits.length < n) return 0;
  
  const simLast = simDigits.slice(-n);
  const queryLast = queryDigits.slice(-n);
  
  let matches = 0;
  for (let i = 0; i < n; i++) {
    if (simLast[i] === queryLast[i]) matches++;
  }
  
  return Math.floor((matches / n) * 40); // Max 40 points for fuzzy match
};

// Get similar SIMs based on search query
const getSimilarByQuery = (
  sims: NormalizedSIM[],
  query: string,
  limit: number
): ScoredSIM[] => {
  const q = sanitizeToDigits(query);
  if (q.length < 2) return [];
  
  const scored: ScoredSIM[] = [];
  const maxScan = Math.min(sims.length, 20000); // Performance cap
  
  for (let i = 0; i < maxScan; i++) {
    const sim = sims[i];
    let score = 0;
    
    // Suffix match (last 2-6 digits)
    for (let k = Math.min(6, q.length); k >= 2; k--) {
      const querySuffix = q.slice(-k);
      if (sim.rawDigits.endsWith(querySuffix)) {
        score += 100 + (k * 10); // Higher score for longer suffix match
        break;
      }
    }
    
    // Prefix match (first 3-6 digits)
    if (score === 0) {
      for (let k = Math.min(6, q.length); k >= 3; k--) {
        const queryPrefix = q.slice(0, k);
        if (sim.rawDigits.startsWith(queryPrefix)) {
          score += 80 + (k * 8);
          break;
        }
      }
    }
    
    // Contains match
    if (score === 0 && sim.rawDigits.includes(q)) {
      score += 60;
    }
    
    // Fuzzy last 4 digits match (always add if applicable)
    if (q.length >= 4) {
      score += fuzzyLastNScore(sim.rawDigits, q, 4);
    }
    
    // Add beauty score bonus (normalized to 0-20)
    score += Math.min(sim.beautyScore / 5, 20);
    
    if (score > 0) {
      scored.push({ sim, score });
    }
  }
  
  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);
  
  return scored.slice(0, limit);
};

// Get price range bucket for a price
const getPriceBucket = (price: number): number => {
  for (let i = 0; i < PRICE_RANGES.length; i++) {
    if (price >= PRICE_RANGES[i].min && price <= PRICE_RANGES[i].max) {
      return i;
    }
  }
  return -1;
};

// Get similar SIMs based on filters (when no search query)
const getSimilarByFilters = (
  sims: NormalizedSIM[],
  filters: FilterState,
  limit: number
): ScoredSIM[] => {
  const scored: ScoredSIM[] = [];
  const maxScan = Math.min(sims.length, 20000);
  
  // Determine target price bucket from filters
  let targetPriceBucket = -1;
  if (filters.priceRanges.length > 0) {
    targetPriceBucket = filters.priceRanges[0];
  } else if (filters.customPriceMin !== null || filters.customPriceMax !== null) {
    const midPrice = ((filters.customPriceMin || 0) + (filters.customPriceMax || 1000000000)) / 2;
    targetPriceBucket = getPriceBucket(midPrice);
  }
  
  for (let i = 0; i < maxScan; i++) {
    const sim = sims[i];
    let score = 0;
    
    // Network preference
    if (filters.selectedNetworks.length > 0) {
      if (filters.selectedNetworks.includes(sim.network)) {
        score += 50;
      } else {
        score += 10; // Still include but lower priority
      }
    } else {
      score += 30; // No network filter = neutral
    }
    
    // Price bucket preference
    if (targetPriceBucket >= 0) {
      const simBucket = getPriceBucket(sim.price);
      if (simBucket === targetPriceBucket) {
        score += 40;
      } else if (Math.abs(simBucket - targetPriceBucket) === 1) {
        score += 25; // Adjacent bucket
      } else {
        score += 10;
      }
    } else {
      score += 20;
    }
    
    // Tag overlap
    if (filters.selectedTags.length > 0) {
      const matchingTags = filters.selectedTags.filter(tag => 
        tag === 'VIP' ? sim.isVIP : sim.tags.includes(tag)
      );
      score += matchingTags.length * 15;
    }
    
    // Suffix preference (if suffix filter was applied)
    if (filters.selectedSuffixes.length > 0 || filters.customSuffix) {
      const allSuffixes = [...filters.selectedSuffixes];
      if (filters.customSuffix) allSuffixes.push(filters.customSuffix);
      
      // Check for partial suffix match
      for (const suffix of allSuffixes) {
        if (suffix.length >= 2) {
          // Check if SIM ends with similar digits
          const simLast = sim.rawDigits.slice(-suffix.length);
          let matchCount = 0;
          for (let j = 0; j < suffix.length; j++) {
            if (simLast[j] === suffix[j]) matchCount++;
          }
          score += Math.floor((matchCount / suffix.length) * 20);
        }
      }
    }
    
    // Beauty score bonus
    score += Math.min(sim.beautyScore / 5, 20);
    
    scored.push({ sim, score });
  }
  
  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);
  
  return scored.slice(0, limit);
};

// Main export: Get similar SIM suggestions
export const getSimilarSims = ({
  allSims,
  searchQuery,
  activeFilters,
  limit = 12
}: SuggestionParams): NormalizedSIM[] => {
  if (allSims.length === 0) return [];
  
  // Sanitize query
  const cleanQuery = searchQuery.replace(/[^0-9*]/g, '');
  const digitsOnly = sanitizeToDigits(searchQuery);
  
  let scored: ScoredSIM[];
  
  if (digitsOnly.length >= 2) {
    // Query-based similarity
    scored = getSimilarByQuery(allSims, searchQuery, limit);
  } else {
    // Filter-based similarity
    scored = getSimilarByFilters(allSims, activeFilters, limit);
  }
  
  // If we still don't have enough results, fill with high beauty score SIMs
  if (scored.length < limit) {
    const existingIds = new Set(scored.map(s => s.sim.id));
    const remaining = limit - scored.length;
    
    const topBeauty = allSims
      .filter(sim => !existingIds.has(sim.id))
      .sort((a, b) => b.beautyScore - a.beautyScore)
      .slice(0, remaining);
    
    topBeauty.forEach(sim => {
      scored.push({ sim, score: sim.beautyScore });
    });
  }
  
  return scored.map(s => s.sim);
};
