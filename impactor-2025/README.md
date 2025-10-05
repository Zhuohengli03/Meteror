# Defend Earth - 小行星撞击仿真系统

一个全栈Web应用，集成NASA NEO与USGS数据，支持可交互的轨道/撞击仿真、影响评估与缓解策略对比可视化。

## 🚀 功能特性

- **3D轨道可视化**: Three.js渲染地球、小行星轨道和偏转向量
- **2D影响地图**: Maplibre GL/Leaflet显示撞击影响圈层
- **物理仿真**: 基于科学模型的撞击、地震、海啸计算
- **偏转策略**: Δv偏转效果对比和可视化
- **Defend Earth游戏**: 小游戏化模式，挑战拯救地球
- **多语言支持**: 中英文界面
- **无障碍设计**: 键盘导航和色盲安全调色板

## 🛠 技术栈

### 前端
- **框架**: Vite + React + TypeScript
- **3D渲染**: Three.js
- **2D地图**: Maplibre GL (WebGL降级到Leaflet)
- **图表**: D3.js
- **状态管理**: Zustand
- **国际化**: i18next

### 后端
- **框架**: Python + FastAPI
- **数据源**: NASA NEO API, USGS数据
- **缓存**: requests-cache + in-memory
- **数据验证**: Pydantic

### 部署
- **容器化**: Docker + Docker Compose
- **反向代理**: Nginx
- **环境配置**: .env

## 📁 项目结构

```
impactor-2025/
├── frontend/                 # React前端
│   ├── src/
│   │   ├── components/      # React组件
│   │   ├── lib/            # 工具库和物理计算
│   │   ├── pages/          # 页面组件
│   │   └── workers/        # WebWorker
│   └── package.json
├── backend/                 # FastAPI后端
│   ├── app/
│   │   ├── routers/        # API路由
│   │   ├── services/       # 业务逻辑
│   │   └── models.py       # 数据模型
│   └── requirements.txt
├── data/                   # 静态数据
│   ├── samples/           # 演示场景
│   └── rasters/           # 栅格数据
├── docs/                  # 文档
├── infra/                 # 基础设施配置
└── docker-compose.yml
```

## 🚀 快速开始

### 环境要求
- Node.js 18+
- Python 3.9+
- 可选: Docker & Docker Compose

### 1. 克隆项目
```bash
git clone <repository-url>
cd impactor-2025
```

### 2. 本地运行（推荐）

前端和后端本地启动，更适合开发与调试。

1) 启动后端（内置代理与模拟计算）
```bash
cd backend
python simple_server.py
```

该简化服务提供：
- POST /api/simulate/impact 运行撞击模拟
- GET  /api/asteroids/search 代理/提供小行星列表（避免NASA CORS/401，并内置示例数据）

2) 启动前端
```bash
cd frontend
npm install
npm run dev
```

访问：http://localhost:5173

### 3. 使用Docker启动（可选）
```bash
docker-compose up -d
```

### 4. 访问应用
- 前端: http://localhost:5173
- 后端（简化服务）: http://localhost:8000
- 主要端点:
  - POST `http://localhost:8000/api/simulate/impact`
  - GET  `http://localhost:8000/api/asteroids/search`

## 🎮 使用指南

### 演示模式
1. 访问首页，点击"演示场景一键运行"
2. 观看预设的Impactor-2025场景动画
3. 体验偏转策略的效果对比

### 自定义仿真
1. 进入"场景"页面
2. 在左侧控制面板设置小行星参数
3. 在3D视图中观察轨道变化
4. 在2D地图中查看影响范围
5. 尝试不同的偏转策略

提示：未选择API小行星时，“运行模拟”按钮禁用；选择小行星后，质量会基于直径与密度自动计算，手动更改速度/角度后可一键“Reset to API”恢复。

### Defend Earth游戏
1. 选择游戏模式
2. 在倒计时内制定偏转策略
3. 分配预算和资源
4. 挑战拯救地球！

## 🔬 科学模型

### 轨道计算
- 基于开普勒轨道的二体问题求解
- 支持真近点角推进和时间演化
- 地球大气层进入判别

### 撞击物理
- 质量-能量关系: E = 1/2 mv²
- TNT当量转换: 1 Mt TNT = 4.184×10¹⁵ J
- π-scaling陨坑直径估算
- 地震矩和宏观烈度(MMI)计算

### 海啸模型
- 基于冲击能量和近岸坡度的简化模型
- 距离衰减和地形屏蔽效应
- 沿海岸线传播模拟

## 📊 数据源

- **NASA NEO API（通过后端代理）**: 近地小行星轨道数据（避免浏览器CORS/401）
- **USGS**: 地形数据、地震历史、海啸区
- **WorldPop**: 人口密度栅格数据
- **Natural Earth**: 海岸线和行政区划

## 🧪 测试

### 前端测试
```bash
cd frontend
npm test
```

### 后端测试
```bash
cd backend
pytest
```

## 📚 文档

- [API文档](docs/api.md)

---

## 🛠 故障排查（Troubleshooting）

- 运行模拟后页面空白/报错 toFixed：
  - 已增强结果渲染的空值保护；请刷新并重试。如果仍出现，请打开 DevTools 并截图 `OutcomeCards` 的报错位置。

- 3D 画面报 "WebGL context lost":
  - 已在 Three.js Canvas 中加入上下文丢失处理，通常无需刷新即可恢复；若持续出现，请刷新页面或降低其它标签页的GPU占用。

- 小行星列表加载失败/出现 CORS/401：
  - 前端已默认通过 `GET /api/asteroids/search` 后端代理获取数据，无需NASA密钥；请确认后端 `python simple_server.py` 正在运行。

- 模拟无结果/按钮不可点：
  - 未选择小行星时会禁用运行；请选择任意小行星（或展开自定义设置并填写参数）。

- [物理公式](docs/formulas.md)
- [数据源说明](docs/data-sources.md)
- [架构设计](docs/architecture.md)

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📄 许可证

MIT License

## ⚠️ 免责声明

本应用仅用于教育和演示目的，不应用于实际的小行星威胁评估或应急响应。
