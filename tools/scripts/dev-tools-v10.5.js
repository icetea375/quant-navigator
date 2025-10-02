#!/usr/bin/env node

/**
 * v10.5双脑分治架构开发工具集
 * 提供开发、测试、部署等工具函数
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DevToolsV10_5 {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.config = this.loadConfig();
  }

  loadConfig() {
    try {
      const configPath = path.join(this.projectRoot, 'config/main_config.json');
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (error) {
      console.error('❌ 无法加载配置文件:', error.message);
      process.exit(1);
    }
  }

  /**
   * 检查开发环境
   */
  checkEnvironment() {
    console.log('🔍 检查开发环境...');

    const checks = [
      {
        name: 'Node.js版本',
        check: () => {
          const version = process.version;
          const major = parseInt(version.slice(1).split('.')[0]);
          return major >= 16;
        },
        message: 'Node.js版本需要 >= 16.0.0'
      },
      {
        name: 'Python版本',
        check: () => {
          try {
            const version = execSync('python3 --version', { encoding: 'utf8' });
            const major = parseInt(version.split(' ')[1].split('.')[0]);
            return major >= 3;
          } catch {
            return false;
          }
        },
        message: 'Python版本需要 >= 3.8'
      },
      {
        name: '数据库连接',
        check: async () => {
          try {
            const mysql = await import('mysql2/promise');
            const connection = await mysql.createConnection({
              host: this.config.database.host,
              port: this.config.database.port,
              user: this.config.database.user,
              password: this.config.database.password,
              database: this.config.database.database
            });
            await connection.end();
            return true;
          } catch {
            return false;
          }
        },
        message: '无法连接到数据库'
      },
      {
        name: '环境变量',
        check: () => {
          const requiredVars = ['QWEN_API_KEY', 'DOUBAO_API_KEY'];
          return requiredVars.every(varName => process.env[varName]);
        },
        message: '缺少必要的环境变量: QWEN_API_KEY, DOUBAO_API_KEY'
      }
    ];

    let allPassed = true;
    for (const check of checks) {
      try {
        let result;
        if (typeof check.check === 'function') {
          result = check.check();
        } else {
          result = await check.check();
        }

        if (result) {
          console.log(`✅ ${check.name}: 通过`);
        } else {
          console.log(`❌ ${check.name}: 失败 - ${check.message}`);
          allPassed = false;
        }
      } catch (error) {
        console.log(`❌ ${check.name}: 错误 - ${error.message}`);
        allPassed = false;
      }
    }

    return allPassed;
  }

  /**
   * 运行数据库迁移
   */
  async runMigration() {
    console.log('🚀 运行数据库迁移...');

    try {
      const migrationScript = path.join(__dirname, 'migrate-database-v10.5.js');
      execSync(`node ${migrationScript} migrate`, { stdio: 'inherit' });
      console.log('✅ 数据库迁移完成');
    } catch (error) {
      console.error('❌ 数据库迁移失败:', error.message);
      throw error;
    }
  }

  /**
   * 运行测试套件
   */
  runTests() {
    console.log('🧪 运行测试套件...');

    try {
      // 运行单元测试
      console.log('📝 运行单元测试...');
      execSync('npm test -- --testPathPattern=unit', {
        stdio: 'inherit',
        cwd: this.projectRoot
      });

      // 运行集成测试
      console.log('🔗 运行集成测试...');
      execSync('npm test -- --testPathPattern=integration', {
        stdio: 'inherit',
        cwd: this.projectRoot
      });

      // 运行双脑分析测试
      console.log('🧠 运行双脑分析测试...');
      execSync('npm test -- --testPathPattern=dual-brain', {
        stdio: 'inherit',
        cwd: this.projectRoot
      });

      console.log('✅ 所有测试通过');
    } catch (error) {
      console.error('❌ 测试失败:', error.message);
      throw error;
    }
  }

  /**
   * 启动开发服务器
   */
  startDevServers() {
    console.log('🚀 启动开发服务器...');

    try {
      // 启动后端服务
      console.log('🔧 启动后端服务...');
      const backendProcess = execSync('npm run dev', {
        cwd: path.join(this.projectRoot, 'backend'),
        stdio: 'pipe',
        detached: true
      });

      // 启动前端服务
      console.log('🎨 启动前端服务...');
      const frontendProcess = execSync('npm run dev', {
        cwd: path.join(this.projectRoot, 'frontend'),
        stdio: 'pipe',
        detached: true
      });

      console.log('✅ 开发服务器启动完成');
      console.log('📱 前端地址: http://localhost:3000');
      console.log('🔧 后端地址: http://localhost:8000');

    } catch (error) {
      console.error('❌ 启动开发服务器失败:', error.message);
      throw error;
    }
  }

  /**
   * 生成API文档
   */
  generateAPIDocs() {
    console.log('📚 生成API文档...');

    try {
      const apiDocPath = path.join(this.projectRoot, 'docs/api-docs-v10.5.md');

      const apiDocs = `# API文档 - v10.5双脑分治架构

## 双脑分析API

### 启动双脑并行分析
\`\`\`http
POST /api/dual-brain/analyze
Content-Type: application/json

{
  "stock_code": "000001",
  "trade_date": "2025-01-17"
}
\`\`\`

### 获取待仲裁案件列表
\`\`\`http
GET /api/dual-brain/pending-cases
\`\`\`

### 获取案件双报告
\`\`\`http
GET /api/dual-brain/case/{caseId}/reports
\`\`\`

### 提交仲裁决策
\`\`\`http
POST /api/dual-brain/case/{caseId}/arbitrate
Content-Type: application/json

{
  "final_recommendation": "BUY",
  "confidence_level": 85,
  "reasoning": "基于双脑分析的综合判断",
  "key_disagreements": "Qwen关注财务数据，豆包关注市场情绪"
}
\`\`\`

### 获取分析器性能统计
\`\`\`http
GET /api/dual-brain/performance
\`\`\`

## 响应格式

所有API响应都遵循以下格式：

\`\`\`json
{
  "success": true,
  "data": { ... },
  "error": null
}
\`\`\`

## 错误处理

\`\`\`json
{
  "success": false,
  "data": null,
  "error": "错误描述",
  "details": "详细错误信息"
}
\`\`\`
`;

      fs.writeFileSync(apiDocPath, apiDocs);
      console.log('✅ API文档生成完成:', apiDocPath);

    } catch (error) {
      console.error('❌ 生成API文档失败:', error.message);
      throw error;
    }
  }

  /**
   * 性能监控
   */
  async monitorPerformance() {
    console.log('📊 启动性能监控...');

    try {
      // 检查数据库性能
      const mysql = await import('mysql2/promise');
      const connection = await mysql.createConnection({
        host: this.config.database.host,
        port: this.config.database.port,
        user: this.config.database.user,
        password: this.config.database.password,
        database: this.config.database.database
      });

      // 获取数据库状态
      const [status] = await connection.execute('SHOW STATUS LIKE "Threads_connected"');
      console.log('🔗 数据库连接数:', status[0].Value);

      // 获取表大小
      const [tables] = await connection.execute(`
        SELECT
          table_name,
          ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
        FROM information_schema.TABLES
        WHERE table_schema = '${this.config.database.database}'
        ORDER BY (data_length + index_length) DESC
      `);

      console.log('📋 表大小统计:');
      tables.forEach(table => {
        console.log(`  - ${table.table_name}: ${table['Size (MB)']} MB`);
      });

      await connection.end();
      console.log('✅ 性能监控完成');

    } catch (error) {
      console.error('❌ 性能监控失败:', error.message);
      throw error;
    }
  }

  /**
   * 清理开发环境
   */
  cleanup() {
    console.log('🧹 清理开发环境...');

    try {
      // 清理临时文件
      const tempDirs = ['node_modules/.cache', 'dist', 'build'];
      tempDirs.forEach(dir => {
        const dirPath = path.join(this.projectRoot, dir);
        if (fs.existsSync(dirPath)) {
          fs.rmSync(dirPath, { recursive: true, force: true });
          console.log(`🗑️ 清理目录: ${dir}`);
        }
      });

      // 清理日志文件
      const logFiles = fs.readdirSync(this.projectRoot)
        .filter(file => file.endsWith('.log'))
        .map(file => path.join(this.projectRoot, file));

      logFiles.forEach(file => {
        fs.unlinkSync(file);
        console.log(`🗑️ 清理日志: ${path.basename(file)}`);
      });

      console.log('✅ 环境清理完成');

    } catch (error) {
      console.error('❌ 环境清理失败:', error.message);
      throw error;
    }
  }

  /**
   * 显示帮助信息
   */
  showHelp() {
    console.log(`
🧠 v10.5双脑分治架构开发工具

使用方法:
  node dev-tools-v10.5.js <command>

可用命令:
  check         检查开发环境
  migrate       运行数据库迁移
  test          运行测试套件
  start         启动开发服务器
  docs          生成API文档
  monitor       性能监控
  cleanup       清理开发环境
  help          显示帮助信息

示例:
  node dev-tools-v10.5.js check
  node dev-tools-v10.5.js migrate
  node dev-tools-v10.5.js test
  node dev-tools-v10.5.js start
`);
  }
}

// 主函数
async function main() {
  const devTools = new DevToolsV10_5();
  const command = process.argv[2] || 'help';

  try {
    switch (command) {
      case 'check':
        await devTools.checkEnvironment();
        break;
      case 'migrate':
        await devTools.runMigration();
        break;
      case 'test':
        devTools.runTests();
        break;
      case 'start':
        devTools.startDevServers();
        break;
      case 'docs':
        devTools.generateAPIDocs();
        break;
      case 'monitor':
        await devTools.monitorPerformance();
        break;
      case 'cleanup':
        devTools.cleanup();
        break;
      case 'help':
      default:
        devTools.showHelp();
        break;
    }
  } catch (error) {
    console.error('❌ 命令执行失败:', error.message);
    process.exit(1);
  }
}

// 执行主函数
main();
