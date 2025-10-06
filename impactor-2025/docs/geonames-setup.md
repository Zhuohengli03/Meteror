# GeoNames API 设置指南

## 概述

本项目使用 [GeoNames](https://www.geonames.org/) API 来动态获取撞击点附近的真实城市数据，包括：
- 城市名称和坐标
- 人口数据
- 行政区划信息

这使得撞击分析能够**根据实际的城市分布和人口密度**来计算影响，而不是依赖预定义的城市列表。

## 为什么需要 GeoNames？

### 优势
1. **动态查询**：根据撞击点位置实时查询附近城市
2. **全球覆盖**：包含全球超过 1100 万个地理名称
3. **真实数据**：基于真实的人口和地理数据
4. **免费使用**：每天最多 20,000 次免费 API 调用

### 回退机制
如果没有配置 GeoNames API，系统会自动使用内置的 50+ 个全球主要城市数据库作为备用。

## 注册步骤

### 1. 创建账户
访问 [GeoNames 注册页面](https://www.geonames.org/login)：

1. 点击 "create a new user account"
2. 填写用户名、邮箱和密码
3. 确认邮箱验证链接

### 2. 启用 Web Services
注册后，你需要手动启用 Web Services 功能：

1. 登录 [GeoNames 账户](https://www.geonames.org/login)
2. 点击你的用户名进入账户页面
3. 找到 "Free Web Services" 部分
4. 点击 **"Click here to enable"** 按钮

⚠️ **重要**：如果不启用此功能，API 调用会返回错误！

### 3. 配置环境变量
将你的 GeoNames 用户名添加到 `.env` 文件：

```bash
# .env
GEONAMES_USERNAME=your_username_here
```

或者在 `env.example` 中复制配置：

```bash
cp env.example .env
# 然后编辑 .env 文件，填入你的用户名
```

## API 使用限制

### 免费账户
- **每小时**：最多 1,000 次请求
- **每天**：最多 20,000 次请求
- **并发**：最多 1 个并发请求

### 付费账户（可选）
如果需要更高的配额，可以升级到付费账户：
- 每天最多 200,000 次请求
- 更高的并发限制
- 详情见 [GeoNames 商业服务](https://www.geonames.org/commercial-webservices.html)

## 工作原理

### 1. API 调用流程
```python
# 当用户运行撞击模拟时
impact_location = (40.7128, -74.0060)  # 纽约
radius = 1000  # km

# 系统会调用 GeoNames API
cities = await geonames_client.get_nearby_cities(
    latitude=40.7128,
    longitude=-74.0060,
    radius_km=1000,
    max_rows=500,
    min_population=10000
)

# 返回结果示例：
# [
#   {"name": "New York", "population": 8336817, "latitude": 40.7128, ...},
#   {"name": "Philadelphia", "population": 1584064, "latitude": 39.9526, ...},
#   {"name": "Boston", "population": 692600, "latitude": 42.3601, ...},
#   ...
# ]
```

### 2. GDP 数据补充
GeoNames 只提供人口数据，系统会根据国家代码自动估算 GDP per capita：

```python
gdp_per_capita = estimate_gdp_per_capita(country_code="US")
# 返回: 65000 (美元)
```

### 3. 影响分析
系统根据城市距离撞击点的距离计算影响等级：

| 距离范围 | 影响等级 | 经济损失比例 |
|---------|---------|------------|
| 0 - 陨石坑半径 | Extreme | 95% |
| 陨石坑 - 爆炸半径 | High | 50% |
| 爆炸半径 - 3x | Medium | 20% |
| 3x - 10x | Low | 5% |
| 10x+ | Minimal | 1% |

## 故障排查

### 错误：账户未启用 Web Services
```
Error: user account not enabled to use the free web service
```

**解决方法**：登录 GeoNames 账户，在账户页面点击 "enable free web services"。

### 错误：超过 API 限制
```
Error: the hourly limit of 1000 credits for demo has been exceeded
```

**解决方法**：
1. 等待一小时后重试
2. 升级到付费账户
3. 系统会自动切换到备用城市数据库

### 错误：无效的用户名
```
Error: invalid user
```

**解决方法**：检查 `.env` 文件中的 `GEONAMES_USERNAME` 是否正确。

## 测试 API 连接

运行以下命令测试 GeoNames API 是否正常工作：

```bash
# 测试 API 连接
curl "http://api.geonames.org/findNearbyPlaceNameJSON?lat=40.7128&lng=-74.0060&radius=100&maxRows=10&username=YOUR_USERNAME"
```

成功的响应示例：
```json
{
  "geonames": [
    {
      "name": "New York City",
      "lat": 40.71427,
      "lng": -74.00597,
      "population": 8336817,
      "countryCode": "US",
      ...
    }
  ]
}
```

## 备用方案

如果不想使用 GeoNames API，系统会自动使用内置的城市数据库，包含：
- 50+ 个全球主要城市
- 覆盖所有大洲
- 包含人口和 GDP 数据

只需将 `GEONAMES_USERNAME` 留空或设置为 `demo` 即可。

## 更多资源

- [GeoNames 官方文档](https://www.geonames.org/export/web-services.html)
- [GeoNames API 示例](https://www.geonames.org/export/ws-overview.html)
- [GeoNames 数据导出](https://download.geonames.org/export/dump/)

## 支持

如有问题，请查看：
1. [GeoNames 论坛](https://forum.geonames.org/)
2. [项目 Issues](https://github.com/your-repo/issues)
