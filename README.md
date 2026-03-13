# 闲鱼发货助手

基于 Vue3 + Cloudflare Worker + Cloudflare D1 的自定义字段管理系统，用于管理闲鱼发货记录。

## ✨ 功能特性

- ✨ **自定义字段管理**：支持文本、数字、日期、选择框、多行文本等多种字段类型
- 📦 **发货记录管理**：记录订单信息，支持自定义字段数据
- 📋 **一键复制**：可将记录数据按配置格式复制到剪贴板
- 🚚 **快捷发货**：一键标记订单为已发货状态
- 🌐 **RESTful API**：提供完整的 API 接口进行数据操作
- ☁️ **一键部署**：使用 Cloudflare Worker 统一部署，无需分别部署前后端
- 🎨 **现代化 UI**：自定义设计系统，美观易用
- 📱 **响应式设计**：支持桌面和移动设备

## 🛠 技术栈

- **前端**：Vue 3 + Vite + Element Plus + Axios
- **后端**：Cloudflare Worker (原生 JavaScript)
- **数据库**：Cloudflare D1 (SQLite)
- **部署**：Cloudflare Worker（统一部署）

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
cd frontend && npm install && cd ..
```

### 2. 配置 Cloudflare

#### 安装 Wrangler CLI

```bash
npm install -g wrangler
```

#### 登录 Cloudflare

```bash
wrangler login
```

### 3. 本地开发

```bash
npm run dev
```

- 前端：http://localhost:3000
- 后端：http://localhost:8787

### 4. 构建并部署

```bash
npm run deploy
```

### 5. 绑定数据库（可视化配置）

部署后，在 Cloudflare Dashboard 中绑定 D1 数据库：

1. 进入 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 点击 **Workers & Pages**
3. 选择 `shipping-assistant` Worker
4. 点击 **Settings** → **Variables** → **D1 Database Bindings**
5. 点击 **Add Binding**
   - **Variable name**: `DB`
   - **D1 database**: 选择或创建 `shipping-db`
6. 点击 **Save**

### 6. 执行数据库迁移

```bash
npm run db:migrate:prod
```

一条命令即可完成部署！

## 📚 详细文档

- [部署指南](./DEPLOYMENT.md) - 完整的部署步骤和配置说明
- [快速开始](./QUICK_START.md) - 5分钟快速上手
- [项目结构](./PROJECT_STRUCTURE.md) - 技术架构和目录结构

## 📡 API 文档

### 商品管理接口

- `GET /api/products` - 获取所有商品
- `POST /api/products` - 创建商品
- `PUT /api/products/:id` - 更新商品
- `DELETE /api/products/:id` - 删除商品

### 自定义字段接口

- `GET /api/products/:productId/fields` - 获取商品的所有字段
- `POST /api/products/:productId/fields` - 创建字段
- `PUT /api/fields/:id` - 更新字段
- `DELETE /api/fields/:id` - 删除字段

### 发货记录接口

- `GET /api/products/:productId/records` - 获取商品的所有记录
- `POST /api/products/:productId/records` - 创建记录
- `PUT /api/records/:id` - 更新记录
- `DELETE /api/records/:id` - 删除记录
- `GET /api/records/order/:order_id` - 根据订单号查询

## 🎨 支持的字段类型

- `text` - 单行文本
- `number` - 数字
- `date` - 日期选择
- `select` - 下拉选择
- `textarea` - 多行文本

## 📁 项目结构

```
shipping-assistant/
├── frontend/              # Vue3 前端应用
│   ├── src/
│   │   ├── components/
│   │   │   ├── ProductManage.vue   # 商品管理
│   │   │   ├── FieldManage.vue     # 字段管理
│   │   │   └── ShippingManage.vue  # 发货管理
│   │   ├── App.vue
│   │   ├── main.js
│   │   └── router/        # 路由配置
│   ├── package.json
│   └── vite.config.js
├── server/                # Worker 后端
│   ├── worker.js          # Worker 入口（统一处理）
│   ├── routes.js          # API 路由
│   └── db.js              # 数据库服务
├── local-dev.js           # 本地开发服务器
├── wrangler.toml          # Cloudflare 配置
├── schema.sql             # 数据库结构
└── package.json           # 项目配置
```

## 🔧 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动本地开发环境 |
| `npm run build` | 构建前端 |
| `npm run deploy` | 构建并部署到 Cloudflare Worker |
| `npm run db:migrate` | 本地数据库迁移 |
| `npm run db:migrate:prod` | 生产数据库迁移 |
| `npm run db:create` | 创建 D1 数据库 |

## ⚡ 部署架构

本项目采用 **统一部署** 架构：

```
┌─────────────────────────────────────┐
│     Cloudflare Worker                │
│  ┌──────────────────────────────┐   │
│  │  前端静态文件 (Vue3 构建)    │   │
│  └──────────────────────────────┘   │
│  ┌──────────────────────────────┐   │
│  │  后端 API (Worker 路由)      │   │
│  └──────────────────────────────┘   │
│  ┌──────────────────────────────┐   │
│  │  Cloudflare D1 数据库        │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

**优势**：
- ✅ 一次部署，包含前后端
- ✅ 全球 CDN 加速
- ✅ 无服务器架构，自动扩缩容
- ✅ 免费额度充足

## 📝 注意事项

1. **首次部署后需在 Dashboard 绑定数据库**，无需修改代码中的 `database_id`
2. 本地开发使用模拟数据库，数据不持久化
3. 生产环境使用真实的 Cloudflare D1 数据库
4. 部署后访问 Worker URL 即可使用完整应用
5. 每个商品可以独立配置字段和复制字段设置
6. 复制字段配置保存在浏览器本地存储中

## 🔐 安全建议

- 所有 API 接口已配置 CORS
- 数据库查询使用参数化查询防止 SQL 注入
- 建议在生产环境添加 API 认证和限流

## 📄 许可证

MIT

