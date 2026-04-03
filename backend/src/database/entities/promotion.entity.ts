import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('promotions')
export class Promotion extends BaseEntity {
  @PrimaryColumn({ name: 'promotion_id', type: 'varchar', length: 100 })
  promotionId: string;

  @Column({ name: 'operator_id', type: 'varchar', length: 50 })
  operatorId: string;

  @ManyToOne('Operator', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'operator_id' })
  operator: any;

  @Column({ name: 'trip_id', type: 'varchar', length: 50, nullable: true })
  tripId: string;

  @ManyToOne('Trip', { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trip_id' })
  trip: any;

  @Column({ name: 'promotion_name', type: 'varchar', length: 255 })
  promotionName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    name: 'discount_type',
    type: 'varchar',
    length: 20,
    default: 'PERCENTAGE',
  })
  discountType: string;

  @Column({ name: 'discount_value', type: 'numeric', precision: 10, scale: 2 })
  discountValue: number;

  @Column({ name: 'start_date', type: 'timestamp' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'timestamp' })
  endDate: Date;

  @Column({ name: 'max_uses', type: 'int', nullable: true })
  maxUses: number;

  @Column({ name: 'uses_count', type: 'int', default: 0 })
  usesCount: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
