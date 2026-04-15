import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('support_tickets')
export class SupportTicket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'user_name', type: 'varchar', length: 255, nullable: true })
  userName: string;

  @Column({
    name: 'user_type',
    type: 'varchar',
    length: 20,
    default: 'passenger',
  })
  userType: string;

  @Column({
    name: 'company_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  companyName: string;

  @Column({ type: 'varchar', length: 255 })
  subject: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', length: 50, default: 'other' })
  category: string;

  @Column({ type: 'varchar', length: 20, default: 'medium' })
  priority: string;

  @Column({ type: 'varchar', length: 20, default: 'open' })
  status: string;

  @Column({ name: 'assigned_to', type: 'varchar', length: 255, nullable: true })
  assignedTo: string;

  @Column({
    name: 'assigned_to_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  assignedToName: string;

  @Column({ type: 'jsonb', nullable: true })
  replies: Array<{
    id: string;
    authorId: string;
    authorName: string;
    authorRole: string;
    message: string;
    createdAt: string;
  }>;

  @Column({ name: 'resolved_at', type: 'timestamp', nullable: true })
  resolvedAt: Date;

  @Column({ type: 'text', nullable: true })
  resolution: string;

  @Column({ type: 'jsonb', nullable: true })
  attachments: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
