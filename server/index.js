// Express + Cloudflare Workers
const express = require('express')
const cors = require('cors')

// 初始化 Express 应用
const app = express()

// 中间件
app.use(cors())
app.use(express.json())

// 数据库接口
let db = null

// 如果在 Cloudflare Workers 环境中，使用绑定
if (typeof env !== 'undefined' && env.DB) {
  db = env.DB
} else if (globalThis.DB) {
  db = globalThis.DB
}

// 导入路由
const routes = require('./routes')
app.use('/api', routes)

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 404 处理
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// 错误处理
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

// 导出给 Cloudflare Workers
if (typeof module !== 'undefined' && module.exports) {
  module.exports = app
}

// 本地开发服务器
if (require.main === module) {
  const PORT = process.env.PORT || 8787
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
  })
}
