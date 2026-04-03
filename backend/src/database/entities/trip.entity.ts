import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('trips')
export class Trip extends BaseEntity {
  @PrimaryColumn({ name: 'trip_id', type: 'varchar', length: 50 })
  tripId: string;

  @Column({ name: 'operator_id', type: 'varchar', length: 50 })
  operatorId: string;

  @ManyToOne('Operator', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'operator_id' })
  operator: any;

  @Column({
    name: 'operator_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  operatorName: string;

  @Column({
    name: 'operator_logo',
    type: 'varchar',
    length: 10,
    nullable: true,
  })
  operatorLogo: string;

  @Column({ name: 'vehicle_id', type: 'varchar', length: 50, nullable: true })
  vehicleId: string;

  @ManyToOne('Vehicle', { nullable: true })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: any;

  @Column({ name: 'departure_time', type: 'timestamp' })
  departureTime: Date;

  @Column({ name: 'arrival_time', type: 'timestamp' })
  arrivalTime: Date;

  @Column({ name: 'base_price', type: 'int' })
  basePrice: number;

  @Column({ type: 'varchar', length: 10, default: 'XOF' })
  currency: string;

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

  @Column({ type: 'text', array: true, default: '{}' })
  amenities: string[];

  @Column({ name: 'has_live_tracking', type: 'boolean', default: false })
  hasLiveTracking: boolean;

  @Column({ name: 'available_seats', type: 'int', default: 0 })
  availableSeats: number;

  @Column({ name: 'total_seats', type: 'int', default: 0 })
  totalSeats: number;

  @Column({ name: 'is_cancelled', type: 'boolean', default: false })
  isCancelled: boolean;

  // From migration 010 - trip progression
  @Column({
    name: 'current_segment_id',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  currentSegmentId: string;

  @Column({
    name: 'current_station_id',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  currentStationId: string;

  @Column({ type: 'varchar', length: 50, default: 'SCHEDULED' })
  status: string;

  @Column({ name: 'last_location_update', type: 'timestamp', nullable: true })
  lastLocationUpdate: Date;

  @Column({
    name: 'gps_latitude',
    type: 'numeric',
    precision: 10,
    scale: 8,
    nullable: true,
  })
  gpsLatitude: number;

  @Column({
    name: 'gps_longitude',
    type: 'numeric',
    precision: 11,
    scale: 8,
    nullable: true,
  })
  gpsLongitude: number;

  // From migration 013 - promotions
  @Column({
    name: 'promotion_id',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  promotionId: string;

  @ManyToOne('Promotion', { nullable: true })
  @JoinColumn({ name: 'promotion_id' })
  promotion: any;

  @Column({ name: 'promoted_price', type: 'int', nullable: true })
  promotedPrice: number;

  @Column({
    name: 'discount_percentage',
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  discountPercentage: number;

  @OneToMany('Segment', 'trip')
  segments: any[];

  @OneToMany('Seat', 'trip')
  seats: any[];
}
