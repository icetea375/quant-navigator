/**
 * 数据一致性检查服务
 * 检查三级体系数据的一致性和完整性
 *
 * 作者: AI Assistant
 * 创建时间: 2025-01-17
 * 版本: 1.0
 */

import { DatabaseConnection } from '../database/connection';
import { BaseErrorHandler } from '../utils/BaseErrorHandler';
import { SimpleMonitor } from './SimpleMonitor';

// 类型定义
interface ConsistencyIssue {
  id: string;
  type: 'orphaned_secondary_index' | 'orphaned_leading_stock' | 'invalid_etf_mapping' |
        'invalid_news_index_relation' | 'invalid_news_stock_relation' | 'missing_primary_index' |
        'duplicate_mapping' | 'invalid_confidence_score' | 'missing_relation_type';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedRecords: any[];
  suggestedFix?: string;
  autoFixable: boolean;
  createdAt: string;
}

interface ConsistencyReport {
  totalIssues: number;
  issuesByType: Record<string, number>;
  issuesBySeverity: Record<string, number>;
  autoFixableIssues: number;
  criticalIssues: number;
  issues: ConsistencyIssue[];
  generatedAt: string;
  duration: number;
}

interface FixResult {
  success: boolean;
  fixedIssues: number;
  failedIssues: number;
  errors: string[];
  details: {
    issueId: string;
    success: boolean;
    error?: string;
  }[];
}

export class SimpleDataConsistencyChecker {
  private db: DatabaseConnection;
  private monitor: SimpleMonitor;

  constructor(db: DatabaseConnection, monitor: SimpleMonitor) {
    this.db = db;
    this.monitor = monitor;
  }

  /**
   * 执行完整的数据一致性检查
   */
  async performFullCheck(): Promise<ConsistencyReport> {
    const startTime = Date.now();
    const issues: ConsistencyIssue[] = [];

    try {
      this.monitor.recordMetric('data_consistency_check_started', 1);

      // 1. 检查孤立的二级指数
      const orphanedSecondaryIssues = await this.checkOrphanedSecondaryIndices();
      issues.push(...orphanedSecondaryIssues);

      // 2. 检查孤立的龙头股
      const orphanedStockIssues = await this.checkOrphanedLeadingStocks();
      issues.push(...orphanedStockIssues);

      // 3. 检查无效的ETF映射
      const invalidEtfMappingIssues = await this.checkInvalidEtfMappings();
      issues.push(...invalidEtfMappingIssues);

      // 4. 检查无效的新闻-指数关联
      const invalidNewsIndexIssues = await this.checkInvalidNewsIndexRelations();
      issues.push(...invalidNewsIndexIssues);

      // 5. 检查无效的新闻-龙头股关联
      const invalidNewsStockIssues = await this.checkInvalidNewsStockRelations();
      issues.push(...invalidNewsStockIssues);

      // 6. 检查缺失的一级指数
      const missingPrimaryIndexIssues = await this.checkMissingPrimaryIndices();
      issues.push(...missingPrimaryIndexIssues);

      // 7. 检查重复映射
      const duplicateMappingIssues = await this.checkDuplicateMappings();
      issues.push(...duplicateMappingIssues);

      // 8. 检查无效的置信度分数
      const invalidConfidenceScoreIssues = await this.checkInvalidConfidenceScores();
      issues.push(...invalidConfidenceScoreIssues);

      // 9. 检查缺失的关联类型
      const missingRelationTypeIssues = await this.checkMissingRelationTypes();
      issues.push(...missingRelationTypeIssues);

      const duration = Date.now() - startTime;

      // 生成报告
      const report: ConsistencyReport = {
        totalIssues: issues.length,
        issuesByType: this.groupIssuesByType(issues),
        issuesBySeverity: this.groupIssuesBySeverity(issues),
        autoFixableIssues: issues.filter(issue => issue.autoFixable).length,
        criticalIssues: issues.filter(issue => issue.severity === 'critical').length,
        issues: issues,
        generatedAt: new Date().toISOString(),
        duration: duration
      };

      this.monitor.recordMetric('data_consistency_check_completed', 1, {
        total_issues: issues.length.toString(),
        duration: duration.toString()
      });

      return report;

    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleDataConsistencyChecker');
      this.monitor.recordMetric('data_consistency_check_error', 1);
      throw error;
    }
  }

