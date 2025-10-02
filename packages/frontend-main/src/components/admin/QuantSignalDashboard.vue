<template>
  <div
    class="quant-signal-dashboard"
    data-testid="quant-signal-dashboard"
  >
    <!-- 信号概览 -->
    <div
      v-if="latestSignal && !loading"
      class="signal-overview"
    >
      <el-card class="overview-card">
        <template #header>
          <div class="card-header">
            <h3>量化信号概览</h3>
            <el-tag :type="getSignalStatusType(latestSignal.status)">
              {{ getSignalStatusLabel(latestSignal.status) }}
            </el-tag>
          </div>
        </template>

        <el-row :gutter="16">
          <el-col :span="8">
            <el-statistic
              title="综合信号强度"
              :value="latestSignal.overallSignalStrength"
              suffix="分"
              :precision="1"
            />
          </el-col>
          <el-col :span="8">
            <el-statistic
              title="信号置信度"
              :value="latestSignal.signalConfidence"
              suffix="%"
              :precision="1"
            />
          </el-col>
          <el-col :span="8">
            <el-statistic
              title="有效期"
              :value="latestSignal.validityDays"
              suffix="天"
            />
          </el-col>
        </el-row>
      </el-card>
    </div>

    <!-- 个股信号 -->
    <div
      v-if="latestSignal && !loading"
      class="individual-signals"
    >
      <h4>个股信号</h4>
      <el-row :gutter="16">
        <el-col
          v-for="signal in individualSignals"
          :key="signal.name"
          :span="6"
        >
          <el-card
            class="signal-card"
            @mouseenter="handleSignalHover(signal.name, signal.value)"
          >
            <div class="signal-header">
              <span class="signal-name">{{ signal.name }}</span>
              <el-tag
                :type="getSignalStrengthType(signal.value)"
                size="small"
              >
                {{ getSignalStrengthLabel(signal.value) }}
              </el-tag>
            </div>
            <div class="signal-value">
              <span class="value">{{ (signal.value || 0).toFixed(2) }}</span>
              <el-icon
                :color="getSignalDirectionColor(signal.value)"
                class="direction-icon"
              >
                <component :is="getSignalDirectionIcon(signal.value)" />
              </el-icon>
            </div>
            <el-progress
              :percentage="Math.min(Math.abs(signal.value) * 33.33, 100)"
              :color="getSignalColor(signal.value)"
              :show-text="false"
            />
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 市场背景信号 -->
    <div
      v-if="latestSignal && !loading"
      class="market-signals"
    >
      <h4>市场背景信号</h4>
      <el-row :gutter="16">
        <el-col
          v-for="signal in marketSignals"
          :key="signal.name"
          :span="6"
        >
          <el-card
            class="signal-card"
            @mouseenter="handleSignalHover(signal.name, signal.value)"
          >
            <div class="signal-header">
              <span class="signal-name">{{ signal.name }}</span>
              <el-tag
                :type="getSignalStrengthType(signal.value)"
                size="small"
              >
                {{ getSignalStrengthLabel(signal.value) }}
              </el-tag>
            </div>
            <div class="signal-value">
              <span class="value">{{ (signal.value || 0).toFixed(2) }}</span>
              <el-icon
                :color="getSignalDirectionColor(signal.value)"
                class="direction-icon"
              >
                <component :is="getSignalDirectionIcon(signal.value)" />
              </el-icon>
            </div>
            <el-progress
              :percentage="Math.min(Math.abs(signal.value) * 33.33, 100)"
              :color="getSignalColor(signal.value)"
              :show-text="false"
            />
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 管理层可信度因子 -->
    <div
      v-if="latestSignal && !loading"
      class="management-factors"
    >
      <h4>管理层可信度因子</h4>
      <el-row :gutter="16">
        <el-col
          v-for="factor in managementFactors"
          :key="factor.name"
          :span="6"
        >
          <el-card class="factor-card">
            <div class="factor-header">
              <span class="factor-name">{{ factor.name }}</span>
            </div>
            <div class="factor-value">
              <el-progress
                :percentage="factor.value * 100"
                :color="getFactorColor(factor.value)"
                :show-text="false"
              />
              <span class="value-text">{{ (factor.value * 100).toFixed(1) }}%</span>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 技术分析信号 -->
    <div
      v-if="latestSignal && !loading"
      class="technical-signals"
    >
      <h4>技术分析信号</h4>
      <el-row :gutter="16">
        <el-col
          v-for="signal in technicalSignals"
          :key="signal.name"
          :span="6"
        >
          <el-card
            class="signal-card"
            @mouseenter="handleSignalHover(signal.name, signal.value)"
          >
            <div class="signal-header">
              <span class="signal-name">{{ signal.name }}</span>
            </div>
            <div class="signal-value">
              <span class="value">{{ (signal.value || 0).toFixed(2) }}</span>
            </div>
            <el-progress
              :percentage="Math.min(Math.abs(signal.value) * 10, 100)"
              :color="getTechnicalSignalColor(signal.name, signal.value)"
              :show-text="false"
            />
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 雷达图 -->
    <div
      v-if="latestSignal && !loading"
      class="radar-chart"
    >
      <h4>多维度信号雷达图</h4>
      <el-card>
        <div class="chart-container">
          <slot name="radar-chart">
            <!-- 默认情况下（生产环境），渲染真实的ECharts组件 -->
            <v-chart
              :option="radarChartOption"
              style="height: 400px;"
            />
          </slot>
        </div>
      </el-card>
    </div>

    <!-- 空状态 -->
    <el-empty
      v-if="!loading && (!props.rawData?.signals || props.rawData.signals.length === 0)"
      description="暂无量化信号数据"
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
import { computed } from 'vue';
// 完全禁用 ECharts 导入 - 使用模拟组件
const VChart = {
  name: 'VChart',
  template: '<div class="echarts-mock">ECharts模拟组件</div>',
  props: ['option', 'loading', 'loadingOptions']
}
import type { QuantSignalDashboardProps } from '@/types/arbitration';

