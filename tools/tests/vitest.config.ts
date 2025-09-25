import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./config/vitest-setup.ts']
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '../frontend/src'),
      '~': resolve(__dirname, '../frontend/src')
    }
  }
});
