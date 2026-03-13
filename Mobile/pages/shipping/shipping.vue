<template>
  <view class="container">
    <!-- 空状态 -->
    <view v-if="records.length === 0" class="empty-state">
      <image class="empty-icon" src="/static/empty-record.png" mode="aspectFit"></image>
      <text class="empty-title">还没有发货记录</text>
      <text class="empty-desc">点击添加按钮创建发货记录</text>
    </view>

    <!-- 记录列表 -->
    <scroll-view v-else class="record-list" scroll-y>
      <view 
        class="record-card" 
        v-for="(record, index) in records" 
        :key="record.id"
        :class="{ 'shipped': record.status === 'shipped' }"
      >
        <view class="record-header">
          <view class="record-index">#{{ index + 1 }}</view>
          <view class="record-status">
            <text :class="['status-tag', record.status]">
              {{ record.status === 'shipped' ? '已发货' : '待发货' }}
            </text>
          </view>
        </view>
        
        <view class="record-fields">
          <view class="field-row" v-for="field in fieldList" :key="field.id">
            <text class="field-label">{{ field.label }}:</text>
            <text class="field-value">{{ record.data[field.name] || '-' }}</text>
          </view>
        </view>

        <view class="record-time">
          <text class="time-text">{{ formatDate(record.created_at) }}</text>
        </view>

        <view class="record-actions">
          <view class="action-btn copy" @click="copyRecord(record)">
            <text class="btn-icon">📋</text>
            <text class="btn-text">复制</text>
          </view>
          <view 
            class="action-btn quick-ship" 
            v-if="record.status === 'pending'"
            @click="quickShip(record.id)"
          >
            <text class="btn-icon">🚀</text>
            <text class="btn-text">发货</text>
          </view>
          <view class="action-btn edit" @click="editRecord(record)">
            <text class="btn-icon">✏️</text>
            <text class="btn-text">编辑</text>
          </view>
          <view class="action-btn delete" @click="deleteRecord(record.id)">
            <text class="btn-icon">🗑️</text>
            <text class="btn-text">删除</text>
          </view>
        </view>
      </view>
      <view class="safe-area-bottom"></view>
    </scroll-view>

    <!-- 添加按钮 -->
    <view class="fab-btn" @click="showAddModal = true">
      <text class="fab-icon">+</text>
    </view>

    <!-- 添加/编辑记录弹窗 -->
    <view v-if="showAddModal" class="modal-mask" @click="closeModal">
      <view class="modal" @click.stop>
        <view class="modal-header">
          <text class="modal-title">{{ editMode ? '编辑记录' : '添加发货' }}</text>
          <text class="modal-close" @click="closeModal">×</text>
        </view>
        <scroll-view class="modal-body" scroll-y>
          <view 
            class="form-item" 
            v-for="field in fields" 
            :key="field.id"
          >
            <text class="form-label">
              {{ field.label }}
              <text class="required" v-if="field.required">*</text>
            </text>
            <!-- 文本输入 -->
            <input 
              v-if="field.type === 'text' || field.type === 'number'"
              class="form-input" 
              :type="field.type === 'number' ? 'number' : 'text'"
              v-model="recordForm.data[field.name]" 
              :placeholder="`请输入${field.label}`"
            />
            <!-- 多行文本 -->
            <textarea 
              v-else-if="field.type === 'textarea'"
              class="form-textarea" 
              v-model="recordForm.data[field.name]" 
              :placeholder="`请输入${field.label}`"
            />
            <!-- 下拉选择 -->
            <picker 
              v-else-if="field.type === 'select'"
              mode="selector" 
              :range="getOptions(field.options)"
              :value="getOptionIndex(field)"
              @change="onSelectChange($event, field)"
            >
              <view class="form-picker">
                <text :class="{ 'placeholder': !recordForm.data[field.name] }">
                  {{ recordForm.data[field.name] || `请选择${field.label}` }}
                </text>
                <text class="picker-arrow">›</text>
              </view>
            </picker>
            <!-- 日期选择 -->
            <picker 
              v-else-if="field.type === 'date'"
              mode="date"
              :value="recordForm.data[field.name] || ''"
              @change="onDateChange($event, field)"
            >
              <view class="form-picker">
                <text :class="{ 'placeholder': !recordForm.data[field.name] }">
                  {{ recordForm.data[field.name] || '请选择日期' }}
                </text>
                <text class="picker-arrow">›</text>
              </view>
            </picker>
          </view>
          <view class="form-item switch-item">
            <text class="form-label">已发货</text>
            <switch :checked="recordForm.status === 'shipped'" @change="onStatusChange" color="#3b82f6" />
          </view>
        </scroll-view>
        <view class="modal-footer">
          <view class="btn btn-secondary" @click="closeModal">取消</view>
          <view class="btn btn-primary" @click="saveRecord">保存</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { getRecords, createRecord, updateRecord, deleteRecord, getFields } from '@/utils/api.js'

