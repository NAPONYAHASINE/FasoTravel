import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { PaymentStatus } from '../../common/constants';

@Entity('payments')
export class Payment extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'booking_id', type: 'uuid' })
  bookingId: string;

  @ManyToOne('Booking', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking: any;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne('User', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: any;

  @Column({ name: 'user_name', type: 'varchar', length: 255, nullable: true })
  userName: string;

  @Column({ name: 'company_id', type: 'varchar', length: 50, nullable: true })
  companyId: string;

  @Column({
    name: 'company_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  companyName: string;

  @Column({ type: 'int' })
  amount: number;

  @Column({ type: 'varchar', length: 10, default: 'XOF' })
  currency: string;

  @Column({ name: 'method', type: 'varchar', length: 50 })
  method: string;

  @Column({ type: 'varchar', length: 50, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ name: 'platform_fee', type: 'int', nullable: true })
  platformFee: number;

  @Column({ name: 'company_amount', type: 'int', nullable: true })
  companyAmount: number;

  @Column({
    name: 'transaction_id',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  transactionId: string;

  @Column({
    name: 'payment_gateway',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  paymentGateway: string;

  @Column({
    name: 'provider_reference',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  providerReference: string;

  @Column({ name: 'provider_metadata', type: 'jsonb', nullable: true })
  providerMetadata: Record<string, any>;

  @Column({
    name: 'idempotency_key',
    type: 'varchar',
    length: 255,
    nullable: true,
    unique: true,
  })
  idempotencyKey: string;

  @Column({ name: 'refund_id', type: 'varchar', length: 255, nullable: true })
  refundId: string;

  @Column({
    name: 'refund_reason',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  refundReason: string;

  @Column({ name: 'processed_at', type: 'timestamp', nullable: true })
  processedAt: Date;

  @Column({ name: 'refunded_at', type: 'timestamp', nullable: true })
  refundedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({
    name: 'failed_reason',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  failedReason: string;
}
