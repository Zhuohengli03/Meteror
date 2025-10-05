"""
小行星撞击模拟配置文件
包含所有计算参数和常量
"""

# 物理常数
PHYSICS_CONSTANTS = {
    'GRAVITY': 9.81,  # 重力加速度 (m/s²)
    'TNT_ENERGY_PER_TON': 4.184e9,  # 每吨TNT的能量 (J)
    'TNT_ENERGY_PER_MEGATON': 4.184e15,  # 每百万吨TNT的能量 (J)
    'EARTH_RADIUS': 6371000,  # 地球半径 (m)
    'DEGREES_TO_KM': 111,  # 度到公里的转换因子
}

# 小行星参数
ASTEROID_PARAMETERS = {
    'DEFAULT_DENSITY': 3000,  # 默认密度 (kg/m³)
    'DENSITY_RANGE': {
        'carbonaceous': 2000,  # 碳质小行星
        'stony': 3000,         # 石质小行星
        'metallic': 8000,      # 金属小行星
    },
    'DEFAULT_IMPACT_ANGLE': 45,  # 默认撞击角度 (度)
}

# 目标参数
TARGET_PARAMETERS = {
    'CONTINENTAL_CRUST': {
        'density': 2500,  # 大陆地壳密度 (kg/m³)
        'crater_multiplier': 1.0,
    },
    'OCEANIC_CRUST': {
        'density': 2800,  # 海洋地壳密度 (kg/m³)
        'crater_multiplier': 1.2,
    },
    'ICE_SHEET': {
        'density': 900,   # 冰层密度 (kg/m³)
        'crater_multiplier': 0.8,
    }
}

# Pi缩放定律参数
PI_SCALING_PARAMETERS = {
    'CONSTANT': 1.161,  # 缩放常数
    'DIAMETER_EXPONENT': 0.78,  # 直径指数
    'VELOCITY_EXPONENT': 0.44,  # 速度指数
    'ANGLE_EXPONENT': 2/3,      # 角度指数
}

# 超压缩放参数
OVERPRESSURE_PARAMETERS = {
    'CONSTANT': 0.28,  # 缩放常数
    'ENERGY_EXPONENT': 0.33,  # 能量指数
    'PRESSURE_EXPONENT': 0.33,  # 压力指数
}

# 热辐射参数
THERMAL_PARAMETERS = {
    'DEFAULT_EFFICIENCY': 0.1,  # 默认能量转换效率
    'DISTANCE_EXPONENT': 2,     # 距离衰减指数
}

# 地震参数
SEISMIC_PARAMETERS = {
    'MAGNITUDE_CONSTANT': 0.67,  # 震级常数
    'MAGNITUDE_OFFSET': 4.0,     # 震级偏移
}

# 海啸参数
TSUNAMI_PARAMETERS = {
    'BASE_HEIGHT_CONSTANT': 0.1,  # 基础高度常数
    'DEPTH_EXPONENT': 1/4,        # 深度指数
    'SEISMIC_COMPONENT': 0.05,    # 地震分量常数
    'ATTENUATION_FACTOR': 100.0,  # 衰减因子
}

# 人口损失参数
POPULATION_LOSS_PARAMETERS = {
    'CRATER_POPULATION_FACTOR': 0.1,  # 陨石坑人口因子
    'BLAST_POPULATION_FACTOR': 0.3,   # 冲击波人口因子
    'CRATER_DENSITY': 100,            # 陨石坑人口密度 (人/km²)
    'BLAST_DENSITY': 50,              # 冲击波人口密度 (人/km²)
    'MORTALITY_RATES': {
        'low': (1e6, 0.8, 0.1),      # (TNT当量阈值, 冲击波死亡率, 地震死亡率)
        'medium': (1e7, 0.9, 0.2),
        'high': (1e8, 0.95, 0.3),
        'very_high': (1e9, 0.98, 0.4),
        'extreme': (float('inf'), 0.99, 0.5),
    }
}

# 经济参数
ECONOMIC_PARAMETERS = {
    'DEVELOPED_COUNTRIES': {
        'economic_factor': 1.8,
        'infrastructure_factor': 0.4,
        'special_buildings_factor': 0.2,
    },
    'DEVELOPING_COUNTRIES': {
        'economic_factor': 1.0,
        'infrastructure_factor': 0.2,
        'special_buildings_factor': 0.1,
    },
    'UNDERDEVELOPED_COUNTRIES': {
        'economic_factor': 0.5,
        'infrastructure_factor': 0.1,
        'special_buildings_factor': 0.05,
    },
    'BASE_ECONOMIC_VALUE_PER_PERSON': 0.5,  # 每人基础经济价值 (百万美元)
    'INFRASTRUCTURE_LOSS_FACTOR': 0.2,      # 基础设施损失因子
    'GDP_LOSS_FACTOR': 0.1,                 # GDP损失因子
    'TRADE_IMPACT_FACTOR': 0.15,            # 贸易影响因子
}