  /**
   * 检查孤立的二级指数（引用了不存在的一级指数）
   */
  private async checkOrphanedSecondaryIndices(): Promise<ConsistencyIssue[]> {
    const issues: ConsistencyIssue[] = [];

    try {
      const query = `
        SELECT si.index_code, si.primary_index_code
        FROM secondary_indices si
        LEFT JOIN primary_indices pi ON si.primary_index_code = pi.index_code
        WHERE pi.index_code IS NULL
      `;

      const results = await this.db.query(query);

      for (const row of results) {
        issues.push({
          id: `orphaned_secondary_${row.index_code}`,
          type: 'orphaned_secondary_index',
          severity: 'high',
          description: `二级指数 '${row.index_code}' 引用了不存在的一级指数 '${row.primary_index_code}'`,
          affectedRecords: [row],
          suggestedFix: `删除二级指数 '${row.index_code}' 或创建对应的一级指数 '${row.primary_index_code}'`,
          autoFixable: false,
          createdAt: new Date().toISOString()
        });
      }

    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleDataConsistencyChecker.checkOrphanedSecondaryIndices');
    }

    return issues;
  }

  /**
   * 检查孤立的龙头股（引用了不存在的二级指数）
   */
  private async checkOrphanedLeadingStocks(): Promise<ConsistencyIssue[]> {
    const issues: ConsistencyIssue[] = [];

    try {
      const query = `
        SELECT ls.stock_code, ls.secondary_index_code
        FROM leading_stocks ls
        LEFT JOIN secondary_indices si ON ls.secondary_index_code = si.index_code
        WHERE si.index_code IS NULL
      `;

      const results = await this.db.query(query);

      for (const row of results) {
        issues.push({
          id: `orphaned_stock_${row.stock_code}`,
          type: 'orphaned_leading_stock',
          severity: 'high',
          description: `龙头股 '${row.stock_code}' 引用了不存在的二级指数 '${row.secondary_index_code}'`,
          affectedRecords: [row],
          suggestedFix: `删除龙头股 '${row.stock_code}' 或创建对应的二级指数 '${row.secondary_index_code}'`,
          autoFixable: false,
          createdAt: new Date().toISOString()
        });
      }

    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleDataConsistencyChecker.checkOrphanedLeadingStocks');
    }

    return issues;
  }

  /**
   * 检查无效的ETF映射（引用了不存在的指数）
   */
  private async checkInvalidEtfMappings(): Promise<ConsistencyIssue[]> {
    const issues: ConsistencyIssue[] = [];

    try {
      const query = `
        SELECT eim.etf_code, eim.index_code, eim.index_level
        FROM etf_index_mapping eim
        LEFT JOIN primary_indices pi ON eim.index_code = pi.index_code AND eim.index_level = 'primary'
        LEFT JOIN secondary_indices si ON eim.index_code = si.index_code AND eim.index_level = 'secondary'
        WHERE (pi.index_code IS NULL AND si.index_code IS NULL)
      `;

      const results = await this.db.query(query);

      for (const row of results) {
        issues.push({
          id: `invalid_etf_mapping_${row.etf_code}_${row.index_code}`,
          type: 'invalid_etf_mapping',
          severity: 'medium',
          description: `ETF '${row.etf_code}' 映射到不存在的${row.index_level}指数 '${row.index_code}'`,
          affectedRecords: [row],
          suggestedFix: `删除无效的ETF映射或创建对应的指数 '${row.index_code}'`,
          autoFixable: true,
          createdAt: new Date().toISOString()
        });
      }

    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleDataConsistencyChecker.checkInvalidEtfMappings');
    }

    return issues;
  }

  /**
   * 检查无效的新闻-指数关联
   */
  private async checkInvalidNewsIndexRelations(): Promise<ConsistencyIssue[]> {
    const issues: ConsistencyIssue[] = [];

    try {
      const query = `
        SELECT nir.news_id, nir.index_code, nir.index_level
        FROM news_index_relations nir
        LEFT JOIN primary_indices pi ON nir.index_code = pi.index_code AND nir.index_level = 'primary'
        LEFT JOIN secondary_indices si ON nir.index_code = si.index_code AND nir.index_level = 'secondary'
        WHERE (pi.index_code IS NULL AND si.index_code IS NULL)
      `;

      const results = await this.db.query(query);

      for (const row of results) {
        issues.push({
          id: `invalid_news_index_${row.news_id}_${row.index_code}`,
          type: 'invalid_news_index_relation',
          severity: 'medium',
          description: `新闻 '${row.news_id}' 关联到不存在的${row.index_level}指数 '${row.index_code}'`,
          affectedRecords: [row],
          suggestedFix: `删除无效的新闻-指数关联或创建对应的指数 '${row.index_code}'`,
          autoFixable: true,
          createdAt: new Date().toISOString()
        });
      }

    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleDataConsistencyChecker.checkInvalidNewsIndexRelations');
    }

    return issues;
  }

