import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('advertisements')
export class Advertisement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'media_type', type: 'varchar', length: 20 })
  mediaType: string;

  @Column({ name: 'media_url', type: 'text', nullable: true })
  mediaUrl: string;

  @Column({ type: 'text', nullable: true })
  gradient: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  emoji: string;

  @Column({ name: 'cta_text', type: 'varchar', length: 100, nullable: true })
  ctaText: string;

  @Column({ name: 'action_type', type: 'varchar', length: 20 })
  actionType: string;

  @Column({ name: 'action_url', type: 'text', nullable: true })
  actionUrl: string;

  @Column({
    name: 'internal_page',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  internalPage: string;

  @Column({ name: 'internal_data', type: 'jsonb', nullable: true })
  internalData: Record<string, any>;

  @Column({ name: 'target_pages', type: 'text', array: true, nullable: true })
  targetPages: string[];

  @Column({ name: 'target_new_users', type: 'boolean', default: false })
  targetNewUsers: boolean;

  @Column({ type: 'int', default: 5 })
  priority: number;

  @Column({ name: 'start_date', type: 'timestamp' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'timestamp' })
  endDate: Date;

  @Column({ name: 'max_impressions', type: 'int', nullable: true })
  maxImpressions: number;

  @Column({ name: 'max_clicks', type: 'int', nullable: true })
  maxClicks: number;

  @Column({ name: 'impressions_count', type: 'int', default: 0 })
  impressionsCount: number;

  @Column({ name: 'clicks_count', type: 'int', default: 0 })
  clicksCount: number;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
