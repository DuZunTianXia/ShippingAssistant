<template>
  <view class="container">
    <!-- 搜索栏 -->
    <view class="search-bar" v-if="records.length > 0">
      <view class="search-field-selector">
        <picker 
          mode="selector" 
          :range="searchFieldOptions"
          range-key="label"
          :value="searchFieldIndex"
          @change="onSearchFieldChange"
        >
          <view class="search-picker">
            <text class="search-field-text">{{ searchFieldOptions[searchFieldIndex].label }}</text>
            <text class="picker-arrow">›</text>
          </view>
        </picker>
      </view>
      <view class="search-input-wrapper">
        <input 
          class="search-input" 
          v-model="searchKeyword" 
          :placeholder="`搜索${searchFieldOptions[searchFieldIndex].label}`"
          @input="onSearchInput"
        />
        <view class="search-clear" v-if="searchKeyword" @click="clearSearch">
          <text>×</text>
        </view>
      </view>
    </view>

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
      <view class="stat-item" v-if="searchKeyword">
        <text class="stat-label">搜索结果</text>
        <text class="stat-value stat-search">{{ filteredRecords.length }}</text>
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
      <view class="filter-spacer"></view>
      <!-- 多选模式切换 -->
      <view 
        v-if="!batchMode"
        class="batch-toggle-btn"
        @click="enterBatchMode"
      >
        <svg-icon name="checkbox" :size="24" />
        <text>多选</text>
      </view>
      <view 
        v-else
        class="batch-toggle-btn active"
        @click="exitBatchMode"
      >
        <text>取消</text>
      </view>
    </view>

    <!-- 批量操作栏 -->
    <view class="batch-actions" v-if="batchMode && filteredRecords.length > 0">
      <view class="batch-left">
        <view class="batch-btn" @click="selectAll">
          <text>全选</text>
        </view>
        <view class="batch-btn" @click="selectNone">
          <text>取消</text>
        </view>
        <!-- 输入指定数量选择 -->
        <view class="quick-select-group">
          <input 
            class="select-input" 
            type="number" 
            v-model="selectCount" 
            placeholder="数量"
            :max="filteredRecords.length"
            min="1"
          />
          <view class="batch-btn select-btn" @click="quickSelectByInput">
            <text>选择</text>
          </view>
        </view>
        <text class="selected-count" v-if="selectedRecordIds.length > 0">
          已选 {{ selectedRecordIds.length }} 条
        </text>
      </view>
      <view 
        class="batch-copy-btn" 
        :class="{ disabled: selectedRecordIds.length === 0 }"
        @click="batchExportTxt"
      >
        <svg-icon name="file-text" :size="24" />
        <text>导出TXT</text>
      </view>
    </view>

    <!-- 附加信息栏（非批量模式） -->
    <view class="attach-bar" v-if="!batchMode && records.length > 0">
      <view class="attach-left" @click="showAttachModal = true">
        <svg-icon name="edit" :size="24" />
        <text class="attach-text" :class="{ empty: !attachmentText }">
          {{ attachmentText ? '已设置附加信息' : '添加附加信息' }}
        </text>
      </view>
      <view class="attach-toggle" @click.stop="attachEnabled = !attachEnabled">
        <view class="attach-checkbox" :class="{ checked: attachEnabled }">
          <text v-if="attachEnabled">✓</text>
        </view>
        <text class="attach-label">追加</text>
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
        :class="{ 
          'shipped': record.status === 'shipped',
          'selected': isSelected(record.id)
        }"
        @click="onCardClick(record)"
      >
        <view class="record-header">
          <view class="record-meta">
            <!-- 复选框 -->
            <view 
              v-if="batchMode"
              class="record-checkbox"
              :class="{ checked: isSelected(record.id) }"
              @click.stop="toggleSelection(record.id)"
            >
              <text v-if="isSelected(record.id)">✓</text>
            </view>
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
            <text class="field-label">{{ field.label || field.name }}:</text>
            <text class="field-value" :title="getFieldValue(record, field)">
              {{ truncateText(getFieldValue(record, field), 20) || '-' }}
            </text>
          </view>
          <view v-if="hasMoreFields" class="more-fields-hint" @click="showAllFields(record)">
            <text class="more-text">还有 {{ fieldList.length - maxDisplayFields }} 个字段 ></text>
          </view>
        </view>

        <view class="record-actions">
          <view class="action-btn copy" @click.stop="copyRecord(record)">
            <svg-icon name="copy" :size="28" />
            <text class="btn-text">复制</text>
          </view>
          <view class="action-btn export" @click.stop="exportRecordToTxt(record)">
            <svg-icon name="file-text" :size="28" />
            <text class="btn-text">导出</text>
          </view>
          <view 
            class="action-btn quick-ship" 
            v-if="record.status === 'pending'"
            @click.stop="quickShip(record.id)"
          >
            <svg-icon name="quick-ship" :size="32" />
            <text class="btn-text">发货</text>
          </view>
          <view class="action-btn edit" @click.stop="editRecord(record)">
            <svg-icon name="edit" :size="32" />
            <text class="btn-text">编辑</text>
          </view>
          <view class="action-btn delete" @click.stop="deleteRecord(record.id)">
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
              {{ field.label || field.name }}
              <text class="required" v-if="field.required">*</text>
            </text>
            <!-- 文本输入 -->
            <input 
              v-if="field.type === 'text' || field.type === 'number'"
              class="form-input" 
              :type="field.type === 'number' ? 'number' : 'text'"
              v-model="recordForm.data[field.name]" 
              :placeholder="`请输入${field.label || field.name}`"
            />
            <!-- 多行文本 -->
            <textarea 
              v-else-if="field.type === 'textarea'"
              class="form-textarea" 
              v-model="recordForm.data[field.name]" 
              :placeholder="`请输入${field.label || field.name}`"
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
                  {{ recordForm.data[field.name] || `请选择${field.label || field.name}` }}
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

    <!-- 附加信息输入弹窗 -->
    <view v-if="showAttachModal" class="modal-mask" @click="showAttachModal = false">
      <view class="modal" @click.stop>
        <view class="modal-header">
          <text class="modal-title">附加信息</text>
          <text class="modal-close" @click="showAttachModal = false">×</text>
        </view>
        <view class="modal-body">
          <textarea
            class="form-textarea"
            v-model="attachmentText"
            placeholder="请输入附加信息（复制时会追加到内容后面）"
            maxlength="500"
          />
          <text class="char-count">{{ attachmentText.length }}/500</text>
        </view>
        <view class="modal-footer">
          <view class="btn btn-secondary" @click="showAttachModal = false">取消</view>
          <view class="btn btn-primary" @click="saveAttachment">保存</view>
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
      statusFilter: 'pending',
      maxDisplayFields: 3,
      loading: false,
      stats: { total: 0, shipped: 0, pending: 0 },
      recordForm: {
        id: null,
        data: {},
        status: 'pending'
      },
      // 多选复制相关
      selectedRecordIds: [],
      batchMode: false,
      selectCount: '', // 输入的选择数量
      // 搜索相关
      searchKeyword: '',
      searchFieldIndex: 0,
      // 批量发货加载状态
      batchShippingLoading: false,
      // 附加信息相关
      attachmentText: '',
      attachEnabled: false,
      showAttachModal: false
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
    // 搜索字段选项
    searchFieldOptions() {
      const options = [{ label: '全部字段', value: 'all' }]
      this.fieldList.forEach(field => {
        options.push({
          label: field.label || field.name,
          value: field.name
        })
      })
      return options
    },
    // 筛选后的记录
    filteredRecords() {
      let records = this.records
      
      // 状态筛选
      if (this.statusFilter !== 'all') {
        records = records.filter(r => r.status === this.statusFilter)
      }
      
      // 搜索筛选
      if (this.searchKeyword) {
        const keyword = this.searchKeyword.toLowerCase()
        const searchField = this.searchFieldOptions[this.searchFieldIndex].value
        
        records = records.filter(record => {
          if (searchField === 'all') {
            // 搜索所有字段
            return this.fieldList.some(field => {
              const value = this.getFieldValue(record, field) || ''
              return value.toString().toLowerCase().includes(keyword)
            })
          } else {
            // 搜索指定字段
            const value = this.getFieldValue(record, { name: searchField }) || ''
            return value.toString().toLowerCase().includes(keyword)
          }
        })
      }
      
      return records
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
      // 加载本地存储的附加信息
      const attachText = uni.getStorageSync(`attachment_${this.productId}`)
      if (attachText) {
        this.attachmentText = attachText
      }
      const attachEnabled = uni.getStorageSync(`attach_enabled_${this.productId}`)
      if (attachEnabled !== '') {
        this.attachEnabled = attachEnabled === 'true' || attachEnabled === true
      }
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

    // 获取字段值（兼容旧数据的中文键名）
    getFieldValue(record, field) {
      // 优先使用新的英文键名（field.name），如果没有再尝试旧的中文键名（field.label）
      return record.data[field.name] ?? record.data[field.label]
    },

    copyRecord(record) {
      const lines = []
      this.fieldList.forEach(field => {
        const value = this.getFieldValue(record, field) || ''
        lines.push(`${field.label || field.name}: ${value}`)
      })
      
      // 如果启用附加信息，追加到内容后面
      if (this.attachEnabled && this.attachmentText) {
        lines.push('')
        lines.push(this.attachmentText)
      }
      
      const text = lines.join('\n')
      
      uni.setClipboardData({
        data: text,
        success: () => {
          // 延迟执行，避免与系统提示冲突
          setTimeout(() => {
            uni.hideToast()
            
            // 如果待发货，询问是否标记为已发货
            if (record.status === 'pending') {
              uni.showModal({
                title: '是否标记为已发货？',
                content: '复制成功，是否将此订单标记为已发货？',
                confirmColor: '#10B981',
                confirmText: '标记发货',
                cancelText: '取消',
                success: async (res) => {
                  if (res.confirm) {
                    // 显示加载提示
                    uni.showLoading({ title: '标记中...' })
                    try {
                      await updateRecord(record.id, {
                        ...record,
                        status: 'shipped'
                      })
                      uni.hideLoading()
                      uni.showToast({ title: '已发货', icon: 'success' })
                      this.loadData()
                    } catch (error) {
                      uni.hideLoading()
                      uni.showToast({ title: '标记发货失败', icon: 'none' })
                    }
                  }
                }
              })
            } else {
              uni.showToast({ title: '复制成功', icon: 'success' })
            }
          }, 800)
        }
      })
    },

    quickShip(id) {
      uni.showModal({
        title: '确认发货',
        content: '确定标记此订单为已发货？',
        success: async (res) => {
          if (res.confirm) {
            // 显示加载提示
            uni.showLoading({ title: '标记中...' })
            try {
              const record = this.records.find(r => r.id === id)
              await updateRecord(id, {
                ...record,
                status: 'shipped'
              })
              uni.hideLoading()
              uni.showToast({ title: '发货成功', icon: 'success' })
              this.loadRecords()
            } catch (error) {
              uni.hideLoading()
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
    },

    // 多选相关方法
    enterBatchMode() {
      this.batchMode = true
      this.selectedRecordIds = []
      this.selectCount = '' // 清空输入框
    },

    exitBatchMode() {
      this.batchMode = false
      this.selectedRecordIds = []
      this.selectCount = '' // 清空输入框
    },

    isSelected(id) {
      return this.selectedRecordIds.includes(id)
    },

    toggleSelection(id) {
      const index = this.selectedRecordIds.indexOf(id)
      if (index > -1) {
        this.selectedRecordIds.splice(index, 1)
      } else {
        this.selectedRecordIds.push(id)
      }
    },

    onCardClick(record) {
      if (this.batchMode) {
        this.toggleSelection(record.id)
      }
    },

    selectAll() {
      this.selectedRecordIds = this.filteredRecords.map(r => r.id)
    },

    selectNone() {
      this.selectedRecordIds = []
    },

    quickSelect(count) {
      // 快速选择指定数量的记录（从当前筛选结果的前N条开始选择）
      this.selectedRecordIds = this.filteredRecords.slice(0, count).map(r => r.id)
    },

    quickSelectByInput() {
      const count = parseInt(this.selectCount)
      if (!count || count <= 0) {
        uni.showToast({ title: '请输入有效数量', icon: 'none' })
        return
      }
      if (count > this.filteredRecords.length) {
        uni.showToast({ title: `最多只能选择${this.filteredRecords.length}条`, icon: 'none' })
        return
      }
      // 选择前N条记录
      this.selectedRecordIds = this.filteredRecords.slice(0, count).map(r => r.id)
      uni.showToast({ title: `已选择${count}条记录`, icon: 'success' })
    },

    // 搜索相关方法
    onSearchFieldChange(e) {
      this.searchFieldIndex = e.detail.value
      // 如果有搜索关键词，重新执行搜索
      if (this.searchKeyword) {
        this.onSearchInput()
      }
    },

    onSearchInput() {
      // 搜索时自动退出批量模式
      if (this.batchMode) {
        this.exitBatchMode()
      }
    },

    clearSearch() {
      this.searchKeyword = ''
      this.searchFieldIndex = 0
    },

    batchCopy() {
      if (this.selectedRecordIds.length === 0) {
        uni.showToast({ title: '请先选择记录', icon: 'none' })
        return
      }

      const selectedRecords = this.records.filter(r => this.selectedRecordIds.includes(r.id))
      const allLines = []

      selectedRecords.forEach((record, index) => {
        if (index > 0) {
          allLines.push('') // 记录之间用空行分隔
        }
        
        allLines.push(`--- 记录 #${index + 1} ---`)
        this.fieldList.forEach(field => {
          const value = this.getFieldValue(record, field) || ''
          allLines.push(`${field.label || field.name}: ${value}`)
        })
      })

      // 如果启用附加信息，追加到内容后面
      if (this.attachEnabled && this.attachmentText) {
        allLines.push('')
        allLines.push(this.attachmentText)
      }

      const text = allLines.join('\n')

      uni.setClipboardData({
        data: text,
        success: () => {
          // 延迟执行，避免与系统提示冲突
          setTimeout(() => {
            // 隐藏系统默认提示
            uni.hideToast()
            
            // 检查是否有待发货记录
            const pendingRecords = selectedRecords.filter(r => r.status === 'pending')
            
            if (pendingRecords.length > 0) {
              // 有未发货记录，显示确认对话框
              uni.showModal({
                title: '是否标记为已发货？',
                content: `复制的 ${selectedRecords.length} 条记录中有 ${pendingRecords.length} 条待发货，是否标记为已发货？`,
                confirmColor: '#10B981',
                confirmText: '标记发货',
                cancelText: '取消',
                success: async (res) => {
                  if (res.confirm) {
                    await this.batchMarkShipped(pendingRecords)
                  }
                }
              })
            } else {
              // 没有待发货记录，只显示复制成功
              uni.showToast({ 
                title: `已复制 ${selectedRecords.length} 条`, 
                icon: 'success' 
              })
              setTimeout(() => {
                this.exitBatchMode()
              }, 1000)
            }
          }, 800)
        }
      })
    },

    // 批量标记发货
    async batchMarkShipped(pendingRecords) {
      if (this.batchShippingLoading) return // 防止重复操作
      
      this.batchShippingLoading = true
      let successCount = 0
      let failCount = 0
      
      // 显示进度提示
      uni.showLoading({ 
        title: `标记中 0/${pendingRecords.length}`,
        mask: true 
      })
      
      try {
        for (let i = 0; i < pendingRecords.length; i++) {
          const record = pendingRecords[i]
          try {
            await updateRecord(record.id, {
              ...record,
              status: 'shipped'
            })
            successCount++
            
            // 更新进度
            uni.showLoading({ 
              title: `标记中 ${successCount + failCount}/${pendingRecords.length}`,
              mask: true 
            })
          } catch (error) {
            failCount++
            console.error(`标记记录 ${record.id} 失败:`, error)
          }
        }
        
        uni.hideLoading()
        
        // 显示结果
        if (failCount === 0) {
          uni.showToast({ 
            title: `已发货 ${successCount} 条`, 
            icon: 'success' 
          })
        } else {
          uni.showModal({
            title: '批量发货完成',
            content: `成功: ${successCount} 条\n失败: ${failCount} 条`,
            showCancel: false,
            confirmText: '知道了'
          })
        }
        
        this.loadData()
        this.exitBatchMode()
        
      } catch (error) {
        uni.hideLoading()
        uni.showToast({ title: '批量发货失败', icon: 'none' })
      } finally {
        this.batchShippingLoading = false
      }
    },

    // 保存附加信息到本地
    saveAttachment() {
      uni.setStorageSync(`attachment_${this.productId}`, this.attachmentText)
      uni.setStorageSync(`attach_enabled_${this.productId}`, this.attachEnabled.toString())
      this.showAttachModal = false
      uni.showToast({ title: '已保存', icon: 'success' })
    },

    // 单个记录导出为TXT
    exportRecordToTxt(record) {
      const lines = []
      
      this.fieldList.forEach(field => {
        const value = this.getFieldValue(record, field) || ''
        lines.push(`${field.label || field.name}: ${value}`)
      })
      
      // 如果启用附加信息，追加到内容后面
      if (this.attachEnabled && this.attachmentText) {
        lines.push('')
        lines.push(this.attachmentText)
      }
      
      const content = lines.join('\n')
      const fileName = `record_${record.id}_${Date.now()}.txt`
      
      this.saveTxtFile(content, fileName)
    },

    // 批量导出为TXT
    batchExportTxt() {
      if (this.selectedRecordIds.length === 0) {
        uni.showToast({ title: '请先选择记录', icon: 'none' })
        return
      }

      const selectedRecords = this.records.filter(r => this.selectedRecordIds.includes(r.id))
      const lines = []

      selectedRecords.forEach((record, index) => {
        if (index > 0) {
          lines.push('') // 记录之间用空行分隔
        }
        
        lines.push(`--- 记录 #${index + 1} ---`)
        this.fieldList.forEach(field => {
          const value = this.getFieldValue(record, field) || ''
          lines.push(`${field.label || field.name}: ${value}`)
        })
      })

      // 如果启用附加信息，追加到内容后面
      if (this.attachEnabled && this.attachmentText) {
        lines.push('')
        lines.push(this.attachmentText)
      }

      const content = lines.join('\n')
      const fileName = `batch_export_${this.productName}_${Date.now()}.txt`
      
      this.saveTxtFile(content, fileName)
      
      // 询问是否标记为已发货
      const pendingRecords = selectedRecords.filter(r => r.status === 'pending')
      if (pendingRecords.length > 0) {
        setTimeout(() => {
          uni.showModal({
            title: '是否标记为已发货？',
            content: `导出的 ${selectedRecords.length} 条记录中有 ${pendingRecords.length} 条待发货，是否标记为已发货？`,
            confirmColor: '#10B981',
            confirmText: '标记发货',
            cancelText: '取消',
            success: async (res) => {
              if (res.confirm) {
                await this.batchMarkShipped(pendingRecords)
              }
            }
          })
        }, 800)
      } else {
        setTimeout(() => {
          this.exitBatchMode()
        }, 1000)
      }
    },

    // 保存TXT文件 - 使用剪贴板作为最可靠的跨平台方案
    saveTxtFile(content, fileName) {
      uni.setClipboardData({
        data: content,
        success: () => {
          uni.showModal({
            title: '导出成功',
            content: `内容已复制到剪贴板，文件名参考：${fileName}\n\n请粘贴到文本编辑器中保存为 .txt 文件`,
            showCancel: false,
            confirmText: '知道了'
          })
        },
        fail: () => {
          uni.showToast({ title: '导出失败', icon: 'none' })
        }
      })
    },

    // 打开或复制TXT
    openOrCopyTxt(filePath, content) {
      uni.openDocument({
        filePath: filePath,
        fileType: 'txt',
        showMenu: true,
        success: () => {
          uni.showToast({ title: '导出成功', icon: 'success' })
        },
        fail: () => {
          this.copyToClipboard(content)
        }
      })
    },

    // 复制到剪贴板
    copyToClipboard(content) {
      uni.setClipboardData({
        data: content,
        success: () => {
          uni.showModal({
            title: '内容已复制',
            content: '请手动粘贴内容保存为TXT文件',
            showCancel: false,
            confirmText: '知道了'
          })
        },
        fail: () => {
          uni.showToast({ title: '导出失败', icon: 'none' })
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

/* 搜索栏 */
.search-bar {
  display: flex;
  padding: 16rpx 24rpx;
  background: #fff;
  border-bottom: 1rpx solid #E2E8F0;
  gap: 12rpx;
}

.search-field-selector {
  flex-shrink: 0;
}

.search-picker {
  height: 64rpx;
  background: #F1F5F9;
  border-radius: 8rpx;
  padding: 0 16rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 120rpx;
}

.search-field-text {
  font-size: 24rpx;
  color: #334155;
}

.search-input-wrapper {
  flex: 1;
  position: relative;
}

.search-input {
  height: 64rpx;
  background: #F1F5F9;
  border-radius: 8rpx;
  padding: 0 16rpx;
  padding-right: 60rpx;
  font-size: 26rpx;
  color: #334155;
  width: 100%;
  box-sizing: border-box;
}

.search-clear {
  position: absolute;
  right: 16rpx;
  top: 50%;
  transform: translateY(-50%);
  width: 32rpx;
  height: 32rpx;
  background: #CBD5E1;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-clear text {
  color: #fff;
  font-size: 24rpx;
  line-height: 1;
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

.stat-search {
  color: #2563EB;
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

.filter-spacer {
  flex: 1;
}

/* 多选切换按钮 */
.batch-toggle-btn {
  display: flex;
  align-items: center;
  gap: 6rpx;
  font-size: 24rpx;
  color: #2563EB;
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
  background: #EFF6FF;
}

.batch-toggle-btn.active {
  background: #FEE2E2;
  color: #EF4444;
}

/* 批量操作栏 */
.batch-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 24rpx;
  background: #fff;
  border-bottom: 1rpx solid #E2E8F0;
}

.batch-left {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex: 1;
  flex-wrap: wrap;
}

.batch-btn {
  font-size: 22rpx;
  padding: 6rpx 16rpx;
  background: #F1F5F9;
  color: #64748B;
  border-radius: 6rpx;
  white-space: nowrap;
}

.quick-select-group {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.select-input {
  width: 80rpx;
  height: 56rpx;
  background: #fff;
  border: 1rpx solid #E2E8F0;
  border-radius: 6rpx;
  padding: 0 12rpx;
  font-size: 22rpx;
  text-align: center;
}

.select-btn {
  background: #EFF6FF;
  color: #2563EB;
}

.selected-count {
  font-size: 24rpx;
  color: #2563EB;
  font-weight: 500;
  margin-left: 8rpx;
}

.batch-copy-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 24rpx;
  padding: 10rpx 24rpx;
  background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
  color: #fff;
  border-radius: 8rpx;
}

.batch-copy-btn.disabled {
  background: #CBD5E1;
  color: #94A3B8;
}

/* 附加信息栏 */
.attach-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 24rpx;
  background: #fff;
  border-bottom: 1rpx solid #E2E8F0;
}

.attach-left {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex: 1;
}

.attach-text {
  font-size: 26rpx;
  color: #334155;
}

.attach-text.empty {
  color: #94A3B8;
}

.attach-toggle {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 8rpx 16rpx;
  background: #F1F5F9;
  border-radius: 8rpx;
}

.attach-checkbox {
  width: 36rpx;
  height: 36rpx;
  border: 2rpx solid #CBD5E1;
  border-radius: 6rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.attach-checkbox.checked {
  background: #2563EB;
  border-color: #2563EB;
}

.attach-checkbox text {
  color: #fff;
  font-size: 20rpx;
  font-weight: bold;
}

.attach-label {
  font-size: 24rpx;
  color: #64748B;
}

/* 字符计数 */
.char-count {
  font-size: 24rpx;
  color: #94A3B8;
  text-align: right;
  margin-top: 12rpx;
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

.record-card.selected {
  background: #EFF6FF;
  border-left-color: #2563EB;
  box-shadow: 0 4rpx 16rpx rgba(37, 99, 235, 0.15);
}

/* 复选框样式 */
.record-checkbox {
  width: 40rpx;
  height: 40rpx;
  border: 2rpx solid #CBD5E1;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12rpx;
  flex-shrink: 0;
}

.record-checkbox.checked {
  background: #2563EB;
  border-color: #2563EB;
}

.record-checkbox text {
  color: #fff;
  font-size: 24rpx;
  font-weight: bold;
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

.action-btn.export .btn-text {
  color: #10B981;
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