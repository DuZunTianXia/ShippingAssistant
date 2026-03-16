import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './styles/global.css'
import App from './App.vue'
import ProductManage from './components/ProductManage.vue'
import FieldManage from './components/FieldManage.vue'
import ShippingManage from './components/ShippingManage.vue'

const routes = [
  { path: '/', component: ProductManage },
  { path: '/fields/:productId', component: FieldManage, name: 'Fields' },
  { path: '/records/:productId', component: ShippingManage, name: 'Records' },
  // 捕获所有未匹配的路由，重定向到首页
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

const app = createApp(App)
app.use(router)
app.use(ElementPlus)

// 覆盖 Element Plus 的默认样式以匹配设计系统
app.config.globalProperties.$ELEMENT = {
  size: 'default',
  zIndex: 3000
}

app.mount('#app')
