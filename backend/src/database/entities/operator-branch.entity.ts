import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('operator_branches')
export class OperatorBranch extends BaseEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'branch_id' })
  branchId: string;

  @Column({ name: 'operator_id', type: 'varchar', length: 50 })
  operatorId: string;

  @ManyToOne('Operator', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'operator_id' })
  operator: any;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'station_id', type: 'varchar', length: 50, nullable: true })
  stationId: string;

  @ManyToOne('Station', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'station_id' })
  station: any;

  @Column({ name: 'phone_number', type: 'varchar', length: 20, nullable: true })
  phoneNumber: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ name: 'manager_user_id', type: 'uuid', nullable: true })
  managerUserId: string;

  @ManyToOne('User', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'manager_user_id' })
  managerUser: any;

  @Column({ type: 'varchar', length: 500, nullable: true })
  address: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string;

  @Column({ type: 'numeric', precision: 10, scale: 8, nullable: true })
  latitude: number;

  @Column({ type: 'numeric', precision: 11, scale: 8, nullable: true })
  longitude: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