  /**
   * 检查无效的新闻-龙头股关联
   */
  private async checkInvalidNewsStockRelations(): Promise<ConsistencyIssue[]> {
    const issues: ConsistencyIssue[] = [];

    try {
      const query = `
        SELECT nsr.news_id, nsr.stock_code
        FROM news_stock_relations nsr
        LEFT JOIN leading_stocks ls ON nsr.stock_code = ls.stock_code
        WHERE ls.stock_code IS NULL
      `;

      const results = await this.db.query(query);

      for (const row of results) {
        issues.push({
          id: `invalid_news_stock_${row.news_id}_${row.stock_code}`,
          type: 'invalid_news_stock_relation',
          severity: 'medium',
          description: `新闻 '${row.news_id}' 关联到不存在的龙头股 '${row.stock_code}'`,
          affectedRecords: [row],
          suggestedFix: `删除无效的新闻-龙头股关联或创建对应的龙头股 '${row.stock_code}'`,
          autoFixable: true,
          createdAt: new Date().toISOString()
        });
      }

    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleDataConsistencyChecker.checkInvalidNewsStockRelations');
    }

    return issues;
  }

  /**
   * 检查缺失的一级指数
   */
  private async checkMissingPrimaryIndices(): Promise<ConsistencyIssue[]> {
    const issues: ConsistencyIssue[] = [];

    try {
      // 检查是否有二级指数引用了不存在的一级指数
      const query = `
        SELECT DISTINCT si.primary_index_code
        FROM secondary_indices si
        LEFT JOIN primary_indices pi ON si.primary_index_code = pi.index_code
        WHERE pi.index_code IS NULL
      `;

      const results = await this.db.query(query);

      for (const row of results) {
        issues.push({
          id: `missing_primary_index_${row.primary_index_code}`,
          type: 'missing_primary_index',
          severity: 'critical',
          description: `缺少一级指数 '${row.primary_index_code}'，但有二级指数引用了它`,
          affectedRecords: [row],
          suggestedFix: `创建一级指数 '${row.primary_index_code}' 或删除引用它的二级指数`,
          autoFixable: false,
          createdAt: new Date().toISOString()
        });
      }

    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleDataConsistencyChecker.checkMissingPrimaryIndices');
    }

    return issues;
  }

  /**
   * 检查重复映射
   */
  private async checkDuplicateMappings(): Promise<ConsistencyIssue[]> {
    const issues: ConsistencyIssue[] = [];

    try {
      // 检查重复的ETF映射
      const etfQuery = `
        SELECT etf_code, index_code, COUNT(*) as count
        FROM etf_index_mapping
        GROUP BY etf_code, index_code
        HAVING COUNT(*) > 1
      `;

      const etfResults = await this.db.query(etfQuery);

      for (const row of etfResults) {
        issues.push({
          id: `duplicate_etf_mapping_${row.etf_code}_${row.index_code}`,
          type: 'duplicate_mapping',
          severity: 'low',
          description: `ETF '${row.etf_code}' 到指数 '${row.index_code}' 的映射重复了 ${row.count} 次`,
          affectedRecords: [row],
          suggestedFix: `删除重复的ETF映射记录`,
          autoFixable: true,
          createdAt: new Date().toISOString()
        });
      }

    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleDataConsistencyChecker.checkDuplicateMappings');
    }

    return issues;
  }

