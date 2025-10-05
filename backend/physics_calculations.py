"""
小行星撞击物理计算模块
包含所有撞击效应相关的科学计算方法
"""

import math
import numpy as np
from typing import Dict, List, Optional, Tuple


class ImpactPhysics:
    """小行星撞击物理计算类"""
    
    @staticmethod
    def mass_from_diameter(diameter_m: float, density: float = 3000) -> float:
        """从小行星直径计算质量 (kg)"""
        radius = diameter_m / 2
        volume = (4/3) * math.pi * radius**3
        return volume * density
    
    @staticmethod
    def impact_energy_joules(mass: float, velocity_m_s: float) -> float:
        """计算撞击动能 (焦耳)"""
        return 0.5 * mass * velocity_m_s**2
    
    @staticmethod
    def energy_megatons(energy_j: float) -> float:
        """将焦耳转换为百万吨TNT当量"""
        # 1 megaton TNT = 4.184e15 joules
        return energy_j / 4.184e15
    
    @staticmethod
    def final_crater_diameter(diameter_m: float, velocity_m_s: float, 
                            density_i: float = 3000, density_t: float = 2500, 
                            theta_deg: float = 45) -> float:
        """使用Pi缩放定律估算最终陨石坑直径 (米)"""
        # Pi scaling law: D = 1.161 * (density_i/density_t)^(1/3) * diameter^0.78 * velocity^0.44 * sin(theta)^(2/3)
        theta_rad = math.radians(theta_deg)
        density_ratio = (density_i / density_t) ** (1/3)
        diameter_factor = diameter_m ** 0.78
        velocity_factor = velocity_m_s ** 0.44
        angle_factor = math.sin(theta_rad) ** (2/3)
        
        return 1.161 * density_ratio * diameter_factor * velocity_factor * angle_factor
    
    @staticmethod
    def thermal_fluence(energy_j: float, distance_m: float, efficiency: float = 0.1) -> float:
        """估算指定距离的热辐射通量 (J/m²)"""
        # 热辐射通量随距离按 1/r² 衰减
        return (efficiency * energy_j) / (4 * math.pi * distance_m**2)
    
    @staticmethod
    def overpressure_range(energy_mt: float, pressure_psi: float) -> float:
        """使用核爆炸缩放定律估算产生指定超压的半径 (km)"""
        # 缩放定律: R = C * (W^n) / (P^m)
        # 核爆炸缩放: R = 0.28 * W^0.33 / P^0.33
        C = 0.28
        n = 0.33
        m = 0.33
        
        return C * (energy_mt**n) / (pressure_psi**m)
    
    @staticmethod
    def seismic_magnitude(energy: float) -> float:
        """从撞击能量计算地震震级"""
        # 转换为TNT当量并使用Gutenberg-Richter关系
        tnt_equivalent = energy / (4.184e9)  # 焦耳转吨TNT
        return 0.67 * math.log10(tnt_equivalent) + 4.0
    
    @staticmethod
    def tsunami_height(energy: float, water_depth: float = 1000, 
                      distance_to_ocean: float = 0) -> float:
        """计算海啸高度 (米)"""
        tnt_equivalent = energy / (4.184e9)  # 转换为TNT当量
        
        # 基础海啸高度计算
        base_height = 0.1 * (tnt_equivalent**(1/3)) * (1000/water_depth)**(1/4)
        
        # 陆地撞击的距离衰减因子
        if distance_to_ocean > 0:
            attenuation_factor = 1.0 / (1.0 + distance_to_ocean / 100.0)
            base_height *= attenuation_factor
            
            # 添加地震引起的海啸分量
            seismic_component = 0.05 * (tnt_equivalent**(1/3)) * attenuation_factor
            base_height += seismic_component
        
        return max(base_height, 0)
    
    @staticmethod
    def calculate_blast_effects(energy: float) -> Dict[str, float]:
        """计算爆炸效应"""
        energy_mt = ImpactPhysics.energy_megatons(energy)
        
        # 计算不同压力等级的超压半径
        overpressure_1psi = ImpactPhysics.overpressure_range(energy_mt, 1.0)
        overpressure_5psi = ImpactPhysics.overpressure_range(energy_mt, 5.0)
        overpressure_20psi = ImpactPhysics.overpressure_range(energy_mt, 20.0)
        
        # 计算不同距离的热辐射通量
        thermal_10km = ImpactPhysics.thermal_fluence(energy, 10000)
        thermal_50km = ImpactPhysics.thermal_fluence(energy, 50000)
        thermal_100km = ImpactPhysics.thermal_fluence(energy, 100000)
        
        return {
            'energy_megatons': energy_mt,
            'overpressure_1psi_radius': overpressure_1psi,
            'overpressure_5psi_radius': overpressure_5psi,
            'overpressure_20psi_radius': overpressure_20psi,
            'thermal_10km': thermal_10km,
            'thermal_50km': thermal_50km,
            'thermal_100km': thermal_100km
        }


