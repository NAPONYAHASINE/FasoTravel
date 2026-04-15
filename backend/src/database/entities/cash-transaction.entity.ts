import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('cash_transactions')
export class CashTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'operator_id', type: 'varchar', length: 50 })
  operatorId: string;

  @Column({ name: 'cashier_id', type: 'uuid' })
  cashierId: string;

  @Column({ name: 'station_id', type: 'varchar', length: 50, nullable: true })
  stationId: string;

  @Column({ name: 'ticket_id', type: 'uuid', nullable: true })
  ticketId: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'sale',
    comment: 'sale | refund | adjustment',
  })
  type: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 10, default: 'XOF' })
  currency: string;

  @Column({
    name: 'payment_method',
    type: 'varchar',
    length: 30,
    default: 'cash',
  })
  paymentMethod: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
