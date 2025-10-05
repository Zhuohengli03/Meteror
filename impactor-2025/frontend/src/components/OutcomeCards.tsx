/**
 * Outcome cards displaying simulation results
 */

// import React from 'react';
import { useSimulationStore } from '../lib/store/simulation';

interface OutcomeCardsProps {
  className?: string;
}

export default function OutcomeCards({ className }: OutcomeCardsProps) {
  const { baselineResults, deflectionResults } = useSimulationStore();

  console.log('OutcomeCards - baselineResults:', baselineResults);
  console.log('OutcomeCards - deflectionResults:', deflectionResults);
  
  // Debug: Log specific fields that might be undefined
  if (baselineResults) {
    console.log('OutcomeCards - seismic_magnitude:', baselineResults.seismic_magnitude);
    console.log('OutcomeCards - tsunami_height_m:', baselineResults.tsunami_height_m);
    console.log('OutcomeCards - gdp_impact_percentage:', baselineResults.gdp_impact_percentage);
    console.log('OutcomeCards - affected_cities:', baselineResults.affected_cities);
  }

  if (!baselineResults) {
    return (
      <div className={`outcome-cards ${className || ''}`}>
        <div className="no-results">
          <p>运行模拟以查看结果</p>
          <details style={{ marginTop: '1rem', fontSize: '0.8rem', opacity: 0.7 }}>
            <summary>调试信息</summary>
            <pre>{JSON.stringify({ baselineResults, deflectionResults }, null, 2)}</pre>
          </details>
        </div>
      </div>
    );
  }

  const formatNumber = (num: number | undefined, decimals: number = 1) => {
    if (num === undefined || num === null || isNaN(num)) return 'N/A';
    if (num >= 1e12) return `${(num / 1e12).toFixed(decimals)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(decimals)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(decimals)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(decimals)}K`;
    return num.toFixed(decimals);
  };

  const formatDistance = (meters: number | undefined) => {
    if (meters === undefined || meters === null || isNaN(meters)) return 'N/A';
    if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
    return `${meters.toFixed(0)} m`;
  };

  const formatLabel = (key: string) => {
    // snake_case -> Title Case
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const formatEnergy = (joules: number | undefined) => {
    if (joules === undefined || joules === null || isNaN(joules)) return 'N/A';
    // 1e21 -> ZJ, 1e18 -> EJ, 1e15 -> PJ
    if (joules >= 1e21) return `${(joules / 1e21).toFixed(1)} ZJ`;
    if (joules >= 1e18) return `${(joules / 1e18).toFixed(1)} EJ`;
    if (joules >= 1e15) return `${(joules / 1e15).toFixed(1)} PJ`;
    return `${(joules / 1e12).toFixed(1)} TJ`;
  };

  return (
    <div className={`outcome-cards ${className || ''}`}>
      <div className="cards-grid">
        {/* Impact Energy */}
        <div className="outcome-card energy">
          <div className="card-icon">💥</div>
          <div className="card-content">
            <h3>Impact Energy</h3>
            <div className="card-value">
              {formatEnergy(baselineResults.impact_energy_joules)}
            </div>
            <div className="card-subtitle">
              {formatNumber(baselineResults.tnt_equivalent_megatons)} MT TNT
            </div>
          </div>
        </div>

        {/* Crater Size */}
        <div className="outcome-card crater">
          <div className="card-icon">🕳️</div>
          <div className="card-content">
            <h3>Crater Diameter</h3>
            <div className="card-value">
              {formatDistance(baselineResults.crater_diameter_m)}
            </div>
            <div className="card-subtitle">
              Depth: {formatDistance(baselineResults.crater_depth_m)}
            </div>
          </div>
        </div>

        {/* Seismic Effects */}
        <div className="outcome-card seismic">
          <div className="card-icon">🌍</div>
          <div className="card-content">
            <h3>Seismic Magnitude</h3>
            <div className="card-value">
              {baselineResults.seismic_magnitude?.toFixed(1) || 'N/A'}
            </div>
            <div className="card-subtitle">
              PGA: {baselineResults.peak_ground_acceleration?.toFixed(2) || 'N/A'} m/s²
            </div>
          </div>
        </div>

        {/* Tsunami Effects */}
        {typeof baselineResults.tsunami_height_m === 'number' && baselineResults.tsunami_height_m > 0 && (
          <div className="outcome-card tsunami">
            <div className="card-icon">🌊</div>
            <div className="card-content">
              <h3>Tsunami Height</h3>
              <div className="card-value">
                {baselineResults.tsunami_height_m?.toFixed(1) || 'N/A'} m
              </div>
              <div className="card-subtitle">
                Maximum wave height
              </div>
            </div>
          </div>
        )}

        {/* Population Exposure */}
        <div className="outcome-card population">
          <div className="card-icon">👥</div>
          <div className="card-content">
            <h3>Exposed Population</h3>
            <div className="card-value">
              {baselineResults.exposed_population && baselineResults.exposed_population > 0
                ? formatNumber(baselineResults.exposed_population, 0)
                : '—'}
            </div>
            <div className="card-subtitle">
              {baselineResults.exposed_population && baselineResults.exposed_population > 0
                ? `${baselineResults.affected_cities?.length || 0} cities affected`
                : 'No populated areas affected'}
            </div>
          </div>
        </div>

        {/* Economic Impact */}
        <div className="outcome-card economic">
          <div className="card-icon">💰</div>
          <div className="card-content">
            <h3>Economic Loss</h3>
            <div className="card-value">
              {(baselineResults.total_economic_loss_usd || baselineResults.estimated_damage_usd) > 0
                ? `$${formatNumber(baselineResults.total_economic_loss_usd || baselineResults.estimated_damage_usd, 0)}`
                : '—'}
            </div>
            <div className="card-subtitle">
              {(baselineResults.total_economic_loss_usd || baselineResults.estimated_damage_usd) > 0
                ? (baselineResults.gdp_impact_percentage
                    ? `${baselineResults.gdp_impact_percentage?.toFixed(2) || 'N/A'}% of world GDP`
                    : 'USD')
                : 'No significant damage expected'}
            </div>
          </div>
        </div>

        {/* Population Impact */}
        <div className="outcome-card population">
          <div className="card-icon">👥</div>
          <div className="card-content">
            <h3>Population Affected</h3>
            <div className="card-value">
              {formatNumber(baselineResults.total_population_affected || baselineResults.exposed_population, 0)}
            </div>
            <div className="card-subtitle">
              people
            </div>
          </div>
        </div>
      </div>

      {/* Deflection Results */}
      {deflectionResults && (
        <div className="deflection-results">
          <h3>Deflection Effectiveness</h3>
          <div className="deflection-grid">
            <div className="deflection-card">
              <h4>Miss Distance</h4>
              <div className="deflection-value">
                {deflectionResults.miss_distance_km > 0 ? (
                  <span className="success">
                    {deflectionResults.miss_distance_km?.toFixed(1) || 'N/A'} km
                  </span>
                ) : (
                  <span className="warning">
                    Still impacts
                  </span>
                )}
              </div>
            </div>

            <div className="deflection-card">
              <h4>Deflection Angle</h4>
              <div className="deflection-value">
                {deflectionResults.deflection_angle_deg?.toFixed(2) || 'N/A'}°
              </div>
            </div>

            <div className="deflection-card">
              <h4>Impact Probability</h4>
              <div className="deflection-value">
                <span className={deflectionResults.impact_probability < 0.1 ? 'success' : 'warning'}>
                  {((deflectionResults.impact_probability || 0) * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="deflection-card">
              <h4>Energy Reduction</h4>
              <div className="deflection-value">
                <span className="success">
                  {(deflectionResults.energy_reduction_percent || 0).toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="deflection-card">
              <h4>Population Saved</h4>
              <div className="deflection-value">
                <span className="success">
                  {formatNumber(deflectionResults.population_exposure_reduction, 0)}
                </span>
              </div>
            </div>

            <div className="deflection-card">
              <h4>Strategy Efficiency</h4>
              <div className="deflection-value">
                {((deflectionResults.strategy_efficiency || 0) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Affected Cities Details */}
      {baselineResults.affected_cities && baselineResults.affected_cities.length > 0 && (
        <div className="affected-cities">
          <h3>Affected Cities</h3>
          <div className="cities-list">
            {baselineResults.affected_cities.map((city: any, index: number) => (
              <div key={index} className="city-item">
                <div className="city-name">{city.name}</div>
                <div className="city-details">
                  <span className="city-distance">
                    {(city.distance_from_impact || city.distance || 0).toFixed(1)} km away
                  </span>
                  <span className={`city-exposure ${city.exposure_level || city.exposureLevel}`}>
                    {city.exposure_level || city.exposureLevel} exposure
                  </span>
                  <span className="city-population">
                    {formatNumber(city.population, 0)} people
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Uncertainty Bounds */}
      <div className="uncertainty-bounds">
        <h3>Uncertainty Bounds</h3>
        <div className="uncertainty-grid">
          {Object.entries(baselineResults.uncertainty_bounds).map(([key, bounds]) => (
            <div key={key} className="uncertainty-item">
              <h4>{formatLabel(key)}</h4>
              <div className="uncertainty-range">
                {formatNumber(bounds[0])} - {formatNumber(bounds[1])}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
