import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';

/**
 * Route entity - Stores cached route geometry between station pairs.
 *
 * GOOGLE MAPS RULE 1: Route itineraries are calculated ONCE
 * via Directions API and stored. All future trips on the same
 * station pair reuse the cached geometry (encoded polyline + waypoints).
 */
@Entity('routes')
export class Route extends BaseEntity {
  @PrimaryColumn({ type: 'varchar', length: 100 })
  id: string;

  @Column({ name: 'from_station_id', type: 'varchar', length: 50 })
  fromStationId: string;

  @ManyToOne('Station')
  @JoinColumn({ name: 'from_station_id' })
  fromStation: any;

  @Column({ name: 'to_station_id', type: 'varchar', length: 50 })
  toStationId: string;

  @ManyToOne('Station')
  @JoinColumn({ name: 'to_station_id' })
  toStation: any;

  /** Google Directions API encoded polyline string */
  @Column({ name: 'encoded_polyline', type: 'text', nullable: true })
  encodedPolyline: string;

  /**
   * Waypoints (stations/stops) along the route.
   * Format: [{ lat, lng, name, type: 'start'|'stop'|'end' }]
   */
  @Column({ type: 'jsonb', nullable: true })
  waypoints: { lat: number; lng: number; name: string; type: string }[];

  @Column({ name: 'total_distance_km', type: 'int', nullable: true })
  totalDistanceKm: number;

  @Column({ name: 'total_duration_minutes', type: 'int', nullable: true })
  totalDurationMinutes: number;

  /** When the geometry was last refreshed from Google Directions API */
  @Column({ name: 'last_fetched_at', type: 'timestamp', nullable: true })
  lastFetchedAt: Date;
}
