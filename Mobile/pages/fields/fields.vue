<template>
  <view class="container">
    <!-- 空状态 -->
    <view v-if="fields.length === 0" class="empty-state">
      <image class="empty-icon" src="/static/empty-field.png" mode="aspectFit"></image>
      <text class="empty-title">还没有字段</text>
      <text class="empty-desc">点击添加按钮创建自定义字段</text>
    </view>

    <!-- 字段列表 -->
    <scroll-view v-else class="field-list" scroll-y>
      <view class="field-card" v-for="(field, index) in fields" :key="field.id">
        <view class="field-header">
          <view class="field-info">
            <text class="field-name">{{ field.label }}</text>
            <text class="field-type">{{ getFieldTypeName(field.type) }}</text>
          </view>
          <view class="field-required" v-if="field.required">
            <text class="required-tag">必填</text>
          </view>
        </view>
        <view class="field-meta">
          <text class="meta-text">字段名: {{ field.name }}</text>
          <text class="meta-text">排序: {{ field.sort_order }}</text>
        </view>
        <view class="field-actions">
          <text class="action-text edit" @click="editField(field)">编辑</text>
          <text class="action-text delete" @click="deleteField(field.id)">删除</text>
        </view>
      </view>
      <view class="safe-area-bottom"></view>
    </scroll-view>

    <!-- 添加按钮 -->
    <view class="fab-btn" @click="showAddModal = true">
      <text class="fab-icon">+</text>
    </view>

    <!-- 添加/编辑字段弹窗 -->
    <view v-if="showAddModal" class="modal-mask" @click="closeModal">
      <view class="modal" @click.stop>
        <view class="modal-header">
          <text class="modal-title">{{ editMode ? '编辑字段' : '添加字段' }}</text>
          <text class="modal-close" @click="closeModal">×</text>
        </view>
        <scroll-view class="modal-body" scroll-y>
          <view class="form-item">
            <text class="form-label">字段标签 <text class="required">*</text></text>
            <input 
              class="form-input" 
              v-model="fieldForm.label" 
              placeholder="如：收货地址"
            />
          </view>
          <view class="form-item">
            <text class="form-label">字段名称 <text class="required">*</text></text>
            <input 
              class="form-input" 
              v-model="fieldForm.name" 
              placeholder="如：address"
            />
            <text class="form-tip">用于系统识别，建议使用英文</text>
          </view>
          <view class="form-item">
            <text class="form-label">字段类型</text>
            <picker mode="selector" :range="fieldTypes" :value="typeIndex" @change="onTypeChange">
              <view class="form-picker">
                <text>{{ fieldTypes[typeIndex] }}</text>
                <text class="picker-arrow">›</text>
              </view>
            </picker>
          </view>
          <view class="form-item" v-if="fieldForm.type === 'select'">
            <text class="form-label">选项（每行一个）</text>
            <textarea 
              class="form-textarea" 
              v-model="fieldForm.options" 
              placeholder="选项1&#10;选项2&#10;选项3"
            />
          </view>
          <view class="form-item">
            <text class="form-label">排序</text>
            <input 
              class="form-input" 
              type="number"
              v-model="fieldForm.sort_order" 
              placeholder="数字越小越靠前"
            />
          </view>
          <view class="form-item switch-item">
            <text class="form-label">必填字段</text>
            <switch :checked="fieldForm.required" @change="onRequiredChange" color="#3b82f6" />
          </view>
        </scroll-view>
        <view class="modal-footer">
          <view class="btn btn-secondary" @click="closeModal">取消</view>
          <view class="btn btn-primary" @click="saveField">保存</view>
        </view>
      </view>
    </view>

    <!-- 复制字段配置弹窗 -->
    <view v-if="showCopyModal" class="modal-mask" @click="closeCopyModal">
      <view class="modal copy-modal">
        <view class="modal-header">
          <text class="modal-title">复制字段设置</text>
          <text class="modal-close" @click="closeCopyModal">×</text>
        </view>
        <view class="modal-body">
          <text class="copy-desc">选择要复制的字段（用于复制订单信息时显示）</text>
          <scroll-view class="copy-list" scroll-y>
            <view
              class="copy-item"
              v-for="field in fields"
              :key="field.id"
              @click="toggleCopyField(field.id)"
            >
              <checkbox :checked="copyFieldIds.includes(field.id)" color="#3b82f6" />
              <text class="copy-field-name">{{ field.label }}</text>
            </view>
          </scroll-view>
        </view>
        <view class="modal-footer">
          <view class="btn btn-secondary" @click="closeCopyModal">取消</view>
          <view class="btn btn-primary" @click="saveCopyConfig">保存</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { getFields, createField, updateField, deleteField } from '@/utils/api.js'

