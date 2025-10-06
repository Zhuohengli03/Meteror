/**
 * Colorblind-Safe Color Palette Utilities
 * 
 * Provides color palettes that are accessible to users with various types of
 * color vision deficiency (CVD) including protanopia, deuteranopia, and tritanopia.
 */

export type ColorVisionDeficiency = 'normal' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'protanomaly' | 'deuteranomaly' | 'tritanomaly';

export interface ColorPalette {
  name: string;
  colors: string[];
  description: string;
  cvdSafe: boolean;
}

export interface ColorInfo {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  name: string;
  description: string;
}

/**
 * Base color palettes optimized for colorblind accessibility
 */
export const COLOR_PALETTES: Record<string, ColorPalette> = {
  // Primary palette - high contrast, CVD safe
  primary: {
    name: 'Primary',
    colors: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'],
    description: 'High contrast colors safe for all types of color vision deficiency',
    cvdSafe: true
  },
  
  // Sequential palette - for ordered data
  sequential: {
    name: 'Sequential',
    colors: ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#08519c', '#08306b'],
    description: 'Sequential color scheme for ordered data visualization',
    cvdSafe: true
  },
  
  // Diverging palette - for data with a meaningful center
  diverging: {
    name: 'Diverging',
    colors: ['#8e0152', '#c51b7d', '#de77ae', '#f1b6da', '#fde0ef', '#f7f7f7', '#e6f5d0', '#b8e186', '#7fbc41', '#4d9221', '#276419'],
    description: 'Diverging color scheme for data with a meaningful center point',
    cvdSafe: true
  },
  
  // Qualitative palette - for categorical data
  qualitative: {
    name: 'Qualitative',
    colors: ['#e31a1c', '#1f78b4', '#33a02c', '#ff7f00', '#6a3d9a', '#b15928', '#a6cee3', '#b2df8a', '#fb9a99', '#fdbf6f'],
    description: 'Qualitative color scheme for categorical data visualization',
    cvdSafe: true
  },
  
  // Impact severity palette - for impact zones
  impact: {
    name: 'Impact Severity',
    colors: ['#4CAF50', '#8BC34A', '#FFC107', '#FF9800', '#F44336'],
    description: 'Color scheme for impact severity levels (minor to extreme)',
    cvdSafe: true
  },
  
  // Tsunami severity palette
  tsunami: {
    name: 'Tsunami Severity',
    colors: ['#E3F2FD', '#BBDEFB', '#90CAF9', '#64B5F6', '#42A5F5', '#2196F3', '#1E88E5', '#1976D2', '#1565C0', '#0D47A1'],
    description: 'Color scheme for tsunami wave heights and severity',
    cvdSafe: true
  },
  
  // Seismic intensity palette
  seismic: {
    name: 'Seismic Intensity',
    colors: ['#F3E5F5', '#E1BEE7', '#CE93D8', '#BA68C8', '#AB47BC', '#9C27B0', '#8E24AA', '#7B1FA2', '#6A1B9A', '#4A148C'],
    description: 'Color scheme for seismic intensity and ground motion',
    cvdSafe: true
  },
  
  // Population density palette
  population: {
    name: 'Population Density',
    colors: ['#FFF3E0', '#FFE0B2', '#FFCC80', '#FFB74D', '#FFA726', '#FF9800', '#FB8C00', '#F57C00', '#EF6C00', '#E65100'],
    description: 'Color scheme for population density visualization',
    cvdSafe: true
  },
  
  // Economic impact palette
  economic: {
    name: 'Economic Impact',
    colors: ['#E8F5E8', '#C8E6C9', '#A5D6A7', '#81C784', '#66BB6A', '#4CAF50', '#43A047', '#388E3C', '#2E7D32', '#1B5E20'],
    description: 'Color scheme for economic impact and loss visualization',
    cvdSafe: true
  }
};

/**
 * Color names and descriptions
 */
export const COLOR_NAMES: Record<string, string> = {
  '#1f77b4': 'Blue',
  '#ff7f0e': 'Orange',
  '#2ca02c': 'Green',
  '#d62728': 'Red',
  '#9467bd': 'Purple',
  '#8c564b': 'Brown',
  '#e377c2': 'Pink',
  '#7f7f7f': 'Gray',
  '#bcbd22': 'Olive',
  '#17becf': 'Cyan',
  '#4CAF50': 'Material Green',
  '#8BC34A': 'Light Green',
  '#FFC107': 'Amber',
  '#FF9800': 'Orange',
  '#F44336': 'Red',
  '#E3F2FD': 'Light Blue 50',
  '#BBDEFB': 'Light Blue 100',
  '#90CAF9': 'Light Blue 200',
  '#64B5F6': 'Light Blue 300',
  '#42A5F5': 'Light Blue 400',
  '#2196F3': 'Blue 500',
  '#1E88E5': 'Blue 600',
  '#1976D2': 'Blue 700',
  '#1565C0': 'Blue 800',
  '#0D47A1': 'Blue 900'
};

