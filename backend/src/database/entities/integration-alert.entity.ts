import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('integration_alerts')
export class IntegrationAlert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'rule_id', type: 'uuid' })
  ruleId: string;

  @ManyToOne('IntegrationAlertRule', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rule_id' })
  rule: any;

  @Column({ name: 'integration_id', type: 'uuid' })
  integrationId: string;

  @ManyToOne('Integration', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'integration_id' })
  integration: any;

  @Column({ type: 'varchar', length: 20, default: 'fired' })
  status: string;

  @Column({ type: 'varchar', length: 20, default: 'warning' })
  severity: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'jsonb', nullable: true })
  details: Record<string, any>;

  @Column({ name: 'acknowledged_by', type: 'uuid', nullable: true })
  acknowledgedBy: string;

  @Column({ name: 'acknowledged_at', type: 'timestamp', nullable: true })
  acknowledgedAt: Date;

  @CreateDateColumn({ name: 'fired_at' })
  firedAt: Date;
}
