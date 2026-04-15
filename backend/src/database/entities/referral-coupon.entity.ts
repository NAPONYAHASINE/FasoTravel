import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseUuidEntity } from './base.entity';
import { User } from './user.entity';
import { CouponStatus } from '../../common/constants';

@Entity('referral_coupons')
export class ReferralCoupon extends BaseUuidEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'int' })
  amount: number;

  @Column({ name: 'points_cost', type: 'int', default: 0 })
  pointsCost: number;

  @Column({
    type: 'varchar',
    length: 20,
    default: CouponStatus.ACTIVE,
  })
  status: CouponStatus;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @Column({ name: 'used_at', type: 'timestamp', nullable: true })
  usedAt: Date | null;

  @Column({ name: 'cancelled_at', type: 'timestamp', nullable: true })
  cancelledAt: Date | null;

  @Column({ name: 'cancelled_by', type: 'uuid', nullable: true })
  cancelledBy: string | null;

  @Column({
    name: 'cancel_reason',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  cancelReason: string | null;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
