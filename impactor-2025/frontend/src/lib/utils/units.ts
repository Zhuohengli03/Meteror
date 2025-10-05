/**
 * Unit Conversion and Validation Utilities
 * 
 * Provides functions for converting between different units and validating
 * unit values for the Defend Earth impact simulation system.
 */

export type UnitSystem = 'SI' | 'Imperial' | 'Astronomical';

export interface UnitConversion {
  from: string;
  to: string;
  factor: number;
  offset?: number;
}

export interface UnitDefinition {
  name: string;
  symbol: string;
  baseUnit: string;
  factor: number;
  offset?: number;
  category: 'length' | 'mass' | 'time' | 'energy' | 'velocity' | 'acceleration' | 'pressure' | 'temperature';
}

/**
 * Unit definitions for various physical quantities
 */
export const UNIT_DEFINITIONS: Record<string, UnitDefinition> = {
  // Length units
  'm': { name: 'meter', symbol: 'm', baseUnit: 'm', factor: 1, category: 'length' },
  'km': { name: 'kilometer', symbol: 'km', baseUnit: 'm', factor: 1000, category: 'length' },
  'cm': { name: 'centimeter', symbol: 'cm', baseUnit: 'm', factor: 0.01, category: 'length' },
  'mm': { name: 'millimeter', symbol: 'mm', baseUnit: 'm', factor: 0.001, category: 'length' },
  'ft': { name: 'foot', symbol: 'ft', baseUnit: 'm', factor: 0.3048, category: 'length' },
  'mi': { name: 'mile', symbol: 'mi', baseUnit: 'm', factor: 1609.344, category: 'length' },
  'AU': { name: 'astronomical unit', symbol: 'AU', baseUnit: 'm', factor: 1.496e11, category: 'length' },
  'ly': { name: 'light year', symbol: 'ly', baseUnit: 'm', factor: 9.461e15, category: 'length' },
  
  // Mass units
  'kg': { name: 'kilogram', symbol: 'kg', baseUnit: 'kg', factor: 1, category: 'mass' },
  'g': { name: 'gram', symbol: 'g', baseUnit: 'kg', factor: 0.001, category: 'mass' },
  't': { name: 'metric ton', symbol: 't', baseUnit: 'kg', factor: 1000, category: 'mass' },
  'lb': { name: 'pound', symbol: 'lb', baseUnit: 'kg', factor: 0.453592, category: 'mass' },
  'M_E': { name: 'Earth mass', symbol: 'M_E', baseUnit: 'kg', factor: 5.972e24, category: 'mass' },
  'M_S': { name: 'Solar mass', symbol: 'M_S', baseUnit: 'kg', factor: 1.989e30, category: 'mass' },
  
  // Time units
  's': { name: 'second', symbol: 's', baseUnit: 's', factor: 1, category: 'time' },
  'min': { name: 'minute', symbol: 'min', baseUnit: 's', factor: 60, category: 'time' },
  'h': { name: 'hour', symbol: 'h', baseUnit: 's', factor: 3600, category: 'time' },
  'd': { name: 'day', symbol: 'd', baseUnit: 's', factor: 86400, category: 'time' },
  'y': { name: 'year', symbol: 'y', baseUnit: 's', factor: 31557600, category: 'time' },
  
  // Energy units
  'J': { name: 'joule', symbol: 'J', baseUnit: 'J', factor: 1, category: 'energy' },
  'kJ': { name: 'kilojoule', symbol: 'kJ', baseUnit: 'J', factor: 1000, category: 'energy' },
  'MJ': { name: 'megajoule', symbol: 'MJ', baseUnit: 'J', factor: 1e6, category: 'energy' },
  'GJ': { name: 'gigajoule', symbol: 'GJ', baseUnit: 'J', factor: 1e9, category: 'energy' },
  'TJ': { name: 'terajoule', symbol: 'TJ', baseUnit: 'J', factor: 1e12, category: 'energy' },
  'PJ': { name: 'petajoule', symbol: 'PJ', baseUnit: 'J', factor: 1e15, category: 'energy' },
  'EJ': { name: 'exajoule', symbol: 'EJ', baseUnit: 'J', factor: 1e18, category: 'energy' },
  'Mt_TNT': { name: 'megaton TNT', symbol: 'Mt TNT', baseUnit: 'J', factor: 4.184e15, category: 'energy' },
  'kt_TNT': { name: 'kiloton TNT', symbol: 'kt TNT', baseUnit: 'J', factor: 4.184e12, category: 'energy' },
  't_TNT': { name: 'ton TNT', symbol: 't TNT', baseUnit: 'J', factor: 4.184e9, category: 'energy' },
  
  // Velocity units
  'm/s': { name: 'meter per second', symbol: 'm/s', baseUnit: 'm/s', factor: 1, category: 'velocity' },
  'km/s': { name: 'kilometer per second', symbol: 'km/s', baseUnit: 'm/s', factor: 1000, category: 'velocity' },
  'km/h': { name: 'kilometer per hour', symbol: 'km/h', baseUnit: 'm/s', factor: 0.277778, category: 'velocity' },
  'mph': { name: 'mile per hour', symbol: 'mph', baseUnit: 'm/s', factor: 0.44704, category: 'velocity' },
  'ft/s': { name: 'foot per second', symbol: 'ft/s', baseUnit: 'm/s', factor: 0.3048, category: 'velocity' },
  
  // Acceleration units
  'm/s²': { name: 'meter per second squared', symbol: 'm/s²', baseUnit: 'm/s²', factor: 1, category: 'acceleration' },
  'g': { name: 'standard gravity', symbol: 'g', baseUnit: 'm/s²', factor: 9.80665, category: 'acceleration' },
  'ft/s²': { name: 'foot per second squared', symbol: 'ft/s²', baseUnit: 'm/s²', factor: 0.3048, category: 'acceleration' },
  
  // Pressure units
  'Pa': { name: 'pascal', symbol: 'Pa', baseUnit: 'Pa', factor: 1, category: 'pressure' },
  'kPa': { name: 'kilopascal', symbol: 'kPa', baseUnit: 'Pa', factor: 1000, category: 'pressure' },
  'MPa': { name: 'megapascal', symbol: 'MPa', baseUnit: 'Pa', factor: 1e6, category: 'pressure' },
  'GPa': { name: 'gigapascal', symbol: 'GPa', baseUnit: 'Pa', factor: 1e9, category: 'pressure' },
  'bar': { name: 'bar', symbol: 'bar', baseUnit: 'Pa', factor: 1e5, category: 'pressure' },
  'atm': { name: 'atmosphere', symbol: 'atm', baseUnit: 'Pa', factor: 101325, category: 'pressure' },
  'psi': { name: 'pound per square inch', symbol: 'psi', baseUnit: 'Pa', factor: 6894.76, category: 'pressure' },
  
  // Temperature units
  'K': { name: 'kelvin', symbol: 'K', baseUnit: 'K', factor: 1, category: 'temperature' },
  '°C': { name: 'celsius', symbol: '°C', baseUnit: 'K', factor: 1, offset: 273.15, category: 'temperature' },
  '°F': { name: 'fahrenheit', symbol: '°F', baseUnit: 'K', factor: 5/9, offset: 255.372, category: 'temperature' }
};

