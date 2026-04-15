import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('scheduled_notifications')
export class ScheduledNotification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ name: 'scheduled_at', type: 'timestamp' })
  scheduledAt: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  audience: string;

  @Column({ name: 'audience_count', type: 'int', default: 0 })
  audienceCount: number;

  @Column({ type: 'jsonb', default: '[]' })
  channels: string[];

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
