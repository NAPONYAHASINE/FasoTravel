import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('price_segments')
export class PriceSegment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'operator_id', type: 'varchar', length: 50 })
  operatorId: string;

  @ManyToOne('Operator', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'operator_id' })
  operator: any;

  @Column({ name: 'route_id', type: 'varchar', length: 100, nullable: true })
  routeId: string;

  @ManyToOne('Route', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'route_id' })
  route: any;

  @Column({ name: 'from_station_id', type: 'varchar', length: 50 })
  fromStationId: string;

  @Column({ name: 'to_station_id', type: 'varchar', length: 50 })
  toStationId: string;

  @Column({ type: 'varchar', length: 255 })
  label: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'varchar', length: 10, default: 'XOF' })
  currency: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
