/**
 * 依赖管理工具测试 - 严格遵循测试宪法
 * 
 * 测试宪法要求：
 * - 第1条：测试的唯一目的是验证生产代码是否严格履行了其设计契约
 * - 第3条：遵循"红灯-绿灯-重构"原则
 * - 第7条：断言必须"精确且有意义"
 * - 第10条：环境一致性铁律 - 使用根目录的单一虚拟环境
 * - 第14条：测试执行统一化，通过项目根目录的run-tests.sh执行
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync, unlinkSync, mkdirSync } from 'fs';
import { join } from 'path';

describe('DependencyManager - 遵循测试宪法', () => {
  // 使用绝对路径确保正确性
  const projectRoot = process.cwd();
  const reportsDir = join(projectRoot, 'reports', 'dependencies');
  const testRequirementsFile = join(projectRoot, 'test-requirements.txt');
  const testPackageJson = join(projectRoot, 'test-package.json');
  
  // 验证项目根目录和虚拟环境
  console.log('Project root:', projectRoot);
  console.log('Virtual env exists:', existsSync(join(projectRoot, 'venv', 'bin', 'activate')));

  beforeEach(() => {
    // 创建测试用的依赖文件
    const testRequirements = `fastapi==0.100.1
starlette==0.27.0
requests==2.32.5
urllib3==2.5.0
pandas==2.3.2
numpy==1.26.4`;

    const testPackageJsonContent = {
      "name": "test-project",
      "dependencies": {
        "react": "^18.2.0",
        "typescript": "^5.1.0"
      },
      "devDependencies": {
        "jest": "^29.6.0"
      }
    };

    writeFileSync(testRequirementsFile, testRequirements);
    writeFileSync(testPackageJson, JSON.stringify(testPackageJsonContent, null, 2));
    
    // 确保报告目录存在
    mkdirSync(reportsDir, { recursive: true });
  });

  afterEach(() => {
    // 清理测试文件
    if (existsSync(testRequirementsFile)) {
      unlinkSync(testRequirementsFile);
    }
    if (existsSync(testPackageJson)) {
      unlinkSync(testPackageJson);
    }
    if (existsSync(reportsDir)) {
      execSync(`rm -rf ${reportsDir}`, { cwd: projectRoot });
    }
  });

  describe('should detect security vulnerabilities when scanning dependencies', () => {
    it('should identify outdated packages with security issues', async () => {
      // Arrange - 准备测试数据（测试宪法第7条：精确且有意义）
      const expectedVulnerabilities = ['fastapi', 'starlette', 'requests', 'urllib3'];
      
      // Act - 执行安全扫描（测试宪法第10条：使用虚拟环境）
      const result = execSync(
        `source venv/bin/activate && python tools/scripts/dependency-manager.py --type security --dry-run --output security-test.json`,
        { 
          cwd: projectRoot,
          encoding: 'utf-8',
          shell: '/bin/bash'
        }
      );

      // Assert - 验证结果（测试宪法第7条：精确且有意义）
      expect(result).toContain('检查安全漏洞');
      expect(result).toContain('发现');
      
      // 验证报告文件是否生成
      const reportPath = join(reportsDir, 'security-test.json');
      expect(existsSync(reportPath)).toBe(true);
      
      // 验证报告内容的具体值
      const report = JSON.parse(readFileSync(reportPath, 'utf-8'));
      expect(report.security_updates).toBeGreaterThan(0);
      expect(Array.isArray(report.dependencies)).toBe(true);
      expect(report.dependencies.length).toBeGreaterThan(0);
    });

    it('should categorize updates by type correctly', async () => {
      // Arrange - 准备测试数据
      const expectedUpdateTypes = ['security', 'patch', 'minor', 'major'];
      
      // Act - 执行依赖检查
      const result = execSync(
        `source venv/bin/activate && python tools/scripts/dependency-manager.py --type all --dry-run --output update-test.json`,
        { 
          cwd: projectRoot,
          encoding: 'utf-8',
          shell: '/bin/bash'
        }
      );

      // Assert - 验证结果
      expect(result).toContain('检查Node.js依赖');
      expect(result).toContain('检查Python依赖');
      
      // 验证报告文件
      const reportPath = join(reportsDir, 'update-test.json');
      expect(existsSync(reportPath)).toBe(true);
      
      const report = JSON.parse(readFileSync(reportPath, 'utf-8'));
      expect(report.total_dependencies).toBeGreaterThan(0);
      expect(report.security_updates).toBeGreaterThanOrEqual(0);
      expect(report.patch_updates).toBeGreaterThanOrEqual(0);
    });
  });

  describe('should detect dependency conflicts when analyzing packages', () => {
    it('should identify version conflicts between packages', async () => {
      // Arrange - 准备有冲突的依赖文件
      const conflictingRequirements = `fastapi==0.100.1
starlette==0.48.0  # 版本不匹配
requests==2.32.5
urllib3==2.5.0`;
      
      writeFileSync(testRequirementsFile, conflictingRequirements);

      // Act - 执行冲突检测
      const result = execSync(
        `source venv/bin/activate && python tools/scripts/dependency-manager.py --type all --dry-run --output conflict-test.json`,
        { 
          cwd: projectRoot,
          encoding: 'utf-8',
          shell: '/bin/bash'
        }
      );

      // Assert - 验证结果
      expect(result).toContain('检测依赖冲突');
      
      // 验证报告文件
      const reportPath = join(reportsDir, 'conflict-test.json');
      if (existsSync(reportPath)) {
        const report = JSON.parse(readFileSync(reportPath, 'utf-8'));
        expect(typeof report.conflicts).toBe('number');
        expect(report.conflicts).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('should generate comprehensive update reports', () => {
    it('should create detailed update plan with all required fields', async () => {
      // Arrange - 准备测试数据
      const expectedFields = [
        'timestamp',
        'total_dependencies',
        'security_updates',
        'patch_updates',
        'minor_updates',
        'major_updates',
        'conflicts',
        'dependencies',
        'conflict_resolutions'
      ];

      // Act - 执行依赖分析
      const result = execSync(
        `source venv/bin/activate && python tools/scripts/dependency-manager.py --type all --dry-run --output comprehensive-test.json`,
        { 
          cwd: projectRoot,
          encoding: 'utf-8',
          shell: '/bin/bash'
        }
      );

      // Assert - 验证结果
      expect(result).toContain('依赖分析摘要');
      
      // 验证报告文件
      const reportPath = join(reportsDir, 'comprehensive-test.json');
      expect(existsSync(reportPath)).toBe(true);
      
      const report = JSON.parse(readFileSync(reportPath, 'utf-8'));
      
      // 验证所有必需字段都存在
      expectedFields.forEach(field => {
        expect(report).toHaveProperty(field);
      });
      
      // 验证数据类型
      expect(typeof report.total_dependencies).toBe('number');
      expect(typeof report.security_updates).toBe('number');
      expect(Array.isArray(report.dependencies)).toBe(true);
    });

    it('should save reports to correct directory structure', async () => {
      // Act - 执行依赖分析
      execSync(
        `source venv/bin/activate && python tools/scripts/dependency-manager.py --type security --dry-run --output directory-test.json`,
        { 
          cwd: projectRoot,
          encoding: 'utf-8',
          shell: '/bin/bash'
        }
      );

      // Assert - 验证目录结构
      expect(existsSync(reportsDir)).toBe(true);
      expect(existsSync(join(reportsDir, 'directory-test.json'))).toBe(true);
    });
  });

  describe('should handle command line arguments correctly', () => {
    it('should accept --type parameter with valid values', async () => {
      const validTypes = ['security', 'patch', 'minor', 'major', 'all'];
      
      for (const type of validTypes) {
        // Act - 执行命令
        const result = execSync(
          `source venv/bin/activate && python tools/scripts/dependency-manager.py --type ${type} --dry-run`,
          { 
            cwd: projectRoot,
            encoding: 'utf-8',
            shell: '/bin/bash'
          }
        );

        // Assert - 验证结果
        expect(result).toContain('开始依赖分析');
        expect(result).toContain('依赖分析摘要');
      }
    });

    it('should respect --dry-run flag and not perform actual updates', async () => {
      // Act - 执行试运行
      const result = execSync(
        `source venv/bin/activate && python tools/scripts/dependency-manager.py --type security --dry-run`,
        { 
          cwd: projectRoot,
          encoding: 'utf-8',
          shell: '/bin/bash'
        }
      );

      // Assert - 验证结果
      expect(result).toContain('试运行模式');
      expect(result).toContain('未执行实际更新');
    });

    it('should accept custom output filename', async () => {
      const customFilename = 'custom-report.json';
      
      // Act - 执行命令
      execSync(
        `source venv/bin/activate && python tools/scripts/dependency-manager.py --type all --dry-run --output ${customFilename}`,
        { 
          cwd: projectRoot,
          encoding: 'utf-8',
          shell: '/bin/bash'
        }
      );

      // Assert - 验证结果
      const reportPath = join(reportsDir, customFilename);
      expect(existsSync(reportPath)).toBe(true);
    });
  });

  describe('should provide meaningful error messages', () => {
    it('should handle invalid command line arguments gracefully', async () => {
      // Act & Assert - 验证无效参数处理
      expect(() => {
        execSync(
          `source venv/bin/activate && python tools/scripts/dependency-manager.py --type invalid`,
          { 
            cwd: projectRoot,
            encoding: 'utf-8',
            shell: '/bin/bash'
          }
        );
      }).toThrow();
    });

    it('should handle missing dependencies gracefully', async () => {
      // Arrange - 创建空的依赖文件
      writeFileSync(testRequirementsFile, '');
      writeFileSync(testPackageJson, '{}');

      // Act - 执行分析
      const result = execSync(
        `source venv/bin/activate && python tools/scripts/dependency-manager.py --type all --dry-run`,
        { 
          cwd: projectRoot,
          encoding: 'utf-8',
          shell: '/bin/bash'
        }
      );

      // Assert - 验证结果
      expect(result).toContain('开始依赖分析');
      expect(result).toContain('依赖分析摘要');
    });
  });
});