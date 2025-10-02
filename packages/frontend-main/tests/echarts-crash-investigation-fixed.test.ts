// ECharts 崩溃原因调查测试 - 修复版
import { describe, it, expect, beforeAll } from 'vitest'

describe('ECharts 崩溃原因调查 - 修复版', () => {
  beforeAll(() => {
    console.log('🔍 开始调查 ECharts 崩溃原因（修复版）...')
  })

  it('测试1: 创建带正确尺寸的 DOM 元素', async () => {
    console.log('🚀 测试1: 创建带正确尺寸的 DOM 元素...')
    
    try {
      // 导入 ECharts
      const echartsCore = await import('echarts/core')
      const echartsRenderers = await import('echarts/renderers')
      const echartsCharts = await import('echarts/charts')
      const echartsComponents = await import('echarts/components')
      
      // 注册组件
      echartsCore.use([
        echartsRenderers.CanvasRenderer,
        echartsCharts.LineChart,
        echartsCharts.BarChart,
        echartsComponents.TitleComponent,
        echartsComponents.TooltipComponent,
        echartsComponents.LegendComponent,
        echartsComponents.GridComponent
      ])
      
      // 创建带尺寸的 DOM 元素
      const container = document.createElement('div')
      container.style.width = '400px'
      container.style.height = '300px'
      container.style.position = 'absolute'
      container.style.left = '-9999px' // 隐藏但保持尺寸
      document.body.appendChild(container)
      
      // 创建 ECharts 实例
      const chartInstance = echartsCore.init(container)
      console.log('✅ ECharts 实例创建成功（带尺寸）')
      
      // 设置简单选项
      const simpleOption = {
        title: { text: '测试图表' },
        xAxis: { type: 'category', data: ['A', 'B', 'C'] },
        yAxis: { type: 'value' },
        series: [{ data: [1, 2, 3], type: 'line' }]
      }
      
      chartInstance.setOption(simpleOption)
      console.log('✅ 简单图表选项设置成功')
      
      // 清理
      chartInstance.dispose()
      document.body.removeChild(container)
      console.log('✅ 清理完成')
      
      expect(true).toBe(true)
      console.log('🎉 测试1完成：带尺寸的 DOM 元素工作正常')
      
    } catch (error) {
      console.error('❌ 测试1失败:', error)
      throw error
    }
  })

  it('测试2: 测试 FinancialSnapshot 风格的复杂图表', async () => {
    console.log('🚀 测试2: 测试 FinancialSnapshot 风格的复杂图表...')
    
    try {
      // 导入 ECharts
      const echartsCore = await import('echarts/core')
      const echartsRenderers = await import('echarts/renderers')
      const echartsCharts = await import('echarts/charts')
      const echartsComponents = await import('echarts/components')
      
      // 注册组件
      echartsCore.use([
        echartsRenderers.CanvasRenderer,
        echartsCharts.LineChart,
        echartsCharts.BarChart,
        echartsComponents.TitleComponent,
        echartsComponents.TooltipComponent,
        echartsComponents.LegendComponent,
        echartsComponents.GridComponent
      ])
      
      // 创建带尺寸的 DOM 元素
      const container = document.createElement('div')
      container.style.width = '400px'
      container.style.height = '300px'
      container.style.position = 'absolute'
      container.style.left = '-9999px'
      document.body.appendChild(container)
      
      const chartInstance = echartsCore.init(container)
      
      // 测试 FinancialSnapshot 风格的复杂选项
      const financialOption = {
        title: {
          text: '财务数据趋势',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross'
          }
        },
        legend: {
          data: ['收入', '利润'],
          top: 'bottom'
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: ['1月', '2月', '3月', '4月', '5月', '6月']
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            name: '收入',
            type: 'line',
            data: [120, 132, 101, 134, 90, 230],
            smooth: true,
            areaStyle: {}
          },
          {
            name: '利润',
            type: 'line',
            data: [20, 32, 21, 34, 10, 30],
            smooth: true,
            areaStyle: {}
          }
        ]
      }
      
      chartInstance.setOption(financialOption)
      console.log('✅ FinancialSnapshot 风格图表设置成功')
      
      // 清理
      chartInstance.dispose()
      document.body.removeChild(container)
      
      expect(true).toBe(true)
      console.log('🎉 测试2完成：FinancialSnapshot 风格图表正常')
      
    } catch (error) {
      console.error('❌ 测试2失败:', error)
      throw error
    }
  })

  it('测试3: 测试 QuantSignalDashboard 风格的雷达图', async () => {
    console.log('🚀 测试3: 测试 QuantSignalDashboard 风格的雷达图...')
    
    try {
      // 导入 ECharts
      const echartsCore = await import('echarts/core')
      const echartsRenderers = await import('echarts/renderers')
      const echartsCharts = await import('echarts/charts')
      const echartsComponents = await import('echarts/components')
      
      // 注册组件（包括雷达图）
      echartsCore.use([
        echartsRenderers.CanvasRenderer,
        echartsCharts.RadarChart, // 添加雷达图
        echartsComponents.TitleComponent,
        echartsComponents.TooltipComponent,
        echartsComponents.LegendComponent,
        echartsComponents.GridComponent
      ])
      
      // 创建带尺寸的 DOM 元素
      const container = document.createElement('div')
      container.style.width = '400px'
      container.style.height = '300px'
      container.style.position = 'absolute'
      container.style.left = '-9999px'
      document.body.appendChild(container)
      
      const chartInstance = echartsCore.init(container)
      
      // 测试 QuantSignalDashboard 风格的雷达图选项
      const radarOption = {
        title: {
          text: '量化信号雷达图',
          left: 'center'
        },
        tooltip: {},
        radar: {
          indicator: [
            { name: '技术指标', max: 100 },
            { name: '基本面', max: 100 },
            { name: '市场情绪', max: 100 },
            { name: '资金流向', max: 100 }
          ]
        },
        series: [{
          name: '信号强度',
          type: 'radar',
          data: [{
            value: [80, 60, 70, 90],
            name: '综合信号'
          }]
        }]
      }
      
      chartInstance.setOption(radarOption)
      console.log('✅ QuantSignalDashboard 风格雷达图设置成功')
      
      // 清理
      chartInstance.dispose()
      document.body.removeChild(container)
      
      expect(true).toBe(true)
      console.log('🎉 测试3完成：QuantSignalDashboard 风格雷达图正常')
      
    } catch (error) {
      console.error('❌ 测试3失败:', error)
      throw error
    }
  })

  it('测试4: 测试多个图表实例的内存使用', async () => {
    console.log('🚀 测试4: 测试多个图表实例的内存使用...')
    
    try {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0
      console.log('📊 初始内存使用:', Math.round(initialMemory / 1024 / 1024), 'MB')
      
      // 导入 ECharts
      const echartsCore = await import('echarts/core')
      const echartsRenderers = await import('echarts/renderers')
      const echartsCharts = await import('echarts/charts')
      const echartsComponents = await import('echarts/components')
      
      echartsCore.use([
        echartsRenderers.CanvasRenderer,
        echartsCharts.LineChart,
        echartsComponents.TitleComponent,
        echartsComponents.TooltipComponent
      ])
      
      // 创建多个图表实例
      const instances = []
      const containers = []
      
      for (let i = 0; i < 3; i++) {
        const container = document.createElement('div')
        container.style.width = '200px'
        container.style.height = '150px'
        container.style.position = 'absolute'
        container.style.left = '-9999px'
        document.body.appendChild(container)
        containers.push(container)
        
        const instance = echartsCore.init(container)
        instance.setOption({
          title: { text: `图表 ${i + 1}` },
          xAxis: { type: 'category', data: ['A', 'B', 'C'] },
          yAxis: { type: 'value' },
          series: [{ 
            data: Array(100).fill(0).map(() => Math.random()), 
            type: 'line' 
          }]
        })
        
        instances.push(instance)
      }
      
      const afterCreateMemory = (performance as any).memory?.usedJSHeapSize || 0
      console.log('📊 创建3个实例后内存使用:', Math.round(afterCreateMemory / 1024 / 1024), 'MB')
      console.log('📊 内存增长:', Math.round((afterCreateMemory - initialMemory) / 1024 / 1024), 'MB')
      
      // 清理所有实例
      instances.forEach(instance => instance.dispose())
      containers.forEach(container => document.body.removeChild(container))
      
      const afterDisposeMemory = (performance as any).memory?.usedJSHeapSize || 0
      console.log('📊 清理后内存使用:', Math.round(afterDisposeMemory / 1024 / 1024), 'MB')
      
      expect(true).toBe(true)
      console.log('🎉 测试4完成：多实例内存使用测试正常')
      
    } catch (error) {
      console.error('❌ 测试4失败:', error)
      throw error
    }
  })
})

