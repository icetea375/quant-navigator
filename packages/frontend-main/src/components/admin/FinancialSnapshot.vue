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
          :span="8"
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
          :span="12"
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
            />
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 趋势图表 -->
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
            <v-chart
              :option="revenueChartOption"
              style="height: 300px;"
            />
          </div>
        </el-tab-pane>
        <el-tab-pane
          label="利润趋势"
          name="profit"
        >
          <div class="chart-container">
            <v-chart
              :option="profitChartOption"
              style="height: 300px;"
            />
          </div>
        </el-tab-pane>
        <el-tab-pane
          label="盈利能力"
          name="profitability"
        >
          <div class="chart-container">
            <v-chart
              :option="profitabilityChartOption"
              style="height: 300px;"
            />
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
      <el-card>
        <el-progress
          :percentage="dataQualityScore"
          :color="getDataQualityColor(dataQualityScore)"
        >
          <template #default="{ percentage }">
            <span class="progress-text">数据完整性: {{ percentage }}%</span>
          </template>
        </el-progress>
      </el-card>
    </div>

    <!-- 空状态 -->
    <el-empty
      v-if="!loading && (!props.data || props.data.length === 0)"
      description="暂无财务数据"
    />

    <!-- 加载状态 -->
    <div
      v-if="loading"
      class="loading"
    >
      <el-skeleton
        :rows="4"
        animated
      />
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
import { ref, computed, watch } from 'vue';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart, BarChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components';
import VChart from 'vue-echarts';
import type { FinancialSnapshotProps } from '@/types/arbitration';

// 注册 ECharts 组件
use([
  CanvasRenderer,
  LineChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
]);

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
});

// ==================== 响应式数据 ====================
const selectedPeriod = ref('latest');
const activeChartTab = ref('revenue');

// ==================== 计算属性 ====================
const currentData = computed(() => {
  if (!props.data || !Array.isArray(props.data) || props.data.length === 0) return null;

  if (selectedPeriod.value === 'latest') {
    return props.data[0];
  }

  return props.data.find(item => item.reportPeriod === selectedPeriod.value) || props.data[0];
});

const periodOptions = computed(() => {
  if (!props.data || !Array.isArray(props.data)) return [];
  return props.data.map(item => ({
    value: item.reportPeriod,
    label: `${item.fiscalYear}${item.reportPeriod}`
  }));
});

const coreMetrics = computed(() => {
  if (!currentData.value) return [];

  return [
    {
      title: '营业收入',
      value: currentData.value.revenue,
      suffix: '万元',
      precision: 2,
      trend: currentData.value.revenueGrowthRate
    },
    {
      title: '扣非净利润',
      value: currentData.value.netProfitExcludingNonRecurring,
      suffix: '万元',
      precision: 2,
      trend: currentData.value.netProfitGrowthRate
    },
    {
      title: '毛利率',
      value: currentData.value.grossMargin,
      suffix: '%',
      precision: 1,
      trend: 0
    },
    {
      title: '净利率',
      value: currentData.value.netMargin,
      suffix: '%',
      precision: 1,
      trend: 0
    }
  ];
});

const profitabilityMetrics = computed(() => {
  if (!currentData.value) return [];

  return [
    {
      title: 'ROE',
      value: currentData.value.roe,
      suffix: '%',
      precision: 2
    },
    {
      title: 'ROA',
      value: currentData.value.roa,
      suffix: '%',
      precision: 2
    },
    {
      title: 'EPS',
      value: currentData.value.eps,
      suffix: '元',
      precision: 2
    }
  ];
});

const growthMetrics = computed(() => {
  if (!currentData.value) return [];

  return [
    {
      title: '营收3年复合增长率',
      value: currentData.value.revenueCagr3y,
      suffix: '%',
      precision: 2
    },
    {
      title: '利润3年复合增长率',
      value: currentData.value.profitCagr3y,
      suffix: '%',
      precision: 2
    }
  ];
});

