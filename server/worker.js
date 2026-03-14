// Cloudflare Workers 入口文件 - 统一部署版本
// 处理 API 请求和静态文件服务

// API 路由处理
export async function handleRequest(request, env, ctx) {
  const url = new URL(request.url)
  const path = url.pathname

  // CORS 处理
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    })
  }

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  }

  try {
    // API 接口
    if (path.startsWith('/api')) {
      return handleAPIRequest(request, env, url, corsHeaders)
    }

    // 静态文件服务
    return handleStaticAsset(request, env, path, corsHeaders)

  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// 处理 API 请求
async function handleAPIRequest(request, env, url, corsHeaders) {
  const path = url.pathname

  // 商品相关
  if (path === '/api/products' && request.method === 'GET') {
    return handleGetProducts(env, corsHeaders)
  }
  if (path === '/api/products' && request.method === 'POST') {
    return handleCreateProduct(request, env, corsHeaders)
  }
  if (path.match(/^\/api\/products\/\d+$/) && request.method === 'PUT') {
    const id = path.split('/').pop()
    return handleUpdateProduct(id, request, env, corsHeaders)
  }
  if (path.match(/^\/api\/products\/\d+$/) && request.method === 'DELETE') {
    const id = path.split('/').pop()
    return handleDeleteProduct(id, env, corsHeaders)
  }

  // 商品查重配置相关
  if (path.match(/^\/api\/products\/\d+\/duplicate-config$/) && request.method === 'GET') {
    const productId = path.split('/')[3]
    return handleGetProductDuplicateConfig(productId, env, corsHeaders)
  }
  if (path.match(/^\/api\/products\/\d+\/duplicate-config$/) && request.method === 'PUT') {
    const productId = path.split('/')[3]
    return handleUpdateProductDuplicateConfig(productId, request, env, corsHeaders)
  }

  // 字段相关
  if (path.match(/^\/api\/products\/\d+\/fields$/) && request.method === 'GET') {
    const productId = path.split('/')[3]
    return handleGetFields(productId, env, corsHeaders)
  }
  if (path.match(/^\/api\/products\/\d+\/fields$/) && request.method === 'POST') {
    const productId = path.split('/')[3]
    return handleCreateField(productId, request, env, corsHeaders)
  }
  if (path.match(/^\/api\/fields\/\d+$/) && request.method === 'DELETE') {
    const id = path.split('/').pop()
    return handleDeleteField(id, env, corsHeaders)
  }
  if (path.match(/^\/api\/fields\/\d+$/) && request.method === 'PUT') {
    const id = path.split('/').pop()
    return handleUpdateField(id, request, env, corsHeaders)
  }

  // 记录相关
  if (path.match(/^\/api\/products\/\d+\/records$/) && request.method === 'GET') {
    const productId = path.split('/')[3]
    return handleGetRecords(productId, env, corsHeaders)
  }
  if (path.match(/^\/api\/products\/\d+\/records\/check-duplicate$/) && request.method === 'POST') {
    const productId = path.split('/')[3]
    return handleCheckDuplicate(productId, request, env, corsHeaders)
  }
  if (path.match(/^\/api\/products\/\d+\/records\/stats$/) && request.method === 'GET') {
    const productId = path.split('/')[3]
    return handleGetRecordStats(productId, env, corsHeaders)
  }
  if (path.match(/^\/api\/products\/\d+\/records$/) && request.method === 'POST') {
    const productId = path.split('/')[3]
    return handleCreateRecord(productId, request, env, corsHeaders)
  }
  if (path.match(/^\/api\/records\/\d+$/) && request.method === 'PUT') {
    const id = path.split('/').pop()
    return handleUpdateRecord(id, request, env, corsHeaders)
  }
  if (path.match(/^\/api\/records\/\d+$/) && request.method === 'DELETE') {
    const id = path.split('/').pop()
    return handleDeleteRecord(id, env, corsHeaders)
  }
  if (path.match(/^\/api\/records\/order\/[^/]+$/) && request.method === 'GET') {
    const orderId = path.split('/').pop()
    return handleGetRecordByOrderId(orderId, env, corsHeaders)
  }

  // 健康检查
  if (path === '/api/health') {
    return new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // 404
  return new Response(JSON.stringify({ error: 'API endpoint not found' }), {
    status: 404,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

// 处理静态文件
async function handleStaticAsset(request, env, path, corsHeaders) {
  let assetPath = path === '/' ? '/index.html' : path

  try {
    const object = await env.ASSETS.get(assetPath.slice(1))

    if (object === null) {
      const indexFile = await env.ASSETS.get('index.html')
      if (indexFile) {
        return new Response(indexFile, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/html; charset=utf-8'
          }
        })
      }
      return new Response('Not Found', { status: 404, headers: corsHeaders })
    }

    const headers = new Headers(corsHeaders)
    headers.set('Content-Type', getContentType(assetPath))
    headers.set('Cache-Control', 'public, max-age=86400')

    return new Response(object, { headers })

  } catch (error) {
    console.error('Static asset error:', error)
    return new Response('Not Found', { status: 404, headers: corsHeaders })
  }
}

function getContentType(path) {
  const ext = path.split('.').pop().toLowerCase()
  const types = {
    'html': 'text/html; charset=utf-8',
    'css': 'text/css; charset=utf-8',
    'js': 'application/javascript; charset=utf-8',
    'json': 'application/json; charset=utf-8',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon',
    'woff': 'font/woff',
    'woff2': 'font/woff2',
    'ttf': 'font/ttf',
    'eot': 'application/vnd.ms-fontobject'
  }
  return types[ext] || 'application/octet-stream'
}

// ==================== 商品管理 ====================
async function handleGetProducts(env, headers) {
  const result = await env.DB.prepare('SELECT * FROM products ORDER BY created_at DESC').all()
  return new Response(JSON.stringify(result.results || result), {
    headers: { ...headers, 'Content-Type': 'application/json' }
  })
}

// 获取商品查重配置（从 localStorage 存储的 KV 中读取）
async function handleGetProductDuplicateConfig(productId, env, headers) {
  try {
    // 从 KV 存储读取配置（使用 D1 数据库的 settings 字段或单独存储）
    // 这里使用一个简单方案：存储在 D1 的 product_settings 表中
    const result = await env.DB.prepare(
      'SELECT key, value FROM product_settings WHERE product_id = ? AND key = ?'
    ).bind(productId, 'duplicate_check_fields').first()
    
    let checkFields = []
    if (result && result.value) {
      try {
        checkFields = JSON.parse(result.value)
      } catch (e) {
        checkFields = []
      }
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      checkFields: checkFields 
    }), {
      headers: { ...headers, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Get duplicate config error:', error)
    // 如果表不存在，返回空配置
    return new Response(JSON.stringify({ 
      success: true, 
      checkFields: [] 
    }), {
      headers: { ...headers, 'Content-Type': 'application/json' }
    })
  }
}

// 更新商品查重配置
async function handleUpdateProductDuplicateConfig(productId, request, env, headers) {
  try {
    const body = await request.json()
    const { checkFields } = body
    
    if (!Array.isArray(checkFields)) {
      return new Response(JSON.stringify({ error: 'checkFields must be an array' }), {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' }
      })
    }
    
    // 先尝试创建表（如果不存在）
    try {
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS product_settings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          product_id INTEGER NOT NULL,
          key TEXT NOT NULL,
          value TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(product_id, key)
        )
      `).run()
    } catch (e) {
      // 表可能已存在，忽略错误
    }
    
    // 先删除旧配置
    await env.DB.prepare(
      'DELETE FROM product_settings WHERE product_id = ? AND key = ?'
    ).bind(productId, 'duplicate_check_fields').run()
    
    // 插入新配置
    await env.DB.prepare(
      'INSERT INTO product_settings (product_id, key, value) VALUES (?, ?, ?)'
    ).bind(productId, 'duplicate_check_fields', JSON.stringify(checkFields)).run()
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...headers, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Update duplicate config error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...headers, 'Content-Type': 'application/json' }
    })
  }
}

async function handleCreateProduct(request, env, headers) {
  const body = await request.json()
  const { name, description } = body
  const result = await env.DB.prepare(
    'INSERT INTO products (name, description) VALUES (?, ?)'
  ).bind(name, description).run()
  return new Response(JSON.stringify({ success: true, id: result.meta.last_row_id }), {
    headers: { ...headers, 'Content-Type': 'application/json' }
  })
}

async function handleUpdateProduct(id, request, env, headers) {
  const body = await request.json()
  const { name, description } = body
  await env.DB.prepare(
    'UPDATE products SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).bind(name, description, id).run()
  return new Response(JSON.stringify({ success: true }), {
    headers: { ...headers, 'Content-Type': 'application/json' }
  })
}

async function handleDeleteProduct(id, env, headers) {
  await env.DB.prepare('DELETE FROM products WHERE id = ?').bind(id).run()
  return new Response(JSON.stringify({ success: true }), {
    headers: { ...headers, 'Content-Type': 'application/json' }
  })
}

// ==================== 字段管理 ====================
async function handleGetFields(productId, env, headers) {
  const result = await env.DB.prepare(
    'SELECT * FROM custom_fields WHERE product_id = ? ORDER BY sort_order ASC'
  ).bind(productId).all()
  return new Response(JSON.stringify(result.results || result), {
    headers: { ...headers, 'Content-Type': 'application/json' }
  })
}

async function handleCreateField(productId, request, env, headers) {
  const body = await request.json()
  const { name, label, type, options, required, sort_order } = body
  const result = await env.DB.prepare(
    'INSERT INTO custom_fields (product_id, name, label, type, options, required, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(productId, name, label, type, options, required ? 1 : 0, sort_order).run()
  return new Response(JSON.stringify({ success: true, id: result.meta.last_row_id }), {
    headers: { ...headers, 'Content-Type': 'application/json' }
  })
}

async function handleDeleteField(id, env, headers) {
  await env.DB.prepare('DELETE FROM custom_fields WHERE id = ?').bind(id).run()
  return new Response(JSON.stringify({ success: true }), {
    headers: { ...headers, 'Content-Type': 'application/json' }
  })
}

async function handleUpdateField(id, request, env, headers) {
  const body = await request.json()
  const { name, label, type, options, required, sort_order } = body
  await env.DB.prepare(
    'UPDATE custom_fields SET name = ?, label = ?, type = ?, options = ?, required = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).bind(name, label, type, options, required ?1 : 0, sort_order, id).run()
  return new Response(JSON.stringify({ success: true }), {
    headers: { ...headers, 'Content-Type': 'application/json' }
  })
}

// ==================== 记录管理 ====================
async function handleGetRecords(productId, env, headers) {
  const result = await env.DB.prepare(
    'SELECT * FROM shipping_records WHERE product_id = ? ORDER BY created_at DESC'
  ).bind(productId).all()
  const records = (result.results || result).map(record => ({
    ...record,
    data: record.data ? JSON.parse(record.data) : {}
  }))
  return new Response(JSON.stringify(records), {
    headers: { ...headers, 'Content-Type': 'application/json' }
  })
}

// 获取记录统计信息
async function handleGetRecordStats(productId, env, headers) {
  try {
    if (!env.DB) {
      throw new Error('Database not bound')
    }
    
    // 获取总数
    const totalResult = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM shipping_records WHERE product_id = ?'
    ).bind(productId).first()
    
    // 获取已发货数量（status = active 或 shipped）
    const shippedResult = await env.DB.prepare(
      "SELECT COUNT(*) as count FROM shipping_records WHERE product_id = ? AND status IN ('active', 'shipped', 'completed')"
    ).bind(productId).first()
    
    // 获取未发货数量（status = pending 或其他）
    const pendingResult = await env.DB.prepare(
      "SELECT COUNT(*) as count FROM shipping_records WHERE product_id = ? AND status NOT IN ('active', 'shipped', 'completed')"
    ).bind(productId).first()
    
    const stats = {
      total: totalResult?.count || 0,
      shipped: shippedResult?.count || 0,
      pending: pendingResult?.count || 0
    }
    
    return new Response(JSON.stringify({ success: true, stats }), {
      headers: { ...headers, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Get record stats error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...headers, 'Content-Type': 'application/json' }
    })
  }
}

async function handleCreateRecord(productId, request, env, headers) {
  try {
    // 检查 DB 绑定
    if (!env.DB) {
      throw new Error('Database not bound')
    }
    
    const body = await request.json()
    console.log('Create record body:', body)
    
    // 验证必要字段
    if (!body.data) {
      throw new Error('Missing data field')
    }
    
    // 适配前端发送的数据格式
    const data = body.data
    const status = body.status || 'pending'
    // 自动生成 order_id（使用时间戳+随机数）
    const order_id = body.order_id || `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`
    
    // 查重处理：检查 data 中的字段是否已存在
    const duplicateCheck = await checkDuplicateFields(productId, data, env)
    if (duplicateCheck.hasDuplicate) {
      return new Response(JSON.stringify({ 
        error: 'Duplicate record found',
        duplicateFields: duplicateCheck.duplicateFields,
        existingRecord: duplicateCheck.existingRecord
      }), {
        status: 409,
        headers: { ...headers, 'Content-Type': 'application/json' }
      })
    }
    
    const result = await env.DB.prepare(
      'INSERT INTO shipping_records (product_id, order_id, data, status) VALUES (?, ?, ?, ?)'
    ).bind(productId, order_id, JSON.stringify(data), status).run()
    
    return new Response(JSON.stringify({ success: true, id: result.meta.last_row_id }), {
      headers: { ...headers, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Create record error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...headers, 'Content-Type': 'application/json' }
    })
  }
}

// 检查重复字段
async function checkDuplicateFields(productId, data, env) {
  const result = await env.DB.prepare(
    'SELECT * FROM shipping_records WHERE product_id = ?'
  ).bind(productId).all()
  
  // 获取查重配置
  const configResult = await env.DB.prepare(
    'SELECT value FROM product_settings WHERE product_id = ? AND key = ?'
  ).bind(productId, 'duplicate_check_fields').first()
  
  let checkFields = []
  if (configResult && configResult.value) {
    try {
      checkFields = JSON.parse(configResult.value)
    } catch (e) {
      checkFields = []
    }
  }
  
  // 如果没有配置，检查所有字段
  if (checkFields.length === 0) {
    checkFields = Object.keys(data)
  }
  
  const records = (result.results || result).map(record => ({
    ...record,
    data: record.data ? JSON.parse(record.data) : {}
  }))
  
  for (const record of records) {
    const duplicateFields = []
    // 只检查配置的字段
    for (const key of checkFields) {
      const value = data[key]
      if (record.data[key] === value && value !== null && value !== undefined && value !== '') {
        duplicateFields.push(key)
      }
    }
    if (duplicateFields.length > 0) {
      return {
        hasDuplicate: true,
        duplicateFields,
        existingRecord: record
      }
    }
  }
  
  return { hasDuplicate: false }
}

// 批量检查重复接口
async function handleCheckDuplicate(productId, request, env, headers) {
  try {
    if (!env.DB) {
      throw new Error('Database not bound')
    }
    
    const body = await request.json()
    const { records, fields } = body
    
    if (!records || !Array.isArray(records) || records.length === 0) {
      return new Response(JSON.stringify({ error: 'Missing records array' }), {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' }
      })
    }
    
    // 获取该商品的所有记录
    const result = await env.DB.prepare(
      'SELECT * FROM shipping_records WHERE product_id = ?'
    ).bind(productId).all()
    
    const existingRecords = (result.results || result).map(record => ({
      ...record,
      data: record.data ? JSON.parse(record.data) : {}
    }))
    
    // 检查每条记录是否重复
    const checkResults = records.map((record, index) => {
      for (const existing of existingRecords) {
        const duplicateFields = []
        // 如果指定了 fields，只检查这些字段；否则检查所有字段
        const checkFields = fields || Object.keys(record.data || record)
        
        for (const field of checkFields) {
          const recordValue = record.data ? record.data[field] : record[field]
          const existingValue = existing.data[field]
          
          if (recordValue === existingValue && 
              recordValue !== null && 
              recordValue !== undefined && 
              recordValue !== '') {
            duplicateFields.push(field)
          }
        }
        
        if (duplicateFields.length > 0) {
          return {
            index,
            isDuplicate: true,
            duplicateFields,
            existingRecordId: existing.id
          }
        }
      }
      return { index, isDuplicate: false }
    })
    
    const duplicates = checkResults.filter(r => r.isDuplicate)
    
    return new Response(JSON.stringify({
      success: true,
      total: records.length,
      duplicates: duplicates,
      duplicateCount: duplicates.length,
      isDuplicate: duplicates.length > 0
    }), {
      headers: { ...headers, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Check duplicate error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...headers, 'Content-Type': 'application/json' }
    })
  }
}

async function handleUpdateRecord(id, request, env, headers) {
  const body = await request.json()
  const { order_id, status, data } = body
  await env.DB.prepare(
    'UPDATE shipping_records SET order_id = ?, data = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).bind(order_id, JSON.stringify(data), status, id).run()
  return new Response(JSON.stringify({ success: true }), {
    headers: { ...headers, 'Content-Type': 'application/json' }
  })
}

async function handleDeleteRecord(id, env, headers) {
  await env.DB.prepare('DELETE FROM shipping_records WHERE id = ?').bind(id).run()
  return new Response(JSON.stringify({ success: true }), {
    headers: { ...headers, 'Content-Type': 'application/json' }
  })
}

async function handleGetRecordByOrderId(orderId, env, headers) {
  const result = await env.DB.prepare('SELECT * FROM shipping_records WHERE order_id = ?').bind(orderId).all()
  const records = (result.results || result).map(record => ({
    ...record,
    data: record.data ? JSON.parse(record.data) : {}
  }))
  return new Response(JSON.stringify(records), {
    headers: { ...headers, 'Content-Type': 'application/json' }
  })
}

export default {
  fetch: handleRequest
}
