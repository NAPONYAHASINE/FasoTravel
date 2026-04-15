import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Operator } from './operator.entity';

@Entity('user_operator_roles')
@Unique(['userId', 'operatorId'])
export class UserOperatorRole {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'operator_id', type: 'varchar', length: 50 })
  operatorId: string;

  @ManyToOne(() => Operator, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'operator_id' })
  operator: Operator;

  @Column({ type: 'varchar', length: 50 })
  role: string;

  @Column({
    name: 'assigned_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  assignedAt: Date;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string;
}
