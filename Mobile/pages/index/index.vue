<template>
  <view class="container">
    <!-- 页面内容 -->
    <scroll-view class="page-content" scroll-y>
      <!-- 加载状态 -->
      <view v-if="loading" class="loading-state">
        <view class="loading-spinner"></view>
        <text class="loading-text">加载中...</text>
      </view>

      <!-- 空状态 -->
      <view v-else-if="products.length === 0" class="empty-state">
        <image class="empty-icon" src="/static/empty-box.png" mode="aspectFit"></image>
        <text class="empty-title">还没有商品</text>
        <text class="empty-desc">点击添加按钮创建你的第一个商品</text>
      </view>

      <!-- 商品列表 -->
      <view v-else class="product-list">
        <view
          v-for="product in products"
          :key="product.id"
          class="product-card"
          @click="goToShipping(product)"
        >
          <view class="product-header">
            <view class="product-icon">
              <svg-icon name="product" :size="40" />
            </view>
            <view class="product-info">
              <text class="product-name">{{ product.name }}</text>
              <text class="product-desc">{{ product.description || '暂无描述' }}</text>
            </view>
          </view>

          <!-- 统计信息 -->
          <view class="product-stats" v-if="product.stats">
            <view class="stat-item">
              <text class="stat-label">总计</text>
              <text class="stat-value stat-total">{{ product.stats.total || 0 }}</text>
            </view>
            <view class="stat-item">
              <text class="stat-label">已发货</text>
              <text class="stat-value stat-shipped">{{ product.stats.shipped || 0 }}</text>
            </view>
            <view class="stat-item">
              <text class="stat-label">待发货</text>
              <text class="stat-value stat-pending">{{ product.stats.pending || 0 }}</text>
            </view>
          </view>

          <view class="product-meta">
            <text class="meta-text">{{ formatDate(product.created_at) }}</text>
          </view>

          <view class="product-actions">
            <view class="action-btn" @click.stop="goToFields(product)">
              <svg-icon name="fields" :size="36" />
              <text class="btn-text">字段</text>
            </view>
            <view class="action-btn" @click.stop="goToShipping(product)">
              <svg-icon name="shipping" :size="36" />
              <text class="btn-text">发货</text>
            </view>
            <view class="action-btn edit" @click.stop="editProduct(product)">
              <svg-icon name="edit" :size="36" />
              <text class="btn-text">编辑</text>
            </view>
            <view class="action-btn delete" @click.stop="deleteProduct(product.id)">
              <svg-icon name="delete" :size="36" />
              <text class="btn-text">删除</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 底部安全区 -->
      <view class="safe-area-bottom"></view>
    </scroll-view>

    <!-- 添加按钮 -->
    <view class="fab-btn" @click="showAddModal = true">
      <text class="fab-icon">+</text>
    </view>

    <!-- 添加/编辑商品弹窗 -->
    <view v-if="showAddModal" class="modal-mask" @click="closeModal">
      <view class="modal" @click.stop>
        <view class="modal-header">
          <text class="modal-title">{{ editMode ? '编辑商品' : '添加商品' }}</text>
          <text class="modal-close" @click="closeModal">×</text>
        </view>
        <view class="modal-body">
          <view class="form-item">
            <text class="form-label">商品名称</text>
            <input
              class="form-input"
              v-model="productForm.name"
              placeholder="请输入商品名称"
            />
          </view>
          <view class="form-item">
            <text class="form-label">商品描述</text>
            <textarea
              class="form-textarea"
              v-model="productForm.description"
              placeholder="请输入商品描述（可选）"
            />
          </view>
        </view>
        <view class="modal-footer">
          <view class="btn btn-secondary" @click="closeModal">取消</view>
          <view class="btn btn-primary" @click="saveProduct">保存</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { getProducts, createProduct, updateProduct, deleteProduct, getRecordStats } from '@/utils/api.js'
import SvgIcon from '@/components/SvgIcon.vue'

