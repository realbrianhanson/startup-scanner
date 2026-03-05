// Helper functions for safely rendering report data

/**
 * Safely converts any value to a displayable string
 */
export const safeString = (value: any, fallback = 'Not available'): string => {
  if (!value) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'object') {
    if (value.text) return String(value.text);
    if (value.content) return String(value.content);
    if (value.description) return String(value.description);
    if (value.summary) return String(value.summary);
    if (value.value) return String(value.value);
    if (value.estimate) return String(value.estimate);
    if (value.name) return String(value.name);
    return fallback;
  }
  return String(value);
};

/**
 * Safely converts any value to an array of displayable strings
 */
export const safeArray = (value: any, fallback: string[] = []): string[] => {
  if (!value) return fallback;
  
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return safeArray(parsed, fallback);
      if (typeof parsed === 'object' && parsed !== null) {
        for (const key of ['trends', 'items', 'list', 'data', 'barriers']) {
          if (parsed[key] && Array.isArray(parsed[key])) {
            return safeArray(parsed[key], fallback);
          }
        }
      }
      return [value];
    } catch {
      return value.trim() ? [value] : fallback;
    }
  }
  
  if (Array.isArray(value)) {
    if (value.length === 1 && typeof value[0] === 'object' && value[0] !== null) {
      const obj = value[0];
      for (const key of ['trends', 'items', 'list', 'data', 'barriers', 'direct_competitors', 'indirect_competitors']) {
        if (obj[key] && Array.isArray(obj[key])) {
          return safeArray(obj[key], fallback);
        }
      }
      if (obj.tam || obj.sam || obj.som) {
        return fallback;
      }
    }
    
    return value.map(item => {
      if (typeof item === 'string') return item;
      if (typeof item === 'number') return String(item);
      if (typeof item === 'object' && item !== null) {
        for (const key of ['name', 'text', 'title', 'description', 'trend', 'value', 'summary', 'content']) {
          if (item[key] && typeof item[key] === 'string') return item[key];
        }
        const firstStringValue = Object.values(item).find(v => typeof v === 'string');
        if (firstStringValue) return firstStringValue as string;
        return null;
      }
      return String(item);
    }).filter(Boolean) as string[];
  }
  
  if (typeof value === 'object' && value !== null) {
    for (const key of ['trends', 'items', 'list', 'data', 'barriers', 'direct_competitors', 'indirect_competitors', 'competitive_advantages']) {
      if (value[key] && Array.isArray(value[key])) {
        return safeArray(value[key], fallback);
      }
    }
  }
  
  return fallback;
};

/**
 * Checks if data appears to be placeholder/TBD content
 */
export const isPlaceholder = (value: any): boolean => {
  if (!value) return true;
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    return lower === 'tbd' || 
           lower === 'analysis pending' || 
           lower === 'pending' ||
           lower === 'not available' ||
           lower === 'n/a';
  }
  return false;
};

/**
 * Safely gets nested object properties
 */
export const safeGet = <T>(obj: any, path: string, fallback: T): T => {
  try {
    const keys = path.split('.');
    let result = obj;
    for (const key of keys) {
      if (result === null || result === undefined) return fallback;
      result = result[key];
    }
    return result ?? fallback;
  } catch {
    return fallback;
  }
};

/**
 * Safely convert content to string for MarkdownContent
 */
export const toMarkdownString = (content: any): string => {
  if (!content) return '';
  if (typeof content === 'string') {
    return content.replace(/^(Go|No-Go):\s*/i, '').trim();
  }
  if (typeof content === 'object') {
    if (content.text) return String(content.text).replace(/^(Go|No-Go):\s*/i, '').trim();
    if (content.content) return String(content.content).replace(/^(Go|No-Go):\s*/i, '').trim();
    return JSON.stringify(content, null, 2);
  }
  return String(content).replace(/^(Go|No-Go):\s*/i, '').trim();
};

/**
 * Safely parse JSON strings that might be embedded in data
 */
export const tryParseJson = (value: any): any => {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    try {
      let cleaned = value.trim();
      cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
      return JSON.parse(cleaned);
    } catch {
      return value;
    }
  }
};

/**
 * Check if value is placeholder/pending content
 */
export const isPendingContent = (value: any): boolean => {
  if (!value) return true;
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    if (lower.length > 100) return false;
    return lower === 'tbd' || 
           lower === 'analysis pending' ||
           lower === 'pending' ||
           lower.includes('in progress') ||
           lower === 'not available' ||
           lower === 'n/a' ||
           lower === 'review analysis';
  }
  return false;
};

/**
 * Extract market data from potentially nested structures
 */
