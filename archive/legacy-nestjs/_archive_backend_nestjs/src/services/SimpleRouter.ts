/**
 * 简单路由器 - API网关核心组件
 * 遵循智能分析系统开发实施指南的命名规范
 */

import { Redis } from 'ioredis';
import jwt from 'jsonwebtoken';
import { BaseErrorHandler } from '../utils/BaseErrorHandler';
import { BaseConfigValidator } from '../utils/BaseConfigValidator';

export interface Route {
  path: string;
  method: string;
  upstreams: string[];
  auth: boolean;
  rateLimit?: RateLimit;
  timeout?: number;
  retries?: number;
  healthCheck?: boolean;
  middleware?: string[];
}

export interface RateLimit {
  requests: number;
  window: number; // 秒
  burst?: number;
}

export interface LoadBalancerConfig {
  strategy: 'round_robin' | 'least_connections' | 'ip_hash';
  healthCheckInterval: number;
  maxRetries: number;
  timeout: number;
}

export interface AuthConfig {
  secret: string;
  algorithm: string;
  expiresIn: string;
  issuer: string;
  audience: string;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
}

export interface CircuitBreaker {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  lastFailureTime: number;
  nextAttemptTime: number;
}

export interface GatewayConfig {
  port: number;
  host: string;
  routes: Route[];
  loadBalancer: LoadBalancerConfig;
  auth: AuthConfig;
  rateLimit: {
    global: RateLimit;
    perRoute: Map<string, RateLimit>;
  };
  logging: {
    enabled: boolean;
    level: string;
  };
}

export class SimpleRouter {
  private routes: Map<string, Route> = new Map();
  private loadBalancer: SimpleLoadBalancer;
  private rateLimiter: SimpleRateLimiter;
  private auth: SimpleAuth;
  private config: GatewayConfig;
  private logger: any;
  private metrics: Map<string, any> = new Map();
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();

  constructor(redis: Redis, config: GatewayConfig, logger: any) {
    this.config = config;
    this.logger = logger;
    this.loadBalancer = new SimpleLoadBalancer(config.loadBalancer);
    this.rateLimiter = new SimpleRateLimiter(redis, config.rateLimit);
    this.auth = new SimpleAuth(config.auth);
    this.initializeRoutes();
    this.initializeCircuitBreakers();
    this.startMetricsCollection();
  }

