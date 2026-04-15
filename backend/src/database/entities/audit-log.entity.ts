import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string;

  @Column({ name: 'user_name', type: 'varchar', length: 255, nullable: true })
  userName: string;

  @Column({
    name: 'actor_type',
    type: 'varchar',
    length: 30,
    default: 'system',
  })
  actorType: string;

  @Column({ type: 'varchar', length: 100 })
  action: string;

  @Column({ name: 'entity_type', type: 'varchar', length: 100 })
  entityType: string;

  @Column({ name: 'entity_id', type: 'varchar', length: 100, nullable: true })
  entityId: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'info',
  })
  severity: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'operations',
  })
  category: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  changes: Record<string, unknown>;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string;

  @Column({ name: 'duration_ms', type: 'int', nullable: true })
  durationMs: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
