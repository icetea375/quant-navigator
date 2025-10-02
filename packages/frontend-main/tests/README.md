# 前端测试策略：分层真实性原则

## 🎯 核心哲学

我们遵循**"分层真实性"**原则，在追求测试环境真实性的同时，保持测试目标的聚焦性。

### 第一层：环境真实性（Environment Authenticity）

**目标**：确保测试环境能够支撑复杂UI组件的"生命体征"

**要求**：
- 使用 `@vitest/browser` + 真实浏览器环境
- 支持完整的 DOM API 和布局引擎
- 能够成功实例化和挂载 Element Plus 等复杂UI组件

**验证标准**：
- Element Plus 组件能够成功挂载
- 复杂的第三方UI组件能够"活过来"
- 基础交互能力正常

### 第二层：测试目标聚焦性（Test Target Focus）

**目标**：测试我们自己的业务逻辑，而非第三方库的内部实现

**要求**：
- 使用插槽替换/依赖注入避免昂贵的第三方渲染
- 聚焦于我们自己的组件逻辑（props传递、事件处理、状态计算）
- 避免重复验证第三方库的内部实现

**验证标准**：
- 我们的组件逻辑正确
- 不需要验证 ECharts 的绘图能力
- 测试稳定且高效

## 🛠️ 实施策略

### 对于包含 ECharts 的组件

1. **使用插槽替换**：
   ```vue
   <!-- 生产环境 -->
   <slot name="chart">
     <EchartsComponent :options="chartOptions" />
   </slot>
   ```

2. **测试中使用模拟组件**：
   ```typescript
   slots: {
     chart: {
       template: '<div data-testid="chart-mock">图表模拟组件</div>'
     }
   }
   ```

### 对于 Element Plus 组件

1. **保持真实渲染**：让 Element Plus 组件在真实浏览器环境中正常渲染
2. **使用真实的 DOM 交互**：确保点击、输入等交互行为正常

## 📁 文件命名规范

- `.test.ts`：纯逻辑单元测试（不涉及UI渲染）
- `.spec.ts`：组件/集成/E2E测试（涉及UI渲染）

## 🎯 测试目标

- **环境层**：确保测试环境能够支撑所有复杂组件的"生命体征"
- **业务层**：验证我们自己的业务逻辑正确性
- **效率层**：避免不必要的第三方库验证，保持测试稳定高效

## 📊 成功案例

- ✅ `DataPanelContainer.ultra-simple.test.ts`：完全模拟组件，4个测试全部通过
- ✅ `DataPanelContainer.minimal-no-echarts.test.ts`：避免ECharts导入，6个测试全部通过
- ✅ `echarts-crash-investigation-fixed.test.ts`：ECharts本身功能正常，4个测试全部通过

## 🚫 避免的反模式

- ❌ 在JSDOM环境中测试复杂UI组件
- ❌ 在测试中重复验证第三方库的内部实现
- ❌ 为了测试稳定性而牺牲测试环境的真实性
- ❌ 为了测试真实性而牺牲测试的效率和稳定性

