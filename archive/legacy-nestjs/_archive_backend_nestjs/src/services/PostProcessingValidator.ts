import { z } from 'zod';
import { LLMServiceManager } from './llm';

/**
 * 验证结果接口
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  repairedData?: any;
}

/**
 * 验证错误接口
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
  expected?: any;
}

/**
 * 验证警告接口
 */
export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

/**
 * 业务规则验证结果
 */
export interface BusinessRuleResult {
  isValid: boolean;
  violations: BusinessRuleViolation[];
}

/**
 * 业务规则违反
 */
export interface BusinessRuleViolation {
  rule: string;
  message: string;
  value: any;
  expected?: any;
}

/**
 * LLM响应格式错误
 */
export class LlmResponseFormatError extends Error {
  constructor(message: string, public originalResponse?: string) {
    super(message);
    this.name = 'LlmResponseFormatError';
  }
}

/**
 * LLM响应验证错误
 */
export class LlmResponseValidationError extends Error {
  constructor(
    message: string,
    public validationErrors: ValidationError[]
  ) {
    super(message);
    this.name = 'LlmResponseValidationError';
  }
}

/**
 * LLM低置信度错误
 */
export class LlmLowConfidenceError extends Error {
  constructor(
    message: string,
    public confidenceScore: number,
    public threshold: number
  ) {
    super(message);
    this.name = 'LlmLowConfidenceError';
  }
}

/**
 * 后处理验证器
 *
 * 职责：
 * 1. 格式校验: 检查返回的是否是合法的JSON
 * 2. 模式校验: 检查JSON的字段、类型是否完全符合Schema
 * 3. 业务规则校验: 检查概率之和是否为1，分数是否在0-10之间等
 * 4. 置信度过滤: 如果LLM返回的confidence_score低于阈值，直接拒绝
 * 5. JSON修复: 尝试修复格式错误的JSON（只尝试一次）
 */
export class PostProcessingValidator {
  private llmService: LLMServiceManager;
  private repairAttempts: Map<string, number> = new Map();
  private readonly MAX_REPAIR_ATTEMPTS = 1;

  constructor(llmService: LLMServiceManager) {
    this.llmService = llmService;
  }

  /**
   * 验证LLM响应
   */
  async validateResponse(
    response: string,
    schema: z.ZodSchema,
    taskType: string,
    confidenceThreshold: number = 0.6
  ): Promise<ValidationResult> {
    const taskKey = `${taskType}_${Date.now()}`;

    try {
      // 1. 尝试解析JSON
      let data = this.tryParseJSON(response);

      // 2. 如果解析失败，尝试修复一次
      if (!data) {
        console.log(`🔧 JSON解析失败，尝试修复: ${taskType}`);
        const repairedResponse = await this.repairJSON(response, taskKey);
        data = this.tryParseJSON(repairedResponse);

        if (!data) {
          throw new LlmResponseFormatError(
            'Failed to parse or repair JSON response',
            response
          );
        }
      }

      // 3. Schema验证
      const schemaResult = this.validateSchema(data, schema);
      if (!schemaResult.isValid) {
        throw new LlmResponseValidationError(
          'Schema validation failed',
          schemaResult.errors
        );
      }

      // 4. 业务规则验证
      const businessResult = this.validateBusinessRules(data, taskType);
      if (!businessResult.isValid) {
        throw new LlmResponseValidationError(
          'Business rules validation failed',
          businessResult.violations.map(v => ({
            field: v.rule,
            message: v.message,
            code: 'BUSINESS_RULE_VIOLATION',
            value: v.value,
            expected: v.expected
          }))
        );
      }

      // 5. 置信度过滤
      if (!this.validateConfidence(data, confidenceThreshold)) {
        const confidenceScore = this.extractConfidenceScore(data);
        throw new LlmLowConfidenceError(
          'LLM confidence is below threshold',
          confidenceScore,
          confidenceThreshold
        );
      }

      // 6. 清理修复尝试记录
      this.repairAttempts.delete(taskKey);

      return {
        isValid: true,
        errors: [],
        warnings: schemaResult.warnings,
        repairedData: data
      };

    } catch (error) {
      // 清理修复尝试记录
      this.repairAttempts.delete(taskKey);
      throw error;
    }
  }

