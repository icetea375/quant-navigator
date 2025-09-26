/**
 * 数据库集成测试
 * 基于全流程测试计划v1.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import { Database } from '@/database/unified-connection';
import { TestHelpers } from '../utils/test-helpers';

describe('Database Integration Tests', () => {
  let database: Database;
  let app: TestingModule;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      providers: [
        Database,
      ],
    }).compile();

    database = app.get<Database>(Database);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Database Connection', () => {
    it('should connect to test database', async () => {
      // Act
      const isConnected = await database.isConnected();

      // Assert
      expect(isConnected).toBe(true);
    });

    it('should execute simple query', async () => {
      // Act
      const result = await database.query('SELECT 1 as test');

      // Assert
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].test).toBe(1);
    });
  });

  describe('Configuration Table', () => {
    it('should create configuration table if not exists', async () => {
      // Arrange
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS test_configs (
          id SERIAL PRIMARY KEY,
          config_type VARCHAR(50) NOT NULL,
          config_key VARCHAR(100) NOT NULL,
          config_value TEXT,
          description TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(config_type, config_key)
        )
      `;

      // Act
      await database.query(createTableQuery);

      // Assert
      const result = await database.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_name = 'test_configs'
      `);

      expect(result.rows).toHaveLength(1);
    });

    it('should insert and retrieve configuration', async () => {
      // Arrange
      const configData = {
        configType: 'test',
        configKey: 'test_key',
        configValue: 'test_value',
        description: 'Test configuration'
      };

      // Act
      const insertResult = await database.query(`
        INSERT INTO test_configs (config_type, config_key, config_value, description)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [configData.configType, configData.configKey, configData.configValue, configData.description]);

      const selectResult = await database.query(`
        SELECT * FROM test_configs WHERE config_type = $1 AND config_key = $2
      `, [configData.configType, configData.configKey]);

      // Assert
      expect(insertResult.rows).toHaveLength(1);
      expect(selectResult.rows).toHaveLength(1);
      expect(selectResult.rows[0].config_type).toBe(configData.configType);
      expect(selectResult.rows[0].config_key).toBe(configData.configKey);
      expect(selectResult.rows[0].config_value).toBe(configData.configValue);
    });
  });

  describe('Transaction Support', () => {
    it('should support database transactions', async () => {
      // Act
      const result = await database.transaction(async (client) => {
        await client.query('INSERT INTO test_configs (config_type, config_key, config_value) VALUES ($1, $2, $3)',
          ['transaction_test', 'key1', 'value1']);

        await client.query('INSERT INTO test_configs (config_type, config_key, config_value) VALUES ($1, $2, $3)',
          ['transaction_test', 'key2', 'value2']);

        return await client.query('SELECT COUNT(*) as count FROM test_configs WHERE config_type = $1',
          ['transaction_test']);
      });

      // Assert
      expect(result.rows[0].count).toBe('2');
    });

    it('should rollback transaction on error', async () => {
      // Act & Assert
      await expect(
        database.transaction(async (client) => {
          await client.query('INSERT INTO test_configs (config_type, config_key, config_value) VALUES ($1, $2, $3)',
            ['rollback_test', 'key1', 'value1']);

          throw new Error('Simulated error');
        })
      ).rejects.toThrow('Simulated error');

      // Verify rollback
      const result = await database.query('SELECT COUNT(*) as count FROM test_configs WHERE config_type = $1',
        ['rollback_test']);
      expect(result.rows[0].count).toBe('0');
    });
  });

  describe('Data Cleanup', () => {
    it('should clean up test data', async () => {
      // Act
      await database.query('DELETE FROM test_configs WHERE config_type IN ($1, $2, $3)',
        ['test', 'transaction_test', 'rollback_test']);

      // Assert
      const result = await database.query('SELECT COUNT(*) as count FROM test_configs WHERE config_type IN ($1, $2, $3)',
        ['test', 'transaction_test', 'rollback_test']);
      expect(result.rows[0].count).toBe('0');
    });
  });
});
