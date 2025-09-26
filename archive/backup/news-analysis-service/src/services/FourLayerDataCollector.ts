/**
 * 四层映射数据收集器
 * 负责收集和管理四层映射架构的数据
 *
 * @author AI Assistant
 * @created 2025-01-17
 * @version 1.0.0
 */

import { DatabaseConnection } from '../database/connection';
import { SimpleLogCollector } from './SimpleLogCollector';
import { BaseErrorHandler } from '../utils/BaseErrorHandler';
import { BaseConfigValidator } from '../utils/BaseConfigValidator';

export interface FourLayerMappingConfig {
  layerLevel: number;
  parentId?: number;
  code: string;
  name: string;
  type: 'index' | 'stock';
  market?: string;
  sector?: string;
  weight?: number;
  isActive?: boolean;
}

export interface FourLayerMappingData {
  id: number;
  layerLevel: number;
  parentId?: number;
  code: string;
  name: string;
  type: string;
  market: string;
  sector?: string;
  weight?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LayerHierarchy {
  layer1: FourLayerMappingData[]; // 宽基指数层
  layer2: FourLayerMappingData[]; // 一级指数层
  layer3: FourLayerMappingData[]; // 二级指数层
  layer4: FourLayerMappingData[]; // 龙头股层
}

export interface DataCollectionStats {
  totalMappings: number;
  layer1Count: number;
  layer2Count: number;
  layer3Count: number;
  layer4Count: number;
  activeCount: number;
  inactiveCount: number;
  lastUpdated: string;
}

export class FourLayerDataCollector {
  private db: DatabaseConnection;
  private logger: SimpleLogCollector;

  constructor(
    db: DatabaseConnection,
    logger: SimpleLogCollector
  ) {
    this.db = db;
    this.logger = logger;
  }

