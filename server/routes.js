const express = require('express')
const router = express.Router()
const dbService = require('./db')

// ==================== 商品管理 ====================

// 获取所有商品
router.get('/products', async (req, res) => {
  try {
    const db = dbService.getDB()
    const result = await db.prepare('SELECT * FROM products ORDER BY created_at DESC').all()
    res.json(result.results || result)
  } catch (error) {
    console.error('Get products error:', error)
    res.status(500).json({ error: 'Failed to fetch products' })
  }
})

// 创建商品
router.post('/products', async (req, res) => {
  try {
    const { name, description } = req.body
    const db = dbService.getDB()
    const result = await db.prepare(
      'INSERT INTO products (name, description) VALUES (?, ?)'
    ).bind(name, description).run()

    res.json({ success: true, id: result.meta.last_row_id })
  } catch (error) {
    console.error('Create product error:', error)
    res.status(500).json({ error: 'Failed to create product' })
  }
})

// 更新商品
router.put('/products/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name, description } = req.body
    const db = dbService.getDB()
    await db.prepare(
      'UPDATE products SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(name, description, id).run()

    res.json({ success: true })
  } catch (error) {
    console.error('Update product error:', error)
    res.status(500).json({ error: 'Failed to update product' })
  }
})

// 删除商品
router.delete('/products/:id', async (req, res) => {
  try {
    const { id } = req.params
    const db = dbService.getDB()
    await db.prepare('DELETE FROM products WHERE id = ?').bind(id).run()
    res.json({ success: true })
  } catch (error) {
    console.error('Delete product error:', error)
    res.status(500).json({ error: 'Failed to delete product' })
  }
})

// ==================== 字段管理 ====================

// 获取某个商品的所有字段
router.get('/products/:productId/fields', async (req, res) => {
  try {
    const { productId } = req.params
    const db = dbService.getDB()
    const result = await db.prepare(
      'SELECT * FROM custom_fields WHERE product_id = ? ORDER BY sort_order ASC'
    ).bind(productId).all()

    res.json(result.results || result)
  } catch (error) {
    console.error('Get fields error:', error)
    res.status(500).json({ error: 'Failed to fetch fields' })
  }
})

// 创建自定义字段
router.post('/products/:productId/fields', async (req, res) => {
  try {
    const { productId } = req.params
    const { name, label, type, options, required, sort_order } = req.body

    const db = dbService.getDB()
    const result = await db.prepare(
      'INSERT INTO custom_fields (product_id, name, label, type, options, required, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(productId, name, label, type, options, required ? 1 : 0, sort_order).run()

    res.json({ success: true, id: result.meta.last_row_id })
  } catch (error) {
    console.error('Create field error:', error)
    res.status(500).json({ error: 'Failed to create field' })
  }
})

// 删除自定义字段
router.delete('/fields/:id', async (req, res) => {
  try {
    const { id } = req.params
    const db = dbService.getDB()
    await db.prepare('DELETE FROM custom_fields WHERE id = ?').bind(id).run()
    res.json({ success: true })
  } catch (error) {
    console.error('Delete field error:', error)
    res.status(500).json({ error: 'Failed to delete field' })
  }
})

// 更新自定义字段
router.put('/fields/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name, label, type, options, required, sort_order } = req.body

    const db = dbService.getDB()
    await db.prepare(
      'UPDATE custom_fields SET name = ?, label = ?, type = ?, options = ?, required = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(name, label, type, options, required ? 1 : 0, sort_order, id).run()

    res.json({ success: true })
  } catch (error) {
    console.error('Update field error:', error)
    res.status(500).json({ error: 'Failed to update field' })
  }
})

// ==================== 记录管理 ====================

// 获取某个商品的所有记录
router.get('/products/:productId/records', async (req, res) => {
  try {
    const { productId } = req.params
    const db = dbService.getDB()
    const result = await db.prepare(
      'SELECT * FROM shipping_records WHERE product_id = ? ORDER BY created_at DESC'
    ).bind(productId).all()

    const records = (result.results || result).map(record => ({
      ...record,
      data: record.data ? JSON.parse(record.data) : {}
    }))

    res.json(records)
  } catch (error) {
    console.error('Get records error:', error)
    res.status(500).json({ error: 'Failed to fetch records' })
  }
})

// 创建发货记录
router.post('/products/:productId/records', async (req, res) => {
  try {
    const { productId } = req.params
    const { order_id, status, data } = req.body

    const db = dbService.getDB()
    const result = await db.prepare(
      'INSERT INTO shipping_records (product_id, order_id, data, status) VALUES (?, ?, ?, ?)'
    ).bind(productId, order_id, JSON.stringify(data), status).run()

    res.json({ success: true, id: result.meta.last_row_id })
  } catch (error) {
    console.error('Create record error:', error)
    res.status(500).json({ error: 'Failed to create record' })
  }
})

// 更新发货记录
router.put('/records/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { order_id, status, data } = req.body

    const db = dbService.getDB()
    await db.prepare(
      'UPDATE shipping_records SET order_id = ?, data = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(order_id, JSON.stringify(data), status, id).run()

    res.json({ success: true })
  } catch (error) {
    console.error('Update record error:', error)
    res.status(500).json({ error: 'Failed to update record' })
  }
})

// 删除发货记录
router.delete('/records/:id', async (req, res) => {
  try {
    const { id } = req.params
    const db = dbService.getDB()
    await db.prepare('DELETE FROM shipping_records WHERE id = ?').bind(id).run()
    res.json({ success: true })
  } catch (error) {
    console.error('Delete record error:', error)
    res.status(500).json({ error: 'Failed to delete record' })
  }
})

// 根据订单号查询
router.get('/records/order/:order_id', async (req, res) => {
  try {
    const { order_id } = req.params
    const db = dbService.getDB()
    const result = await db.prepare('SELECT * FROM shipping_records WHERE order_id = ?').bind(order_id).all()

    const records = (result.results || result).map(record => ({
      ...record,
      data: record.data ? JSON.parse(record.data) : {}
    }))

    res.json(records)
  } catch (error) {
    console.error('Get record by order_id error:', error)
    res.status(500).json({ error: 'Failed to fetch record' })
  }
})

module.exports = router
