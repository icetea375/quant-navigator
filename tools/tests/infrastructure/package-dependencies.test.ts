/**
 * 基础设施测试 - 包依赖关系验证
 * 确保所有package.json中的依赖都真实存在
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { glob } from 'glob';

describe('Package Dependencies Validation', () => {
  const workspaceRoot = join(__dirname, '../../../..');

  test('所有package.json中的workspace依赖都应该存在', async () => {
    const packageFiles = await glob('**/package.json', {
      cwd: workspaceRoot,
      ignore: ['**/node_modules/**']
    });

    const errors: string[] = [];

    for (const packageFile of packageFiles) {
      const packagePath = join(workspaceRoot, packageFile);
      const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));

      if (packageJson.dependencies) {
        for (const [depName, depVersion] of Object.entries(packageJson.dependencies)) {
          if (typeof depVersion === 'string' && depVersion.startsWith('workspace:')) {
            // 检查workspace依赖是否存在
            const depPackageName = depName.replace('@quant-navigator/', '');
            const possiblePaths = [
              `packages/${depPackageName}/package.json`,
              `apps/${depPackageName}/package.json`,
              `tools/${depPackageName}/package.json`
            ];

            const depExists = possiblePaths.some(path =>
              existsSync(join(workspaceRoot, path))
            );

            if (!depExists) {
              errors.push(`${packageFile}: 依赖 "${depName}" 不存在`);
            }
          }
        }
      }
    }

    if (errors.length > 0) {
      throw new Error(`发现不存在的workspace依赖:\n${errors.join('\n')}`);
    }
  });

  test('所有脚本中的路径都应该存在', async () => {
    const packageFiles = await glob('**/package.json', {
      cwd: workspaceRoot,
      ignore: ['**/node_modules/**']
    });

    const errors: string[] = [];

    for (const packageFile of packageFiles) {
      const packagePath = join(workspaceRoot, packageFile);
      const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));

      if (packageJson.scripts) {
        for (const [scriptName, scriptCommand] of Object.entries(packageJson.scripts)) {
          if (typeof scriptCommand === 'string') {
            // 提取cd命令中的路径
            const cdMatch = scriptCommand.match(/cd\s+([^\s&|]+)/);
            if (cdMatch) {
              const targetPath = cdMatch[1];
              const fullPath = join(workspaceRoot, targetPath);

              if (!existsSync(fullPath)) {
                errors.push(`${packageFile} 脚本 "${scriptName}": 路径 "${targetPath}" 不存在`);
              }
            }
          }
        }
      }
    }

    if (errors.length > 0) {
      throw new Error(`发现不存在的脚本路径:\n${errors.join('\n')}`);
    }
  });

  test('pnpm-lock.yaml应该与package.json一致', () => {
    const lockfilePath = join(workspaceRoot, 'pnpm-lock.yaml');
    const packageJsonPath = join(workspaceRoot, 'package.json');

    if (!existsSync(lockfilePath)) {
      throw new Error('pnpm-lock.yaml 文件不存在');
    }

    // 尝试运行pnpm install --frozen-lockfile来验证一致性
    // 这是一个简化的检查，实际应该运行命令
    const lockfileContent = readFileSync(lockfilePath, 'utf-8');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

    // 检查lockfile中是否包含所有devDependencies
    for (const [depName, depVersion] of Object.entries(packageJson.devDependencies || {})) {
      if (typeof depVersion === 'string' && !depVersion.startsWith('workspace:')) {
        if (!lockfileContent.includes(depName)) {
          throw new Error(`pnpm-lock.yaml 中缺少依赖: ${depName}`);
        }
      }
    }
  });
});