class PopulationImpact:
    """人口影响计算类"""
    
    @staticmethod
    def get_location_mortality_factor(latitude: float, longitude: float) -> float:
        """基于地理位置获取死亡率调整因子"""
        if latitude is None or longitude is None:
            return 1.0
        
        # 主要城市区域（高密度）
        major_cities = [
            (39.9042, 116.4074, 0.8),  # 北京
            (31.2304, 121.4737, 0.8),  # 上海
            (35.6762, 139.6503, 0.8),  # 东京
            (40.7128, -74.0060, 0.8),  # 纽约
            (51.5074, -0.1278, 0.8),   # 伦敦
            (48.8566, 2.3522, 0.8),    # 巴黎
        ]
        
        # 检查是否在主要城市附近（100km内）
        for city_lat, city_lng, factor in major_cities:
            distance = math.sqrt((latitude - city_lat)**2 + (longitude - city_lng)**2) * 111
            if distance < 100:
                return factor
        
        # 沿海地区（海啸风险）
        if PopulationImpact._is_coastal_region(latitude, longitude):
            return 1.2
        
        # 农村/偏远地区
        return 0.7
    
    @staticmethod
    def _is_coastal_region(latitude: float, longitude: float) -> bool:
        """检查是否为沿海地区"""
        coastal_regions = [
            (30, 50, -180, -60),    # 北美东海岸
            (25, 50, -130, -60),    # 北美西海岸
            (30, 60, -10, 40),      # 欧洲海岸
            (20, 50, 100, 180),     # 亚洲东海岸
            (-40, 20, -80, -30),    # 南美海岸
            (-40, -10, 110, 160),   # 澳大利亚海岸
        ]
        
        for min_lat, max_lat, min_lng, max_lng in coastal_regions:
            if min_lat <= latitude <= max_lat and min_lng <= longitude <= max_lng:
                return True
        return False
    
    @staticmethod
    def calculate_population_loss(impact_energy: float, affected_population: int, 
                                crater_diameter: float, latitude: float = None, 
                                longitude: float = None) -> int:
        """计算人口损失"""
        # 如果没有受影响人口，直接返回0
        if affected_population <= 0:
            return 0
            
        tnt_equivalent = impact_energy / (4.184e9)
        
        # 计算影响区域
        crater_area = math.pi * (crater_diameter / 2) ** 2
        blast_radius = crater_diameter * 5
        seismic_radius = crater_diameter * 20
        
        # 基于地理位置的死亡率调整
        location_factor = PopulationImpact.get_location_mortality_factor(latitude, longitude)
        
        # 分层死亡率模型
        crater_population = min(affected_population * 0.1, crater_area * 100)
        blast_population = min(affected_population * 0.3, math.pi * blast_radius ** 2 * 50)
        seismic_population = affected_population - crater_population - blast_population
        
        # 基于TNT当量的基础死亡率
        if tnt_equivalent < 1e6:
            blast_mortality = 0.8
            seismic_mortality = 0.1
        elif tnt_equivalent < 1e7:
            blast_mortality = 0.9
            seismic_mortality = 0.2
        elif tnt_equivalent < 1e8:
            blast_mortality = 0.95
            seismic_mortality = 0.3
        elif tnt_equivalent < 1e9:
            blast_mortality = 0.98
            seismic_mortality = 0.4
        else:
            blast_mortality = 0.99
            seismic_mortality = 0.5
        
        # 应用地理位置调整因子
        blast_mortality *= location_factor
        seismic_mortality *= location_factor
        
        # 计算总人口损失
        crater_loss = int(crater_population)
        blast_loss = int(blast_population * blast_mortality)
        seismic_loss = int(seismic_population * seismic_mortality)
        
        total_loss = crater_loss + blast_loss + seismic_loss
        return int(min(total_loss, affected_population))