  /**
   * 添加四层映射数据
   * @param config 映射配置
   * @returns 映射数据
   */
  async addMapping(config: FourLayerMappingConfig): Promise<FourLayerMappingData> {
    try {
      this.logger.info('添加四层映射数据', {
        layerLevel: config.layerLevel,
        code: config.code,
        name: config.name,
        type: config.type
      });

      // 验证配置
      BaseConfigValidator.validate({ enabled: true, ...config }, [
        'layerLevel',
        'code',
        'name',
        'type'
      ]);

      // 检查是否已存在
      const existing = await this.getMappingByCode(config.code);
      if (existing) {
        throw new Error(`映射数据已存在: ${config.code}`);
      }

      // 验证父级关系
      if (config.parentId) {
        const parent = await this.getMappingById(config.parentId);
        if (!parent) {
          throw new Error(`父级映射不存在: ${config.parentId}`);
        }
        if (parent.layerLevel >= config.layerLevel) {
          throw new Error(`父级层级必须小于子级层级`);
        }
      }

      // 插入数据
      const result = await this.db.execute(`
        INSERT INTO four_layer_mapping (
          layer_level, parent_id, code, name, type, market, sector, weight, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        config.layerLevel,
        config.parentId || null,
        config.code,
        config.name,
        config.type,
        config.market || 'CN',
        config.sector || null,
        config.weight || null,
        config.isActive !== false
      ]);

      const mappingData: FourLayerMappingData = {
        id: result.lastID,
        layerLevel: config.layerLevel,
        parentId: config.parentId,
        code: config.code,
        name: config.name,
        type: config.type,
        market: config.market || 'CN',
        sector: config.sector,
        weight: config.weight,
        isActive: config.isActive !== false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.logger.info('四层映射数据添加成功', {
        id: mappingData.id,
        code: mappingData.code,
        layerLevel: mappingData.layerLevel
      });

      return mappingData;
    } catch (error) {
      BaseErrorHandler.handle(error, 'FourLayerDataCollector');
      throw error;
    }
  }

  /**
   * 批量添加四层映射数据
   * @param configs 映射配置数组
   * @returns 映射数据数组
   */
  async addMappings(configs: FourLayerMappingConfig[]): Promise<FourLayerMappingData[]> {
    try {
      this.logger.info('批量添加四层映射数据', {
        count: configs.length
      });

      const results: FourLayerMappingData[] = [];

      for (const config of configs) {
        const mapping = await this.addMapping(config);
        results.push(mapping);
      }

      this.logger.info('批量添加四层映射数据完成', {
        successCount: results.length,
        totalCount: configs.length
      });

      return results;
    } catch (error) {
      BaseErrorHandler.handle(error, 'FourLayerDataCollector');
      throw error;
    }
  }

  /**
   * 获取四层映射数据
   * @param id 映射ID
   * @returns 映射数据
   */
  async getMappingById(id: number): Promise<FourLayerMappingData | null> {
    try {
      const rows = await this.db.query(`
        SELECT * FROM four_layer_mapping WHERE id = ?
      `, [id]);
      const row = rows[0];

      if (!row) return null;

      return this.mapRowToMappingData(row);
    } catch (error) {
      BaseErrorHandler.handle(error, 'FourLayerDataCollector');
      throw error;
    }
  }

  /**
   * 根据代码获取映射数据
   * @param code 代码
   * @returns 映射数据
   */
  async getMappingByCode(code: string): Promise<FourLayerMappingData | null> {
    try {
      const rows = await this.db.query(`
        SELECT * FROM four_layer_mapping WHERE code = ?
      `, [code]);
      const row = rows[0];

      if (!row) return null;

      return this.mapRowToMappingData(row);
    } catch (error) {
      BaseErrorHandler.handle(error, 'FourLayerDataCollector');
      throw error;
    }
  }

  /**
   * 获取层级数据
   * @param layerLevel 层级
   * @param activeOnly 是否只获取激活的数据
   * @returns 映射数据数组
   */
  async getLayerData(layerLevel: number, activeOnly: boolean = true): Promise<FourLayerMappingData[]> {
    try {
      let query = `
        SELECT * FROM four_layer_mapping
        WHERE layer_level = ?
      `;
      const params: any[] = [layerLevel];

      if (activeOnly) {
        query += ` AND is_active = 1`;
      }

      query += ` ORDER BY code`;

      const rows = await this.db.query(query, params);
      return rows.map((row: any) => this.mapRowToMappingData(row));
    } catch (error) {
      BaseErrorHandler.handle(error, 'FourLayerDataCollector');
      throw error;
    }
  }

  /**
   * 获取完整层级结构
   * @returns 层级结构
   */
  async getLayerHierarchy(): Promise<LayerHierarchy> {
    try {
      const [layer1, layer2, layer3, layer4] = await Promise.all([
        this.getLayerData(1),
        this.getLayerData(2),
        this.getLayerData(3),
        this.getLayerData(4)
      ]);

      return {
        layer1,
        layer2,
        layer3,
        layer4
      };
    } catch (error) {
      BaseErrorHandler.handle(error, 'FourLayerDataCollector');
      throw error;
    }
  }

  /**
   * 获取子级数据
   * @param parentId 父级ID
   * @param activeOnly 是否只获取激活的数据
   * @returns 子级映射数据数组
   */
  async getChildrenData(parentId: number, activeOnly: boolean = true): Promise<FourLayerMappingData[]> {
    try {
      let query = `
        SELECT * FROM four_layer_mapping
        WHERE parent_id = ?
      `;
      const params: any[] = [parentId];

      if (activeOnly) {
        query += ` AND is_active = 1`;
      }

      query += ` ORDER BY code`;

      const rows = await this.db.query(query, params);
      return rows.map((row: any) => this.mapRowToMappingData(row));
    } catch (error) {
      BaseErrorHandler.handle(error, 'FourLayerDataCollector');
      throw error;
    }
  }

  /**
   * 获取父级数据
   * @param childId 子级ID
   * @returns 父级映射数据
   */
  async getParentData(childId: number): Promise<FourLayerMappingData | null> {
    try {
      const child = await this.getMappingById(childId);
      if (!child || !child.parentId) return null;

      return await this.getMappingById(child.parentId);
    } catch (error) {
      BaseErrorHandler.handle(error, 'FourLayerDataCollector');
      throw error;
    }
  }

  /**
   * 更新映射数据
   * @param id 映射ID
   * @param updates 更新数据
   * @returns 更新后的映射数据
   */
  async updateMapping(id: number, updates: Partial<FourLayerMappingConfig>): Promise<FourLayerMappingData> {
    try {
      this.logger.info('更新四层映射数据', {
        id,
        updates
      });

      const existing = await this.getMappingById(id);
      if (!existing) {
        throw new Error(`映射数据不存在: ${id}`);
      }

      // 构建更新SQL
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      if (updates.name !== undefined) {
        updateFields.push('name = ?');
        updateValues.push(updates.name);
      }
      if (updates.sector !== undefined) {
        updateFields.push('sector = ?');
        updateValues.push(updates.sector);
      }
      if (updates.weight !== undefined) {
        updateFields.push('weight = ?');
        updateValues.push(updates.weight);
      }
      if (updates.isActive !== undefined) {
        updateFields.push('is_active = ?');
        updateValues.push(updates.isActive);
      }

      if (updateFields.length === 0) {
        throw new Error('没有提供更新字段');
      }

      updateFields.push('updated_at = ?');
      updateValues.push(new Date().toISOString());
      updateValues.push(id);

      await this.db.execute(`
        UPDATE four_layer_mapping
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `, updateValues);

      const updated = await this.getMappingById(id);
      if (!updated) {
        throw new Error('更新后无法获取映射数据');
      }

      this.logger.info('四层映射数据更新成功', {
        id,
        code: updated.code
      });

      return updated;
    } catch (error) {
      BaseErrorHandler.handle(error, 'FourLayerDataCollector');
      throw error;
    }
  }

  /**
   * 删除映射数据
   * @param id 映射ID
   * @param softDelete 是否软删除
   */
  async deleteMapping(id: number, softDelete: boolean = true): Promise<void> {
    try {
      this.logger.info('删除四层映射数据', {
        id,
        softDelete
      });

      const existing = await this.getMappingById(id);
      if (!existing) {
        throw new Error(`映射数据不存在: ${id}`);
      }

      if (softDelete) {
        // 软删除：设置为非激活状态
        await this.db.execute(`
          UPDATE four_layer_mapping
          SET is_active = 0, updated_at = ?
          WHERE id = ?
        `, [new Date().toISOString(), id]);
      } else {
        // 硬删除：检查是否有子级数据
        const children = await this.getChildrenData(id, false);
        if (children.length > 0) {
          throw new Error('存在子级数据，无法删除');
        }

        await this.db.execute(`
          DELETE FROM four_layer_mapping WHERE id = ?
        `, [id]);
      }

      this.logger.info('四层映射数据删除成功', {
        id,
        code: existing.code,
        softDelete
      });
    } catch (error) {
      BaseErrorHandler.handle(error, 'FourLayerDataCollector');
      throw error;
    }
  }

  /**
   * 获取数据收集统计
   * @returns 统计信息
   */
  async getDataCollectionStats(): Promise<DataCollectionStats> {
    try {
      const [totalResult, layer1Result, layer2Result, layer3Result, layer4Result, activeResult, inactiveResult] = await Promise.all([
        this.db.query('SELECT COUNT(*) as count FROM four_layer_mapping'),
        this.db.query('SELECT COUNT(*) as count FROM four_layer_mapping WHERE layer_level = 1'),
        this.db.query('SELECT COUNT(*) as count FROM four_layer_mapping WHERE layer_level = 2'),
        this.db.query('SELECT COUNT(*) as count FROM four_layer_mapping WHERE layer_level = 3'),
        this.db.query('SELECT COUNT(*) as count FROM four_layer_mapping WHERE layer_level = 4'),
        this.db.query('SELECT COUNT(*) as count FROM four_layer_mapping WHERE is_active = 1'),
        this.db.query('SELECT COUNT(*) as count FROM four_layer_mapping WHERE is_active = 0')
      ]);

      const lastUpdatedResult = await this.db.query(`
        SELECT MAX(updated_at) as last_updated FROM four_layer_mapping
      `);
      const lastUpdatedRow = lastUpdatedResult[0];

      return {
        totalMappings: totalResult[0]?.count || 0,
        layer1Count: layer1Result[0]?.count || 0,
        layer2Count: layer2Result[0]?.count || 0,
        layer3Count: layer3Result[0]?.count || 0,
        layer4Count: layer4Result[0]?.count || 0,
        activeCount: activeResult[0]?.count || 0,
        inactiveCount: inactiveResult[0]?.count || 0,
        lastUpdated: lastUpdatedRow?.last_updated || new Date().toISOString()
      };
    } catch (error) {
      BaseErrorHandler.handle(error, 'FourLayerDataCollector');
      throw error;
    }
  }

  /**
   * 初始化默认四层映射数据
   */
  async initializeDefaultMappings(): Promise<void> {
    try {
      this.logger.info('初始化默认四层映射数据');

      // 检查是否已有数据
      const stats = await this.getDataCollectionStats();
      if (stats.totalMappings > 0) {
        this.logger.info('四层映射数据已存在，跳过初始化');
        return;
      }

      // 第1层：宽基指数层
      const layer1Mappings: FourLayerMappingConfig[] = [
        { layerLevel: 1, code: '000001.SH', name: '上证指数', type: 'index', market: 'CN', sector: '宽基指数' },
        { layerLevel: 1, code: '399001.SZ', name: '深证成指', type: 'index', market: 'CN', sector: '宽基指数' },
        { layerLevel: 1, code: '399006.SZ', name: '创业板指', type: 'index', market: 'CN', sector: '宽基指数' },
        { layerLevel: 1, code: '000688.SH', name: '科创50', type: 'index', market: 'CN', sector: '宽基指数' }
      ];

      // 第2层：一级指数层
      const layer2Mappings: FourLayerMappingConfig[] = [
        { layerLevel: 2, code: 'BK0475', name: '金融指数', type: 'index', market: 'CN', sector: '金融' },
        { layerLevel: 2, code: 'BK0727', name: '科技指数', type: 'index', market: 'CN', sector: '科技' },
        { layerLevel: 2, code: 'BK0740', name: '消费指数', type: 'index', market: 'CN', sector: '消费' },
        { layerLevel: 2, code: 'BK0737', name: '医药指数', type: 'index', market: 'CN', sector: '医药' }
      ];

      // 第3层：二级指数层
      const layer3Mappings: FourLayerMappingConfig[] = [
        { layerLevel: 3, code: 'BK0475', name: '银行指数', type: 'index', market: 'CN', sector: '银行' },
        { layerLevel: 3, code: 'BK0474', name: '保险指数', type: 'index', market: 'CN', sector: '保险' },
        { layerLevel: 3, code: 'BK0727', name: '半导体指数', type: 'index', market: 'CN', sector: '半导体' },
        { layerLevel: 3, code: 'BK0733', name: '新能源汽车指数', type: 'index', market: 'CN', sector: '新能源汽车' }
      ];

      // 第4层：龙头股层
      const layer4Mappings: FourLayerMappingConfig[] = [
        { layerLevel: 4, code: '600036.SH', name: '招商银行', type: 'stock', market: 'CN', sector: '银行' },
        { layerLevel: 4, code: '601318.SH', name: '中国平安', type: 'stock', market: 'CN', sector: '保险' },
        { layerLevel: 4, code: '688981.SH', name: '中芯国际', type: 'stock', market: 'CN', sector: '半导体' },
        { layerLevel: 4, code: '002594.SZ', name: '比亚迪', type: 'stock', market: 'CN', sector: '新能源汽车' }
      ];

      // 添加所有映射数据
      await this.addMappings(layer1Mappings);
      await this.addMappings(layer2Mappings);
      await this.addMappings(layer3Mappings);
      await this.addMappings(layer4Mappings);

      this.logger.info('默认四层映射数据初始化完成', {
        layer1Count: layer1Mappings.length,
        layer2Count: layer2Mappings.length,
        layer3Count: layer3Mappings.length,
        layer4Count: layer4Mappings.length
      });
    } catch (error) {
      BaseErrorHandler.handle(error, 'FourLayerDataCollector');
      throw error;
    }
  }

  /**
   * 将数据库行映射为映射数据对象
   * @param row 数据库行
   * @returns 映射数据对象
   */
  private mapRowToMappingData(row: any): FourLayerMappingData {
    return {
      id: row.id,
      layerLevel: row.layer_level,
      parentId: row.parent_id,
      code: row.code,
      name: row.name,
      type: row.type,
      market: row.market,
      sector: row.sector,
      weight: row.weight,
      isActive: Boolean(row.is_active),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
