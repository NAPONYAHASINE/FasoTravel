import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity('vehicle_amenities')
export class VehicleAmenity {
  @PrimaryColumn({ name: 'vehicle_id', type: 'varchar', length: 50 })
  vehicleId: string;

  @PrimaryColumn({ name: 'amenity_id', type: 'varchar', length: 50 })
  amenityId: string;

  @ManyToOne('Vehicle', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: any;

  @ManyToOne('AmenityType', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'amenity_id' })
  amenity: any;

  @Column({
    name: 'added_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  addedAt: Date;
}
