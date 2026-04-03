import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('ticket_transfers')
export class TicketTransfer extends BaseEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'transfer_id' })
  transferId: string;

  @Column({ name: 'ticket_id', type: 'varchar', length: 50 })
  ticketId: string;

  @ManyToOne('Ticket', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticket_id' })
  ticket: any;

  @Column({ name: 'from_user_id', type: 'uuid' })
  fromUserId: string;

  @ManyToOne('User')
  @JoinColumn({ name: 'from_user_id' })
  fromUser: any;

  @Column({ name: 'to_user_id', type: 'uuid', nullable: true })
  toUserId: string;

  @ManyToOne('User', { nullable: true })
  @JoinColumn({ name: 'to_user_id' })
  toUser: any;

  @Column({ type: 'varchar', length: 30, default: 'PENDING' })
  status: string;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @Column({
    name: 'transfer_token',
    type: 'varchar',
    length: 255,
    unique: true,
  })
  transferToken: string;
}