const trendData = computed(() => {
  if (!props.data || !Array.isArray(props.data)) return [];
  return props.data.slice(0, 8).map(item => ({
    period: `${item.fiscalYear}${item.reportPeriod}`,
    revenue: item.revenue,
    revenueGrowth: item.revenueGrowthRate,
    netProfit: item.netProfitExcludingNonRecurring,
    netProfitGrowth: item.netProfitGrowthRate,
    grossMargin: item.grossMargin,
    netMargin: item.netMargin,
    roe: item.roe,
    roa: item.roa
  })).reverse();
});

const dataQualityScore = computed(() => {
  if (!currentData.value) return 0;
  return Math.round(currentData.value.dataCompletenessScore * 100);
});

// ==================== 图表配置 ====================
const revenueChartOption = computed(() => ({
  title: {
    text: '营收趋势',
    left: 'center'
  },
  tooltip: {
    trigger: 'axis'
  },
  xAxis: {
    type: 'category',
    data: trendData.value.map(item => item.period)
  },
  yAxis: {
    type: 'value',
    name: '万元'
  },
  series: [
    {
      name: '营业收入',
      type: 'line',
      data: trendData.value.map(item => item.revenue),
      smooth: true,
      itemStyle: {
        color: '#409eff'
      }
    }
  ]
}));

const profitChartOption = computed(() => ({
  title: {
    text: '利润趋势',
    left: 'center'
  },
  tooltip: {
    trigger: 'axis'
  },
  xAxis: {
    type: 'category',
    data: trendData.value.map(item => item.period)
  },
  yAxis: {
    type: 'value',
    name: '万元'
  },
  series: [
    {
      name: '扣非净利润',
      type: 'line',
      data: trendData.value.map(item => item.netProfit),
      smooth: true,
      itemStyle: {
        color: '#67c23a'
      }
    }
  ]
}));

const profitabilityChartOption = computed(() => ({
  title: {
    text: '盈利能力指标',
    left: 'center'
  },
  tooltip: {
    trigger: 'axis'
  },
  legend: {
    data: ['毛利率', '净利率', 'ROE', 'ROA']
  },
  xAxis: {
    type: 'category',
    data: trendData.value.map(item => item.period)
  },
  yAxis: {
    type: 'value',
    name: '%'
  },
  series: [
    {
      name: '毛利率',
      type: 'line',
      data: trendData.value.map(item => item.grossMargin),
      smooth: true
    },
    {
      name: '净利率',
      type: 'line',
      data: trendData.value.map(item => item.netMargin),
      smooth: true
    },
    {
      name: 'ROE',
      type: 'line',
      data: trendData.value.map(item => item.roe),
      smooth: true
    },
    {
      name: 'ROA',
      type: 'line',
      data: trendData.value.map(item => item.roa),
      smooth: true
    }
  ]
}));

// ==================== 方法 ====================
const handlePeriodSelect = (period: string) => {
  selectedPeriod.value = period;
  props.onPeriodSelect?.(period);
};

const handleMetricHover = (metric: string, value: number) => {
  props.onMetricHover?.(metric, value);
};

const getDataQualityColor = (score: number) => {
  if (score >= 90) return '#67c23a';
  if (score >= 70) return '#e6a23c';
  return '#f56c6c';
};

const handleErrorClose = () => {
  // 错误处理逻辑
};

// ==================== 监听器 ====================
watch(selectedPeriod, () => {
  // 期间变化时的处理
});
</script>

<style scoped>
.financial-snapshot {
  height: 100%;
  overflow-y: auto;
}

.period-selector {
  margin-bottom: 20px;
  text-align: right;
}

.core-metrics,
.profitability-metrics,
.growth-metrics {
  margin-bottom: 24px;
}

.metric-card {
  height: 120px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.metric-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.metric-trend {
  margin-top: 8px;
  text-align: center;
}

h4 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.trend-charts {
  margin-bottom: 24px;
}

.chart-container {
  background: #fff;
  border-radius: 6px;
  padding: 16px;
}

.data-quality {
  margin-bottom: 24px;
}

.progress-text {
  font-size: 14px;
  color: #666;
}

.loading {
  padding: 20px;
}

/* 滚动条样式 */
.financial-snapshot::-webkit-scrollbar {
  width: 6px;
}

.financial-snapshot::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.financial-snapshot::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.financial-snapshot::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
