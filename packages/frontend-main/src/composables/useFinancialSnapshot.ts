// 财务快照组合式函数 - 提取所有复杂的计算逻辑
import { computed, ref } from 'vue'
// 导入类型定义
export interface FinancialSnapshotProps {
  rawData: any | null // 原始数据，组件内部负责适配
  loading: boolean
  error: string | null
  onPeriodSelect?: (period: string) => void
  onMetricHover?: (metric: string, value: number) => void
  onErrorClose?: () => void
}

export function useFinancialSnapshot(props: FinancialSnapshotProps) {
  // ==================== 响应式数据 ====================
  const selectedPeriod = ref('latest')
  const activeChartTab = ref('revenue')

  // ==================== 计算属性 ====================
  const currentData = computed(() => {
    if (!props.rawData || !Array.isArray(props.rawData) || props.rawData.length === 0) return null

    if (selectedPeriod.value === 'latest') {
      return props.rawData[0]
    }

    return props.rawData.find(item => item.reportPeriod === selectedPeriod.value) || props.rawData[0]
  })

  const periodOptions = computed(() => {
    if (!props.rawData || !Array.isArray(props.rawData)) return []
    return props.rawData.map(item => ({
      value: item.reportPeriod,
      label: `${item.fiscalYear}${item.reportPeriod}`
    }))
  })

  const coreMetrics = computed(() => {
    if (!currentData.value) return []

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
    ]
  })

  const profitabilityMetrics = computed(() => {
    if (!currentData.value) return []

    return [
      {
        title: 'ROE',
        value: currentData.value.roe,
        suffix: '%',
        precision: 1
      },
      {
        title: 'ROA',
        value: currentData.value.roa,
        suffix: '%',
        precision: 1
      },
      {
        title: '资产负债率',
        value: currentData.value.debtToAssetRatio,
        suffix: '%',
        precision: 1
      },
      {
        title: '流动比率',
        value: currentData.value.currentRatio,
        suffix: '',
        precision: 2
      }
    ]
  })

  const growthMetrics = computed(() => {
    if (!currentData.value) return []

    return [
      {
        title: '营收3年复合增长率',
        value: currentData.value.revenueCAGR,
        suffix: '%',
        precision: 1
      },
      {
        title: '净利润3年复合增长率',
        value: currentData.value.netProfitCAGR,
        suffix: '%',
        precision: 1
      },
      {
        title: '总资产增长率',
        value: currentData.value.totalAssetGrowthRate,
        suffix: '%',
        precision: 1
      },
      {
        title: '股东权益增长率',
        value: currentData.value.shareholdersEquityGrowthRate,
        suffix: '%',
        precision: 1
      }
    ]
  })

  const trendData = computed(() => {
    if (!props.rawData || !Array.isArray(props.rawData)) return []
    return props.rawData.slice(0, 8).map(item => ({
      period: `${item.fiscalYear}${item.reportPeriod}`,
      revenue: item.revenue,
      revenueGrowth: item.revenueGrowthRate,
      netProfit: item.netProfitExcludingNonRecurring,
      netProfitGrowth: item.netProfitGrowthRate,
      grossMargin: item.grossMargin,
      netMargin: item.netMargin,
      roe: item.roe,
      roa: item.roa
    })).reverse()
  })

  const dataQualityScore = computed(() => {
    if (!currentData.value) return 0
    return Math.round(currentData.value.dataCompletenessScore * 100)
  })

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
  }))

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
  }))

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
  }))

  // ==================== 方法 ====================
  const handlePeriodSelect = (period: string) => {
    selectedPeriod.value = period
    props.onPeriodSelect?.(period)
  }

  const handleMetricHover = (title: string, value: number) => {
    props.onMetricHover?.(title, value)
  }

  const handleErrorClose = () => {
    // 清除错误状态
    if (props.onErrorClose) {
      props.onErrorClose()
    }
  }

  // ==================== 返回接口 ====================
  return {
    // 响应式数据
    selectedPeriod,
    activeChartTab,
    
    // 计算属性
    currentData,
    periodOptions,
    coreMetrics,
    profitabilityMetrics,
    growthMetrics,
    trendData,
    dataQualityScore,
    
    // 图表配置
    revenueChartOption,
    profitChartOption,
    profitabilityChartOption,
    
    // 方法
    handlePeriodSelect,
    handleMetricHover,
    handleErrorClose
  }
}