/**
 * Convert hex color to RGB
 * 
 * @param hex - Hex color string
 * @returns RGB object
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    throw new Error('Invalid hex color');
  }
  
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  };
}

/**
 * Convert RGB to hex
 * 
 * @param r - Red component (0-255)
 * @param g - Green component (0-255)
 * @param b - Blue component (0-255)
 * @returns Hex color string
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(n).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Convert RGB to HSL
 * 
 * @param r - Red component (0-255)
 * @param g - Green component (0-255)
 * @param b - Blue component (0-255)
 * @returns HSL object
 */
export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  
  return {
    h: h * 360,
    s: s * 100,
    l: l * 100
  };
}

/**
 * Convert HSL to RGB
 * 
 * @param h - Hue (0-360)
 * @param s - Saturation (0-100)
 * @param l - Lightness (0-100)
 * @returns RGB object
 */
export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360;
  s /= 100;
  l /= 100;
  
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  
  let r, g, b;
  
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

/**
 * Simulate color vision deficiency
 * 
 * @param hex - Hex color string
 * @param cvd - Type of color vision deficiency
 * @returns Simulated hex color
 */
export function simulateCVD(hex: string, cvd: ColorVisionDeficiency): string {
  const rgb = hexToRgb(hex);
  let r = rgb.r;
  let g = rgb.g;
  let b = rgb.b;
  
  switch (cvd) {
    case 'protanopia':
      // Red-blind
      r = 0.567 * r + 0.433 * g;
      g = 0.558 * r + 0.442 * g;
      b = 0.242 * r + 0.758 * g;
      break;
      
    case 'deuteranopia':
      // Green-blind
      r = 0.625 * r + 0.375 * g;
      g = 0.7 * r + 0.3 * g;
      b = 0.3 * r + 0.7 * g;
      break;
      
    case 'tritanopia':
      // Blue-blind
      r = 0.95 * r + 0.05 * g;
      g = 0.433 * r + 0.567 * g;
      b = 0.475 * r + 0.525 * g;
      break;
      
    case 'protanomaly':
      // Red-weak
      r = 0.817 * r + 0.183 * g;
      g = 0.333 * r + 0.667 * g;
      b = 0.125 * r + 0.875 * g;
      break;
      
    case 'deuteranomaly':
      // Green-weak
      r = 0.8 * r + 0.2 * g;
      g = 0.258 * r + 0.742 * g;
      b = 0.142 * r + 0.858 * g;
      break;
      
    case 'tritanomaly':
      // Blue-weak
      r = 0.967 * r + 0.033 * g;
      g = 0.733 * r + 0.267 * g;
      b = 0.183 * r + 0.817 * g;
      break;
      
    case 'normal':
    default:
      // No simulation
      break;
  }
  
  return rgbToHex(r, g, b);
}

/**
 * Get color information
 * 
 * @param hex - Hex color string
 * @returns Color information object
 */
export function getColorInfo(hex: string): ColorInfo {
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const name = COLOR_NAMES[hex] || 'Unknown';
  
  return {
    hex,
    rgb,
    hsl,
    name,
    description: `RGB(${rgb.r}, ${rgb.g}, ${rgb.b}), HSL(${hsl.h.toFixed(1)}°, ${hsl.s.toFixed(1)}%, ${hsl.l.toFixed(1)}%)`
  };
}

/**
 * Get a color from a palette by index
 * 
 * @param paletteName - Name of the palette
 * @param index - Color index
 * @returns Hex color string
 */
export function getColorFromPalette(paletteName: string, index: number): string {
  const palette = COLOR_PALETTES[paletteName];
  if (!palette) {
    throw new Error(`Unknown palette: ${paletteName}`);
  }
  
  const colorIndex = index % palette.colors.length;
  return palette.colors[colorIndex];
}

/**
 * Get a color from a palette by name
 * 
 * @param paletteName - Name of the palette
 * @param colorName - Name of the color
 * @returns Hex color string
 */
export function getColorByName(paletteName: string, colorName: string): string {
  const palette = COLOR_PALETTES[paletteName];
  if (!palette) {
    throw new Error(`Unknown palette: ${paletteName}`);
  }
  
  const color = palette.colors.find(c => COLOR_NAMES[c] === colorName);
  if (!color) {
    throw new Error(`Color ${colorName} not found in palette ${paletteName}`);
  }
  
  return color;
}

/**
 * Generate a color scale between two colors
 * 
 * @param startColor - Starting hex color
 * @param endColor - Ending hex color
 * @param steps - Number of steps
 * @returns Array of hex colors
 */
