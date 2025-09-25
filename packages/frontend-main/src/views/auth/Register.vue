<template>
  <div class="register-page">
    <div class="register-container">
      <div class="register-form">
        <div class="form-header">
          <div class="logo">
            <el-icon><TrendCharts /></el-icon>
            <span>量化导航仪</span>
          </div>
          <h2>创建账户</h2>
          <p>注册新账户以开始您的智能投资之旅</p>
        </div>

        <el-form
          ref="registerFormRef"
          :model="registerForm"
          :rules="registerRules"
          label-width="0"
          size="large"
        >
          <el-form-item prop="name">
            <el-input
              v-model="registerForm.name"
              placeholder="请输入姓名"
              prefix-icon="User"
            />
          </el-form-item>

          <el-form-item prop="email">
            <el-input
              v-model="registerForm.email"
              placeholder="请输入邮箱地址"
              prefix-icon="Message"
            />
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="registerForm.password"
              type="password"
              placeholder="请输入密码"
              prefix-icon="Lock"
              show-password
            />
          </el-form-item>

          <el-form-item prop="confirmPassword">
            <el-input
              v-model="registerForm.confirmPassword"
              type="password"
              placeholder="请确认密码"
              prefix-icon="Lock"
              show-password
              @keyup.enter="handleRegister"
            />
          </el-form-item>

          <el-form-item>
            <el-checkbox v-model="agreeTerms">
              我已阅读并同意
              <el-button type="text" @click="showTerms = true">
                《用户协议》
              </el-button>
              和
              <el-button type="text" @click="showPrivacy = true">
                《隐私政策》
              </el-button>
            </el-checkbox>
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              class="register-button"
              :loading="authStore.isLoading"
              :disabled="!agreeTerms"
              @click="handleRegister"
            >
              注册
            </el-button>
          </el-form-item>
        </el-form>

        <div class="form-footer">
          <p>
            已有账户？
            <el-button type="text" @click="$router.push('/login')">
              立即登录
            </el-button>
          </p>
        </div>
      </div>

      <div class="register-illustration">
        <div class="illustration-content">
          <h3>开始您的投资之旅</h3>
          <p>加入我们，体验AI驱动的智能投资分析平台</p>
          <div class="benefits">
            <div class="benefit">
              <el-icon><Trophy /></el-icon>
              <div>
                <h4>专业分析</h4>
                <p>基于大数据和AI的深度市场分析</p>
              </div>
            </div>
            <div class="benefit">
              <el-icon><Shield /></el-icon>
              <div>
                <h4>安全可靠</h4>
                <p>银行级安全保护您的投资数据</p>
              </div>
            </div>
            <div class="benefit">
              <el-icon><TrendCharts /></el-icon>
              <div>
                <h4>实时监控</h4>
                <p>24/7实时监控市场动态</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 用户协议对话框 -->
    <el-dialog v-model="showTerms" title="用户协议" width="80%" max-width="600px">
      <div class="terms-content">
        <h4>1. 服务条款</h4>
        <p>欢迎使用量化导航仪平台。通过注册和使用我们的服务，您同意遵守以下条款和条件。</p>
        
        <h4>2. 账户责任</h4>
        <p>您有责任保护您的账户安全，包括密码的保密性。您同意对在您账户下发生的所有活动负责。</p>
        
        <h4>3. 服务使用</h4>
        <p>我们的服务仅供个人投资参考使用，不构成投资建议。投资有风险，请谨慎决策。</p>
        
        <h4>4. 隐私保护</h4>
        <p>我们重视您的隐私，会按照隐私政策保护您的个人信息。</p>
      </div>
      <template #footer>
        <el-button @click="showTerms = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 隐私政策对话框 -->
    <el-dialog v-model="showPrivacy" title="隐私政策" width="80%" max-width="600px">
      <div class="privacy-content">
        <h4>1. 信息收集</h4>
        <p>我们收集您主动提供的信息，如注册信息、投资偏好等。</p>
        
        <h4>2. 信息使用</h4>
        <p>我们使用收集的信息来提供个性化服务，改善用户体验。</p>
        
        <h4>3. 信息保护</h4>
        <p>我们采用行业标准的安全措施保护您的个人信息。</p>
        
        <h4>4. 信息共享</h4>
        <p>我们不会向第三方出售或分享您的个人信息，除非法律要求。</p>
      </div>
      <template #footer>
        <el-button @click="showPrivacy = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { TrendCharts, Trophy, Shield } from '@element-plus/icons-vue'

const router = useRouter()
const authStore = useAuthStore()

const registerFormRef = ref<FormInstance>()
const agreeTerms = ref(false)
const showTerms = ref(false)
const showPrivacy = ref(false)

const registerForm = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const validateConfirmPassword = (rule: any, value: any, callback: any) => {
  if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const registerRules: FormRules = {
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, message: '姓名长度不能少于2个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const handleRegister = async () => {
  if (!registerFormRef.value) return

  await registerFormRef.value.validate(async (valid) => {
    if (valid) {
      const result = await authStore.register({
        name: registerForm.name,
        email: registerForm.email,
        password: registerForm.password
      })
      
      if (result.success) {
        ElMessage.success('注册成功')
        router.push('/private')
      } else {
        ElMessage.error(result.error || '注册失败')
      }
    }
  })
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.register-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: grid;
  grid-template-columns: 1fr 1fr;
  max-width: 1000px;
  width: 100%;
  min-height: 700px;
}

.register-form {
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

.register-button {
  width: 100%;
  height: 48px;
  font-size: 16px;
}

.form-footer {
  text-align: center;
  margin-top: 30px;
  color: #666;
}

.register-illustration {
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

.benefits {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.benefit {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  text-align: left;
}

.benefit .el-icon {
  font-size: 24px;
  margin-top: 5px;
}

.benefit h4 {
  font-size: 18px;
  margin-bottom: 5px;
}

.benefit p {
  font-size: 14px;
  opacity: 0.8;
  line-height: 1.4;
}

.terms-content,
.privacy-content {
  line-height: 1.6;
}

.terms-content h4,
.privacy-content h4 {
  color: #333;
  margin: 20px 0 10px 0;
}

.terms-content p,
.privacy-content p {
  color: #666;
  margin-bottom: 15px;
}

@media (max-width: 768px) {
  .register-container {
    grid-template-columns: 1fr;
    max-width: 400px;
  }
  
  .register-illustration {
    display: none;
  }
  
  .register-form {
    padding: 40px 30px;
  }
}
</style>

