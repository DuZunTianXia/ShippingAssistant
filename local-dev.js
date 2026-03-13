// 本地开发服务器 - 使用 Express 进行本地开发
const express = require('express')
const cors = require('cors')

const app = express()

// 中间件
app.use(cors())
app.use(express.json())

// 模拟 D1 数据库
class MockD1Database {
  constructor() {
    this.products = []
    this.fields = []
    this.records = []
    this.productIdCounter = 1
    this.fieldIdCounter = 1
    this.recordIdCounter = 1
  }

  prepare(sql) {
    const self = this
    const boundParams = []

    const statement = {
      bind: (...params) => {
        boundParams.push(...params)
        return statement
      },
      run: async () => {
        return self._execute(sql, boundParams, 'run')
      },
      all: async () => {
        return self._execute(sql, boundParams, 'all')
      },
      first: async () => {
        return self._execute(sql, boundParams, 'first')
      }
    }

    return statement
  }

  exec(sql) {
    return this._execute(sql, [], 'exec')
  }

  _execute(sql, params, type) {
    // 简化的 SQL 解析和执行
    console.log('SQL:', sql)
    console.log('Params:', params)

    // 商品相关
    if (sql.includes('INSERT INTO products')) {
      const [name, description] = params
      const product = {
        id: this.productIdCounter++,
        name, description,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      this.products.push(product)
      return { meta: { last_row_id: product.id }, success: true }
    }

    if (sql.includes('SELECT * FROM products')) {
      return { results: this.products.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) }
    }

    if (sql.includes('UPDATE products')) {
      const [name, description, id] = params
      const numericId = parseInt(id)
      const index = this.products.findIndex(p => p.id === numericId)
      if (index !== -1) {
        this.products[index] = {
          ...this.products[index],
          name, description,
          updated_at: new Date().toISOString()
        }
      }
      return { success: true }
    }

    if (sql.includes('DELETE FROM products')) {
      const id = parseInt(params[0])
      // 删除商品及其关联的字段和记录
      this.products = this.products.filter(p => p.id !== id)
      this.fields = this.fields.filter(f => f.product_id !== id)
      this.records = this.records.filter(r => r.product_id !== id)
      return { success: true }
    }

    // 字段相关
    if (sql.includes('INSERT INTO custom_fields')) {
      const [product_id, name, label, type, options, required, sort_order] = params
      const field = {
        id: this.fieldIdCounter++,
        product_id, name, label, type, options, required, sort_order,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      this.fields.push(field)
      return { meta: { last_row_id: field.id }, success: true }
    }

    if (sql.includes('SELECT * FROM custom_fields')) {
      if (sql.includes('WHERE product_id = ?')) {
        const product_id = params[params.length - 1]
        return { results: this.fields.filter(f => f.product_id == product_id).sort((a, b) => a.sort_order - b.sort_order) }
      }
      return { results: this.fields.sort((a, b) => a.sort_order - b.sort_order) }
    }

    if (sql.includes('DELETE FROM custom_fields')) {
      const id = parseInt(params[0])
      this.fields = this.fields.filter(f => f.id !== id)
      return { success: true }
    }

    if (sql.includes('UPDATE custom_fields')) {
      const [name, label, type, options, required, sort_order, id] = params
      const numericId = parseInt(id)
      const index = this.fields.findIndex(f => f.id === numericId)
      if (index !== -1) {
        this.fields[index] = {
          ...this.fields[index],
          name, label, type, options, required, sort_order,
          updated_at: new Date().toISOString()
        }
      }
      return { success: true }
    }

    // 记录相关
    if (sql.includes('INSERT INTO shipping_records')) {
      const [product_id, order_id, data, status] = params
      const record = {
        id: this.recordIdCounter++,
        product_id, order_id, data, status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      this.records.push(record)
      return { meta: { last_row_id: record.id }, success: true }
    }

    if (sql.includes('SELECT * FROM shipping_records')) {
      if (sql.includes('WHERE product_id = ?')) {
        const product_id = params[params.length - 1]
        return { results: this.records.filter(r => r.product_id == product_id).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) }
      }
      if (sql.includes('WHERE order_id = ?')) {
        const order_id = params[params.length - 1]
        return { results: this.records.filter(r => r.order_id === order_id) }
      }
      return { results: this.records.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) }
    }

    if (sql.includes('UPDATE shipping_records')) {
      const [order_id, data, status, id] = params
      const numericId = parseInt(id)
      const index = this.records.findIndex(r => r.id === numericId)
      if (index !== -1) {
        this.records[index] = {
          ...this.records[index],
          order_id, data, status,
          updated_at: new Date().toISOString()
        }
      }
      return { success: true }
    }

    if (sql.includes('DELETE FROM shipping_records')) {
      const id = parseInt(params[0])
      this.records = this.records.filter(r => r.id !== id)
      return { success: true }
    }

    return { success: true }
  }
}

// 创建模拟数据库
const mockDB = new MockD1Database()
globalThis.DB = mockDB

// 导入路由
const routes = require('./server/routes')
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

// 启动服务器
const PORT = process.env.PORT || 8787
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║   闲鱼发货助手 - 本地开发服务器                   ║
║                                                   ║
║   前端地址: http://localhost:3000                 ║
║   后端地址: http://localhost:8787                 ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
  `)
})
