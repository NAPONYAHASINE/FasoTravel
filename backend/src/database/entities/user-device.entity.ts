import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('user_devices')
export class UserDevice {
  @PrimaryColumn({ name: 'device_id', type: 'varchar', length: 255 })
  deviceId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne('User', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: any;

  @Column({ name: 'push_token', type: 'varchar', length: 500, nullable: true })
  pushToken: string;

  @Column({
    name: 'device_type',
    type: 'varchar',
    length: 20,
    default: 'MOBILE_WEB',
  })
  deviceType: string;

  @Column({ name: 'app_version', type: 'varchar', length: 20, nullable: true })
  appVersion: string;

  @Column({ name: 'os_version', type: 'varchar', length: 50, nullable: true })
  osVersion: string;

  @Column({
    name: 'last_active',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  lastActive: Date;

  @Column({ name: 'push_enabled', type: 'boolean', default: true })
  pushEnabled: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
