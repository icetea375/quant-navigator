// 组件测试
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createTestWrapper, mockUser, mockMarketData } from '@/utils/test-utils'
import { useAuthStore } from '@/stores/auth'
import { useMarketStore } from '@/stores/market'

// 模拟组件
const TestComponent = {
  template: `
    <div>
      <h1>{{ title }}</h1>
      <p v-if="loading">Loading...</p>
      <div v-else>{{ content }}</div>
      <button @click="handleClick">Click me</button>
    </div>
  `,
  props: {
    title: {
      type: String,
      default: 'Test Component'
    }
  },
  data() {
    return {
      loading: false,
      content: 'Test content'
    }
  },
  methods: {
    handleClick() {
      this.$emit('click', 'clicked')
    }
  }
}

describe('Component Tests', () => {
  let wrapper: any

  beforeEach(() => {
    wrapper = createTestWrapper(TestComponent, {
      props: {
        title: 'Test Title'
      }
    })
  })

  it('should render component', () => {
    expect(wrapper.exists()).toBe(true)
  })

  it('should display title', () => {
    expect(wrapper.text()).toContain('Test Title')
  })

  it('should display content when not loading', () => {
    expect(wrapper.text()).toContain('Test content')
  })

  it('should display loading when loading', async () => {
    await wrapper.setData({ loading: true })
    expect(wrapper.text()).toContain('Loading...')
  })

  it('should emit click event', async () => {
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
    expect(wrapper.emitted('click')[0]).toEqual(['clicked'])
  })

  it('should update props', async () => {
    await wrapper.setProps({ title: 'New Title' })
    expect(wrapper.text()).toContain('New Title')
  })
})

// 测试认证组件
const AuthComponent = {
  template: `
    <div>
      <div v-if="isAuthenticated">
        <p>Welcome, {{ user?.username }}!</p>
        <button @click="logout">Logout</button>
      </div>
      <div v-else>
        <button @click="login">Login</button>
      </div>
    </div>
  `,
  setup() {
    const authStore = useAuthStore()
    return {
      isAuthenticated: authStore.isAuthenticated,
      user: authStore.user,
      login: authStore.login,
      logout: authStore.logout
    }
  }
}

describe('Auth Component', () => {
  let wrapper: any

  beforeEach(() => {
    wrapper = createTestWrapper(AuthComponent)
  })

  it('should show login button when not authenticated', () => {
    expect(wrapper.text()).toContain('Login')
  })

  it('should show welcome message when authenticated', async () => {
    const authStore = useAuthStore()
    authStore.user = mockUser
    authStore.isAuthenticated = true
    
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Welcome, testuser!')
  })
})

// 测试市场数据组件
const MarketComponent = {
  template: `
    <div>
      <h2>Market Data</h2>
      <div v-if="loading">Loading market data...</div>
      <div v-else>
        <h3>{{ briefing?.title }}</h3>
        <p>{{ briefing?.content }}</p>
        <div v-for="hotspot in hotspots" :key="hotspot.hotspot_name">
          <h4>{{ hotspot.hotspot_name }}</h4>
          <p>{{ hotspot.summary }}</p>
        </div>
      </div>
    </div>
  `,
  setup() {
    const marketStore = useMarketStore()
    return {
      loading: marketStore.loading.publicBriefing,
      briefing: marketStore.publicBriefing,
      hotspots: marketStore.postMarketHotspots?.items || []
    }
  }
}

describe('Market Component', () => {
  let wrapper: any

  beforeEach(() => {
    wrapper = createTestWrapper(MarketComponent)
  })

  it('should show loading state initially', () => {
    expect(wrapper.text()).toContain('Loading market data...')
  })

  it('should display market data when loaded', async () => {
    const marketStore = useMarketStore()
    marketStore.publicBriefing = mockMarketData.briefing
    marketStore.postMarketHotspots = {
      items: mockMarketData.hotspots,
      total: 1,
      page: 1,
      pageSize: 10,
      totalPages: 1
    }
    marketStore.loading.publicBriefing = false
    
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('今日市场快报')
    expect(wrapper.text()).toContain('新能源板块')
  })
})

// 测试表单组件
const FormComponent = {
  template: `
    <form @submit.prevent="handleSubmit">
      <input v-model="formData.username" placeholder="Username" />
      <input v-model="formData.password" type="password" placeholder="Password" />
      <button type="submit" :disabled="!isValid">Submit</button>
    </form>
  `,
  data() {
    return {
      formData: {
        username: '',
        password: ''
      }
    }
  },
  computed: {
    isValid() {
      return this.formData.username && this.formData.password
    }
  },
  methods: {
    handleSubmit() {
      this.$emit('submit', this.formData)
    }
  }
}

describe('Form Component', () => {
  let wrapper: any

  beforeEach(() => {
    wrapper = createTestWrapper(FormComponent)
  })

  it('should render form elements', () => {
    expect(wrapper.find('input[placeholder="Username"]').exists()).toBe(true)
    expect(wrapper.find('input[placeholder="Password"]').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
  })

  it('should disable submit button when form is invalid', () => {
    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined()
  })

  it('should enable submit button when form is valid', async () => {
    await wrapper.setData({
      formData: {
        username: 'testuser',
        password: 'password123'
      }
    })
    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeUndefined()
  })

  it('should emit submit event with form data', async () => {
    await wrapper.setData({
      formData: {
        username: 'testuser',
        password: 'password123'
      }
    })
    
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('submit')).toBeTruthy()
    expect(wrapper.emitted('submit')[0][0]).toEqual({
      username: 'testuser',
      password: 'password123'
    })
  })
})

