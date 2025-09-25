/**
 * AdminGuard - 管理员权限守卫
 * 确保只有管理员可以访问AI训练中心
 */

import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // 检查用户是否存在
    if (!user) {
      throw new ForbiddenException('用户未认证');
    }

    // 检查用户角色是否为管理员
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      throw new ForbiddenException('需要管理员权限');
    }

    return true;
  }
}
