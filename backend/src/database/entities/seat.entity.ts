import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SeatStatus } from '../../common/constants';

@Entity('seats')
export class Seat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'trip_id', type: 'varchar', length: 50 })
  tripId: string;

  @ManyToOne('Trip', 'seats', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trip_id' })
  trip: any;

  @Column({ name: 'seat_number', type: 'varchar', length: 10 })
  seatNumber: string;

  @Column({ type: 'varchar', length: 30, default: SeatStatus.AVAILABLE })
  status: string;

  @Column({ name: 'booked_by_user_id', type: 'uuid', nullable: true })
  bookedByUserId: string;

  @ManyToOne('User', { nullable: true })
  @JoinColumn({ name: 'booked_by_user_id' })
  bookedByUser: any;

  @Column({ name: 'hold_expires_at', type: 'timestamp', nullable: true })
  holdExpiresAt: Date;

  // From migration 009
  @Column({ name: 'segment_id', type: 'varchar', length: 50, nullable: true })
  segmentId: string;

  @ManyToOne('Segment', { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'segment_id' })
  segment: any;

  // From migration 010
  @Column({ name: 'booked_by_booking_id', type: 'uuid', nullable: true })
  bookedByBookingId: string;

  @ManyToOne('Booking', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'booked_by_booking_id' })
  bookedByBooking: any;
}
