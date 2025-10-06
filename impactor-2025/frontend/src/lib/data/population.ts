/**
 * Population and economic data for impact analysis
 * Sources: NASA Socioeconomic Data and Applications Center (SEDAC), World Bank, UN
 */

export interface CityData {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  population: number;
  gdp_per_capita: number;
  distance_from_impact: number;
  exposure_level: 'low' | 'medium' | 'high' | 'extreme';
}

export interface EconomicImpact {
  total_economic_loss: number; // USD
  population_affected: number;
  cities_affected: CityData[];
  gdp_impact_percentage: number;
}

// Major world cities with population and economic data
// Source: NASA SEDAC Gridded Population of the World (GPW) v4, World Bank GDP data
export const MAJOR_CITIES: CityData[] = [
  // North America
  { name: "New York", country: "USA", latitude: 40.7128, longitude: -74.0060, population: 8336817, gdp_per_capita: 65000, distance_from_impact: 0, exposure_level: 'low' },
  { name: "Los Angeles", country: "USA", latitude: 34.0522, longitude: -118.2437, population: 3971883, gdp_per_capita: 65000, distance_from_impact: 0, exposure_level: 'low' },
  { name: "Chicago", country: "USA", latitude: 41.8781, longitude: -87.6298, population: 2693976, gdp_per_capita: 65000, distance_from_impact: 0, exposure_level: 'low' },
  { name: "Houston", country: "USA", latitude: 29.7604, longitude: -95.3698, population: 2320268, gdp_per_capita: 65000, distance_from_impact: 0, exposure_level: 'low' },
  { name: "Toronto", country: "Canada", latitude: 43.6532, longitude: -79.3832, population: 2930000, gdp_per_capita: 45000, distance_from_impact: 0, exposure_level: 'low' },
  { name: "Mexico City", country: "Mexico", latitude: 19.4326, longitude: -99.1332, population: 9209944, gdp_per_capita: 20000, distance_from_impact: 0, exposure_level: 'low' },

  // Europe
  { name: "London", country: "UK", latitude: 51.5074, longitude: -0.1278, population: 8982000, gdp_per_capita: 42000, distance_from_impact: 0, exposure_level: 'low' },
  { name: "Paris", country: "France", latitude: 48.8566, longitude: 2.3522, population: 2161000, gdp_per_capita: 40000, distance_from_impact: 0, exposure_level: 'low' },
  { name: "Berlin", country: "Germany", latitude: 52.5200, longitude: 13.4050, population: 3769000, gdp_per_capita: 45000, distance_from_impact: 0, exposure_level: 'low' },
  { name: "Madrid", country: "Spain", latitude: 40.4168, longitude: -3.7038, population: 3223000, gdp_per_capita: 30000, distance_from_impact: 0, exposure_level: 'low' },
  { name: "Rome", country: "Italy", latitude: 41.9028, longitude: 12.4964, population: 2873000, gdp_per_capita: 35000, distance_from_impact: 0, exposure_level: 'low' },
  { name: "Moscow", country: "Russia", latitude: 55.7558, longitude: 37.6176, population: 12615000, gdp_per_capita: 12000, distance_from_impact: 0, exposure_level: 'low' },

  // Asia
  { name: "Tokyo", country: "Japan", latitude: 35.6762, longitude: 139.6503, population: 13929286, gdp_per_capita: 40000, distance_from_impact: 0, exposure_level: 'low' },
  { name: "Shanghai", country: "China", latitude: 31.2304, longitude: 121.4737, population: 24870895, gdp_per_capita: 15000, distance_from_impact: 0, exposure_level: 'low' },
  { name: "Beijing", country: "China", latitude: 39.9042, longitude: 116.4074, population: 21540000, gdp_per_capita: 15000, distance_from_impact: 0, exposure_level: 'low' },
  { name: "Mumbai", country: "India", latitude: 19.0760, longitude: 72.8777, population: 12478447, gdp_per_capita: 2000, distance_from_impact: 0, exposure_level: 'low' },
  { name: "Delhi", country: "India", latitude: 28.7041, longitude: 77.1025, population: 32941000, gdp_per_capita: 2000, distance_from_impact: 0, exposure_level: 'low' },
  { name: "Seoul", country: "South Korea", latitude: 37.5665, longitude: 126.9780, population: 9720846, gdp_per_capita: 30000, distance_from_impact: 0, exposure_level: 'low' },
  { name: "Bangkok", country: "Thailand", latitude: 13.7563, longitude: 100.5018, population: 10539000, gdp_per_capita: 7000, distance_from_impact: 0, exposure_level: 'low' },

  // Africa
  { name: "Cairo", country: "Egypt", latitude: 30.0444, longitude: 31.2357, population: 20484965, gdp_per_capita: 3000, distance_from_impact: 0, exposure_level: 'low' },
  { name: "Lagos", country: "Nigeria", latitude: 6.5244, longitude: 3.3792, population: 15388000, gdp_per_capita: 2000, distance_from_impact: 0, exposure_level: 'low' },
  { name: "Johannesburg", country: "South Africa", latitude: -26.2041, longitude: 28.0473, population: 5634800, gdp_per_capita: 6000, distance_from_impact: 0, exposure_level: 'low' },
  { name: "Nairobi", country: "Kenya", latitude: -1.2921, longitude: 36.8219, population: 4397073, gdp_per_capita: 2000, distance_from_impact: 0, exposure_level: 'low' },

  // South America
  { name: "São Paulo", country: "Brazil", latitude: -23.5505, longitude: -46.6333, population: 12325232, gdp_per_capita: 15000, distance_from_impact: 0, exposure_level: 'low' },
  { name: "Buenos Aires", country: "Argentina", latitude: -34.6118, longitude: -58.3960, population: 3075646, gdp_per_capita: 12000, distance_from_impact: 0, exposure_level: 'low' },
  { name: "Lima", country: "Peru", latitude: -12.0464, longitude: -77.0428, population: 10750000, gdp_per_capita: 6000, distance_from_impact: 0, exposure_level: 'low' },
  { name: "Bogotá", country: "Colombia", latitude: 4.7110, longitude: -74.0721, population: 10700000, gdp_per_capita: 6000, distance_from_impact: 0, exposure_level: 'low' },

  // Oceania
  { name: "Sydney", country: "Australia", latitude: -33.8688, longitude: 151.2093, population: 5312163, gdp_per_capita: 55000, distance_from_impact: 0, exposure_level: 'low' },
  { name: "Melbourne", country: "Australia", latitude: -37.8136, longitude: 144.9631, population: 5078193, gdp_per_capita: 55000, distance_from_impact: 0, exposure_level: 'low' },
];

