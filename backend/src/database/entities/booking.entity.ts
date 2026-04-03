import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { BookingStatus } from '../../common/constants';

@Entity('bookings')
export class Booking extends BaseEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'booking_id' })
  bookingId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne('User', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: any;

  @Column({ name: 'trip_id', type: 'varchar', length: 50 })
  tripId: string;

  @ManyToOne('Trip', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trip_id' })
  trip: any;

  @Column({ name: 'operator_id', type: 'varchar', length: 50 })
  operatorId: string;

  @ManyToOne('Operator')
  @JoinColumn({ name: 'operator_id' })
  operator: any;

  @Column({ type: 'varchar', length: 30, default: BookingStatus.HOLD })
  status: string;

  @Column({ name: 'total_amount', type: 'int' })
  totalAmount: number;

  @Column({ type: 'varchar', length: 10, default: 'XOF' })
  currency: string;

  @Column({ name: 'num_passengers', type: 'int', default: 1 })
  numPassengers: number;

  @Column({ name: 'hold_expires_at', type: 'timestamp', nullable: true })
  holdExpiresAt: Date;

  @Column({ name: 'payment_id', type: 'uuid', nullable: true })
  paymentId: string;

  @Column({
    name: 'payment_status',
    type: 'varchar',
    length: 30,
    nullable: true,
  })
  paymentStatus: string;

  @Column({ name: 'booking_for', type: 'jsonb', nullable: true })
  bookingFor: Record<string, any>;

  // From migration 009 - multi-segment
  @Column({
    name: 'boarding_station_id',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  boardingStationId: string;

  @ManyToOne('Station', { nullable: true })
  @JoinColumn({ name: 'boarding_station_id' })
  boardingStation: any;

  @Column({
    name: 'alighting_station_id',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  alightingStationId: string;

  @ManyToOne('Station', { nullable: true })
  @JoinColumn({ name: 'alighting_station_id' })
  alightingStation: any;

  @Column({
    name: 'from_segment_id',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  fromSegmentId: string;

  @Column({
    name: 'to_segment_id',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  toSegmentId: string;

  @OneToMany('Ticket', 'booking')
  tickets: any[];

  @OneToMany('BookingSegment', 'booking')
  bookingSegments: any[];
}
