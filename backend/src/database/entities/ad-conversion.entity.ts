import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('ad_conversions')
export class AdConversion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'ad_id', type: 'uuid' })
  adId: string;

  @ManyToOne('Advertisement', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ad_id' })
  ad: any;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({
    name: 'conversion_type',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  conversionType: string;

  @Column({ name: 'revenue_fcfa', type: 'int', nullable: true })
  revenueFcfa: number;

  @Column({ name: 'booking_id', type: 'uuid', nullable: true })
  bookingId: string;

  @Column({ type: 'timestamp', default: () => 'NOW()' })
  timestamp: Date;
}
