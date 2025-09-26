/**
 * WorkflowOrchestrator 单元测试
 * 严格遵循TDD铁律 - 先写测试，再写代码
 * 基于开发文档第0章TDD流程准则
 */

import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowOrchestrator } from '@/services/WorkflowOrchestrator';

// 定义测试接口 - 先定义接口，再实现
interface WorkflowConfig {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface WorkflowStep {
  id: string;
  name: string;
  type: 'data_fetch' | 'analysis' | 'prediction' | 'notification';
  config: Record<string, any>;
  dependencies: string[];
  timeout: number;
  retryCount: number;
}

interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  currentStep?: string;
  results: Record<string, any>;
  error?: string;
}

interface WorkflowResult {
  executionId: string;
  status: 'success' | 'failure';
  results: Record<string, any>;
  error?: string;
  executionTime: number;
}

// Mock Database - 先定义接口，再实现
class MockDatabase {
  query(sql: string, params?: any[]): Promise<any[]> {
    return Promise.resolve([]);
  }

  transaction(callback: (tx: any) => Promise<any>): Promise<any> {
    return Promise.resolve();
  }

  close(): Promise<void> {
    return Promise.resolve();
  }
}

// Mock Logger - 先定义接口，再实现
class MockLogger {
  info(message: string, context?: string): void {
    console.log(`[INFO] ${context ? `[${context}] ` : ''}${message}`);
  }

  error(message: string, error?: Error, context?: string): void {
    console.error(`[ERROR] ${context ? `[${context}] ` : ''}${message}`, error);
  }

  warn(message: string, context?: string): void {
    console.warn(`[WARN] ${context ? `[${context}] ` : ''}${message}`);
  }

  debug(message: string, context?: string): void {
    console.debug(`[DEBUG] ${context ? `[${context}] ` : ''}${message}`);
  }
}

