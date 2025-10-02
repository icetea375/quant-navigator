<template>
  <div
    class="financial-snapshot"
    data-testid="financial-snapshot"
  >
    <!-- 期间选择器 -->
    <div class="period-selector">
      <el-select
        v-model="selectedPeriod"
        placeholder="选择期间"
        @change="handlePeriodSelect"
      >
        <el-option
          v-for="option in periodOptions"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        />
      </el-select>
    </div>

    <!-- 核心财务指标 -->
    <div
      v-if="currentData && !loading"
      class="core-metrics"
    >
      <el-row :gutter="16">
        <el-col
          v-for="metric in coreMetrics"
          :key="metric.title"
          :span="6"
        >
          <el-card
            class="metric-card"
            @mouseenter="handleMetricHover(metric.title, metric.value)"
          >
            <el-statistic
              :title="metric.title"
              :value="metric.value"
              :suffix="metric.suffix"
              :precision="metric.precision"
            >
              <template #prefix>
                <el-icon :color="metric.trend > 0 ? '#67c23a' : '#f56c6c'">
                  <component :is="metric.trend > 0 ? 'TrendCharts' : 'TrendCharts'" />
                </el-icon>
              </template>
            </el-statistic>
            <div class="metric-trend">
              <el-tag
                :type="metric.trend > 0 ? 'success' : 'danger'"
                size="small"
              >
                {{ metric.trend > 0 ? '+' : '' }}{{ (metric.trend * 100).toFixed(1) }}%
              </el-tag>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 盈利能力指标 -->
    <div
      v-if="currentData && !loading"
      class="profitability-metrics"
    >
      <h4>盈利能力指标</h4>
      <el-row :gutter="16">
        <el-col
          v-for="metric in profitabilityMetrics"
          :key="metric.title"
          :span="6"
        >
          <el-card class="metric-card">
            <el-statistic
              :title="metric.title"
              :value="metric.value"
              :suffix="metric.suffix"
              :precision="metric.precision"
            />
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 成长性指标 -->
    <div
      v-if="currentData && !loading"
      class="growth-metrics"
    >
      <h4>成长性指标</h4>
      <el-row :gutter="16">
        <el-col
          v-for="metric in growthMetrics"
          :key="metric.title"
          :span="6"
        >
          <el-card class="metric-card">
            <el-statistic
              :title="metric.title"
              :value="metric.value"
              :suffix="metric.suffix"
              :precision="metric.precision"
            />
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 财务趋势分析 -->
    <div
      v-if="currentData && !loading"
      class="trend-charts"
    >
      <h4>财务趋势分析</h4>
      <el-tabs v-model="activeChartTab">
        <el-tab-pane
          label="营收趋势"
          name="revenue"
        >
          <div class="chart-container">
            <slot name="revenue-chart">
              <!-- 默认情况下（生产环境），渲染真实的ECharts组件 -->
              <v-chart
                :option="revenueChartOption"
                style="height: 300px;"
              />
            </slot>
          </div>
        </el-tab-pane>
        <el-tab-pane
          label="利润趋势"
          name="profit"
        >
          <div class="chart-container">
            <slot name="profit-chart">
              <!-- 默认情况下（生产环境），渲染真实的ECharts组件 -->
              <v-chart
                :option="profitChartOption"
                style="height: 300px;"
              />
            </slot>
          </div>
        </el-tab-pane>
        <el-tab-pane
          label="盈利能力"
          name="profitability"
        >
          <div class="chart-container">
            <slot name="profitability-chart">
              <!-- 默认情况下（生产环境），渲染真实的ECharts组件 -->
              <v-chart
                :option="profitabilityChartOption"
                style="height: 300px;"
              />
            </slot>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 数据质量指标 -->
    <div
      v-if="currentData && !loading"
      class="data-quality"
    >
      <h4>数据质量</h4>
      <el-progress
        :percentage="dataQualityScore"
        :color="dataQualityScore >= 80 ? '#67c23a' : dataQualityScore >= 60 ? '#e6a23c' : '#f56c6c'"
        :stroke-width="8"
      />
      <p class="quality-text">
        数据完整性: {{ dataQualityScore }}%
      </p>
    </div>

    <!-- 加载状态 -->
    <div
      v-if="loading"
      class="loading-container"
    >
      <el-skeleton :rows="3" animated />
    </div>

    <!-- 错误状态 -->
    <el-alert
      v-if="error"
      type="error"
      :title="error"
      show-icon
      closable
      @close="handleErrorClose"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useFinancialSnapshot } from '@/composables/useFinancialSnapshot'
