#!/bin/bash

echo "================================"
echo "闲鱼发货助手 - 安装脚本"
echo "================================"
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未安装 Node.js"
    echo "请先安装 Node.js: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js 版本: $(node -v)"
echo ""

# 安装根目录依赖
echo "📦 安装根目录依赖..."
npm install

# 安装前端依赖
echo "📦 安装前端依赖..."
cd frontend
npm install
cd ..

# 安装后端依赖
echo "📦 安装后端依赖..."
cd server
npm install
cd ..

echo ""
echo "================================"
echo "✅ 安装完成！"
echo "================================"
echo ""
echo "下一步："
echo "1. 配置 Cloudflare: 参考 GETTING_STARTED.md"
echo "2. 本地开发: npm run dev"
echo ""