export default {
  data() {
    return {
      productId: null,
      productName: '',
      records: [],
      fields: [],
      copyFieldIds: [],
      showAddModal: false,
      editMode: false,
      recordForm: {
        id: null,
        data: {},
        status: 'pending'
      }
    }
  },

  computed: {
    fieldList() {
      return this.fields.filter(f => this.copyFieldIds.includes(f.id))
    }
  },

  onLoad(options) {
    this.productId = options.productId
    this.productName = decodeURIComponent(options.productName || '')
    uni.setNavigationBarTitle({
      title: this.productName ? `${this.productName} - 发货` : '发货管理'
    })
    this.loadData()
  },

  onShow() {
    this.loadData()
  },

  methods: {
    async loadData() {
      await this.loadFields()
      await this.loadRecords()
      this.loadCopyConfig()
    },

    async loadFields() {
      try {
        const data = await getFields(this.productId)
        this.fields = data.sort((a, b) => a.sort_order - b.sort_order)
      } catch (error) {
        console.error('加载字段失败:', error)
      }
    },

    async loadRecords() {
      try {
        const data = await getRecords(this.productId)
        this.records = data
      } catch (error) {
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        })
      }
    },

    loadCopyConfig() {
      const config = uni.getStorageSync(`copy_fields_${this.productId}`)
      this.copyFieldIds = config ? JSON.parse(config) : this.fields.map(f => f.id)
    },

    formatDate(dateStr) {
      if (!dateStr) return ''
      const date = new Date(dateStr)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    },

    getOptions(optionsStr) {
      if (!optionsStr) return []
      return optionsStr.split('\n').filter(o => o.trim())
    },

    getOptionIndex(field) {
      const options = this.getOptions(field.options)
      return options.indexOf(this.recordForm.data[field.name] || '')
    },

    onSelectChange(e, field) {
      const options = this.getOptions(field.options)
      const index = e.detail.value
      this.recordForm.data[field.name] = options[index]
    },

    onDateChange(e, field) {
      this.recordForm.data[field.name] = e.detail.value
    },

    onStatusChange(e) {
      this.recordForm.status = e.detail.value ? 'shipped' : 'pending'
    },

    copyRecord(record) {
      const lines = []
      this.fieldList.forEach(field => {
        const value = record.data[field.name] || ''
        lines.push(`${field.label}: ${value}`)
      })
      const text = lines.join('\n')
      
      uni.setClipboardData({
        data: text,
        success: () => {
          uni.showToast({ title: '复制成功', icon: 'success' })
        }
      })
    },

    quickShip(id) {
      uni.showModal({
        title: '确认发货',
        content: '确定标记此订单为已发货？',
        success: async (res) => {
          if (res.confirm) {
            try {
              const record = this.records.find(r => r.id === id)
              await updateRecord(id, {
                ...record,
                status: 'shipped'
              })
              uni.showToast({ title: '发货成功', icon: 'success' })
              this.loadRecords()
            } catch (error) {
              uni.showToast({ title: '操作失败', icon: 'none' })
            }
          }
        }
      })
    },

    editRecord(record) {
      this.editMode = true
      this.recordForm = {
        id: record.id,
        data: { ...record.data },
        status: record.status
      }
      this.showAddModal = true
    },

    closeModal() {
      this.showAddModal = false
      this.editMode = false
      this.recordForm = {
        id: null,
        data: {},
        status: 'pending'
      }
    },

    async saveRecord() {
      // 验证必填字段
      for (const field of this.fields) {
        if (field.required && !this.recordForm.data[field.name]) {
          uni.showToast({ title: `请填写${field.label}`, icon: 'none' })
          return
        }
      }

      try {
        const data = {
          data: this.recordForm.data,
          status: this.recordForm.status
        }
        if (this.editMode) {
          await updateRecord(this.recordForm.id, data)
          uni.showToast({ title: '修改成功', icon: 'success' })
        } else {
          await createRecord(this.productId, data)
          uni.showToast({ title: '添加成功', icon: 'success' })
        }
        this.closeModal()
        this.loadRecords()
      } catch (error) {
        uni.showToast({ title: '保存失败', icon: 'none' })
      }
    },

    deleteRecord(id) {
      uni.showModal({
        title: '确认删除',
        content: '删除后将无法恢复，是否继续？',
        confirmColor: '#ef4444',
        success: async (res) => {
          if (res.confirm) {
            try {
              await deleteRecord(id)
              uni.showToast({ title: '删除成功', icon: 'success' })
              this.loadRecords()
            } catch (error) {
              uni.showToast({ title: '删除失败', icon: 'none' })
            }
          }
        }
      })
    }
  }
}
</script>

