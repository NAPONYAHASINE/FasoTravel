import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('vehicles')
export class Vehicle extends BaseEntity {
  @PrimaryColumn({ name: 'vehicle_id', type: 'varchar', length: 50 })
  vehicleId: string;

  @Column({ name: 'operator_id', type: 'varchar', length: 50 })
  operatorId: string;

  @ManyToOne('Operator', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'operator_id' })
  operator: any;

  @Column({ type: 'varchar', length: 50 })
  type: string;

  @Column({
    name: 'registration_number',
    type: 'varchar',
    length: 50,
    unique: true,
  })
  registrationNumber: string;

  @Column({ name: 'seat_map_config_id', type: 'uuid', nullable: true })
  seatMapConfigId: string;

  @ManyToOne('SeatMapConfig', { nullable: true })
  @JoinColumn({ name: 'seat_map_config_id' })
  seatMapConfig: any;

  @Column({ type: 'text', array: true, default: '{}' })
  amenities: string[];

  @Column({
    name: 'accessibility_features',
    type: 'text',
    array: true,
    default: '{}',
  })
  accessibilityFeatures: string[];
}
