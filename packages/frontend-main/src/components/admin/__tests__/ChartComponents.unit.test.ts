// 图表组件单元测试 - 遵循测试宪法
import { describe, it, expect, vi } from 'vitest'

// 纯函数测试 - 遵循测试宪法第1条：测试的唯一目的
const formatChartData = (data: unknown[]) => {
  if (!Array.isArray(data) || data.length === 0) return []
  return data.map(item => ({
    name: item.name || 'Unknown',
    value: Number(item.value) || 0,
    formatted: `${Number(item.value) || 0}%`
  }))
}

const calculateChartOptions = (data: unknown[], type: string): Record<string, unknown> => {
  const formattedData = formatChartData(data)

  const baseOptions = {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    }
  }

  switch (type) {
    case 'pie':
      return {
        ...baseOptions,
        series: [{
          name: 'Data',
          type: 'pie',
          radius: '50%',
          data: formattedData
        }]
      }
    case 'bar':
      return {
        ...baseOptions,
        xAxis: {
          type: 'category',
          data: formattedData.map(item => item.name)
        },
        yAxis: {
          type: 'value'
        },
        series: [{
          name: 'Data',
          type: 'bar',
          data: formattedData.map(item => item.value)
        }]
      }
    case 'line':
      return {
        ...baseOptions,
        xAxis: {
          type: 'category',
          data: formattedData.map(item => item.name)
        },
        yAxis: {
          type: 'value'
        },
        series: [{
          name: 'Data',
          type: 'line',
          data: formattedData.map(item => item.value)
        }]
      }
    default:
      return baseOptions
  }
}

const validateChartData = (data: unknown) => {
  if (!data) return false
  if (Array.isArray(data)) {
    return data.every(item =>
      typeof item === 'object' &&
      item !== null &&
      (item.name !== undefined || item.value !== undefined)
    )
  }
  return false
}

// 测试纯函数 - 遵循测试宪法第4条：简单性优先
describe('Chart Components - 纯函数测试', () => {
  it('should format chart data correctly', () => {
    const inputData = [
      { name: 'A', value: 10 },
      { name: 'B', value: 20 },
      { name: 'C', value: 30 }
    ]

    const result = formatChartData(inputData)

    expect(result).toHaveLength(3)
    expect(result[0]).toEqual({
      name: 'A',
      value: 10,
      formatted: '10%'
    })
    expect(result[1]).toEqual({
      name: 'B',
      value: 20,
      formatted: '20%'
    })
  })

  it('should handle empty data', () => {
    expect(formatChartData([])).toEqual([])
    expect(formatChartData(null as any)).toEqual([])
    expect(formatChartData(undefined as any)).toEqual([])
  })

  it('should handle invalid data gracefully', () => {
    const invalidData = [
      { name: 'A' }, // missing value
      { name: 'B', value: 'invalid' }, // invalid value
      { name: 'C', value: 30 }
    ]

    const result = formatChartData(invalidData)

    expect(result[0].value).toBe(0)
    expect(result[1].value).toBe(0)
    expect(result[2].value).toBe(30)
  })

  it('should calculate pie chart options correctly', () => {
    const data = [
      { name: 'A', value: 10 },
      { name: 'B', value: 20 }
    ]

    const options = calculateChartOptions(data, 'pie')

    expect(options.series).toHaveLength(1)
    expect(options.series[0].type).toBe('pie')
    expect(options.series[0].data).toHaveLength(2)
  })

  it('should calculate bar chart options correctly', () => {
    const data = [
      { name: 'A', value: 10 },
      { name: 'B', value: 20 }
    ]

    const options = calculateChartOptions(data, 'bar')

    expect(options.series).toHaveLength(1)
    expect(options.series[0].type).toBe('bar')
    expect(options.xAxis.data).toEqual(['A', 'B'])
    expect(options.yAxis.type).toBe('value')
  })

  it('should calculate line chart options correctly', () => {
    const data = [
      { name: 'A', value: 10 },
      { name: 'B', value: 20 }
    ]

    const options = calculateChartOptions(data, 'line')

    expect(options.series).toHaveLength(1)
    expect(options.series[0].type).toBe('line')
    expect(options.xAxis.data).toEqual(['A', 'B'])
  })

  it('should validate chart data correctly', () => {
    const validData = [
      { name: 'A', value: 10 },
      { name: 'B', value: 20 }
    ]

    expect(validateChartData(validData)).toBe(true)
    expect(validateChartData([])).toBe(true)
    expect(validateChartData(null)).toBe(false)
    expect(validateChartData(undefined)).toBe(false)
    expect(validateChartData([{ invalid: 'data' }])).toBe(false)
  })
})

