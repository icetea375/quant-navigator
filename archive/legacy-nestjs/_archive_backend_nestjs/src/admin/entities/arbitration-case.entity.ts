import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('arbitration_cases')
@Index(['report_date', 'stock_code'])
@Index(['status', 'priority_score'])
export class ArbitrationCaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'case_id', unique: true })
  caseId: string;

  @Column({ name: 'report_date', type: 'date' })
  reportDate: string;

  @Column({ name: 'stock_code', length: 10 })
  stockCode: string;

  @Column({ name: 'qwen_report_id', type: 'uuid' })
  qwenReportId: string;

  @Column({ name: 'doubao_report_id', type: 'uuid' })
  doubaoReportId: string;

  @Column({ name: 'divergence_score', type: 'decimal', precision: 5, scale: 4 })
  divergenceScore: number;

  @Column({ name: 'consensus_summary', type: 'text' })
  consensusSummary: string;

  @Column({ name: 'conflict_summary', type: 'text' })
  conflictSummary: string;

  @Column({ name: 'priority_score', type: 'decimal', precision: 5, scale: 4 })
  priorityScore: number;

  @Column({
    name: 'status',
    type: 'enum',
    enum: ['PENDING_HUMAN', 'IGNORED', 'ARBITRATED'],
    default: 'PENDING_HUMAN'
  })
  status: 'PENDING_HUMAN' | 'IGNORED' | 'ARBITRATED';

  @Column({ name: 'analysis_metadata', type: 'jsonb', nullable: true })
  analysisMetadata: Record<string, any>;

  @Column({ name: 'human_decision', type: 'jsonb', nullable: true })
  humanDecision: {
    finalRecommendation: string;
    confidenceLevel: number;
    reasoning: string;
    keyDisagreements: string;
    arbitratorId?: string;
  } | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
