# 🌍 小行星撞击地球模拟器

一个基于NASA数据的交互式小行星撞击地球模拟系统，使用真实的NASA小行星数据和地球地图。

## ✨ 功能特色

### 🗺️ NASA地球地图
- **NASA Blue Marble**: 使用NASA的Blue Marble地球图像
- **NASA Black Marble**: 夜间地球视图
- **NASA MODIS**: 真实色彩地球图像
- **全球视野**: 支持缩放和拖拽

### 🎯 交互式撞击模拟
- **点击选择**: 在地图上任意位置点击选择撞击地点
- **小行星选择**: 从NASA API获取真实小行星数据
- **实时计算**: 基于物理学的撞击影响计算

### 📊 详细影响分析
- **陨石坑直径**: 以公里为单位
- **地震震级**: 里氏震级
- **海啸高度**: 以米为单位
- **冲击能量**: 以艾焦耳(EJ)为单位

### 🏙️ 受影响城市分析
- **70+个主要城市**: 覆盖全球主要城市
- **距离计算**: 按距离撞击点远近排序
- **人口数据**: 显示城市人口信息
- **可视化标记**: 受影响城市高亮显示

## 🚀 快速开始

### 1. 启动后端服务
```bash
./start.sh
```

### 2. 启动前端服务
```bash
python3 -m http.server 3000
```

### 3. 访问应用
打开浏览器访问: `http://localhost:3000`

## 📁 项目结构

```
Hackson/
├── backend/                 # 后端服务
│   ├── main.py             # FastAPI主服务
│   ├── API.py              # NASA API配置
│   └── asteroid_data.db     # SQLite数据库
├── index.html              # 前端界面（NASA地图）
├── requirements.txt        # Python依赖
├── start.sh               # 后端启动脚本
└── README.md              # 项目文档
```

## 🛠️ 技术栈

### 后端
- **FastAPI**: 现代Python Web框架
- **SQLite**: 轻量级数据库
- **NASA NEO API**: 小行星数据源
- **Uvicorn**: ASGI服务器

### 前端
- **Leaflet.js**: 交互式地图库
- **NASA WMTS**: NASA地图瓦片服务
- **HTML5/CSS3**: 现代Web技术
- **JavaScript**: 交互逻辑

## 🌐 NASA数据源

- **小行星数据**: NASA Near Earth Object (NEO) API
- **地球地图**: NASA Blue Marble, Black Marble, MODIS
- **实时更新**: 自动获取最新小行星轨道数据

## 🎮 使用方法

1. **选择撞击地点**: 在地图上点击任意位置
2. **选择小行星**: 从下拉菜单选择小行星
3. **运行模拟**: 点击"运行撞击模拟"按钮
4. **查看结果**: 查看撞击影响和受影响城市

## 🔧 配置

### NASA API密钥
在 `backend/API.py` 中配置您的NASA API密钥：
```python
NASA_API_KEY = "your_api_key_here"
```

### 地图服务
支持多种NASA地图服务：
- Blue Marble (白天地球)
- Black Marble (夜间地球)  
- MODIS True Color (真实色彩)

## 📊 撞击计算

基于以下物理参数：
- 小行星直径和密度
- 撞击角度和速度
- 目标地质类型
- 地球重力场

计算结果包括：
- 陨石坑直径
- 冲击能量释放
- 地震震级
- 海啸高度
- 影响范围

## 🌍 全球城市数据

包含70+个主要城市：
- 中国34个主要城市
- 亚洲其他主要城市
- 欧洲、美洲、非洲、大洋洲主要城市
- 实时距离计算和影响分析

## 📝 许可证

本项目使用MIT许可证。

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📞 联系

如有问题，请提交Issue或联系开发者。

---

**注意**: 本项目仅用于教育和研究目的，模拟结果不代表真实风险评估。