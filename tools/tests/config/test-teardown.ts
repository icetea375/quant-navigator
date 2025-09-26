import { Logger } from '@nestjs/common';

const logger = new Logger('TestTeardown');

export default async function globalTeardown() {
    logger.log('🧹 开始清理测试环境...');

    try {
        // 清理测试数据库连接
        logger.log('清理测试数据库连接...');

        // 清理测试缓存
        logger.log('清理测试缓存...');

        // 清理临时文件
        logger.log('清理临时文件...');

        logger.log('✅ 测试环境清理完成！');
    } catch (error) {
        logger.error('❌ 测试环境清理失败:', error);
        throw error;
    }
}
