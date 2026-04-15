import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import type { Station } from './station.entity';
import type { Segment } from './segment.entity';
import type { Seat } from './seat.entity';

@Entity('trips')
export class Trip extends BaseEntity {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  id: string;

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
    length: 500,
    nullable: true,
  })
  operatorLogo: string;

  @Column({ name: 'vehicle_id', type: 'varchar', length: 50, nullable: true })
  vehicleId: string;

  @ManyToOne('Vehicle', { nullable: true })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: any;

  @Column({
    name: 'vehicle_type',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  vehicleType: string;

  @Column({ name: 'departure_time', type: 'timestamp' })
  departureTime: Date;

  @Column({ name: 'arrival_time', type: 'timestamp' })
  arrivalTime: Date;

  @Column({ name: 'duration_minutes', type: 'int', nullable: true })
  durationMinutes: number;

  @Column({ name: 'base_price', type: 'int' })
  basePrice: number;

  @Column({ type: 'varchar', length: 10, default: 'XOF' })
  currency: string;

  @Column({ name: 'from_station_id', type: 'varchar', length: 50 })
  fromStationId: string;

  @ManyToOne('Station')
  @JoinColumn({ name: 'from_station_id' })
  fromStation: Station;

  @Column({
    name: 'from_station_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  fromStationName: string;

  @Column({ name: 'to_station_id', type: 'varchar', length: 50 })
  toStationId: string;

  @ManyToOne('Station')
  @JoinColumn({ name: 'to_station_id' })
  toStation: Station;

  @Column({
    name: 'to_station_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  toStationName: string;

  @Column({ type: 'text', array: true, default: '{}' })
  amenities: string[];

  @Column({ name: 'has_live_tracking', type: 'boolean', default: false })
  hasLiveTracking: boolean;

  @Column({ name: 'available_seats', type: 'int', default: 0 })
  availableSeats: number;

  @Column({ name: 'total_seats', type: 'int', default: 0 })
  totalSeats: number;

  @Column({
    name: 'service_class',
    type: 'varchar',
    length: 30,
    default: 'standard',
  })
  serviceClass: string;

  @Column({ type: 'varchar', length: 50, default: 'scheduled' })
  status: string;

  // Route / bus info (Societe)
  @Column({ name: 'route_id', type: 'varchar', length: 50, nullable: true })
  routeId: string;

  @Column({ name: 'bus_number', type: 'varchar', length: 50, nullable: true })
  busNumber: string;

  @Column({ name: 'gare_id', type: 'varchar', length: 50, nullable: true })
  gareId: string;

  @Column({ name: 'gare_name', type: 'varchar', length: 255, nullable: true })
  gareName: string;

  // Trip progression
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

  // Promotions
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

  // Driver info (Societe)
  @Column({ name: 'driver_id', type: 'varchar', length: 50, nullable: true })
  driverId: string;

  @Column({
    name: 'driver_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  driverName: string;

  @OneToMany('Segment', 'trip')
  segments: Segment[];

  @OneToMany('Seat', 'trip')
  seats: Seat[];
}
