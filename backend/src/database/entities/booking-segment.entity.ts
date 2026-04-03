import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';

@Entity('booking_segments')
@Unique(['bookingId', 'segmentId'])
export class BookingSegment {
  @PrimaryGeneratedColumn('uuid', { name: 'booking_segment_id' })
  bookingSegmentId: string;

  @Column({ name: 'booking_id', type: 'uuid' })
  bookingId: string;

  @ManyToOne('Booking', 'bookingSegments', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking: any;

  @Column({ name: 'segment_id', type: 'varchar', length: 50 })
  segmentId: string;

  @ManyToOne('Segment', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'segment_id' })
  segment: any;

  @Column({ name: 'seat_id', type: 'uuid', nullable: true })
  seatId: string;

  @ManyToOne('Seat', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'seat_id' })
  seat: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