<style lang="scss">
.container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20rpx;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 200rpx 40rpx;
}

.empty-icon {
  width: 200rpx;
  height: 200rpx;
  margin-bottom: 40rpx;
  opacity: 0.5;
}

.empty-title {
  font-size: 32rpx;
  color: #333;
  font-weight: 600;
  margin-bottom: 16rpx;
}

.empty-desc {
  font-size: 28rpx;
  color: #999;
}

.record-list {
  height: 100vh;
}

.record-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  border-left: 8rpx solid #f59e0b;
}

.record-card.shipped {
  border-left-color: #10b981;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.record-index {
  font-size: 32rpx;
  font-weight: 700;
  color: #3b82f6;
}

.status-tag {
  font-size: 24rpx;
  padding: 6rpx 16rpx;
  border-radius: 8rpx;
}

.status-tag.pending {
  color: #f59e0b;
  background: #fffbeb;
}

.status-tag.shipped {
  color: #10b981;
  background: #ecfdf5;
}

.record-fields {
  margin-bottom: 20rpx;
}

.field-row {
  display: flex;
  margin-bottom: 12rpx;
}

.field-label {
  font-size: 26rpx;
  color: #999;
  width: 140rpx;
  flex-shrink: 0;
}

.field-value {
  font-size: 26rpx;
  color: #333;
  flex: 1;
}

.record-time {
  margin-bottom: 20rpx;
}

.time-text {
  font-size: 24rpx;
  color: #999;
}

.record-actions {
  display: flex;
  justify-content: space-around;
  border-top: 1rpx solid #f0f0f0;
  padding-top: 20rpx;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10rpx 20rpx;
}

.btn-icon {
  font-size: 32rpx;
  margin-bottom: 4rpx;
}

.btn-text {
  font-size: 22rpx;
  color: #666;
}

.action-btn.delete .btn-text {
  color: #ef4444;
}

.action-btn.quick-ship .btn-text {
  color: #3b82f6;
}

.fab-btn {
  position: fixed;
  right: 40rpx;
  bottom: 60rpx;
  width: 100rpx;
  height: 100rpx;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(59, 130, 246, 0.4);
  z-index: 50;
}

.fab-icon {
  color: #fff;
  font-size: 48rpx;
  font-weight: 300;
}

/* 弹窗样式 */
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  animation: fadeIn 0.2s ease;
}

.modal {
  background: #fff;
  border-radius: 24rpx;
  width: 600rpx;
  max-height: 800rpx;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
  flex-shrink: 0;
}

.modal-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.modal-close {
  font-size: 48rpx;
  color: #999;
  line-height: 1;
}

scroll-view.modal-body {
  padding: 30rpx;
  padding-bottom: 20rpx;
  flex: 1;
  overflow: hidden;
  height: 100%;
}

.form-item {
  margin-bottom: 30rpx;
}

.form-label {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 16rpx;
  font-weight: 500;
}

.required {
  color: #ef4444;
}

.form-input {
  height: 80rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  color: #333;
}

.form-picker {
  height: 80rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.placeholder {
  color: #999;
}

.picker-arrow {
  color: #999;
  font-size: 32rpx;
}

.form-textarea {
  height: 160rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  padding: 20rpx 24rpx;
  font-size: 28rpx;
  color: #333;
  width: 100%;
  box-sizing: border-box;
}

.switch-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-footer {
  display: flex;
  padding: 20rpx 30rpx 40rpx;
  gap: 20rpx;
  flex-shrink: 0;
}

.btn {
  flex: 1;
  height: 80rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
}

.btn-secondary {
  background: #f5f5f5;
  color: #666;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: #fff;
}

.safe-area-bottom {
  height: 140rpx;
}
</style>