/**
 * Calculate distance between two points on Earth's surface
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Calculate economic impact based on impact parameters and affected cities
 */
export function calculateEconomicImpact(
  impactLatitude: number,
  impactLongitude: number,
  craterDiameter: number, // km
  blastRadius: number, // km
  tsunamiRadius: number // km
): EconomicImpact {
  const affectedCities: CityData[] = [];
  let totalPopulationAffected = 0;
  let totalEconomicLoss = 0;

  // Calculate affected cities based on impact radius
  const totalImpactRadius = Math.max(blastRadius, tsunamiRadius, craterDiameter * 2);

  for (const city of MAJOR_CITIES) {
    const distance = calculateDistance(impactLatitude, impactLongitude, city.latitude, city.longitude);
    
    if (distance <= totalImpactRadius) {
      // Determine exposure level based on distance
      let exposureLevel: 'low' | 'medium' | 'high' | 'extreme' = 'low';
      if (distance <= craterDiameter) {
        exposureLevel = 'extreme';
      } else if (distance <= blastRadius) {
        exposureLevel = 'high';
      } else if (distance <= tsunamiRadius) {
        exposureLevel = 'medium';
      } else {
        exposureLevel = 'low';
      }

      const affectedCity: CityData = {
        ...city,
        distance_from_impact: distance,
        exposure_level: exposureLevel
      };

      affectedCities.push(affectedCity);
      totalPopulationAffected += city.population;

      // Calculate economic loss based on exposure level and GDP
      const cityGDP = city.population * city.gdp_per_capita;
      let lossMultiplier = 0;
      
      switch (exposureLevel) {
        case 'extreme':
          lossMultiplier = 0.8; // 80% loss
          break;
        case 'high':
          lossMultiplier = 0.4; // 40% loss
          break;
        case 'medium':
          lossMultiplier = 0.2; // 20% loss
          break;
        case 'low':
          lossMultiplier = 0.05; // 5% loss
          break;
      }

      totalEconomicLoss += cityGDP * lossMultiplier;
    }
  }

  // Calculate total world GDP for percentage calculation
  const totalWorldGDP = MAJOR_CITIES.reduce((sum, city) => sum + (city.population * city.gdp_per_capita), 0);
  const gdpImpactPercentage = (totalEconomicLoss / totalWorldGDP) * 100;

  return {
    total_economic_loss: totalEconomicLoss,
    population_affected: totalPopulationAffected,
    cities_affected: affectedCities,
    gdp_impact_percentage: gdpImpactPercentage
  };
}

/**
 * Data sources and methodology:
 * 1. Population data: NASA SEDAC Gridded Population of the World (GPW) v4
 *    - Source: https://sedac.ciesin.columbia.edu/data/collection/gpw-v4
 * 2. GDP per capita data: World Bank Open Data
 *    - Source: https://data.worldbank.org/indicator/NY.GDP.PCAP.CD
 * 3. City coordinates: OpenStreetMap and GeoNames
 * 4. Impact modeling: Based on nuclear blast scaling laws and tsunami propagation models
 * 5. Economic impact: Multiplied by exposure level based on distance from impact
 */
