import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('stations')
export class Station extends BaseEntity {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 100 })
  city: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  region: string;

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

  @Column({
    name: 'contact_person',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  contactPerson: string;

  @Column({ type: 'int', nullable: true })
  capacity: number;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: string;

  @Column({ name: 'manager_id', type: 'varchar', length: 50, nullable: true })
  managerId: string;

  @Column({
    name: 'manager_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  managerName: string;

  @Column({ name: 'baggage_price', type: 'int', nullable: true })
  baggagePrice: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;
}
