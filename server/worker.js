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
    // API 接口 - 优先处理API路径
    if (path.startsWith('/api')) {
      return handleAPIRequest(request, env, url, corsHeaders)
    }

    // 静态文件服务 - 处理所有非API路径
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
    return handleGetProducts(env, corsHeaders, url)
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
    return handleGetFields(productId, env, corsHeaders, url)
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
    return handleGetRecords(productId, env, corsHeaders, url)
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

  // 批量获取记录（根据ID列表，用于跨页选择后的批量操作）
  if (path.match(/^\/api\/products\/\d+\/records\/batch$/) && request.method === 'POST') {
    const productId = path.split('/')[3]
    return handleBatchGetRecords(productId, request, env, corsHeaders)
  }

  // 健康检查
  if (path === '/api/health') {
    return new Response(JSON.stringify({ 
      status: 'ok', 
      version: '2026-03-14-v2', // 字段映射优化版本
      timestamp: new Date().toISOString() 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // 字段迁移（修复name/label颠倒的问题）
  if (path === '/api/migrate-fields' && request.method === 'POST') {
    return handleMigrateFields(env, corsHeaders)
  }

  // 404
  return new Response(JSON.stringify({ error: 'API endpoint not found' }), {
    status: 404,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

// 解析查询参数
function parseQueryParams(url) {
  const params = {}
  const searchParams = url.searchParams
  if (searchParams.has('page')) params.page = parseInt(searchParams.get('page'), 10) || 1
  if (searchParams.has('pageSize')) params.pageSize = parseInt(searchParams.get('pageSize'), 10) || 20
  if (searchParams.has('search')) params.search = searchParams.get('search') || ''
  if (searchParams.has('status')) params.status = searchParams.get('status') || ''
  return params
}

// 处理静态文件
async function handleStaticAsset(request, env, path, corsHeaders) {
  console.log('Handling static asset:', path)
  console.log('ASSETS binding available:', !!env.ASSETS)
  
  // 对于根路径，直接返回 index.html
  if (path === '/') {
    try {
      if (!env.ASSETS) {
        console.error('ASSETS binding not available')
        return new Response('ASSETS binding not configured', { 
          status: 500, 
          headers: corsHeaders 
        })
      }
      
      const indexFile = await env.ASSETS.get('index.html')
      console.log('Index file found:', !!indexFile)
      
      if (indexFile) {
        return new Response(indexFile, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/html; charset=utf-8'
          }
        })
      }
    } catch (error) {
      console.error('Error loading index.html:', error)
    }
  }

  // 检查是否是静态资源文件（有文件扩展名）
  const hasExtension = path.includes('.') && !path.endsWith('/')
  
  if (hasExtension) {
    // 尝试获取静态资源文件
    try {
      if (!env.ASSETS) {
        return new Response('ASSETS binding not configured', { 
          status: 500, 
          headers: corsHeaders 
        })
      }
      
      const assetPath = path.startsWith('/') ? path.slice(1) : path
      console.log('Looking for asset:', assetPath)
      
      const object = await env.ASSETS.get(assetPath)
      console.log('Asset found:', !!object)

      if (object !== null) {
        const headers = new Headers(corsHeaders)
        headers.set('Content-Type', getContentType(path))
        headers.set('Cache-Control', 'public, max-age=86400')
        return new Response(object, { headers })
      }
    } catch (error) {
      console.error('Static asset error:', error)
    }
    
    // 静态资源不存在，返回404
    return new Response('Static asset not found', { status: 404, headers: corsHeaders })
  }

  // 对于所有其他路径（SPA路由），返回 index.html
  try {
    if (!env.ASSETS) {
      console.error('ASSETS binding not available for SPA route')
      return new Response('ASSETS binding not configured', { 
        status: 500, 
        headers: corsHeaders 
      })
    }
    
    const indexFile = await env.ASSETS.get('index.html')
    console.log('Index file for SPA route found:', !!indexFile)
    
    if (indexFile) {
      return new Response(indexFile, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/html; charset=utf-8'
        }
      })
    }
  } catch (error) {
    console.error('Error loading index.html for SPA route:', error)
  }

  // 如果所有尝试都失败，返回简单的HTML页面
  const fallbackHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Shipping Assistant</title>
    <meta charset="utf-8">
</head>
<body>
    <div id="app">
        <h1>Static Assets Not Available</h1>
        <p>The static assets are not properly configured or uploaded.</p>
        <p>Please check the deployment configuration.</p>
        <p>Path requested: ${path}</p>
        <p>ASSETS binding: ${env.ASSETS ? 'Available' : 'Not Available'}</p>
    </div>
</body>
</html>`

  return new Response(fallbackHtml, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/html; charset=utf-8'
    }
  })
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
async function handleGetProducts(env, headers, url) {
  const { page = 1, pageSize = 20, search = '' } = parseQueryParams(url)
  const offset = (page - 1) * pageSize

  let query = 'SELECT * FROM products'
  let countQuery = 'SELECT COUNT(*) as total FROM products'
  const params = []
  const countParams = []

  // 添加模糊搜索
  if (search) {
    const searchCondition = " WHERE (name LIKE ? OR description LIKE ?)"
    query += searchCondition
    countQuery += searchCondition
    const searchPattern = `%${search}%`
    params.push(searchPattern, searchPattern)
    countParams.push(searchPattern, searchPattern)
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
  params.push(pageSize, offset)

  // 获取总数
  const countResult = await env.DB.prepare(countQuery).bind(...countParams).first()
  const total = countResult?.total || 0

  // 获取分页数据
  const result = await env.DB.prepare(query).bind(...params).all()
  const items = result.results || result

  return new Response(JSON.stringify({
    items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  }), {
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
async function handleGetFields(productId, env, headers, url) {
  const { page = 1, pageSize = 50, search = '' } = parseQueryParams(url)
  const offset = (page - 1) * pageSize

  let query = 'SELECT * FROM custom_fields WHERE product_id = ?'
  let countQuery = 'SELECT COUNT(*) as total FROM custom_fields WHERE product_id = ?'
  const params = [productId]
  const countParams = [productId]

  // 添加模糊搜索（搜索 name 或 label）
  if (search) {
    query += " AND (name LIKE ? OR label LIKE ?)"
    countQuery += " AND (name LIKE ? OR label LIKE ?)"
    const searchPattern = `%${search}%`
    params.push(searchPattern, searchPattern)
    countParams.push(searchPattern, searchPattern)
  }

  // 获取总数
  const countResult = await env.DB.prepare(countQuery).bind(...countParams).first()
  const total = countResult?.total || 0

  // 获取分页数据
  query += ' ORDER BY sort_order ASC LIMIT ? OFFSET ?'
  params.push(pageSize, offset)

  const result = await env.DB.prepare(query).bind(...params).all()
  const items = result.results || result

  return new Response(JSON.stringify({
    items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  }), {
    headers: { ...headers, 'Content-Type': 'application/json' }
  })
}

async function handleCreateField(productId, request, env, headers) {
  const body = await request.json()
  let { name, label, type, options, required, sort_order } = body
  
  // 确保name是英文标识符格式（小写、下划线、无空格）
  if (name) {
    name = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
  }
  // 如果没有提供name，从label生成（转拼音或用默认值）
  if (!name && label) {
    // 简单映射：常见中文字段名转英文
    const labelToName = {
      '邮箱': 'email',
      '密码': 'password',
      '地址': 'address',
      '姓名': 'name',
      '电话': 'phone',
      '手机': 'mobile',
      '备注': 'remark',
      'api密钥': 'apikey',
      'apikey': 'apikey'
    }
    name = labelToName[label] || label.toLowerCase().replace(/\s+/g, '_')
  }
  
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
  let { name, label, type, options, required, sort_order } = body
  
  // 确保name是英文标识符格式
  if (name) {
    name = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
  }
  
  await env.DB.prepare(
    'UPDATE custom_fields SET name = ?, label = ?, type = ?, options = ?, required = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).bind(name, label, type, options, required ?1 : 0, sort_order, id).run()
  return new Response(JSON.stringify({ success: true }), {
    headers: { ...headers, 'Content-Type': 'application/json' }
  })
}

// ==================== 记录管理 ====================
async function handleGetRecords(productId, env, headers, url) {
  const { page = 1, pageSize = 20, search = '', status = '' } = parseQueryParams(url)
  const offset = (page - 1) * pageSize

  let query = 'SELECT * FROM shipping_records WHERE product_id = ?'
  let countQuery = 'SELECT COUNT(*) as total FROM shipping_records WHERE product_id = ?'
  const params = [productId]
  const countParams = [productId]

  // 添加状态筛选
  if (status) {
    query += " AND status = ?"
    countQuery += " AND status = ?"
    params.push(status)
    countParams.push(status)
  }

  // 添加模糊搜索（搜索 order_id 或 data JSON 中的内容）
  if (search) {
    query += " AND (order_id LIKE ? OR data LIKE ?)"
    countQuery += " AND (order_id LIKE ? OR data LIKE ?)"
    const searchPattern = `%${search}%`
    params.push(searchPattern, searchPattern)
    countParams.push(searchPattern, searchPattern)
  }

  // 获取总数
  const countResult = await env.DB.prepare(countQuery).bind(...countParams).first()
  const total = countResult?.total || 0

  // 获取分页数据
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
  params.push(pageSize, offset)

  const result = await env.DB.prepare(query).bind(...params).all()
  const records = (result.results || result).map(record => ({
    ...record,
    data: record.data ? JSON.parse(record.data) : {}
  }))

  return new Response(JSON.stringify({
    items: records,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  }), {
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
  
  // 获取查重配置（如果存在）
  let checkFields = null
  try {
    const configResult = await env.DB.prepare(
      'SELECT value FROM product_settings WHERE product_id = ? AND key = ?'
    ).bind(productId, 'duplicate_check_fields').first()
    
    if (configResult && configResult.value) {
      checkFields = JSON.parse(configResult.value)
    }
  } catch (e) {
    // 表可能不存在，忽略错误
    console.log('获取查重配置失败，使用默认逻辑:', e.message)
  }
  
  // 如果没有配置或配置为空，检查所有非空字段
  if (!checkFields || checkFields.length === 0) {
    checkFields = Object.keys(data).filter(key => {
      const value = data[key]
      return value !== null && value !== undefined && value !== ''
    })
  }
  
  console.log('查重使用的字段:', checkFields)
  
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
    const { records, fields: requestFields } = body
    
    console.log('=== handleCheckDuplicate 调试 ===')
    console.log('productId:', productId)
    console.log('records:', JSON.stringify(records, null, 2))
    console.log('requestFields:', requestFields)
    
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
    
    console.log('existingRecords count:', existingRecords.length)
    
    // 获取字段定义，建立 name -> label 映射
    const fieldsResult = await env.DB.prepare(
      'SELECT name, label FROM custom_fields WHERE product_id = ?'
    ).bind(productId).all()
    const fieldDefinitions = fieldsResult.results || []
    
    // 建立映射：英文 name -> 中文 label（数据中的键名）
    const nameToLabel = {}
    const labelToName = {}
    fieldDefinitions.forEach(f => {
      nameToLabel[f.name] = f.label
      labelToName[f.label] = f.name
    })
    
    console.log('字段映射 name->label:', nameToLabel)
    
    // 获取查重配置（优先使用数据库配置）
    let checkFieldNames = [] // 英文字段名列表
    try {
      const configResult = await env.DB.prepare(
        'SELECT value FROM product_settings WHERE product_id = ? AND key = ?'
      ).bind(productId, 'duplicate_check_fields').first()
      
      if (configResult && configResult.value) {
        checkFieldNames = JSON.parse(configResult.value)
        console.log('使用数据库查重配置:', checkFieldNames)
      }
    } catch (e) {
      console.log('获取查重配置失败:', e.message)
    }
    
    // 如果没有数据库配置，使用请求中的字段（但需要转换为英文）
    if (checkFieldNames.length === 0 && requestFields && requestFields.length > 0) {
      checkFieldNames = requestFields.map(f => labelToName[f] || f)
      console.log('使用请求字段转换为英文:', checkFieldNames)
    }
    
    // 如果还是没有，默认检查所有字段
    if (checkFieldNames.length === 0) {
      checkFieldNames = fieldDefinitions.map(f => f.name)
      console.log('使用所有字段:', checkFieldNames)
    }
    
    // 检查每条记录是否重复
    const checkResults = records.map((record, index) => {
      const recordData = record.data || record
      
      for (const existing of existingRecords) {
        const duplicateFieldNames = [] // 存储英文字段名
        
        for (const fieldName of checkFieldNames) {
          const fieldLabel = nameToLabel[fieldName] // 中文键名
          
          // 优先用英文键名取数据，没有则用中文键名
          const recordValue = recordData[fieldName] ?? recordData[fieldLabel]
          const existingValue = existing.data[fieldName] ?? existing.data[fieldLabel]
          
          console.log(`比较字段[${fieldName}]: recordValue=${recordValue}, existingValue=${existingValue}, match=${recordValue === existingValue}`)
          
          if (recordValue === existingValue && 
              recordValue !== null && 
              recordValue !== undefined && 
              recordValue !== '') {
            duplicateFieldNames.push(fieldName) // 返回英文字段名
          }
        }
        
        if (duplicateFieldNames.length > 0) {
          return {
            index,
            isDuplicate: true,
            duplicateFields: duplicateFieldNames, // 英文字段名
            existingRecordId: existing.id
          }
        }
      }
      return { index, isDuplicate: false }
    })
    
    const duplicates = checkResults.filter(r => r.isDuplicate)
    
    console.log('=== 检查结果 ===')
    console.log('duplicates:', JSON.stringify(duplicates, null, 2))
    
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
  try {
    const body = await request.json()
    console.log('Update record body:', body)
    
    // 从请求体中提取字段，如果没有提供则保持原值
    const { order_id, status, data } = body
    
    // 如果没有提供 order_id，先获取原记录的 order_id
    if (order_id === undefined) {
      const existingRecord = await env.DB.prepare(
        'SELECT order_id FROM shipping_records WHERE id = ?'
      ).bind(id).first()
      
      if (!existingRecord) {
        return new Response(JSON.stringify({ error: 'Record not found' }), {
          status: 404,
          headers: { ...headers, 'Content-Type': 'application/json' }
        })
      }
      
      // 只更新 data 和 status
      await env.DB.prepare(
        'UPDATE shipping_records SET data = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).bind(JSON.stringify(data), status, id).run()
    } else {
      // 更新所有字段
      await env.DB.prepare(
        'UPDATE shipping_records SET order_id = ?, data = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).bind(order_id, JSON.stringify(data), status, id).run()
    }
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...headers, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Update record error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...headers, 'Content-Type': 'application/json' }
    })
  }
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

// 批量获取记录（根据ID列表）
async function handleBatchGetRecords(productId, request, env, headers) {
  try {
    const body = await request.json()
    const { ids } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return new Response(JSON.stringify({ error: 'Missing or invalid ids array' }), {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' }
      })
    }

    // 限制批量查询数量
    const limit = 500
    const safeIds = ids.slice(0, limit)

    // 构建 IN 查询
    const placeholders = safeIds.map(() => '?').join(',')
    const result = await env.DB.prepare(
      `SELECT * FROM shipping_records WHERE product_id = ? AND id IN (${placeholders})`
    ).bind(productId, ...safeIds).all()

    const records = (result.results || result).map(record => ({
      ...record,
      data: record.data ? JSON.parse(record.data) : {}
    }))

    return new Response(JSON.stringify({
      items: records,
      total: records.length
    }), {
      headers: { ...headers, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Batch get records error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...headers, 'Content-Type': 'application/json' }
    })
  }
}

// 字段迁移：修复name/label颠倒问题
async function handleMigrateFields(env, headers) {
  try {
    // 获取所有字段
    const result = await env.DB.prepare('SELECT * FROM custom_fields').all()
    const fields = result.results || result
    
    const migrated = []
    
    for (const field of fields) {
      const oldName = field.name
      const oldLabel = field.label
      
      // 判断是否需要迁移：如果name是中文或label是英文，则需要互换
      const isNameChinese = /[\u4e00-\u9fa5]/.test(oldName)
      const isLabelEnglish = /^[a-zA-Z0-9_]+$/.test(oldLabel) && !/[\u4e00-\u9fa5]/.test(oldLabel)
      
      if (isNameChinese || isLabelEnglish) {
        // 互换 name 和 label
        let newName = oldLabel // 英文作为name
        let newLabel = oldName // 中文作为label
        
        // 确保name是英文标识符格式
        if (newName) {
          newName = newName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
        }
        
        // 如果name还是中文，尝试映射
        if (!newName || /[\u4e00-\u9fa5]/.test(newName)) {
          const labelToName = {
            '邮箱': 'email',
            '密码': 'password',
            '地址': 'address',
            '姓名': 'name',
            '电话': 'phone',
            '手机': 'mobile',
            '备注': 'remark',
            'api密钥': 'apikey',
            'apikey': 'apikey'
          }
          newName = labelToName[newLabel] || 'field_' + field.id
        }
        
        // 更新字段
        await env.DB.prepare(
          'UPDATE custom_fields SET name = ?, label = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        ).bind(newName, newLabel, field.id).run()
        
        migrated.push({
          id: field.id,
          oldName,
          oldLabel,
          newName,
          newLabel
        })
      }
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: `迁移完成，共迁移 ${migrated.length} 个字段`,
      migrated
    }), {
      headers: { ...headers, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Migrate fields error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...headers, 'Content-Type': 'application/json' }
    })
  }
}

export default {
  fetch: handleRequest
}
