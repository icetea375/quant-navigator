<template>
  <div
    class="flow-chips-viewer"
    data-testid="flow-chips-viewer"
  >
    <!-- 标签页切换 -->
    <el-tabs
      v-model="activeTab"
      class="main-tabs"
    >
      <!-- 资金流向标签页 -->
      <el-tab-pane
        label="资金流向"
        name="flow"
      >
        <div class="flow-content">
          <!-- 资金流向概览 -->
          <div
            v-if="flowData"
            class="flow-overview"
          >
            <el-card class="overview-card">
              <template #header>
                <h3>资金流向概览</h3>
              </template>

              <el-row :gutter="16">
                <el-col :span="6">
                  <el-statistic
                    title="净流入金额"
                    :value="flowData.netAmount"
                    :precision="2"
                    suffix="万元"
                    :value-style="{ color: flowData.netAmount > 0 ? '#67c23a' : '#f56c6c' }"
                  >
                    <template #prefix>
                      <el-icon :color="flowData.netAmount > 0 ? '#67c23a' : '#f56c6c'">
                        <TrendCharts />
                      </el-icon>
                    </template>
                  </el-statistic>
                </el-col>
                <el-col :span="6">
                  <el-statistic
                    title="净流入比例"
                    :value="flowData.netInflowRatio"
                    :precision="2"
                    suffix="%"
                    :value-style="{ color: flowData.netInflowRatio > 0 ? '#67c23a' : '#f56c6c' }"
                  />
                </el-col>
                <el-col :span="6">
                  <el-statistic
                    title="流向强度"
                    :value="flowData.flowIntensity"
                    :precision="2"
                    :value-style="{ color: getIntensityColor(flowData.flowIntensity) }"
                  />
                </el-col>
                <el-col :span="6">
                  <el-statistic
                    title="异常评分"
                    :value="flowData.flowAnomalyScore"
                    :precision="2"
                    :value-style="{ color: getAnomalyColor(flowData.flowAnomalyScore) }"
                  />
                </el-col>
              </el-row>
            </el-card>
          </div>

          <!-- 资金流向趋势图 -->
          <div
            v-if="flowData"
            class="flow-trend"
          >
            <el-card>
              <template #header>
                <h4>资金流向趋势</h4>
              </template>
              <div class="chart-container">
                <slot name="flow-trend-chart">
                  <!-- 默认情况下（生产环境），渲染真实的ECharts组件 -->
                  <v-chart
                    :option="flowTrendChartOption"
                    style="height: 300px;"
                  />
                </slot>
              </div>
            </el-card>
          </div>

          <!-- 资金流向详情 -->
          <div
            v-if="flowData"
            class="flow-details"
          >
            <el-card>
              <template #header>
                <h4>资金流向详情</h4>
              </template>

              <el-row :gutter="16">
                <el-col :span="12">
                  <div class="detail-item">
                    <span class="label">主力占比:</span>
                    <el-progress
                      :percentage="flowData.mainForceRatio * 100"
                      :color="getProgressColor(flowData.mainForceRatio)"
                    />
                  </div>
                </el-col>
                <el-col :span="12">
                  <div class="detail-item">
                    <span class="label">散户占比:</span>
                    <el-progress
                      :percentage="flowData.retailRatio * 100"
                      :color="getProgressColor(flowData.retailRatio)"
                    />
                  </div>
                </el-col>
              </el-row>
            </el-card>
          </div>
        </div>
      </el-tab-pane>

      <!-- 龙虎榜标签页 -->
      <el-tab-pane
        label="龙虎榜"
        name="toplist"
      >
        <div class="toplist-content">
          <el-card v-if="topListData.length > 0">
            <template #header>
              <h4>龙虎榜数据</h4>
            </template>

            <el-table
              :data="topListData"
              stripe
            >
              <el-table-column
                prop="seatName"
                label="席位名称"
                width="150"
              />
              <el-table-column
                prop="seatCategory"
                label="席位类型"
                width="100"
              >
                <template #default="{ row }">
                  <el-tag :type="getSeatTypeColor(row.seatType)">
                    {{ getSeatTypeLabel(row.seatType) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column
                prop="buyAmount"
                label="买入金额"
                width="120"
              >
                <template #default="{ row }">
                  <span style="color: #67c23a;">{{ formatAmount(row.buyAmount) }}</span>
                </template>
              </el-table-column>
              <el-table-column
                prop="sellAmount"
                label="卖出金额"
                width="120"
              >
                <template #default="{ row }">
                  <span style="color: #f56c6c;">{{ formatAmount(row.sellAmount) }}</span>
                </template>
              </el-table-column>
              <el-table-column
                prop="netAmount"
                label="净买入"
                width="120"
              >
                <template #default="{ row }">
                  <span :style="{ color: row.netAmount > 0 ? '#67c23a' : '#f56c6c' }">
                    {{ formatAmount(row.netAmount) }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column
                prop="priceImpactScore"
                label="价格影响"
                width="100"
              >
                <template #default="{ row }">
                  <el-tag :type="getScoreType(row.priceImpactScore)">
                    {{ (row.priceImpactScore * 100).toFixed(1) }}%
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </el-card>

          <el-empty
            v-else
            description="暂无龙虎榜数据"
          />
        </div>
      </el-tab-pane>

      <!-- 筹码分布标签页 -->
      <el-tab-pane
        label="筹码分布"
        name="chips"
      >
        <div class="chips-content">
          <el-card v-if="chipDistributionData.length > 0">
            <template #header>
              <h4>筹码分布分析</h4>
            </template>

            <!-- 筹码分布图表 -->
            <div class="chart-container">
              <slot name="chip-distribution-chart">
                <!-- 默认情况下（生产环境），渲染真实的ECharts组件 -->
                <v-chart
                  :option="chipDistributionChartOption"
                  style="height: 400px;"
                />
              </slot>
            </div>

            <!-- 筹码分布详情 -->
            <div class="chip-details">
              <el-row :gutter="16">
                <el-col
                  v-for="chip in chipDistributionData"
                  :key="chip.distributionId"
                  :span="8"
                >
                  <el-card
                    class="chip-card"
                    @mouseenter="handleChipHover(chip.distributionType, chip.chipQuantity)"
                  >
                    <div class="chip-header">
                      <span class="chip-type">{{ getChipTypeLabel(chip.distributionType) }}</span>
                      <el-tag :type="getChipStatusType(chip.chipStatus)">
                        {{ getChipStatusLabel(chip.chipStatus) }}
                      </el-tag>
                    </div>
                    <div class="chip-content">
                      <div class="chip-price-range">
                        <span class="price-label">价格区间:</span>
                        <span class="price-value">{{ chip.priceLower }} - {{ chip.priceUpper }}</span>
                      </div>
                      <div class="chip-quantity">
                        <span class="quantity-label">筹码数量:</span>
                        <span class="quantity-value">{{ formatAmount(chip.chipQuantity) }}</span>
                      </div>
                      <div class="chip-ratio">
                        <span class="ratio-label">占比:</span>
                        <el-progress
                          :percentage="chip.chipRatio * 100"
                          :color="getChipRatioColor(chip.chipRatio)"
                          :show-text="false"
                        />
                        <span class="ratio-value">{{ (chip.chipRatio * 100).toFixed(1) }}%</span>
                      </div>
                    </div>
                  </el-card>
                </el-col>
              </el-row>
            </div>
          </el-card>

          <el-empty
            v-else
            description="暂无筹码分布数据"
          />
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 空状态 -->
    <el-empty
      v-if="!loading && !flowData && topListData.length === 0 && chipDistributionData.length === 0"
      description="暂无资金流向和筹码数据"
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
import { ref, computed } from 'vue';
// 完全禁用 ECharts 导入 - 使用模拟组件
const VChart = {
  name: 'VChart',
  template: '<div class="echarts-mock">ECharts模拟组件</div>',
  props: ['option', 'loading', 'loadingOptions']
}
import { TrendCharts } from '@element-plus/icons-vue';
import type { FlowAndChipsViewerProps, ChipDistributionItem } from '@/types/arbitration';


// ==================== Props ====================
const props = withDefaults(defineProps<FlowAndChipsViewerProps>(), {
  rawData: null,
  loading: false,
  error: null,
  onFlowHover: () => {},
  onChipHover: () => {}
});

// ==================== 适配器计算属性 ====================
// 这是组件的"适配器" - 负责将原始数据转换为内部渲染所需的数据结构
const flowData = computed(() => {
  return props.rawData?.moneyFlow || null;
});

const topListData = computed(() => {
  return props.rawData?.topList || [];
});

const chipDistributionData = computed(() => {
  return props.rawData?.chipDistribution || [];
});

// ==================== 响应式数据 ====================
const activeTab = ref('flow');

// ==================== 计算属性 ====================

const flowTrendData = computed(() => {
  if (!flowData.value) return [];

  return [
    { period: '5日均值', value: flowData.value.avgNetInflow5d },
    { period: '10日均值', value: flowData.value.avgNetInflow10d },
    { period: '20日均值', value: flowData.value.avgNetInflow20d },
    { period: '当前', value: flowData.value.netAmount }
  ];
});

const flowTrendChartOption = computed(() => ({
  title: {
    text: '资金流向趋势对比',
    left: 'center'
  },
  tooltip: {
    trigger: 'axis'
  },
  xAxis: {
    type: 'category',
    data: flowTrendData.value.map(item => item.period)
  },
  yAxis: {
    type: 'value',
    name: '万元'
  },
  series: [
    {
      name: '净流入金额',
      type: 'bar',
      data: flowTrendData.value.map(item => item.value),
      itemStyle: {
        color: function(params: any) {
          return params.value > 0 ? '#67c23a' : '#f56c6c';
        }
      }
    }
  ]
}));

const chipDistributionChartOption = computed(() => {
  if (chipDistributionData.value.length === 0) return {};

  const data = chipDistributionData.value.map(chip => ({
    name: `${chip.priceLower}-${chip.priceUpper}`,
    value: chip.chipQuantity,
    priceRange: `${chip.priceLower}-${chip.priceUpper}`,
    ratio: chip.chipRatio
  }));

  return {
    title: {
      text: '筹码分布图',
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    series: [
      {
        name: '筹码分布',
        type: 'pie',
        radius: '50%',
        data: data,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  };
});

// ==================== 方法 ====================
const handleChipHover = (item: string, value: number) => {
  props.onChipHover?.(item, value);
};

const getIntensityColor = (intensity: number) => {
  if (intensity > 0.7) return '#67c23a';
  if (intensity > 0.4) return '#e6a23c';
  return '#f56c6c';
};

const getAnomalyColor = (score: number) => {
  if (score > 0.7) return '#f56c6c';
  if (score > 0.4) return '#e6a23c';
  return '#67c23a';
};

const getProgressColor = (value: number) => {
  if (value > 0.7) return '#67c23a';
  if (value > 0.4) return '#e6a23c';
  return '#f56c6c';
};

const getSeatTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    buy: 'success',
    sell: 'danger',
    net: 'info'
  };
  return colors[type] || 'info';
};

const getSeatTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    buy: '买入',
    sell: '卖出',
    net: '净买入'
  };
  return labels[type] || type;
};

const getScoreType = (score: number) => {
  if (score > 0.7) return 'danger';
  if (score > 0.4) return 'warning';
  return 'success';
};

const getChipTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    cost_distribution: '成本分布',
    volume_distribution: '成交量分布',
    price_distribution: '价格分布'
  };
  return labels[type] || type;
};

