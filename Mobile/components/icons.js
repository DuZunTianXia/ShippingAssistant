// icons.js - 图标配置
export const icons = {
  // 商品图标
  product: '/static/icons/product.svg',
  // 字段图标
  fields: '/static/icons/fields.svg',
  // 发货图标
  shipping: '/static/icons/shipping.svg',
  // 编辑图标
  edit: '/static/icons/edit.svg',
  // 删除图标
  delete: '/static/icons/delete.svg',
  // 添加图标
  add: '/static/icons/add.svg',
  // 返回图标
  back: '/static/icons/back.svg',
  // 复制图标
  copy: '/static/icons/copy.svg',
  // 更多图标
  more: '/static/icons/more.svg'
}

// 获取图标路径
export function getIcon(name) {
  return icons[name] || ''
}
