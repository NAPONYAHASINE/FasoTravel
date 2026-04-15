import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('operator_policies')
export class OperatorPolicy {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  id: string;

  @Column({ name: 'operator_id', type: 'varchar', length: 50 })
  operatorId: string;

  @ManyToOne('Operator', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'operator_id' })
  operator: any;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  type: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  icon: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
