# 项目结构说明

## 完整目录树

```
shipping-assistant/
├── frontend/                          # Vue3 前端应用
│   ├── src/
│   │   ├── components/               # Vue 组件
│   │   │   ├── FieldManage.vue      # 字段管理页面
│   │   │   └── ShippingManage.vue   # 发货管理页面
│   │   ├── api.js                   # Axios API 封装
│   │   ├── App.vue                  # 根组件
│   │   └── main.js                  # 应用入口
│   ├── index.html                    # HTML 入口
│   ├── vite.config.js               # Vite 配置
│   ├── package.json                 # 前端依赖
│   └── dist/                        # 构建输出（自动生成）
│
├── server/                           # 后端服务
│   ├── worker.js                    # Cloudflare Workers 入口
│   ├── index.js                     # Express 服务器（备用）
│   ├── routes.js                    # API 路由定义
│   ├── db.js                        # 数据库操作封装
│   └── package.json                 # 后端依赖
│
├── local-dev.js                      # 本地开发服务器
├── install.sh                        # 自动安装脚本
├── wrangler.toml                     # Cloudflare 配置
├── schema.sql                        # 数据库表结构
├── .gitignore                        # Git 忽略文件
├── package.json                      # 项目配置和脚本
├── README.md                         # 项目说明
├── QUICK_START.md                    # 快速开始指南
├── GETTING_STARTED.md                # 详细部署指南
└── PROJECT_STRUCTURE.md              # 本文件
```

## 文件说明

### 根目录文件

| 文件 | 说明 |
|------|------|
| `package.json` | 项目根配置，定义启动脚本 |
| `wrangler.toml` | Cloudflare Workers 和 Pages 配置 |
| `schema.sql` | D1 数据库表结构定义 |
| `local-dev.js` | 本地开发服务器（模拟 D1 数据库） |
| `install.sh` | 一键安装脚本 |
| `.gitignore` | Git 忽略配置 |

### 文档文件

| 文件 | 说明 |
|------|------|
| `README.md` | 项目总体介绍 |
| `QUICK_START.md` | 5分钟快速开始指南 |
| `GETTING_STARTED.md` | 详细的部署和配置指南 |
| `PROJECT_STRUCTURE.md` | 项目结构说明（本文件） |

### 前端目录 (`frontend/`)

| 文件/目录 | 说明 |
|-----------|------|
| `src/main.js` | Vue 应用入口，配置路由和插件 |
| `src/App.vue` | 根组件，包含导航布局 |
| `src/api.js` | Axios 实例封装，统一 API 调用 |
| `src/components/` | 页面组件目录 |
| `src/components/FieldManage.vue` | 自定义字段管理界面 |
| `src/components/ShippingManage.vue` | 发货记录管理界面 |
| `index.html` | HTML 入口文件 |
| `vite.config.js` | Vite 构建配置，包含代理设置 |
| `package.json` | 前端依赖（Vue3、Element Plus 等） |
| `dist/` | 构建输出目录（由 Vite 生成） |

### 后端目录 (`server/`)

| 文件 | 说明 |
|------|------|
| `worker.js` | Cloudflare Workers 入口，生产环境使用 |
| `index.js` | Express 服务器，备用方案 |
| `routes.js` | 所有 API 路由定义 |
| `db.js` | 数据库操作工具类 |
| `package.json` | 后端依赖（Express、CORS 等） |

## 技术栈

### 前端技术栈

- **框架**：Vue 3 (Composition API)
- **构建工具**：Vite
- **UI 组件库**：Element Plus
- **路由**：Vue Router 4
- **HTTP 客户端**：Axios

### 后端技术栈

- **运行时**：Cloudflare Workers / Node.js
- **框架**：Express（本地开发）
- **数据库**：Cloudflare D1 (SQLite)
- **API 设计**：RESTful

### 部署平台

- **前端**：Cloudflare Pages
- **后端**：Cloudflare Workers
- **数据库**：Cloudflare D1

## 数据流向

```
用户操作
    ↓
Vue3 前端 (localhost:3000)
    ↓
Vite 代理
    ↓
API 接口 (/api/*)
    ↓
后端服务
    ↓
Cloudflare D1 数据库
```

## 开发流程

1. **本地开发**
   ```
   npm run dev → local-dev.js (模拟数据库)
   ```

2. **生产部署**
   ```
   npm run build:frontend → worker.js → Cloudflare D1
   ```

## 配置文件详解

### wrangler.toml

```toml
name = "shipping-assistant"           # 项目名称
main = "server/worker.js"              # Workers 入口
compatibility_date = "2024-01-01"     # 兼容日期

[[d1_databases]]                      # D1 数据库配置
binding = "DB"                         # 绑定名称
database_name = "shipping-db"          # 数据库名称
database_id = "your-database-id"       # 数据库ID（需要替换）

[site]                                 # Pages 配置
bucket = "./frontend/dist"            # 静态文件目录

[build]                                # 构建配置
command = "cd frontend && npm run build"
```

### vite.config.js

```javascript
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,                        // 前端端口
    proxy: {
      '/api': {                        // API 代理
        target: 'http://localhost:8787',  // 后端地址
        changeOrigin: true
      }
    }
  }
})
```

## API 路由结构

```
/api
├── /fields                           # 字段管理
│   ├── GET    /                      # 获取所有字段
│   ├── POST   /                      # 创建字段
│   └── DELETE /:id                    # 删除字段
│
└── /records                          # 记录管理
    ├── GET    /                      # 获取所有记录
    ├── POST   /                      # 创建记录
    ├── PUT    /:id                    # 更新记录
    ├── DELETE /:id                    # 删除记录
    └── GET    /order/:order_id        # 根据订单号查询
```

## 数据库表结构

### custom_fields (自定义字段表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| name | TEXT | 字段名称（英文） |
| label | TEXT | 显示标签（中文） |
| type | TEXT | 字段类型 |
| options | TEXT | 选项（JSON字符串） |
| required | INTEGER | 是否必填 |
| sort_order | INTEGER | 排序顺序 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

### shipping_records (发货记录表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| order_id | TEXT | 订单号 |
| data | TEXT | 自定义数据（JSON字符串） |
| status | TEXT | 状态 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

## 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| PORT | 后端端口 | 8787 |
| ENVIRONMENT | 环境标识 | production |

## 依赖关系

```
shipping-assistant (root)
├── concurrently (并行运行前后端)
├── wrangler (Cloudflare CLI)
└── └─
    ├── frontend/
    │   ├── vue
    │   ├── vue-router
    │   ├── element-plus
    │   ├── axios
    │   └── vite
    │
    └── server/
        ├── express
        └── cors
```

## 扩展开发

### 添加新字段类型

1. 在 `server/routes.js` 中添加类型验证
2. 在 `frontend/src/components/FieldManage.vue` 中添加 UI
3. 在 `frontend/src/components/ShippingManage.vue` 中添加表单控件

### 添加新 API 接口

1. 在 `server/routes.js` 中定义路由
2. 在 `server/worker.js` 中实现 Workers 版本（如需要）
3. 在 `frontend/src/api.js` 中添加方法

## 注意事项

- 本地开发使用内存模拟数据库，重启后数据清空
- 生产环境使用 Cloudflare D1 数据库，数据持久化
- 部署前确保 `wrangler.toml` 中的 `database_id` 已配置
- 前端构建后，`dist/` 目录会自动被 Pages 托管
