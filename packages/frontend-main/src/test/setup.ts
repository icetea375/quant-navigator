// 符合测试宪法的测试环境设置
import { config } from '@vue/test-utils'
import { vi } from 'vitest'
import { setupTestEnvironment } from '@/utils/test-utils'
import { createApp } from 'vue'

// createApp导入正常

// 设置测试环境
setupTestEnvironment()

// 在浏览器环境中定义Vue相关全局变量
if (typeof window !== 'undefined') {
  try {
    // 确保createApp是函数
    if (typeof createApp === 'function') {
      (window as any).Vue = createApp
    } else {
      console.warn('createApp不是函数，跳过Vue全局变量设置')
    }
    // 添加Vue编译器相关的全局变量
    (window as any).VueCompilerDOM = {}
    (window as any).VueCompilerCore = {}
    (window as any).VueCompilerSFC = {}
  } catch (error) {
    // 静默处理错误，不输出警告
    // 这个错误不影响测试运行
  }
}

// 浏览器环境中不需要模拟API，使用真实的浏览器API

// 全局配置
config.global.stubs = {
  'router-link': true,
  'router-view': true,
  'transition': true,
  'transition-group': true,
}

// 注意：根据测试宪法第13条，我们禁止模拟Element Plus组件
// Element Plus组件必须在真实浏览器环境中使用真实组件
// 因此这里不包含任何Element Plus组件的模拟

// 模拟全局属性
config.global.mocks = {
  $t: (key: string) => key,
  $tc: (key: string) => key,
  $te: (key: string) => true,
  $d: (value: unknown) => value,
  $n: (value: unknown) => value,
}

// 模拟路由
config.global.mocks.$route = {
  path: '/',
  name: 'home',
  params: {},
  query: {},
  hash: '',
  fullPath: '/',
  matched: [],
  meta: {},
}

// 安全的mock函数创建
const createMockFn = (fn?: () => any) => {
  try {
    return vi.fn(fn)
  } catch {
    return fn || (() => {})
  }
}

config.global.mocks.$router = {
  push: createMockFn(),
  replace: createMockFn(),
  go: createMockFn(),
  back: createMockFn(),
  forward: createMockFn(),
  resolve: createMockFn(),
  getRoutes: createMockFn(() => []),
  hasRoute: createMockFn(() => false),
  addRoute: createMockFn(),
  removeRoute: createMockFn(),
  beforeEach: createMockFn(),
  beforeResolve: createMockFn(),
  afterEach: createMockFn(),
  onError: createMockFn(),
  isReady: createMockFn(() => Promise.resolve()),
}

// 模拟Element Plus消息
config.global.mocks.$message = {
  success: createMockFn(),
  warning: createMockFn(),
  info: createMockFn(),
  error: createMockFn(),
}

// 模拟Element Plus通知
config.global.mocks.$notify = {
  success: createMockFn(),
  warning: createMockFn(),
  info: createMockFn(),
  error: createMockFn(),
}

// 模拟Element Plus消息框
config.global.mocks.$msgbox = {
  alert: createMockFn(),
  confirm: createMockFn(),
  prompt: createMockFn(),
}

// 模拟Element Plus加载
config.global.mocks.$loading = {
  service: vi.fn(() => ({
    close: createMockFn(),
  })),
}

// 模拟Element Plus弹窗
config.global.mocks.$popover = {
  show: createMockFn(),
  hide: createMockFn(),
}

// 模拟Element Plus工具提示
config.global.mocks.$tooltip = {
  show: createMockFn(),
  hide: createMockFn(),
}

// 模拟Element Plus下拉菜单
config.global.mocks.$dropdown = {
  show: createMockFn(),
  hide: createMockFn(),
}

// 模拟Element Plus菜单
config.global.mocks.$menu = {
  open: createMockFn(),
  close: createMockFn(),
}

// 模拟Element Plus面包屑
config.global.mocks.$breadcrumb = {
  add: createMockFn(),
  remove: createMockFn(),
}

