# Physics Formulas and Models

This document describes the physics formulas and models used in the Defend Earth impact simulation system.

## Orbital Mechanics

### Two-Body Problem

The system uses simplified two-body orbital mechanics for asteroid trajectory calculations.

**Kepler's Equation:**
```
M = E - e * sin(E)
```

Where:
- `M` = Mean anomaly
- `E` = Eccentric anomaly
- `e` = Orbital eccentricity

**Position and Velocity:**
```
r = a(1 - e²) / (1 + e cos(ν))
v = √(μ(2/r - 1/a))
```

Where:
- `r` = Distance from focus
- `a` = Semi-major axis
- `e` = Eccentricity
- `ν` = True anomaly
- `μ` = Standard gravitational parameter

## Impact Physics

### Mass and Energy

**Asteroid Mass:**
```
m = (4/3)πR³ρ
```

Where:
- `m` = Mass (kg)
- `R` = Radius (m)
- `ρ` = Density (kg/m³, default: 3000 kg/m³)

**Kinetic Energy:**
```
E = (1/2)mv²
```

Where:
- `E` = Kinetic energy (J)
- `m` = Mass (kg)
- `v` = Impact velocity (m/s)

**TNT Equivalent:**
```
E_TNT = E / (4.184 × 10¹⁵)
```

Where:
- `E_TNT` = TNT equivalent (megatons)
- `4.184 × 10¹⁵` = Joules per megaton TNT

### Crater Formation

**Simple π-Scaling Law:**
```
D_f = 1.25D_i^0.78 * (ρ_i/ρ_t)^0.44 * (v_i^2/gD_i)^0.22 * sin(θ)^0.33
```

Where:
- `D_f` = Final crater diameter (m)
- `D_i` = Impactor diameter (m)
- `ρ_i` = Impactor density (kg/m³)
- `ρ_t` = Target density (kg/m³)
- `v_i` = Impact velocity (m/s)
- `g` = Surface gravity (m/s²)
- `θ` = Impact angle (degrees)

**Crater Depth:**
```
d = D_f / 3
```

### Seismic Effects

**Seismic Magnitude:**
```
M_w = 0.67 * log₁₀(E) - 5.87
```

Where:
- `M_w` = Moment magnitude
- `E` = Impact energy (J)

**Peak Ground Acceleration (PGA):**
```
PGA = 10^(0.5 * M_w - 2.0) * exp(-0.5 * (r/R)²)
```

Where:
- `PGA` = Peak ground acceleration (g)
- `r` = Distance from impact (m)
- `R` = Crater radius (m)

**Modified Mercalli Intensity (MMI):**
```
MMI = 2.0 + 1.5 * log₁₀(PGA)
```

### Thermal Effects

**Thermal Fluence:**
```
F = (ηE) / (4πr²)
```

Where:
- `F` = Thermal fluence (J/m²)
- `η` = Thermal efficiency (default: 0.1)
- `E` = Impact energy (J)
- `r` = Distance from impact (m)

### Blast Effects

**Overpressure Scaling:**
```
R = C * (E_TNT^n) / (P^m)
```

Where:
- `R` = Overpressure radius (km)
- `C` = Scaling constant (0.28)
- `E_TNT` = TNT equivalent (megatons)
- `P` = Overpressure (psi)
- `n` = Energy exponent (0.33)
- `m` = Pressure exponent (0.33)

## Tsunami Physics

### Initial Wave Height

**Deep Water:**
```
H₀ = 0.5 * (E/ρg) * (1/d) * (1/√(2π))
```

Where:
- `H₀` = Initial wave height (m)
- `E` = Impact energy (J)
- `ρ` = Water density (1000 kg/m³)
- `g` = Gravity (9.81 m/s²)
- `d` = Water depth (m)

### Wave Propagation

**Shallow Water Wave Speed:**
```
c = √(gh)
```

Where:
- `c` = Wave speed (m/s)
- `g` = Gravity (9.81 m/s²)
- `h` = Water depth (m)

