<template>
  <div class="system-brain-console">
    <div class="header">
      <h1 class="title">
        系统大脑控制台
      </h1>
      <p class="subtitle">
        统一管理所有系统配置，支持可视化编辑、版本控制和热更新
      </p>
    </div>

    <div class="config-panel">
      <div class="tabs-header">
        <div class="tabs">
          <button
            v-for="(tab, index) in tabs"
            :key="index"
            :class="['tab', { active: activeTab === index }]"
            @click="handleTabChange(index)"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>

      <div class="tab-content">
        <div
          v-for="(tab, index) in tabs"
          v-show="activeTab === index"
          :key="index"
          class="tab-panel"
        >
          <div class="panel-header">
            <h2 class="panel-title">
              {{ tab.label }}管理
            </h2>
            <div class="panel-actions">
              <button
                class="btn btn-outline"
                @click="handleRefresh"
              >
                <i class="icon-refresh" />
                刷新
              </button>
              <button
                class="btn btn-primary"
                @click="handleAddNew"
              >
                <i class="icon-add" />
                新增配置
              </button>
            </div>
          </div>

          <div class="config-table-container">
            <div
              v-if="loading"
              class="loading"
            >
              <div class="spinner" />
            </div>
            <div
              v-else
              class="table-wrapper"
            >
              <table class="config-table">
                <thead>
                  <tr>
                    <th>配置键</th>
                    <th>描述</th>
                    <th>版本</th>
                    <th>状态</th>
                    <th>创建者</th>
                    <th>更新时间</th>
                    <th class="actions">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="config in configs"
                    :key="config.configId"
                  >
                    <td>
                      <span class="config-key">{{ config.configKey }}</span>
                    </td>
                    <td>
                      <span class="config-description">{{ config.description || '-' }}</span>
                    </td>
                    <td>
                      <span class="version-chip">v{{ config.version }}</span>
                    </td>
                    <td>
                      <label class="switch-label">
                        <input
                          type="checkbox"
                          :checked="config.isActive"
                          class="switch-input"
                          @change="handleToggleActive(config)"
                        >
                        <span class="switch-slider" />
                        <span class="switch-text">{{ config.isActive ? '启用' : '禁用' }}</span>
                      </label>
                    </td>
                    <td>
                      <span class="creator">{{ config.createdBy || '-' }}</span>
                    </td>
                    <td>
                      <span class="update-time">{{ formatDate(config.updatedAt) }}</span>
                    </td>
                    <td class="actions">
                      <div class="action-menu">
                        <button
                          class="menu-trigger"
                          @click="handleMenuClick($event, config)"
                        >
                          <i class="icon-more" />
                        </button>
                        <div
                          v-if="menuConfig && menuConfig.configId === config.configId"
                          class="menu-dropdown"
                          :style="{ top: menuPosition.top + 'px', left: menuPosition.left + 'px' }"
                        >
                          <button
                            class="menu-item"
                            @click="handleEdit(config)"
                          >
                            <i class="icon-edit" />
                            编辑
                          </button>
                          <button
                            class="menu-item"
                            @click="handlePublish(config)"
                          >
                            <i class="icon-publish" />
                            发布
                          </button>
                          <button
                            class="menu-item"
                            @click="handleViewHistory(config)"
                          >
                            <i class="icon-history" />
                            历史版本
                          </button>
                          <button
                            class="menu-item"
                            @click="handleCopy(config)"
                          >
                            <i class="icon-copy" />
                            复制
                          </button>
                          <button
                            class="menu-item danger"
                            @click="handleDelete(config)"
                          >
                            <i class="icon-delete" />
                            删除
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑对话框 -->
    <div
      v-if="editDialogOpen"
      class="dialog-overlay"
      @click="closeEditDialog"
    >
      <div
        class="dialog"
        @click.stop
      >
        <div class="dialog-header">
          <h3>{{ selectedConfig ? '编辑配置' : '新增配置' }}</h3>
          <button
            class="dialog-close"
            @click="closeEditDialog"
          >
            &times;
          </button>
        </div>
        <div class="dialog-content">
          <div class="form-group">
            <label>配置键</label>
            <input
              v-model="editForm.configKey"
              type="text"
              :disabled="!!selectedConfig"
              class="form-input"
            >
          </div>
          <div class="form-group">
            <label>描述</label>
            <input
              v-model="editForm.description"
              type="text"
              class="form-input"
            >
          </div>
          <div class="form-group">
            <label>配置值</label>
            <textarea
              v-model="editForm.configValue"
              class="form-textarea"
              rows="6"
            />
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              <input
                v-model="editForm.isActive"
                type="checkbox"
                class="checkbox-input"
              >
              <span class="checkbox-text">启用配置</span>
            </label>
          </div>
        </div>
        <div class="dialog-actions">
          <button
            class="btn btn-outline"
            @click="closeEditDialog"
          >
            取消
          </button>
          <button
            class="btn btn-primary"
            @click="handleSave"
          >
            保存
          </button>
        </div>
      </div>
    </div>

    <!-- 消息提示 -->
    <div
      v-if="error"
      class="alert alert-error"
    >
      {{ error }}
      <button
        class="alert-close"
        @click="error = null"
      >
        &times;
      </button>
    </div>
    <div
      v-if="success"
      class="alert alert-success"
    >
      {{ success }}
      <button
        class="alert-close"
        @click="success = null"
      >
        &times;
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { logger } from "@/utils/logger"

