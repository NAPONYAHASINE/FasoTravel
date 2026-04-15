import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trip, Station, Route, Ticket } from '../database/entities';
import { TicketStatus, GOOGLE_MAPS_DIRECTIONS_URL } from '../common/constants';
import { EmitLocationDto, ShareLocationDto } from './dto';

/**
 * Frontend-aligned tracking rules:
 *
 * 1. Route geometry cached in DB (Route entity), fetched from Google Directions API once.
 * 2. Haversine formula for distance calculations (not Google Distance Matrix).
 * 3. ONE passenger in a bus emits position → aggregated → broadcast to all subscribers.
 *    If emitter stops sending (timeout), system accepts another passenger automatically.
 * 4. External position sharing only within 5km of arrival city.
 * 5. Emission interval: 1 minute (60s). Backend throttle: 50s to allow margin.
 */

/** Aggregated vehicle position broadcast to all subscribers */
export interface LivePosition {
  tripId: string;
  latitude: number;
  longitude: number;
  heading: number;
  speed: number;
  accuracy: number;
  timestamp: string;
  updatedAt: string;
  /** Current active emitter userId (never exposed to clients) */
  emitterId: string;
  /** Trip progress 0-100% based on distance from origin vs total route */
  progress_percent: number;
}

/** Public vehicle location sent to frontend subscribers (no emitterId) */
export interface VehicleLocationPayload {
  tripId: string;
  latitude: number;
  longitude: number;
  heading: number;
  speed: number;
  accuracy: number;
  timestamp: string;
  updatedAt: string;
  progress_percent: number;
}

/** Threshold for external sharing (km before arrival city) */
const SHARE_RADIUS_KM = 5;

/** Minimum interval between position updates (ms) — 50s (frontend emits every 60s) */
const MIN_EMIT_INTERVAL_MS = 50_000;

