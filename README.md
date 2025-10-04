# 🌌 陨石冲击模拟器

基于NASA NEO API的交互式陨石冲击模拟系统，具有3D可视化和物理计算功能。

## ✨ 功能特性

- **真实数据**: 集成NASA NEO API获取真实小行星数据
- **3D可视化**: 使用Three.js创建动态轨道和冲击可视化
- **物理模拟**: 计算冲击能量、陨石坑大小、地震震级等
- **交互界面**: 多标签页设计，支持参数调整和实时模拟
- **数据分析**: 统计分析和轨道参数展示

## 🚀 快速开始

### 1. 安装依赖

```bash
# 安装Python依赖
pip install -r requirements.txt
```

### 2. 启动后端

```bash
cd backend
python3 main.py
```

后端将在 `http://localhost:8000` 启动

### 3. 启动前端

```bash
python3 -m http.server 3001
```

前端将在 `http://localhost:3001` 启动

### 4. 访问界面

打开浏览器访问 `http://localhost:3001`

## 📁 项目结构

```
Hackson/
├── backend/
│   ├── main.py              # FastAPI后端服务
│   ├── API.py               # NASA API密钥配置
│   └── asteroid_data.db     # SQLite数据库
├── index.html               # 统一前端界面
├── demo.py                  # 演示脚本
├── requirements.txt         # Python依赖
└── README.md               # 项目文档
```

## 🎯 使用说明

### 冲击模拟
1. 在"冲击模拟"标签页中选择小行星
2. 调整冲击参数（速度、角度、撞击器质量等）
3. 点击"开始模拟"查看结果

### 3D可视化
1. 切换到"3D可视化"标签页
2. 使用鼠标控制视角
3. 调整动画速度和显示选项

### 数据分析
1. 在"数据分析"标签页查看统计信息
2. 了解轨道参数和分类数据

## 🔧 API端点

- `GET /` - API状态
- `POST /asteroids/fetch` - 获取NASA小行星数据
- `GET /asteroids` - 获取缓存的小行星列表
- `POST /simulate` - 运行冲击模拟

## 📊 物理计算

系统使用简化的物理模型计算：

- **冲击能量**: E = ½mv²
- **陨石坑直径**: 基于冲击能量和材料特性
- **地震震级**: 基于冲击能量估算
- **海啸高度**: 基于冲击位置和能量
- **偏转效果**: 基于撞击器参数和提前时间

## 🌐 数据源

- **NASA NEO API**: 近地天体数据库
- **API端点**: `/neo/browse`
- **数据包含**: 轨道参数、直径、速度等

## 🎮 演示

运行演示脚本查看基本功能：

```bash
python3 demo.py
```

## 📝 技术栈

- **后端**: FastAPI, SQLite, NASA NEO API
- **前端**: HTML5, CSS3, JavaScript, Three.js
- **可视化**: Three.js 3D图形库
- **数据**: 真实NASA小行星数据

## 🔑 API密钥

在 `backend/API.py` 中配置你的NASA API密钥：

```python
sparams = {
    "api_key": "你的API密钥",
}
```

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交Issue和Pull Request！

---

**注意**: 确保后端服务在端口8000运行，前端服务在端口3001运行。