// 图表配置测试 - 遵循测试宪法第5条：类型安全铁律
describe('Chart Components - 配置测试', () => {
  it('should have consistent chart configuration structure', () => {
    const data = [{ name: 'Test', value: 100 }]
    const pieOptions = calculateChartOptions(data, 'pie')
    const barOptions = calculateChartOptions(data, 'bar')
    const lineOptions = calculateChartOptions(data, 'line')

    // 所有图表类型都应该有基础配置
    expect(pieOptions.tooltip).toBeDefined()
    expect(barOptions.tooltip).toBeDefined()
    expect(lineOptions.tooltip).toBeDefined()

    expect(pieOptions.legend).toBeDefined()
    expect(barOptions.legend).toBeDefined()
    expect(lineOptions.legend).toBeDefined()

    expect(pieOptions.series).toBeDefined()
    expect(barOptions.series).toBeDefined()
    expect(lineOptions.series).toBeDefined()
  })

  it('should handle different data types correctly', () => {
    const stringData = [
      { name: 'A', value: '10' },
      { name: 'B', value: '20' }
    ]

    const numberData = [
      { name: 'A', value: 10 },
      { name: 'B', value: 20 }
    ]

    const stringResult = formatChartData(stringData)
    const numberResult = formatChartData(numberData)

    expect(stringResult[0].value).toBe(10)
    expect(numberResult[0].value).toBe(10)
    expect(stringResult[0].formatted).toBe('10%')
    expect(numberResult[0].formatted).toBe('10%')
  })

  it('should maintain data integrity during transformation', () => {
    const originalData = [
      { name: 'A', value: 10, extra: 'data' },
      { name: 'B', value: 20, extra: 'data' }
    ]

    const formatted = formatChartData(originalData)

    expect(formatted).toHaveLength(2)
    expect(formatted[0].name).toBe('A')
    expect(formatted[0].value).toBe(10)
    // 确保只包含必要的字段
    expect(formatted[0]).not.toHaveProperty('extra')
  })
})

// 图表渲染逻辑测试 - 遵循测试宪法第6条：模拟铁律
describe('Chart Components - 渲染逻辑测试', () => {
  it('should determine chart type correctly', () => {
    const pieData = [{ name: 'A', value: 10 }]
    const barData = [{ name: 'A', value: 10, category: 'test' }]

    const pieOptions = calculateChartOptions(pieData, 'pie')
    const barOptions = calculateChartOptions(barData, 'bar')

    expect(pieOptions.series[0].type).toBe('pie')
    expect(barOptions.series[0].type).toBe('bar')
  })

  it('should handle chart resize logic', () => {
    const mockChart = {
      resize: vi.fn(),
      setOption: vi.fn(),
      dispose: vi.fn()
    }

    // 模拟图表调整大小
    const resizeChart = (chart: { resize: (options: { width: number; height: number }) => void }, width: number, height: number) => {
      if (chart && chart.resize) {
        chart.resize({ width, height })
      }
    }

    resizeChart(mockChart, 800, 600)

    expect(mockChart.resize).toHaveBeenCalledWith({ width: 800, height: 600 })
  })

  it('should handle chart disposal correctly', () => {
    const mockChart = {
      resize: vi.fn(),
      setOption: vi.fn(),
      dispose: vi.fn()
    }

    // 模拟图表销毁
    const disposeChart = (chart: { dispose: () => void }) => {
      if (chart && chart.dispose) {
        chart.dispose()
      }
    }

    disposeChart(mockChart)

    expect(mockChart.dispose).toHaveBeenCalled()
  })

  it('should validate chart dimensions', () => {
    const validateDimensions = (width: number, height: number) => {
      return width > 0 && height > 0 && width <= 2000 && height <= 2000
    }

    expect(validateDimensions(800, 600)).toBe(true)
    expect(validateDimensions(0, 600)).toBe(false)
    expect(validateDimensions(800, 0)).toBe(false)
    expect(validateDimensions(2001, 600)).toBe(false)
    expect(validateDimensions(800, 2001)).toBe(false)
  })
})
