import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('trip_schedules')
export class TripSchedule extends BaseEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'schedule_id' })
  scheduleId: string;

  @Column({ name: 'operator_id', type: 'varchar', length: 50 })
  operatorId: string;

  @ManyToOne('Operator', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'operator_id' })
  operator: any;

  @Column({ name: 'vehicle_id', type: 'varchar', length: 50, nullable: true })
  vehicleId: string;

  @ManyToOne('Vehicle', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: any;

  @Column({ name: 'from_stop_id', type: 'varchar', length: 50 })
  fromStopId: string;

  @ManyToOne('Station', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'from_stop_id' })
  fromStop: any;

  @Column({ name: 'to_stop_id', type: 'varchar', length: 50 })
  toStopId: string;

  @ManyToOne('Station', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'to_stop_id' })
  toStop: any;

  @Column({ name: 'departure_time', type: 'time' })
  departureTime: string;

  @Column({ name: 'duration_minutes', type: 'int', nullable: true })
  durationMinutes: number;

  @Column({ name: 'base_price', type: 'numeric', precision: 10, scale: 2 })
  basePrice: number;

  @Column({ name: 'recurrence_pattern', type: 'varchar', length: 50 })
  recurrencePattern: string;

  @Column({ name: 'days_of_week', type: 'int', default: 127 })
  daysOfWeek: number;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: Date;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'created_by_user_id', type: 'uuid', nullable: true })
  createdByUserId: string;

  @ManyToOne('User', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by_user_id' })
  createdByUser: any;
}
