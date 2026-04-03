import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('stations')
export class Station extends BaseEntity {
  @PrimaryColumn({ name: 'station_id', type: 'varchar', length: 50 })
  stationId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 100 })
  city: string;

  @Column({ type: 'numeric', precision: 10, scale: 8, nullable: true })
  latitude: number;

  @Column({ type: 'numeric', precision: 11, scale: 8, nullable: true })
  longitude: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  address: string;

  @Column({ name: 'operator_id', type: 'varchar', length: 50, nullable: true })
  operatorId: string;

  @ManyToOne('Operator', { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'operator_id' })
  operator: any;

  @Column({ type: 'text', array: true, default: '{}' })
  amenities: string[];

  @Column({
    name: 'opening_hours',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  openingHours: string;

  @Column({
    name: 'contact_phone',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  contactPhone: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
