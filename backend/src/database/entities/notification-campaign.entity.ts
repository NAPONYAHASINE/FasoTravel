import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('notification_campaigns')
export class NotificationCampaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', length: 20, default: 'manual' })
  source: string;

  @Column({ name: 'source_name', type: 'varchar', length: 255, nullable: true })
  sourceName: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  category: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  audience: string;

  @Column({ name: 'audience_count', type: 'int', default: 0 })
  audienceCount: number;

  @Column({ type: 'jsonb', default: '[]' })
  channels: string[];

  @Column({ name: 'sent_at', type: 'timestamp', nullable: true })
  sentAt: Date;

  @Column({ name: 'delivered_count', type: 'int', default: 0 })
  deliveredCount: number;

  @Column({ name: 'opened_count', type: 'int', default: 0 })
  openedCount: number;

  @Column({ name: 'clicked_count', type: 'int', default: 0 })
  clickedCount: number;

  @Column({ type: 'varchar', length: 50, default: 'delivered' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
