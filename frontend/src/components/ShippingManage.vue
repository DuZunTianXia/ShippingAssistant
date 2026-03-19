<template>
  <div class="shipping-manage">
    <div class="header">
      <div class="header-left">
        <h2>{{ productName }} - 发货记录管理</h2>
        <button class="btn btn-primary cursor-pointer" @click="openAddDialog">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          添加记录
        </button>
        <button class="btn btn-secondary cursor-pointer" @click="openDuplicateConfig">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.006 8.25 4.97 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.375a.375.375 0 01.375.375v.375a.375.375 0 01-.375.375H6.75a.375.375 0 01-.375-.375v-.375a.375.375 0 01.375-.375zm0 3h.375a.375.375 0 01.375.375v.375a.375.375 0 01-.375.375H6.75a.375.375 0 01-.375-.375v-.375a.375.375 0 01.375-.375zm0 3h.375a.375.375 0 01.375.375v.375a.375.375 0 01-.375.375H6.75a.375.375 0 01-.375-.375v-.375a.375.375 0 01.375-.375z" />
          </svg>
          查重配置
        </button>
      </div>
      <button class="btn btn-ghost cursor-pointer" @click="goBack">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        返回商品列表
      </button>
    </div>

    <!-- 查重配置弹窗 -->
    <div v-if="duplicateConfigVisible" class="dialog-overlay" @click="closeDuplicateConfig">
      <div class="dialog-card" @click.stop>
        <div class="dialog-header">
          <h3>配置查重字段</h3>
          <button class="dialog-close cursor-pointer" @click="closeDuplicateConfig">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="dialog-content">
          <p class="config-description">选择用于查重检测的字段，当新记录的这些字段值与已有记录相同时，将被视为重复记录。</p>
          <div class="field-checkboxes">
            <div
              v-for="field in fields"
              :key="field.id"
              class="field-checkbox-item"
              :class="{ 'checked': isDuplicateFieldChecked(field.name) }"
              @click="toggleDuplicateField(field.name)"
            >
              <div class="checkbox">
                <svg v-if="isDuplicateFieldChecked(field.name)" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <div class="field-info">
                <div class="field-name">{{ field.label }} <span class="field-key">({{ field.name }})</span></div>
              </div>
            </div>
          </div>
          <div v-if="duplicateCheckFields.length === 0" class="no-fields-warning">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <span>未选择任何查重字段，将检查所有字段</span>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn btn-ghost cursor-pointer" @click="closeDuplicateConfig">
            取消
          </button>
          <button class="btn btn-primary cursor-pointer" @click="saveDuplicateConfig">
            保存配置
          </button>
        </div>
      </div>
    </div>
    <div v-if="dialogVisible" class="dialog-overlay" @click="closeDialog">
      <div class="dialog-card" @click.stop>
        <div class="dialog-header">
          <h3>{{ editingId ? '编辑记录' : '添加记录' }}</h3>
          <button class="dialog-close cursor-pointer" @click="closeDialog">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="dialog-content">
          <template v-for="field in fields" :key="field.id">
            <div class="form-group" :class="{ 'required-field': field.required }">
              <label class="form-label">{{ field.label }}{{ field.required ? ' *' : '' }}</label>
              <input
                v-if="field.type === 'text'"
                v-model="recordForm.data[field.name]"
                type="text"
                :placeholder="`请输入${field.label}`"
                class="form-input"
              />
              <input
                v-else-if="field.type === 'number'"
                v-model.number="recordForm.data[field.name]"
                type="number"
                :placeholder="`请输入${field.label}`"
                class="form-input"
              />
              <input
                v-else-if="field.type === 'date'"
                v-model="recordForm.data[field.name]"
                type="date"
                class="form-input"
              />
              <select
                v-else-if="field.type === 'select'"
                v-model="recordForm.data[field.name]"
                class="form-select"
              >
                <option value="">请选择</option>
                <option v-for="(opt, index) in getOptions(field.options)" :key="index" :value="opt">
                  {{ opt }}
                </option>
              </select>
              <textarea
                v-else-if="field.type === 'textarea'"
                v-model="recordForm.data[field.name]"
                :placeholder="`请输入${field.label}`"
                class="form-textarea"
                rows="3"
              />
            </div>
          </template>

          <div class="form-group">
            <label class="form-label">状态</label>
            <select v-model="recordForm.status" class="form-select">
              <option value="pending">待发货</option>
              <option value="shipped">已发货</option>
              <option value="completed">已完成</option>
            </select>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn btn-ghost cursor-pointer" @click="closeDialog">
            取消
          </button>
          <button class="btn btn-primary cursor-pointer" @click="saveRecord">
            {{ editingId ? '更新' : '保存' }}
          </button>
        </div>
      </div>
    </div>

    <div class="table-section">
      <!-- 搜索栏 -->
      <div class="search-bar" v-if="records.length > 0">
        <div class="search-field-selector">
          <select v-model="searchFieldIndex" class="search-field-select">
            <option v-for="(option, index) in searchFieldOptions" :key="index" :value="index">
              {{ option.label }}
            </option>
          </select>
        </div>
        <div class="search-input-wrapper">
          <input
            v-model="searchKeyword"
            @input="handleSearch"
            type="text"
            :placeholder="`搜索${searchFieldOptions[searchFieldIndex].label}`"
            class="search-input"
          />
          <button v-if="searchKeyword" @click="clearSearch" class="search-clear">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- 统计信息栏 -->
      <div class="stats-bar" v-if="records.length > 0">
        <div class="stat-item">
          <span class="stat-label">总计:</span>
          <span class="stat-value stat-total">{{ stats.total }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">已发货:</span>
          <span class="stat-value stat-shipped">{{ stats.shipped }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">待发货:</span>
          <span class="stat-value stat-pending">{{ stats.pending }}</span>
        </div>
        <div class="stat-item" v-if="searchKeyword">
          <span class="stat-label">搜索结果:</span>
          <span class="stat-value stat-search">{{ filteredRecords.length }}</span>
        </div>
      </div>

      <!-- 状态筛选和批量操作栏 -->
      <div class="filter-actions-bar" v-if="records.length > 0">
        <div class="status-filters">
          <button
            class="filter-btn"
            :class="{ active: statusFilter === 'all' }"
            @click="handleStatusFilterChange('all')"
          >
            全部
          </button>
          <button
            class="filter-btn"
            :class="{ active: statusFilter === 'pending' }"
            @click="handleStatusFilterChange('pending')"
          >
            待发货
          </button>
          <button
            class="filter-btn"
            :class="{ active: statusFilter === 'shipped' }"
            @click="handleStatusFilterChange('shipped')"
          >
            已发货
          </button>
        </div>
        
        <div class="batch-actions">
          <button 
            v-if="!batchMode"
            class="btn btn-secondary"
            @click="enterBatchMode"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            多选
          </button>
          <button 
            v-else
            class="btn btn-ghost"
            @click="exitBatchMode"
          >
            取消多选
          </button>
        </div>
      </div>

      <!-- 批量操作控制栏 -->
      <div class="batch-controls" v-if="batchMode && filteredRecords.length > 0">
        <div class="batch-left">
          <button class="batch-btn" @click="selectAll">全选</button>
          <button class="batch-btn" @click="selectNone">取消</button>
          <div class="quick-select-group">
            <input 
              v-model="selectCount" 
              type="number" 
              placeholder="数量"
              :max="filteredRecords.length"
              min="1"
              class="select-input"
            />
            <button class="batch-btn select-btn" @click="quickSelectByInput">选择</button>
          </div>
          <span class="selected-count" v-if="selectedRecordIds.length > 0">
            已选 {{ selectedRecordIds.length }} 条
          </span>
        </div>
        <div class="batch-right">
          <button 
            class="btn btn-success"
            :disabled="selectedRecordIds.length === 0"
            @click="batchCopy"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.16V8.25A2.25 2.25 0 0117.75 10.5h-12A2.25 2.25 0 013.5 8.25v-3.387c0-1.082.805-1.03 1.907-2.16.64-.073 1.28-.135 1.927-.184" />
            </svg>
            批量复制
          </button>
          <button 
            class="btn btn-primary"
            :disabled="selectedRecordIds.length === 0"
            @click="batchExportTxt"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-4.5B4.875 8.25 1.5 11.625 1.5 15v2.625c0 .621.504 1.125 1.125 1.125h15.75c.621 0 1.125-.504 1.125-1.125z" />
            </svg>
            导出TXT
          </button>
        </div>
      </div>
      <div class="table-card">
        <h3>发货记录列表</h3>
        <div v-if="records.length === 0" class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 5.25v4.5m4.5-4.5v4.5m-9 7.5h15M6.75 12h10.5" />
          </svg>
          <p>暂无记录</p>
          <p class="empty-sub">点击上方"添加记录"按钮创建第一条记录</p>
        </div>
        <div v-else class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th v-if="batchMode" style="width: 50px;">
                  <input 
                    type="checkbox" 
                    :checked="isAllSelected" 
                    @change="toggleSelectAll"
                    class="batch-checkbox"
                  />
                </th>
                <th style="width: 60px;">序号</th>
                <th v-for="field in displayFields" :key="field.id" :style="getColumnStyle(field)">
                  {{ field.label }}
                </th>
                <th v-if="hasMoreFields" style="width: 100px;">
                  <button class="show-more-btn" @click="showFieldsModal = true">
                    更多字段 ({{ hiddenFieldsCount }})
                  </button>
                </th>
                <th style="width: 80px;">状态</th>
                <th style="width: 140px;">创建时间</th>
                <th style="width: 200px;">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(record, index) in filteredRecords" :key="record.id" :class="{ 'selected': isSelected(record.id) }">
                <td v-if="batchMode">
                  <input 
                    type="checkbox" 
                    :checked="isSelected(record.id)"
                    @change="toggleSelection(record.id)"
                    class="batch-checkbox"
                  />
                </td>
                <td>{{ index + 1 }}</td>
                <td v-for="field in displayFields" :key="field.id" :title="getFieldValue(record, field)">
                  <span class="field-value">{{ truncateText(getFieldValue(record, field), getFieldMaxLength(field)) }}</span>
                </td>
                <td v-if="hasMoreFields">
                  <button class="view-detail-btn" @click="showRecordDetail(record)" title="查看详情">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </td>
                <td>
                  <span class="badge" :class="getStatusBadgeClass(record.status)">
                    {{ getStatusLabel(record.status) }}
                  </span>
                </td>
                <td>{{ formatDate(record.created_at) }}</td>
                <td>
                  <div class="action-buttons">
                    <button class="btn-icon btn-copy cursor-pointer" @click="copyRecord(record)" title="复制">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.16V8.25A2.25 2.25 0 0117.75 10.5h-12A2.25 2.25 0 013.5 8.25v-3.387c0-1.082.805-1.03 1.907-2.16.64-.073 1.28-.135 1.927-.184" />
                      </svg>
                    </button>
                    <button class="btn-icon btn-export cursor-pointer" @click="exportRecordToTxt(record)" title="导出TXT">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-4.5B4.875 8.25 1.5 11.625 1.5 15v2.625c0 .621.504 1.125 1.125 1.125h15.75c.621 0 1.125-.504 1.125-1.125z" />
                      </svg>
                    </button>
                    <button class="btn-icon btn-ship cursor-pointer" @click="quickShip(record)" title="快捷发货" v-if="record.status === 'pending'">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                      </svg>
                    </button>
                    <button class="btn-icon btn-edit cursor-pointer" @click="editRecord(record)" title="编辑">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                    </button>
                    <button class="btn-icon btn-delete cursor-pointer" @click="deleteRecord(record.id)" title="删除">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- 分页控件 -->
          <div class="pagination-wrapper" v-if="pagination.totalPages > 1">
            <div class="pagination-info">
              共 {{ pagination.total }} 条，第 {{ currentPage }}/{{ pagination.totalPages }} 页
            </div>
            <div class="pagination-controls">
              <button
                class="page-btn"
                :disabled="currentPage <= 1"
                @click="handlePageChange(currentPage - 1)"
              >
                上一页
              </button>
              <button
                v-for="page in visiblePages"
                :key="page"
                class="page-btn"
                :class="{ active: page === currentPage, ellipsis: page === '...' }"
                :disabled="page === '...'"
                @click="page !== '...' && handlePageChange(page)"
              >
                {{ page }}
              </button>
              <button
                class="page-btn"
                :disabled="currentPage >= pagination.totalPages"
                @click="handlePageChange(currentPage + 1)"
              >
                下一页
              </button>
              <select v-model="pageSize" @change="handleSizeChange(pageSize)" class="page-size-select">
                <option :value="10">10条/页</option>
                <option :value="20">20条/页</option>
                <option :value="50">50条/页</option>
                <option :value="100">100条/页</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 字段显示配置弹窗 -->
    <div v-if="showFieldsModal" class="dialog-overlay" @click="showFieldsModal = false">
      <div class="dialog-card" @click.stop>
        <div class="dialog-header">
          <h3>字段显示配置</h3>
          <button class="dialog-close cursor-pointer" @click="showFieldsModal = false">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="dialog-content">
          <p class="config-description">选择要在表格中显示的字段，最多显示 {{ maxDisplayFields }} 个字段。</p>
          <div class="field-checkboxes">
            <div
              v-for="field in fields"
              :key="field.id"
              class="field-checkbox-item"
              :class="{ 'checked': isFieldDisplayed(field.id) }"
              @click="toggleFieldDisplay(field.id)"
            >
              <div class="checkbox">
                <svg v-if="isFieldDisplayed(field.id)" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <div class="field-info">
                <div class="field-name">{{ field.label }} <span class="field-key">({{ field.name }})</span></div>
                <div class="field-type">{{ getFieldTypeLabel(field.type) }}</div>
              </div>
            </div>
          </div>
          <div class="display-limit-info">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            <span>已选择 {{ displayFieldIds.length }} / {{ maxDisplayFields }} 个字段</span>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn btn-ghost cursor-pointer" @click="showFieldsModal = false">
            取消
          </button>
          <button class="btn btn-primary cursor-pointer" @click="saveFieldDisplayConfig">
            保存配置
          </button>
        </div>
      </div>
    </div>

    <!-- 记录详情弹窗 -->
    <div v-if="showDetailModal" class="dialog-overlay" @click="showDetailModal = false">
      <div class="dialog-card detail-modal" @click.stop>
        <div class="dialog-header">
          <h3>记录详情</h3>
          <button class="dialog-close cursor-pointer" @click="showDetailModal = false">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="dialog-content">
          <div v-if="selectedRecord" class="record-detail">
            <div class="detail-header">
              <div class="detail-meta">
                <span class="badge" :class="getStatusBadgeClass(selectedRecord.status)">
                  {{ getStatusLabel(selectedRecord.status) }}
                </span>
                <span class="detail-date">{{ formatDate(selectedRecord.created_at) }}</span>
              </div>
            </div>
            <div class="detail-fields">
              <div v-for="field in fields" :key="field.id" class="detail-field">
                <label class="detail-label">{{ field.label }}:</label>
                <div class="detail-value">{{ getFieldValue(selectedRecord, field) || '-' }}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn btn-ghost cursor-pointer" @click="showDetailModal = false">
            关闭
          </button>
          <button class="btn btn-success cursor-pointer" @click="copyRecord(selectedRecord)">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.16V8.25A2.25 2.25 0 0117.75 10.5h-12A2.25 2.25 0 013.5 8.25v-3.387c0-1.082.805-1.03 1.907-2.16.64-.073 1.28-.135 1.927-.184" />
            </svg>
            复制
          </button>
          <button class="btn btn-primary cursor-pointer" @click="editRecord(selectedRecord)">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
            编辑
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'

const route = useRoute()
const router = useRouter()

const productId = computed(() => route.params.productId)
const productName = computed(() => route.query.productName || '商品')

const recordForm = ref({
  status: 'pending',
  data: {}
})

const fields = ref([])
const records = ref([])
const editingId = ref(null)
const dialogVisible = ref(false)
const stats = ref({ total: 0, shipped: 0, pending: 0 })

// 搜索相关
const searchKeyword = ref('')
const searchFieldIndex = ref(0)
const debouncedSearch = ref('') // 防抖后的搜索词
let searchTimer = null

// 状态筛选
const statusFilter = ref('all')

// 分页相关
const currentPage = ref(1)
const pageSize = ref(20)
const pagination = ref({ total: 0, totalPages: 0 })

// 批量操作相关
const batchMode = ref(false)
const selectedRecordIds = ref([])
const selectCount = ref('')
const batchShippingLoading = ref(false)

// 查重配置相关
const duplicateConfigVisible = ref(false)
const duplicateCheckFields = ref([])

// 字段显示配置相关
const showFieldsModal = ref(false)
const showDetailModal = ref(false)
const selectedRecord = ref(null)
const maxDisplayFields = ref(4) // 最多显示4个字段
const displayFieldIds = ref([]) // 要显示的字段ID列表

// 计算属性
const searchFieldOptions = computed(() => {
  const options = [{ label: '全部字段', value: 'all' }]
  fields.value.forEach(field => {
    options.push({
      label: field.label || field.name,
      value: field.name
    })
  })
  return options
})

const filteredRecords = computed(() => {
  let recordList = [...records.value]
  
  // 状态筛选
  if (statusFilter.value !== 'all') {
    recordList = recordList.filter(r => r.status === statusFilter.value)
  }
  
  // 搜索筛选
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    const searchField = searchFieldOptions.value[searchFieldIndex.value].value
    
    recordList = recordList.filter(record => {
      if (searchField === 'all') {
        // 搜索所有字段
        return fields.value.some(field => {
          const value = getFieldValue(record, field) || ''
          return value.toString().toLowerCase().includes(keyword)
        })
      } else {
        // 搜索指定字段
        const value = getFieldValue(record, { name: searchField }) || ''
        return value.toString().toLowerCase().includes(keyword)
      }
    })
  }
  
  return recordList
})

const isAllSelected = computed(() => {
  return filteredRecords.value.length > 0 && 
         filteredRecords.value.every(record => selectedRecordIds.value.includes(record.id))
})

// 字段显示相关计算属性
const displayFields = computed(() => {
  if (displayFieldIds.value.length === 0) {
    // 如果没有配置，显示前几个字段
    return fields.value.slice(0, maxDisplayFields.value)
  }
  return fields.value.filter(f => displayFieldIds.value.includes(f.id)).slice(0, maxDisplayFields.value)
})

const hasMoreFields = computed(() => {
  return fields.value.length > displayFields.value.length
})

const hiddenFieldsCount = computed(() => {
  return fields.value.length - displayFields.value.length
})

// 计算显示的页码（带省略号）
const visiblePages = computed(() => {
  const total = pagination.value.totalPages || 1
  const current = currentPage.value
  const pages = []

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    if (current > 3) pages.push('...')
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      pages.push(i)
    }
    if (current < total - 2) pages.push('...')
    pages.push(total)
  }

  return pages
})