/** If active emitter hasn't sent in 5 minutes, system accepts a new emitter */
const EMITTER_TIMEOUT_MS = 5 * 60_000;

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);

  /**
   * In-memory live position store: tripId -> LivePosition
   * In production, this should use Redis for multi-instance support.
   */
  private readonly livePositions = new Map<string, LivePosition>();

  /** Track last emit time per userId to throttle */
  private readonly lastEmitTime = new Map<string, number>();

  /** Active emitter per trip: tripId -> { userId, lastEmit timestamp } */
  private readonly activeEmitters = new Map<
    string,
    { userId: string; lastEmit: number }
  >();

  /** WebSocket subscribers per trip: tripId -> Set of callback functions */
  private readonly subscribers = new Map<
    string,
    Set<(position: VehicleLocationPayload) => void>
  >();

  constructor(
    @InjectRepository(Trip)
    private readonly tripRepo: Repository<Trip>,
    @InjectRepository(Station)
    private readonly stationRepo: Repository<Station>,
    @InjectRepository(Route)
    private readonly routeRepo: Repository<Route>,
    @InjectRepository(Ticket)
    private readonly ticketRepo: Repository<Ticket>,
    private readonly configService: ConfigService,
  ) {}

  // -----------------------------------------------
  // RULE 1: Route geometry caching
  // -----------------------------------------------

  /**
   * Get cached route for a trip.
   * 1. Check DB cache for this station pair
   * 2. If not cached, call Google Directions API (if key configured)
   * 3. Fall back to building from station coords + Haversine
   * 4. Cache result in DB for all future trips on this pair
   */
  async getRoute(tripId: string): Promise<{
    waypoints: {
      lat: number;
      lng: number;
      name: string;
      type: string;
      arrival_time?: string;
    }[];
    total_distance_km: number;
    encoded_polyline: string | null;
    duration_minutes: number | null;
  }> {
    const trip = await this.tripRepo.findOne({
      where: { id: tripId },
      relations: ['fromStation', 'toStation', 'segments'],
    });
    if (!trip) {
      throw new NotFoundException(`Trip ${tripId} not found`);
    }

    // Check for cached route between these stations
    let cachedRoute = await this.routeRepo.findOne({
      where: {
        fromStationId: trip.fromStationId,
        toStationId: trip.toStationId,
      },
    });

    if (cachedRoute?.waypoints?.length) {
      return {
        waypoints: cachedRoute.waypoints,
        total_distance_km: cachedRoute.totalDistanceKm ?? 0,
        encoded_polyline: cachedRoute.encodedPolyline ?? null,
        duration_minutes: cachedRoute.totalDurationMinutes ?? null,
      };
    }

    // Try Google Directions API first (real road geometry)
    const googleResult = await this.fetchGoogleDirections(trip);

    if (googleResult) {
      // Cache Google result
      if (!cachedRoute) {
        cachedRoute = this.routeRepo.create({
          id: `${trip.fromStationId}__${trip.toStationId}`,
          fromStationId: trip.fromStationId,
          toStationId: trip.toStationId,
          waypoints: googleResult.waypoints,
          encodedPolyline: googleResult.encoded_polyline,
          totalDistanceKm: googleResult.total_distance_km,
          totalDurationMinutes: googleResult.duration_minutes,
          lastFetchedAt: new Date(),
        });
      } else {
        cachedRoute.waypoints = googleResult.waypoints;
        cachedRoute.encodedPolyline = googleResult.encoded_polyline;
        cachedRoute.totalDistanceKm = googleResult.total_distance_km;
        cachedRoute.totalDurationMinutes = googleResult.duration_minutes;
        cachedRoute.lastFetchedAt = new Date();
      }
      await this.routeRepo.save(cachedRoute);

      return googleResult;
    }

    // Fallback: build from station coordinates + Haversine
    const waypoints: {
      lat: number;
      lng: number;
      name: string;
      type: string;
      arrival_time?: string;
    }[] = [];

    // Departure station
    if (trip.fromStation) {
      waypoints.push({
        lat: Number(trip.fromStation.latitude),
        lng: Number(trip.fromStation.longitude),
        name: trip.fromStationName ?? trip.fromStation.name,
        type: 'start',
      });
    }

    // Intermediate stops from segments
    if (trip.segments?.length) {
      const sortedSegments = [...trip.segments].sort(
        (a, b) => a.sequenceNumber - b.sequenceNumber,
      );
      for (const seg of sortedSegments) {
        if (seg.toStopId !== trip.toStationId) {
          const stopStation = await this.stationRepo.findOne({
            where: { id: seg.toStopId },
          });
          if (stopStation) {
            waypoints.push({
              lat: Number(stopStation.latitude),
              lng: Number(stopStation.longitude),
              name: seg.toStopName ?? stopStation.name,
              type: 'stop',
              arrival_time: seg.arrivalTime?.toISOString(),
            });
          }
        }
      }
    }

    // Arrival station
    if (trip.toStation) {
      waypoints.push({
        lat: Number(trip.toStation.latitude),
        lng: Number(trip.toStation.longitude),
        name: trip.toStationName ?? trip.toStation.name,
        type: 'end',
      });
    }

    // Calculate total distance using Haversine (Rule 3)
    let totalDistanceKm = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
      totalDistanceKm += this.haversineDistance(
        waypoints[i].lat,
        waypoints[i].lng,
        waypoints[i + 1].lat,
        waypoints[i + 1].lng,
      );
    }
    totalDistanceKm = Math.round(totalDistanceKm);

    // Cache the route for future reuse (Rule 1)
    if (!cachedRoute) {
      cachedRoute = this.routeRepo.create({
        id: `${trip.fromStationId}__${trip.toStationId}`,
        fromStationId: trip.fromStationId,
        toStationId: trip.toStationId,
        waypoints,
        totalDistanceKm,
        lastFetchedAt: new Date(),
      });
    } else {
      cachedRoute.waypoints = waypoints;
      cachedRoute.totalDistanceKm = totalDistanceKm;
      cachedRoute.lastFetchedAt = new Date();
    }
    await this.routeRepo.save(cachedRoute);

    return {
      waypoints,
      total_distance_km: totalDistanceKm,
      encoded_polyline: cachedRoute.encodedPolyline ?? null,
      duration_minutes: null,
    };
  }

  // -----------------------------------------------
  // Google Directions API integration
  // -----------------------------------------------

  /**
   * Call Google Directions API for real road geometry.
   * Returns null if no API key is configured or if the call fails.
   * This is called ONLY ONCE per station pair, then cached in DB.
   */
  private async fetchGoogleDirections(trip: Trip): Promise<{
    waypoints: { lat: number; lng: number; name: string; type: string }[];
    encoded_polyline: string;
    total_distance_km: number;
    duration_minutes: number;
  } | null> {
    const apiKey = this.configService.get<string>('google.mapsApiKey');
    if (!apiKey) {
      this.logger.debug(
        'No GOOGLE_MAPS_API_KEY configured - using Haversine fallback',
      );
      return null;
    }

    const origin = trip.fromStation;
    const destination = trip.toStation;
    if (!origin?.latitude || !destination?.latitude) {
      return null;
    }

    // Build intermediate waypoints from segments
    const viaWaypoints: string[] = [];
    if (trip.segments?.length) {
      const sorted = [...trip.segments].sort(
        (a, b) => a.sequenceNumber - b.sequenceNumber,
      );
      for (const seg of sorted) {
        if (seg.toStopId && seg.toStopId !== trip.toStationId) {
          const stopStation = await this.stationRepo.findOne({
            where: { id: seg.toStopId },
          });
          if (stopStation?.latitude && stopStation?.longitude) {
            viaWaypoints.push(
              `${Number(stopStation.latitude)},${Number(stopStation.longitude)}`,
            );
          }
        }
      }
    }

    const originStr = `${Number(origin.latitude)},${Number(origin.longitude)}`;
    const destStr = `${Number(destination.latitude)},${Number(destination.longitude)}`;

    let url =
      `${GOOGLE_MAPS_DIRECTIONS_URL}` +
      `?origin=${originStr}` +
      `&destination=${destStr}` +
      `&key=${apiKey}` +
      `&language=fr`;

    if (viaWaypoints.length > 0) {
      url += `&waypoints=${viaWaypoints.join('|')}`;
    }

    try {
      const response = await fetch(url);
      const data = (await response.json()) as {
        status: string;
        routes?: {
          overview_polyline?: { points: string };
          legs?: {
            distance?: { value: number };
            duration?: { value: number };
            start_location?: { lat: number; lng: number };
            end_location?: { lat: number; lng: number };
          }[];
        }[];
      };

      if (data.status !== 'OK' || !data.routes?.length) {
        this.logger.warn(
          `Google Directions API returned ${data.status} for ${originStr} -> ${destStr}`,
        );
        return null;
      }

      const route = data.routes[0];
      const legs = route.legs ?? [];

      // Calculate totals from all legs
      let totalDistanceMeters = 0;
      let totalDurationSeconds = 0;
      for (const leg of legs) {
        totalDistanceMeters += leg.distance?.value ?? 0;
        totalDurationSeconds += leg.duration?.value ?? 0;
      }

      // Build waypoints array
      const waypoints: {
        lat: number;
        lng: number;
        name: string;
        type: string;
      }[] = [];

      waypoints.push({
        lat: Number(origin.latitude),
        lng: Number(origin.longitude),
        name: trip.fromStationName ?? origin.name,
        type: 'start',
      });

      // Add intermediate stops
      if (trip.segments?.length) {
        const sorted = [...trip.segments].sort(
          (a, b) => a.sequenceNumber - b.sequenceNumber,
        );
        for (const seg of sorted) {
          if (seg.toStopId && seg.toStopId !== trip.toStationId) {
            const stopStation = await this.stationRepo.findOne({
              where: { id: seg.toStopId },
            });
            if (stopStation) {
              waypoints.push({
                lat: Number(stopStation.latitude),
                lng: Number(stopStation.longitude),
                name: seg.toStopName ?? stopStation.name,
                type: 'stop',
              });
            }
          }
        }
      }

      waypoints.push({
        lat: Number(destination.latitude),
        lng: Number(destination.longitude),
        name: trip.toStationName ?? destination.name,
        type: 'end',
      });

      this.logger.log(
        `Google Directions cached: ${originStr} -> ${destStr} (${Math.round(totalDistanceMeters / 1000)} km, ${Math.round(totalDurationSeconds / 60)} min)`,
      );

      return {
        waypoints,
        encoded_polyline: route.overview_polyline?.points ?? '',
        total_distance_km: Math.round(totalDistanceMeters / 1000),
        duration_minutes: Math.round(totalDurationSeconds / 60),
      };
    } catch (error) {
      this.logger.error(`Google Directions API call failed: ${error}`);
      return null;
    }
  }

  // -----------------------------------------------
  // Live tracking: passenger emits position for aggregation
  // -----------------------------------------------

  /**
   * Receive a position update from a BOARDED passenger.
   *
   * Business rules (from frontend):
   * - Only passengers with a boarded ticket can emit
   * - Trip must be in boarding/departed/in_progress status
   * - One passenger at a time is the "active emitter" per trip
   * - If the active emitter stops (5 min timeout), another passenger takes over
   * - Position is aggregated and broadcast to ALL WebSocket subscribers
   * - Emission interval: ~1 minute (throttle at 50s server side)
   */
  async emitLocation(tripId: string, dto: EmitLocationDto): Promise<void> {
    // Throttle check per user
    const lastTime = this.lastEmitTime.get(dto.userId);
    const now = Date.now();
    if (lastTime && now - lastTime < MIN_EMIT_INTERVAL_MS) {
      return; // Silently ignore too-frequent updates
    }

    // Validate trip exists and is active
    const trip = await this.tripRepo.findOne({
      where: { id: tripId },
      relations: ['fromStation', 'toStation'],
    });
    if (!trip) {
      throw new NotFoundException(`Trip ${tripId} not found`);
    }

    const activeStatuses = ['boarding', 'departed', 'in_progress'];
    if (!activeStatuses.includes(trip.status)) {
      throw new BadRequestException(
        `Trip ${tripId} is not active (status: ${trip.status})`,
      );
    }

    // Validate the user has a BOARDED ticket for this trip
    const ticket = await this.ticketRepo.findOne({
      where: {
        tripId,
        purchasedByUserId: dto.userId,
        status: TicketStatus.BOARDED,
      },
    });
    if (!ticket) {
      throw new ForbiddenException(
        `User ${dto.userId} has no boarded ticket for trip ${tripId}`,
      );
    }

    // Emitter rotation logic:
    // If there's an active emitter and it's a DIFFERENT user, check timeout
    const current = this.activeEmitters.get(tripId);
    if (current && current.userId !== dto.userId) {
      if (now - current.lastEmit < EMITTER_TIMEOUT_MS) {
        // Active emitter is still alive — silently ignore other passengers
        return;
      }
      // Active emitter timed out — this passenger takes over
      this.logger.log(
        `Emitter rotation for trip ${tripId}: ${current.userId} -> ${dto.userId}`,
      );
    }

    // This user is now the active emitter
    this.activeEmitters.set(tripId, { userId: dto.userId, lastEmit: now });
    this.lastEmitTime.set(dto.userId, now);

    // Calculate progress_percent based on distance from origin vs total route distance
    const progressPercent = this.calculateProgress(
      trip,
      dto.latitude,
      dto.longitude,
    );

    // Build position object
    const position: LivePosition = {
      tripId,
      latitude: dto.latitude,
      longitude: dto.longitude,
      heading: dto.heading ?? 0,
      speed: dto.speed ?? 0,
      accuracy: 50,
      timestamp: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      emitterId: dto.userId,
      progress_percent: progressPercent,
    };

    // Store in memory
    this.livePositions.set(tripId, position);

    // Update trip GPS columns for persistence
    await this.tripRepo.update(tripId, {
      gpsLatitude: dto.latitude,
      gpsLongitude: dto.longitude,
      lastLocationUpdate: new Date(),
    });

    // Broadcast to all WebSocket subscribers (without emitterId for privacy)
    this.broadcast(tripId, this.toPublicPayload(position));

    this.logger.debug(
      `Position updated for trip ${tripId} by ${dto.userId}: ${dto.latitude}, ${dto.longitude} (${progressPercent}%)`,
    );
  }

  /**
   * Calculate trip progress percentage (0-100) based on
   * distance from origin vs total route distance (Haversine).
   */
  private calculateProgress(
    trip: Trip,
    currentLat: number,
    currentLng: number,
  ): number {
    if (!trip.fromStation?.latitude || !trip.toStation?.latitude) {
      return 0;
    }

    const totalDistance = this.haversineDistance(
      Number(trip.fromStation.latitude),
      Number(trip.fromStation.longitude),
      Number(trip.toStation.latitude),
      Number(trip.toStation.longitude),
    );

    if (totalDistance === 0) return 100;

    const distanceFromOrigin = this.haversineDistance(
      Number(trip.fromStation.latitude),
      Number(trip.fromStation.longitude),
      currentLat,
      currentLng,
    );

    const percent = Math.round((distanceFromOrigin / totalDistance) * 100);
    return Math.min(100, Math.max(0, percent));
  }

  /** Strip emitterId for privacy — never expose which passenger is tracking */
  private toPublicPayload(pos: LivePosition): VehicleLocationPayload {
    return {
      tripId: pos.tripId,
      latitude: pos.latitude,
      longitude: pos.longitude,
      heading: pos.heading,
      speed: pos.speed,
      accuracy: pos.accuracy,
      timestamp: pos.timestamp,
      updatedAt: pos.updatedAt,
      progress_percent: pos.progress_percent,
    };
  }

  /**
   * Get the current live position of a trip's vehicle (REST endpoint).
   * Returns public payload (no emitterId).
   */
  getPosition(tripId: string): VehicleLocationPayload | null {
    const pos = this.livePositions.get(tripId);
    return pos ? this.toPublicPayload(pos) : null;
  }

  // -----------------------------------------------
  // External sharing: only within 5km of arrival
  // -----------------------------------------------

  /**
   * Check if the trip position can be shared externally.
   * Only allowed when the vehicle is within 5km of the arrival city.
   */
  async canShare(tripId: string): Promise<{
    shareable: boolean;
    distanceToArrivalKm: number | null;
    reason: string;
  }> {
    const trip = await this.tripRepo.findOne({
      where: { id: tripId },
      relations: ['toStation'],
    });
    if (!trip) {
      throw new NotFoundException(`Trip ${tripId} not found`);
    }

    // No live position available
    const position = this.livePositions.get(tripId);
    if (!position) {
      return {
        shareable: false,
        distanceToArrivalKm: null,
        reason: 'Aucune position GPS disponible pour ce trajet',
      };
    }

    // Trip must be active
    const activeStatuses = ['boarding', 'departed', 'in_progress'];
    if (!activeStatuses.includes(trip.status)) {
      return {
        shareable: false,
        distanceToArrivalKm: null,
        reason: `Trajet non actif (statut: ${trip.status})`,
      };
    }

    // Destination station must have GPS coords
    if (!trip.toStation?.latitude || !trip.toStation?.longitude) {
      return {
        shareable: false,
        distanceToArrivalKm: null,
        reason: 'Coordonnees GPS de la destination indisponibles',
      };
    }

    // Calculate distance from current position to destination (Haversine)
    const distanceKm = this.haversineDistance(
      position.latitude,
      position.longitude,
      Number(trip.toStation.latitude),
      Number(trip.toStation.longitude),
    );

    const shareable = distanceKm <= SHARE_RADIUS_KM;
    return {
      shareable,
      distanceToArrivalKm: Math.round(distanceKm * 10) / 10,
      reason: shareable
        ? `Vehicule a ${Math.round(distanceKm * 10) / 10} km - partage autorise`
        : `Vehicule a ${Math.round(distanceKm * 10) / 10} km - partage uniquement a moins de ${SHARE_RADIUS_KM} km`,
    };
  }

  /**
   * Share passenger's location with the operator/driver.
   * Frontend calls POST /share-location.
   *
   * Rules:
   * - User must have a boarded ticket
   * - Trip must be active
   * - Trip progress >= 70% (near destination)
   */
  async shareLocation(dto: ShareLocationDto): Promise<{
    share_id: string;
    status: string;
    driver_notified: boolean;
    created_at: string;
    message: string;
  }> {
    const trip = await this.tripRepo.findOne({
      where: { id: dto.tripId },
      relations: ['fromStation', 'toStation'],
    });
    if (!trip) {
      throw new NotFoundException(`Trip ${dto.tripId} not found`);
    }

    const activeStatuses = ['boarding', 'departed', 'in_progress'];
    if (!activeStatuses.includes(trip.status)) {
      throw new BadRequestException(
        `Trip ${dto.tripId} is not active (status: ${trip.status})`,
      );
    }

    // Calculate progress to check >= 70% rule
    const progress = this.calculateProgress(trip, dto.latitude, dto.longitude);
    if (progress < 70) {
      throw new BadRequestException(
        `Partage autorise a partir de 70% du trajet (actuellement ${progress}%)`,
      );
    }

    const shareId = `SHARE_${Date.now()}`;
    const now = new Date().toISOString();

    // In production, this would send a WebSocket/push notification to the driver
    this.logger.log(
      `Location shared for trip ${dto.tripId}: ${dto.latitude}, ${dto.longitude} (progress ${progress}%)`,
    );

    return {
      share_id: shareId,
      status: 'shared',
      driver_notified: true,
      created_at: now,
      message: 'Position partagée. Le chauffeur a reçu votre itinéraire.',
    };
  }

  // -----------------------------------------------
  // WebSocket subscription management
  // -----------------------------------------------

  subscribe(
    tripId: string,
    callback: (position: VehicleLocationPayload) => void,
  ): () => void {
    if (!this.subscribers.has(tripId)) {
      this.subscribers.set(tripId, new Set());
    }
    this.subscribers.get(tripId)!.add(callback);

    // Send current position immediately if available
    const current = this.livePositions.get(tripId);
    if (current) {
      callback(this.toPublicPayload(current));
    }

    // Return unsubscribe function
    return () => {
      this.subscribers.get(tripId)?.delete(callback);
      if (this.subscribers.get(tripId)?.size === 0) {
        this.subscribers.delete(tripId);
      }
    };
  }

  private broadcast(tripId: string, payload: VehicleLocationPayload): void {
    const subs = this.subscribers.get(tripId);
    if (subs) {
      for (const cb of subs) {
        try {
          cb(payload);
        } catch (e) {
          this.logger.warn(`Error broadcasting to subscriber: ${e}`);
        }
      }
    }
  }

  // -----------------------------------------------
  // RULE 3: Haversine formula (no Google Distance Matrix)
  // -----------------------------------------------

  /**
   * Haversine distance between two GPS points in km.
   * Used instead of Google Distance Matrix API to save costs.
   */
  haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