/**
 * Physical constants in SI units
 */
export const PHYSICAL_CONSTANTS = {
  /** Speed of light in vacuum (m/s) */
  SPEED_OF_LIGHT: 299792458,
  /** Gravitational constant (m³/kg⋅s²) */
  GRAVITATIONAL_CONSTANT: 6.674e-11,
  /** Earth mass (kg) */
  EARTH_MASS: 5.972e24,
  /** Earth radius (m) */
  EARTH_RADIUS: 6.371e6,
  /** Standard gravitational parameter (m³/s²) */
  STANDARD_GRAVITATIONAL_PARAMETER: 3.986e14,
  /** Standard gravity (m/s²) */
  STANDARD_GRAVITY: 9.80665,
  /** Boltzmann constant (J/K) */
  BOLTZMANN_CONSTANT: 1.381e-23,
  /** Avogadro constant (mol⁻¹) */
  AVOGADRO_CONSTANT: 6.022e23,
  /** Planck constant (J⋅s) */
  PLANCK_CONSTANT: 6.626e-34
} as const;

/**
 * Convert a value from one unit to another
 * 
 * @param value - Value to convert
 * @param fromUnit - Source unit symbol
 * @param toUnit - Target unit symbol
 * @returns Converted value
 */
export function convertUnit(value: number, fromUnit: string, toUnit: string): number {
  const fromDef = UNIT_DEFINITIONS[fromUnit];
  const toDef = UNIT_DEFINITIONS[toUnit];
  
  if (!fromDef || !toDef) {
    throw new Error(`Unknown unit: ${fromUnit} or ${toUnit}`);
  }
  
  if (fromDef.category !== toDef.category) {
    throw new Error(`Cannot convert between different unit categories: ${fromDef.category} and ${toDef.category}`);
  }
  
  // Convert to base unit
  let baseValue = value * fromDef.factor;
  if (fromDef.offset !== undefined) {
    baseValue += fromDef.offset;
  }
  
  // Convert from base unit to target unit
  let result = baseValue / toDef.factor;
  if (toDef.offset !== undefined) {
    result -= toDef.offset;
  }
  
  return result;
}