// ==================== Props ====================
const props = withDefaults(defineProps<QuantSignalDashboardProps>(), {
  rawData: null,
  loading: false,
  error: null,
  onSignalHover: () => {},
  onSignalClick: () => {}
});

// ==================== 适配器计算属性 ====================
// 这是组件的"适配器" - 负责将原始数据转换为内部渲染所需的数据结构
const latestSignal = computed(() => {
  if (!props.rawData?.signals || !Array.isArray(props.rawData.signals) || props.rawData.signals.length === 0) {
    return null;
  }
  return props.rawData.signals[0];
});

const individualSignals = computed(() => {
  if (!latestSignal.value) return [];

  return [
    { name: '收益率Z分数', value: latestSignal.value.returnZScore || 0 },
    { name: '成交量Z分数', value: latestSignal.value.volumeZScore || 0 },
    { name: '动量Z分数', value: latestSignal.value.momentumZScore || 0 },
    { name: '波动率Z分数', value: latestSignal.value.volatilityZScore || 0 }
  ];
});

const marketSignals = computed(() => {
  if (!latestSignal.value) return [];

  return [
    { name: '宏观风险Z分数', value: latestSignal.value.macroRiskZScore || 0 },
    { name: '市场风格Z分数', value: latestSignal.value.marketStyleZScore || 0 },
    { name: '行业轮动Z分数', value: latestSignal.value.industryRotationZScore || 0 },
    { name: '概念热度Z分数', value: latestSignal.value.conceptZScore || 0 }
  ];
});

const managementFactors = computed(() => {
  if (!latestSignal.value) return [];

  return [
    { name: 'MD&A履行率', value: latestSignal.value.mdaFulfillmentRate || 0 },
    { name: '管理层可信度', value: latestSignal.value.managementCredibilityScore || 0 },
    { name: '披露质量', value: latestSignal.value.disclosureQualityScore || 0 },
    { name: '财务透明度', value: latestSignal.value.financialTransparencyScore || 0 }
  ];
});

const technicalSignals = computed(() => {
  if (!latestSignal.value) return [];

  return [
    { name: 'RSI', value: latestSignal.value.rsi || 0 },
    { name: 'MACD信号', value: latestSignal.value.macdSignal || 0 },
    { name: '布林带位置', value: latestSignal.value.bollingerPosition || 0 },
    { name: '均线信号', value: latestSignal.value.maSignal || 0 }
  ];
});