interface ConfigItem {
  configId: number
  configType: string
  configKey: string
  configValue: any
  version: number
  isActive: boolean
  description?: string
  createdBy?: string
  updatedBy?: string
  createdAt: string
  updatedAt: string
}

const activeTab = ref(0)
const configs = ref<ConfigItem[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)
const selectedConfig = ref<ConfigItem | null>(null)
const editDialogOpen = ref(false)
const menuConfig = ref<ConfigItem | null>(null)
const menuPosition = ref({ top: 0, left: 0 })

const editForm = reactive({
  configKey: '',
  description: '',
  configValue: '',
  isActive: true
})

const tabs = [
  { label: '归因规则', type: 'ATTRIBUTION_RULE' },
  { label: '事件标签', type: 'EVENT_TAG' },
  { label: 'Prompt模板', type: 'PROMPT_TEMPLATE' },
  { label: '股票宇宙规则', type: 'UNIVERSE_RULE' },
  { label: '预测特征', type: 'FEATURE' },
]

onMounted(() => {
  loadConfigs()
})

const loadConfigs = async () => {
  loading.value = true
  try {
    const response = await fetch(`/api/v1/admin/configs?type=${tabs[activeTab.value].type}`)
    if (!response.ok) {
      throw new Error('Failed to load configs')
    }
    const data = await response.json()
    configs.value = data
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load configs'
  } finally {
    loading.value = false
  }
}

const handleTabChange = (index: number) => {
  activeTab.value = index
  loadConfigs()
}

const handleMenuClick = (event: MouseEvent, config: ConfigItem) => {
  menuConfig.value = config
  const rect = (event.target as HTMLElement).getBoundingClientRect()
  menuPosition.value = {
    top: rect.bottom + 5,
    left: rect.left
  }
}

const handleEdit = (config: ConfigItem) => {
  selectedConfig.value = config
  editForm.configKey = config.configKey
  editForm.description = config.description || ''
  editForm.configValue = JSON.stringify(config.configValue, null, 2)
  editForm.isActive = config.isActive
  editDialogOpen.value = true
  menuConfig.value = null
}