class EconomicImpact:
    """经济影响计算类"""
    
    @staticmethod
    def get_economic_factor(latitude: float, longitude: float) -> float:
        """获取经济发展水平调整因子"""
        if latitude is None or longitude is None:
            return 1.0
        
        # 发达国家区域
        developed_regions = [
            (35, 70, -180, -50),    # 北美
            (35, 70, -10, 40),      # 欧洲
            (30, 50, 120, 150),     # 日本
            (-40, -10, 110, 160),   # 澳大利亚
        ]
        
        # 发展中国家区域
        developing_regions = [
            (10, 50, 70, 140),      # 中国
            (5, 35, 70, 100),       # 印度
            (10, 30, -80, -30),     # 南美
            (10, 30, -20, 60),      # 非洲
        ]
        
        # 检查是否在发达国家
        for min_lat, max_lat, min_lng, max_lng in developed_regions:
            if min_lat <= latitude <= max_lat and min_lng <= longitude <= max_lng:
                return 1.8
        
        # 检查是否在发展中国家
        for min_lat, max_lat, min_lng, max_lng in developing_regions:
            if min_lat <= latitude <= max_lat and min_lng <= longitude <= max_lng:
                return 1.0
        
        # 其他地区（欠发达国家）
        return 0.5
    
    @staticmethod
    def calculate_building_loss(impact_energy: float, crater_diameter: float, 
                              affected_population: int, latitude: float = None, 
                              longitude: float = None) -> float:
        """计算建筑损失 (亿美元)"""
        # 如果没有受影响人口，直接返回0
        if affected_population <= 0:
            return 0.0
            
        # 计算影响区域
        crater_area = math.pi * (crater_diameter / 2) ** 2
        blast_radius = crater_diameter * 5
        seismic_radius = crater_diameter * 20
        
        # 获取经济调整因子
        economic_factor = EconomicImpact.get_economic_factor(latitude, longitude)
        
        # 陨石坑区域：完全摧毁
        crater_value_density = 0.5 * economic_factor
        crater_loss = crater_area * crater_value_density
        
        # 冲击波区域：严重损坏（80%损失）
        blast_area = math.pi * blast_radius ** 2 - crater_area
        blast_value_density = 0.1 * economic_factor
        blast_loss = blast_area * blast_value_density * 0.8
        
        # 地震区域：中等损坏（30%损失）
        seismic_area = math.pi * seismic_radius ** 2 - math.pi * blast_radius ** 2
        seismic_value_density = 0.01 * economic_factor
        seismic_loss = seismic_area * seismic_value_density * 0.3
        
        # 基础设施损失
        infrastructure_factor = 0.1 + (economic_factor - 0.5) * 0.4
        infrastructure_loss = (crater_loss + blast_loss + seismic_loss) * infrastructure_factor
        
        # 特殊建筑损失
        special_buildings_factor = 0.1
        if latitude and longitude:
            major_cities = [
                (39.9042, 116.4074), (31.2304, 121.4737), (35.6762, 139.6503),
                (40.7128, -74.0060), (51.5074, -0.1278)
            ]
            for city_lat, city_lng in major_cities:
                distance = math.sqrt((latitude - city_lat)**2 + (longitude - city_lng)**2) * 111
                if distance < 50:
                    special_buildings_factor = 0.2
                    break
        
        special_buildings_loss = (crater_loss + blast_loss) * special_buildings_factor
        
        # 总建筑损失
        total_building_loss = (crater_loss + blast_loss + seismic_loss + 
                             infrastructure_loss + special_buildings_loss)
        
        return total_building_loss / 100  # 转换为亿美元
    
    @staticmethod
    def calculate_economic_loss(population_loss: int, building_loss: float, 
                              impact_energy: float, crater_diameter: float,
                              latitude: float = None, longitude: float = None) -> float:
        """计算总经济损失 (亿美元)"""
        # 如果没有人口损失和建筑损失，直接返回0
        if population_loss <= 0 and building_loss <= 0:
            return 0.0
            
        energy_mt = ImpactPhysics.energy_megatons(impact_energy)
        economic_factor = EconomicImpact.get_economic_factor(latitude, longitude)
        
        # 直接经济损失
        direct_loss = building_loss
        
        # 间接经济损失
        base_economic_value_per_person = 0.5
        economic_value_per_person = base_economic_value_per_person * economic_factor
        indirect_loss = population_loss * economic_value_per_person / 100
        
        # 基础设施损失
        infrastructure_loss = direct_loss * 0.2
        
        # 长期经济影响
        gdp_loss_factor = min(energy_mt, 10.0)
        gdp_loss = (direct_loss + indirect_loss) * gdp_loss_factor * 0.1 * economic_factor
        
        # 国际贸易影响
        trade_impact = 0
        if PopulationImpact._is_coastal_region(latitude, longitude):
            trade_impact = (direct_loss + indirect_loss) * 0.15
        
        # 农业损失
        agricultural_loss = EconomicImpact._calculate_agricultural_loss(
            impact_energy, crater_diameter, latitude, longitude
        )
        
        # 旅游业损失
        tourism_loss = EconomicImpact._calculate_tourism_loss(
            impact_energy, latitude, longitude
        )
        
        return (direct_loss + indirect_loss + infrastructure_loss + 
                gdp_loss + trade_impact + agricultural_loss + tourism_loss)
    
    @staticmethod
    def _calculate_agricultural_loss(impact_energy: float, crater_diameter: float, 
                                   latitude: float, longitude: float) -> float:
        """计算农业损失"""
        if latitude is None or longitude is None:
            return 0
        
        agricultural_regions = [
            (20, 50, 70, 140),      # 中国农业区
            (20, 50, -130, -60),    # 北美农业区
            (40, 60, -10, 40),      # 欧洲农业区
            (10, 30, -80, -30),     # 南美农业区
        ]
        
        is_agricultural = any(
            min_lat <= latitude <= max_lat and min_lng <= longitude <= max_lng
            for min_lat, max_lat, min_lng, max_lng in agricultural_regions
        )
        
        if not is_agricultural:
            return 0
        
        energy_mt = ImpactPhysics.energy_megatons(impact_energy)
        impact_radius = crater_diameter * 10
        agricultural_area = math.pi * impact_radius ** 2
        
        economic_factor = EconomicImpact.get_economic_factor(latitude, longitude)
        agricultural_value_density = 0.01 * economic_factor
        
        if energy_mt < 1:
            loss_rate = 0.3
        elif energy_mt < 10:
            loss_rate = 0.5
        elif energy_mt < 100:
            loss_rate = 0.7
        else:
            loss_rate = 0.9
        
        return (agricultural_area * agricultural_value_density * loss_rate) / 100
    
    @staticmethod
    def _calculate_tourism_loss(impact_energy: float, latitude: float, longitude: float) -> float:
        """计算旅游业损失"""
        if latitude is None or longitude is None:
            return 0
        
        tourism_regions = [
            (35, 45, -10, 40),      # 欧洲旅游区
            (25, 35, -120, -80),    # 北美西海岸
            (25, 35, -80, -60),     # 北美东海岸
            (20, 30, 100, 140),     # 亚洲旅游区
            (-40, -10, 110, 160),   # 澳大利亚
        ]
        
        is_tourism_region = any(
            min_lat <= latitude <= max_lat and min_lng <= longitude <= max_lng
            for min_lat, max_lat, min_lng, max_lng in tourism_regions
        )
        
        if not is_tourism_region:
            return 0
        
        energy_mt = ImpactPhysics.energy_megatons(impact_energy)
        economic_factor = EconomicImpact.get_economic_factor(latitude, longitude)
        base_tourism_value = 10.0
        
        if energy_mt < 1:
            loss_rate = 0.2
        elif energy_mt < 10:
            loss_rate = 0.4
        elif energy_mt < 100:
            loss_rate = 0.6
        else:
            loss_rate = 0.8
        
        return base_tourism_value * economic_factor * loss_rate


