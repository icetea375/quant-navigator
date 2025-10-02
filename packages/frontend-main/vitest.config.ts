/// <reference types="vitest" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue({
    template: {
      compilerOptions: {
        // 启用运行时编译
        isCustomElement: (tag) => false
      }
    }
  })],
  test: {
    globals: true,
    
    // 分层战场配置 - 自动化指挥系统
    environmentMatchGlobs: [
      // 单元测试 - 后方基地 (HappyDOM)
      ['**/*.test.ts', 'happy-dom'],
      // 组件测试 - 前线滩头 (Browser)  
      ['**/*.spec.ts', 'browser']
    ],
    
    // 浏览器环境配置 - 使用Chrome
    browser: {
      enabled: true,
      provider: 'playwright',
      name: 'chromium'
    },
    
    // 分层设置文件
    setupFiles: [
      // 基础设置 - 所有环境都需要
      './src/test/setup.ts',
      // Canvas设置 - 仅浏览器环境需要
      './src/test/setup-canvas.ts'
    ],
    
    include: [
      'tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    
    typecheck: {
      tsconfig: './tsconfig.vitest.json'
    },
    
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        '**/dist/**',
        '**/build/**',
      ],
      include: ['src/**/*.{js,ts,vue}'],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@views': resolve(__dirname, 'src/views'),
      '@stores': resolve(__dirname, 'src/stores'),
      '@services': resolve(__dirname, 'src/services'),
      '@types': resolve(__dirname, 'src/types'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@assets': resolve(__dirname, 'src/assets'),
      // 为测试环境添加Vue运行时编译版本
      'vue': 'vue/dist/vue.esm-bundler.js',
    },
  },
})
