/**
 * API client for Defend Earth backend
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';

export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      console.log('API request to:', url);
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      console.log('API response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API response data:', data);
      return { data };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        data: {} as T,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // NASA NEO API - Use backend proxy to avoid CORS issues
  async searchAsteroids(params: {
    name?: string;
    hazardousOnly?: boolean;
    minDiameter?: number;
    maxDiameter?: number;
    limit?: number;
  }) {
    console.log('🔍 searchAsteroids called with params:', params);
    console.log('🔍 Using backend proxy instead of direct NASA API call');
    
    try {
      // Use backend proxy instead of direct NASA API call
      const searchParams = new URLSearchParams();
      if (params.limit) searchParams.append('limit', Math.min(params.limit, 20).toString());
      if (params.hazardousOnly) searchParams.append('hazardousOnly', 'true');
      if (params.minDiameter) searchParams.append('minDiameter', params.minDiameter.toString());
      if (params.maxDiameter) searchParams.append('maxDiameter', params.maxDiameter.toString());
      if (params.name) searchParams.append('name', params.name);
      
      const url = `${this.baseUrl}/api/asteroids/search?${searchParams}`;
      console.log('🔍 Calling backend proxy for NASA API:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Backend proxy error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Backend proxy response:', data);

      return {
        data: {
          near_earth_objects: {
            [new Date().toISOString().split('T')[0]]: data.near_earth_objects || []
          }
        },
        error: undefined
      };
    } catch (error) {
      console.error('Backend proxy call failed:', error);
      
      // Fallback to enhanced sample data
      const sampleAsteroids = [
        {
          id: '2000433',
          name: '2000433 (2006 QQ23)',
          is_potentially_hazardous_asteroid: true,
          estimated_diameter: {
            meters: {
              estimated_diameter_min: 250,
              estimated_diameter_max: 560
            }
          },
          close_approach_data: [{
            close_approach_date: '2024-11-15',
            relative_velocity: {
              kilometers_per_second: '15.2'
            }
          }],
          orbital_data: {
            semi_major_axis: '1.2',
            eccentricity: '0.3',
            inclination: '15.5',
            perihelion_distance: '0.84',
            aphelion_distance: '1.56',
            orbital_period: '438.0'
          }
        },
        {
          id: '2001620',
          name: '2001620 (2007 DB)',
          is_potentially_hazardous_asteroid: false,
          estimated_diameter: {
            meters: {
              estimated_diameter_min: 100,
              estimated_diameter_max: 220
            }
          },
          close_approach_data: [{
            close_approach_date: '2024-12-01',
            relative_velocity: {
              kilometers_per_second: '12.8'
            }
          }],
          orbital_data: {
            semi_major_axis: '1.5',
            eccentricity: '0.25',
            inclination: '8.2',
            perihelion_distance: '1.125',
            aphelon_distance: '1.875',
            orbital_period: '671.0'
          }
        },
        {
          id: '2001915',
          name: '2001915 (2007 TU24)',
          is_potentially_hazardous_asteroid: true,
          estimated_diameter: {
            meters: {
              estimated_diameter_min: 150,
              estimated_diameter_max: 340
            }
          },
          close_approach_data: [{
            close_approach_date: '2024-12-10',
            relative_velocity: {
              kilometers_per_second: '18.5'
            }
          }],
          orbital_data: {
            semi_major_axis: '1.1',
            eccentricity: '0.4',
            inclination: '22.1',
            perihelion_distance: '0.66',
            aphelion_distance: '1.54',
            orbital_period: '408.0'
          }
        },
        {
          id: '2004179',
          name: '2004179 (2004 MN4)',
          is_potentially_hazardous_asteroid: true,
          estimated_diameter: {
            meters: {
              estimated_diameter_min: 300,
              estimated_diameter_max: 600
            }
          },
          close_approach_data: [{
            close_approach_date: '2024-12-20',
            relative_velocity: {
              kilometers_per_second: '20.1'
            }
          }],
          orbital_data: {
            semi_major_axis: '0.92',
            eccentricity: '0.19',
            inclination: '3.3',
            perihelion_distance: '0.745',
            aphelion_distance: '1.095',
            orbital_period: '323.0'
          }
        },
        {
          id: '2008666',
          name: '2008666 (2004 VD17)',
          is_potentially_hazardous_asteroid: true,
          estimated_diameter: {
            meters: {
              estimated_diameter_min: 200,
              estimated_diameter_max: 450
            }
          },
          close_approach_data: [{
            close_approach_date: '2024-12-25',
            relative_velocity: {
              kilometers_per_second: '16.7'
            }
          }],
          orbital_data: {
            semi_major_axis: '1.3',
            eccentricity: '0.35',
            inclination: '12.8',
            perihelion_distance: '0.845',
            aphelion_distance: '1.755',
            orbital_period: '540.0'
          }
        }
      ];
      
      console.log('Using enhanced sample asteroid data due to API issues');
      return {
        data: {
          near_earth_objects: {
            [new Date().toISOString().split('T')[0]]: sampleAsteroids
          }
        },
        error: 'Using sample data - NASA API unavailable'
      };
    }
  }

  async getAsteroid(id: string) {
    return this.request(`/api/neo/asteroid/${id}`);
  }

  async getAsteroidFeed(startDate: string, endDate: string, detailed = false) {
    return this.request(`/api/neo/feed?start_date=${startDate}&end_date=${endDate}&detailed=${detailed}`);
  }

  async browseAsteroids(page = 0, size = 20) {
    return this.request(`/api/neo/browse?page=${page}&size=${size}`);
  }

  async getAsteroidStats() {
    return this.request('/api/neo/stats');
  }

  async getCloseApproaches(
    startDate: string,
    endDate: string,
    minDistance?: number,
    maxDistance?: number
  ) {
    const searchParams = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
    });
    if (minDistance) searchParams.append('min_distance', minDistance.toString());
    if (maxDistance) searchParams.append('max_distance', maxDistance.toString());

    return this.request(`/api/neo/close-approaches?${searchParams}`);
  }

  // Simulation API
  async simulateImpact(request: any) {
    return this.request('/api/simulate/impact', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async simulateDeflection(scenario: any, deflection: any) {
    return this.request('/api/simulate/deflection', {
      method: 'POST',
      body: JSON.stringify({ scenario, deflection }),
    });
  }

  async getPhysicsConstants() {
    return this.request('/api/simulate/physics/constants');
  }

  async getPresetScenarios() {
    return this.request('/api/simulate/scenarios/presets');
  }

  // USGS API
  async getEarthquakes(params: {
    startTime: string;
    endTime: string;
    minMagnitude?: number;
    maxMagnitude?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams({
      start_time: params.startTime,
      end_time: params.endTime,
    });
    if (params.minMagnitude) searchParams.append('min_magnitude', params.minMagnitude.toString());
    if (params.maxMagnitude) searchParams.append('max_magnitude', params.maxMagnitude.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());

    return this.request(`/api/usgs/earthquakes?${searchParams}`);
  }

  async getTsunamiZones() {
    return this.request('/api/usgs/tsunami-zones');
  }

  async getDemTile(z: number, x: number, y: number) {
    return this.request(`/api/usgs/dem/${z}/${x}/${y}`);
  }

  // Tile API
  async getDemTilePng(z: number, x: number, y: number) {
    const response = await fetch(`${this.baseUrl}/api/tiles/dem/${z}/${x}/${y}.png`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.blob();
  }

  async getPopulationTile(z: number, x: number, y: number) {
    const response = await fetch(`${this.baseUrl}/api/tiles/population/${z}/${x}/${y}.png`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.blob();
  }

  async getTsunamiTile(z: number, x: number, y: number) {
    const response = await fetch(`${this.baseUrl}/api/tiles/tsunami/${z}/${x}/${y}.png`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.blob();
  }

  async getImpactTile(z: number, x: number, y: number) {
    const response = await fetch(`${this.baseUrl}/api/tiles/impact/${z}/${x}/${y}.png`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.blob();
  }

  async getAvailableLayers() {
    return this.request('/api/tiles/layers');
  }

  // Demo API
  async getDemoScenario() {
    return this.request('/api/demo/impactor-2025');
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
}

// Create default API client instance
export const apiClient = new ApiClient();

// Export types for use in components
export type { ApiResponse };
