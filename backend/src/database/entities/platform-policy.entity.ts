import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('platform_policies')
export class PlatformPolicy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  type: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'text', nullable: true })
  summary: string;

  @Column({ type: 'varchar', length: 20, default: '1.0' })
  version: string;

  @Column({ type: 'varchar', length: 20, default: 'draft' })
  status: string;

  @Column({ type: 'varchar', length: 50, default: 'global' })
  scope: string;

  @Column({ name: 'published_at', type: 'timestamp', nullable: true })
  publishedAt: Date;

  @Column({
    name: 'last_published_version',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  lastPublishedVersion: string;

  @Column({ name: 'created_by', type: 'varchar', length: 255, nullable: true })
  createdBy: string;

  @Column({
    name: 'created_by_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  createdByName: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
