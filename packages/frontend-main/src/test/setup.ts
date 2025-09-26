// 测试环境设置
import { config } from '@vue/test-utils'
import { vi } from 'vitest'
import { setupTestEnvironment } from '@/utils/test-utils'

// 设置测试环境
setupTestEnvironment()

// 全局配置
config.global.stubs = {
  'router-link': true,
  'router-view': true,
  'transition': true,
  'transition-group': true,
}

// 模拟Element Plus
config.global.components = {
  'el-button': { template: '<button><slot /></button>' },
  'el-input': { template: '<input v-model="modelValue" />' },
  'el-form': { template: '<form><slot /></form>' },
  'el-form-item': { template: '<div><slot /></div>' },
  'el-card': { template: '<div class="el-card"><slot /></div>' },
  'el-table': { template: '<table><slot /></table>' },
  'el-pagination': { template: '<div class="el-pagination"></div>' },
  'el-loading': { template: '<div v-if="loading">Loading...</div>' },
  'el-message': { template: '<div></div>' },
  'el-dialog': { template: '<div v-if="visible"><slot /></div>' },
  'el-icon': { template: '<i><slot /></i>' },
  'el-tooltip': { template: '<div><slot /></div>' },
  'el-popover': { template: '<div><slot /></div>' },
  'el-dropdown': { template: '<div><slot /></div>' },
  'el-menu': { template: '<div><slot /></div>' },
  'el-menu-item': { template: '<div><slot /></div>' },
  'el-submenu': { template: '<div><slot /></div>' },
  'el-breadcrumb': { template: '<div><slot /></div>' },
  'el-breadcrumb-item': { template: '<span><slot /></span>' },
  'el-tabs': { template: '<div><slot /></div>' },
  'el-tab-pane': { template: '<div><slot /></div>' },
  'el-collapse': { template: '<div><slot /></div>' },
  'el-collapse-item': { template: '<div><slot /></div>' },
  'el-accordion': { template: '<div><slot /></div>' },
  'el-accordion-item': { template: '<div><slot /></div>' },
  'el-timeline': { template: '<div><slot /></div>' },
  'el-timeline-item': { template: '<div><slot /></div>' },
  'el-steps': { template: '<div><slot /></div>' },
  'el-step': { template: '<div><slot /></div>' },
  'el-progress': { template: '<div><slot /></div>' },
  'el-badge': { template: '<div><slot /></div>' },
  'el-avatar': { template: '<div><slot /></div>' },
  'el-empty': { template: '<div><slot /></div>' },
  'el-result': { template: '<div><slot /></div>' },
  'el-skeleton': { template: '<div><slot /></div>' },
  'el-skeleton-item': { template: '<div><slot /></div>' },
  'el-backtop': { template: '<div><slot /></div>' },
  'el-affix': { template: '<div><slot /></div>' },
  'el-anchor': { template: '<div><slot /></div>' },
  'el-anchor-link': { template: '<div><slot /></div>' },
  'el-page-header': { template: '<div><slot /></div>' },
  'el-divider': { template: '<div><slot /></div>' },
  'el-space': { template: '<div><slot /></div>' },
  'el-row': { template: '<div><slot /></div>' },
  'el-col': { template: '<div><slot /></div>' },
  'el-container': { template: '<div><slot /></div>' },
  'el-header': { template: '<div><slot /></div>' },
  'el-aside': { template: '<div><slot /></div>' },
  'el-main': { template: '<div><slot /></div>' },
  'el-footer': { template: '<div><slot /></div>' },
  'el-scrollbar': { template: '<div><slot /></div>' },
  'el-watermark': { template: '<div><slot /></div>' },
  'el-calendar': { template: '<div><slot /></div>' },
  'el-date-picker': { template: '<input />' },
  'el-time-picker': { template: '<input />' },
  'el-time-select': { template: '<select><slot /></select>' },
  'el-color-picker': { template: '<input />' },
  'el-transfer': { template: '<div><slot /></div>' },
  'el-tree': { template: '<div><slot /></div>' },
  'el-tree-select': { template: '<select><slot /></select>' },
  'el-cascader': { template: '<select><slot /></select>' },
  'el-select': { template: '<select><slot /></select>' },
  'el-option': { template: '<option><slot /></option>' },
  'el-option-group': { template: '<optgroup><slot /></optgroup>' },
  'el-checkbox': { template: '<input type="checkbox" />' },
  'el-checkbox-group': { template: '<div><slot /></div>' },
  'el-radio': { template: '<input type="radio" />' },
  'el-radio-group': { template: '<div><slot /></div>' },
  'el-radio-button': { template: '<button><slot /></button>' },
  'el-switch': { template: '<input type="checkbox" />' },
  'el-slider': { template: '<input type="range" />' },
  'el-rate': { template: '<div><slot /></div>' },
  'el-upload': { template: '<div><slot /></div>' },
  'el-upload-dragger': { template: '<div><slot /></div>' },
  'el-upload-list': { template: '<div><slot /></div>' },
  'el-upload-list-item': { template: '<div><slot /></div>' },
  'el-image': { template: '<img />' },
  'el-image-viewer': { template: '<div><slot /></div>' },
  'el-carousel': { template: '<div><slot /></div>' },
  'el-carousel-item': { template: '<div><slot /></div>' },
  'el-drawer': { template: '<div v-if="visible"><slot /></div>' },
  'el-popconfirm': { template: '<div><slot /></div>' },
  'el-alert': { template: '<div><slot /></div>' },
  'el-notification': { template: '<div><slot /></div>' },
  'el-message-box': { template: '<div><slot /></div>' },
  'el-loading-directive': { template: '<div><slot /></div>' },
}