const fetchFields = async () => {
  try {
    const response = await axios.get(`/api/products/${productId.value}/fields`)
    // 处理新的分页响应格式
    const fieldsData = response.data.items || response.data
    fields.value = fieldsData.sort((a, b) => a.sort_order - b.sort_order)
  } catch (error) {
    ElMessage.error('获取字段列表失败')
  }
}

const fetchRecords = async () => {
  try {
    // 构建查询参数
    const params = new URLSearchParams({
      page: currentPage.value,
      pageSize: pageSize.value
    })

    // 添加搜索词（使用防抖后的值）
    if (debouncedSearch.value) {
      params.append('search', debouncedSearch.value)
    }

    // 添加状态筛选
    if (statusFilter.value !== 'all') {
      params.append('status', statusFilter.value)
    }

    const response = await axios.get(`/api/products/${productId.value}/records?${params}`)
    const data = response.data

    // 处理新的分页响应格式
    if (data.items && data.pagination) {
      records.value = data.items
      pagination.value = data.pagination
    } else {
      // 兼容旧的非分页格式
      records.value = Array.isArray(data) ? data : []
      pagination.value = { total: records.value.length, totalPages: 1 }
    }

    // 同时获取统计信息
    fetchStats()
  } catch (error) {
    ElMessage.error('获取记录列表失败')
  }
}

