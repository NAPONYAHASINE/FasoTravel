import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('reviews')
export class Review extends BaseEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'review_id' })
  reviewId: string;

  @Column({ name: 'trip_id', type: 'varchar', length: 50, nullable: true })
  tripId: string;

  @ManyToOne('Trip', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'trip_id' })
  trip: any;

  @Column({ name: 'operator_id', type: 'varchar', length: 50 })
  operatorId: string;

  @ManyToOne('Operator', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'operator_id' })
  operator: any;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne('User', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: any;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ type: 'jsonb', default: '{}' })
  aspects: Record<string, any>;

  @Column({
    name: 'reviewed_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  reviewedAt: Date;

  @Column({ name: 'helpful_count', type: 'int', default: 0 })
  helpfulCount: number;

  @Column({ name: 'unhelpful_count', type: 'int', default: 0 })
  unhelpfulCount: number;

  @Column({ name: 'is_verified_traveler', type: 'boolean', default: false })
  isVerifiedTraveler: boolean;

  @Column({ type: 'varchar', length: 50, default: 'PENDING' })
  status: string;
}
