import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from './ConfigService';
import { ConfigController } from './ConfigController';
import { ConfigHotReloadService } from './ConfigHotReloadService';
import { ConfigMigrationService } from './ConfigMigrationService';
import { ConfigEntity } from './entities/config.entity';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ConfigEntity]),
    RedisModule,
  ],
  providers: [
    ConfigService,
    ConfigHotReloadService,
    ConfigMigrationService,
  ],
  controllers: [
    ConfigController,
  ],
  exports: [
    ConfigService,
    ConfigHotReloadService,
    ConfigMigrationService,
  ],
})
export class AdminModule {}
