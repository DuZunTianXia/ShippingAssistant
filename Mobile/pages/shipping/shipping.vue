<template>
  <view class="container">
    <!-- 统计信息 -->
    <view class="stats-bar" v-if="records.length > 0">
      <view class="stat-item">
        <text class="stat-label">总计</text>
        <text class="stat-value stat-total">{{ stats.total }}</text>
      </view>
      <view class="stat-item">
        <text class="stat-label">已发货</text>
        <text class="stat-value stat-shipped">{{ stats.shipped }}</text>
      </view>
      <view class="stat-item">
        <text class="stat-label">待发货</text>
        <text class="stat-value stat-pending">{{ stats.pending }}</text>
      </view>
    </view>

    <!-- 状态筛选 -->
    <view class="status-filter" v-if="records.length > 0">
      <view 
        class="filter-tab" 
        :class="{ active: statusFilter === 'all' }"
        @click="statusFilter = 'all'"
      >
        全部
      </view>
      <view 
        class="filter-tab" 
        :class="{ active: statusFilter === 'pending' }"
        @click="statusFilter = 'pending'"
      >
        待发货
      </view>
      <view 
        class="filter-tab" 
        :class="{ active: statusFilter === 'shipped' }"
        @click="statusFilter = 'shipped'"
      >
        已发货
      </view>
    </view>

    <!-- 加载状态 -->
    <view v-if="loading" class="loading-state">
      <view class="loading-spinner"></view>
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 空状态 -->
    <view v-else-if="filteredRecords.length === 0" class="empty-state">
      <image class="empty-icon" src="/static/empty-record.png" mode="aspectFit"></image>
      <text class="empty-title">
        {{ statusFilter === 'pending' ? '没有待发货记录' : statusFilter === 'shipped' ? '没有已发货记录' : '还没有发货记录' }}
      </text>
      <text class="empty-desc">点击添加按钮创建发货记录</text>
    </view>

    <!-- 记录列表 -->
    <scroll-view v-if="!loading && filteredRecords.length > 0" class="record-list" scroll-y>
      <view 
        class="record-card" 
        v-for="(record, index) in filteredRecords" 
        :key="record.id"
        :class="{ 'shipped': record.status === 'shipped' }"
      >
        <view class="record-header">
          <view class="record-meta">
            <text class="record-index">#{{ index + 1 }}</text>
            <text class="record-date">{{ formatDate(record.created_at) }}</text>
          </view>
          <view class="record-status">
            <text :class="['status-tag', record.status]">
              {{ record.status === 'shipped' ? '已发货' : '待发货' }}
            </text>
          </view>
        </view>
        
        <view class="record-fields">
          <view 
            class="field-row" 
            v-for="field in displayFields" 
            :key="field.id"
          >
            <text class="field-label">{{ field.name }}:</text>
            <text class="field-value" :title="record.data[field.name]">
              {{ truncateText(record.data[field.name], 20) || '-' }}
            </text>
          </view>
          <view v-if="hasMoreFields" class="more-fields-hint" @click="showAllFields(record)">
            <text class="more-text">还有 {{ fieldList.length - maxDisplayFields }} 个字段 ></text>
          </view>
        </view>

        <view class="record-actions">
          <view class="action-btn copy" @click="copyRecord(record)">
            <svg-icon name="copy" :size="28" />
            <text class="btn-text">复制</text>
          </view>
          <view 
            class="action-btn quick-ship" 
            v-if="record.status === 'pending'"
            @click="quickShip(record.id)"
          >
            <svg-icon name="quick-ship" :size="32" />
            <text class="btn-text">发货</text>
          </view>
          <view class="action-btn edit" @click="editRecord(record)">
            <svg-icon name="edit" :size="32" />
            <text class="btn-text">编辑</text>
          </view>
          <view class="action-btn delete" @click="deleteRecord(record.id)">
            <svg-icon name="delete" :size="32" />
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
              {{ field.name }}
              <text class="required" v-if="field.required">*</text>
            </text>
            <!-- 文本输入 -->
            <input 
              v-if="field.type === 'text' || field.type === 'number'"
              class="form-input" 
              :type="field.type === 'number' ? 'number' : 'text'"
              v-model="recordForm.data[field.name]" 
              :placeholder="`请输入${field.name}`"
            />
            <!-- 多行文本 -->
            <textarea 
              v-else-if="field.type === 'textarea'"
              class="form-textarea" 
              v-model="recordForm.data[field.name]" 
              :placeholder="`请输入${field.name}`"
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
                  {{ recordForm.data[field.name] || `请选择${field.name}` }}
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
import { getRecords, createRecord, updateRecord, deleteRecord, getFields, getRecordStats } from '@/utils/api.js'
import SvgIcon from '@/components/SvgIcon.vue'