export function generateColorScale(startColor: string, endColor: string, steps: number): string[] {
  const startRgb = hexToRgb(startColor);
  const endRgb = hexToRgb(endColor);
  const colors: string[] = [];
  
  for (let i = 0; i < steps; i++) {
    const ratio = i / (steps - 1);
    const r = Math.round(startRgb.r + (endRgb.r - startRgb.r) * ratio);
    const g = Math.round(startRgb.g + (endRgb.g - startRgb.g) * ratio);
    const b = Math.round(startRgb.b + (endRgb.b - startRgb.b) * ratio);
    
    colors.push(rgbToHex(r, g, b));
  }
  
  return colors;
}

/**
 * Get a color that contrasts well with the background
 * 
 * @param backgroundColor - Background hex color
 * @param textColors - Array of possible text colors
 * @returns Best contrasting color
 */
export function getContrastingColor(backgroundColor: string, textColors: string[] = ['#000000', '#FFFFFF']): string {
  const bgRgb = hexToRgb(backgroundColor);
  const bgLuminance = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
  
  let bestColor = textColors[0];
  let bestContrast = 0;
  
  for (const color of textColors) {
    const colorRgb = hexToRgb(color);
    const colorLuminance = getLuminance(colorRgb.r, colorRgb.g, colorRgb.b);
    const contrast = (Math.max(bgLuminance, colorLuminance) + 0.05) / (Math.min(bgLuminance, colorLuminance) + 0.05);
    
    if (contrast > bestContrast) {
      bestContrast = contrast;
      bestColor = color;
    }
  }
  
  return bestColor;
}

/**
 * Calculate relative luminance
 * 
 * @param r - Red component (0-255)
 * @param g - Green component (0-255)
 * @param b - Blue component (0-255)
 * @returns Relative luminance (0-1)
 */
export function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Check if two colors have sufficient contrast
 * 
 * @param color1 - First hex color
 * @param color2 - Second hex color
 * @param minContrast - Minimum contrast ratio (default: 4.5)
 * @returns True if colors have sufficient contrast
 */
export function hasSufficientContrast(color1: string, color2: string, minContrast: number = 4.5): boolean {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  const contrast = (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05);
  
  return contrast >= minContrast;
}

/**
 * Get all available palettes
 * 
 * @returns Array of palette names
 */
export function getAvailablePalettes(): string[] {
  return Object.keys(COLOR_PALETTES);
}

/**
 * Get palette information
 * 
 * @param paletteName - Name of the palette
 * @returns Palette information
 */
export function getPaletteInfo(paletteName: string): ColorPalette | undefined {
  return COLOR_PALETTES[paletteName];
}

/**
 * Create a custom color palette
 * 
 * @param name - Palette name
 * @param colors - Array of hex colors
 * @param description - Palette description
 * @param cvdSafe - Whether palette is CVD safe
 * @returns Custom color palette
 */
export function createCustomPalette(
  name: string,
  colors: string[],
  description: string,
  cvdSafe: boolean = false
): ColorPalette {
  return {
    name,
    colors,
    description,
    cvdSafe
  };
}

/**
 * Validate color palette for CVD safety
 * 
 * @param colors - Array of hex colors
 * @returns CVD safety analysis
 */
export function validateCVDSafety(colors: string[]): {
  safe: boolean;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  // Check for sufficient contrast between adjacent colors
  for (let i = 0; i < colors.length - 1; i++) {
    if (!hasSufficientContrast(colors[i], colors[i + 1], 3.0)) {
      issues.push(`Insufficient contrast between colors ${i} and ${i + 1}`);
    }
  }
  
  // Check for colorblind simulation
  const cvdTypes: ColorVisionDeficiency[] = ['protanopia', 'deuteranopia', 'tritanopia'];
  
  for (const cvd of cvdTypes) {
    const simulatedColors = colors.map(color => simulateCVD(color, cvd));
    const uniqueColors = new Set(simulatedColors);
    
    if (uniqueColors.size < colors.length * 0.8) {
      issues.push(`Colors may be indistinguishable for ${cvd}`);
      recommendations.push(`Consider using more distinct colors for ${cvd} users`);
    }
  }
  
  // Check for sufficient lightness variation
  const luminances = colors.map(color => {
    const rgb = hexToRgb(color);
    return getLuminance(rgb.r, rgb.g, rgb.b);
  });
  
  const minLuminance = Math.min(...luminances);
  const maxLuminance = Math.max(...luminances);
  const luminanceRange = maxLuminance - minLuminance;
  
  if (luminanceRange < 0.3) {
      issues.push('Insufficient lightness variation');
      recommendations.push('Consider using colors with more varied lightness');
  }
  
  return {
    safe: issues.length === 0,
    issues,
    recommendations
  };
}
