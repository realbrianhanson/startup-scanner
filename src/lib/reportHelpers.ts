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
  
  // If it's already an array
  if (Array.isArray(value)) {
    // EDGE CASE: Array contains a single complex object with nested 'trends'
    if (value.length === 1 && typeof value[0] === 'object' && value[0].trends) {
      return safeArray(value[0].trends, fallback);
    }
    
    return value.map(item => {
      if (typeof item === 'string') return item;
      if (typeof item === 'object') {
        // Try to extract meaningful text from objects
        if (item.name) return item.name;
        if (item.text) return item.text;
        if (item.title) return item.title;
        if (item.description) return item.description;
        if (item.trend) return item.trend;
        if (item.value) return item.value;
        // For complex objects, try to create a readable summary
        const keys = Object.keys(item);
        if (keys.length > 0) {
          const firstKey = keys[0];
          const firstValue = item[firstKey];
          if (typeof firstValue === 'string') return firstValue;
        }
        return null; // Will be filtered out
      }
      return String(item);
    }).filter(Boolean) as string[];
  }
  
  // If it's a string that might be JSON
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return safeArray(parsed, fallback);
      return [value];
    } catch {
      return [value];
    }
  }
  
  // If it's an object with an array property
  if (typeof value === 'object') {
    if (value.trends) return safeArray(value.trends, fallback);
    if (value.items) return safeArray(value.items, fallback);
    if (value.list) return safeArray(value.list, fallback);
    if (value.data) return safeArray(value.data, fallback);
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
