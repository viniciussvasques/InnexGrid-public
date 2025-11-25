/**
 * Utility functions to format resource values consistently
 * Formats values to max 4 digits with appropriate units
 */

/**
 * Format storage/memory values (bytes to human-readable)
 * Returns value with unit (GB, TB, etc.) - max 4 digits
 */
export function formatStorage(bytes: number): { value: number; unit: string; formatted: string } {
  const GB = 1024 ** 3;
  const TB = 1024 ** 4;
  
  if (bytes >= TB) {
    const tb = bytes / TB;
    // Format to max 4 digits
    if (tb >= 1000) {
      return { value: Math.round(tb), unit: 'TB', formatted: `${Math.round(tb)} TB` };
    } else if (tb >= 100) {
      return { value: Math.round(tb * 10) / 10, unit: 'TB', formatted: `${(Math.round(tb * 10) / 10).toFixed(1)} TB` };
    } else {
      return { value: Math.round(tb * 100) / 100, unit: 'TB', formatted: `${(Math.round(tb * 100) / 100).toFixed(2)} TB` };
    }
  } else {
    const gb = bytes / GB;
    // Format to max 4 digits
    if (gb >= 1000) {
      return { value: Math.round(gb), unit: 'GB', formatted: `${Math.round(gb)} GB` };
    } else if (gb >= 100) {
      return { value: Math.round(gb * 10) / 10, unit: 'GB', formatted: `${(Math.round(gb * 10) / 10).toFixed(1)} GB` };
    } else if (gb >= 10) {
      return { value: Math.round(gb * 10) / 10, unit: 'GB', formatted: `${(Math.round(gb * 10) / 10).toFixed(1)} GB` };
    } else {
      return { value: Math.round(gb * 100) / 100, unit: 'GB', formatted: `${(Math.round(gb * 100) / 100).toFixed(2)} GB` };
    }
  }
}

/**
 * Format compute values (cores)
 * Returns value with unit - max 4 digits
 */
export function formatCompute(cores: number): { value: number; unit: string; formatted: string } {
  if (cores >= 1000) {
    return { value: Math.round(cores), unit: 'cores', formatted: `${Math.round(cores)} cores` };
  } else if (cores >= 100) {
    return { value: Math.round(cores), unit: 'cores', formatted: `${Math.round(cores)} cores` };
  } else {
    return { value: cores, unit: 'cores', formatted: `${cores} cores` };
  }
}

/**
 * Format network values (Mbps)
 * Returns value with unit - max 4 digits
 */
export function formatNetwork(mbps: number): { value: number; unit: string; formatted: string } {
  const Gbps = 1000;
  
  if (mbps >= Gbps) {
    const gbps = mbps / Gbps;
    if (gbps >= 10) {
      return { value: Math.round(gbps), unit: 'Gbps', formatted: `${Math.round(gbps)} Gbps` };
    } else {
      return { value: Math.round(gbps * 10) / 10, unit: 'Gbps', formatted: `${(Math.round(gbps * 10) / 10).toFixed(1)} Gbps` };
    }
  } else {
    if (mbps >= 1000) {
      return { value: Math.round(mbps), unit: 'Mbps', formatted: `${Math.round(mbps)} Mbps` };
    } else if (mbps >= 100) {
      return { value: Math.round(mbps), unit: 'Mbps', formatted: `${Math.round(mbps)} Mbps` };
    } else {
      return { value: Math.round(mbps), unit: 'Mbps', formatted: `${Math.round(mbps)} Mbps` };
    }
  }
}

/**
 * Convert bytes to GB (for calculations)
 */
export function bytesToGB(bytes: number): number {
  return bytes / (1024 ** 3);
}

/**
 * Convert GB to bytes (for calculations)
 */
export function gbToBytes(gb: number): number {
  return gb * (1024 ** 3);
}