// 防抖搜索
const handleSearch = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    debouncedSearch.value = searchKeyword.value
    currentPage.value = 1 // 搜索时重置到第一页
    fetchRecords()
  }, 300)
}

// 清除搜索
const clearSearch = () => {
  searchKeyword.value = ''
  debouncedSearch.value = ''
  currentPage.value = 1
  fetchRecords()
}

// 状态筛选变化时重新获取
const handleStatusFilterChange = (status) => {
  statusFilter.value = status
  currentPage.value = 1
  fetchRecords()
}

// 翻页
const handlePageChange = (page) => {
  currentPage.value = page
  fetchRecords()
}

// 每页条数变化
const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  fetchRecords()
}

const fetchStats = async () => {
  try {
    const response = await axios.get(`/api/products/${productId.value}/records/stats`)
    if (response.data.success) {
      stats.value = response.data.stats
    }
  } catch (error) {
    console.error('获取统计信息失败:', error)
  }
}

const openAddDialog = () => {
  editingId.value = null
  recordForm.value = {
    status: 'pending',
    data: {}
  }
  dialogVisible.value = true
}

const closeDialog = () => {
  dialogVisible.value = false
}

const saveRecord = async () => {
  try {
    const generateOrderId = () => {
      const timestamp = Date.now().toString(36)
      const random = Math.random().toString(36).substring(2, 8)
      return `${timestamp}-${random}`.toUpperCase()
    }

    const data = {
      order_id: generateOrderId(),
      status: recordForm.value.status,
      data: recordForm.value.data
    }

    if (editingId.value) {
      // 更新时保持原有的 order_id
      const existingRecord = records.value.find(r => r.id === editingId.value)
      data.order_id = existingRecord?.order_id
      await axios.put(`/api/records/${editingId.value}`, data)
      ElMessage.success('更新成功')
    } else {
      await axios.post(`/api/products/${productId.value}/records`, data)
      ElMessage.success('保存成功')
    }

    closeDialog()
    fetchRecords()
  } catch (error) {
    ElMessage.error(editingId.value ? '更新记录失败' : '保存记录失败')
  }
}

