import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('api_keys')
export class ApiKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'operator_id', type: 'uuid' })
  operatorId: string;

  @ManyToOne('Operator', { nullable: false })
  @JoinColumn({ name: 'operator_id' })
  operator: any;

  @Column({ name: 'key_hash', type: 'varchar', length: 255, unique: true })
  keyHash: string;

  @Column({ name: 'key_prefix', type: 'varchar', length: 12 })
  keyPrefix: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({
    type: 'simple-array',
    nullable: true,
  })
  scopes: string[]; // e.g. ['trips:read', 'trips:write', 'tickets:read', ...]

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt: Date;

  @Column({ name: 'last_used_at', type: 'timestamp', nullable: true })
  lastUsedAt: Date;

  @Column({ name: 'rate_limit', type: 'int', default: 100 })
  rateLimit: number; // requests per minute

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
