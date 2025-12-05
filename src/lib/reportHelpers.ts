// Helper functions for safely rendering report data

/**
 * Safely converts any value to a displayable string
 */
export const safeString = (value: any, fallback = 'Not available'): string => {
  if (!value) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'object') {
    // Try common property names
    if (value.text) return String(value.text);
    if (value.content) return String(value.content);
    if (value.description) return String(value.description);
    if (value.summary) return String(value.summary);
    if (value.value) return String(value.value);
    if (value.estimate) return String(value.estimate);
    if (value.name) return String(value.name);
    // Don't show raw JSON to users
    return fallback;
  }
  return String(value);
};

/**
 * Safely converts any value to an array of displayable strings
 */
export const safeArray = (value: any, fallback: string[] = []): string[] => {
  if (!value) return fallback;
  
  // Handle JSON string input first
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return safeArray(parsed, fallback);
      if (typeof parsed === 'object' && parsed !== null) {
        // Check for nested array properties
        for (const key of ['trends', 'items', 'list', 'data', 'barriers']) {
          if (parsed[key] && Array.isArray(parsed[key])) {
            return safeArray(parsed[key], fallback);
          }
        }
      }
      return [value];
    } catch {
      // Not JSON, return as single item if non-empty
      return value.trim() ? [value] : fallback;
    }
  }
  
  // If it's already an array
  if (Array.isArray(value)) {
    // EDGE CASE: Array contains a single complex object with nested arrays
    if (value.length === 1 && typeof value[0] === 'object' && value[0] !== null) {
      const obj = value[0];
      // Check for nested array properties
      for (const key of ['trends', 'items', 'list', 'data', 'barriers', 'direct_competitors', 'indirect_competitors']) {
        if (obj[key] && Array.isArray(obj[key])) {
          return safeArray(obj[key], fallback);
        }
      }
      // If it has tam/sam/som, it's market data - skip
      if (obj.tam || obj.sam || obj.som) {
        return fallback;
      }
    }
    
    return value.map(item => {
      if (typeof item === 'string') return item;
      if (typeof item === 'number') return String(item);
      if (typeof item === 'object' && item !== null) {
        // Try to extract meaningful text from objects - prioritize display-friendly keys
        for (const key of ['name', 'text', 'title', 'description', 'trend', 'value', 'summary', 'content']) {
          if (item[key] && typeof item[key] === 'string') return item[key];
        }
        // Try first string value
        const firstStringValue = Object.values(item).find(v => typeof v === 'string');
        if (firstStringValue) return firstStringValue as string;
        return null; // Will be filtered out
      }
      return String(item);
    }).filter(Boolean) as string[];
  }
  
  // If it's an object with an array property
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
