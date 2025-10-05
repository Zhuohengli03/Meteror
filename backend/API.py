import requests
import datetime
import csv
import json
import time
import math

URL = "https://api.nasa.gov/neo/rest/v1/feed"

sparams = {
    "api_key": "CLePa8TOYYjIoOJZ1VyN42dQ6rvp9ZscdJJCBp5k",
    "start_date": "2025-09-01",
    "end_date": ""
}

def get_all_asteroids():
    """根据日期范围获取接近地球的小行星数据"""
    all_asteroids = []
    
    print("开始获取NASA小行星数据...")
    print(f"日期范围: {sparams['start_date']} 到 {sparams['end_date']}")
    
    try:
        print("正在获取数据...")
        response = requests.get(URL, params=sparams)
        
        if response.status_code != 200:
            print(f"API请求失败: {response.status_code}")
            print(f"响应内容: {response.text}")
            return []
            
        data = response.json()
        
        # 检查是否有数据
        if 'near_earth_objects' not in data:
            print("API响应中没有near_earth_objects字段")
            print(f"API响应: {data}")
            return []
        
        # 遍历所有日期的数据
        for date, asteroids in data['near_earth_objects'].items():
            print(f"日期 {date}: 找到 {len(asteroids)} 个小行星")
            all_asteroids.extend(asteroids)
        
        print(f"总计获取: {len(all_asteroids)} 个小行星")
        
        # 去重（基于ID）
        unique_asteroids = []
        seen_ids = set()
        
        for asteroid in all_asteroids:
            asteroid_id = asteroid.get('id')
            if asteroid_id and asteroid_id not in seen_ids:
                unique_asteroids.append(asteroid)
                seen_ids.add(asteroid_id)
        
        print(f"去重后: {len(unique_asteroids)} 个小行星")
        
        return unique_asteroids
        
    except Exception as e:
        print(f"获取数据时出错: {e}")
        return []

def save_to_csv(asteroids, filename="asteroids.csv"):
    """保存数据到CSV文件"""
    if not asteroids:
        print("没有数据可保存")
        return
    
    # 准备CSV数据
    csv_data = []
    
    for asteroid in asteroids:
        # 基本信息
        row = {
            'id': asteroid.get('id', ''),
            'name': asteroid.get('name', ''),
            'nasa_jpl_url': asteroid.get('nasa_jpl_url', ''),
            'absolute_magnitude_h': asteroid.get('absolute_magnitude_h', ''),
            'is_potentially_hazardous_asteroid': asteroid.get('is_potentially_hazardous_asteroid', False),
            'is_sentry_object': asteroid.get('is_sentry_object', False)
        }
        
        # 直径信息
        if 'estimated_diameter' in asteroid:
            diameter = asteroid['estimated_diameter']
            if 'meters' in diameter:
                meters = diameter['meters']
                row.update({
                    'diameter_min_meters': meters.get('estimated_diameter_min', ''),
                    'diameter_max_meters': meters.get('estimated_diameter_max', ''),
                    'diameter_avg_meters': (meters.get('estimated_diameter_min', 0) + meters.get('estimated_diameter_max', 0)) / 2 if meters.get('estimated_diameter_min') and meters.get('estimated_diameter_max') else ''
                })
        
        # 轨道数据
        if 'orbital_data' in asteroid:
            orbital = asteroid['orbital_data']
            row.update({
                'orbit_class': orbital.get('orbit_class', ''),
                'orbit_type': orbital.get('orbit_type', ''),
                'eccentricity': orbital.get('eccentricity', ''),
                'semi_major_axis': orbital.get('semi_major_axis', ''),
                'perihelion_distance': orbital.get('perihelion_distance', ''),
                'aphelion_distance': orbital.get('aphelion_distance', ''),
                'inclination': orbital.get('inclination', ''),
                'ascending_node_longitude': orbital.get('ascending_node_longitude', ''),
                'orbital_period': orbital.get('orbital_period', ''),
                'perihelion_argument': orbital.get('perihelion_argument', ''),
                'mean_anomaly': orbital.get('mean_anomaly', ''),
                'mean_motion': orbital.get('mean_motion', ''),
                'equinox': orbital.get('equinox', '')
            })
        
        # 接近数据（取最近的一次）
        if 'close_approach_data' in asteroid and asteroid['close_approach_data']:
            approach = asteroid['close_approach_data'][0]
            row.update({
                'close_approach_date': approach.get('close_approach_date', ''),
                'epoch_date_close_approach': approach.get('epoch_date_close_approach', ''),
                'relative_velocity_km_per_sec': approach.get('relative_velocity', {}).get('kilometers_per_second', ''),
                'relative_velocity_km_per_hour': approach.get('relative_velocity', {}).get('kilometers_per_hour', ''),
                'relative_velocity_miles_per_hour': approach.get('relative_velocity', {}).get('miles_per_hour', ''),
                'miss_distance_astronomical': approach.get('miss_distance', {}).get('astronomical', ''),
                'miss_distance_lunar': approach.get('miss_distance', {}).get('lunar', ''),
                'miss_distance_kilometers': approach.get('miss_distance', {}).get('kilometers', ''),
                'miss_distance_miles': approach.get('miss_distance', {}).get('miles', ''),
                'orbiting_body': approach.get('orbiting_body', '')
            })
        
        csv_data.append(row)
    
    # 保存为CSV
    if csv_data:
        # 获取所有字段名
        fieldnames = csv_data[0].keys()
        
        with open(filename, 'w', newline='', encoding='utf-8-sig') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(csv_data)
        
        print(f"CSV数据已保存到 {filename}")
        print(f"共保存 {len(csv_data)} 条记录")
        print(f"CSV文件包含 {len(fieldnames)} 个字段")
    else:
        print("没有数据可保存到CSV")

