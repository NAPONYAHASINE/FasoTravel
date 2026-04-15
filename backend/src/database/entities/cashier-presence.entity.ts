import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';

@Entity('cashier_presences')
@Unique(['userId', 'stationId'])
export class CashierPresence {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne('User', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: any;

  @Column({ name: 'station_id', type: 'varchar', length: 50 })
  stationId: string;

  @ManyToOne('Station', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'station_id' })
  station: any;

  @Column({ name: 'operator_id', type: 'varchar', length: 50 })
  operatorId: string;

  @ManyToOne('Operator', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'operator_id' })
  operator: any;

  @Column({
    name: 'last_ping_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  lastPingAt: Date;

  @Column({ name: 'is_online', type: 'boolean', default: true })
  isOnline: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
