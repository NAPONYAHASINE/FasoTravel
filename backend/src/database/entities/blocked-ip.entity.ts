import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('blocked_ips')
export class BlockedIp {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, unique: true })
  ipAddress: string;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ name: 'blocked_by', type: 'uuid', nullable: true })
  blockedBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