import type { FinancialSnapshotProps } from '@/types/arbitration'

// 条件导入ECharts - 只在非测试环境中导入
let VChart: any = null
let use: any = null

// 检查是否在测试环境中
const isTestEnvironment = typeof process !== 'undefined' && process.env.NODE_ENV?.includes('test')

if (!isTestEnvironment) {
  try {
    // 动态导入ECharts
    import('echarts/core').then(echartsCore => {
      import('echarts/renderers').then(echartsRenderers => {
        import('echarts/charts').then(echartsCharts => {
          import('echarts/components').then(echartsComponents => {
            import('vue-echarts').then(vueEcharts => {
              use = echartsCore.use
              VChart = vueEcharts.default
              
              // 注册 ECharts 组件
              use([
                echartsRenderers.CanvasRenderer,
                echartsCharts.LineChart,
                echartsCharts.BarChart,
                echartsComponents.TitleComponent,
                echartsComponents.TooltipComponent,
                echartsComponents.LegendComponent,
                echartsComponents.GridComponent
              ])
            })
          })
        })
      })
    })
  } catch (error) {
    console.warn('ECharts导入失败，使用模拟组件:', error)
  }
}

// 创建模拟的VChart组件
if (!VChart) {
  VChart = {
    name: 'VChart',
    template: '<div class="echarts-mock">ECharts模拟组件</div>',
    props: ['option', 'loading', 'loadingOptions']
  }
}

// ==================== Props ====================
const props = withDefaults(defineProps<FinancialSnapshotProps>(), {
  data: () => [],
  loading: false,
  error: undefined,
  onPeriodSelect: () => {
    // TODO: Implement period selection logic
  },
  onMetricHover: () => {
    // TODO: Implement metric hover logic
  }
})

// ==================== 组合式函数 ====================
// 唯一的、一行"思考"：调用我们的"外部大脑"
const {
  selectedPeriod,
  activeChartTab,
  currentData,
  periodOptions,
  coreMetrics,
  profitabilityMetrics,
  growthMetrics,
  trendData,
  dataQualityScore,
  revenueChartOption,
  profitChartOption,
  profitabilityChartOption,
  handlePeriodSelect,
  handleMetricHover,
  handleErrorClose
} = useFinancialSnapshot(props)

// ==================== 生命周期 ====================
onMounted(() => {
  // 组件挂载后的初始化逻辑
  console.log('FinancialSnapshot mounted')
})

// ==================== 监听器 ====================
watch(
  () => props.data,
  (newData) => {
    if (newData && newData.length > 0) {
      console.log('Data updated:', newData.length, 'items')
    }
  },
  { deep: true }
)

watch(
  () => selectedPeriod.value,
  (newPeriod) => {
    console.log('Period changed to:', newPeriod)
    // 期间变化时的处理
  }
)
</script>

<style scoped>
.financial-snapshot {
  height: 100%;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;
}

.period-selector {
  margin-bottom: 20px;
}

.core-metrics,
.profitability-metrics,
.growth-metrics {
  margin-bottom: 30px;
}

.metric-card {
  height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  transition: all 0.3s ease;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.metric-trend {
  margin-top: 8px;
}

.trend-charts {
  margin-bottom: 30px;
}

.chart-container {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.data-quality {
  margin-bottom: 20px;
}

.quality-text {
  margin-top: 10px;
  text-align: center;
  color: #666;
}

.loading-container {
  padding: 40px;
  text-align: center;
}

.echarts-mock {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
  border: 2px dashed #ccc;
  border-radius: 8px;
  color: #999;
  font-size: 16px;
}

h4 {
  margin-bottom: 16px;
  color: #333;
  font-weight: 600;
}
</style>


