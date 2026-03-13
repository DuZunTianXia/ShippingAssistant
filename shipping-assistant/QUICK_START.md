# 闲鱼发货助手 - 快速开始

## 📋 前置要求

- Node.js 18+
- npm 或 yarn
- Cloudflare 账户（用于部署）

## 🚀 5分钟快速开始

### 1. 安装依赖（自动）

```bash
# 使用安装脚本（推荐）
bash install.sh
```

或手动安装：

```bash
npm install
cd frontend && npm install && cd ..
cd server && npm install && cd ..
```

### 2. 本地开发

```bash
npm run dev
```

访问：
- 前端：http://localhost:3000
- 后端：http://localhost:8787

### 3. 使用应用

1. 打开浏览器访问 http://localhost:3000
2. 点击"字段管理"，添加自定义字段
3. 点击"发货管理"，管理发货记录

## 📦 部署到 Cloudflare

### 1. 安装 Wrangler

```bash
npm install -g wrangler
```

### 2. 登录 Cloudflare

```bash
wrangler login
```

### 3. 创建数据库

```bash
wrangler d1 create shipping-db
```

复制返回的 `database_id`

### 4. 更新配置

编辑 `wrangler.toml`，将 `database_id` 替换为你的数据库 ID

### 5. 执行数据库迁移

```bash
npm run db:migrate:prod
```

### 6. 部署

```bash
npm run deploy
```

## 📚 功能说明

### 字段管理

支持的字段类型：
- **文本**：单行文本输入
- **数字**：数字输入
- **日期**：日期选择
- **选择框**：下拉选择（可配置多个选项）
- **多行文本**：多行文本输入

每个字段可设置：
- 字段名称（英文，作为数据键）
- 显示标签（中文，界面显示）
- 是否必填
- 排序顺序

### 发货管理

- 创建发货记录
- 编辑发货记录
- 删除发货记录
- 订单状态管理（待发货/已发货/已完成）

## 🔧 API 接口

所有接口都返回 JSON 格式数据。

### 字段相关

- `GET /api/fields` - 获取所有字段
- `POST /api/fields` - 创建字段
- `DELETE /api/fields/:id` - 删除字段

### 记录相关

- `GET /api/records` - 获取所有记录
- `POST /api/records` - 创建记录
- `PUT /api/records/:id` - 更新记录
- `DELETE /api/records/:id` - 删除记录
- `GET /api/records/order/:order_id` - 根据订单号查询

## 🐛 常见问题

### Q: 本地开发数据不保存？
A: 本地开发使用模拟数据库，数据存储在内存中，重启后清空。使用 Cloudflare 部署可获得持久化存储。

### Q: 如何自定义更多字段？
A: 在"字段管理"页面点击"保存字段"，可以无限添加自定义字段。

### Q: 部署后无法访问？
A: 检查 Cloudflare Pages 项目配置，确保域名已正确绑定。

## 📞 获取帮助

- 查看完整文档：`README.md`
- 部署指南：`GETTING_STARTED.md`
- 问题反馈：GitHub Issues

## 📄 许可证

MIT
