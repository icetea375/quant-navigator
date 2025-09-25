// 测试依赖是否正确安装
console.log('Testing dependencies...');

try {
  const typeorm = require('typeorm');
  console.log('✅ typeorm loaded successfully');
  console.log('typeorm version:', typeorm.version || 'unknown');
} catch (error) {
  console.log('❌ typeorm failed to load:', error.message);
}

try {
  const classValidator = require('class-validator');
  console.log('✅ class-validator loaded successfully');
} catch (error) {
  console.log('❌ class-validator failed to load:', error.message);
}

console.log('Dependency test completed.');
