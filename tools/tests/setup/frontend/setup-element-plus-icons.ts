// Element Plus图标全局模拟配置
// 符合测试宪法第6条：只模拟外部边界，不模拟内部逻辑

import { vi } from 'vitest'

// 模拟所有常用的Element Plus图标
vi.mock('@element-plus/icons-vue', () => ({
  // 基础图标
  TrendCharts: { template: '<i class="trend-charts-icon"></i>' },
  ArrowDown: { template: '<i class="arrow-down-icon"></i>' },
  ArrowUp: { template: '<i class="arrow-up-icon"></i>' },
  ArrowRight: { template: '<i class="arrow-right-icon"></i>' },
  ArrowLeft: { template: '<i class="arrow-left-icon"></i>' },
  Monitor: { template: '<i class="monitor-icon"></i>' },
  User: { template: '<i class="user-icon"></i>' },
  DataAnalysis: { template: '<i class="data-analysis-icon"></i>' },
  
  // 状态图标
  CircleCheck: { template: '<i class="circle-check-icon"></i>' },
  Check: { template: '<i class="check-icon"></i>' },
  Close: { template: '<i class="close-icon"></i>' },
  Warning: { template: '<i class="warning-icon"></i>' },
  WarningFilled: { template: '<i class="warning-filled-icon"></i>' },
  Info: { template: '<i class="info-icon"></i>' },
  InfoFilled: { template: '<i class="info-filled-icon"></i>' },
  Success: { template: '<i class="success-icon"></i>' },
  SuccessFilled: { template: '<i class="success-filled-icon"></i>' },
  Error: { template: '<i class="error-icon"></i>' },
  ErrorFilled: { template: '<i class="error-filled-icon"></i>' },
  CircleCheckFilled: { template: '<i class="circle-check-filled-icon"></i>' },
  CircleClose: { template: '<i class="circle-close-icon"></i>' },
  CircleCloseFilled: { template: '<i class="circle-close-filled-icon"></i>' },
  
  // 操作图标
  Fold: { template: '<i class="fold-icon"></i>' },
  Unfold: { template: '<i class="unfold-icon"></i>' },
  Expand: { template: '<i class="expand-icon"></i>' },
  Clock: { template: '<i class="clock-icon"></i>' },
  Setting: { template: '<i class="setting-icon"></i>' },
  Search: { template: '<i class="search-icon"></i>' },
  Plus: { template: '<i class="plus-icon"></i>' },
  Minus: { template: '<i class="minus-icon"></i>' },
  Edit: { template: '<i class="edit-icon"></i>' },
  Delete: { template: '<i class="delete-icon"></i>' },
  Refresh: { template: '<i class="refresh-icon"></i>' },
  Download: { template: '<i class="download-icon"></i>' },
  Upload: { template: '<i class="upload-icon"></i>' },
  View: { template: '<i class="view-icon"></i>' },
  Link: { template: '<i class="link-icon"></i>' },
  Filter: { template: '<i class="filter-icon"></i>' },
  Loading: { template: '<i class="loading-icon"></i>' },
  Message: { template: '<i class="message-icon"></i>' },
  Hide: { template: '<i class="hide-icon"></i>' },
  
  // 导航图标
  Home: { template: '<i class="home-icon"></i>' },
  Menu: { template: '<i class="menu-icon"></i>' },
  Back: { template: '<i class="back-icon"></i>' },
  Forward: { template: '<i class="forward-icon"></i>' },
  
  // 媒体图标
  Play: { template: '<i class="play-icon"></i>' },
  Pause: { template: '<i class="pause-icon"></i>' },
  Stop: { template: '<i class="stop-icon"></i>' },
  
  // 其他图标
  Calendar: { template: '<i class="calendar-icon"></i>' },
  Location: { template: '<i class="location-icon"></i>' },
  Phone: { template: '<i class="phone-icon"></i>' },
  Email: { template: '<i class="email-icon"></i>' },
  Lock: { template: '<i class="lock-icon"></i>' },
  Unlock: { template: '<i class="unlock-icon"></i>' },
  Eye: { template: '<i class="eye-icon"></i>' },
  EyeClosed: { template: '<i class="eye-closed-icon"></i>' },
  Star: { template: '<i class="star-icon"></i>' },
  Heart: { template: '<i class="heart-icon"></i>' },
  Share: { template: '<i class="share-icon"></i>' },
  Copy: { template: '<i class="copy-icon"></i>' },
  Cut: { template: '<i class="cut-icon"></i>' },
  Paste: { template: '<i class="paste-icon"></i>' },
  
  // 新增缺失的图标 - 基于测试错误和组件使用情况
  Trophy: { template: '<i class="trophy-icon"></i>' },
  MagicStick: { template: '<i class="magic-stick-icon"></i>' },
  SwitchButton: { template: '<i class="switch-button-icon"></i>' },
  PriceTag: { template: '<i class="price-tag-icon"></i>' },
  DocumentRemove: { template: '<i class="document-remove-icon"></i>' },
  House: { template: '<i class="house-icon"></i>' },
  StarFilled: { template: '<i class="star-filled-icon"></i>' },
  More: { template: '<i class="more-icon"></i>' }
}))