export default {
  components: {
    SvgIcon
  },
  data() {
    return {
      products: [],
      showAddModal: false,
      editMode: false,
      loading: false,
      productForm: {
        id: null,
        name: '',
        description: ''
      }
    }
  },

  onLoad() {
    this.loadProducts()
  },

  onShow() {
    this.loadProducts()
  },

  methods: {
    async loadProducts() {
      this.loading = true
      try {
        const data = await getProducts()
        // 为每个商品加载统计数据
        const productsWithStats = await Promise.all(
          data.map(async (product) => {
            try {
              const statsData = await getRecordStats(product.id)
              return {
                ...product,
                stats: statsData.success ? statsData.stats : null
              }
            } catch (error) {
              return { ...product, stats: null }
            }
          })
        )
        this.products = productsWithStats
      } catch (error) {
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },

    formatDate(dateStr) {
      if (!dateStr) return ''
      const date = new Date(dateStr)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    },

    goToFields(product) {
      uni.navigateTo({
        url: `/pages/fields/fields?productId=${product.id}&productName=${encodeURIComponent(product.name)}`
      })
    },

    goToShipping(product) {
      uni.navigateTo({
        url: `/pages/shipping/shipping?productId=${product.id}&productName=${encodeURIComponent(product.name)}`
      })
    },

    editProduct(product) {
      this.editMode = true
      this.productForm = {
        id: product.id,
        name: product.name,
        description: product.description || ''
      }
      this.showAddModal = true
    },

    closeModal() {
      this.showAddModal = false
      this.editMode = false
      this.productForm = { id: null, name: '', description: '' }
    },

    async saveProduct() {
      if (!this.productForm.name.trim()) {
        uni.showToast({
          title: '请输入商品名称',
          icon: 'none'
        })
        return
      }

      try {
        if (this.editMode) {
          await updateProduct(this.productForm.id, this.productForm)
          uni.showToast({ title: '修改成功', icon: 'success' })
        } else {
          await createProduct(this.productForm)
          uni.showToast({ title: '添加成功', icon: 'success' })
        }
        this.closeModal()
        this.loadProducts()
      } catch (error) {
        uni.showToast({
          title: '保存失败',
          icon: 'none'
        })
      }
    },

    deleteProduct(id) {
      uni.showModal({
        title: '确认删除',
        content: '删除后将无法恢复，是否继续？',
        confirmColor: '#ef4444',
        success: async (res) => {
          if (res.confirm) {
            try {
              await deleteProduct(id)
              uni.showToast({ title: '删除成功', icon: 'success' })
              this.loadProducts()
            } catch (error) {
              uni.showToast({
                title: '删除失败',
                icon: 'none'
              })
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

.page-content {
  height: 100vh;
  box-sizing: border-box;
}

/* 加载状态 */
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

/* 空状态 */
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
  color: #1E40AF;
  font-weight: 600;
  margin-bottom: 16rpx;
}

.empty-desc {
  font-size: 28rpx;
  color: #64748B;
}

/* 商品列表 */
.product-list {
  padding: 24rpx;
}

.product-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(37, 99, 235, 0.08);
  transition: all 200ms ease;
}

.product-card:active {
  transform: translateY(-2rpx);
  box-shadow: 0 8rpx 24rpx rgba(37, 99, 235, 0.12);
}

.product-header {
  display: flex;
  align-items: flex-start;
  margin-bottom: 24rpx;
}

.product-icon {
  width: 88rpx;
  height: 88rpx;
  background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;
  box-shadow: 0 4rpx 12rpx rgba(37, 99, 235, 0.25);
}

.icon-image {
  width: 44rpx;
  height: 44rpx;
}

.product-info {
  flex: 1;
}

.product-name {
  font-size: 34rpx;
  font-weight: 600;
  color: #1E40AF;
  display: block;
  margin-bottom: 8rpx;
}

.product-desc {
  font-size: 26rpx;
  color: #64748B;
  display: block;
}

.product-meta {
  margin-bottom: 20rpx;
}

.meta-text {
  font-size: 24rpx;
  color: #94A3B8;
}

.product-actions {
  display: flex;
  justify-content: space-around;
  border-top: 1rpx solid #f0f0f0;
  padding-top: 20rpx;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16rpx 30rpx;
}

.btn-icon {
  width: 36rpx;
  height: 36rpx;
  margin-bottom: 6rpx;
}

.btn-text {
  font-size: 24rpx;
  color: #666;
}

.action-btn.delete .btn-text {
  color: #ef4444;
}

/* 统计信息 */
.product-stats {
  display: flex;
  justify-content: space-around;
  padding: 16rpx 0;
  margin-bottom: 16rpx;
  background: linear-gradient(135deg, #f8fafc 0%, #fff 100%);
  border-radius: 16rpx;
  border: 1rpx solid #E2E8F0;
}

.product-stats .stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
}

.product-stats .stat-label {
  font-size: 22rpx;
  color: #64748B;
}

.product-stats .stat-value {
  font-size: 32rpx;
  font-weight: 700;
}

.product-stats .stat-total {
  color: #1E293B;
}

.product-stats .stat-shipped {
  color: #10B981;
}

.product-stats .stat-pending {
  color: #F59E0B;
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
  overflow: hidden;
  animation: slideUp 0.3s ease;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
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

.form-input {
  height: 80rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  color: #333;
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

.modal-footer {
  display: flex;
  padding: 20rpx 30rpx 40rpx;
  gap: 20rpx;
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
  height: 40rpx;
}
</style>