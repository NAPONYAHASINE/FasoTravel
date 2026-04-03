import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';

@Entity('review_helpfulness')
@Unique(['reviewId', 'userId'])
export class ReviewHelpfulness {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'review_id', type: 'uuid' })
  reviewId: string;

  @ManyToOne('Review', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'review_id' })
  review: any;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne('User', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: any;

  @Column({ name: 'is_helpful', type: 'boolean' })
  isHelpful: boolean;

  @Column({
    name: 'voted_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  votedAt: Date;
}
