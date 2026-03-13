// 数据库服务模块

// 获取数据库实例
function getDB() {
  // 在 Cloudflare Workers 环境中，使用环境绑定
  if (typeof env !== 'undefined' && env.DB) {
    return env.DB
  }
  
  // 全局变量（用于本地测试）
  if (globalThis.DB) {
    return globalThis.DB
  }
  
  throw new Error('Database not initialized. Please check wrangler.toml configuration.')
}

// 初始化数据库表
async function initDatabase() {
  try {
    const db = getDB()
    
    // 创建自定义字段表
    await db.exec(`
      CREATE TABLE IF NOT EXISTS custom_fields (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        label TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'text',
        options TEXT,
        required INTEGER DEFAULT 0,
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    // 创建发货记录表
    await db.exec(`
      CREATE TABLE IF NOT EXISTS shipping_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id TEXT NOT NULL,
        data TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    // 创建索引
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_custom_fields_name ON custom_fields(name)
    `)
    
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_shipping_records_order_id ON shipping_records(order_id)
    `)
    
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_shipping_records_status ON shipping_records(status)
    `)
    
    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Database initialization error:', error)
    throw error
  }
}

module.exports = {
  getDB,
  initDatabase
}
