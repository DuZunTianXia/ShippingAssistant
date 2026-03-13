#!/bin/bash

echo "================================"
echo "闲鱼发货助手 - 部署脚本"
echo "================================"
echo ""

# 检查是否已登录 Cloudflare
if ! wrangler whoami &> /dev/null; then
    echo "❌ 未登录 Cloudflare"
    echo "请先执行: wrangler login"
    exit 1
fi

# 检查数据库 ID 是否已配置
if grep -q "your-database-id" wrangler.toml; then
    echo "⚠️  警告: wrangler.toml 中的 database_id 未配置"
    echo ""
    read -p "是否现在创建数据库？(y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "📦 创建 D1 数据库..."
        wrangler d1 create shipping-db
        echo ""
        echo "请将返回的 database_id 更新到 wrangler.toml 文件中"
        echo "然后重新运行此脚本"
        exit 0
    else
        echo "请先配置 database_id"
        exit 1
    fi
fi

# 询问是否执行数据库迁移
read -p "是否执行数据库迁移？(y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗄️  执行数据库迁移..."
    npm run db:migrate:prod
    echo ""
fi

# 构建前端
echo "🔨 构建前端..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 构建失败"
    exit 1
fi

echo ""

# 部署
echo "🚀 部署到 Cloudflare Worker..."
wrangler deploy

if [ $? -eq 0 ]; then
    echo ""
    echo "================================"
    echo "✅ 部署成功！"
    echo "================================"
    echo ""
    echo "Worker URL: https://shipping-assistant.你的账户.workers.dev"
    echo ""
    echo "下一步:"
    echo "1. 访问 Worker URL"
    echo "2. 开始使用应用"
    echo ""
else
    echo "❌ 部署失败"
    exit 1
fi
