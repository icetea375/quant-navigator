// useFinancialSnapshot 组合式函数单元测试
import { describe, it, expect } from 'vitest'
import { useFinancialSnapshot } from '@/composables/useFinancialSnapshot'
import type { FinancialSnapshotProps } from '@/composables/useFinancialSnapshot'

describe('useFinancialSnapshot', () => {
  const mockProps: FinancialSnapshotProps = {
    rawData: [
      {
        reportPeriod: 'Q1',
        fiscalYear: '2023',
        revenue: 1000000,
        revenueGrowthRate: 0.15,
        netProfitExcludingNonRecurring: 200000,
        netProfitGrowthRate: 0.08,
        grossMargin: 0.3,
        netMargin: 0.1,
        roe: 0.15,
        roa: 0.08,
        debtToAssetRatio: 0.4,
        currentRatio: 1.5,
        revenueCAGR: 0.12,
        netProfitCAGR: 0.1,
        totalAssetGrowthRate: 0.08,
        shareholdersEquityGrowthRate: 0.1,
        dataCompletenessScore: 0.95
      },
      {
        reportPeriod: 'Q2',
        fiscalYear: '2023',
        revenue: 1200000,
        revenueGrowthRate: 0.2,
        netProfitExcludingNonRecurring: 250000,
        netProfitGrowthRate: 0.12,
        grossMargin: 0.32,
        netMargin: 0.12,
        roe: 0.18,
        roa: 0.1,
        debtToAssetRatio: 0.38,
        currentRatio: 1.6,
        revenueCAGR: 0.15,
        netProfitCAGR: 0.12,
        totalAssetGrowthRate: 0.1,
        shareholdersEquityGrowthRate: 0.12,
        dataCompletenessScore: 0.98
      }
    ],
    loading: false,
    error: null,
    onPeriodSelect: () => {},
    onMetricHover: () => {}
  }

  it('应该能够创建 useFinancialSnapshot 实例', () => {
    const result = useFinancialSnapshot(mockProps)
    
    expect(result).toBeDefined()
    expect(result.selectedPeriod).toBeDefined()
    expect(result.activeChartTab).toBeDefined()
    expect(result.currentData).toBeDefined()
    expect(result.periodOptions).toBeDefined()
    expect(result.coreMetrics).toBeDefined()
    expect(result.profitabilityMetrics).toBeDefined()
    expect(result.growthMetrics).toBeDefined()
    expect(result.trendData).toBeDefined()
    expect(result.dataQualityScore).toBeDefined()
    expect(result.revenueChartOption).toBeDefined()
    expect(result.profitChartOption).toBeDefined()
    expect(result.profitabilityChartOption).toBeDefined()
    expect(result.handlePeriodSelect).toBeDefined()
    expect(result.handleMetricHover).toBeDefined()
    expect(result.handleErrorClose).toBeDefined()
  })

  it('应该能够计算当前数据', () => {
    const result = useFinancialSnapshot(mockProps)
    
    expect(result.currentData.value).toEqual(mockProps.rawData[0])
  })

  it('应该能够计算期间选项', () => {
    const result = useFinancialSnapshot(mockProps)
    
    expect(result.periodOptions.value).toEqual([
      { value: 'Q1', label: '2023Q1' },
      { value: 'Q2', label: '2023Q2' }
    ])
  })

  it('应该能够计算核心指标', () => {
    const result = useFinancialSnapshot(mockProps)
    
    expect(result.coreMetrics.value).toEqual([
      {
        title: '营业收入',
        value: 1000000,
        suffix: '万元',
        precision: 2,
        trend: 0.15
      },
      {
        title: '扣非净利润',
        value: 200000,
        suffix: '万元',
        precision: 2,
        trend: 0.08
      },
      {
        title: '毛利率',
        value: 0.3,
        suffix: '%',
        precision: 1,
        trend: 0
      },
      {
        title: '净利率',
        value: 0.1,
        suffix: '%',
        precision: 1,
        trend: 0
      }
    ])
  })

  it('应该能够计算盈利能力指标', () => {
    const result = useFinancialSnapshot(mockProps)
    
    expect(result.profitabilityMetrics.value).toEqual([
      {
        title: 'ROE',
        value: 0.15,
        suffix: '%',
        precision: 1
      },
      {
        title: 'ROA',
        value: 0.08,
        suffix: '%',
        precision: 1
      },
      {
        title: '资产负债率',
        value: 0.4,
        suffix: '%',
        precision: 1
      },
      {
        title: '流动比率',
        value: 1.5,
        suffix: '',
        precision: 2
      }
    ])
  })

  it('应该能够计算成长性指标', () => {
    const result = useFinancialSnapshot(mockProps)
    
    expect(result.growthMetrics.value).toEqual([
      {
        title: '营收3年复合增长率',
        value: 0.12,
        suffix: '%',
        precision: 1
      },
      {
        title: '净利润3年复合增长率',
        value: 0.1,
        suffix: '%',
        precision: 1
      },
      {
        title: '总资产增长率',
        value: 0.08,
        suffix: '%',
        precision: 1
      },
      {
        title: '股东权益增长率',
        value: 0.1,
        suffix: '%',
        precision: 1
      }
    ])
  })

  it('应该能够计算趋势数据', () => {
    const result = useFinancialSnapshot(mockProps)
    
    expect(result.trendData.value).toEqual([
      {
        period: '2023Q2',
        revenue: 1200000,
        revenueGrowth: 0.2,
        netProfit: 250000,
        netProfitGrowth: 0.12,
        grossMargin: 0.32,
        netMargin: 0.12,
        roe: 0.18,
        roa: 0.1
      },
      {
        period: '2023Q1',
        revenue: 1000000,
        revenueGrowth: 0.15,
        netProfit: 200000,
        netProfitGrowth: 0.08,
        grossMargin: 0.3,
        netMargin: 0.1,
        roe: 0.15,
        roa: 0.08
      }
    ])
  })

  it('应该能够计算数据质量分数', () => {
    const result = useFinancialSnapshot(mockProps)
    
    expect(result.dataQualityScore.value).toBe(95)
  })

  it('应该能够生成营收图表配置', () => {
    const result = useFinancialSnapshot(mockProps)
    
    expect(result.revenueChartOption.value).toEqual({
      title: {
        text: '营收趋势',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        data: ['2023Q2', '2023Q1']
      },
      yAxis: {
        type: 'value',
        name: '万元'
      },
      series: [
        {
          name: '营业收入',
          type: 'line',
          data: [1200000, 1000000],
          smooth: true,
          itemStyle: {
            color: '#409eff'
          }
        }
      ]
    })
  })

  it('应该能够生成利润图表配置', () => {
    const result = useFinancialSnapshot(mockProps)
    
    expect(result.profitChartOption.value).toEqual({
      title: {
        text: '利润趋势',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        data: ['2023Q2', '2023Q1']
      },
      yAxis: {
        type: 'value',
        name: '万元'
      },
      series: [
        {
          name: '扣非净利润',
          type: 'line',
          data: [250000, 200000],
          smooth: true,
          itemStyle: {
            color: '#67c23a'
          }
        }
      ]
    })
  })

  it('应该能够生成盈利能力图表配置', () => {
    const result = useFinancialSnapshot(mockProps)
    
    expect(result.profitabilityChartOption.value).toEqual({
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
        data: ['2023Q2', '2023Q1']
      },
      yAxis: {
        type: 'value',
        name: '%'
      },
      series: [
        {
          name: '毛利率',
          type: 'line',
          data: [0.32, 0.3],
          smooth: true
        },
        {
          name: '净利率',
          type: 'line',
          data: [0.12, 0.1],
          smooth: true
        },
        {
          name: 'ROE',
          type: 'line',
          data: [0.18, 0.15],
          smooth: true
        },
        {
          name: 'ROA',
          type: 'line',
          data: [0.1, 0.08],
          smooth: true
        }
      ]
    })
  })

  it('应该能够处理期间选择', () => {
    const mockOnPeriodSelect = vi.fn()
    const propsWithCallback = { ...mockProps, onPeriodSelect: mockOnPeriodSelect }
    const result = useFinancialSnapshot(propsWithCallback)
    
    result.handlePeriodSelect('Q2')
    
    expect(result.selectedPeriod.value).toBe('Q2')
    expect(mockOnPeriodSelect).toHaveBeenCalledWith('Q2')
  })

  it('应该能够处理指标悬停', () => {
    const mockOnMetricHover = vi.fn()
    const propsWithCallback = { ...mockProps, onMetricHover: mockOnMetricHover }
    const result = useFinancialSnapshot(propsWithCallback)
    
    result.handleMetricHover('营业收入', 1000000)
    
    expect(mockOnMetricHover).toHaveBeenCalledWith('营业收入', 1000000)
  })

  it('应该能够处理空数据', () => {
    const emptyProps = { ...mockProps, rawData: [] }
    const result = useFinancialSnapshot(emptyProps)
    
    expect(result.currentData.value).toBeNull()
    expect(result.periodOptions.value).toEqual([])
    expect(result.coreMetrics.value).toEqual([])
    expect(result.profitabilityMetrics.value).toEqual([])
    expect(result.growthMetrics.value).toEqual([])
    expect(result.trendData.value).toEqual([])
    expect(result.dataQualityScore.value).toBe(0)
  })

  it('应该能够处理无效数据', () => {
    const invalidProps = { ...mockProps, rawData: null as any }
    const result = useFinancialSnapshot(invalidProps)
    
    expect(result.currentData.value).toBeNull()
    expect(result.periodOptions.value).toEqual([])
    expect(result.coreMetrics.value).toEqual([])
    expect(result.profitabilityMetrics.value).toEqual([])
    expect(result.growthMetrics.value).toEqual([])
    expect(result.trendData.value).toEqual([])
    expect(result.dataQualityScore.value).toBe(0)
  })
})

