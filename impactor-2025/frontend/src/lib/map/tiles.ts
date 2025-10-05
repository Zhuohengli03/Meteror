/**
 * Map Tile Adapter
 * 
 * Handles map tile requests for DEM, population density, and tsunami zones.
 * Provides fallback mechanisms and caching for optimal performance.
 */

export interface TileRequest {
  z: number;
  x: number;
  y: number;
  format: 'png' | 'webp' | 'mvt';
  layer: 'dem' | 'population' | 'tsunami' | 'coastline';
}

export interface TileResponse {
  data: ArrayBuffer;
  contentType: string;
  cacheControl: string;
  etag: string;
}

export interface TileCache {
  get(key: string): TileResponse | null;
  set(key: string, value: TileResponse): void;
  has(key: string): boolean;
  delete(key: string): void;
  clear(): void;
}

export interface TileProvider {
  name: string;
  baseUrl: string;
  maxZoom: number;
  minZoom: number;
  format: 'png' | 'webp' | 'mvt';
  attribution: string;
  subdomains?: string[];
}

/**
 * Tile providers for different data types
 */
export const TILE_PROVIDERS: Record<string, TileProvider> = {
  // DEM tiles
  dem: {
    name: 'Digital Elevation Model',
    baseUrl: '/api/tiles/dem',
    maxZoom: 18,
    minZoom: 0,
    format: 'png',
    attribution: 'USGS National Elevation Dataset'
  },
  
  // Population density tiles
  population: {
    name: 'Population Density',
    baseUrl: '/api/tiles/population',
    maxZoom: 18,
    minZoom: 0,
    format: 'png',
    attribution: 'GPW v4, WorldPop'
  },
  
  // Tsunami hazard zones
  tsunami: {
    name: 'Tsunami Hazard Zones',
    baseUrl: '/api/tiles/tsunami',
    maxZoom: 18,
    minZoom: 0,
    format: 'mvt',
    attribution: 'USGS Tsunami Hazard Assessment'
  },
  
  // Coastline data
  coastline: {
    name: 'Coastlines',
    baseUrl: '/api/tiles/coastline',
    maxZoom: 18,
    minZoom: 0,
    format: 'mvt',
    attribution: 'Natural Earth'
  }
};

/**
 * Simple in-memory tile cache
 */
class MemoryTileCache implements TileCache {
  private cache = new Map<string, TileResponse>();
  private maxSize = 1000; // Maximum number of tiles to cache
  
  get(key: string): TileResponse | null {
    return this.cache.get(key) || null;
  }
  
