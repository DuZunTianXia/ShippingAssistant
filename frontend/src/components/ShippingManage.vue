<template>
  <div class="shipping-manage">
    <div class="header">
      <div class="header-left">
        <h2>{{ productName }} - 发货记录管理</h2>
        <button class="btn btn-primary cursor-pointer" @click="openAddDialog">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          添加记录
        </button>
      </div>
      <button class="btn btn-ghost cursor-pointer" @click="goBack">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        返回商品列表
      </button>
    </div>

    <!-- 弹窗 -->
    <div v-if="dialogVisible" class="dialog-overlay" @click="closeDialog">
      <div class="dialog-card" @click.stop>
        <div class="dialog-header">
          <h3>{{ editingId ? '编辑记录' : '添加记录' }}</h3>
          <button class="dialog-close cursor-pointer" @click="closeDialog">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="dialog-content">
          <template v-for="field in fields" :key="field.id">
            <div class="form-group" :class="{ 'required-field': field.required }">
              <label class="form-label">{{ field.label }}{{ field.required ? ' *' : '' }}</label>
              <input
                v-if="field.type === 'text'"
                v-model="recordForm.data[field.name]"
                type="text"
                :placeholder="`请输入${field.label}`"
                class="form-input"
              />
              <input
                v-else-if="field.type === 'number'"
                v-model.number="recordForm.data[field.name]"
                type="number"
                :placeholder="`请输入${field.label}`"
                class="form-input"
              />
              <input
                v-else-if="field.type === 'date'"
                v-model="recordForm.data[field.name]"
                type="date"
                class="form-input"
              />
              <select
                v-else-if="field.type === 'select'"
                v-model="recordForm.data[field.name]"
                class="form-select"
              >
                <option value="">请选择</option>
                <option v-for="(opt, index) in getOptions(field.options)" :key="index" :value="opt">
                  {{ opt }}
                </option>
              </select>
              <textarea
                v-else-if="field.type === 'textarea'"
                v-model="recordForm.data[field.name]"
                :placeholder="`请输入${field.label}`"
                class="form-textarea"
                rows="3"
              />
            </div>
          </template>

          <div class="form-group">
            <label class="form-label">状态</label>
            <select v-model="recordForm.status" class="form-select">
              <option value="pending">待发货</option>
              <option value="shipped">已发货</option>
              <option value="completed">已完成</option>
            </select>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn btn-ghost cursor-pointer" @click="closeDialog">
            取消
          </button>
          <button class="btn btn-primary cursor-pointer" @click="saveRecord">
            {{ editingId ? '更新' : '保存' }}
          </button>
        </div>
      </div>
    </div>

    <div class="table-section">
      <div class="stats-bar" v-if="records.length > 0">
        <div class="stat-item">
          <span class="stat-label">总计:</span>
          <span class="stat-value stat-total">{{ stats.total }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">已发货:</span>
          <span class="stat-value stat-shipped">{{ stats.shipped }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">待发货:</span>
          <span class="stat-value stat-pending">{{ stats.pending }}</span>
        </div>
      </div>
      <div class="table-card">
        <h3>发货记录列表</h3>
        <div v-if="records.length === 0" class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 5.25v4.5m4.5-4.5v4.5m-9 7.5h15M6.75 12h10.5" />
          </svg>
          <p>暂无记录</p>
          <p class="empty-sub">点击上方"添加记录"按钮创建第一条记录</p>
        </div>
        <div v-else class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 60px;">序号</th>
                <th v-for="field in fields" :key="field.id">{{ field.label }}</th>
                <th>状态</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(record, index) in records" :key="record.id">
                <td>{{ index + 1 }}</td>
                <td v-for="field in fields" :key="field.id">
                  {{ record.data[field.name] || '-' }}
                </td>
                <td>
                  <span class="badge" :class="getStatusBadgeClass(record.status)">
                    {{ getStatusLabel(record.status) }}
                  </span>
                </td>
                <td>{{ formatDate(record.created_at) }}</td>
                <td>
                  <div class="action-buttons">
                    <button class="btn-icon btn-copy cursor-pointer" @click="copyRecord(record)" title="复制">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.16V8.25A2.25 2.25 0 0117.75 10.5h-12A2.25 2.25 0 013.5 8.25v-3.387c0-1.082.805-1.03 1.907-2.16.64-.073 1.28-.135 1.927-.184" />
                      </svg>
                    </button>
                    <button class="btn-icon btn-ship cursor-pointer" @click="quickShip(record)" title="快捷发货" v-if="record.status === 'pending'">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                      </svg>
                    </button>
                    <button class="btn-icon btn-edit cursor-pointer" @click="editRecord(record)" title="编辑">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                    </button>
                    <button class="btn-icon btn-delete cursor-pointer" @click="deleteRecord(record.id)" title="删除">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()

const productId = computed(() => route.params.productId)
const productName = computed(() => route.query.productName || '商品')

const recordForm = ref({
  status: 'pending',
  data: {}
})

const fields = ref([])
const records = ref([])
const editingId = ref(null)
const dialogVisible = ref(false)
const stats = ref({ total: 0, shipped: 0, pending: 0 })

const fetchFields = async () => {
  try {
    const response = await axios.get(`/api/products/${productId.value}/fields`)
    fields.value = response.data.sort((a, b) => a.sort_order - b.sort_order)
  } catch (error) {
    ElMessage.error('获取字段列表失败')
  }
}

const fetchRecords = async () => {
  try {
    const response = await axios.get(`/api/products/${productId.value}/records`)
    records.value = response.data
    // 同时获取统计信息
    fetchStats()
  } catch (error) {
    ElMessage.error('获取记录列表失败')
  }
}

const fetchStats = async () => {
  try {
    const response = await axios.get(`/api/products/${productId.value}/records/stats`)
    if (response.data.success) {
      stats.value = response.data.stats
    }
  } catch (error) {
    console.error('获取统计信息失败:', error)
  }
}

const openAddDialog = () => {
  editingId.value = null
  recordForm.value = {
    status: 'pending',
    data: {}
  }
  dialogVisible.value = true
}

const closeDialog = () => {
  dialogVisible.value = false
}

const saveRecord = async () => {
  try {
    const generateOrderId = () => {
      const timestamp = Date.now().toString(36)
      const random = Math.random().toString(36).substring(2, 8)
      return `${timestamp}-${random}`.toUpperCase()
    }

    const data = {
      order_id: generateOrderId(),
      status: recordForm.value.status,
      data: recordForm.value.data
    }

    if (editingId.value) {
      // 更新时保持原有的 order_id
      const existingRecord = records.value.find(r => r.id === editingId.value)
      data.order_id = existingRecord?.order_id
      await axios.put(`/api/records/${editingId.value}`, data)
      ElMessage.success('更新成功')
    } else {
      await axios.post(`/api/products/${productId.value}/records`, data)
      ElMessage.success('保存成功')
    }

    closeDialog()
    fetchRecords()
  } catch (error) {
    ElMessage.error(editingId.value ? '更新记录失败' : '保存记录失败')
  }
}

const editRecord = (row) => {
  editingId.value = row.id
  recordForm.value = {
    status: row.status,
    data: row.data || {}
  }
  dialogVisible.value = true
}

const deleteRecord = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除这条记录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await axios.delete(`/api/records/${id}`)
    ElMessage.success('删除成功')
    fetchRecords()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const copyRecord = (record) => {
  try {
    // 获取该商品的复制字段配置（从 localStorage 读取）
    const copyConfigKey = `copy_fields_${productId.value}`
    const copyFieldIds = JSON.parse(localStorage.getItem(copyConfigKey) || '[]')

    // 根据配置筛选字段，如果没有配置则复制所有字段
    const fieldsToCopy = copyFieldIds.length > 0
      ? fields.value.filter(f => copyFieldIds.includes(f.id))
      : fields.value

    // 生成复制文本
    const text = fieldsToCopy
      .map(field => {
        const value = record.data[field.name]
        if (value === undefined || value === null || value === '') {
          return null
        }
        return `${field.label}:${value}`
      })
      .filter(line => line !== null)
      .join('\n')

    if (!text) {
      ElMessage.warning('没有可复制的内容')
      return
    }

    // 复制到剪贴板
    navigator.clipboard.writeText(text).then(() => {
      ElMessage.success('已复制到剪贴板')
    }).catch(() => {
      ElMessage.error('复制失败')
    })
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

const quickShip = async (record) => {
  try {
    await ElMessageBox.confirm('确定要标记为已发货吗？', '快捷发货', {
      confirmButtonText: '确定发货',
      cancelButtonText: '取消',
      type: 'info'
    })

    const data = {
      order_id: record.order_id,
      status: 'shipped',
      data: record.data
    }

    await axios.put(`/api/records/${record.id}`, data)
    ElMessage.success('已标记为已发货')
    fetchRecords()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

const getOptions = (optionsStr) => {
  return optionsStr ? optionsStr.split('\n').filter(opt => opt.trim()) : []
}

const getStatusLabel = (status) => {
  const statusMap = {
    pending: '待发货',
    shipped: '已发货',
    completed: '已完成'
  }
  return statusMap[status] || status
}

const getStatusBadgeClass = (status) => {
  const classMap = {
    pending: 'badge-warning',
    shipped: 'badge-primary',
    completed: 'badge-success'
  }
  return classMap[status] || 'badge-info'
}

const formatDate = (dateStr) => {
  return dateStr ? new Date(dateStr).toLocaleString('zh-CN') : '-'
}

const goBack = () => {
  router.push('/')
}

onMounted(() => {
  if (productId.value) {
    fetchFields()
    fetchRecords()
  }
})
</script>

<style scoped>
.shipping-manage {
  padding: 0;
}

.stats-bar {
  display: flex;
  gap: var(--spacing-xl);
  padding: var(--spacing-md) var(--spacing-lg);
  background: linear-gradient(135deg, var(--color-bg-card) 0%, var(--color-bg-hover) 100%);
  border-radius: var(--radius-lg);
  margin-bottom: var(--spacing-md);
  border: 1px solid var(--color-border);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.stat-label {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
}

.stat-total {
  color: var(--color-text-primary);
}

.stat-shipped {
  color: var(--color-success);
}

.stat-pending {
  color: var(--color-warning);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.header h2 {
  font-size: 22px;
  font-weight: 600;
  margin: 0;
  color: var(--color-text-primary);
}

.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.dialog-card {
  background-color: var(--color-bg-card);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg) var(--spacing-xl);
  border-bottom: 1px solid var(--color-border);
}

.dialog-header h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: var(--color-text-primary);
}

.dialog-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--radius-md);
  background-color: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.dialog-close:hover {
  background-color: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.dialog-close svg {
  width: 20px;
  height: 20px;
}

.dialog-content {
  padding: var(--spacing-xl);
  overflow-y: auto;
  flex: 1;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
  padding: var(--spacing-lg) var(--spacing-xl);
  border-top: 1px solid var(--color-border);
}

.form-group {
  margin-bottom: var(--spacing-lg);
}

.required-field .form-label {
  font-weight: 600;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-sm);
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: 14px;
  color: var(--color-text-primary);
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  font-family: 'Open Sans', sans-serif;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(8, 145, 178, 0.1);
  background-color: white;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
  font-family: 'Open Sans', sans-serif;
}

.table-section {
  margin-top: var(--spacing-2xl);
}

.table-card {
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
}

.table-card h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);
}

.empty-state {
  text-align: center;
  padding: var(--spacing-2xl);
  color: var(--color-text-muted);
}

.empty-state svg {
  width: 64px;
  height: 64px;
  margin: 0 auto var(--spacing-md);
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}

.empty-sub {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-top: var(--spacing-sm);
}

.table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table thead th {
  text-align: left;
  padding: var(--spacing-md);
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
  background-color: var(--color-bg-input);
  border-bottom: 2px solid var(--color-border);
  white-space: nowrap;
}

.data-table tbody td {
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

.data-table tbody tr:hover td {
  background-color: var(--color-bg-hover);
}

.data-table code {
  background-color: var(--color-bg-hover);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: 12px;
  color: var(--color-primary);
}

.action-buttons {
  display: flex;
  gap: var(--spacing-sm);
}

.btn-icon {
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--radius-md);
  background-color: var(--color-bg-input);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-icon svg {
  width: 18px;
  height: 18px;
}

.btn-icon:hover {
  transform: scale(1.1);
}

.btn-edit:hover {
  background-color: var(--color-primary);
  color: white;
}

.btn-delete:hover {
  background-color: var(--color-danger);
  color: white;
}

.btn-copy:hover {
  background-color: var(--color-success);
  color: white;
}

.btn-ship:hover {
  background-color: var(--color-info);
  color: white;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: 12px;
  font-weight: 500;
  border-radius: var(--radius-sm);
}

.badge-primary {
  background-color: rgba(8, 145, 178, 0.1);
  color: var(--color-primary);
}

.badge-info {
  background-color: rgba(59, 130, 246, 0.1);
  color: var(--color-info);
}

.badge-warning {
  background-color: rgba(245, 158, 11, 0.1);
  color: var(--color-warning);
}

.badge-success {
  background-color: rgba(34, 197, 94, 0.1);
  color: var(--color-success);
}

.badge-danger {
  background-color: rgba(239, 68, 68, 0.1);
  color: var(--color-danger);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

.btn svg {
  width: 16px;
  height: 16px;
  margin-right: var(--spacing-xs);
}

.btn:last-child svg {
  margin-right: 0;
}

.btn svg:only-child {
  margin-right: 0;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: var(--spacing-md);
    align-items: stretch;
  }

  .header-left {
    flex-direction: column;
    align-items: stretch;
  }

  .data-table {
    font-size: 13px;
  }

  .data-table thead th,
  .data-table tbody td {
    padding: var(--spacing-sm);
  }

  .dialog-card {
    width: 95%;
    max-width: none;
  }

  .dialog-content {
    padding: var(--spacing-lg);
  }

  .dialog-footer {
    flex-direction: column;
  }

  .dialog-footer .btn {
    width: 100%;
  }
}
</style>
