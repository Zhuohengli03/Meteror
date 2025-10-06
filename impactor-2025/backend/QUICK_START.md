# 🚀 Impact Exposure Estimator - Quick Start

## 1分钟快速开始

### 步骤 1: 安装依赖（可选）

```bash
# 基础功能（只需 requests 和 numpy）
pip install requests numpy

# 完整功能（包括可视化）
pip install requests numpy folium matplotlib
```

### 步骤 2: 运行分析

```bash
cd backend

# 分析多伦多（使用默认 160m 小行星）
python3 impact_exposure_estimator.py Toronto

# 分析北京（使用自定义小行星）
python3 impact_exposure_estimator.py Beijing --diameter 500 --velocity 20

# 分析纽约（使用自定义影响半径）
python3 impact_exposure_estimator.py "New York" --radius 10
```

### 步骤 3: 查看结果

脚本会输出：
1. **控制台报告**: 人口、建筑物、损害区域
2. **HTML 地图**: `impact_map_<城市>.html`（需要 folium）
3. **PNG 图表**: `impact_plot_<城市>.png`（需要 matplotlib）

---

## 📊 示例输出

```
==================================================================
🌍 ASTEROID IMPACT EXPOSURE ESTIMATOR
==================================================================
🔍 Searching for city: Toronto
✅ Found: Toronto, Canada
   Coordinates: (43.7001, -79.4163)
   Population: 2,600,000

💥 Impact Parameters:
   Asteroid diameter: 160m
   Impact velocity: 15 km/s
   Impact angle: 45°
   Impact energy: 7.23 megatons TNT
   Crater radius: 1.20 km

🏢 Querying buildings within 1.20 km...
✅ Found 2,847 buildings
   Building density: 628.5 buildings/km²

👥 Population Estimate:
   Exposed population: 45,678

==================================================================
📋 SUMMARY
==================================================================
City: Toronto, Canada
Impact Radius: 1.20 km
Exposed Population: 45,678
Affected Buildings: 2,847
Building Density: 628.5 buildings/km²

✅ Analysis complete!
```

---

## 🎯 常用场景

### 场景 1: 比较不同城市

```bash
# 分析多个城市
for city in "Tokyo" "London" "Paris" "Beijing"; do
    python3 impact_exposure_estimator.py "$city" --no-map --no-plot
done
```

### 场景 2: 不同大小的小行星

```bash
# 小型（Chelyabinsk 级）
python3 impact_exposure_estimator.py Moscow --diameter 20

# 中型（Tunguska 级）
python3 impact_exposure_estimator.py Moscow --diameter 50

# 大型
python3 impact_exposure_estimator.py Moscow --diameter 500
```

### 场景 3: 自定义影响半径

```bash
# 直接指定半径（跳过物理计算）
python3 impact_exposure_estimator.py Shanghai --radius 5
```

---

## ⚙️ 配置 GeoNames（可选）

为了获取更准确的数据，建议注册 GeoNames：

1. 访问 https://www.geonames.org/login
2. 注册免费账户
3. 启用 "Free Web Services"
4. 使用你的用户名：

```bash
python3 impact_exposure_estimator.py Toronto --username your_username
```

---

## 🐛 常见问题

### Q: 没有安装 folium/matplotlib？

**A**: 脚本仍然可以运行，只是跳过可视化：

```bash
python3 impact_exposure_estimator.py Toronto --no-map --no-plot
```

### Q: OpenStreetMap 查询超时？

**A**: 使用更小的半径或稍后重试：

```bash
python3 impact_exposure_estimator.py Toronto --radius 2
```

### Q: 找不到城市？

**A**: 尝试不同的城市名称格式：

```bash
python3 impact_exposure_estimator.py "New York City"
python3 impact_exposure_estimator.py "NYC"
```

---

## 📚 更多信息

- 完整文档: `EXPOSURE_ESTIMATOR_README.md`
- 依赖列表: `exposure_requirements.txt`
- 源代码: `impact_exposure_estimator.py`

---

**提示**: 第一次运行可能需要几秒钟来查询 OpenStreetMap 数据。