/**
 * Convert a value to a specific unit system
 * 
 * @param value - Value to convert
 * @param fromUnit - Source unit symbol
 * @param system - Target unit system
 * @param category - Unit category
 * @returns Converted value and unit symbol
 */
export function convertToSystem(
  value: number,
  fromUnit: string,
  system: UnitSystem,
  category: string
): { value: number; unit: string } {
  const systemUnits: Record<UnitSystem, Record<string, string>> = {
    SI: {
      length: 'm',
      mass: 'kg',
      time: 's',
      energy: 'J',
      velocity: 'm/s',
      acceleration: 'm/s²',
      pressure: 'Pa',
      temperature: 'K'
    },
    Imperial: {
      length: 'ft',
      mass: 'lb',
      time: 's',
      energy: 'J',
      velocity: 'ft/s',
      acceleration: 'ft/s²',
      pressure: 'psi',
      temperature: '°F'
    },
    Astronomical: {
      length: 'AU',
      mass: 'M_E',
      time: 'y',
      energy: 'EJ',
      velocity: 'km/s',
      acceleration: 'm/s²',
      pressure: 'Pa',
      temperature: 'K'
    }
  };
  
  const targetUnit = systemUnits[system][category];
  if (!targetUnit) {
    throw new Error(`No unit available for category ${category} in system ${system}`);
  }
  
  const convertedValue = convertUnit(value, fromUnit, targetUnit);
  return { value: convertedValue, unit: targetUnit };
}

/**
 * Format a value with appropriate precision and unit
 * 
 * @param value - Value to format
 * @param unit - Unit symbol
 * @param precision - Number of decimal places (default: 2)
 * @returns Formatted string
 */
export function formatValue(value: number, unit: string, precision: number = 2): string {
  const unitDef = UNIT_DEFINITIONS[unit];
  if (!unitDef) {
    return `${value.toFixed(precision)} ${unit}`;
  }
  
  // Use scientific notation for very large or very small numbers
  if (Math.abs(value) >= 1e6 || (Math.abs(value) < 1e-3 && value !== 0)) {
    return `${value.toExponential(precision)} ${unitDef.symbol}`;
  }
  
  // Use appropriate number of decimal places
  const formattedValue = value.toFixed(precision);
  return `${formattedValue} ${unitDef.symbol}`;
}

/**
 * Format a value with SI prefixes
 * 
 * @param value - Value to format
 * @param baseUnit - Base unit symbol
 * @param precision - Number of decimal places (default: 2)
 * @returns Formatted string with SI prefix
 */
export function formatWithSIPrefix(value: number, baseUnit: string, precision: number = 2): string {
  const prefixes = [
    { symbol: 'Y', factor: 1e24, name: 'yotta' },
    { symbol: 'Z', factor: 1e21, name: 'zetta' },
    { symbol: 'E', factor: 1e18, name: 'exa' },
    { symbol: 'P', factor: 1e15, name: 'peta' },
    { symbol: 'T', factor: 1e12, name: 'tera' },
    { symbol: 'G', factor: 1e9, name: 'giga' },
    { symbol: 'M', factor: 1e6, name: 'mega' },
    { symbol: 'k', factor: 1e3, name: 'kilo' },
    { symbol: '', factor: 1, name: '' },
    { symbol: 'm', factor: 1e-3, name: 'milli' },
    { symbol: 'μ', factor: 1e-6, name: 'micro' },
    { symbol: 'n', factor: 1e-9, name: 'nano' },
    { symbol: 'p', factor: 1e-12, name: 'pico' },
    { symbol: 'f', factor: 1e-15, name: 'femto' },
    { symbol: 'a', factor: 1e-18, name: 'atto' },
    { symbol: 'z', factor: 1e-21, name: 'zepto' },
    { symbol: 'y', factor: 1e-24, name: 'yocto' }
  ];
  
  // Find the most appropriate prefix
  let bestPrefix = prefixes[8]; // Default to no prefix
  for (const prefix of prefixes) {
    if (Math.abs(value) >= prefix.factor) {
      bestPrefix = prefix;
    } else {
      break;
    }
  }
  
  const scaledValue = value / bestPrefix.factor;
  const formattedValue = scaledValue.toFixed(precision);
  
  return `${formattedValue} ${bestPrefix.symbol}${baseUnit}`;
}

