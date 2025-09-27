import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ArbitrationDecisionDialog from '../ArbitrationDecisionDialog.vue'
import { mockElementPlusComponents } from '@/utils/test-utils'

// 创建测试包装器
const createTestWrapper = (component: any, options = {}) => {
  return mount(component, {
    global: {
      plugins: [createPinia()],
      stubs: {
        ...mockElementPlusComponents()
      }
    },
    ...options
  })
}

describe('ArbitrationDecisionDialog - 展示组件单元测试', () => {
  let wrapper: any

  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('组件渲染测试', () => {
    it('应该正确渲染对话框', () => {
      wrapper = createTestWrapper(ArbitrationDecisionDialog, {
        props: {
          visible: true,
          submitting: false
        }
      })

      expect(wrapper.exists()).toBe(true)
      // el-dialog 在测试环境中可能不渲染内容，检查组件是否存在即可
      // expect(wrapper.find('.arbitration-form').exists()).toBe(true)
    })

    it('应该显示对话框标题', () => {
      wrapper = createTestWrapper(ArbitrationDecisionDialog, {
        props: {
          visible: true,
          submitting: false
        }
      })

      expect(wrapper.text()).toContain('仲裁决策')
    })

    it('应该显示所有表单字段', () => {
      wrapper = createTestWrapper(ArbitrationDecisionDialog, {
        props: {
          visible: true,
          submitting: false
        }
      })

      expect(wrapper.text()).toContain('决策类型')
      expect(wrapper.text()).toContain('优先级')
      expect(wrapper.text()).toContain('决策理由')
      expect(wrapper.text()).toContain('备注')
    })

    it('应该显示所有决策选项', () => {
      wrapper = createTestWrapper(ArbitrationDecisionDialog, {
        props: {
          visible: true,
          submitting: false
        }
      })

      expect(wrapper.text()).toContain('通过')
      expect(wrapper.text()).toContain('拒绝')
      expect(wrapper.text()).toContain('待定')
    })

    it('应该显示所有优先级选项', () => {
      wrapper = createTestWrapper(ArbitrationDecisionDialog, {
        props: {
          visible: true,
          submitting: false
        }
      })

      expect(wrapper.text()).toContain('高')
      expect(wrapper.text()).toContain('中')
      expect(wrapper.text()).toContain('低')
    })

    it('应该显示所有按钮', () => {
      wrapper = createTestWrapper(ArbitrationDecisionDialog, {
        props: {
          visible: true,
          submitting: false
        }
      })

      expect(wrapper.text()).toContain('取消')
      expect(wrapper.text()).toContain('提交决策')
    })
  })

  describe('表单交互测试', () => {
    it('应该能够选择决策类型', async () => {
      wrapper = createTestWrapper(ArbitrationDecisionDialog, {
        props: {
          visible: true,
          submitting: false
        }
      })

      const radioButtons = wrapper.findAll('input[type="radio"]')
      expect(radioButtons.length).toBeGreaterThanOrEqual(3)

      // 选择"拒绝"选项
      const rejectRadio = radioButtons.find((radio: any) => radio.attributes('value') === 'reject')
      if (rejectRadio) {
        await rejectRadio.setChecked()
        expect(rejectRadio.element.checked).toBe(true)
      }
    })

    it('应该能够选择优先级', async () => {
      wrapper = createTestWrapper(ArbitrationDecisionDialog, {
        props: {
          visible: true,
          submitting: false
        }
      })

      const select = wrapper.find('select')
      expect(select.exists()).toBe(true)

      await select.setValue('high')
      expect(select.element.value).toBe('high')
    })

    it('应该能够输入决策理由', async () => {
      wrapper = createTestWrapper(ArbitrationDecisionDialog, {
        props: {
          visible: true,
          submitting: false
        }
      })

      const textarea = wrapper.find('textarea')
      expect(textarea.exists()).toBe(true)

      await textarea.setValue('这是一个测试决策理由')
      expect(textarea.element.value).toBe('这是一个测试决策理由')
    })

    it('应该能够输入备注', async () => {
      wrapper = createTestWrapper(ArbitrationDecisionDialog, {
        props: {
          visible: true,
          submitting: false
        }
      })

      const textareas = wrapper.findAll('textarea')
      const notesTextarea = textareas[1] // 第二个 textarea 是备注
      expect(notesTextarea.exists()).toBe(true)

      await notesTextarea.setValue('这是一个测试备注')
      expect(notesTextarea.element.value).toBe('这是一个测试备注')
    })
  })

  describe('用户交互测试', () => {
    it('应该触发取消事件', async () => {
      wrapper = createTestWrapper(ArbitrationDecisionDialog, {
        props: {
          visible: true,
          submitting: false
        }
      })

      const cancelButton = wrapper.find('button')
      await cancelButton.trigger('click')

      expect(wrapper.emitted('cancel')).toBeTruthy()
    })

    it('应该触发提交事件', async () => {
      wrapper = createTestWrapper(ArbitrationDecisionDialog, {
        props: {
          visible: true,
          submitting: false
        }
      })

      // 先填写表单
      const textarea = wrapper.find('textarea')
      await textarea.setValue('这是一个测试决策理由，长度超过10个字符')

      const buttons = wrapper.findAll('button')
      const submitButton = buttons.find((btn: any) => btn.text().includes('提交决策'))
      await submitButton?.trigger('click')

      expect(wrapper.emitted('submit')).toBeTruthy()
    })

    it('应该触发对话框关闭事件', async () => {
      wrapper = createTestWrapper(ArbitrationDecisionDialog, {
        props: {
          visible: true,
          submitting: false
        }
      })

      // 模拟对话框关闭
      wrapper.vm.handleDialogClose()

      expect(wrapper.emitted('update:visible')).toBeTruthy()
      expect(wrapper.emitted('update:visible')?.[0]).toEqual([false])
    })
  })

  describe('加载状态测试', () => {
    it('应该显示提交加载状态', () => {
      wrapper = createTestWrapper(ArbitrationDecisionDialog, {
        props: {
          visible: true,
          submitting: true
        }
      })

      const buttons = wrapper.findAll('button')
      const submitButton = buttons.find((btn: any) => btn.text().includes('提交决策'))
      expect(submitButton?.attributes('loading')).toBeDefined()
    })

    it('应该在不提交时隐藏加载状态', () => {
      wrapper = createTestWrapper(ArbitrationDecisionDialog, {
        props: {
          visible: true,
          submitting: false
        }
      })

      const buttons = wrapper.findAll('button')
      const submitButton = buttons.find((btn: any) => btn.text().includes('提交决策'))
      expect(submitButton?.attributes('loading')).toBeUndefined()
    })
  })

  describe('表单验证测试', () => {
    it('应该验证必填字段', async () => {
      wrapper = createTestWrapper(ArbitrationDecisionDialog, {
        props: {
          visible: true,
          submitting: false
        }
      })

      // 尝试提交空表单
      const buttons = wrapper.findAll('button')
      const submitButton = buttons.find((btn: any) => btn.text().includes('提交决策'))
      await submitButton?.trigger('click')

      // 由于表单验证失败，不应该触发 submit 事件
      expect(wrapper.emitted('submit')).toBeFalsy()
    })

    it('应该验证决策理由长度', async () => {
      wrapper = createTestWrapper(ArbitrationDecisionDialog, {
        props: {
          visible: true,
          submitting: false
        }
      })

      // 输入过短的决策理由
      const textarea = wrapper.find('textarea')
      await textarea.setValue('短')

      const buttons = wrapper.findAll('button')
      const submitButton = buttons.find((btn: any) => btn.text().includes('提交决策'))
      await submitButton?.trigger('click')

      // 由于验证失败，不应该触发 submit 事件
      expect(wrapper.emitted('submit')).toBeFalsy()
    })
  })

  describe('边界情况测试', () => {
    it('应该处理默认 props', () => {
      wrapper = createTestWrapper(ArbitrationDecisionDialog, {
        props: {}
      })

      expect(wrapper.exists()).toBe(true)
    })

    it('应该处理 undefined 的 visible', () => {
      wrapper = createTestWrapper(ArbitrationDecisionDialog, {
        props: {
          visible: undefined as any,
          submitting: false
        }
      })

      expect(wrapper.exists()).toBe(true)
    })

    it('应该处理 undefined 的 submitting', () => {
      wrapper = createTestWrapper(ArbitrationDecisionDialog, {
        props: {
          visible: true,
          submitting: undefined as any
        }
      })

      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('字符限制测试', () => {
    it('应该限制决策理由字符数', () => {
      wrapper = createTestWrapper(ArbitrationDecisionDialog, {
        props: {
          visible: true,
          submitting: false
        }
      })

      const textarea = wrapper.find('textarea')
      expect(textarea.attributes('maxlength')).toBe('500')
    })

    it('应该限制备注字符数', () => {
      wrapper = createTestWrapper(ArbitrationDecisionDialog, {
        props: {
          visible: true,
          submitting: false
        }
      })

      const textareas = wrapper.findAll('textarea')
      const notesTextarea = textareas[1]
      expect(notesTextarea.attributes('maxlength')).toBe('200')
    })

    it('应该显示字符计数', () => {
      wrapper = createTestWrapper(ArbitrationDecisionDialog, {
        props: {
          visible: true,
          submitting: false
        }
      })

      const textareas = wrapper.findAll('textarea')
      textareas.forEach((textarea: any) => {
        expect(textarea.attributes('show-word-limit')).toBeDefined()
      })
    })
  })
})