class TsunamiImpact:
    """海啸影响计算类"""
    
    @staticmethod
    def get_ocean_depth(latitude: float, longitude: float) -> float:
        """获取指定坐标的海洋深度 (米)"""
        # 太平洋 (深)
        if (20 <= latitude <= 60 and -180 <= longitude <= -120) or \
           (-60 <= latitude <= 20 and -180 <= longitude <= -80):
            return 4000
        
        # 大西洋 (中等深度)
        elif (20 <= latitude <= 60 and -80 <= longitude <= -20) or \
             (-60 <= latitude <= 20 and -80 <= longitude <= 20):
            return 3500
        
        # 印度洋 (中等深度)
        elif (20 <= latitude <= 60 and 20 <= longitude <= 100) or \
             (-60 <= latitude <= 20 and 20 <= longitude <= 120):
            return 3800
        
        # 地中海 (浅海)
        elif 30 <= latitude <= 45 and -10 <= longitude <= 40:
            return 1500
        
        # 加勒比海 (浅海)
        elif 10 <= latitude <= 30 and -90 <= longitude <= -60:
            return 2000
        
        # 大陆架区域 (浅海)
        elif (40 <= latitude <= 70 and -180 <= longitude <= -50) or \
             (40 <= latitude <= 70 and -10 <= longitude <= 40):
            return 200
        
        # 默认深度
        else:
            return 1000
    
    @staticmethod
    def calculate_tsunami_impact_range(energy: float, latitude: float, longitude: float) -> Dict:
        """计算海啸影响范围"""
        energy_mt = ImpactPhysics.energy_megatons(energy)
        water_depth = TsunamiImpact.get_ocean_depth(latitude, longitude)
        tsunami_height = ImpactPhysics.tsunami_height(energy, water_depth, 0)
        
        # 计算海啸传播半径
        if water_depth > 0:
            tsunami_speed = math.sqrt(9.81 * water_depth)  # m/s
            max_effective_radius = min(tsunami_speed * 3600, 2000)  # 最大2000km或1小时传播
            
            min_effective_height = 1.0
            impact_radius = min_effective_height * max_effective_radius / tsunami_height
            impact_radius = min(impact_radius, max_effective_radius)
        else:
            impact_radius = 0
        
        # 计算传播时间
        if water_depth > 0:
            nearest_coast_distance = TsunamiImpact._get_distance_to_nearest_coast(latitude, longitude)
            propagation_time = nearest_coast_distance / (tsunami_speed / 1000)
        else:
            propagation_time = 0
        
        # 确定严重程度
        if tsunami_height < 2:
            severity = "Low"
        elif tsunami_height < 5:
            severity = "Medium"
        elif tsunami_height < 10:
            severity = "High"
        else:
            severity = "Extreme"
        
        # 获取受影响的沿海地区
        affected_areas = TsunamiImpact._get_affected_coastal_areas(latitude, longitude, impact_radius)
        
        return {
            'tsunami_height': tsunami_height,
            'impact_radius': impact_radius,
            'coastal_areas_affected': affected_areas,
            'propagation_time': propagation_time,
            'severity_level': severity
        }
    
    @staticmethod
    def _get_distance_to_nearest_coast(latitude: float, longitude: float) -> float:
        """获取到最近海岸的距离 (km)"""
        pacific_distance = min(abs(longitude + 120), abs(longitude + 80)) * 111
        atlantic_distance = min(abs(longitude + 80), abs(longitude + 20)) * 111
        indian_distance = min(abs(longitude - 20), abs(longitude - 100)) * 111
        
        return min(pacific_distance, atlantic_distance, indian_distance)
    
    @staticmethod
    def _get_affected_coastal_areas(latitude: float, longitude: float, impact_radius: float) -> List[Dict]:
        """获取受影响的沿海地区列表"""
        coastal_regions = [
            {"name": "北美西海岸", "lat": 40, "lng": -120, "countries": ["美国", "加拿大"]},
            {"name": "北美东海岸", "lat": 40, "lng": -70, "countries": ["美国", "加拿大"]},
            {"name": "欧洲西海岸", "lat": 50, "lng": -10, "countries": ["英国", "法国", "西班牙", "葡萄牙"]},
            {"name": "亚洲东海岸", "lat": 35, "lng": 120, "countries": ["中国", "日本", "韩国"]},
            {"name": "东南亚", "lat": 10, "lng": 100, "countries": ["泰国", "越南", "菲律宾", "马来西亚"]},
            {"name": "南美西海岸", "lat": -20, "lng": -80, "countries": ["智利", "秘鲁", "厄瓜多尔"]},
            {"name": "南美东海岸", "lat": -20, "lng": -40, "countries": ["巴西", "阿根廷", "乌拉圭"]},
            {"name": "澳大利亚东海岸", "lat": -30, "lng": 150, "countries": ["澳大利亚"]},
            {"name": "澳大利亚西海岸", "lat": -30, "lng": 115, "countries": ["澳大利亚"]},
        ]
        
        affected_areas = []
        for region in coastal_regions:
            distance = math.sqrt((latitude - region["lat"])**2 + (longitude - region["lng"])**2) * 111
            if distance <= impact_radius:
                affected_areas.append({
                    "name": region["name"],
                    "distance": distance,
                    "countries": region["countries"]
                })
        
        return affected_areas
