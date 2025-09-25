import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('system_configs')
@Index(['configType', 'configKey'], { unique: true })
@Index(['isActive'])
@Index(['updatedAt'])
export class ConfigEntity {
  @PrimaryGeneratedColumn()
  configId: number;

  @Column({ type: 'varchar', length: 50 })
  configType: string;

  @Column({ type: 'varchar', length: 100 })
  configKey: string;

  @Column({ type: 'jsonb' })
  configValue: any;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  createdBy: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  updatedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
