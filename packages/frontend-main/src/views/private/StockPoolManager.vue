<template>
  <div class="stock-pool-manager">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>股票池管理</h1>
      <p>管理您的股票池，个性化投资组合</p>
    </div>

    <!-- 操作栏 -->
    <div class="action-bar">
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon>
        创建股票池
      </el-button>
      <div class="search-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索股票池..."
          prefix-icon="Search"
          clearable
          style="width: 300px;"
        />
      </div>
    </div>

    <!-- 股票池列表 -->
    <div class="stock-pools-grid" v-loading="loading">
      <div v-if="filteredStockPools.length === 0 && !loading" class="empty-state">
        <el-empty description="暂无股票池">
          <el-button type="primary" @click="showCreateDialog = true">
            创建第一个股票池
          </el-button>
        </el-empty>
      </div>

      <div
        v-for="pool in filteredStockPools"
        :key="pool.id"
        class="stock-pool-card"
      >
        <div class="card-header">
          <h3>{{ pool.name }}</h3>
          <div class="card-actions">
            <el-button type="text" size="small" @click="editPool(pool)">
              <el-icon><Edit /></el-icon>
            </el-button>
            <el-button type="text" size="small" @click="deletePool(pool)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>

        <div class="card-content">
          <p class="pool-description">{{ pool.description || '暂无描述' }}</p>

          <div class="pool-stats">
            <div class="stat-item">
              <span class="stat-label">股票数量</span>
              <span class="stat-value">{{ pool.symbols.length }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">创建时间</span>
              <span class="stat-value">{{ formatDate(pool.createdAt) }}</span>
            </div>
          </div>

          <div class="pool-symbols">
            <div class="symbols-header">
              <span>股票列表</span>
              <el-button type="text" size="small" @click="viewPoolDetails(pool)">
                查看全部
              </el-button>
            </div>
            <div class="symbols-list">
              <el-tag
                v-for="symbol in pool.symbols.slice(0, 5)"
                :key="symbol"
                size="small"
                class="symbol-tag"
              >
                {{ symbol }}
              </el-tag>
              <el-tag v-if="pool.symbols.length > 5" size="small" type="info">
                +{{ pool.symbols.length - 5 }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建/编辑股票池对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingPool ? '编辑股票池' : '创建股票池'"
      width="600px"
    >
      <el-form
        ref="poolFormRef"
        :model="poolForm"
        :rules="poolRules"
        label-width="80px"
      >
        <el-form-item label="名称" prop="name">
          <el-input v-model="poolForm.name" placeholder="请输入股票池名称" />
        </el-form-item>

        <el-form-item label="描述" prop="description">
          <el-input
            v-model="poolForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入股票池描述"
          />
        </el-form-item>

        <el-form-item label="股票代码" prop="symbols">
          <div class="symbols-input">
            <el-input
              v-model="newSymbol"
              placeholder="输入股票代码，按回车添加"
              @keyup.enter="addSymbol"
            />
            <el-button type="primary" @click="addSymbol">添加</el-button>
          </div>
          <div class="symbols-display">
            <el-tag
              v-for="(symbol, index) in poolForm.symbols"
              :key="index"
              closable
              @close="removeSymbol(index)"
              class="symbol-tag"
            >
              {{ symbol }}
            </el-tag>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="cancelEdit">取消</el-button>
        <el-button type="primary" @click="savePool" :loading="saving">
          {{ editingPool ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 股票池详情对话框 -->
    <el-dialog v-model="showDetailsDialog" title="股票池详情" width="800px">
      <div v-if="selectedPool" class="pool-details">
        <div class="details-header">
          <h3>{{ selectedPool.name }}</h3>
          <p>{{ selectedPool.description }}</p>
        </div>

        <div class="details-stats">
          <div class="stat-card">
            <div class="stat-number">{{ selectedPool.symbols.length }}</div>
            <div class="stat-label">股票数量</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ formatDate(selectedPool.createdAt) }}</div>
            <div class="stat-label">创建时间</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ formatDate(selectedPool.updatedAt) }}</div>
            <div class="stat-label">更新时间</div>
          </div>
        </div>

        <div class="details-symbols">
          <h4>股票列表</h4>
          <div class="symbols-grid">
            <el-tag
              v-for="symbol in selectedPool.symbols"
              :key="symbol"
              size="large"
              class="symbol-tag"
            >
              {{ symbol }}
            </el-tag>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { privateApi } from '@/services/market'
import type { StockPool } from '@/types/market'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Search, Edit, Delete } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const stockPools = ref<StockPool[]>([])
const loading = ref(false)
const saving = ref(false)
const searchKeyword = ref('')
const showCreateDialog = ref(false)
const showDetailsDialog = ref(false)
const editingPool = ref<StockPool | null>(null)
const selectedPool = ref<StockPool | null>(null)
const newSymbol = ref('')

