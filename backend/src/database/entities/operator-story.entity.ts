import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('operator_stories')
export class OperatorStory {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  id: string;

  @Column({ name: 'operator_id', type: 'varchar', length: 255 })
  operatorId: string;

  @ManyToOne('Operator', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'operator_id' })
  operator: any;

  @Column({ type: 'varchar', length: 50 })
  type: string;

  @Column({ name: 'media_type', type: 'varchar', length: 20 })
  mediaType: string;

  @Column({ name: 'media_url', type: 'varchar', length: 500, nullable: true })
  mediaUrl: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  gradient: string;

  @Column({ type: 'varchar', length: 100 })
  title: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  subtitle: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  emoji: string;

  @Column({ name: 'cta_text', type: 'varchar', length: 50, nullable: true })
  ctaText: string;

  @Column({ name: 'cta_link', type: 'varchar', length: 500, nullable: true })
  ctaLink: string;

  @Column({ name: 'duration_seconds', type: 'int', default: 5 })
  durationSeconds: number;

  @Column({ name: 'category_id', type: 'varchar', length: 50, nullable: true })
  categoryId: string;

  @ManyToOne('StoryCategory', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'category_id' })
  category: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;
}