const handleDelete = async (config: ConfigItem) => {
  if (confirm(`确定要删除配置 ${config.configKey} 吗？`)) {
    try {
      const response = await fetch(`/api/v1/admin/configs/${config.configId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Failed to delete config')
      }
      success.value = '配置删除成功'
      loadConfigs()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete config'
    }
  }
  menuConfig.value = null
}

const handleToggleActive = async (config: ConfigItem) => {
  try {
    const response = await fetch(`/api/v1/admin/configs/${config.configId}/toggle`, {
      method: 'PATCH',
    })
    if (!response.ok) {
      throw new Error('Failed to toggle config')
    }
    config.isActive = !config.isActive
    success.value = `配置已${config.isActive ? '启用' : '禁用'}`
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to toggle config'
  }
}

const handlePublish = async (config: ConfigItem) => {
  try {
    const response = await fetch(`/api/v1/admin/configs/${config.configId}/publish`, {
      method: 'POST',
    })
    if (!response.ok) {
      throw new Error('Failed to publish config')
    }
    success.value = '配置发布成功'
    loadConfigs()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to publish config'
  }
  menuConfig.value = null
}

const handleViewHistory = (config: ConfigItem) => {
  logger.log('View history', config)
  menuConfig.value = null
}

const handleCopy = (config: ConfigItem) => {
  logger.log('Copy', config)
  menuConfig.value = null
}

const handleRefresh = () => {
  loadConfigs()
}

const handleAddNew = () => {
  selectedConfig.value = null
  editForm.configKey = ''
  editForm.description = ''
  editForm.configValue = ''
  editForm.isActive = true
  editDialogOpen.value = true
}

const handleSave = async () => {
  try {
    const url = selectedConfig.value
      ? `/api/v1/admin/configs/${selectedConfig.value.configId}`
      : '/api/v1/admin/configs'

    const method = selectedConfig.value ? 'PUT' : 'POST'

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        configType: tabs[activeTab.value].type,
        configKey: editForm.configKey,
        configValue: JSON.parse(editForm.configValue),
        description: editForm.description,
        isActive: editForm.isActive,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to save config')
    }

    success.value = selectedConfig.value ? '配置更新成功' : '配置创建成功'
    editDialogOpen.value = false
    loadConfigs()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to save config'
  }
}

const closeEditDialog = () => {
  editDialogOpen.value = false
  selectedConfig.value = null
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString()
}
</script>

<style scoped>
.system-brain-console {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  margin-bottom: 32px;
}

.title {
  font-size: 32px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #1a1a1a;
}

.subtitle {
  font-size: 16px;
  color: #666;
  margin: 0;
}

.config-panel {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.tabs-header {
  border-bottom: 1px solid #e0e0e0;
}

.tabs {
  display: flex;
}

.tab {
  padding: 16px 24px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.tab:hover {
  color: #1976d2;
  background: #f5f5f5;
}

.tab.active {
  color: #1976d2;
  border-bottom-color: #1976d2;
}

.tab-panel {
  padding: 24px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.panel-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  color: #1a1a1a;
}

.panel-actions {
  display: flex;
  gap: 12px;
}

.btn {
  padding: 8px 16px;
  border-radius: 4px;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.btn:hover {
  background: #f5f5f5;
}

.btn-primary {
  background: #1976d2;
  color: white;
  border-color: #1976d2;
}

.btn-primary:hover {
  background: #1565c0;
}

.btn-outline {
  background: white;
  color: #1976d2;
  border-color: #1976d2;
}

.btn-outline:hover {
  background: #f3f8ff;
}

.loading {
  display: flex;
  justify-content: center;
  padding: 48px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #1976d2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.table-wrapper {
  overflow-x: auto;
}

.config-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.config-table th,
.config-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.config-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #1a1a1a;
}

.config-key {
  font-weight: 500;
  color: #1a1a1a;
}

.config-description {
  color: #666;
}

.version-chip {
  display: inline-block;
  padding: 2px 8px;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.switch-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.switch-input {
  display: none;
}

.switch-slider {
  position: relative;
  width: 44px;
  height: 24px;
  background: #ccc;
  border-radius: 12px;
  transition: background 0.2s;
}

.switch-slider::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: transform 0.2s;
}

.switch-input:checked + .switch-slider {
  background: #1976d2;
}

.switch-input:checked + .switch-slider::before {
  transform: translateX(20px);
}

.switch-text {
  font-size: 14px;
  color: #666;
}

.creator {
  color: #1a1a1a;
}

.update-time {
  color: #666;
  font-size: 14px;
}

.actions {
  text-align: right;
}

.action-menu {
  position: relative;
  display: inline-block;
}

.menu-trigger {
  padding: 8px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 4px;
  color: #666;
}

.menu-trigger:hover {
  background: #f5f5f5;
}

.menu-dropdown {
  position: absolute;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 120px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 16px;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  font-size: 14px;
  color: #1a1a1a;
}

.menu-item:hover {
  background: #f5f5f5;
}

.menu-item.danger {
  color: #d32f2f;
}

.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.dialog {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #e0e0e0;
}

.dialog-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.dialog-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.dialog-content {
  padding: 24px;
  max-height: 60vh;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #1a1a1a;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #1976d2;
}

.form-textarea {
  resize: vertical;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox-input {
  width: 16px;
  height: 16px;
}

.checkbox-text {
  font-size: 14px;
  color: #1a1a1a;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 24px;
  border-top: 1px solid #e0e0e0;
}

.alert {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 16px 20px;
  border-radius: 4px;
  color: white;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 3000;
  max-width: 400px;
}

.alert-error {
  background: #d32f2f;
}

.alert-success {
  background: #2e7d32;
}

.alert-close {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 18px;
  padding: 0;
  margin-left: auto;
}

.icon-refresh::before { content: '🔄'; }
.icon-add::before { content: '➕'; }
.icon-more::before { content: '⋮'; }
.icon-edit::before { content: '✏️'; }
.icon-publish::before { content: '📤'; }
.icon-history::before { content: '📜'; }
.icon-copy::before { content: '📋'; }
.icon-delete::before { content: '🗑️'; }
</style>