/**
 * Validate a unit value
 * 
 * @param value - Value to validate
 * @param unit - Unit symbol
 * @param min - Minimum allowed value (optional)
 * @param max - Maximum allowed value (optional)
 * @returns Validation result
 */
export function validateUnitValue(
  value: number,
  unit: string,
  min?: number,
  max?: number
): { valid: boolean; error?: string } {
  if (!Number.isFinite(value)) {
    return { valid: false, error: 'Value must be a finite number' };
  }
  
  if (min !== undefined && value < min) {
    return { valid: false, error: `Value must be at least ${min}` };
  }
  
  if (max !== undefined && value > max) {
    return { valid: false, error: `Value must be at most ${max}` };
  }
  
  const unitDef = UNIT_DEFINITIONS[unit];
  if (!unitDef) {
    return { valid: false, error: `Unknown unit: ${unit}` };
  }
  
  return { valid: true };
}

/**
 * Get all units for a specific category
 * 
 * @param category - Unit category
 * @returns Array of unit symbols
 */
export function getUnitsForCategory(category: string): string[] {
  return Object.keys(UNIT_DEFINITIONS)
    .filter(unit => UNIT_DEFINITIONS[unit].category === category);
}

/**
 * Get unit definition
 * 
 * @param unit - Unit symbol
 * @returns Unit definition or undefined
 */
export function getUnitDefinition(unit: string): UnitDefinition | undefined {
  return UNIT_DEFINITIONS[unit];
}

/**
 * Check if two units are compatible
 * 
 * @param unit1 - First unit symbol
 * @param unit2 - Second unit symbol
 * @returns True if units are compatible
 */
export function areUnitsCompatible(unit1: string, unit2: string): boolean {
  const def1 = UNIT_DEFINITIONS[unit1];
  const def2 = UNIT_DEFINITIONS[unit2];
  
  if (!def1 || !def2) {
    return false;
  }
  
  return def1.category === def2.category;
}

/**
 * Convert energy to TNT equivalent
 * 
 * @param energy - Energy in joules
 * @param unit - Target TNT unit ('t_TNT', 'kt_TNT', 'Mt_TNT')
 * @returns TNT equivalent value
 */
export function energyToTNT(energy: number, unit: 't_TNT' | 'kt_TNT' | 'Mt_TNT' = 'Mt_TNT'): number {
  return convertUnit(energy, 'J', unit);
}

/**
 * Convert TNT equivalent to energy
 * 
 * @param tntValue - TNT value
 * @param unit - Source TNT unit ('t_TNT', 'kt_TNT', 'Mt_TNT')
 * @returns Energy in joules
 */
export function tntToEnergy(tntValue: number, unit: 't_TNT' | 'kt_TNT' | 'Mt_TNT' = 'Mt_TNT'): number {
  return convertUnit(tntValue, unit, 'J');
}

/**
 * Convert velocity to escape velocity
 * 
 * @param velocity - Velocity in m/s
 * @param mass - Mass in kg
 * @param radius - Radius in m
 * @returns Escape velocity ratio
 */
export function velocityToEscapeVelocity(velocity: number, mass: number, radius: number): number {
  const escapeVelocity = Math.sqrt(2 * PHYSICAL_CONSTANTS.GRAVITATIONAL_CONSTANT * mass / radius);
  return velocity / escapeVelocity;
}

/**
 * Convert distance to astronomical units
 * 
 * @param distance - Distance in meters
 * @returns Distance in AU
 */
export function distanceToAU(distance: number): number {
  return convertUnit(distance, 'm', 'AU');
}

/**
 * Convert time to years
 * 
 * @param time - Time in seconds
 * @returns Time in years
 */
export function timeToYears(time: number): number {
  return convertUnit(time, 's', 'y');
}