const getChipStatusType = (status: string) => {
  const types: Record<string, string> = {
    active: 'success',
    locked: 'warning',
    floating: 'info'
  };
  return types[status] || 'info';
};

const getChipStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    active: '活跃',
    locked: '锁定',
    floating: '浮动'
  };
  return labels[status] || status;
};

const getChipRatioColor = (ratio: number) => {
  if (ratio > 0.3) return '#67c23a';
  if (ratio > 0.1) return '#e6a23c';
  return '#f56c6c';
};

const formatAmount = (amount: number | undefined) => {
  if (!amount && amount !== 0) return '0';
  if (amount >= 10000) {
    return (amount / 10000).toFixed(1) + '万';
  }
  return amount.toFixed(0);
};

const handleErrorClose = () => {
  // 错误处理逻辑
};
</script>

<style scoped>
.flow-chips-viewer {
  height: 100%;
  overflow-y: auto;
}

.main-tabs {
  height: 100%;
}

.flow-content,
.toplist-content,
.chips-content {
  height: 100%;
  overflow-y: auto;
}

.flow-overview {
  margin-bottom: 20px;
}

.overview-card h3 {
  margin: 0;
  color: #333;
}

.flow-trend,
.chip-details {
  margin-bottom: 20px;
}

.chart-container {
  background: #fff;
  border-radius: 6px;
  padding: 16px;
}

