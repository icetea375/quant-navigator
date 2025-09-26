// 测试auth store的demoLogin方法
console.log('测试auth store...');

// 模拟测试
const testDemoLogin = () => {
  const demoUser = {
    id: 'demo_001',
    email: 'demo@quant-navigator.com',
    name: '演示用户',
    role: 'admin',
    avatar: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  const demoToken = 'demo_token_' + Date.now()
  
  console.log('演示用户:', demoUser);
  console.log('演示Token:', demoToken);
  
  return { success: true }
}

const result = testDemoLogin();
console.log('测试结果:', result);
