import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('segments')
export class Segment extends BaseEntity {
  @PrimaryColumn({ name: 'segment_id', type: 'varchar', length: 50 })
  segmentId: string;

  @Column({ name: 'trip_id', type: 'varchar', length: 50 })
  tripId: string;

  @ManyToOne('Trip', 'segments', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trip_id' })
  trip: any;

  @Column({ name: 'from_stop_id', type: 'varchar', length: 50 })
  fromStopId: string;

  @ManyToOne('Station')
  @JoinColumn({ name: 'from_stop_id' })
  fromStop: any;

  @Column({
    name: 'from_stop_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  fromStopName: string;

  @Column({ name: 'to_stop_id', type: 'varchar', length: 50 })
  toStopId: string;

  @ManyToOne('Station')
  @JoinColumn({ name: 'to_stop_id' })
  toStop: any;

  @Column({
    name: 'to_stop_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  toStopName: string;

  @Column({ name: 'departure_time', type: 'timestamp' })
  departureTime: Date;

  @Column({ name: 'arrival_time', type: 'timestamp' })
  arrivalTime: Date;

  @Column({ name: 'distance_km', type: 'int', nullable: true })
  distanceKm: number;

  @Column({ name: 'available_seats', type: 'int', default: 0 })
  availableSeats: number;

  @Column({ name: 'total_seats', type: 'int', default: 0 })
  totalSeats: number;

  @Column({ name: 'sequence_number', type: 'int' })
  sequenceNumber: number;

  @Column({ name: 'base_price', type: 'int', default: 0 })
  basePrice: number;

  // From migration 010
  @Column({ type: 'varchar', length: 50, default: 'SCHEDULED' })
  status: string;
}