.detail-item {
  margin-bottom: 16px;
}

.detail-item .label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.chip-card {
  margin-bottom: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.chip-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.chip-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.chip-type {
  font-weight: 500;
  color: #333;
}

.chip-content {
  space-y: 8px;
}

.chip-price-range,
.chip-quantity,
.chip-ratio {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.price-label,
.quantity-label,
.ratio-label {
  font-size: 12px;
  color: #666;
}

.price-value,
.quantity-value,
.ratio-value {
  font-weight: 500;
  color: #333;
}

.chip-ratio {
  gap: 8px;
}

.ratio-value {
  min-width: 40px;
  text-align: right;
}

.loading {
  padding: 20px;
}

/* 滚动条样式 */
.flow-chips-viewer::-webkit-scrollbar,
.flow-content::-webkit-scrollbar,
.toplist-content::-webkit-scrollbar,
.chips-content::-webkit-scrollbar {
  width: 6px;
}

.flow-chips-viewer::-webkit-scrollbar-track,
.flow-content::-webkit-scrollbar-track,
.toplist-content::-webkit-scrollbar-track,
.chips-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.flow-chips-viewer::-webkit-scrollbar-thumb,
.flow-content::-webkit-scrollbar-thumb,
.toplist-content::-webkit-scrollbar-thumb,
.chips-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.flow-chips-viewer::-webkit-scrollbar-thumb:hover,
.flow-content::-webkit-scrollbar-thumb:hover,
.toplist-content::-webkit-scrollbar-thumb:hover,
.chips-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