  /**
   * 检查无效的置信度分数
   */
  private async checkInvalidConfidenceScores(): Promise<ConsistencyIssue[]> {
    const issues: ConsistencyIssue[] = [];

    try {
      // 检查新闻-指数关联的置信度分数
      const newsIndexQuery = `
        SELECT news_id, index_code, confidence_score
        FROM news_index_relations
        WHERE confidence_score < 0 OR confidence_score > 1
      `;

      const newsIndexResults = await this.db.query(newsIndexQuery);

      for (const row of newsIndexResults) {
        issues.push({
          id: `invalid_confidence_news_index_${row.news_id}_${row.index_code}`,
          type: 'invalid_confidence_score',
          severity: 'low',
          description: `新闻-指数关联的置信度分数 ${row.confidence_score} 超出有效范围 [0, 1]`,
          affectedRecords: [row],
          suggestedFix: `将置信度分数调整为有效范围内的值`,
          autoFixable: true,
          createdAt: new Date().toISOString()
        });
      }

      // 检查新闻-龙头股关联的置信度分数
      const newsStockQuery = `
        SELECT news_id, stock_code, confidence_score
        FROM news_stock_relations
        WHERE confidence_score < 0 OR confidence_score > 1
      `;

      const newsStockResults = await this.db.query(newsStockQuery);

      for (const row of newsStockResults) {
        issues.push({
          id: `invalid_confidence_news_stock_${row.news_id}_${row.stock_code}`,
          type: 'invalid_confidence_score',
          severity: 'low',
          description: `新闻-龙头股关联的置信度分数 ${row.confidence_score} 超出有效范围 [0, 1]`,
          affectedRecords: [row],
          suggestedFix: `将置信度分数调整为有效范围内的值`,
          autoFixable: true,
          createdAt: new Date().toISOString()
        });
      }

    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleDataConsistencyChecker.checkInvalidConfidenceScores');
    }

    return issues;
  }

  /**
   * 检查缺失的关联类型
   */
  private async checkMissingRelationTypes(): Promise<ConsistencyIssue[]> {
    const issues: ConsistencyIssue[] = [];

    try {
      // 检查新闻-指数关联的关联类型
      const newsIndexQuery = `
        SELECT news_id, index_code
        FROM news_index_relations
        WHERE relation_type IS NULL OR relation_type = ''
      `;

      const newsIndexResults = await this.db.query(newsIndexQuery);

      for (const row of newsIndexResults) {
        issues.push({
          id: `missing_relation_type_news_index_${row.news_id}_${row.index_code}`,
          type: 'missing_relation_type',
          severity: 'low',
          description: `新闻-指数关联缺少关联类型`,
          affectedRecords: [row],
          suggestedFix: `为关联设置默认的关联类型`,
          autoFixable: true,
          createdAt: new Date().toISOString()
        });
      }

      // 检查新闻-龙头股关联的关联类型
      const newsStockQuery = `
        SELECT news_id, stock_code
        FROM news_stock_relations
        WHERE relation_type IS NULL OR relation_type = ''
      `;

      const newsStockResults = await this.db.query(newsStockQuery);

      for (const row of newsStockResults) {
        issues.push({
          id: `missing_relation_type_news_stock_${row.news_id}_${row.stock_code}`,
          type: 'missing_relation_type',
          severity: 'low',
          description: `新闻-龙头股关联缺少关联类型`,
          affectedRecords: [row],
          suggestedFix: `为关联设置默认的关联类型`,
          autoFixable: true,
          createdAt: new Date().toISOString()
        });
      }

    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleDataConsistencyChecker.checkMissingRelationTypes');
    }

    return issues;
  }

  /**
   * 自动修复可修复的问题
   */
  async autoFixIssues(issues: ConsistencyIssue[]): Promise<FixResult> {
    const fixResult: FixResult = {
      success: true,
      fixedIssues: 0,
      failedIssues: 0,
      errors: [],
      details: []
    };

    const autoFixableIssues = issues.filter(issue => issue.autoFixable);

    for (const issue of autoFixableIssues) {
      try {
        const success = await this.fixIssue(issue);

        if (success) {
          fixResult.fixedIssues++;
          fixResult.details.push({
            issueId: issue.id,
            success: true
          });
        } else {
          fixResult.failedIssues++;
          fixResult.details.push({
            issueId: issue.id,
            success: false,
            error: '修复失败'
          });
        }

      } catch (error) {
        fixResult.failedIssues++;
        fixResult.success = false;
        const errorMessage = error instanceof Error ? error instanceof Error ? error.message : String(error) : '未知错误';
        fixResult.errors.push(`修复问题 ${issue.id} 时出错: ${errorMessage}`);
        fixResult.details.push({
          issueId: issue.id,
          success: false,
          error: errorMessage
        });
      }
    }

    this.monitor.recordMetric('data_consistency_auto_fix_completed', 1, {
      fixed_issues: fixResult.fixedIssues.toString(),
      failed_issues: fixResult.failedIssues.toString()
    });

    return fixResult;
  }

