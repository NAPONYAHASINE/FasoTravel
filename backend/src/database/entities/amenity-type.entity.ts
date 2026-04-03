import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('amenity_types')
export class AmenityType {
  @PrimaryColumn({ name: 'amenity_id', type: 'varchar', length: 50 })
  amenityId: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  icon: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  category: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'is_available', type: 'boolean', default: true })
  isAvailable: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
