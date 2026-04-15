import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('price_history')
export class PriceHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'segment_id', type: 'uuid' })
  segmentId: string;

  @ManyToOne('PriceSegment', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'segment_id' })
  segment: any;

  @Column({ name: 'old_price', type: 'numeric', precision: 10, scale: 2 })
  oldPrice: number;

  @Column({ name: 'new_price', type: 'numeric', precision: 10, scale: 2 })
  newPrice: number;

  @Column({ name: 'changed_by', type: 'uuid', nullable: true })
  changedBy: string;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @CreateDateColumn({ name: 'changed_at' })
  changedAt: Date;
}
