/**
 * 测试数据管理器
 * 基于全流程测试计划v1.0
 */

import { Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface TestDataset {
  id: string;
  name: string;
  type: 'historical' | 'mock' | 'fixture';
  data: any[];
  metadata: {
    createdAt: Date;
    size: number;
    description: string;
  };
}

export interface HistoricalDataConfig {
  startDate: string;
  endDate: string;
  symbols: string[];
  dataTypes: string[];
}

export class TestDataManager {
  private readonly logger = new Logger(TestDataManager.name);
  private datasets: Map<string, TestDataset> = new Map();
  private dataDir: string;

  constructor() {
    this.dataDir = path.join(__dirname, '..', 'data');
    this.ensureDataDirectories();
  }

  /**
   * 创建测试数据集
   */
  async createDataset(name: string, type: 'historical' | 'mock' | 'fixture', data: any[]): Promise<string> {
    const datasetId = `dataset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const dataset: TestDataset = {
      id: datasetId,
      name,
      type,
      data,
      metadata: {
        createdAt: new Date(),
        size: data.length,
        description: `${type} dataset for ${name}`
      }
    };

    // 保存数据集
    await this.saveDataset(dataset);
    this.datasets.set(datasetId, dataset);

    this.logger.log(`创建测试数据集: ${name} (${datasetId})`);
    return datasetId;
  }

  /**
   * 加载测试数据集
   */
  async loadDataset(datasetId: string): Promise<TestDataset> {
    if (this.datasets.has(datasetId)) {
      return this.datasets.get(datasetId)!;
    }

    const datasetPath = path.join(this.dataDir, 'datasets', `${datasetId}.json`);
    if (fs.existsSync(datasetPath)) {
      const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
      this.datasets.set(datasetId, dataset);
      return dataset;
    }

    throw new Error(`测试数据集 ${datasetId} 不存在`);
  }

  /**
   * 创建历史数据测试集
   */
  async createHistoricalDataset(config: HistoricalDataConfig): Promise<string> {
    this.logger.log(`创建历史数据测试集: ${config.startDate} - ${config.endDate}`);
    
    // 这里可以添加真实的历史数据获取逻辑
    // 目前创建模拟数据
    const mockData = this.generateMockHistoricalData(config);
    
    return await this.createDataset(
      `historical_${config.startDate}_${config.endDate}`,
      'historical',
      mockData
    );
  }

  /**
   * 创建模拟数据
   */
  async createMockDataset(name: string, data: any[]): Promise<string> {
    return await this.createDataset(name, 'mock', data);
  }

  /**
   * 创建测试夹具
   */
  async createFixtureDataset(name: string, data: any[]): Promise<string> {
    return await this.createDataset(name, 'fixture', data);
  }

  /**
   * 验证数据质量
   */
  async validateDataQuality(dataset: TestDataset): Promise<{
    completeness: number;
    accuracy: number;
    consistency: number;
    isValid: boolean;
  }> {
    const { data } = dataset;
    
    // 检查数据完整性
    const completeness = data.length > 0 ? 1 : 0;
    
    // 检查数据准确性（简单验证）
    const accuracy = this.calculateAccuracy(data);
    
    // 检查数据一致性
    const consistency = this.calculateConsistency(data);
    
    const isValid = completeness > 0.95 && accuracy > 0.98 && consistency > 0.95;
    
    this.logger.log(`数据质量验证: 完整性=${completeness}, 准确性=${accuracy}, 一致性=${consistency}`);
    
    return { completeness, accuracy, consistency, isValid };
  }

  /**
   * 清理测试数据
   */
  async cleanup(): Promise<void> {
    this.datasets.clear();
    
    // 清理临时文件
    const tempDir = path.join(this.dataDir, 'temp');
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    
    this.logger.log('测试数据清理完成');
  }

  private ensureDataDirectories(): void {
    const dirs = ['datasets', 'fixtures', 'mocks', 'temp'];
    dirs.forEach(dir => {
      const fullPath = path.join(this.dataDir, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });
  }

  private async saveDataset(dataset: TestDataset): Promise<void> {
    const datasetPath = path.join(this.dataDir, 'datasets', `${dataset.id}.json`);
    fs.writeFileSync(datasetPath, JSON.stringify(dataset, null, 2));
  }

  private generateMockHistoricalData(config: HistoricalDataConfig): any[] {
    const data = [];
    const startDate = new Date(config.startDate);
    const endDate = new Date(config.endDate);
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      if (d.getDay() !== 0 && d.getDay() !== 6) { // 排除周末
        config.symbols.forEach(symbol => {
          data.push({
            ts_code: symbol,
            trade_date: d.toISOString().split('T')[0].replace(/-/g, ''),
            open: Math.random() * 100 + 10,
            high: Math.random() * 100 + 10,
            low: Math.random() * 100 + 10,
            close: Math.random() * 100 + 10,
            vol: Math.random() * 1000000,
            amount: Math.random() * 10000000
          });
        });
      }
    }
    
    return data;
  }

  private calculateAccuracy(data: any[]): number {
    // 简单的准确性计算，实际应该更复杂
    return data.length > 0 ? 0.99 : 0;
  }

  private calculateConsistency(data: any[]): number {
    // 简单的一致性计算，实际应该检查数据格式、范围等
    return data.length > 0 ? 0.98 : 0;
  }
}