def mass_from_diameter(diameter_m, density=3000):
    """Compute asteroid mass in kg from diameter in meters"""
    radius = diameter_m / 2
    volume = (4/3) * math.pi * radius**3
    return volume * density

def impact_energy_joules(mass, velocity_m_s):
    """Compute kinetic energy in joules"""
    return 0.5 * mass * velocity_m_s**2

def energy_megatons(energy_j):
    """Convert joules to megatons of TNT"""
    # 1 megaton TNT = 4.184e15 joules
    return energy_j / 4.184e15

def final_crater_diameter(diameter_m, velocity_m_s, density_i=3000, density_t=2500, theta_deg=45):
    """Estimate final crater diameter (m) using scaling law"""
    # Pi scaling law for crater diameter
    # D = 1.161 * (density_i/density_t)^(1/3) * diameter_m^0.78 * velocity_m_s^0.44 * sin(theta)^(2/3)
    theta_rad = math.radians(theta_deg)
    density_ratio = (density_i / density_t) ** (1/3)
    diameter_factor = diameter_m ** 0.78
    velocity_factor = velocity_m_s ** 0.44
    angle_factor = math.sin(theta_rad) ** (2/3)
    
    return 1.161 * density_ratio * diameter_factor * velocity_factor * angle_factor

def thermal_fluence(energy_j, distance_m, efficiency=0.1):
    """Estimate heat fluence (J/m²) at a given distance"""
    # Thermal fluence decreases as 1/r²
    return (efficiency * energy_j) / (4 * math.pi * distance_m**2)

def overpressure_range(energy_mt, pressure_psi):
    """Estimate the radius (km) that produces a given overpressure (psi) using empirical nuclear-blast scaling"""
    # Scaling law: R = C * (W^n) / (P^m)
    # For nuclear blast scaling: R = 0.28 * W^0.33 / P^0.33
    # where W is yield in megatons, P is pressure in psi
    C = 0.28
    n = 0.33
    m = 0.33
    
    return C * (energy_mt**n) / (pressure_psi**m)

def simulate_impact_effect(asteroid):
    """Extract diameter and velocity from NASA NEO JSON object and calculate impact effects"""
    print(f"\n=== 小行星撞击效应模拟 ===")
    print(f"小行星名称: {asteroid.get('name', 'Unknown')}")
    print(f"小行星ID: {asteroid.get('id', 'Unknown')}")
    
    # Extract diameter
    diameter_m = None
    if 'estimated_diameter' in asteroid and 'meters' in asteroid['estimated_diameter']:
        meters = asteroid['estimated_diameter']['meters']
        diameter_min = meters.get('estimated_diameter_min')
        diameter_max = meters.get('estimated_diameter_max')
        if diameter_min and diameter_max:
            diameter_m = (diameter_min + diameter_max) / 2
            print(f"小行星直径: {diameter_min:.1f} - {diameter_max:.1f} 米 (平均: {diameter_m:.1f} 米)")
    
    if not diameter_m:
        print("无法获取小行星直径信息")
        return
    
    # Extract velocity from close approach data
    velocity_km_s = None
    if 'close_approach_data' in asteroid and asteroid['close_approach_data']:
        close_approach = asteroid['close_approach_data'][0]  # Take first close approach
        if 'relative_velocity' in close_approach and 'kilometers_per_second' in close_approach['relative_velocity']:
            velocity_km_s = float(close_approach['relative_velocity']['kilometers_per_second'])
            print(f"相对速度: {velocity_km_s:.2f} 公里/秒")
    
    if not velocity_km_s:
        print("无法获取小行星速度信息")
        return
    
    # Convert velocity to m/s
    velocity_m_s = velocity_km_s * 1000
    
    # Calculate mass
    mass_kg = mass_from_diameter(diameter_m)
    print(f"小行星质量: {mass_kg:.2e} 公斤")
    
    # Calculate impact energy
    energy_j = impact_energy_joules(mass_kg, velocity_m_s)
    energy_mt = energy_megatons(energy_j)
    print(f"撞击能量: {energy_j:.2e} 焦耳 ({energy_mt:.2f} 百万吨TNT当量)")
    
    # Calculate crater diameter
    crater_diameter = final_crater_diameter(diameter_m, velocity_m_s)
    print(f"预估陨石坑直径: {crater_diameter:.1f} 米")
    
    # Calculate thermal fluence at 50 km
    thermal_50km = thermal_fluence(energy_j, 50000)
    print(f"50公里处热辐射通量: {thermal_50km:.2e} 焦耳/平方米")
    
    # Calculate radius for 1 psi overpressure
    overpressure_1psi_radius = overpressure_range(energy_mt, 1.0)
    print(f"1 psi超压影响半径: {overpressure_1psi_radius:.1f} 公里")
    
    print("=" * 50)

if __name__ == "__main__":
    # 获取所有数据
    asteroids = get_all_asteroids()
    
    if asteroids:
        # 保存到CSV文件
        save_to_csv(asteroids, "asteroids.csv")
        
        print(f"\n成功获取 {len(asteroids)} 个小行星的完整数据！")
        print("CSV文件已保存为: asteroids.csv")
        
        # 模拟第一个小行星的撞击效应
        simulate_impact_effect(asteroids[0])
    else:
        print("未能获取到任何数据")