const editRecord = (row) => {
  editingId.value = row.id
  recordForm.value = {
    status: row.status,
    data: row.data || {}
  }
  dialogVisible.value = true
}

const deleteRecord = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除这条记录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await axios.delete(`/api/records/${id}`)
    ElMessage.success('删除成功')
    fetchRecords()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const copyRecord = async (record) => {
  try {
    // 获取该商品的复制字段配置（从 localStorage 读取）
    const copyConfigKey = `copy_fields_${productId.value}`
    const copyFieldIds = JSON.parse(localStorage.getItem(copyConfigKey) || '[]')

    // 根据配置筛选字段，如果没有配置则复制所有字段
    const fieldsToCopy = copyFieldIds.length > 0
      ? fields.value.filter(f => copyFieldIds.includes(f.id))
      : fields.value

    // 生成复制文本
    const text = fieldsToCopy
      .map(field => {
        // 兼容旧数据的中文键名
        const value = record.data[field.name] ?? record.data[field.label]
        if (value === undefined || value === null || value === '') {
          return null
        }
        return `${field.label}:${value}`
      })
      .filter(line => line !== null)
      .join('\n')

    if (!text) {
      ElMessage.warning('没有可复制的内容')
      return
    }

    // 复制到剪贴板
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制到剪贴板')
    
    // 如果是待发货记录，询问是否标记为已发货
    if (record.status === 'pending') {
      setTimeout(async () => {
        try {
          await ElMessageBox.confirm(
            '复制成功，是否将此订单标记为已发货？',
            '是否标记为已发货？',
            {
              confirmButtonText: '标记发货',
              cancelButtonText: '取消',
              type: 'info',
              confirmButtonClass: 'el-button--success'
            }
          )
          
          // 显示加载状态
          const loadingInstance = ElLoading.service({
            lock: true,
            text: '标记中...',
            background: 'rgba(0, 0, 0, 0.7)'
          })
          
          try {
            const data = {
              order_id: record.order_id,
              status: 'shipped',
              data: record.data
            }
            await axios.put(`/api/records/${record.id}`, data)
            loadingInstance.close()
            ElMessage.success('已发货')
            fetchRecords()
          } catch (error) {
            loadingInstance.close()
            ElMessage.error('标记发货失败')
          }
        } catch (error) {
          // 用户取消，不做任何操作
        }
      }, 500)
    }
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

// 获取字段值（兼容旧数据的中文键名）
const getFieldValue = (record, field) => {
  // 优先使用新的英文键名（field.name），如果没有再尝试旧的中文键名（field.label）
  const value = record.data[field.name] ?? record.data[field.label]
  return value || '-'
}

const quickShip = async (record) => {
  try {
    await ElMessageBox.confirm('确定要标记为已发货吗？', '快捷发货', {
      confirmButtonText: '确定发货',
      cancelButtonText: '取消',
      type: 'info'
    })

    // 显示加载状态
    const loadingInstance = ElLoading.service({
      lock: true,
      text: '标记中...',
      background: 'rgba(0, 0, 0, 0.7)'
    })

    const data = {
      order_id: record.order_id,
      status: 'shipped',
      data: record.data
    }

    await axios.put(`/api/records/${record.id}`, data)
    loadingInstance.close()
    ElMessage.success('已标记为已发货')
    fetchRecords()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

const getOptions = (optionsStr) => {
  return optionsStr ? optionsStr.split('\n').filter(opt => opt.trim()) : []
}

const getStatusLabel = (status) => {
  const statusMap = {
    pending: '待发货',
    shipped: '已发货',
    completed: '已完成'
  }
  return statusMap[status] || status
}

const getStatusBadgeClass = (status) => {
  const classMap = {
    pending: 'badge-warning',
    shipped: 'badge-primary',
    completed: 'badge-success'
  }
  return classMap[status] || 'badge-info'
}

const formatDate = (dateStr) => {
  return dateStr ? new Date(dateStr).toLocaleString('zh-CN') : '-'
}

const goBack = () => {
  router.push('/')
}

// 查重配置相关方法
const openDuplicateConfig = () => {
  duplicateConfigVisible.value = true
}

const closeDuplicateConfig = () => {
  duplicateConfigVisible.value = false
}

const fetchDuplicateConfig = async () => {
  try {
    const response = await axios.get(`/api/products/${productId.value}/duplicate-config`)
    if (response.data.success) {
      duplicateCheckFields.value = response.data.checkFields || []
    }
  } catch (error) {
    console.error('获取查重配置失败:', error)
    ElMessage.error('获取查重配置失败')
  }
}

const saveDuplicateConfig = async () => {
  try {
    await axios.put(`/api/products/${productId.value}/duplicate-config`, {
      checkFields: duplicateCheckFields.value
    })
    ElMessage.success('查重配置已保存')
    closeDuplicateConfig()
  } catch (error) {
    ElMessage.error('保存查重配置失败')
  }
}

const toggleDuplicateField = (fieldName) => {
  const index = duplicateCheckFields.value.indexOf(fieldName)
  if (index > -1) {
    duplicateCheckFields.value.splice(index, 1)
  } else {
    duplicateCheckFields.value.push(fieldName)
  }
}

const isDuplicateFieldChecked = (fieldName) => {
  return duplicateCheckFields.value.includes(fieldName)
}

// 批量操作相关方法
const enterBatchMode = () => {
  batchMode.value = true
  selectedRecordIds.value = []
  selectCount.value = ''
}

const exitBatchMode = () => {
  batchMode.value = false
  selectedRecordIds.value = []
  selectCount.value = ''
}

const isSelected = (id) => {
  return selectedRecordIds.value.includes(id)
}

const toggleSelection = (id) => {
  const index = selectedRecordIds.value.indexOf(id)
  if (index > -1) {
    selectedRecordIds.value.splice(index, 1)
  } else {
    selectedRecordIds.value.push(id)
  }
}

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedRecordIds.value = []
  } else {
    selectedRecordIds.value = filteredRecords.value.map(r => r.id)
  }
}

const selectAll = () => {
  selectedRecordIds.value = filteredRecords.value.map(r => r.id)
}

const selectNone = () => {
  selectedRecordIds.value = []
}

const quickSelectByInput = () => {
  const count = parseInt(selectCount.value)
  if (!count || count <= 0) {
    ElMessage.warning('请输入有效数量')
    return
  }
  if (count > filteredRecords.value.length) {
    ElMessage.warning(`最多只能选择${filteredRecords.value.length}条`)
    return
  }
  selectedRecordIds.value = filteredRecords.value.slice(0, count).map(r => r.id)
  ElMessage.success(`已选择${count}条记录`)
}

// 批量复制
const batchCopy = async () => {
  if (selectedRecordIds.value.length === 0) {
    ElMessage.warning('请先选择记录')
    return
  }

  // 通过批量API获取完整的选中记录（支持跨页选择）
  let selectedRecords
  try {
    const response = await axios.post(`/api/products/${productId.value}/records/batch`, {
      ids: selectedRecordIds.value
    })
    selectedRecords = response.data.items || []
  } catch (error) {
    // 如果批量接口失败，尝试用本地数据
    selectedRecords = records.value.filter(r => selectedRecordIds.value.includes(r.id))
  }

  const allLines = []

  selectedRecords.forEach((record, index) => {
    if (index > 0) {
      allLines.push('') // 记录之间用空行分隔
    }
    
    allLines.push(`--- 记录 #${index + 1} ---`)
    fields.value.forEach(field => {
      const value = getFieldValue(record, field) || ''
      if (value && value !== '-') {
        allLines.push(`${field.label || field.name}: ${value}`)
      }
    })
  })

  const text = allLines.join('\n')

  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success(`已复制 ${selectedRecords.length} 条记录`)
    
    // 检查是否有待发货记录，询问是否标记发货
    const pendingRecords = selectedRecords.filter(r => r.status === 'pending')
    if (pendingRecords.length > 0) {
      setTimeout(async () => {
        try {
          await ElMessageBox.confirm(
            `复制的 ${selectedRecords.length} 条记录中有 ${pendingRecords.length} 条待发货，是否标记为已发货？`,
            '是否标记为已发货？',
            {
              confirmButtonText: '标记发货',
              cancelButtonText: '取消',
              type: 'info',
              confirmButtonClass: 'el-button--success'
            }
          )
          await batchMarkShipped(pendingRecords)
        } catch (error) {
          // 用户取消，不做任何操作
        }
      }, 500)
    } else {
      setTimeout(() => {
        exitBatchMode()
      }, 1000)
    }
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

// 批量导出TXT
const batchExportTxt = async () => {
  if (selectedRecordIds.value.length === 0) {
    ElMessage.warning('请先选择记录')
    return
  }

  // 通过批量API获取完整的选中记录（支持跨页选择）
  let selectedRecords
  try {
    const response = await axios.post(`/api/products/${productId.value}/records/batch`, {
      ids: selectedRecordIds.value
    })
    selectedRecords = response.data.items || []
  } catch (error) {
    // 如果批量接口失败，尝试用本地数据
    selectedRecords = records.value.filter(r => selectedRecordIds.value.includes(r.id))
  }

  const lines = []

  selectedRecords.forEach((record, index) => {
    if (index > 0) {
      lines.push('') // 记录之间用空行分隔
    }
    
    lines.push(`--- 记录 #${index + 1} ---`)
    fields.value.forEach(field => {
      const value = getFieldValue(record, field) || ''
      if (value && value !== '-') {
        lines.push(`${field.label || field.name}: ${value}`)
      }
    })
  })

  const content = lines.join('\n')
  const fileName = `batch_export_${productName.value}_${Date.now()}.txt`
  
  try {
    await navigator.clipboard.writeText(content)
    ElMessage.success(`内容已复制到剪贴板，文件名参考：${fileName}`)
    
    // 询问是否标记为已发货
    const pendingRecords = selectedRecords.filter(r => r.status === 'pending')
    if (pendingRecords.length > 0) {
      setTimeout(async () => {
        try {
          await ElMessageBox.confirm(
            `导出的 ${selectedRecords.length} 条记录中有 ${pendingRecords.length} 条待发货，是否标记为已发货？`,
            '是否标记为已发货？',
            {
              confirmButtonText: '标记发货',
              cancelButtonText: '取消',
              type: 'info',
              confirmButtonClass: 'el-button--success'
            }
          )
          await batchMarkShipped(pendingRecords)
        } catch (error) {
          // 用户取消，不做任何操作
        }
      }, 500)
    } else {
      setTimeout(() => {
        exitBatchMode()
      }, 1000)
    }
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

// 单个记录导出TXT
const exportRecordToTxt = async (record) => {
  const lines = []
  
  fields.value.forEach(field => {
    const value = getFieldValue(record, field) || ''
    if (value && value !== '-') {
      lines.push(`${field.label || field.name}: ${value}`)
    }
  })
  
  const content = lines.join('\n')
  const fileName = `record_${record.id}_${Date.now()}.txt`
  
  try {
    await navigator.clipboard.writeText(content)
    ElMessage.success(`内容已复制到剪贴板，文件名参考：${fileName}`)
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

// 批量标记发货
const batchMarkShipped = async (pendingRecords) => {
  if (batchShippingLoading.value) return
  
  batchShippingLoading.value = true
  let successCount = 0
  let failCount = 0
  
  const loadingInstance = ElLoading.service({
    lock: true,
    text: `标记中 0/${pendingRecords.length}`,
    background: 'rgba(0, 0, 0, 0.7)'
  })
  
  try {
    for (let i = 0; i < pendingRecords.length; i++) {
      const record = pendingRecords[i]
      try {
        const data = {
          order_id: record.order_id,
          status: 'shipped',
          data: record.data
        }
        await axios.put(`/api/records/${record.id}`, data)
        successCount++
        
        // 更新进度
        loadingInstance.setText(`标记中 ${successCount + failCount}/${pendingRecords.length}`)
      } catch (error) {
        failCount++
        console.error(`标记记录 ${record.id} 失败:`, error)
      }
    }
    
    loadingInstance.close()
    
    // 显示结果
    if (failCount === 0) {
      ElMessage.success(`已发货 ${successCount} 条`)
    } else {
      ElMessageBox.alert(
        `成功: ${successCount} 条\n失败: ${failCount} 条`,
        '批量发货完成',
        { type: 'info' }
      )
    }
    
    fetchRecords()
    exitBatchMode()
    
  } catch (error) {
    loadingInstance.close()
    ElMessage.error('批量发货失败')
  } finally {
    batchShippingLoading.value = false
  }
}

// 字段显示相关方法
const truncateText = (text, maxLength) => {
  if (!text) return '-'
  const str = text.toString()
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength) + '...'
}

const getColumnStyle = (field) => {
  // 根据字段类型设置不同的列宽
  const typeWidths = {
    'text': '150px',
    'textarea': '200px',
    'number': '100px',
    'date': '120px',
    'select': '120px'
  }
  return { 
    width: typeWidths[field.type] || '150px',
    minWidth: '100px',
    maxWidth: '250px'
  }
}

const getFieldMaxLength = (field) => {
  // 根据字段类型设置不同的最大显示长度
  const typeLengths = {
    'text': 20,
    'textarea': 30,
    'number': 15,
    'date': 10,
    'select': 15
  }
  return typeLengths[field.type] || 20
}

const getFieldTypeLabel = (type) => {
  const typeLabels = {
    'text': '文本',
    'textarea': '多行文本',
    'number': '数字',
    'date': '日期',
    'select': '选择'
  }
  return typeLabels[type] || type
}

const showRecordDetail = (record) => {
  selectedRecord.value = record
  showDetailModal.value = true
}

const isFieldDisplayed = (fieldId) => {
  if (displayFieldIds.value.length === 0) {
    // 如果没有配置，前几个字段默认显示
    const defaultFields = fields.value.slice(0, maxDisplayFields.value)
    return defaultFields.some(f => f.id === fieldId)
  }
  return displayFieldIds.value.includes(fieldId)
}

const toggleFieldDisplay = (fieldId) => {
  const index = displayFieldIds.value.indexOf(fieldId)
  if (index > -1) {
    displayFieldIds.value.splice(index, 1)
  } else {
    if (displayFieldIds.value.length < maxDisplayFields.value) {
      displayFieldIds.value.push(fieldId)
    } else {
      ElMessage.warning(`最多只能显示 ${maxDisplayFields.value} 个字段`)
    }
  }
}

const saveFieldDisplayConfig = () => {
  // 保存到localStorage
  const configKey = `display_fields_${productId.value}`
  localStorage.setItem(configKey, JSON.stringify(displayFieldIds.value))
  ElMessage.success('字段显示配置已保存')
  showFieldsModal.value = false
}

const loadFieldDisplayConfig = () => {
  // 从localStorage加载配置
  const configKey = `display_fields_${productId.value}`
  const config = localStorage.getItem(configKey)
  if (config) {
    try {
      displayFieldIds.value = JSON.parse(config)
    } catch (error) {
      console.error('加载字段显示配置失败:', error)
      displayFieldIds.value = []
    }
  }
}

onMounted(() => {
  if (productId.value) {
    fetchFields()
    fetchRecords()
    fetchDuplicateConfig()
    loadFieldDisplayConfig()
  }
})
</script>

<style scoped>
.shipping-manage {
  padding: 0;
}

.stats-bar {
  display: flex;
  gap: var(--spacing-xl);
  padding: var(--spacing-md) var(--spacing-lg);
  background: linear-gradient(135deg, var(--color-bg-card) 0%, var(--color-bg-hover) 100%);
  border-radius: var(--radius-lg);
  margin-bottom: var(--spacing-md);
  border: 1px solid var(--color-border);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.stat-label {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
}

.stat-total {
  color: var(--color-text-primary);
}

.stat-shipped {
  color: var(--color-success);
}

.stat-pending {
  color: var(--color-warning);
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
  max-width: 600px;
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

.required-field .form-label {
  font-weight: 600;
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
  min-height: 80px;
  font-family: 'Open Sans', sans-serif;
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

.btn-copy:hover {
  background-color: var(--color-success);
  color: white;
}

.btn-ship:hover {
  background-color: var(--color-info);
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

.btn-secondary {
  background-color: var(--color-bg-input);
  color: var(--color-text-secondary);
}

.btn-secondary:hover {
  background-color: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.config-description {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-lg);
  line-height: 1.5;
}

.field-checkboxes {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.field-checkbox-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.field-checkbox-item:hover {
  background-color: var(--color-bg-hover);
  border-color: var(--color-primary);
}

.field-checkbox-item.checked {
  background-color: rgba(8, 145, 178, 0.05);
  border-color: var(--color-primary);
}

.checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all var(--transition-fast);
}

.field-checkbox-item.checked .checkbox {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
}

.checkbox svg {
  width: 14px;
  height: 14px;
  color: white;
}

.field-info {
  flex: 1;
}

.field-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
}

.field-key {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-top: 2px;
}

.no-fields-warning {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-lg);
  padding: var(--spacing-md);
  background-color: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: var(--radius-md);
  color: var(--color-warning);
  font-size: 13px;
}

.no-fields-warning svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

/* 搜索栏样式 */
.search-bar {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  margin-bottom: var(--spacing-md);
}

.search-field-selector {
  flex-shrink: 0;
}

.search-field-select {
  height: 40px;
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0 var(--spacing-md);
  font-size: 14px;
  color: var(--color-text-primary);
  min-width: 120px;
}

.search-input-wrapper {
  flex: 1;
  position: relative;
}

.search-input {
  width: 100%;
  height: 40px;
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0 var(--spacing-md);
  padding-right: 40px;
  font-size: 14px;
  color: var(--color-text-primary);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(8, 145, 178, 0.1);
}

.search-clear {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  background: var(--color-text-muted);
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.search-clear:hover {
  background: var(--color-danger);
}

.search-clear svg {
  width: 14px;
  height: 14px;
  color: white;
}

/* 筛选和操作栏样式 */
.filter-actions-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  margin-bottom: var(--spacing-md);
}

.status-filters {
  display: flex;
  gap: var(--spacing-sm);
}

.filter-btn {
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: 14px;
  background: var(--color-bg-input);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.filter-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.filter-btn.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

/* 批量操作控制栏样式 */
.batch-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-lg);
  margin-bottom: var(--spacing-md);
}

.batch-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.batch-right {
  display: flex;
  gap: var(--spacing-sm);
}

.batch-btn {
  padding: var(--spacing-xs) var(--spacing-md);
  font-size: 13px;
  background: var(--color-bg-card);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.batch-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.quick-select-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.select-input {
  width: 80px;
  height: 32px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0 var(--spacing-sm);
  font-size: 13px;
  text-align: center;
}

.select-btn {
  background: #EFF6FF;
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.selected-count {
  font-size: 14px;
  color: var(--color-primary);
  font-weight: 500;
  margin-left: var(--spacing-sm);
}

/* 表格样式更新 */
.batch-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.data-table tbody tr.selected {
  background-color: rgba(8, 145, 178, 0.05);
}

.data-table tbody tr.selected:hover {
  background-color: rgba(8, 145, 178, 0.1);
}

.btn-export:hover {
  background-color: var(--color-warning);
  color: white;
}

.stat-search {
  color: var(--color-primary);
}

/* 表格字段显示优化 */
.data-table {
  table-layout: fixed;
  width: 100%;
}

.data-table th,
.data-table td {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.field-value {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.show-more-btn {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: 12px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.show-more-btn:hover {
  background: var(--color-primary-dark);
}

.view-detail-btn {
  width: 32px;
  height: 32px;
  background: var(--color-info);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.view-detail-btn:hover {
  background: var(--color-info-dark);
  transform: scale(1.05);
}

.view-detail-btn svg {
  width: 16px;
  height: 16px;
}

/* 记录详情弹窗样式 */
.detail-modal {
  max-width: 600px;
  width: 90%;
}

.record-detail {
  padding: 0;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
}

.detail-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.detail-date {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.detail-fields {
  display: grid;
  gap: var(--spacing-md);
}

.detail-field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.detail-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.detail-value {
  font-size: 14px;
  color: var(--color-text-primary);
  background: var(--color-bg-input);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  word-break: break-all;
  white-space: pre-wrap;
  min-height: 20px;
}

/* 字段类型标签 */
.field-type {
  font-size: 11px;
  color: var(--color-text-muted);
  margin-top: 2px;
}

/* 显示限制信息 */
.display-limit-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-lg);
  padding: var(--spacing-md);
  background-color: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: var(--radius-md);
  color: var(--color-info);
  font-size: 13px;
}

.display-limit-info svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
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

/* 分页控件样式 */
.pagination-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-card);
}

.pagination-info {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.page-btn {
  padding: var(--spacing-xs) var(--spacing-sm);
  min-width: 32px;
  height: 32px;
  font-size: 13px;
  color: var(--color-text-primary);
  background: var(--color-bg-hover);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.page-btn:hover:not(:disabled) {
  background: var(--color-primary-light);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.page-btn.ellipsis {
  border: none;
  background: transparent;
  cursor: default;
}

.page-btn.ellipsis:hover {
  background: transparent;
  color: var(--color-text-primary);
}

.page-size-select {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: 13px;
  color: var(--color-text-primary);
  background: var(--color-bg-hover);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  margin-left: var(--spacing-md);
}

.page-size-select:focus {
  outline: none;
  border-color: var(--color-primary);
}
</style>