const radarChartOption = computed(() => {
  if (!latestSignal.value) return {};

  const data = [
    {
      value: [
        Math.abs(latestSignal.value.returnZScore || 0),
        Math.abs(latestSignal.value.volumeZScore || 0),
        Math.abs(latestSignal.value.momentumZScore || 0),
        Math.abs(latestSignal.value.volatilityZScore || 0),
        Math.abs(latestSignal.value.macroRiskZScore || 0),
        Math.abs(latestSignal.value.marketStyleZScore || 0)
      ],
      name: '当前信号'
    }
  ];

  return {
    title: {
      text: '多维度信号强度',
      left: 'center'
    },
    tooltip: {},
    legend: {
      data: ['当前信号'],
      bottom: 0
    },
    radar: {
      indicator: [
        { name: '收益率', max: 3 },
        { name: '成交量', max: 3 },
        { name: '动量', max: 3 },
        { name: '波动率', max: 3 },
        { name: '宏观风险', max: 3 },
        { name: '市场风格', max: 3 }
      ]
    },
    series: [
      {
        name: '信号强度',
        type: 'radar',
        data: data
      }
    ]
  };
});

// ==================== 方法 ====================
const handleSignalHover = (signal: string, value: number) => {
  props.onSignalHover?.(signal, value);
};

const getSignalStatusType = (status: string) => {
  const types: Record<string, string> = {
    active: 'success',
    expired: 'warning',
    cancelled: 'danger',
    archived: 'info'
  };
  return types[status] || 'info';
};

const getSignalStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    active: '活跃',
    expired: '已过期',
    cancelled: '已取消',
    archived: '已归档'
  };
  return labels[status] || status;
};

const getSignalStrengthType = (value: number) => {
  const absValue = Math.abs(value);
  if (absValue >= 2) return 'danger';
  if (absValue >= 1.5) return 'warning';
  if (absValue >= 1) return 'success';
  return 'info';
};

const getSignalStrengthLabel = (value: number) => {
  const absValue = Math.abs(value);
  if (absValue >= 2) return '强';
  if (absValue >= 1.5) return '中';
  if (absValue >= 1) return '弱';
  return '中性';
};

const getSignalDirectionColor = (value: number) => {
  if (value > 0) return '#67c23a';
  if (value < 0) return '#f56c6c';
  return '#909399';
};

const getSignalDirectionIcon = (value: number) => {
  if (value > 0) return 'TrendCharts';
  if (value < 0) return 'TrendDown';
  return 'Minus';
};

const getSignalColor = (value: number) => {
  if (value > 0) return '#67c23a';
  if (value < 0) return '#f56c6c';
  return '#909399';
};

const getFactorColor = (value: number) => {
  if (value >= 0.8) return '#67c23a';
  if (value >= 0.6) return '#e6a23c';
  return '#f56c6c';
};

const getTechnicalSignalColor = (name: string, value: number) => {
  if (name === 'RSI') {
    if (value >= 70) return '#f56c6c';
    if (value <= 30) return '#67c23a';
    return '#e6a23c';
  }
  return getSignalColor(value);
};

const handleErrorClose = () => {
  // 错误处理逻辑
};
</script>

<style scoped>
.quant-signal-dashboard {
  height: 100%;
  overflow-y: auto;
}

.signal-overview {
  margin-bottom: 24px;
}

.overview-card .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.overview-card .card-header h3 {
  margin: 0;
  color: #333;
}

.individual-signals,
.market-signals,
.management-factors,
.technical-signals {
  margin-bottom: 24px;
}

h4 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.signal-card,
.factor-card {
  height: 120px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.signal-card:hover,
.factor-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.signal-header,
.factor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.signal-name,
.factor-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.signal-value {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.value {
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.direction-icon {
  font-size: 16px;
}

.factor-value {
  display: flex;
  align-items: center;
  gap: 8px;
}

.value-text {
  font-size: 12px;
  color: #666;
  min-width: 40px;
}

.radar-chart {
  margin-bottom: 24px;
}

.chart-container {
  background: #fff;
  border-radius: 6px;
  padding: 16px;
}

.loading {
  padding: 20px;
}

/* 滚动条样式 */
.quant-signal-dashboard::-webkit-scrollbar {
  width: 6px;
}

.quant-signal-dashboard::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.quant-signal-dashboard::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.quant-signal-dashboard::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
