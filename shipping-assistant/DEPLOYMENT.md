# 部署指南 - Cloudflare Worker 统一部署

本项目使用单个 Cloudflare Worker 部署，同时提供前端和后端服务。

## 📦 部署架构

```
┌─────────────────────────────────────┐
│     Cloudflare Worker                │
│  ┌──────────────────────────────┐   │
│  │  前端静态文件 (Vue3 构建)    │   │
│  └──────────────────────────────┘   │
│  ┌──────────────────────────────┐   │
│  │  后端 API (Express 路由)      │   │
│  └──────────────────────────────┘   │
│  ┌──────────────────────────────┐   │
│  │  Cloudflare D1 数据库        │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

## 🚀 快速部署

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

#### 创建 D1 数据库（可选，也可以直接部署后绑定）

```bash
# 创建数据库（如果不提前创建，也可以在 Dashboard 中创建）
npm run db:create

# 或手动创建
wrangler d1 create shipping-db
```

### 3. 部署到 Cloudflare Worker

```bash
npm run deploy
```

### 4. 绑定 D1 数据库（可视化配置）

部署后，在 Cloudflare Dashboard 中绑定数据库：

1. 进入 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 点击左侧菜单 **Workers & Pages**
3. 选择 `shipping-assistant` Worker
4. 点击 **Settings** 标签
5. 找到 **Variables** 部分
6. 点击 **D1 Database Bindings**
7. 点击 **Edit Bindings**
8. 点击 **Add Binding**
   - **Variable name**: `DB`
   - **D1 database**: 选择或创建 `shipping-db`
9. 点击 **Save**

### 5. 执行数据库迁移

绑定数据库后，执行迁移创建表结构：

```bash
# 生产环境迁移
npm run db:migrate:prod

# 如果迁移失败，可以手动在 Dashboard 中执行：
# Workers & Pages > D1 > shipping-db > Console
```

### 5. 构建前端

```bash
npm run build
```

这将在 `frontend/dist/` 目录生成静态文件。

### 6. 访问应用

部署并绑定数据库后，访问 Worker URL：
```
https://shipping-assistant.你的账户.workers.dev
```

### 可视化绑定优势

- **无需修改代码**: 不需要在 `wrangler.toml` 中硬编码数据库 ID
- **灵活切换**: 可以在 Dashboard 中随时更换绑定的数据库
- **团队协作**: 每个开发者可以在自己的账户中绑定不同的数据库
- **生产安全**: 避免将敏感配置提交到代码仓库

### 7. 访问应用

部署完成后，Wrangler 会返回 Worker URL：
```
https://shipping-assistant.你的账户.workers.dev
```

访问这个地址即可使用完整应用。

## 🔧 本地开发

### 启动本地开发服务器

```bash
npm run dev
```

这将同时启动：
- 前端开发服务器：http://localhost:3000
- 后端开发服务器：http://localhost:8787

### 本地数据库操作

```bash
# 查看本地数据库数据
wrangler d1 execute shipping-db --local --command="SELECT * FROM custom_fields"

# 查看本地数据库中的记录
wrangler d1 execute shipping-db --local --command="SELECT * FROM shipping_records"
```

## 📝 部署脚本说明

### package.json 脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动本地开发环境 |
| `npm run build` | 构建前端静态文件 |
| `npm run deploy` | 构建并部署到 Cloudflare Worker |
| `npm run db:migrate` | 本地数据库迁移 |
| `npm run db:migrate:prod` | 生产数据库迁移（需在 Dashboard 绑定后执行） |
| `npm run db:create` | 创建 D1 数据库（可选，也可在 Dashboard 创建） |

## 🎯 部署流程详解

### 1. 构建阶段

```bash
npm run build
```

执行以下操作：
1. 进入 `frontend` 目录
2. 运行 Vite 构建命令
3. 在 `frontend/dist/` 生成静态文件

### 2. 部署阶段

```bash
wrangler deploy
```

执行以下操作：
1. 读取 `wrangler.toml` 配置
2. 构建前端（如果配置了构建命令）
3. 打包 Worker 代码 (`server/worker.js`)
4. 上传静态文件到 Assets
5. 上传 Worker 代码到 Cloudflare
6. 绑定 D1 数据库

### 3. 运行阶段

部署后的 Worker 会：
1. 接收所有 HTTP 请求
2. 判断是 API 请求还是静态文件请求
3. API 请求 → 路由到对应的处理函数
4. 静态文件 → 从 Assets 中读取并返回
5. D1 数据库 → 通过绑定的 `env.DB` 访问

## 🌐 自定义域名

### 1. 添加自定义域名

在 Cloudflare Dashboard 中：

1. 进入 Workers & Pages
2. 选择 `shipping-assistant` Worker
3. 点击 Settings → Triggers → Custom Domains
4. 添加你的域名

### 2. 配置 DNS

确保你的域名 DNS 指向 Cloudflare：
```
Type: CNAME
Name: your-domain
Target: your-worker.workers.dev
```

## 🔄 更新部署

当你修改代码后，只需重新部署：

```bash
npm run deploy
```

这会：
1. 重新构建前端
2. 更新 Worker 代码
3. 上传新的静态文件
4. 更新 API 接口（如有更改）

## 📊 监控和日志

### 查看实时日志

```bash
wrangler tail
```

### 查看部署历史

在 Cloudflare Dashboard：
Workers & Pages → shipping-assistant → Deployments

## 🐛 常见问题

### Q: 部署后页面空白？
A: 检查以下几点：
1. 前端是否成功构建 (`npm run build`)
2. `frontend/dist/` 目录是否存在且包含文件
3. Worker 是否成功部署（检查 `wrangler deploy` 输出）

### Q: API 请求失败？
A: 检查：
1. D1 数据库是否已创建并配置
2. 数据库迁移是否执行
3. Worker 日志中是否有错误 (`wrangler tail`)

### Q: CORS 错误？
A: 本项目已在 Worker 中配置 CORS，确保：
1. 请求使用正确的 Content-Type
2. API 路径正确（以 `/api` 开头）

### Q: 如何回滚部署？
A: 在 Cloudflare Dashboard 中：
Workers & Pages → shipping-assistant → Deployments
选择之前的部署版本点击 "Rollback"

## 💡 性能优化建议

1. **启用缓存**：Worker 已配置静态文件缓存
2. **CDN**：Cloudflare 自动提供全球 CDN 加速
3. **数据库索引**：确保已创建必要的索引（参考 schema.sql）
4. **压缩**：前端构建时已自动压缩资源

## 🔐 安全建议

1. **环境变量**：敏感信息使用 Cloudflare Workers Secrets
2. **API 限流**：考虑添加速率限制
3. **输入验证**：所有用户输入已在后端验证
4. **HTTPS**：Cloudflare 自动提供 HTTPS

## 📚 相关资源

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 文档](https://developers.cloudflare.com/d1/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)

## 🆘 获取帮助

遇到问题？查看：
1. `README.md` - 项目总体说明
2. `QUICK_START.md` - 快速开始
3. `PROJECT_STRUCTURE.md` - 项目结构

或在 GitHub 提交 Issue。