export const getMarketData = (marketAnalysis: any) => {
  if (!marketAnalysis) return {};
  
  const trendsFirstItem = marketAnalysis?.trends?.[0];
  let nestedData = tryParseJson(trendsFirstItem);
  
  if (typeof marketAnalysis === 'string') {
    marketAnalysis = tryParseJson(marketAnalysis);
  }
  
  if (nestedData && typeof nestedData === 'object') {
    const hasTam = nestedData.tam && !isPendingContent(nestedData.tam);
    const hasTrends = Array.isArray(nestedData.trends) && nestedData.trends.length > 0;
    
    if (hasTam || hasTrends) {
      return {
        tam: !isPendingContent(nestedData.tam) ? nestedData.tam : marketAnalysis.tam,
        sam: !isPendingContent(nestedData.sam) ? nestedData.sam : marketAnalysis.sam,
        som: !isPendingContent(nestedData.som) ? nestedData.som : marketAnalysis.som,
        growth_rate: !isPendingContent(nestedData.growth_rate) ? nestedData.growth_rate : marketAnalysis.growth_rate,
        trends: hasTrends ? nestedData.trends.map((t: any) => typeof t === 'string' ? t : (t.trend || t.name || t.description || String(t))) : [],
        barriers: Array.isArray(nestedData.barriers) ? nestedData.barriers : (marketAnalysis.barriers || []),
        timing_assessment: !isPendingContent(nestedData.timing_assessment) ? nestedData.timing_assessment : marketAnalysis.timing_assessment
      };
    }
  }
  
  let trends = marketAnalysis.trends || [];
  if (Array.isArray(trends)) {
    trends = trends
      .filter((t: any) => t && typeof t !== 'object' || (typeof t === 'object' && !t.tam))
      .map((t: any) => typeof t === 'string' ? t : (t?.trend || t?.name || t?.description || ''))
      .filter(Boolean);
  }
  
  return {
    ...marketAnalysis,
    trends,
    barriers: Array.isArray(marketAnalysis.barriers) ? marketAnalysis.barriers : []
  };
};

/**
 * Extract competitive landscape data from potentially nested structures
 */
export const getCompetitiveLandscape = (competitiveLandscape: any) => {
  if (!competitiveLandscape) return {};
  
  competitiveLandscape = tryParseJson(competitiveLandscape);
  
  let positioning = tryParseJson(competitiveLandscape.positioning);
  
  if (positioning && typeof positioning === 'object') {
    const hasDirectComp = Array.isArray(positioning.direct_competitors) && positioning.direct_competitors.length > 0;
    const hasAdvantages = Array.isArray(positioning.competitive_advantages) && positioning.competitive_advantages.length > 0;
    
    if (hasDirectComp || hasAdvantages) {
      return {
        direct_competitors: positioning.direct_competitors || [],
        indirect_competitors: positioning.indirect_competitors || [],
        competitive_advantages: positioning.competitive_advantages || [],
        positioning: typeof positioning.positioning === 'string' ? positioning.positioning : 
                     typeof positioning.market_positioning === 'string' ? positioning.market_positioning : ''
      };
    }
  }
  
  const directComp = competitiveLandscape.direct_competitors;
  if (Array.isArray(directComp) && directComp.length === 1 && typeof directComp[0] === 'object') {
    const nested = directComp[0];
    if (nested.direct_competitors || nested.competitive_advantages) {
      return {
        direct_competitors: Array.isArray(nested.direct_competitors) ? nested.direct_competitors : [],
        indirect_competitors: Array.isArray(nested.indirect_competitors) ? nested.indirect_competitors : [],
        competitive_advantages: Array.isArray(nested.competitive_advantages) ? nested.competitive_advantages : [],
        positioning: nested.positioning || competitiveLandscape.positioning || ''
      };
    }
  }
  
  const positioningStr = typeof positioning === 'string' ? positioning : 
                        typeof competitiveLandscape.positioning === 'string' ? competitiveLandscape.positioning : '';
  
  return {
    direct_competitors: Array.isArray(competitiveLandscape.direct_competitors) ? competitiveLandscape.direct_competitors : [],
    indirect_competitors: Array.isArray(competitiveLandscape.indirect_competitors) ? competitiveLandscape.indirect_competitors : [],
    competitive_advantages: Array.isArray(competitiveLandscape.competitive_advantages) ? competitiveLandscape.competitive_advantages : [],
    positioning: positioningStr
  };
};

/**
 * Extract Porter's Five Forces data
 */
export const getPorterFiveForces = (porterData: any) => {
  if (!porterData) return null;
  
  porterData = tryParseJson(porterData);
  
  const defaultForce = { rating: "Medium", analysis: "Analysis in progress..." };
  
  return {
    supplier_power: porterData.supplier_power || defaultForce,
    buyer_power: porterData.buyer_power || defaultForce,
    competitive_rivalry: porterData.competitive_rivalry || defaultForce,
    threat_of_substitution: porterData.threat_of_substitution || defaultForce,
    threat_of_new_entry: porterData.threat_of_new_entry || defaultForce
  };
};

/**
 * Extract Go-To-Market data
 */
export const getGoToMarketData = (gtmData: any) => {
  if (!gtmData) return null;
  
  gtmData = tryParseJson(gtmData);
  
  return {
    target_segments: Array.isArray(gtmData.target_segments) ? gtmData.target_segments : [],
    value_proposition: gtmData.value_proposition || {},
    marketing_channels: Array.isArray(gtmData.marketing_channels) ? gtmData.marketing_channels : [],
    sales_strategy: gtmData.sales_strategy || {},
    pricing_strategy: gtmData.pricing_strategy || {},
    launch_phases: Array.isArray(gtmData.launch_phases) ? gtmData.launch_phases : [],
    growth_tactics: Array.isArray(gtmData.growth_tactics) ? gtmData.growth_tactics : [],
    key_metrics: Array.isArray(gtmData.key_metrics) ? gtmData.key_metrics : []
  };
};