  /**
   * 尝试解析JSON
   */
  private tryParseJSON(response: string): any | null {
    try {
      // 尝试直接解析
      return JSON.parse(response);
    } catch (error) {
      // 尝试从响应中提取JSON
      const jsonMatch = response.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (e) {
          return null;
        }
      }
      return null;
    }
  }

  /**
   * 修复JSON（只尝试一次）
   */
  private async repairJSON(response: string, taskKey: string): Promise<string> {
    const attempts = this.repairAttempts.get(taskKey) || 0;

    if (attempts >= this.MAX_REPAIR_ATTEMPTS) {
      throw new LlmResponseFormatError('Max repair attempts exceeded');
    }

    this.repairAttempts.set(taskKey, attempts + 1);

    try {
      // 使用廉价模型进行修复
      const repairPrompt = `以下是一段可能被截断或格式错误的JSON文本。请尽你所能将其修复成一个语法正确的、完整的JSON对象。不要添加任何不存在的数据。如果无法修复，请直接返回一个 {"error": "unrepairable"} 对象。

原始文本：
${response}

修复后的JSON：`;

      const repairResponse = await this.llmService.callLLMWithUnifiedConfig(
        repairPrompt,
        'fast_processing', // 使用快速处理任务类型
        {
          maxTokens: 2000,
          temperature: 0.1 // 低温度确保稳定性
        }
      );

      return repairResponse.content;
    } catch (error) {
      console.error('JSON修复失败:', error);
      throw new LlmResponseFormatError('Failed to repair JSON');
    }
  }

  /**
   * Schema验证
   */
  private validateSchema(data: any, schema: z.ZodSchema): ValidationResult {
    try {
      const result = schema.safeParse(data);

      if (result.success) {
        return {
          isValid: true,
          errors: [],
          warnings: []
        };
      } else {
        const errors: ValidationError[] = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
          value: err.input,
          expected: err.expected
        }));

        return {
          isValid: false,
          errors,
          warnings: []
        };
      }
    } catch (error) {
      return {
        isValid: false,
        errors: [{
          field: 'root',
          message: 'Schema validation failed',
          code: 'SCHEMA_ERROR'
        }],
        warnings: []
      };
    }
  }

  /**
   * 业务规则验证
   */
  private validateBusinessRules(data: any, taskType: string): BusinessRuleResult {
    const violations: BusinessRuleViolation[] = [];

    try {
      switch (taskType) {
        case 'prediction_generation':
          this.validatePredictionRules(data, violations);
          break;
        case 'mda_verification':
          this.validateMdaRules(data, violations);
          break;
        case 'counterfactual_validation':
          this.validateCounterfactualRules(data, violations);
          break;
        case 'event_chain_building':
          this.validateEventChainRules(data, violations);
          break;
        default:
          // 通用规则验证
          this.validateGeneralRules(data, violations);
      }

      return {
        isValid: violations.length === 0,
        violations
      };
    } catch (error) {
      return {
        isValid: false,
        violations: [{
          rule: 'business_validation',
          message: 'Business rules validation failed',
          value: data
        }]
      };
    }
  }

  /**
   * 验证预测规则
   */
  private validatePredictionRules(data: any, violations: BusinessRuleViolation[]): void {
    // 检查概率之和是否为1
    if (data.probabilities) {
      const { optimistic, neutral, pessimistic } = data.probabilities;
      const sum = (optimistic || 0) + (neutral || 0) + (pessimistic || 0);
      const tolerance = 0.001; // 允许小的浮点误差

      if (Math.abs(sum - 1.0) > tolerance) {
        violations.push({
          rule: 'probability_sum',
          message: `概率之和必须等于1.0，当前为${sum}`,
          value: sum,
          expected: 1.0
        });
      }
    }

    // 检查置信度分数范围
    if (data.confidence_score !== undefined) {
      if (data.confidence_score < 0 || data.confidence_score > 1) {
        violations.push({
          rule: 'confidence_score_range',
          message: '置信度分数必须在0-1之间',
          value: data.confidence_score,
          expected: '0-1'
        });
      }
    }
  }

  /**
   * 验证MD&A规则
   */
  private validateMdaRules(data: any, violations: BusinessRuleViolation[]): void {
    // 检查数组格式
    if (!Array.isArray(data)) {
      violations.push({
        rule: 'array_format',
        message: 'MD&A验证结果必须是数组格式',
        value: typeof data,
        expected: 'array'
      });
    }

    // 检查每个承诺的置信度
    if (Array.isArray(data)) {
      data.forEach((item, index) => {
        if (item.confidence !== undefined) {
          if (item.confidence < 0 || item.confidence > 1) {
            violations.push({
              rule: `confidence_range_${index}`,
              message: `承诺${index}的置信度必须在0-1之间`,
              value: item.confidence,
              expected: '0-1'
            });
          }
        }
      });
    }
  }

  /**
   * 验证反事实验证规则
   */
  private validateCounterfactualRules(data: any, violations: BusinessRuleViolation[]): void {
    // 检查数组格式
    if (!Array.isArray(data)) {
      violations.push({
        rule: 'array_format',
        message: '反事实验证结果必须是数组格式',
        value: typeof data,
        expected: 'array'
      });
    }

    // 检查每个风险因素的概率枚举
    if (Array.isArray(data)) {
      data.forEach((item, index) => {
        if (item.likelihood && !['高', '中', '低'].includes(item.likelihood)) {
          violations.push({
            rule: `likelihood_enum_${index}`,
            message: `风险因素${index}的可能性必须是"高"、"中"或"低"`,
            value: item.likelihood,
            expected: '["高", "中", "低"]'
          });
        }
      });
    }
  }

  /**
   * 验证事件链规则
   */
  private validateEventChainRules(data: any, violations: BusinessRuleViolation[]): void {
    // 检查数组格式
    if (!Array.isArray(data)) {
      violations.push({
        rule: 'array_format',
        message: '事件链结果必须是数组格式',
        value: typeof data,
        expected: 'array'
      });
    }

    // 检查时间顺序
    if (Array.isArray(data) && data.length > 1) {
      for (let i = 1; i < data.length; i++) {
        const prevDate = new Date(data[i-1].date);
        const currDate = new Date(data[i].date);

        if (currDate < prevDate) {
          violations.push({
            rule: 'date_order',
            message: `事件${i}的日期不能早于事件${i-1}`,
            value: data[i].date,
            expected: `> ${data[i-1].date}`
          });
        }
      }
    }
  }

  /**
   * 验证通用规则
   */
  private validateGeneralRules(data: any, violations: BusinessRuleViolation[]): void {
    // 检查置信度分数
    if (data.confidence_score !== undefined) {
      if (data.confidence_score < 0 || data.confidence_score > 1) {
        violations.push({
          rule: 'confidence_score_range',
          message: '置信度分数必须在0-1之间',
          value: data.confidence_score,
          expected: '0-1'
        });
      }
    }
  }

  /**
   * 验证置信度
   */
  private validateConfidence(data: any, threshold: number): boolean {
    const confidenceScore = this.extractConfidenceScore(data);
    return confidenceScore >= threshold;
  }

  /**
   * 提取置信度分数
   */
  public extractConfidenceScore(data: any): number {
    // 尝试多种可能的置信度字段名
    const confidenceFields = ['confidence_score', 'confidence', 'confidenceLevel', 'certainty'];

    for (const field of confidenceFields) {
      if (data[field] !== undefined) {
        const score = typeof data[field] === 'number' ? data[field] :
                     typeof data[field] === 'string' ? parseFloat(data[field]) : 0;
        return isNaN(score) ? 0 : score;
      }
    }

    // 如果没有找到置信度字段，返回默认值
    return 0.5;
  }

  /**
   * 获取任务类型的Schema
   */
  getSchemaForTaskType(taskType: string): z.ZodSchema {
    switch (taskType) {
      case 'prediction_generation':
        return this.getPredictionSchema();
      case 'mda_verification':
        return this.getMdaVerificationSchema();
      case 'counterfactual_validation':
        return this.getCounterfactualValidationSchema();
      case 'event_chain_building':
        return this.getEventChainBuildingSchema();
      default:
        return z.any();
    }
  }

  /**
   * 获取预测生成Schema
   */
  private getPredictionSchema(): z.ZodSchema {
    return z.object({
      scenario_optimistic: z.object({
        return: z.number(),
        reasoning: z.string()
      }),
      scenario_neutral: z.object({
        return: z.number(),
        reasoning: z.string()
      }),
      scenario_pessimistic: z.object({
        return: z.number(),
        reasoning: z.string()
      }),
      probabilities: z.object({
        optimistic: z.number().min(0).max(1),
        neutral: z.number().min(0).max(1),
        pessimistic: z.number().min(0).max(1)
      }),
      key_drivers: z.object({
        positive: z.array(z.string()),
        negative: z.array(z.string())
      }),
      expected_return: z.number(),
      confidence_level: z.enum(['高', '中', '低']),
      confidence_score: z.number().min(0).max(1)
    });
  }

  /**
   * 获取MD&A验证Schema
   */
  private getMdaVerificationSchema(): z.ZodSchema {
    return z.array(z.object({
      promise_text: z.string(),
      promise_type: z.enum(['产能扩张', '市场拓展', '新品发布', '财务目标', '研发投入']),
      confidence: z.number().min(0).max(1)
    }));
  }

  /**
   * 获取反事实验证Schema
   */
  private getCounterfactualValidationSchema(): z.ZodSchema {
    return z.array(z.object({
      risk_factor: z.string(),
      likelihood: z.enum(['高', '中', '低'])
    }));
  }

  /**
   * 获取事件链构建Schema
   */
  private getEventChainBuildingSchema(): z.ZodSchema {
    return z.array(z.object({
      date: z.string(),
      event_description: z.string(),
      mda_strategy_link: z.string(),
      alignment_score: z.enum(['高', '中', '低']),
      causal_links: z.array(z.object({
        related_event_date: z.string(),
        relationship_type: z.string(),
        confidence: z.number().min(0).max(1)
      })).optional()
    }));
  }

  /**
   * 获取任务类型的置信度阈值
   */
  getConfidenceThresholdForTaskType(taskType: string): number {
    const thresholds: Record<string, number> = {
      'prediction_generation': 0.6,
      'mda_verification': 0.7,
      'counterfactual_validation': 0.5,
      'event_chain_building': 0.6,
      'default': 0.6
    };

    return thresholds[taskType] || thresholds.default;
  }
}