**Energy Dissipation:**
```
H(r) = H₀ * exp(-αr) * (r₀/r)^β
```

Where:
- `H(r)` = Wave height at distance r (m)
- `α` = Dissipation coefficient (0.001 km⁻¹)
- `β` = Geometric spreading exponent (0.5)
- `r₀` = Reference distance (1 km)

## Deflection Physics

### Impulse Transfer

**Momentum Transfer:**
```
Δp = m_impactor * v_impactor * cos(θ)
```

Where:
- `Δp` = Momentum transfer (kg⋅m/s)
- `m_impactor` = Impactor mass (kg)
- `v_impactor` = Impactor velocity (m/s)
- `θ` = Impact angle (radians)

**Velocity Change:**
```
Δv = Δp / m_asteroid
```

Where:
- `Δv` = Velocity change (m/s)
- `m_asteroid` = Asteroid mass (kg)

### Orbital Perturbation

**Semi-major Axis Change:**
```
Δa = (2a²/μ) * Δv * cos(θ)
```

Where:
- `Δa` = Semi-major axis change (m)
- `a` = Original semi-major axis (m)
- `μ` = Standard gravitational parameter
- `θ` = Angle between velocity and deflection

**Eccentricity Change:**
```
Δe = (2/μ) * Δv * sin(θ) * √(a(1-e²))
```

## Population Impact

### Exposure Calculation

**Population Density:**
```
ρ_pop = N / A
```

Where:
- `ρ_pop` = Population density (people/km²)
- `N` = Population count
- `A` = Area (km²)

**Exposed Population:**
```
N_exposed = ∫∫ ρ_pop(x,y) * I(x,y) dx dy
```

Where:
- `I(x,y)` = Impact intensity function (0-1)

### Mortality Models

**Crater Zone Mortality:**
```
M_crater = N_crater * 1.0
```

**Blast Zone Mortality:**
```
M_blast = N_blast * (1 - exp(-PGA/0.5))
```

**Thermal Zone Mortality:**
```
M_thermal = N_thermal * (1 - exp(-F/10⁶))
```

## Economic Impact

### Building Damage

**Damage Function:**
```
D = 1 - exp(-(PGA/PGA₀)^n)
```

Where:
- `D` = Damage fraction (0-1)
- `PGA₀` = Reference PGA (0.1g)
- `n` = Damage exponent (2.0)

**Economic Loss:**
```
L = D * V * ρ_building
```

Where:
- `L` = Economic loss (USD)
- `V` = Building value (USD/m²)
- `ρ_building` = Building density (m²/km²)

## Units and Constants

### Physical Constants

- Gravitational constant: `G = 6.674 × 10⁻¹¹ m³/kg⋅s²`
- Earth mass: `M_E = 5.972 × 10²⁴ kg`
- Earth radius: `R_E = 6.371 × 10⁶ m`
- Standard gravitational parameter: `μ = GM_E = 3.986 × 10¹⁴ m³/s²`
- Surface gravity: `g = 9.81 m/s²`

### Material Properties

- Water density: `ρ_water = 1000 kg/m³`
- Rock density: `ρ_rock = 3000 kg/m³`
- Iron density: `ρ_iron = 7800 kg/m³`
- Carbonaceous density: `ρ_carbon = 2000 kg/m³`

### Conversion Factors

- 1 megaton TNT = `4.184 × 10¹⁵ J`
- 1 joule = `1 kg⋅m²/s²`
- 1 psi = `6895 Pa`
- 1 g = `9.81 m/s²`

## References

1. Melosh, H.J. (1989). Impact Cratering: A Geologic Process
2. Collins, G.S. et al. (2005). Earth Impact Effects Program
3. Ward, S.N. & Asphaug, E. (2000). Asteroid Impact Tsunami
4. National Research Council (2010). Defending Planet Earth
5. Harris, A.W. (2008). What Spaceguard Did
