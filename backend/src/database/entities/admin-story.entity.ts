import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('admin_stories')
export class AdminStory {
  @PrimaryColumn({ type: 'varchar', length: 100 })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  // ─── Média ───────────────────────────────────────────────────
  @Column({
    name: 'media_type',
    type: 'varchar',
    length: 20,
    default: 'gradient',
  })
  mediaType: string;

  @Column({ name: 'media_url', type: 'varchar', length: 500, nullable: true })
  mediaUrl: string;

  @Column({ type: 'varchar', length: 10, default: '📢' })
  emoji: string;

  @Column({
    type: 'varchar',
    length: 100,
    default: 'from-purple-500 to-pink-500',
  })
  gradient: string;

  // ─── Cercle (référence StoryCircle.id) ───────────────────────
  @Column({ name: 'circle_id', type: 'varchar', length: 100, nullable: true })
  circleId: string;

  // ─── Call-to-Action ──────────────────────────────────────────
  @Column({ name: 'cta_text', type: 'varchar', length: 100, nullable: true })
  ctaText: string;

  @Column({
    name: 'action_type',
    type: 'varchar',
    length: 20,
    default: 'none',
  })
  actionType: string;

  @Column({ name: 'action_url', type: 'varchar', length: 500, nullable: true })
  actionUrl: string;

  @Column({
    name: 'internal_page',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  internalPage: string;

  // ─── Tracking ────────────────────────────────────────────────
  @Column({ name: 'views_count', type: 'int', default: 0 })
  viewsCount: number;

  @Column({ name: 'clicks_count', type: 'int', default: 0 })
  clicksCount: number;

  // ─── Statut ──────────────────────────────────────────────────
  @Column({ type: 'varchar', length: 20, default: 'draft' })
  status: string;

  @Column({ name: 'published_at', type: 'timestamp', nullable: true })
  publishedAt: Date;

  @Column({ type: 'int', default: 0 })
  priority: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'created_by', type: 'varchar', length: 100, nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt: Date;
}
