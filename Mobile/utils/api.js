// API 基础配置
// 开发环境使用本地代理，生产环境使用 Worker URL
const API_BASE_URL = 'http://product.langshen.xyz'

// 统一请求封装
const request = (url, method = 'GET', data = null) => {
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${API_BASE_URL}${url}`,
      method,
      data,
      header: {
        'Content-Type': 'application/json'
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else {
          reject(new Error(res.data?.error || `请求失败: ${res.statusCode}`))
        }
      },
      fail: (err) => {
        reject(new Error('网络请求失败'))
      }
    })
  })
}

// ==================== 商品管理 ====================
export const getProducts = () => {
  return request('/api/products')
}

export const createProduct = (data) => {
  return request('/api/products', 'POST', data)
}

export const updateProduct = (id, data) => {
  return request(`/api/products/${id}`, 'PUT', data)
}

export const deleteProduct = (id) => {
  return request(`/api/products/${id}`, 'DELETE')
}

// ==================== 字段管理 ====================
export const getFields = (productId) => {
  return request(`/api/products/${productId}/fields`)
}

export const createField = (productId, data) => {
  return request(`/api/products/${productId}/fields`, 'POST', data)
}

export const updateField = (id, data) => {
  return request(`/api/fields/${id}`, 'PUT', data)
}

export const deleteField = (id) => {
  return request(`/api/fields/${id}`, 'DELETE')
}

// ==================== 发货记录管理 ====================
export const getRecords = (productId, params = {}) => {
  const queryParams = []
  if (params.page) queryParams.push(`page=${params.page}`)
  if (params.pageSize) queryParams.push(`pageSize=${params.pageSize}`)
  if (params.search) queryParams.push(`search=${encodeURIComponent(params.search)}`)
  if (params.status) queryParams.push(`status=${params.status}`)
  const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : ''
  return request(`/api/products/${productId}/records${queryString}`)
}

// 批量获取记录（根据ID列表）
export const batchGetRecords = (productId, ids) => {
  return request(`/api/products/${productId}/records/batch`, 'POST', { ids })
}

export const createRecord = (productId, data) => {
  return request(`/api/products/${productId}/records`, 'POST', data)
}

export const updateRecord = (id, data) => {
  return request(`/api/records/${id}`, 'PUT', data)
}

export const deleteRecord = (id) => {
  return request(`/api/records/${id}`, 'DELETE')
}

export const getRecordByOrderId = (orderId) => {
  return request(`/api/records/order/${orderId}`)
}

// 获取统计信息
export const getRecordStats = (productId) => {
  return request(`/api/products/${productId}/records/stats`)
}

// ==================== 健康检查 ====================
export const healthCheck = () => {
  return request('/api/health')
}