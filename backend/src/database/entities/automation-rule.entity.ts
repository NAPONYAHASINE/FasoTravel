import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('automation_rules')
export class AutomationRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'trigger_event', type: 'varchar', length: 255 })
  triggerEvent: string;

  @Column({
    name: 'trigger_label',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  triggerLabel: string;

  @Column({ type: 'jsonb' })
  template: { title: string; message: string };

  @Column({ type: 'jsonb', default: '[]' })
  channels: string[];

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'sent_count', type: 'int', default: 0 })
  sentCount: number;

  @Column({ name: 'last_triggered', type: 'timestamp', nullable: true })
  lastTriggered: Date;

  @Column({ type: 'varchar', length: 50, nullable: true })
  category: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