  set(key: string, value: TileResponse): void {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
  
  has(key: string): boolean {
    return this.cache.has(key);
  }
  
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
}

/**
 * Generate cache key for tile request
 * 
 * @param request - Tile request
 * @returns Cache key
 */
export function generateCacheKey(request: TileRequest): string {
  return `${request.layer}/${request.z}/${request.x}/${request.y}.${request.format}`;
}

/**
 * Generate tile URL
 * 
 * @param request - Tile request
 * @param provider - Tile provider
 * @returns Tile URL
 */
export function generateTileUrl(request: TileRequest, provider: TileProvider): string {
  const { z, x, y, format } = request;
  const { baseUrl, subdomains } = provider;
  
  // Use subdomain if available for load balancing
  const subdomain = subdomains ? subdomains[Math.floor(Math.random() * subdomains.length)] : '';
  const base = subdomain ? baseUrl.replace('://', `://${subdomain}.`) : baseUrl;
  
  return `${base}/${z}/${x}/${y}.${format}`;
}

/**
 * Validate tile request
 * 
 * @param request - Tile request
 * @param provider - Tile provider
 * @returns Validation result
 */
export function validateTileRequest(request: TileRequest, provider: TileProvider): {
  valid: boolean;
  error?: string;
} {
  const { z, x, y, format, layer } = request;
  
  // Check zoom level
  if (z < provider.minZoom || z > provider.maxZoom) {
    return {
      valid: false,
      error: `Zoom level ${z} is not supported. Range: ${provider.minZoom}-${provider.maxZoom}`
    };
  }
  
  // Check tile coordinates
  const maxTiles = Math.pow(2, z);
  if (x < 0 || x >= maxTiles || y < 0 || y >= maxTiles) {
    return {
      valid: false,
      error: `Tile coordinates (${x}, ${y}) are out of range for zoom level ${z}`
    };
  }
  
  // Check format
  if (format !== provider.format) {
    return {
      valid: false,
      error: `Format ${format} is not supported. Expected: ${provider.format}`
    };
  }
  
  // Check layer
  if (!TILE_PROVIDERS[layer]) {
    return {
      valid: false,
      error: `Unknown layer: ${layer}`
    };
  }
  
  return { valid: true };
}

/**
 * Fetch tile from server
 * 
 * @param request - Tile request
 * @param provider - Tile provider
 * @returns Promise resolving to tile response
 */
export async function fetchTile(request: TileRequest, provider: TileProvider): Promise<TileResponse> {
  const validation = validateTileRequest(request, provider);
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  
  const url = generateTileUrl(request, provider);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': getContentType(request.format),
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.arrayBuffer();
    const contentType = response.headers.get('Content-Type') || getContentType(request.format);
    const cacheControl = response.headers.get('Cache-Control') || 'public, max-age=3600';
    const etag = response.headers.get('ETag') || '';
    
    return {
      data,
      contentType,
      cacheControl,
      etag
    };
  } catch (error) {
    throw new Error(`Failed to fetch tile: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get content type for tile format
 * 
 * @param format - Tile format
 * @returns MIME type
 */
export function getContentType(format: string): string {
  const contentTypes: Record<string, string> = {
    'png': 'image/png',
    'webp': 'image/webp',
    'mvt': 'application/vnd.mapbox-vector-tile',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg'
  };
  
  return contentTypes[format] || 'application/octet-stream';
}

/**
 * Create tile cache
 * 
 * @param maxSize - Maximum cache size
 * @returns Tile cache instance
 */
export function createTileCache(maxSize: number = 1000): TileCache {
  return new MemoryTileCache();
}

/**
 * Tile manager class
 */
export class TileManager {
  private cache: TileCache;
  private providers: Record<string, TileProvider>;
  
  constructor(cache?: TileCache) {
    this.cache = cache || createTileCache();
    this.providers = { ...TILE_PROVIDERS };
  }
  
  /**
   * Get tile data
   * 
   * @param request - Tile request
   * @returns Promise resolving to tile response
   */
  async getTile(request: TileRequest): Promise<TileResponse> {
    const provider = this.providers[request.layer];
    if (!provider) {
      throw new Error(`Unknown layer: ${request.layer}`);
    }
    
    const cacheKey = generateCacheKey(request);
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }
    
    // Fetch from server
    const response = await fetchTile(request, provider);
    
    // Cache the response
    this.cache.set(cacheKey, response);
    
    return response;
  }
  
  /**
   * Preload tiles for a bounding box
   * 
   * @param bbox - Bounding box [minLon, minLat, maxLon, maxLat]
   * @param zoom - Zoom level
   * @param layer - Layer name
   * @param format - Tile format
   * @returns Promise resolving when preload is complete
   */
  async preloadTiles(
    bbox: [number, number, number, number],
    zoom: number,
    layer: string,
    format: string = 'png'
  ): Promise<void> {
    const [minLon, minLat, maxLon, maxLat] = bbox;
    const provider = this.providers[layer];
    
    if (!provider) {
      throw new Error(`Unknown layer: ${layer}`);
    }
    
    // Convert lat/lon to tile coordinates
    const minTileX = Math.floor((minLon + 180) / 360 * Math.pow(2, zoom));
    const maxTileX = Math.floor((maxLon + 180) / 360 * Math.pow(2, zoom));
    const minTileY = Math.floor((1 - Math.log(Math.tan(maxLat * Math.PI / 180) + 1 / Math.cos(maxLat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
    const maxTileY = Math.floor((1 - Math.log(Math.tan(minLat * Math.PI / 180) + 1 / Math.cos(minLat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
    
    // Preload tiles
    const promises: Promise<void>[] = [];
    
    for (let x = minTileX; x <= maxTileX; x++) {
      for (let y = minTileY; y <= maxTileY; y++) {
        const request: TileRequest = {
          z: zoom,
          x,
          y,
          format: format as 'png' | 'webp' | 'mvt',
          layer: layer as 'dem' | 'population' | 'tsunami' | 'coastline'
        };
        
        promises.push(
          this.getTile(request).catch(error => {
            console.warn(`Failed to preload tile ${x},${y} at zoom ${zoom}:`, error);
          })
        );
      }
    }
    
    await Promise.all(promises);
  }
  
  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
  
  /**
   * Get cache statistics
   * 
   * @returns Cache statistics
   */
  getCacheStats(): { size: number; maxSize: number } {
    return {
      size: (this.cache as MemoryTileCache).cache.size,
      maxSize: (this.cache as MemoryTileCache).maxSize
    };
  }
  
  /**
   * Add custom tile provider
   * 
   * @param name - Provider name
   * @param provider - Provider configuration
   */
  addProvider(name: string, provider: TileProvider): void {
    this.providers[name] = provider;
  }
  
  /**
   * Remove tile provider
   * 
   * @param name - Provider name
   */
  removeProvider(name: string): void {
    delete this.providers[name];
  }
  
  /**
   * Get available providers
   * 
   * @returns Array of provider names
   */
  getProviders(): string[] {
    return Object.keys(this.providers);
  }
}

/**
 * Create tile manager instance
 * 
 * @param cache - Optional tile cache
 * @returns Tile manager instance
 */
export function createTileManager(cache?: TileCache): TileManager {
  return new TileManager(cache);
}

/**
 * Convert lat/lon to tile coordinates
 * 
 * @param lat - Latitude
 * @param lon - Longitude
 * @param zoom - Zoom level
 * @returns Tile coordinates [x, y]
 */
export function latLonToTile(lat: number, lon: number, zoom: number): [number, number] {
  const x = Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
  const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
  return [x, y];
}

/**
 * Convert tile coordinates to lat/lon
 * 
 * @param x - Tile X coordinate
 * @param y - Tile Y coordinate
 * @param zoom - Zoom level
 * @returns Lat/lon coordinates [lat, lon]
 */
export function tileToLatLon(x: number, y: number, zoom: number): [number, number] {
  const n = Math.pow(2, zoom);
  const lon = x / n * 360 - 180;
  const lat = Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n))) * 180 / Math.PI;
  return [lat, lon];
}

/**
 * Get tile bounds
 * 
 * @param x - Tile X coordinate
 * @param y - Tile Y coordinate
 * @param zoom - Zoom level
 * @returns Bounding box [minLon, minLat, maxLon, maxLat]
 */
export function getTileBounds(x: number, y: number, zoom: number): [number, number, number, number] {
  const [minLat, minLon] = tileToLatLon(x, y + 1, zoom);
  const [maxLat, maxLon] = tileToLatLon(x + 1, y, zoom);
  return [minLon, minLat, maxLon, maxLat];
}

/**
 * Check if tile exists
 * 
 * @param request - Tile request
 * @param provider - Tile provider
 * @returns Promise resolving to boolean
 */
export async function tileExists(request: TileRequest, provider: TileProvider): Promise<boolean> {
  try {
    const url = generateTileUrl(request, provider);
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get tile metadata
 * 
 * @param request - Tile request
 * @param provider - Tile provider
 * @returns Promise resolving to tile metadata
 */
export async function getTileMetadata(request: TileRequest, provider: TileProvider): Promise<{
  exists: boolean;
  size: number;
  lastModified: string;
  etag: string;
}> {
  try {
    const url = generateTileUrl(request, provider);
    const response = await fetch(url, { method: 'HEAD' });
    
    if (!response.ok) {
      return {
        exists: false,
        size: 0,
        lastModified: '',
        etag: ''
      };
    }
    
    return {
      exists: true,
      size: parseInt(response.headers.get('Content-Length') || '0'),
      lastModified: response.headers.get('Last-Modified') || '',
      etag: response.headers.get('ETag') || ''
    };
  } catch {
    return {
      exists: false,
      size: 0,
      lastModified: '',
      etag: ''
    };
  }
}
