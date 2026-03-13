# 快速开始指南

## 1. 安装 Wrangler CLI

Wrangler 是 Cloudflare 的官方 CLI 工具：

```bash
npm install -g wrangler
```

## 2. 登录 Cloudflare

```bash
wrangler login
```

这将打开浏览器让你授权访问 Cloudflare 账户。

## 3. 创建 D1 数据库

```bash
wrangler d1 create shipping-db
```

记下返回的 `database_id`，比如：
```
✅ Successfully created DB 'shipping-db'

[[d1_databases]]
binding = "DB"
database_name = "shipping-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

## 4. 更新 wrangler.toml

将上一步获得的 `database_id` 填入 `wrangler.toml` 文件：

```toml
[[d1_databases]]
binding = "DB"
database_name = "shipping-db"
database_id = "你的数据库ID"
```

## 5. 执行数据库迁移

```bash
# 本地环境
npm run db:migrate

# 生产环境
npm run db:migrate:prod
```

## 6. 安装项目依赖

```bash
# 安装根目录依赖
npm install

# 安装前端依赖
cd frontend
npm install

# 安装后端依赖
cd ../server
npm install

cd ..
```

## 7. 本地开发

```bash
npm run dev
```

这将同时启动：
- 前端开发服务器：http://localhost:3000
- 后端开发服务器：http://localhost:8787

## 8. 部署到 Cloudflare Pages

### 8.1 构建前端

```bash
npm run build:frontend
```

### 8.2 部署到 Cloudflare Pages

```bash
wrangler pages deploy ./frontend/dist --project-name=shipping-assistant
```

或者使用脚本：

```bash
npm run deploy
```

## 常用命令

```bash
# 本地 D1 数据库操作
wrangler d1 execute shipping-db --local --command="SELECT * FROM custom_fields"

# 生产 D1 数据库操作
wrangler d1 execute shipping-db --command="SELECT * FROM custom_fields"

# 查看日志
wrangler tail

# 预览本地部署
wrangler pages dev ./frontend/dist --binding=DB=local
```

## 项目结构说明

```
shipping-assistant/
├── frontend/              # Vue3 前端应用
│   ├── src/
│   │   ├── components/    # Vue 组件
│   │   ├── App.vue        # 根组件
│   │   └── main.js        # 入口文件
│   ├── dist/              # 构建输出（自动生成）
│   └── package.json       # 前端依赖
├── server/                # 后端服务
│   ├── worker.js          # Cloudflare Workers 入口
│   ├── routes.js          # API 路由
│   ├── db.js              # 数据库操作
│   └── package.json       # 后端依赖
├── local-dev.js           # 本地开发服务器
├── wrangler.toml          # Cloudflare 配置
├── schema.sql             # 数据库结构
└── package.json           # 项目配置
```

## API 使用示例

### 创建自定义字段

```bash
curl -X POST http://localhost:8787/api/fields \
  -H "Content-Type: application/json" \
  -d '{
    "name": "phone",
    "label": "手机号",
    "type": "text",
    "required": true,
    "sort_order": 1
  }'
```

### 创建发货记录

```bash
curl -X POST http://localhost:8787/api/records \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "ORDER123",
    "status": "pending",
    "data": {
      "phone": "13800138000"
    }
  }'
```

## 注意事项

1. 本地开发时使用模拟数据库，数据不持久化
2. 生产环境使用真实的 Cloudflare D1 数据库
3. 首次部署前确保已配置好 `database_id`
4. 前端 API 请求会通过 Vite 代理到后端

## 故障排查

### 问题：wrangler 命令不存在
```bash
npm install -g wrangler
```

### 问题：数据库未找到
- 检查 `wrangler.toml` 中的 `database_id` 是否正确
- 确保已执行数据库迁移命令

### 问题：CORS 错误
- 本地开发已配置 CORS
- 生产环境使用 API 路由自动处理 CORS

## 下一步

1. 访问 http://localhost:3000 查看前端界面
2. 在"字段管理"页面添加自定义字段
3. 在"发货管理"页面创建和管理发货记录
4. 部署到生产环境供实际使用
