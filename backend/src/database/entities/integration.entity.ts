import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('integrations')
export class Integration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({
    type: 'varchar',
    length: 50,
    comment: 'paydunya | whatsapp | aws | infobip | firebase | custom',
  })
  type: string;

  @Column({ type: 'varchar', length: 20, default: 'inactive' })
  status: string;

  @Column({ type: 'jsonb', default: {} })
  config: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  credentials: Record<string, any>;

  @Column({ type: 'varchar', length: 20, default: 'sandbox' })
  mode: string;

  @Column({ name: 'last_health_check', type: 'timestamp', nullable: true })
  lastHealthCheck: Date;

  @Column({
    name: 'health_status',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  healthStatus: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
