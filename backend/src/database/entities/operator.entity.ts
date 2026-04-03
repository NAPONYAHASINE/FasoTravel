import { Entity, Column, PrimaryColumn } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('operators')
export class Operator extends BaseEntity {
  @PrimaryColumn({ name: 'operator_id', type: 'varchar', length: 50 })
  operatorId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({
    name: 'operator_logo',
    type: 'varchar',
    length: 10,
    nullable: true,
  })
  operatorLogo: string;

  @Column({ name: 'logo_url', type: 'varchar', length: 500, nullable: true })
  logoUrl: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'phone_number', type: 'varchar', length: 20, nullable: true })
  phoneNumber: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ name: 'website_url', type: 'varchar', length: 500, nullable: true })
  websiteUrl: string;

  @Column({ name: 'founded_year', type: 'int', nullable: true })
  foundedYear: number;

  @Column({ name: 'fleet_size', type: 'int', default: 0 })
  fleetSize: number;

  @Column({ name: 'total_trips', type: 'int', default: 0 })
  totalTrips: number;

  @Column({ type: 'text', array: true, default: '{}' })
  amenities: string[];

  @Column({ type: 'numeric', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ name: 'total_reviews', type: 'int', default: 0 })
  totalReviews: number;

  @Column({ name: 'is_verified', type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({
    name: 'opening_hours',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  openingHours: string;

  @Column({
    name: 'primary_station_id',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  primaryStationId: string;

  @Column({
    name: 'primary_station_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  primaryStationName: string;

  @Column({
    name: 'primary_station_city',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  primaryStationCity: string;

  @Column({ name: 'baggage_price', type: 'int', default: 0 })
  baggagePrice: number;
}