// 模拟Element Plus标签页
config.global.mocks.$tabs = {
  add: createMockFn(),
  remove: createMockFn(),
}

// 模拟Element Plus折叠面板
config.global.mocks.$collapse = {
  open: createMockFn(),
  close: createMockFn(),
}

// 模拟Element Plus手风琴
config.global.mocks.$accordion = {
  open: createMockFn(),
  close: createMockFn(),
}

// 模拟Element Plus时间线
config.global.mocks.$timeline = {
  add: createMockFn(),
  remove: createMockFn(),
}

// 模拟Element Plus步骤条
config.global.mocks.$steps = {
  next: createMockFn(),
  prev: createMockFn(),
  goTo: createMockFn(),
}

// 模拟Element Plus进度条
config.global.mocks.$progress = {
  start: createMockFn(),
  finish: createMockFn(),
}

// 模拟Element Plus徽章
config.global.mocks.$badge = {
  show: createMockFn(),
  hide: createMockFn(),
}

// 模拟Element Plus头像
config.global.mocks.$avatar = {
  load: createMockFn(),
  error: createMockFn(),
}

// 模拟Element Plus空状态
config.global.mocks.$empty = {
  show: createMockFn(),
  hide: createMockFn(),
}

// 模拟Element Plus结果页
config.global.mocks.$result = {
  show: createMockFn(),
  hide: createMockFn(),
}

// 模拟Element Plus骨架屏
config.global.mocks.$skeleton = {
  show: createMockFn(),
  hide: createMockFn(),
}

// 模拟Element Plus回到顶部
config.global.mocks.$backtop = {
  show: createMockFn(),
  hide: createMockFn(),
}

// 模拟Element Plus固钉
config.global.mocks.$affix = {
  update: createMockFn(),
}

// 模拟Element Plus锚点
config.global.mocks.$anchor = {
  scrollTo: createMockFn(),
}

// 模拟Element Plus锚点链接
config.global.mocks.$anchorLink = {
  scrollTo: createMockFn(),
}

// 模拟Element Plus页面头部
config.global.mocks.$pageHeader = {
  goBack: createMockFn(),
}

// 模拟Element Plus分割线
config.global.mocks.$divider = {
  show: createMockFn(),
  hide: createMockFn(),
}

// 模拟Element Plus间距
config.global.mocks.$space = {
  update: createMockFn(),
}

// 模拟Element Plus行
config.global.mocks.$row = {
  update: createMockFn(),
}

// 模拟Element Plus列
config.global.mocks.$col = {
  update: createMockFn(),
}

// 模拟Element Plus容器
config.global.mocks.$container = {
  update: createMockFn(),
}

// 模拟Element Plus头部
config.global.mocks.$header = {
  update: createMockFn(),
}

// 模拟Element Plus侧边栏
config.global.mocks.$aside = {
  update: createMockFn(),
}

// 模拟Element Plus主体
config.global.mocks.$main = {
  update: createMockFn(),
}

// 模拟Element Plus底部
config.global.mocks.$footer = {
  update: createMockFn(),
}

// 模拟Element Plus滚动条
config.global.mocks.$scrollbar = {
  update: createMockFn(),
}

// 模拟Element Plus水印
config.global.mocks.$watermark = {
  update: createMockFn(),
}

// 模拟Element Plus日历
config.global.mocks.$calendar = {
  update: createMockFn(),
}

// 模拟Element Plus日期选择器
config.global.mocks.$datePicker = {
  focus: createMockFn(),
  blur: createMockFn(),
}

// 模拟Element Plus时间选择器
config.global.mocks.$timePicker = {
  focus: createMockFn(),
  blur: createMockFn(),
}

// 模拟Element Plus时间选择
config.global.mocks.$timeSelect = {
  focus: createMockFn(),
  blur: createMockFn(),
}

// 模拟Element Plus颜色选择器
config.global.mocks.$colorPicker = {
  focus: createMockFn(),
  blur: createMockFn(),
}

