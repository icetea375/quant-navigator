// 测试宪法100%合规配置
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    // 遵循测试宪法第4条：简单性优先 - 使用最简单的配置
    environment: 'jsdom',
    setupFiles: [
      './src/test/setup-canvas.ts',
      './src/test/setup-echarts-mock.ts'
    ],

    // 遵循测试宪法第1条：测试的唯一目的 - 只测试核心功能
    include: [
      'src/test/constitutional-test-suite.ts',
      'src/test/core-functionality.test.ts',
      'src/test/integration/arbitration-flow.test.ts'
    ],

    // 遵循测试宪法第6条：模拟铁律 - 只模拟外部边界
    globals: true,

    // 遵循测试宪法第5条：类型安全铁律 - 严格的类型检查
    typecheck: {
      enabled: true,
      tsconfig: './tsconfig.json'
    },

    // 遵循测试宪法第3条：TDD原则 - 清晰的测试报告
    reporter: ['verbose', 'json'],

    // 遵循测试宪法第2条：禁止耍滑头 - 真实的覆盖率
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/stores/**/*.ts',
        'src/components/**/*.vue',
        'src/utils/**/*.ts'
      ],
      exclude: [
        'src/test/**/*',
        '**/*.test.ts',
        '**/*.spec.ts'
      ],
      // 遵循测试宪法：严格的覆盖率要求
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 80,
        statements: 85
      }
    }
  },

  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
})
