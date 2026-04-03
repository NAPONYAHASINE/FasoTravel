import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('seat_map_configs')
export class SeatMapConfig extends BaseEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'config_id' })
  configId: string;

  @Column({ type: 'int' })
  rows: number;

  @Column({ name: 'seats_per_row', type: 'int' })
  seatsPerRow: number;

  @Column({ name: 'aisle_after', type: 'int', nullable: true })
  aisleAfter: number;

  @Column({ name: 'total_seats', type: 'int' })
  totalSeats: number;

  @Column({ type: 'jsonb', nullable: true })
  layout: Record<string, any>;
}
