<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <div class="error-code">
        404
      </div>
      <h1 class="error-title">
        大爷不在家
      </h1>
      <p class="error-description">
        有事请烧香，页面已离家出走。
      </p>
      <div class="error-actions">
        <el-button
          type="primary"
          @click="goHome"
        >
          <el-icon><House /></el-icon>
          回家看看
        </el-button>
        <el-button @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          回头是岸
        </el-button>
      </div>
    </div>
    <div class="error-illustration">
      <el-icon
        size="200"
        color="#e6f7ff"
      >
        <DocumentRemove />
      </el-icon>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { House, ArrowLeft, DocumentRemove } from '@element-plus/icons-vue'

const router = useRouter()

const goHome = () => {
  router.push('/')
}

const goBack = () => {
  if (window.history.length > 1) {
    router.go(-1)
  } else {
    router.push('/')
  }
}
</script>

<style scoped>
.not-found-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.not-found-content {
  text-align: center;
  color: white;
  max-width: 500px;
  z-index: 2;
}

.error-code {
  font-size: 120px;
  font-weight: bold;
  line-height: 1;
  margin-bottom: 20px;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.error-title {
  font-size: 32px;
  margin-bottom: 16px;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.error-description {
  font-size: 18px;
  margin-bottom: 32px;
  opacity: 0.9;
  line-height: 1.6;
}

.error-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.error-actions .el-button {
  padding: 12px 24px;
  font-size: 16px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.error-actions .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
}

.error-illustration {
  position: absolute;
  right: 10%;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0.1;
  z-index: 1;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .not-found-container {
    flex-direction: column;
    text-align: center;
  }
  
  .error-code {
    font-size: 80px;
  }
  
  .error-title {
    font-size: 24px;
  }
  
  .error-description {
    font-size: 16px;
  }
  
  .error-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .error-illustration {
    position: static;
    transform: none;
    margin-top: 20px;
  }
}

/* 动画效果 */
.not-found-content {
  animation: fadeInUp 0.8s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
