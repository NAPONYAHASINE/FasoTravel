import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('integration_alert_rules')
export class IntegrationAlertRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'integration_id', type: 'uuid' })
  integrationId: string;

  @ManyToOne('Integration', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'integration_id' })
  integration: any;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({
    type: 'varchar',
    length: 50,
    comment: 'health_check | error_rate | latency | custom',
  })
  type: string;

  @Column({ type: 'jsonb' })
  condition: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  actions: Record<string, any>;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