# 建筑价值密度 (每平方公里亿美元)
BUILDING_VALUE_DENSITY = {
    'CRATER': 0.5,      # 陨石坑区域
    'BLAST': 0.1,       # 冲击波区域
    'SEISMIC': 0.01,    # 地震区域
}

# 损坏率
DAMAGE_RATES = {
    'CRATER': 1.0,      # 陨石坑区域：100%损坏
    'BLAST': 0.8,       # 冲击波区域：80%损坏
    'SEISMIC': 0.3,     # 地震区域：30%损坏
}

# 地理区域定义
GEOGRAPHIC_REGIONS = {
    'DEVELOPED_COUNTRIES': [
        (35, 70, -180, -50),    # 北美
        (35, 70, -10, 40),      # 欧洲
        (30, 50, 120, 150),     # 日本
        (-40, -10, 110, 160),   # 澳大利亚
    ],
    'DEVELOPING_COUNTRIES': [
        (10, 50, 70, 140),      # 中国
        (5, 35, 70, 100),       # 印度
        (10, 30, -80, -30),     # 南美
        (10, 30, -20, 60),      # 非洲
    ],
    'AGRICULTURAL_REGIONS': [
        (20, 50, 70, 140),      # 中国农业区
        (20, 50, -130, -60),    # 北美农业区
        (40, 60, -10, 40),      # 欧洲农业区
        (10, 30, -80, -30),     # 南美农业区
    ],
    'TOURISM_REGIONS': [
        (35, 45, -10, 40),      # 欧洲旅游区
        (25, 35, -120, -80),    # 北美西海岸
        (25, 35, -80, -60),     # 北美东海岸
        (20, 30, 100, 140),     # 亚洲旅游区
        (-40, -10, 110, 160),   # 澳大利亚
    ],
    'COASTAL_REGIONS': [
        (30, 50, -180, -60),    # 北美东海岸
        (25, 50, -130, -60),    # 北美西海岸
        (30, 60, -10, 40),      # 欧洲海岸
        (20, 50, 100, 180),     # 亚洲东海岸
        (-40, 20, -80, -30),    # 南美海岸
        (-40, -10, 110, 160),   # 澳大利亚海岸
    ]
}

# 主要城市坐标
MAJOR_CITIES = [
    {"name": "北京", "lat": 39.9042, "lng": 116.4074, "factor": 0.8},
    {"name": "上海", "lat": 31.2304, "lng": 121.4737, "factor": 0.8},
    {"name": "东京", "lat": 35.6762, "lng": 139.6503, "factor": 0.8},
    {"name": "纽约", "lat": 40.7128, "lng": -74.0060, "factor": 0.8},
    {"name": "伦敦", "lat": 51.5074, "lng": -0.1278, "factor": 0.8},
    {"name": "巴黎", "lat": 48.8566, "lng": 2.3522, "factor": 0.8},
]

# 海洋深度模型
OCEAN_DEPTHS = {
    'PACIFIC_DEEP': {
        'lat_range': (20, 60),
        'lng_range': (-180, -120),
        'depth': 4000
    },
    'PACIFIC_DEEP_SOUTH': {
        'lat_range': (-60, 20),
        'lng_range': (-180, -80),
        'depth': 4000
    },
    'ATLANTIC_NORTH': {
        'lat_range': (20, 60),
        'lng_range': (-80, -20),
        'depth': 3500
    },
    'ATLANTIC_SOUTH': {
        'lat_range': (-60, 20),
        'lng_range': (-80, 20),
        'depth': 3500
    },
    'INDIAN_NORTH': {
        'lat_range': (20, 60),
        'lng_range': (20, 100),
        'depth': 3800
    },
    'INDIAN_SOUTH': {
        'lat_range': (-60, 20),
        'lng_range': (20, 120),
        'depth': 3800
    },
    'MEDITERRANEAN': {
        'lat_range': (30, 45),
        'lng_range': (-10, 40),
        'depth': 1500
    },
    'CARIBBEAN': {
        'lat_range': (10, 30),
        'lng_range': (-90, -60),
        'depth': 2000
    },
    'CONTINENTAL_SHELF': {
        'lat_range': (40, 70),
        'lng_range': (-180, -50),
        'depth': 200
    },
    'CONTINENTAL_SHELF_EUROPE': {
        'lat_range': (40, 70),
        'lng_range': (-10, 40),
        'depth': 200
    },
    'DEFAULT': 1000
}

# 海啸严重程度阈值
TSUNAMI_SEVERITY_THRESHOLDS = {
    'LOW': 2,      # 米
    'MEDIUM': 5,   # 米
    'HIGH': 10,    # 米
    'EXTREME': float('inf')
}

# 沿海地区定义
COASTAL_AREAS = [
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