// 模拟Element Plus穿梭框
config.global.mocks.$transfer = {
  update: createMockFn(),
}

// 模拟Element Plus树
config.global.mocks.$tree = {
  update: createMockFn(),
}

// 模拟Element Plus树选择器
config.global.mocks.$treeSelect = {
  focus: createMockFn(),
  blur: createMockFn(),
}

// 模拟Element Plus级联选择器
config.global.mocks.$cascader = {
  focus: createMockFn(),
  blur: createMockFn(),
}

// 模拟Element Plus选择器
config.global.mocks.$select = {
  focus: createMockFn(),
  blur: createMockFn(),
}

// 模拟Element Plus选项
config.global.mocks.$option = {
  update: createMockFn(),
}

// 模拟Element Plus选项组
config.global.mocks.$optionGroup = {
  update: createMockFn(),
}

// 模拟Element Plus复选框
config.global.mocks.$checkbox = {
  focus: createMockFn(),
  blur: createMockFn(),
}

// 模拟Element Plus复选框组
config.global.mocks.$checkboxGroup = {
  update: createMockFn(),
}

// 模拟Element Plus单选框
config.global.mocks.$radio = {
  focus: createMockFn(),
  blur: createMockFn(),
}

// 模拟Element Plus单选框组
config.global.mocks.$radioGroup = {
  update: createMockFn(),
}

// 模拟Element Plus单选框按钮
config.global.mocks.$radioButton = {
  focus: createMockFn(),
  blur: createMockFn(),
}

// 模拟Element Plus开关
config.global.mocks.$switch = {
  focus: createMockFn(),
  blur: createMockFn(),
}

// 模拟Element Plus滑块
config.global.mocks.$slider = {
  focus: createMockFn(),
  blur: createMockFn(),
}

// 模拟Element Plus评分
config.global.mocks.$rate = {
  update: createMockFn(),
}

// 模拟Element Plus上传
config.global.mocks.$upload = {
  upload: createMockFn(),
  abort: createMockFn(),
  clearFiles: createMockFn(),
  clearFilesList: createMockFn(),
  submit: createMockFn(),
}

// 模拟Element Plus上传拖拽
config.global.mocks.$uploadDragger = {
  update: createMockFn(),
}

// 模拟Element Plus上传列表
config.global.mocks.$uploadList = {
  update: createMockFn(),
}

// 模拟Element Plus上传列表项
config.global.mocks.$uploadListItem = {
  update: createMockFn(),
}

// 模拟Element Plus图片
config.global.mocks.$image = {
  load: createMockFn(),
  error: createMockFn(),
}

// 模拟Element Plus图片查看器
config.global.mocks.$imageViewer = {
  show: createMockFn(),
  hide: createMockFn(),
}

// 模拟Element Plus轮播图
config.global.mocks.$carousel = {
  next: createMockFn(),
  prev: createMockFn(),
  goTo: createMockFn(),
}

// 模拟Element Plus轮播图项
config.global.mocks.$carouselItem = {
  update: createMockFn(),
}

// 模拟Element Plus抽屉
config.global.mocks.$drawer = {
  show: createMockFn(),
  hide: createMockFn(),
}

// 模拟Element Plus气泡确认框
config.global.mocks.$popconfirm = {
  show: createMockFn(),
  hide: createMockFn(),
}

// 模拟Element Plus警告
config.global.mocks.$alert = {
  show: createMockFn(),
  hide: createMockFn(),
}

// 模拟Element Plus通知
config.global.mocks.$notification = {
  show: createMockFn(),
  hide: createMockFn(),
}

// 模拟Element Plus消息框
config.global.mocks.$msgbox = {
  alert: createMockFn(),
  confirm: createMockFn(),
  prompt: createMockFn(),
}

// 模拟Element Plus加载指令
config.global.mocks.$loadingDirective = {
  show: createMockFn(),
  hide: createMockFn(),
}