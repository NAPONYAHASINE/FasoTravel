import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from './base.entity';

/**
 * Incident entity — reported by passengers or operators.
 *
 * Frontend sources:
 * - Mobile: POST /incidents (passenger reports during trip)
 * - Admin: GET/PUT /incidents, POST /incidents/:id/resolve, POST /incidents/:id/notify
 * - Societe: GET /incidents (filtered by gareId), validate/reject workflow
 */
@Entity('incidents')
export class Incident extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ---- Trip context ----

  @Column({ name: 'trip_id', type: 'varchar', length: 50, nullable: true })
  tripId: string;

  @ManyToOne('Trip', { nullable: true })
  @JoinColumn({ name: 'trip_id' })
  trip: any;

  @Column({
    name: 'trip_route',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  tripRoute: string;

  @Column({
    name: 'trip_departure_time',
    type: 'timestamp',
    nullable: true,
  })
  tripDepartureTime: Date;

  // ---- Station/Company context ----

  @Column({ name: 'gare_id', type: 'varchar', length: 50, nullable: true })
  gareId: string;

  @Column({ name: 'gare_name', type: 'varchar', length: 255, nullable: true })
  gareName: string;

  @Column({
    name: 'company_id',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  companyId: string;

  @Column({
    name: 'company_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  companyName: string;

  // ---- Incident details ----

  @Column({
    type: 'varchar',
    length: 30,
    default: 'other',
  })
  type: string; // accident | delay | cancellation | mechanical | other

  @Column({
    type: 'varchar',
    length: 20,
    default: 'medium',
  })
  severity: string; // low | medium | high | critical

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  // ---- Location (from passenger GPS) ----

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 8,
    nullable: true,
  })
  latitude: number;

  @Column({
    type: 'numeric',
    precision: 11,
    scale: 8,
    nullable: true,
  })
  longitude: number;

  // ---- Status tracking ----

  @Column({
    type: 'varchar',
    length: 30,
    default: 'open',
  })
  status: string; // open | in-progress | resolved

  // ---- Reporter info ----

  @Column({
    name: 'reporter_type',
    type: 'varchar',
    length: 20,
    default: 'passenger',
  })
  reporterType: string; // passenger | company

  @Column({ name: 'reported_by', type: 'uuid', nullable: true })
  reportedBy: string;

  @ManyToOne('User', { nullable: true })
  @JoinColumn({ name: 'reported_by' })
  reportedByUser: any;

  @Column({
    name: 'reported_by_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  reportedByName: string;

  @Column({
    name: 'reported_by_phone',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  reportedByPhone: string;

  // ---- Resolution ----

  @Column({
    name: 'passengers_affected',
    type: 'int',
    nullable: true,
  })
  passengersAffected: number;

  @Column({ name: 'resolved_by', type: 'uuid', nullable: true })
  resolvedBy: string;

  @Column({
    name: 'resolved_by_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  resolvedByName: string;

  @Column({
    name: 'resolved_at',
    type: 'timestamp',
    nullable: true,
  })
  resolvedAt: Date;

  // ---- Societe validation workflow ----

  @Column({
    name: 'validation_status',
    type: 'varchar',
    length: 20,
    default: 'pending',
  })
  validationStatus: string; // pending | validated | rejected

  @Column({
    name: 'validated_by',
    type: 'uuid',
    nullable: true,
  })
  validatedBy: string;

  @Column({
    name: 'validated_at',
    type: 'timestamp',
    nullable: true,
  })
  validatedAt: Date;

  @Column({
    name: 'validation_comment',
    type: 'text',
    nullable: true,
  })
  validationComment: string;

  // ---- Assignment ----

  @Column({ name: 'assigned_to', type: 'uuid', nullable: true })
  assignedTo: string;

  @Column({
    name: 'assigned_to_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  assignedToName: string;
}