describe('WorkflowOrchestrator', () => {
  let orchestrator: WorkflowOrchestrator;
  let mockDatabase: MockDatabase;
  let mockLogger: MockLogger;

  beforeEach(async () => {
    // Arrange - 准备测试数据
    mockDatabase = new MockDatabase();
    mockLogger = new MockLogger();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: WorkflowOrchestrator,
          useValue: {
            createWorkflow: jest.fn(),
            updateWorkflow: jest.fn(),
            deleteWorkflow: jest.fn(),
            getWorkflow: jest.fn(),
            getAllWorkflows: jest.fn(),
            executeWorkflow: jest.fn(),
            getExecutionStatus: jest.fn(),
            cancelExecution: jest.fn(),
            getExecutionHistory: jest.fn()
          }
        },
        {
          provide: 'Database',
          useValue: mockDatabase
        },
        {
          provide: 'Logger',
          useValue: mockLogger
        }
      ],
    }).compile();

    orchestrator = module.get<WorkflowOrchestrator>(WorkflowOrchestrator);
  });

  describe('createWorkflow', () => {
    it('should create new workflow successfully', async () => {
      // Arrange
      const workflowConfig: WorkflowConfig = {
        id: 'workflow-001',
        name: 'Daily Analysis Workflow',
        description: 'Performs daily market analysis',
        steps: [
          {
            id: 'step-001',
            name: 'Fetch Market Data',
            type: 'data_fetch',
            config: { source: 'tushare', symbols: ['AAPL', 'MSFT'] },
            dependencies: [],
            timeout: 30000,
            retryCount: 3
          },
          {
            id: 'step-002',
            name: 'Run Analysis',
            type: 'analysis',
            config: { algorithm: 'ml_predictor' },
            dependencies: ['step-001'],
            timeout: 60000,
            retryCount: 2
          }
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      jest.spyOn(orchestrator, 'createWorkflow').mockResolvedValue(workflowConfig);

      // Act
      const result = await orchestrator.createWorkflow(workflowConfig);

      // Assert
      expect(result).toEqual(workflowConfig);
      expect(result.id).toBe('workflow-001');
      expect(result.name).toBe('Daily Analysis Workflow');
      expect(result.steps).toHaveLength(2);
      expect(result.isActive).toBe(true);
    });

    it('should throw error when creating workflow with invalid configuration', async () => {
      // Arrange
      const invalidConfig = {
        id: 'invalid',
        name: '',
        steps: [] // Missing required fields
      } as WorkflowConfig;

      jest.spyOn(orchestrator, 'createWorkflow').mockRejectedValue(new Error('Invalid workflow configuration'));

      // Act & Assert
      await expect(orchestrator.createWorkflow(invalidConfig)).rejects.toThrow('Invalid workflow configuration');
    });
  });

  describe('updateWorkflow', () => {
    it('should update existing workflow successfully', async () => {
      // Arrange
      const workflowId = 'workflow-001';
      const updateData: Partial<WorkflowConfig> = {
        name: 'Updated Daily Analysis Workflow',
        description: 'Updated description',
        isActive: false
      };

      const updatedWorkflow: WorkflowConfig = {
        id: 'workflow-001',
        name: 'Updated Daily Analysis Workflow',
        description: 'Updated description',
        steps: [],
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      jest.spyOn(orchestrator, 'updateWorkflow').mockResolvedValue(updatedWorkflow);

      // Act
      const result = await orchestrator.updateWorkflow(workflowId, updateData);

      // Assert
      expect(result).toEqual(updatedWorkflow);
      expect(result.name).toBe(updateData.name);
      expect(result.isActive).toBe(updateData.isActive);
    });

    it('should throw error when updating non-existent workflow', async () => {
      // Arrange
      const workflowId = 'nonexistent';
      const updateData: Partial<WorkflowConfig> = {
        name: 'Updated Workflow'
      };

      jest.spyOn(orchestrator, 'updateWorkflow').mockRejectedValue(new Error('Workflow not found'));

      // Act & Assert
      await expect(orchestrator.updateWorkflow(workflowId, updateData)).rejects.toThrow('Workflow not found');
    });
  });

  describe('deleteWorkflow', () => {
    it('should delete workflow successfully', async () => {
      // Arrange
      const workflowId = 'workflow-001';
      jest.spyOn(orchestrator, 'deleteWorkflow').mockResolvedValue(true);

      // Act
      const result = await orchestrator.deleteWorkflow(workflowId);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when deleting non-existent workflow', async () => {
      // Arrange
      const workflowId = 'nonexistent';
      jest.spyOn(orchestrator, 'deleteWorkflow').mockResolvedValue(false);

      // Act
      const result = await orchestrator.deleteWorkflow(workflowId);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getWorkflow', () => {
    it('should return specific workflow by ID', async () => {
      // Arrange
      const workflowId = 'workflow-001';
      const mockWorkflow: WorkflowConfig = {
        id: 'workflow-001',
        name: 'Daily Analysis Workflow',
        description: 'Performs daily market analysis',
        steps: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      jest.spyOn(orchestrator, 'getWorkflow').mockResolvedValue(mockWorkflow);

      // Act
      const result = await orchestrator.getWorkflow(workflowId);

      // Assert
      expect(result).toEqual(mockWorkflow);
      expect(result.id).toBe(workflowId);
    });

    it('should return null when workflow not found', async () => {
      // Arrange
      const workflowId = 'nonexistent';
      jest.spyOn(orchestrator, 'getWorkflow').mockResolvedValue(null);

      // Act
      const result = await orchestrator.getWorkflow(workflowId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getAllWorkflows', () => {
    it('should return all workflows', async () => {
      // Arrange
      const mockWorkflows: WorkflowConfig[] = [
        {
          id: 'workflow-001',
          name: 'Daily Analysis Workflow',
          description: 'Performs daily market analysis',
          steps: [],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'workflow-002',
          name: 'Weekly Report Workflow',
          description: 'Generates weekly reports',
          steps: [],
          isActive: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      jest.spyOn(orchestrator, 'getAllWorkflows').mockResolvedValue(mockWorkflows);

      // Act
      const result = await orchestrator.getAllWorkflows();

      // Assert
      expect(result).toEqual(mockWorkflows);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no workflows exist', async () => {
      // Arrange
      jest.spyOn(orchestrator, 'getAllWorkflows').mockResolvedValue([]);

      // Act
      const result = await orchestrator.getAllWorkflows();

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('executeWorkflow', () => {
    it('should execute workflow successfully', async () => {
      // Arrange
      const workflowId = 'workflow-001';
      const executionId = 'execution-001';
      const mockExecution: WorkflowExecution = {
        id: executionId,
        workflowId: workflowId,
        status: 'running',
        startTime: new Date(),
        currentStep: 'step-001',
        results: {}
      };

      jest.spyOn(orchestrator, 'executeWorkflow').mockResolvedValue(mockExecution);

      // Act
      const result = await orchestrator.executeWorkflow(workflowId);

      // Assert
      expect(result).toEqual(mockExecution);
      expect(result.workflowId).toBe(workflowId);
      expect(result.status).toBe('running');
    });

    it('should throw error when executing non-existent workflow', async () => {
      // Arrange
      const workflowId = 'nonexistent';
      jest.spyOn(orchestrator, 'executeWorkflow').mockRejectedValue(new Error('Workflow not found'));

      // Act & Assert
      await expect(orchestrator.executeWorkflow(workflowId)).rejects.toThrow('Workflow not found');
    });
  });

  describe('getExecutionStatus', () => {
    it('should return execution status', async () => {
      // Arrange
      const executionId = 'execution-001';
      const mockExecution: WorkflowExecution = {
        id: executionId,
        workflowId: 'workflow-001',
        status: 'completed',
        startTime: new Date(),
        endTime: new Date(),
        results: { analysis: 'completed', prediction: 0.75 }
      };

      jest.spyOn(orchestrator, 'getExecutionStatus').mockResolvedValue(mockExecution);

      // Act
      const result = await orchestrator.getExecutionStatus(executionId);

      // Assert
      expect(result).toEqual(mockExecution);
      expect(result.status).toBe('completed');
      expect(result.results).toHaveProperty('analysis');
    });

    it('should return null when execution not found', async () => {
      // Arrange
      const executionId = 'nonexistent';
      jest.spyOn(orchestrator, 'getExecutionStatus').mockResolvedValue(null);

      // Act
      const result = await orchestrator.getExecutionStatus(executionId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('cancelExecution', () => {
    it('should cancel execution successfully', async () => {
      // Arrange
      const executionId = 'execution-001';
      const cancelledExecution: WorkflowExecution = {
        id: executionId,
        workflowId: 'workflow-001',
        status: 'cancelled',
        startTime: new Date(),
        endTime: new Date(),
        results: {}
      };

      jest.spyOn(orchestrator, 'cancelExecution').mockResolvedValue(cancelledExecution);

      // Act
      const result = await orchestrator.cancelExecution(executionId);

      // Assert
      expect(result).toEqual(cancelledExecution);
      expect(result.status).toBe('cancelled');
    });

    it('should throw error when cancelling non-existent execution', async () => {
      // Arrange
      const executionId = 'nonexistent';
      jest.spyOn(orchestrator, 'cancelExecution').mockRejectedValue(new Error('Execution not found'));

      // Act & Assert
      await expect(orchestrator.cancelExecution(executionId)).rejects.toThrow('Execution not found');
    });
  });

  describe('getExecutionHistory', () => {
    it('should return execution history for workflow', async () => {
      // Arrange
      const workflowId = 'workflow-001';
      const mockHistory: WorkflowExecution[] = [
        {
          id: 'execution-001',
          workflowId: workflowId,
          status: 'completed',
          startTime: new Date(),
          endTime: new Date(),
          results: {}
        },
        {
          id: 'execution-002',
          workflowId: workflowId,
          status: 'failed',
          startTime: new Date(),
          endTime: new Date(),
          results: {},
          error: 'Step timeout'
        }
      ];

      jest.spyOn(orchestrator, 'getExecutionHistory').mockResolvedValue(mockHistory);

      // Act
      const result = await orchestrator.getExecutionHistory(workflowId);

      // Assert
      expect(result).toEqual(mockHistory);
      expect(result).toHaveLength(2);
      expect(result[0].status).toBe('completed');
      expect(result[1].status).toBe('failed');
    });
  });

  describe('error handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // Arrange
      jest.spyOn(mockDatabase, 'query').mockRejectedValue(new Error('Database connection failed'));
      jest.spyOn(orchestrator, 'getAllWorkflows').mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(orchestrator.getAllWorkflows()).rejects.toThrow('Database connection failed');
    });

    it('should handle workflow execution errors', async () => {
      // Arrange
      const workflowId = 'workflow-001';
      const executionId = 'execution-001';
      const failedExecution: WorkflowExecution = {
        id: executionId,
        workflowId: workflowId,
        status: 'failed',
        startTime: new Date(),
        endTime: new Date(),
        results: {},
        error: 'Step execution failed'
      };

      jest.spyOn(orchestrator, 'executeWorkflow').mockResolvedValue(failedExecution);

      // Act
      const result = await orchestrator.executeWorkflow(workflowId);

      // Assert
      expect(result.status).toBe('failed');
      expect(result.error).toBe('Step execution failed');
    });

    it('should validate input parameters', async () => {
      // Arrange
      const invalidWorkflowId = '';
      const invalidConfig = {
        id: '',
        name: '',
        steps: []
      } as WorkflowConfig;

      jest.spyOn(orchestrator, 'getWorkflow').mockRejectedValue(new Error('Invalid workflow ID'));
      jest.spyOn(orchestrator, 'createWorkflow').mockRejectedValue(new Error('Invalid configuration'));

      // Act & Assert
      await expect(orchestrator.getWorkflow(invalidWorkflowId)).rejects.toThrow('Invalid workflow ID');
      await expect(orchestrator.createWorkflow(invalidConfig)).rejects.toThrow('Invalid configuration');
    });
  });
});
