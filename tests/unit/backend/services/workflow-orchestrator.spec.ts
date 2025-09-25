/**
 * WorkflowOrchestrator 单元测试
 * 基于全流程测试计划v1.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowOrchestrator } from '@/services/WorkflowOrchestrator';
import { Database } from '@/database/unified-connection';
import { Logger } from '@/utils/logger';
import { TestHelpers } from '../../utils/test-helpers';

describe('WorkflowOrchestrator', () => {
  let orchestrator: WorkflowOrchestrator;
  let mockDatabase: any;
  let mockLogger: any;

  // Mock数据
  const mockWorkflowConfig = {
    enableCoreUniverse: true,
    enableObservationUniverse: true,
    enableDailyPromotion: true,
    enableMonthlyDemotion: true,
    coreUniverseMaxSize: 100,
    observationUniverseMaxSize: 200,
    promotionCheckTime: '09:30',
    demotionCheckTime: '15:00'
  };

  const mockExecutionResult = {
    success: true,
    startTime: '2024-01-01T09:00:00Z',
    endTime: '2024-01-01T09:30:00Z',
    duration: 1800000,
    coreUniverseProcessed: 50,
    observationUniverseProcessed: 25,
    errors: [],
    warnings: []
  };

  beforeEach(async () => {
    // 创建Mock对象
    mockDatabase = TestHelpers.createMockDatabase();
    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowOrchestrator,
        {
          provide: Database,
          useValue: mockDatabase,
        },
        {
          provide: Logger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    orchestrator = module.get<WorkflowOrchestrator>(WorkflowOrchestrator);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(orchestrator).toBeDefined();
  });

  describe('executeWorkflow', () => {
    it('should execute workflow successfully', async () => {
      // Arrange
      mockDatabase.query.mockResolvedValue({ rows: [] });
      jest.spyOn(orchestrator as any, 'processCoreUniverse').mockResolvedValue(50);
      jest.spyOn(orchestrator as any, 'processObservationUniverse').mockResolvedValue(25);

      // Act
      const result = await orchestrator.executeWorkflow();

      // Assert
      expect(result.success).toBe(true);
      expect(result.coreUniverseProcessed).toBe(50);
      expect(result.observationUniverseProcessed).toBe(25);
      expect(result.errors).toHaveLength(0);
      expect(mockLogger.log).toHaveBeenCalledWith('开始执行工作流');
    });

    it('should handle workflow execution errors', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      mockDatabase.query.mockRejectedValue(error);

      // Act
      const result = await orchestrator.executeWorkflow();

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Database connection failed');
      expect(mockLogger.error).toHaveBeenCalledWith('工作流执行失败', error);
    });

    it('should process core universe when enabled', async () => {
      // Arrange
      const config = { ...mockWorkflowConfig, enableCoreUniverse: true };
      jest.spyOn(orchestrator as any, 'getWorkflowConfig').mockResolvedValue(config);
      jest.spyOn(orchestrator as any, 'processCoreUniverse').mockResolvedValue(50);

      // Act
      const result = await orchestrator.executeWorkflow();

      // Assert
      expect(result.coreUniverseProcessed).toBe(50);
    });

    it('should skip core universe when disabled', async () => {
      // Arrange
      const config = { ...mockWorkflowConfig, enableCoreUniverse: false };
      jest.spyOn(orchestrator as any, 'getWorkflowConfig').mockResolvedValue(config);
      jest.spyOn(orchestrator as any, 'processCoreUniverse').mockResolvedValue(0);

      // Act
      const result = await orchestrator.executeWorkflow();

      // Assert
      expect(result.coreUniverseProcessed).toBe(0);
    });

    it('should process observation universe when enabled', async () => {
      // Arrange
      const config = { ...mockWorkflowConfig, enableObservationUniverse: true };
      jest.spyOn(orchestrator as any, 'getWorkflowConfig').mockResolvedValue(config);
      jest.spyOn(orchestrator as any, 'processObservationUniverse').mockResolvedValue(25);

      // Act
      const result = await orchestrator.executeWorkflow();

      // Assert
      expect(result.observationUniverseProcessed).toBe(25);
    });

    it('should handle partial failures gracefully', async () => {
      // Arrange
      jest.spyOn(orchestrator as any, 'processCoreUniverse').mockRejectedValue(new Error('Core universe processing failed'));
      jest.spyOn(orchestrator as any, 'processObservationUniverse').mockResolvedValue(25);

      // Act
      const result = await orchestrator.executeWorkflow();

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Core universe processing failed');
      expect(result.observationUniverseProcessed).toBe(25);
    });
  });

  describe('processCoreUniverse', () => {
    it('should process core universe stocks', async () => {
      // Arrange
      const mockStocks = [
        { symbol: '000001.SZ', name: '平安银行', market_cap: 1000000000 },
        { symbol: '000002.SZ', name: '万科A', market_cap: 2000000000 }
      ];
      mockDatabase.query.mockResolvedValue({ rows: mockStocks });

      // Act
      const result = await (orchestrator as any).processCoreUniverse();

      // Assert
      expect(result).toBe(2);
      expect(mockLogger.log).toHaveBeenCalledWith('开始处理核心股票宇宙');
    });

    it('should respect max size limit', async () => {
      // Arrange
      const config = { ...mockWorkflowConfig, coreUniverseMaxSize: 1 };
      jest.spyOn(orchestrator as any, 'getWorkflowConfig').mockResolvedValue(config);
      
      const mockStocks = [
        { symbol: '000001.SZ', name: '平安银行' },
        { symbol: '000002.SZ', name: '万科A' }
      ];
      mockDatabase.query.mockResolvedValue({ rows: mockStocks });

      // Act
      const result = await (orchestrator as any).processCoreUniverse();

      // Assert
      expect(result).toBe(1);
    });
  });

  describe('processObservationUniverse', () => {
    it('should process observation universe stocks', async () => {
      // Arrange
      const mockStocks = [
        { symbol: '600000.SH', name: '浦发银行', market_cap: 500000000 },
        { symbol: '600036.SH', name: '招商银行', market_cap: 800000000 }
      ];
      mockDatabase.query.mockResolvedValue({ rows: mockStocks });

      // Act
      const result = await (orchestrator as any).processObservationUniverse();

      // Assert
      expect(result).toBe(2);
      expect(mockLogger.log).toHaveBeenCalledWith('开始处理观察股票宇宙');
    });
  });

  describe('promoteStocks', () => {
    it('should promote stocks from observation to core universe', async () => {
      // Arrange
      const mockPromotionCandidates = [
        { symbol: '600000.SH', score: 85 },
        { symbol: '600036.SH', score: 90 }
      ];
      mockDatabase.query.mockResolvedValue({ rows: mockPromotionCandidates });

      // Act
      const result = await (orchestrator as any).promoteStocks();

      // Assert
      expect(result).toBe(2);
      expect(mockLogger.log).toHaveBeenCalledWith('开始股票晋升检查');
    });

    it('should respect promotion criteria', async () => {
      // Arrange
      const mockPromotionCandidates = [
        { symbol: '600000.SH', score: 60 }, // 低于晋升标准
        { symbol: '600036.SH', score: 90 }  // 高于晋升标准
      ];
      mockDatabase.query.mockResolvedValue({ rows: mockPromotionCandidates });

      // Act
      const result = await (orchestrator as any).promoteStocks();

      // Assert
      expect(result).toBe(1); // 只有高分股票被晋升
    });
  });

  describe('demoteStocks', () => {
    it('should demote stocks from core to observation universe', async () => {
      // Arrange
      const mockDemotionCandidates = [
        { symbol: '000001.SZ', score: 30 },
        { symbol: '000002.SZ', score: 25 }
      ];
      mockDatabase.query.mockResolvedValue({ rows: mockDemotionCandidates });

      // Act
      const result = await (orchestrator as any).demoteStocks();

      // Assert
      expect(result).toBe(2);
      expect(mockLogger.log).toHaveBeenCalledWith('开始股票降级检查');
    });
  });

  describe('getWorkflowConfig', () => {
    it('should return workflow configuration', async () => {
      // Arrange
      mockDatabase.query.mockResolvedValue({ rows: [mockWorkflowConfig] });

      // Act
      const result = await (orchestrator as any).getWorkflowConfig();

      // Assert
      expect(result).toEqual(mockWorkflowConfig);
    });

    it('should return default config when database query fails', async () => {
      // Arrange
      mockDatabase.query.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await (orchestrator as any).getWorkflowConfig();

      // Assert
      expect(result).toBeDefined();
      expect(result.enableCoreUniverse).toBe(true);
    });
  });

  describe('validateWorkflowConfig', () => {
    it('should validate correct workflow config', () => {
      // Act
      const isValid = (orchestrator as any).validateWorkflowConfig(mockWorkflowConfig);

      // Assert
      expect(isValid).toBe(true);
    });

    it('should reject invalid workflow config', () => {
      // Arrange
      const invalidConfig = {
        ...mockWorkflowConfig,
        coreUniverseMaxSize: -1 // 无效值
      };

      // Act
      const isValid = (orchestrator as any).validateWorkflowConfig(invalidConfig);

      // Assert
      expect(isValid).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should log errors and continue execution', async () => {
      // Arrange
      jest.spyOn(orchestrator as any, 'processCoreUniverse').mockRejectedValue(new Error('Processing error'));

      // Act
      const result = await orchestrator.executeWorkflow();

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Processing error');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should collect multiple errors', async () => {
      // Arrange
      jest.spyOn(orchestrator as any, 'processCoreUniverse').mockRejectedValue(new Error('Error 1'));
      jest.spyOn(orchestrator as any, 'processObservationUniverse').mockRejectedValue(new Error('Error 2'));

      // Act
      const result = await orchestrator.executeWorkflow();

      // Assert
      expect(result.errors).toHaveLength(2);
      expect(result.errors).toContain('Error 1');
      expect(result.errors).toContain('Error 2');
    });
  });
});