const poolFormRef = ref<FormInstance>()

const poolForm = reactive({
  name: '',
  description: '',
  symbols: [] as string[]
})

const poolRules: FormRules = {
  name: [
    { required: true, message: '请输入股票池名称', trigger: 'blur' },
    { min: 2, message: '名称长度不能少于2个字符', trigger: 'blur' }
  ],
  symbols: [
    { required: true, message: '请至少添加一个股票代码', trigger: 'change' }
  ]
}

const filteredStockPools = computed(() => {
  if (!searchKeyword.value) return stockPools.value
  return stockPools.value.filter(pool =>
    pool.name.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
    pool.description?.toLowerCase().includes(searchKeyword.value.toLowerCase())
  )
})

const loadStockPools = async () => {
  loading.value = true
  try {
    const data = await privateApi.getStockPools()
    stockPools.value = data
  } catch (error) {
    console.error('Failed to load stock pools:', error)
    ElMessage.error('加载股票池失败')
  } finally {
    loading.value = false
  }
}

const addSymbol = () => {
  const symbol = newSymbol.value.trim().toUpperCase()
  if (symbol && !poolForm.symbols.includes(symbol)) {
    poolForm.symbols.push(symbol)
    newSymbol.value = ''
  }
}

const removeSymbol = (index: number) => {
  poolForm.symbols.splice(index, 1)
}

const editPool = (pool: StockPool) => {
  editingPool.value = pool
  poolForm.name = pool.name
  poolForm.description = pool.description
  poolForm.symbols = [...pool.symbols]
  showCreateDialog.value = true
}

const deletePool = async (pool: StockPool) => {
  try {
    await ElMessageBox.confirm(`确定要删除股票池"${pool.name}"吗？`, '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await privateApi.deleteStockPool(pool.id)
    ElMessage.success('删除成功')
    loadStockPools()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const viewPoolDetails = (pool: StockPool) => {
  selectedPool.value = pool
  showDetailsDialog.value = true
}

const savePool = async () => {
  if (!poolFormRef.value) return

  await poolFormRef.value.validate(async (valid) => {
    if (valid) {
      saving.value = true
      try {
        if (editingPool.value) {
          await privateApi.updateStockPool(editingPool.value.id, poolForm)
          ElMessage.success('更新成功')
        } else {
          await privateApi.createStockPool(poolForm)
          ElMessage.success('创建成功')
        }

        showCreateDialog.value = false
        resetForm()
        loadStockPools()
      } catch (error) {
        ElMessage.error(editingPool.value ? '更新失败' : '创建失败')
      } finally {
        saving.value = false
      }
    }
  })
}

const cancelEdit = () => {
  showCreateDialog.value = false
  resetForm()
}

const resetForm = () => {
  editingPool.value = null
  poolForm.name = ''
  poolForm.description = ''
  poolForm.symbols = []
  newSymbol.value = ''
}

const formatDate = (dateString: string) => {
  return dayjs(dateString).format('YYYY-MM-DD')
}

onMounted(() => {
  loadStockPools()
})
</script>

<style scoped>
.stock-pool-manager {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 30px;
}

.page-header h1 {
  font-size: 28px;
  color: #333;
  margin-bottom: 10px;
}

.page-header p {
  color: #666;
  font-size: 16px;
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.search-bar {
  display: flex;
  align-items: center;
}

.stock-pools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.empty-state {
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.stock-pool-card {
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
}

.stock-pool-card:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.card-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
}

.card-actions {
  display: flex;
  gap: 5px;
}

.card-content {
  color: #666;
}

.pool-description {
  margin-bottom: 15px;
  line-height: 1.6;
  font-size: 14px;
}

.pool-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 15px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px;
}

.stat-label {
  font-size: 12px;
  color: #999;
}

.stat-value {
  font-weight: 600;
  color: #333;
}

.pool-symbols {
  border-top: 1px solid #f0f0f0;
  padding-top: 15px;
}

.symbols-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-size: 14px;
  color: #333;
}

.symbols-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.symbol-tag {
  margin: 0;
}

.symbols-input {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.symbols-display {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 40px;
  padding: 10px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background: #fafafa;
}

.pool-details {
  padding: 20px 0;
}

.details-header {
  margin-bottom: 30px;
  text-align: center;
}

.details-header h3 {
  color: #333;
  margin-bottom: 10px;
}

.details-header p {
  color: #666;
  line-height: 1.6;
}

.details-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.details-symbols h4 {
  color: #333;
  margin-bottom: 15px;
}

.symbols-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

@media (max-width: 768px) {
  .action-bar {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }

  .search-bar {
    justify-content: center;
  }

  .stock-pools-grid {
    grid-template-columns: 1fr;
  }

  .pool-stats {
    grid-template-columns: 1fr;
  }

  .details-stats {
    grid-template-columns: 1fr;
  }
}
</style>
