<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-form">
        <div class="form-header">
          <div class="logo">
            <el-icon><TrendCharts /></el-icon>
            <span>量化导航仪</span>
          </div>
          <h2>欢迎回来</h2>
          <p>登录您的账户以访问AI投研助理</p>
        </div>

        <el-form
          ref="loginFormRef"
          :model="loginForm"
          :rules="loginRules"
          label-width="0"
          size="large"
        >
          <el-form-item prop="email">
            <el-input
              v-model="loginForm.email"
              placeholder="请输入邮箱地址"
              prefix-icon="Message"
            />
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              prefix-icon="Lock"
              show-password
              @keyup.enter="handleLogin"
            />
          </el-form-item>

          <el-form-item>
            <div class="form-options">
              <el-checkbox v-model="rememberMe">记住我</el-checkbox>
              <el-button type="text" @click="$router.push('/forgot-password')">
                忘记密码？
              </el-button>
            </div>
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              class="login-button"
              :loading="authStore.isLoading"
              @click="handleLogin"
            >
              登录
            </el-button>
          </el-form-item>
        </el-form>

        <div class="form-footer">
          <p>
            还没有账户？
            <el-button type="text" @click="$router.push('/register')">
              立即注册
            </el-button>
          </p>
        </div>
      </div>

      <div class="login-illustration">
        <div class="illustration-content">
          <h3>智能投资分析</h3>
          <p>基于AI技术的量化投资平台，为您的投资决策提供专业指导</p>
          <div class="features">
            <div class="feature">
              <el-icon><Radar /></el-icon>
              <span>实时市场监控</span>
            </div>
            <div class="feature">
              <el-icon><DataAnalysis /></el-icon>
              <span>智能数据分析</span>
            </div>
            <div class="feature">
              <el-icon><TrendCharts /></el-icon>
              <span>专业投资建议</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { TrendCharts, Radar, DataAnalysis } from '@element-plus/icons-vue'

const router = useRouter()
const authStore = useAuthStore()

const loginFormRef = ref<FormInstance>()
const rememberMe = ref(false)

const loginForm = reactive({
  email: '',
  password: ''
})

const loginRules: FormRules = {
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return

  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      const result = await authStore.login(loginForm.email, loginForm.password)
      
      if (result.success) {
        ElMessage.success('登录成功')
        router.push('/private')
      } else {
        ElMessage.error(result.error || '登录失败')
      }
    }
  })
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: grid;
  grid-template-columns: 1fr 1fr;
  max-width: 1000px;
  width: 100%;
  min-height: 600px;
}

.login-form {
  padding: 60px 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.form-header {
  text-align: center;
  margin-bottom: 40px;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 20px;
}

.form-header h2 {
  color: #333;
  margin-bottom: 10px;
}

.form-header p {
  color: #666;
  font-size: 16px;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.login-button {
  width: 100%;
  height: 48px;
  font-size: 16px;
}

.form-footer {
  text-align: center;
  margin-top: 30px;
  color: #666;
}

.login-illustration {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 60px 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.illustration-content {
  text-align: center;
}

.illustration-content h3 {
  font-size: 28px;
  margin-bottom: 20px;
}

.illustration-content p {
  font-size: 16px;
  opacity: 0.9;
  margin-bottom: 40px;
  line-height: 1.6;
}

.features {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.feature {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
}

.feature .el-icon {
  font-size: 20px;
}

@media (max-width: 768px) {
  .login-container {
    grid-template-columns: 1fr;
    max-width: 400px;
  }
  
  .login-illustration {
    display: none;
  }
  
  .login-form {
    padding: 40px 30px;
  }
}
</style>