// 模拟全局属性
config.global.mocks = {
  $t: (key: string) => key,
  $tc: (key: string) => key,
  $te: (key: string) => true,
  $d: (value: any) => value,
  $n: (value: any) => value,
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

config.global.mocks.$router = {
  push: vi.fn(),
  replace: vi.fn(),
  go: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  resolve: vi.fn(),
  getRoutes: vi.fn(() => []),
  hasRoute: vi.fn(() => false),
  addRoute: vi.fn(),
  removeRoute: vi.fn(),
  beforeEach: vi.fn(),
  beforeResolve: vi.fn(),
  afterEach: vi.fn(),
  onError: vi.fn(),
  isReady: vi.fn(() => Promise.resolve()),
}

// 模拟Element Plus消息
config.global.mocks.$message = {
  success: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  error: vi.fn(),
}

// 模拟Element Plus通知
config.global.mocks.$notify = {
  success: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  error: vi.fn(),
}

// 模拟Element Plus消息框
config.global.mocks.$msgbox = {
  alert: vi.fn(),
  confirm: vi.fn(),
  prompt: vi.fn(),
}

// 模拟Element Plus加载
config.global.mocks.$loading = {
  service: vi.fn(() => ({
    close: vi.fn(),
  })),
}

// 模拟Element Plus弹窗
config.global.mocks.$popover = {
  show: vi.fn(),
  hide: vi.fn(),
}

// 模拟Element Plus工具提示
config.global.mocks.$tooltip = {
  show: vi.fn(),
  hide: vi.fn(),
}

// 模拟Element Plus下拉菜单
config.global.mocks.$dropdown = {
  show: vi.fn(),
  hide: vi.fn(),
}

// 模拟Element Plus菜单
config.global.mocks.$menu = {
  open: vi.fn(),
  close: vi.fn(),
}

// 模拟Element Plus面包屑
config.global.mocks.$breadcrumb = {
  add: vi.fn(),
  remove: vi.fn(),
}

// 模拟Element Plus标签页
config.global.mocks.$tabs = {
  add: vi.fn(),
  remove: vi.fn(),
}

// 模拟Element Plus折叠面板
config.global.mocks.$collapse = {
  open: vi.fn(),
  close: vi.fn(),
}

// 模拟Element Plus手风琴
config.global.mocks.$accordion = {
  open: vi.fn(),
  close: vi.fn(),
}

// 模拟Element Plus时间线
config.global.mocks.$timeline = {
  add: vi.fn(),
  remove: vi.fn(),
}

// 模拟Element Plus步骤条
config.global.mocks.$steps = {
  next: vi.fn(),
  prev: vi.fn(),
  goTo: vi.fn(),
}

// 模拟Element Plus进度条
config.global.mocks.$progress = {
  start: vi.fn(),
  finish: vi.fn(),
}

// 模拟Element Plus徽章
config.global.mocks.$badge = {
  show: vi.fn(),
  hide: vi.fn(),
}

// 模拟Element Plus头像
config.global.mocks.$avatar = {
  load: vi.fn(),
  error: vi.fn(),
}

// 模拟Element Plus空状态
config.global.mocks.$empty = {
  show: vi.fn(),
  hide: vi.fn(),
}

// 模拟Element Plus结果页
config.global.mocks.$result = {
  show: vi.fn(),
  hide: vi.fn(),
}

// 模拟Element Plus骨架屏
config.global.mocks.$skeleton = {
  show: vi.fn(),
  hide: vi.fn(),
}

// 模拟Element Plus回到顶部
config.global.mocks.$backtop = {
  show: vi.fn(),
  hide: vi.fn(),
}

// 模拟Element Plus固钉
config.global.mocks.$affix = {
  update: vi.fn(),
}

// 模拟Element Plus锚点
config.global.mocks.$anchor = {
  scrollTo: vi.fn(),
}

// 模拟Element Plus锚点链接
config.global.mocks.$anchorLink = {
  scrollTo: vi.fn(),
}

// 模拟Element Plus页面头部
config.global.mocks.$pageHeader = {
  goBack: vi.fn(),
}

// 模拟Element Plus分割线
config.global.mocks.$divider = {
  show: vi.fn(),
  hide: vi.fn(),
}

// 模拟Element Plus间距
config.global.mocks.$space = {
  update: vi.fn(),
}

// 模拟Element Plus行
config.global.mocks.$row = {
  update: vi.fn(),
}

// 模拟Element Plus列
config.global.mocks.$col = {
  update: vi.fn(),
}

// 模拟Element Plus容器
config.global.mocks.$container = {
  update: vi.fn(),
}

// 模拟Element Plus头部
config.global.mocks.$header = {
  update: vi.fn(),
}

// 模拟Element Plus侧边栏
config.global.mocks.$aside = {
  update: vi.fn(),
}

// 模拟Element Plus主体
config.global.mocks.$main = {
  update: vi.fn(),
}

// 模拟Element Plus底部
config.global.mocks.$footer = {
  update: vi.fn(),
}

// 模拟Element Plus滚动条
config.global.mocks.$scrollbar = {
  update: vi.fn(),
}

// 模拟Element Plus水印
config.global.mocks.$watermark = {
  update: vi.fn(),
}

// 模拟Element Plus日历
config.global.mocks.$calendar = {
  update: vi.fn(),
}

// 模拟Element Plus日期选择器
config.global.mocks.$datePicker = {
  focus: vi.fn(),
  blur: vi.fn(),
}

// 模拟Element Plus时间选择器
config.global.mocks.$timePicker = {
  focus: vi.fn(),
  blur: vi.fn(),
}

// 模拟Element Plus时间选择
config.global.mocks.$timeSelect = {
  focus: vi.fn(),
  blur: vi.fn(),
}

// 模拟Element Plus颜色选择器
config.global.mocks.$colorPicker = {
  focus: vi.fn(),
  blur: vi.fn(),
}

// 模拟Element Plus穿梭框
config.global.mocks.$transfer = {
  update: vi.fn(),
}

// 模拟Element Plus树
config.global.mocks.$tree = {
  update: vi.fn(),
}

// 模拟Element Plus树选择器
config.global.mocks.$treeSelect = {
  focus: vi.fn(),
  blur: vi.fn(),
}

// 模拟Element Plus级联选择器
config.global.mocks.$cascader = {
  focus: vi.fn(),
  blur: vi.fn(),
}

// 模拟Element Plus选择器
config.global.mocks.$select = {
  focus: vi.fn(),
  blur: vi.fn(),
}

// 模拟Element Plus选项
config.global.mocks.$option = {
  update: vi.fn(),
}

// 模拟Element Plus选项组
config.global.mocks.$optionGroup = {
  update: vi.fn(),
}

// 模拟Element Plus复选框
config.global.mocks.$checkbox = {
  focus: vi.fn(),
  blur: vi.fn(),
}

// 模拟Element Plus复选框组
config.global.mocks.$checkboxGroup = {
  update: vi.fn(),
}

// 模拟Element Plus单选框
config.global.mocks.$radio = {
  focus: vi.fn(),
  blur: vi.fn(),
}

// 模拟Element Plus单选框组
config.global.mocks.$radioGroup = {
  update: vi.fn(),
}

// 模拟Element Plus单选框按钮
config.global.mocks.$radioButton = {
  focus: vi.fn(),
  blur: vi.fn(),
}

// 模拟Element Plus开关
config.global.mocks.$switch = {
  focus: vi.fn(),
  blur: vi.fn(),
}

// 模拟Element Plus滑块
config.global.mocks.$slider = {
  focus: vi.fn(),
  blur: vi.fn(),
}

// 模拟Element Plus评分
config.global.mocks.$rate = {
  update: vi.fn(),
}

// 模拟Element Plus上传
config.global.mocks.$upload = {
  upload: vi.fn(),
  abort: vi.fn(),
  clearFiles: vi.fn(),
  clearFilesList: vi.fn(),
  submit: vi.fn(),
}

// 模拟Element Plus上传拖拽
config.global.mocks.$uploadDragger = {
  update: vi.fn(),
}

// 模拟Element Plus上传列表
config.global.mocks.$uploadList = {
  update: vi.fn(),
}

// 模拟Element Plus上传列表项
config.global.mocks.$uploadListItem = {
  update: vi.fn(),
}

// 模拟Element Plus图片
config.global.mocks.$image = {
  load: vi.fn(),
  error: vi.fn(),
}

// 模拟Element Plus图片查看器
config.global.mocks.$imageViewer = {
  show: vi.fn(),
  hide: vi.fn(),
}

// 模拟Element Plus轮播图
config.global.mocks.$carousel = {
  next: vi.fn(),
  prev: vi.fn(),
  goTo: vi.fn(),
}

// 模拟Element Plus轮播图项
config.global.mocks.$carouselItem = {
  update: vi.fn(),
}

// 模拟Element Plus抽屉
config.global.mocks.$drawer = {
  show: vi.fn(),
  hide: vi.fn(),
}

// 模拟Element Plus气泡确认框
config.global.mocks.$popconfirm = {
  show: vi.fn(),
  hide: vi.fn(),
}

// 模拟Element Plus警告
config.global.mocks.$alert = {
  show: vi.fn(),
  hide: vi.fn(),
}

// 模拟Element Plus通知
config.global.mocks.$notification = {
  show: vi.fn(),
  hide: vi.fn(),
}

// 模拟Element Plus消息框
config.global.mocks.$msgbox = {
  alert: vi.fn(),
  confirm: vi.fn(),
  prompt: vi.fn(),
}

// 模拟Element Plus加载指令
config.global.mocks.$loadingDirective = {
  show: vi.fn(),
  hide: vi.fn(),
}