export default {
  components: {
    SvgIcon
  },
  data() {
    return {
      productId: null,
      productName: '',
      records: [],
      fields: [],
      copyFieldIds: [],
      showAddModal: false,
      editMode: false,
      statusFilter: 'all',
      maxDisplayFields: 3,
      loading: false,
      stats: { total: 0, shipped: 0, pending: 0 },
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
    },
    // 显示的字段列表（限制数量）
    displayFields() {
      return this.fieldList.slice(0, this.maxDisplayFields)
    },
    // 是否有更多字段
    hasMoreFields() {
      return this.fieldList.length > this.maxDisplayFields
    },
    // 筛选后的记录
    filteredRecords() {
      if (this.statusFilter === 'all') {
        return this.records
      }
      return this.records.filter(r => r.status === this.statusFilter)
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
      this.loading = true
      await this.loadFields()
      await this.loadRecords()
      await this.loadStats()
      this.loadCopyConfig()
      this.loading = false
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

    async loadStats() {
      try {
        const data = await getRecordStats(this.productId)
        if (data.success) {
          this.stats = data.stats
        }
      } catch (error) {
        console.error('加载统计失败:', error)
      }
    },

    // 截断文本
    truncateText(text, maxLength) {
      if (!text) return ''
      if (text.length <= maxLength) return text
      return text.slice(0, maxLength) + '...'
    },

    // 显示所有字段（弹窗或展开）
    showAllFields(record) {
      // 跳转到详情页或展开显示
      uni.navigateTo({
        url: `/pages/record-detail/record-detail?recordId=${record.id}&productId=${this.productId}`
      })
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
        lines.push(`${field.name}: ${value}`)
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
          uni.showToast({ title: `请填写${field.name}`, icon: 'none' })
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
  background-color: #EFF6FF;
}

/* 统计信息栏 */
.stats-bar {
  display: flex;
  justify-content: space-around;
  padding: 20rpx 24rpx;
  background: linear-gradient(135deg, #fff 0%, #f8fafc 100%);
  border-bottom: 1rpx solid #E2E8F0;
  margin-bottom: 8rpx;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.stat-label {
  font-size: 24rpx;
  color: #64748B;
}

.stat-value {
  font-size: 36rpx;
  font-weight: 700;
}

.stat-total {
  color: #1E293B;
}

.stat-shipped {
  color: #10B981;
}

.stat-pending {
  color: #F59E0B;
}

/* 状态筛选栏 */
.status-filter {
  display: flex;
  padding: 16rpx 24rpx;
  background: #fff;
  border-bottom: 1rpx solid #E2E8F0;
  gap: 16rpx;
}

.filter-tab {
  font-size: 26rpx;
  padding: 10rpx 24rpx;
  background: #F1F5F9;
  color: #64748B;
  border-radius: 24rpx;
  font-weight: 500;
}

.filter-tab.active {
  background: #2563EB;
  color: #fff;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 200rpx 40rpx;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 200rpx 40rpx;
}

.loading-spinner {
  width: 60rpx;
  height: 60rpx;
  border: 4rpx solid #E2E8F0;
  border-top-color: #2563EB;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20rpx;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: 28rpx;
  color: #64748B;
}

.empty-title {
  font-size: 32rpx;
  color: #1E40AF;
  font-weight: 600;
  margin-bottom: 16rpx;
}

.empty-desc {
  font-size: 28rpx;
  color: #64748B;
}

.record-list {
  height: 100vh;
  padding: 0 20rpx;
}

.record-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 16rpx 20rpx;
  margin-bottom: 12rpx;
  border-left: 4rpx solid #F97316;
  box-shadow: 0 2rpx 8rpx rgba(37, 99, 235, 0.06);
}

.record-card.shipped {
  border-left-color: #10B981;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;
}

.record-meta {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.record-index {
  font-size: 28rpx;
  font-weight: 700;
  color: #2563EB;
}

.record-date {
  font-size: 20rpx;
  color: #94A3B8;
  margin-left: 12rpx;
}

.record-status {
  flex-shrink: 0;
}

.status-tag {
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
  font-weight: 500;
}

.status-tag.pending {
  color: #F97316;
  background: #FFF7ED;
}

.status-tag.shipped {
  color: #10B981;
  background: #ECFDF5;
}

.record-fields {
  margin-bottom: 8rpx;
}

.field-row {
  display: flex;
  margin-bottom: 4rpx;
  line-height: 1.3;
}

.field-label {
  font-size: 22rpx;
  color: #94A3B8;
  width: 100rpx;
  flex-shrink: 0;
}

.field-value {
  font-size: 24rpx;
  color: #334155;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.more-fields-hint {
  margin-top: 8rpx;
  padding: 8rpx 0;
  text-align: center;
}

.more-text {
  font-size: 22rpx;
  color: #64748B;
}

.record-time {
  margin-bottom: 8rpx;
}

.time-text {
  font-size: 20rpx;
  color: #94A3B8;
}

.record-actions {
  display: flex;
  justify-content: space-around;
  border-top: 1rpx solid #E2E8F0;
  padding-top: 12rpx;
  margin-top: 4rpx;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8rpx 12rpx;
  min-width: 60rpx;
}

.action-btn:active {
  opacity: 0.7;
}

.btn-text {
  font-size: 20rpx;
  color: #64748B;
  margin-top: 4rpx;
}

.action-btn.delete .btn-text {
  color: #EF4444;
}

.action-btn.quick-ship .btn-text {
  color: #2563EB;
}

.fab-btn {
  position: fixed;
  right: 40rpx;
  bottom: 60rpx;
  width: 100rpx;
  height: 100rpx;
  background: linear-gradient(135deg, #F97316 0%, #EA580C 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(249, 115, 22, 0.4);
  z-index: 50;
  transition: all 200ms ease;
}

.fab-btn:active {
  transform: scale(0.95);
}

.fab-icon {
  color: #fff;
  font-size: 48rpx;
}

/* 弹窗样式 */
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(30, 64, 175, 0.4);
  backdrop-filter: blur(4px);
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
  box-shadow: 0 20rpx 40rpx rgba(37, 99, 235, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #E2E8F0;
  flex-shrink: 0;
}

.modal-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1E40AF;
}

.modal-close {
  font-size: 48rpx;
  color: #94A3B8;
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
  margin-bottom: 24rpx;
}

.form-label {
  display: block;
  font-size: 28rpx;
  color: #334155;
  margin-bottom: 12rpx;
  font-weight: 500;
}

.required {
  color: #ef4444;
}

.form-input {
  height: 80rpx;
  background: #F1F5F9;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  color: #334155;
  border: 1rpx solid transparent;
}

.form-input:focus {
  border-color: #2563EB;
  background: #fff;
}

.form-picker {
  height: 80rpx;
  background: #F1F5F9;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  color: #334155;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.placeholder {
  color: #94A3B8;
}

.picker-arrow {
  color: #64748B;
  font-size: 32rpx;
}

.form-textarea {
  height: 160rpx;
  background: #F1F5F9;
  border-radius: 12rpx;
  padding: 20rpx 24rpx;
  font-size: 28rpx;
  color: #334155;
  width: 100%;
  box-sizing: border-box;
  border: 1rpx solid transparent;
}

.form-textarea:focus {
  border-color: #2563EB;
  background: #fff;
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
  border-radius: 16rpx;
  font-size: 28rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  transition: all 200ms ease;
}

.btn-secondary {
  background: #F1F5F9;
  color: #64748B;
}

.btn-secondary:active {
  background: #E2E8F0;
}

.btn-primary {
  background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
  color: #fff;
  box-shadow: 0 4rpx 12rpx rgba(37, 99, 235, 0.3);
}

.btn-primary:active {
  transform: translateY(-2rpx);
  box-shadow: 0 8rpx 16rpx rgba(37, 99, 235, 0.4);
}

.safe-area-bottom {
  height: 140rpx;
}
</style>