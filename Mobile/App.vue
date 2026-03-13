<script>
export default {
  onLaunch: function() {
    console.log('App Launch')
  },
  onShow: function() {
    console.log('App Show')
  },
  onHide: function() {
    console.log('App Hide')
  }
}
</script>

<style lang="scss">
/* 全局样式 */
page {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  color: #333;
  background-color: #f5f5f5;
}

/* 重置样式 */
* {
  box-sizing: border-box;
}

/* 按钮重置 */
button {
  margin: 0;
  padding: 0;
  background: none;
  border: none;
  font-size: inherit;
  line-height: inherit;
}

button::after {
  border: none;
}

/* 输入框重置 */
input, textarea {
  outline: none;
  border: none;
}

/* 滚动条隐藏 */
::-webkit-scrollbar {
  display: none;
}

/* 安全区域适配 */
.safe-area-bottom {
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}

/* 通用动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(20rpx);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.fade-in {
  animation: fadeIn 0.3s ease;
}

.slide-up {
  animation: slideUp 0.3s ease;
}
</style>