import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from './ConfigService';
import { ConfigController } from './ConfigController';
import { ConfigHotReloadService } from './ConfigHotReloadService';
import { ConfigMigrationService } from './ConfigMigrationService';
import { ConfigEntity } from './entities/config.entity';
import { ArbitrationCaseEntity } from './entities/arbitration-case.entity';
import { ArbitrationService } from './arbitration.service';
import { ArbitrationController } from './arbitration.controller';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ConfigEntity, ArbitrationCaseEntity]),
    RedisModule,
  ],
  providers: [
    ConfigService,
    ConfigHotReloadService,
    ConfigMigrationService,
    ArbitrationService,
  ],
  controllers: [
    ConfigController,
    ArbitrationController,
  ],
  exports: [
    ConfigService,
    ConfigHotReloadService,
    ConfigMigrationService,
    ArbitrationService,
  ],
})
export class AdminModule {}