  /**
   * 修复单个问题
   */
  private async fixIssue(issue: ConsistencyIssue): Promise<boolean> {
    try {
      switch (issue.type) {
        case 'invalid_etf_mapping':
          return await this.fixInvalidEtfMapping(issue);
        case 'invalid_news_index_relation':
          return await this.fixInvalidNewsIndexRelation(issue);
        case 'invalid_news_stock_relation':
          return await this.fixInvalidNewsStockRelation(issue);
        case 'duplicate_mapping':
          return await this.fixDuplicateMapping(issue);
        case 'invalid_confidence_score':
          return await this.fixInvalidConfidenceScore(issue);
        case 'missing_relation_type':
          return await this.fixMissingRelationType(issue);
        default:
          return false;
      }
    } catch (error) {
      BaseErrorHandler.handle(error, 'SimpleDataConsistencyChecker.fixIssue');
      return false;
    }
  }

  /**
   * 修复无效的ETF映射
   */
  private async fixInvalidEtfMapping(issue: ConsistencyIssue): Promise<boolean> {
    const record = issue.affectedRecords[0];
    const query = `DELETE FROM etf_index_mapping WHERE etf_code = ? AND index_code = ?`;
    await this.db.query(query, [record.etf_code, record.index_code]);
    return true;
  }

  /**
   * 修复无效的新闻-指数关联
   */
  private async fixInvalidNewsIndexRelation(issue: ConsistencyIssue): Promise<boolean> {
    const record = issue.affectedRecords[0];
    const query = `DELETE FROM news_index_relations WHERE news_id = ? AND index_code = ?`;
    await this.db.query(query, [record.news_id, record.index_code]);
    return true;
  }

  /**
   * 修复无效的新闻-龙头股关联
   */
  private async fixInvalidNewsStockRelation(issue: ConsistencyIssue): Promise<boolean> {
    const record = issue.affectedRecords[0];
    const query = `DELETE FROM news_stock_relations WHERE news_id = ? AND stock_code = ?`;
    await this.db.query(query, [record.news_id, record.stock_code]);
    return true;
  }

  /**
   * 修复重复映射
   */
  private async fixDuplicateMapping(issue: ConsistencyIssue): Promise<boolean> {
    const record = issue.affectedRecords[0];
    const query = `
      DELETE FROM etf_index_mapping
      WHERE etf_code = ? AND index_code = ?
      AND id NOT IN (
        SELECT MIN(id) FROM etf_index_mapping
        WHERE etf_code = ? AND index_code = ?
      )
    `;
    await this.db.query(query, [record.etf_code, record.index_code, record.etf_code, record.index_code]);
    return true;
  }

  /**
   * 修复无效的置信度分数
   */
  private async fixInvalidConfidenceScore(issue: ConsistencyIssue): Promise<boolean> {
    const record = issue.affectedRecords[0];
    const fixedScore = Math.max(0, Math.min(1, record.confidence_score));

    if (issue.id.includes('news_index')) {
      const query = `UPDATE news_index_relations SET confidence_score = ? WHERE news_id = ? AND index_code = ?`;
      await this.db.query(query, [fixedScore, record.news_id, record.index_code]);
    } else if (issue.id.includes('news_stock')) {
      const query = `UPDATE news_stock_relations SET confidence_score = ? WHERE news_id = ? AND stock_code = ?`;
      await this.db.query(query, [fixedScore, record.news_id, record.stock_code]);
    }

    return true;
  }

  /**
   * 修复缺失的关联类型
   */
  private async fixMissingRelationType(issue: ConsistencyIssue): Promise<boolean> {
    const record = issue.affectedRecords[0];
    const defaultType = issue.id.includes('news_index') ? 'indirect' : 'company';

    if (issue.id.includes('news_index')) {
      const query = `UPDATE news_index_relations SET relation_type = ? WHERE news_id = ? AND index_code = ?`;
      await this.db.query(query, [defaultType, record.news_id, record.index_code]);
    } else if (issue.id.includes('news_stock')) {
      const query = `UPDATE news_stock_relations SET relation_type = ? WHERE news_id = ? AND stock_code = ?`;
      await this.db.query(query, [defaultType, record.news_id, record.stock_code]);
    }

    return true;
  }

  /**
   * 按类型分组问题
   */
  private groupIssuesByType(issues: ConsistencyIssue[]): Record<string, number> {
    return issues.reduce((acc, issue) => {
      acc[issue.type] = (acc[issue.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * 按严重程度分组问题
   */
  private groupIssuesBySeverity(issues: ConsistencyIssue[]): Record<string, number> {
    return issues.reduce((acc, issue) => {
      acc[issue.severity] = (acc[issue.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}
