<template>
  <div class="field-manage">
    <div class="header">
      <div class="header-left">
        <h2>{{ productName }} - 自定义字段管理</h2>
        <button class="btn btn-primary cursor-pointer" @click="openAddDialog">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          添加字段
        </button>
        <button class="btn btn-secondary cursor-pointer" @click="openCopyConfigDialog">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.16V8.25A2.25 2.25 0 0117.75 10.5h-12A2.25 2.25 0 013.5 8.25v-3.387c0-1.082.805-1.03 1.907-2.16.64-.073 1.28-.135 1.927-.184" />
          </svg>
          复制字段配置
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
          <h3>{{ editingId ? '编辑字段' : '添加字段' }}</h3>
          <button class="dialog-close cursor-pointer" @click="closeDialog">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="dialog-content">
          <div class="form-group">
            <label class="form-label">字段名称 *</label>
            <input
              v-model="fieldForm.name"
              type="text"
              placeholder="请输入字段名称（英文，如：phone）"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label class="form-label">字段标签 *</label>
            <input
              v-model="fieldForm.label"
              type="text"
              placeholder="请输入显示标签（中文，如：手机号）"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label class="form-label">字段类型 *</label>
            <select v-model="fieldForm.type" class="form-select">
              <option value="text">文本</option>
              <option value="number">数字</option>
              <option value="date">日期</option>
              <option value="select">选择框</option>
              <option value="textarea">多行文本</option>
            </select>
          </div>
          <div class="form-group" v-if="fieldForm.type === 'select'">
            <label class="form-label">选项</label>
            <textarea
              v-model="fieldForm.options"
              placeholder="请输入选项，每行一个"
              class="form-textarea"
              rows="4"
            />
          </div>
          <div class="form-row">
            <div class="form-group form-group-small">
              <label class="form-label">是否必填</label>
              <div class="switch-toggle" :class="{ 'switch-checked': fieldForm.required }" @click="fieldForm.required = !fieldForm.required">
                <input type="checkbox" v-model="fieldForm.required" />
                <span class="switch-slider"></span>
              </div>
            </div>
            <div class="form-group form-group-small">
              <label class="form-label">排序</label>
              <input
                v-model.number="fieldForm.sort_order"
                type="number"
                min="0"
                class="form-input"
              />
            </div>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn btn-ghost cursor-pointer" @click="closeDialog">
            取消
          </button>
          <button class="btn btn-primary cursor-pointer" @click="saveField" :disabled="!fieldForm.name || !fieldForm.label">
            {{ editingId ? '更新字段' : '保存字段' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 复制字段配置弹窗 -->
    <div v-if="copyConfigDialogVisible" class="dialog-overlay" @click="closeCopyConfigDialog">
      <div class="dialog-card" @click.stop>
        <div class="dialog-header">
          <h3>复制字段配置</h3>
          <button class="dialog-close cursor-pointer" @click="closeCopyConfigDialog">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="dialog-content">
          <p style="margin-bottom: 16px; color: var(--color-text-secondary); font-size: 14px;">
            选择需要复制的字段，未选择的字段不会被复制到剪贴板
          </p>
          <div v-if="fields.length === 0" class="empty-state">
            <p>暂无字段</p>
          </div>
          <div v-else class="copy-field-list">
            <label v-for="field in fields" :key="field.id" class="copy-field-item">
              <input
                type="checkbox"
                v-model="copyFieldIds"
                :value="field.id"
                :id="`copy-field-${field.id}`"
              />
              <span>{{ field.label }}</span>
            </label>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn btn-ghost cursor-pointer" @click="closeCopyConfigDialog">
            取消
          </button>
          <button class="btn btn-primary cursor-pointer" @click="saveCopyConfig">
            保存配置
          </button>
        </div>
      </div>
    </div>

    <div class="table-section">
      <div class="table-card">
        <h3>已创建的字段</h3>
        <div v-if="fields.length === 0" class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 7.5h3.75a.75.75 0 0 1 .75.75v11.25a.75.75 0 0 1-.75.75h-3.75a.75.75 0 0 1-.75-.75V7.5a.75.75 0 0 1 .75-.75zM3 12h1.5a.75.75 0 0 1 0 1.5v6a.75.75 0 0 1-1.5 0H3a.75.75 0 0 1-1.5 0v-6A.75.75 0 0 1 3 12zm-.75 1.5h7.5a.75.75 0 0 1 .75.75v-1.5h-7.5a.75.75 0 0 1-.75-.75v1.5z" />
          </svg>
          <p>暂无字段</p>
          <p class="empty-sub">点击上方"添加字段"按钮创建第一个字段</p>
        </div>
        <div v-else class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>字段标签</th>
                <th>字段名称</th>
                <th>类型</th>
                <th>必填</th>
                <th>排序</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="field in fields" :key="field.id">
                <td>{{ field.label }}</td>
                <td><code>{{ field.name }}</code></td>
                <td>
                  <span class="badge" :class="getBadgeClass(field.type)">
                    {{ getTypeLabel(field.type) }}
                  </span>
                </td>
                <td>
                  <span class="badge" :class="field.required ? 'badge-danger' : 'badge-success'">
                    {{ field.required ? '是' : '否' }}
                  </span>
                </td>
                <td>{{ field.sort_order }}</td>
                <td>
                  <div class="action-buttons">
                    <button class="btn-icon btn-edit cursor-pointer" @click="editField(field)" title="编辑">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                    </button>
                    <button class="btn-icon btn-delete cursor-pointer" @click="deleteField(field.id)" title="删除">
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

const fieldForm = ref({
  name: '',
  label: '',
  type: 'text',
  options: '',
  required: false,
  sort_order: 0
})

const fields = ref([])
const editingId = ref(null)
const dialogVisible = ref(false)
const copyConfigDialogVisible = ref(false)
const copyFieldIds = ref([])

const fetchFields = async () => {
  try {
    const response = await axios.get(`/api/products/${productId.value}/fields`)
    // 处理新的分页响应格式
    fields.value = response.data.items || response.data
  } catch (error) {
    ElMessage.error('获取字段列表失败')
  }
}

const openAddDialog = () => {
  editingId.value = null
  fieldForm.value = {
    name: '',
    label: '',
    type: 'text',
    options: '',
    required: false,
    sort_order: 0
  }
  dialogVisible.value = true
}

const closeDialog = () => {
  dialogVisible.value = false
}

const openCopyConfigDialog = () => {
  // 从 localStorage 加载已保存的配置
  const copyConfigKey = `copy_fields_${productId.value}`
  const savedConfig = JSON.parse(localStorage.getItem(copyConfigKey) || '[]')
  copyFieldIds.value = savedConfig
  copyConfigDialogVisible.value = true
}

const closeCopyConfigDialog = () => {
  copyConfigDialogVisible.value = false
}

const saveCopyConfig = () => {
  const copyConfigKey = `copy_fields_${productId.value}`
  localStorage.setItem(copyConfigKey, JSON.stringify(copyFieldIds.value))
  ElMessage.success('复制字段配置已保存')
  closeCopyConfigDialog()
}

const editField = (field) => {
  editingId.value = field.id
  fieldForm.value = {
    name: field.name,
    label: field.label,
    type: field.type,
    options: field.options || '',
    required: field.required === 1,
    sort_order: field.sort_order
  }
  dialogVisible.value = true
}

const saveField = async () => {
  try {
    if (!fieldForm.value.name || !fieldForm.value.label) {
      ElMessage.warning('请填写字段名称和标签')
      return
    }

    const data = {
      name: fieldForm.value.name,
      label: fieldForm.value.label,
      type: fieldForm.value.type,
      options: fieldForm.value.type === 'select' ? fieldForm.value.options : null,
      required: fieldForm.value.required ? 1 : 0,
      sort_order: fieldForm.value.sort_order
    }

    if (editingId.value) {
      await axios.put(`/api/fields/${editingId.value}`, data)
      ElMessage.success('字段更新成功')
    } else {
      await axios.post(`/api/products/${productId.value}/fields`, data)
      ElMessage.success('字段保存成功')
    }

    closeDialog()
    fetchFields()
  } catch (error) {
    ElMessage.error(editingId.value ? '更新字段失败' : '保存字段失败')
  }
}

const deleteField = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除这个字段吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await axios.delete(`/api/fields/${id}`)
    ElMessage.success('删除成功')
    fetchFields()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const getTypeLabel = (type) => {
  const typeMap = {
    text: '文本',
    number: '数字',
    date: '日期',
    select: '选择框',
    textarea: '多行文本'
  }
  return typeMap[type] || type
}

const getBadgeClass = (type) => {
  const classMap = {
    text: 'badge-primary',
    number: 'badge-info',
    date: 'badge-warning',
    select: 'badge-success',
    textarea: 'badge-primary'
  }
  return classMap[type] || 'badge-primary'
}

const goBack = () => {
  router.push('/')
}

onMounted(() => {
  if (productId.value) {
    fetchFields()
  }
})
</script>

<style scoped>
.field-manage {
  padding: 0;
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
  max-width: 500px;
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

.copy-field-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.copy-field-item {
  display: flex;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.copy-field-item:hover {
  background-color: var(--color-bg-hover);
  border-color: var(--color-primary);
}

.copy-field-item input[type="checkbox"] {
  width: 18px;
  height: 18px;
  margin-right: var(--spacing-md);
  cursor: pointer;
}

.copy-field-item span {
  font-size: 14px;
  color: var(--color-text-primary);
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

.form-group-small {
  flex: 1;
  margin-bottom: 0;
}

.form-row {
  display: flex;
  gap: var(--spacing-lg);
  align-items: flex-start;
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
  min-height: 100px;
  font-family: 'Open Sans', sans-serif;
}

.switch-toggle {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
  cursor: pointer;
}

.switch-toggle input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  pointer-events: none;
}

.switch-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--color-border);
  transition: var(--transition-base);
  border-radius: 24px;
  pointer-events: none;
}

.switch-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: var(--transition-base);
  border-radius: 50%;
}

.switch-toggle.switch-checked .switch-slider {
  background-color: var(--color-primary);
}

.switch-toggle.switch-checked .switch-slider:before {
  transform: translateX(24px);
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

  .form-row {
    flex-direction: column;
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