  /**
   * 处理请求
   */
  async handleRequest(req: any, res: any): Promise<void> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      // 记录请求日志
      this.logger.info('Request received', {
        requestId,
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      // 查找路由
      const route = this.findRoute(req.path, req.method);
      if (!route) {
        res.status(404).json({
          error: 'Route not found',
          requestId,
          timestamp: new Date().toISOString()
        });
        return;
      }

      // 认证检查
      if (route.auth) {
        const authResult = await this.checkAuthentication(req);
        if (!authResult.valid) {
          res.status(401).json({
            error: 'Unauthorized',
            message: authResult.message,
            requestId,
            timestamp: new Date().toISOString()
          });
          return;
        }
        req.user = authResult.user;
      }

      // 限流检查
      if (route.rateLimit) {
        const rateLimitResult = await this.checkRateLimit(req, route);
        if (!rateLimitResult.allowed) {
          res.status(429).json({
            error: 'Rate limit exceeded',
            retryAfter: rateLimitResult.retryAfter,
            requestId,
            timestamp: new Date().toISOString()
          });
          return;
        }
      }

      // 负载均衡选择上游
      const upstream = this.loadBalancer.selectUpstream(route.upstreams);
      if (!upstream) {
        res.status(503).json({
          error: 'Service unavailable',
          requestId,
          timestamp: new Date().toISOString()
        });
        return;
      }

      // 转发请求
      const response = await this.forwardRequest(req, res, upstream, route);

      // 记录响应日志
      const duration = Date.now() - startTime;
      this.logger.info('Request completed', {
        requestId,
        method: req.method,
        path: req.path,
        statusCode: response.statusCode,
        duration,
        upstream
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      BaseErrorHandler.handle(error, 'SimpleRouter');

      this.logger.error('Request failed', {
        requestId,
        method: req.method,
        path: req.path,
        error: error instanceof Error ? error.message : String(error),
        duration
      });

      res.status(500).json({
        error: 'Internal server error',
        requestId,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * 查找路由
   */
  private findRoute(path: string, method: string): Route | undefined {
    const routeKey = `${method}:${path}`;
    return this.routes.get(routeKey);
  }

  /**
   * 检查认证
   */
  private async checkAuthentication(req: any): Promise<{ valid: boolean; user?: any; message?: string }> {
    try {
      const token = this.extractToken(req);
      if (!token) {
        return { valid: false, message: 'No token provided' };
      }

      const user = await this.auth.verifyToken(token);
      return { valid: true, user };
    } catch (error) {
      return { valid: false, message: 'Invalid token' };
    }
  }

  /**
   * 检查限流
   */
  private async checkRateLimit(req: any, route: Route): Promise<{ allowed: boolean; retryAfter?: number }> {
    const clientId = this.getClientId(req);
    const limit = route.rateLimit || this.config.rateLimit.global;

    return await this.rateLimiter.checkLimit(clientId, limit);
  }

  /**
   * 提取Token
   */
  private extractToken(req: any): string | null {
    const authHeader = req.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return null;
  }

  /**
   * 获取客户端ID
   */
  private getClientId(req: any): string {
    return req.ip || req.connection.remoteAddress || 'unknown';
  }

  /**
   * 转发请求
   */
  private async forwardRequest(req: any, res: any, upstream: string, route: Route): Promise<any> {
    const http = require('http');
    const https = require('https');
    const url = require('url');

    const upstreamUrl = new url.URL(upstream);
    const isHttps = upstreamUrl.protocol === 'https:';
    const client = isHttps ? https : http;

    const options = {
      hostname: upstreamUrl.hostname,
      port: upstreamUrl.port || (isHttps ? 443 : 80),
      path: upstreamUrl.pathname + upstreamUrl.search,
      method: req.method,
      headers: {
        ...req.headers,
        host: upstreamUrl.host
      },
      timeout: route.timeout || this.config.loadBalancer.timeout
    };

    return new Promise((resolve, reject) => {
      const proxyReq = client.request(options, (proxyRes: any) => {
        res.statusCode = proxyRes.statusCode;
        Object.keys(proxyRes.headers).forEach(key => {
          res.setHeader(key, proxyRes.headers[key]);
        });

        proxyRes.pipe(res);
        resolve(proxyRes);
      });

      proxyReq.on('error', (error: any) => {
        reject(error);
      });

      proxyReq.on('timeout', () => {
        proxyReq.destroy();
        reject(new Error('Request timeout'));
      });

      req.pipe(proxyReq);
    });
  }

  /**
   * 生成请求ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 初始化路由
   */
  private initializeRoutes(): void {
    for (const route of this.config.routes) {
      const routeKey = `${route.method}:${route.path}`;
      this.routes.set(routeKey, route);
    }
  }

  /**
   * 添加路由
   */
  addRoute(route: Route): void {
    const routeKey = `${route.method}:${route.path}`;
    this.routes.set(routeKey, route);
  }

  /**
   * 移除路由
   */
  removeRoute(path: string, method: string): boolean {
    const routeKey = `${method}:${path}`;
    return this.routes.delete(routeKey);
  }

  /**
   * 获取所有路由
   */
  getAllRoutes(): Route[] {
    return Array.from(this.routes.values());
  }

  /**
   * 初始化熔断器
   */
  private initializeCircuitBreakers(): void {
    for (const route of this.config.routes) {
      for (const upstream of route.upstreams) {
        this.circuitBreakers.set(upstream, {
          state: 'CLOSED',
          failureCount: 0,
          lastFailureTime: 0,
          nextAttemptTime: 0
        });
      }
    }
  }

  /**
   * 检查熔断器状态
   */
  private checkCircuitBreaker(upstream: string): boolean {
    const breaker = this.circuitBreakers.get(upstream);
    if (!breaker) return true;

    const now = Date.now();

    switch (breaker.state) {
      case 'CLOSED':
        return true;
      case 'OPEN':
        if (now >= breaker.nextAttemptTime) {
          breaker.state = 'HALF_OPEN';
          return true;
        }
        return false;
      case 'HALF_OPEN':
        return true;
      default:
        return true;
    }
  }

  /**
   * 记录成功
   */
  private recordSuccess(upstream: string): void {
    const breaker = this.circuitBreakers.get(upstream);
    if (!breaker) return;

    if (breaker.state === 'HALF_OPEN') {
      breaker.state = 'CLOSED';
      breaker.failureCount = 0;
    }
  }

  /**
   * 记录失败
   */
  private recordFailure(upstream: string): void {
    const breaker = this.circuitBreakers.get(upstream);
    if (!breaker) return;

    breaker.failureCount++;
    breaker.lastFailureTime = Date.now();

    if (breaker.failureCount >= 5) { // 失败阈值
      breaker.state = 'OPEN';
      breaker.nextAttemptTime = Date.now() + 30000; // 30秒后重试
    }
  }

  /**
   * 开始指标收集
   */
  private startMetricsCollection(): void {
    setInterval(() => {
      this.collectMetrics();
    }, 60000); // 每分钟收集一次
  }

  /**
   * 收集指标
   */
  private collectMetrics(): void {
    const metrics = {
      timestamp: Date.now(),
      routes: this.routes.size,
      circuitBreakers: Array.from(this.circuitBreakers.entries()).map(([upstream, breaker]) => ({
        upstream,
        state: breaker.state,
        failureCount: breaker.failureCount
      })),
      loadBalancer: this.loadBalancer.getStats(),
      rateLimiter: this.rateLimiter.getStats()
    };

    this.metrics.set('gateway_metrics', metrics);
  }

  /**
   * 获取指标
   */
  getMetrics(): any {
    return this.metrics.get('gateway_metrics') || {};
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<{ status: string; details: any }> {
    const details = {
      routes: this.routes.size,
      circuitBreakers: Array.from(this.circuitBreakers.entries()).length,
      loadBalancer: this.loadBalancer.getStats(),
      rateLimiter: this.rateLimiter.getStats()
    };

    return {
      status: 'healthy',
      details
    };
  }
}

/**
 * 简单负载均衡器
 */
export class SimpleLoadBalancer {
  private config: LoadBalancerConfig;
  private currentIndex: number = 0;
  private upstreamHealth: Map<string, boolean> = new Map();
  private connectionCounts: Map<string, number> = new Map();
  private healthCheckInterval?: NodeJS.Timeout;

  constructor(config: LoadBalancerConfig) {
    this.config = config;
    this.startHealthChecks();
  }

  selectUpstream(upstreams: string[]): string | null {
    const healthyUpstreams = upstreams.filter(upstream =>
      this.upstreamHealth.get(upstream) !== false
    );

    if (healthyUpstreams.length === 0) {
      return null;
    }

    switch (this.config.strategy) {
      case 'round_robin':
        return this.roundRobin(healthyUpstreams);
      case 'least_connections':
        return this.leastConnections(healthyUpstreams);
      case 'ip_hash':
        return this.ipHash(healthyUpstreams);
      default:
        return this.roundRobin(healthyUpstreams);
    }
  }

  private roundRobin(upstreams: string[]): string {
    const upstream = upstreams[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % upstreams.length;
    return upstream;
  }

  private leastConnections(upstreams: string[]): string {
    let leastConnections = Infinity;
    let selectedUpstream = upstreams[0];

    for (const upstream of upstreams) {
      const connections = this.connectionCounts.get(upstream) || 0;
      if (connections < leastConnections) {
        leastConnections = connections;
        selectedUpstream = upstream;
      }
    }

    return selectedUpstream;
  }

  private ipHash(upstreams: string[]): string {
    // 简化版本，实际应该基于客户端IP
    const hash = Math.abs(this.hashCode(upstreams.join('')));
    return upstreams[hash % upstreams.length];
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  }

  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, this.config.healthCheckInterval);
  }

  private async performHealthChecks(): Promise<void> {
    // 实现健康检查逻辑
    // 这里简化处理，实际应该检查每个上游服务的健康状态
  }

  /**
   * 获取统计信息
   */
  getStats(): any {
    return {
      strategy: this.config.strategy,
      healthyUpstreams: Array.from(this.upstreamHealth.entries()).filter(([_, healthy]) => healthy).length,
      totalUpstreams: this.upstreamHealth.size,
      connectionCounts: Object.fromEntries(this.connectionCounts)
    };
  }
}

/**
 * 简单限流器
 */
export class SimpleRateLimiter {
  private redis: Redis;
  private config: any;

  constructor(redis: Redis, config: any) {
    this.redis = redis;
    this.config = config;
  }

  async checkLimit(clientId: string, limit: RateLimit): Promise<{ allowed: boolean; retryAfter?: number }> {
    try {
      const key = `rate_limit:${clientId}`;
      const current = await this.redis.incr(key);

      if (current === 1) {
        await this.redis.expire(key, limit.window);
      }

      if (current > limit.requests) {
        const ttl = await this.redis.ttl(key);
        return {
          allowed: false,
          retryAfter: ttl > 0 ? ttl : limit.window
        };
      }

      return { allowed: true };
    } catch (error) {
      console.error('Rate limit check failed:', error);
      return { allowed: true }; // 失败时允许通过
    }
  }

  /**
   * 获取统计信息
   */
  getStats(): any {
    return {
      enabled: true,
      globalLimit: this.config.global,
      perRouteLimits: Object.fromEntries(this.config.perRoute)
    };
  }
}

/**
 * 简单认证器
 */
export class SimpleAuth {
  private config: AuthConfig;

  constructor(config: AuthConfig) {
    this.config = config;
  }

  async verifyToken(token: string): Promise<any> {
    try {
      const decoded = jwt.verify(token, this.config.secret, {
        algorithms: [this.config.algorithm],
        issuer: this.config.issuer,
        audience: this.config.audience
      });
      return decoded;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  generateToken(payload: any): string {
    return jwt.sign(payload, this.config.secret, {
      algorithm: this.config.algorithm,
      expiresIn: this.config.expiresIn,
      issuer: this.config.issuer,
      audience: this.config.audience
    });
  }
}
