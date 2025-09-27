module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    '@vue/eslint-config-typescript',
    'plugin:vue/vue3-recommended',
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    parser: '@typescript-eslint/parser',
  },
  plugins: [
    'vue',
    '@typescript-eslint',
  ],
  rules: {
    // Vue 规则
    'vue/multi-word-component-names': 'off',
    'vue/no-unused-vars': 'warn', // 警告未使用的Vue变量
    'vue/no-v-html': 'warn', // 警告v-html使用

    // 基本规则 - 遵循测试宪法第4条
    'no-console': 'warn', // 警告console.log，但允许
    'no-debugger': 'error', // 禁止debugger
    'no-unused-vars': 'off', // 使用 @typescript-eslint/no-unused-vars 替代

    // TypeScript 规则 - 保持严格性
    '@typescript-eslint/no-unused-vars': 'warn', // 警告未使用变量
    '@typescript-eslint/no-explicit-any': 'warn', // 警告any类型
    '@typescript-eslint/explicit-function-return-type': 'off', // 允许推断返回类型
    '@typescript-eslint/explicit-module-boundary-types': 'off', // 允许推断模块边界类型
    '@typescript-eslint/no-empty-function': 'warn', // 警告空函数
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
  ],
};
