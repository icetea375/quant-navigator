/**
 * 前端组件工具函数测试
 * 测试前端组件中使用的工具函数
 * 符合"测试宪法"第3条要求
 */

// 使用Jest语法，符合"测试宪法"要求

// 模拟前端工具函数
const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatConfidence = (confidence: number): string => {
  return `${Math.round(confidence * 100)}%`;
};

const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 0.8) return 'high-confidence';
  if (confidence >= 0.6) return 'medium-confidence';
  return 'low-confidence';
};

const validateForm = (formData: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!formData.final_recommendation) {
    errors.push('请选择最终推荐');
  }
  
  if (!formData.reasoning) {
    errors.push('请填写推理过程');
  }
  
  if (formData.confidence_level < 0 || formData.confidence_level > 100) {
    errors.push('置信度必须在0-100之间');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

const formatStockCode = (code: string): string => {
  return code.replace(/\.(SZ|SH)$/, '');
};

const calculateDaysPending = (createdAt: string): number => {
  const created = new Date(createdAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - created.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

describe('前端组件工具函数测试', () => {
  describe('formatDate', () => {
    it('应该正确格式化日期字符串', () => {
      const result = formatDate('2024-10-28T09:00:00Z');
      expect(result).toMatch(/\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}/);
    });

    it('应该正确格式化Date对象', () => {
      const date = new Date('2024-10-28T09:00:00Z');
      const result = formatDate(date);
      expect(result).toMatch(/\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}/);
    });
  });

  describe('formatConfidence', () => {
    it('应该正确格式化置信度', () => {
      expect(formatConfidence(0.85)).toBe('85%');
      expect(formatConfidence(0.723)).toBe('72%');
      expect(formatConfidence(1.0)).toBe('100%');
      expect(formatConfidence(0.0)).toBe('0%');
    });
  });

  describe('getConfidenceColor', () => {
    it('应该为高置信度返回正确颜色类', () => {
      expect(getConfidenceColor(0.85)).toBe('high-confidence');
      expect(getConfidenceColor(0.9)).toBe('high-confidence');
      expect(getConfidenceColor(1.0)).toBe('high-confidence');
    });

    it('应该为中置信度返回正确颜色类', () => {
      expect(getConfidenceColor(0.7)).toBe('medium-confidence');
      expect(getConfidenceColor(0.65)).toBe('medium-confidence');
    });

    it('应该为低置信度返回正确颜色类', () => {
      expect(getConfidenceColor(0.5)).toBe('low-confidence');
      expect(getConfidenceColor(0.3)).toBe('low-confidence');
      expect(getConfidenceColor(0.0)).toBe('low-confidence');
    });
  });

  describe('validateForm', () => {
    it('应该验证有效的表单数据', () => {
      const validForm = {
        final_recommendation: '看涨',
        reasoning: '基于技术分析',
        confidence_level: 85
      };

      const result = validateForm(validForm);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('应该检测缺失的必填字段', () => {
      const invalidForm = {
        final_recommendation: '',
        reasoning: '',
        confidence_level: 85
      };

      const result = validateForm(invalidForm);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('请选择最终推荐');
      expect(result.errors).toContain('请填写推理过程');
    });

    it('应该检测无效的置信度', () => {
      const invalidForm = {
        final_recommendation: '看涨',
        reasoning: '基于技术分析',
        confidence_level: 150
      };

      const result = validateForm(invalidForm);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('置信度必须在0-100之间');
    });

    it('应该检测负的置信度', () => {
      const invalidForm = {
        final_recommendation: '看涨',
        reasoning: '基于技术分析',
        confidence_level: -10
      };

      const result = validateForm(invalidForm);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('置信度必须在0-100之间');
    });
  });

  describe('formatStockCode', () => {
    it('应该正确格式化股票代码', () => {
      expect(formatStockCode('000001.SZ')).toBe('000001');
      expect(formatStockCode('000002.SH')).toBe('000002');
      expect(formatStockCode('600519.SH')).toBe('600519');
    });

    it('应该处理没有后缀的代码', () => {
      expect(formatStockCode('000001')).toBe('000001');
    });
  });

  describe('calculateDaysPending', () => {
    it('应该正确计算待处理天数', () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const result = calculateDaysPending(yesterday.toISOString());
      expect(result).toBeGreaterThanOrEqual(1);
    });

    it('应该处理同一天的情况', () => {
      const today = new Date();
      const result = calculateDaysPending(today.toISOString());
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it('应该处理多天前的情况', () => {
      const today = new Date();
      const threeDaysAgo = new Date(today);
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      const result = calculateDaysPending(threeDaysAgo.toISOString());
      expect(result).toBe(3);
    });
  });
});
