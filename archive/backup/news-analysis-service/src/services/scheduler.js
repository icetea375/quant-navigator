// 临时注释掉有问题的服务
// const NewsRecommendationService = require('./news-recommendation');
const TimelineEventGenerator = require('./timeline-event-generator');

class SchedulerService {
  constructor() {
    // this.newsRecommendationService = new NewsRecommendationService();
    this.timelineEventGenerator = new TimelineEventGenerator();
    this.isRunning = false;
    this.intervalId = null;
  }

  /**
   * 启动定时任务
   */
  start() {
    if (this.isRunning) {
      console.log('定时任务已在运行中');
      return;
    }

    console.log('启动新闻推荐定时任务...');
    this.isRunning = true;

    // 立即执行一次
    this.executeTask();

    // 每10分钟执行新闻推荐
    this.newsIntervalId = setInterval(() => {
      this.executeNewsTask();
    }, 10 * 60 * 1000); // 10分钟

    // 每天执行一次时间线生成（凌晨2点）
    this.timelineIntervalId = setInterval(() => {
      this.executeTimelineTask();
    }, 24 * 60 * 60 * 1000); // 24小时

    console.log('定时任务已启动：新闻推荐每10分钟，时间线生成每天一次');
  }

  /**
   * 停止定时任务
   */
  stop() {
    if (!this.isRunning) {
      console.log('定时任务未在运行');
      return;
    }

    if (this.newsIntervalId) {
      clearInterval(this.newsIntervalId);
      this.newsIntervalId = null;
    }

    if (this.timelineIntervalId) {
      clearInterval(this.timelineIntervalId);
      this.timelineIntervalId = null;
    }

    this.isRunning = false;
    console.log('定时任务已停止');
  }

  /**
   * 执行新闻推荐任务
   */
  async executeNewsTask() {
    try {
      console.log(`[${new Date().toISOString()}] 开始执行新闻推荐任务...`);
      // 临时注释掉新闻推荐服务
      // const newsResult = await this.newsRecommendationService.updateRecommendedNews();
      console.log(`[${new Date().toISOString()}] 新闻推荐任务完成: 已跳过`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] 新闻推荐任务失败:`, error);
    }
  }

  /**
   * 执行时间线生成任务
   */
  async executeTimelineTask() {
    try {
      console.log(`[${new Date().toISOString()}] 开始执行时间线事件生成任务...`);
      const timelineResult = await this.timelineEventGenerator.generateEventsForAllTopics();
      console.log(`[${new Date().toISOString()}] 时间线事件生成任务完成:`, timelineResult);

      // 清理过期新闻
      // this.newsRecommendationService.cleanExpiredNews();
    } catch (error) {
      console.error(`[${new Date().toISOString()}] 时间线生成任务失败:`, error);
    }
  }

  /**
   * 执行任务（兼容性方法）
   */
  async executeTask() {
    await this.executeNewsTask();
  }

  /**
   * 获取任务状态
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      nextExecution: this.isRunning ? '每10分钟执行一次' : '未运行'
    };
  }
}

// 创建全局实例
const scheduler = new SchedulerService();

// 优雅关闭处理
process.on('SIGINT', () => {
  console.log('收到SIGINT信号，正在停止定时任务...');
  scheduler.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('收到SIGTERM信号，正在停止定时任务...');
  scheduler.stop();
  process.exit(0);
});

module.exports = scheduler;