export default {
  data() {
    return {
      productId: null,
      productName: '',
      fields: [],
      showAddModal: false,
      showCopyModal: false,
      editMode: false,
      fieldTypes: ['文本', '多行文本', '下拉选择', '数字', '日期'],
      fieldTypeValues: ['text', 'textarea', 'select', 'number', 'date'],
      typeIndex: 0,
      fieldForm: {
        id: null,
        name: '',
        label: '',
        type: 'text',
        options: '',
        required: false,
        sort_order: 0
      },
      copyFieldIds: []
    }
  },

  onLoad(options) {
    this.productId = options.productId
    this.productName = decodeURIComponent(options.productName || '')
    uni.setNavigationBarTitle({
      title: this.productName ? `${this.productName} - 字段` : '字段管理'
    })
    this.loadFields()
    this.loadCopyConfig()
  },

  methods: {
    async loadFields() {
      try {
        const data = await getFields(this.productId)
        this.fields = data.sort((a, b) => a.sort_order - b.sort_order)
      } catch (error) {
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        })
      }
    },

    loadCopyConfig() {
      const config = uni.getStorageSync(`copy_fields_${this.productId}`)
      this.copyFieldIds = config ? JSON.parse(config) : []
    },

    getFieldTypeName(type) {
      const map = {
        text: '文本',
        textarea: '多行文本',
        select: '下拉选择',
        number: '数字',
        date: '日期'
      }
      return map[type] || type
    },

    onTypeChange(e) {
      this.typeIndex = e.detail.value
      this.fieldForm.type = this.fieldTypeValues[this.typeIndex]
    },

    onRequiredChange(e) {
      this.fieldForm.required = e.detail.value
    },

    editField(field) {
      this.editMode = true
      this.fieldForm = {
        id: field.id,
        name: field.name,
        label: field.label,
        type: field.type,
        options: field.options || '',
        required: field.required === 1,
        sort_order: field.sort_order
      }
      this.typeIndex = this.fieldTypeValues.indexOf(field.type)
      this.showAddModal = true
    },

    closeModal() {
      this.showAddModal = false
      this.editMode = false
      this.fieldForm = {
        id: null,
        name: '',
        label: '',
        type: 'text',
        options: '',
        required: false,
        sort_order: 0
      }
      this.typeIndex = 0
    },

    async saveField() {
      if (!this.fieldForm.label.trim()) {
        uni.showToast({ title: '请输入字段标签', icon: 'none' })
        return
      }
      if (!this.fieldForm.name.trim()) {
        uni.showToast({ title: '请输入字段名称', icon: 'none' })
        return
      }

      try {
        const data = {
          ...this.fieldForm,
          sort_order: parseInt(this.fieldForm.sort_order) || 0
        }
        if (this.editMode) {
          await updateField(this.fieldForm.id, data)
          uni.showToast({ title: '修改成功', icon: 'success' })
        } else {
          await createField(this.productId, data)
          uni.showToast({ title: '添加成功', icon: 'success' })
        }
        this.closeModal()
        this.loadFields()
      } catch (error) {
        uni.showToast({ title: '保存失败', icon: 'none' })
      }
    },

    deleteField(id) {
      uni.showModal({
        title: '确认删除',
        content: '删除后将无法恢复，是否继续？',
        confirmColor: '#ef4444',
        success: async (res) => {
          if (res.confirm) {
            try {
              await deleteField(id)
              uni.showToast({ title: '删除成功', icon: 'success' })
              this.loadFields()
            } catch (error) {
              uni.showToast({ title: '删除失败', icon: 'none' })
            }
          }
        }
      })
    },

    toggleCopyField(fieldId) {
      const index = this.copyFieldIds.indexOf(fieldId)
      if (index > -1) {
        this.copyFieldIds.splice(index, 1)
      } else {
        this.copyFieldIds.push(fieldId)
      }
    },

    closeCopyModal() {
      this.showCopyModal = false
    },

    saveCopyConfig() {
      uni.setStorageSync(`copy_fields_${this.productId}`, JSON.stringify(this.copyFieldIds))
      uni.showToast({ title: '保存成功', icon: 'success' })
      this.closeCopyModal()
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

.field-list {
  height: 100vh;
}

.field-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.field-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16rpx;
}

.field-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  display: block;
}

.field-type {
  font-size: 24rpx;
  color: #3b82f6;
  background: #eff6ff;
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
  margin-top: 8rpx;
  display: inline-block;
}

.required-tag {
  font-size: 22rpx;
  color: #ef4444;
  background: #fef2f2;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
}

.field-meta {
  margin-bottom: 20rpx;
}

.meta-text {
  font-size: 24rpx;
  color: #999;
  margin-right: 30rpx;
}

.field-actions {
  display: flex;
  gap: 40rpx;
  border-top: 1rpx solid #f0f0f0;
  padding-top: 20rpx;
}

.action-text {
  font-size: 28rpx;
  color: #3b82f6;
}

.action-text.delete {
  color: #ef4444;
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

.copy-modal {
  max-height: 700rpx;
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

.modal-body {
  padding: 30rpx;
  max-height: 500rpx;
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

.form-tip {
  font-size: 24rpx;
  color: #999;
  margin-top: 8rpx;
  display: block;
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

.copy-desc {
  font-size: 26rpx;
  color: #666;
  margin-bottom: 20rpx;
  display: block;
}

.copy-list {
  max-height: 400rpx;
}

.copy-item {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.copy-field-name {
  margin-left: 20rpx;
  font-size: 28rpx;
  color: #333;
}

.safe-area-bottom {
  height: 140rpx;
}
</style>