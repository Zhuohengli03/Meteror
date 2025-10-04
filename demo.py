#!/usr/bin/env python3
"""
Asteroid Impact Simulator - 简化演示脚本

这个脚本演示陨石冲击模拟系统的核心功能。
"""

import requests
import json

# 配置
API_BASE = "http://localhost:8000"

def print_header(title):
    """打印格式化的标题"""
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")

def test_api():
    """测试API连接"""
    print_header("测试API连接")
    try:
        response = requests.get(f"{API_BASE}/")
        if response.status_code == 200:
            print("✅ API正在运行")
            return True
        else:
            print(f"❌ API返回状态码: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ 无法连接到API。请确保后端在端口8000上运行")
        return False

def fetch_asteroids():
    """获取小行星数据"""
    print_header("获取NASA小行星数据")
    try:
        response = requests.post(f"{API_BASE}/asteroids/fetch")
        if response.status_code == 200:
            result = response.json()
            print(f"✅ 成功获取数据: {result['message']}")
            return True
        else:
            print(f"❌ 获取数据失败: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ 错误: {e}")
        return False

def list_asteroids():
    """列出小行星"""
    print_header("小行星列表")
    try:
        response = requests.get(f"{API_BASE}/asteroids")
        asteroids = response.json()
        
        print(f"找到 {len(asteroids)} 个小行星:")
        for i, asteroid in enumerate(asteroids[:5]):  # 只显示前5个
            diameter = (asteroid['diameter_min'] + asteroid['diameter_max']) / 2
            print(f"  {i+1}. {asteroid['name']} - {diameter/1000:.1f} km")
        
        if len(asteroids) > 5:
            print(f"  ... 还有 {len(asteroids) - 5} 个小行星")
        
        return asteroids
    except Exception as e:
        print(f"❌ 错误: {e}")
        return []

def run_simulation(asteroids):
    """运行模拟"""
    if not asteroids:
        print("❌ 没有小行星数据")
        return
    
    print_header("运行冲击模拟")
    
    # 使用第一个小行星进行模拟
    asteroid = asteroids[0]
    simulation_data = {
        "asteroid_id": asteroid["id"],
        "impact_velocity": 20000,
        "impact_angle": 45,
        "impactor_mass": 1000,
        "impactor_velocity": 10000,
        "lead_time_days": 365
    }
    
    try:
        response = requests.post(f"{API_BASE}/simulate", json=simulation_data)
        if response.status_code == 200:
            result = response.json()
            print("✅ 模拟完成!")
            print(f"  陨石坑直径: {result['crater_diameter']:.2f} km")
            print(f"  冲击能量: {result['impact_energy']/1e15:.2f} × 10¹⁵ J")
            print(f"  地震震级: {result['seismic_magnitude']:.1f} 级")
            print(f"  海啸高度: {result['tsunami_height']:.1f} m")
            print(f"  受影响人口: {result['affected_population']:,} 人")
            print(f"  偏转成功: {'是' if result['deflection_success'] else '否'}")
        else:
            print(f"❌ 模拟失败: {response.status_code}")
    except Exception as e:
        print(f"❌ 错误: {e}")

def main():
    """主函数"""
    print_header("🌌 陨石冲击模拟器演示")
    
    # 测试API连接
    if not test_api():
        return
    
    # 获取小行星数据
    if not fetch_asteroids():
        return
    
    # 列出小行星
    asteroids = list_asteroids()
    
    # 运行模拟
    run_simulation(asteroids)
    
    print_header("演示完成")
    print("🌐 访问 http://localhost:3001 查看完整界面")

if __name__ == "__main__":
    main()