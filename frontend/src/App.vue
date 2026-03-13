<template>
  <div id="app">
    <div class="app-header">
      <div class="container">
        <div class="header-content">
          <div class="brand">
            <div class="brand-icon">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
              </svg>
            </div>
            <div class="brand-text">
              <h1>Shipping Assistant</h1>
              <p class="brand-tagline">智能发货管理系统</p>
            </div>
          </div>
          <nav class="header-nav">
            <router-link to="/" class="nav-link">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621-.504-1.125-1.125-1.125h-3c-.621 0-1.125.504-1.125 1.125V21H4.125c-.621 0-1.125-.504-1.125-1.125V9.75z" />
              </svg>
              商品管理
            </router-link>
          </nav>
        </div>
      </div>
    </div>

    <div class="app-main">
      <div class="container">
        <router-view v-slot="{ Component }">
          <transition name="page" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </div>

  </div>
</template>

<script setup>
</script>

<style scoped>
#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  color: white;
  padding: var(--spacing-lg) 0;
  box-shadow: var(--shadow-lg);
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-xl);
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  text-decoration: none;
  cursor: pointer;
}

.brand-icon {
  width: 48px;
  height: 48px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  transition: all var(--transition-base);
}

.brand-icon svg {
  width: 24px;
  height: 24px;
  color: white;
}

.brand:hover .brand-icon {
  background-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.brand-text h1 {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  color: white;
  line-height: 1.2;
}

.brand-tagline {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  margin-top: 2px;
}

.header-nav {
  display: flex;
  gap: var(--spacing-md);
}

.nav-link {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-lg);
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
  transition: all var(--transition-base);
}

.nav-link svg {
  width: 18px;
  height: 18px;
  color: inherit;
}

.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  transform: translateY(-1px);
}

.nav-link.router-link-active {
  background-color: rgba(255, 255, 255, 0.25);
  color: white;
  font-weight: 600;
  box-shadow: var(--shadow-sm);
}

/* 页面切换动画 */
.page-enter-active,
.page-leave-active {
  transition: all 0.3s ease-out;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

.app-main {
  flex: 1;
  padding: var(--spacing-2xl) 0;
  background-color: var(--color-bg-main);
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: var(--spacing-lg);
  }

  .brand {
    width: 100%;
    justify-content: center;
  }

  .brand-icon {
    width: 40px;
    height: 40px;
  }

  .brand-text h1 {
    font-size: 18px;
  }

  .header-nav {
    width: 100%;
    justify-content: center;
  }

  .nav-link {
    flex: 1;
    justify-content: center;
  }
}
</style>
