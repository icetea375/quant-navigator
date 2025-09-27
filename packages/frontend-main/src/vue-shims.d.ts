/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// Element Plus 类型声明
declare module 'element-plus' {
  export * from 'element-plus/es'
  export * from 'element-plus/lib'
}

// 全局类型声明
declare global {
  interface Window {
    // 添加全局属性类型声明
  }
}

// 模块声明
declare module '*.svg' {
  const content: string
  export default content
}

declare module '*.png' {
  const content: string
  export default content
}

declare module '*.jpg' {
  const content: string
  export default content
}

declare module '*.jpeg' {
  const content: string
  export default content
}

declare module '*.gif' {
  const content: string
  export default content
}

declare module '*.webp' {
  const content: string
  export default content
}
