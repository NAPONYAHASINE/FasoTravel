import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { TicketStatus } from '../../common/constants';

@Entity('tickets')
export class Ticket extends BaseEntity {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  id: string;

  @Column({ name: 'bundle_id', type: 'uuid', nullable: true })
  bundleId: string;

  @Column({ name: 'trip_id', type: 'varchar', length: 50 })
  tripId: string;

  @ManyToOne('Trip')
  @JoinColumn({ name: 'trip_id' })
  trip: any;

  @Column({ name: 'booking_id', type: 'uuid', nullable: true })
  bookingId: string;

  @ManyToOne('Booking', 'tickets', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking: any;

  @Column({ name: 'operator_id', type: 'varchar', length: 50 })
  operatorId: string;

  @ManyToOne('Operator')
  @JoinColumn({ name: 'operator_id' })
  operator: any;

  @Column({ name: 'passenger_name', type: 'varchar', length: 255 })
  passengerName: string;

  @Column({
    name: 'passenger_phone',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  passengerPhone: string;

  @Column({
    name: 'passenger_email',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  passengerEmail: string;

  @Column({ name: 'seat_number', type: 'varchar', length: 10, nullable: true })
  seatNumber: string;

  @Column({ type: 'varchar', length: 30, default: TicketStatus.ACTIVE })
  status: string;

  @Column({ name: 'qr_code', type: 'text', unique: true, nullable: true })
  qrCode: string;

  @Column({
    name: 'alphanumeric_code',
    type: 'varchar',
    length: 20,
    unique: true,
    nullable: true,
  })
  alphanumericCode: string;

  @Column({ type: 'int' })
  price: number;

  @Column({
    name: 'payment_method',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  paymentMethod: string;

  @Column({ name: 'purchased_by_user_id', type: 'uuid', nullable: true })
  purchasedByUserId: string;

  @ManyToOne('User', { nullable: true })
  @JoinColumn({ name: 'purchased_by_user_id' })
  purchasedByUser: any;

  @Column({ name: 'purchased_at', type: 'timestamp', nullable: true })
  purchasedAt: Date;

  @Column({ name: 'checked_in_at', type: 'timestamp', nullable: true })
  checkedInAt: Date;

  @Column({ name: 'boarded_at', type: 'timestamp', nullable: true })
  boardedAt: Date;

  @Column({ name: 'cancelled_at', type: 'timestamp', nullable: true })
  cancelledAt: Date;

  @Column({ name: 'is_transferred', type: 'boolean', default: false })
  isTransferred: boolean;

  @Column({
    name: 'original_ticket_id',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  originalTicketId: string;

  // Journey details (denormalized for ticket display)
  @Column({
    name: 'from_station_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  fromStationName: string;

  @Column({
    name: 'to_station_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  toStationName: string;

  @Column({ name: 'departure_time', type: 'timestamp', nullable: true })
  departureTime: Date;

  @Column({ name: 'arrival_time', type: 'timestamp', nullable: true })
  arrivalTime: Date;

  @Column({ type: 'varchar', length: 10, default: 'XOF' })
  currency: string;

  @Column({ name: 'can_cancel', type: 'boolean', default: true })
  canCancel: boolean;

  @Column({ name: 'can_transfer', type: 'boolean', default: true })
  canTransfer: boolean;

  // Societe counter-sale fields
  @Column({
    name: 'sales_channel',
    type: 'varchar',
    length: 30,
    nullable: true,
  })
  salesChannel: string;

  @Column({ name: 'cashier_id', type: 'uuid', nullable: true })
  cashierId: string;

  @Column({
    name: 'cashier_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  cashierName: string;

  @Column({ name: 'gare_id', type: 'varchar', length: 50, nullable: true })
  gareId: string;

  @Column({ type: 'int', nullable: true })
  commission: number;
}
