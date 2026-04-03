import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('ad_impressions')
export class AdImpression {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'ad_id', type: 'uuid' })
  adId: string;

  @ManyToOne('Advertisement', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ad_id' })
  ad: any;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  page: string;

  @Column({ name: 'device_type', type: 'varchar', length: 20, nullable: true })
  deviceType: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string;

  @Column({ type: 'timestamp', default: () => 'NOW()' })
  timestamp: Date;
}
