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
    browser: {
      enabled: true,
      provider: 'playwright',
      name: 'chromium',
      instances: [
        {
          browser: 'chromium'
        }
      ]
    },
    setupFiles: ['./src/test/setup.ts', './src/test/setup-canvas.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}', 'tools/tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    typecheck: {
      tsconfig: './tsconfig.vitest.json'
    },
    coverage: {
      provider: 'v8',
      reporter: ['text'],
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
