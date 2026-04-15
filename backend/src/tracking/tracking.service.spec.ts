import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { Trip, Station, Route, Ticket } from '../database/entities';

describe('TrackingService', () => {
  let service: TrackingService;
  let tripRepo: Record<string, jest.Mock>;
  let stationRepo: Record<string, jest.Mock>;
  let routeRepo: Record<string, jest.Mock>;
  let ticketRepo: Record<string, jest.Mock>;

  const mockTrip = {
    id: 'trip-001',
    fromStationId: 'sta-ouaga',
    toStationId: 'sta-bobo',
    fromStationName: 'Gare Ouagadougou',
    toStationName: 'Gare Bobo-Dioulasso',
    fromStation: {
      id: 'sta-ouaga',
      name: 'Gare Ouagadougou',
      latitude: 12.3714,
      longitude: -1.5197,
    },
    toStation: {
      id: 'sta-bobo',
      name: 'Gare Bobo-Dioulasso',
      latitude: 11.1771,
      longitude: -4.2947,
    },
    status: 'departed',
    gpsLatitude: null,
    gpsLongitude: null,
    segments: [],
  };

  const mockBoardedTicket = {
    id: 'TKT-001',
    tripId: 'trip-001',
    purchasedByUserId: 'user-001',
    status: 'boarded',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrackingService,
        {
          provide: getRepositoryToken(Trip),
          useValue: {
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Station),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Route),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn((data) => data),
            save: jest.fn((data) => data),
          },
        },
        {
          provide: getRepositoryToken(Ticket),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(''),
          },
        },
      ],
    }).compile();

    service = module.get<TrackingService>(TrackingService);
    tripRepo = module.get(getRepositoryToken(Trip));
    stationRepo = module.get(getRepositoryToken(Station));
    routeRepo = module.get(getRepositoryToken(Route));
    ticketRepo = module.get(getRepositoryToken(Ticket));
  });

  // Haversine distance
  describe('haversineDistance', () => {
    it('should return 0 for same point', () => {
      const d = service.haversineDistance(12.0, -1.5, 12.0, -1.5);
      expect(d).toBeCloseTo(0, 1);
    });

    it('should calculate Ouaga -> Bobo distance (~320 km)', () => {
      const d = service.haversineDistance(12.3714, -1.5197, 11.1771, -4.2947);
      expect(d).toBeGreaterThan(300);
      expect(d).toBeLessThan(350);
    });

    it('should calculate short distance (< 5 km)', () => {
      const d = service.haversineDistance(12.3714, -1.5197, 12.3814, -1.5197);
      expect(d).toBeLessThan(5);
      expect(d).toBeGreaterThan(0);
    });
  });

  // RULE 1: getRoute
  describe('getRoute (Rule 1 - cached geometry)', () => {
    it('should throw NotFoundException for unknown trip', async () => {
      tripRepo.findOne.mockResolvedValue(null);
      await expect(service.getRoute('nope')).rejects.toThrow(NotFoundException);
    });

    it('should return cached route if available', async () => {
      tripRepo.findOne.mockResolvedValue(mockTrip);
      routeRepo.findOne.mockResolvedValue({
        id: 'sta-ouaga__sta-bobo',
        waypoints: [
          { lat: 12.37, lng: -1.52, name: 'Ouaga', type: 'start' },
          { lat: 11.18, lng: -4.29, name: 'Bobo', type: 'end' },
        ],
        totalDistanceKm: 320,
        totalDurationMinutes: 240,
        encodedPolyline: 'abc123encoded',
      });

      const result = await service.getRoute('trip-001');
      expect(result.waypoints).toHaveLength(2);
      expect(result.total_distance_km).toBe(320);
      expect(result.encoded_polyline).toBe('abc123encoded');
      expect(result.duration_minutes).toBe(240);
    });

    it('should build and cache route when no cached route exists', async () => {
      tripRepo.findOne.mockResolvedValue(mockTrip);
      routeRepo.findOne.mockResolvedValue(null);

      const result = await service.getRoute('trip-001');
      expect(result.waypoints.length).toBeGreaterThanOrEqual(2);
      expect(result.waypoints[0].type).toBe('start');
      expect(result.waypoints[result.waypoints.length - 1].type).toBe('end');
      expect(result.total_distance_km).toBeGreaterThan(0);
      expect(routeRepo.save).toHaveBeenCalled();
    });

    it('should include intermediate stops from segments', async () => {
      const tripWithSegments = {
        ...mockTrip,
        segments: [
          {
            sequenceNumber: 1,
            toStopId: 'sta-koudougou',
            toStopName: 'Koudougou',
            arrivalTime: new Date('2026-04-10T08:00:00Z'),
          },
        ],
      };
      tripRepo.findOne.mockResolvedValue(tripWithSegments);
      routeRepo.findOne.mockResolvedValue(null);
      stationRepo.findOne.mockResolvedValue({
        id: 'sta-koudougou',
        name: 'Koudougou',
        latitude: 12.25,
        longitude: -2.36,
      });

      const result = await service.getRoute('trip-001');
      expect(result.waypoints).toHaveLength(3);
      expect(result.waypoints[1].type).toBe('stop');
      expect(result.waypoints[1].name).toBe('Koudougou');
    });
  });

  // RULE 4: emitLocation
  describe('emitLocation (Rule 4 - live tracking)', () => {
    const emitDto = {
      userId: 'user-001',
      ticketId: 'TKT-001',
      latitude: 12.3656,
      longitude: -1.5197,
      heading: 180,
      speed: 80,
    };

    it('should throw NotFoundException for unknown trip', async () => {
      tripRepo.findOne.mockResolvedValue(null);
      await expect(service.emitLocation('nope', emitDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException for inactive trip', async () => {
      tripRepo.findOne.mockResolvedValue({
        ...mockTrip,
        status: 'cancelled',
      });
      await expect(service.emitLocation('trip-001', emitDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ForbiddenException when user has no boarded ticket', async () => {
      tripRepo.findOne.mockResolvedValue(mockTrip);
      ticketRepo.findOne.mockResolvedValue(null);

      await expect(service.emitLocation('trip-001', emitDto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should store position and update trip GPS columns', async () => {
      tripRepo.findOne.mockResolvedValue(mockTrip);
      ticketRepo.findOne.mockResolvedValue(mockBoardedTicket);
      tripRepo.update.mockResolvedValue({ affected: 1 });

      await service.emitLocation('trip-001', emitDto);

      expect(tripRepo.update).toHaveBeenCalledWith('trip-001', {
        gpsLatitude: 12.3656,
        gpsLongitude: -1.5197,
        lastLocationUpdate: expect.any(Date),
      });

      const pos = service.getPosition('trip-001');
      expect(pos).not.toBeNull();
      expect(pos!.latitude).toBe(12.3656);
      expect(pos!.longitude).toBe(-1.5197);
      // emitterId should NOT be exposed in public payload
      expect((pos as any).emitterId).toBeUndefined();
    });

    it('should include progress_percent in position', async () => {
      tripRepo.findOne.mockResolvedValue(mockTrip);
      ticketRepo.findOne.mockResolvedValue(mockBoardedTicket);
      tripRepo.update.mockResolvedValue({ affected: 1 });

      await service.emitLocation('trip-001', emitDto);

      const pos = service.getPosition('trip-001');
      expect(pos).not.toBeNull();
      expect(pos!.progress_percent).toBeDefined();
      expect(pos!.progress_percent).toBeGreaterThanOrEqual(0);
      expect(pos!.progress_percent).toBeLessThanOrEqual(100);
    });

    it('should throttle rapid emit calls from same user', async () => {
      tripRepo.findOne.mockResolvedValue(mockTrip);
      ticketRepo.findOne.mockResolvedValue(mockBoardedTicket);
      tripRepo.update.mockResolvedValue({ affected: 1 });

      await service.emitLocation('trip-001', emitDto);
      expect(tripRepo.update).toHaveBeenCalledTimes(1);

      // Second call should be throttled (< 50s interval)
      await service.emitLocation('trip-001', emitDto);
      expect(tripRepo.update).toHaveBeenCalledTimes(1); // Still 1
    });

    it('should broadcast to subscribers without emitterId', async () => {
      tripRepo.findOne.mockResolvedValue(mockTrip);
      ticketRepo.findOne.mockResolvedValue({
        ...mockBoardedTicket,
        purchasedByUserId: 'user-broadcast',
      });
      tripRepo.update.mockResolvedValue({ affected: 1 });

      const received: any[] = [];
      service.subscribe('trip-001', (pos) => received.push(pos));

      await service.emitLocation('trip-001', {
        ...emitDto,
        userId: 'user-broadcast',
      });

      expect(received).toHaveLength(1);
      expect(received[0].tripId).toBe('trip-001');
      // Privacy: emitterId must not be in broadcast payload
      expect(received[0].emitterId).toBeUndefined();
      expect(received[0].progress_percent).toBeDefined();
    });

    it('should accept boarding status', async () => {
      tripRepo.findOne.mockResolvedValue({
        ...mockTrip,
        status: 'boarding',
      });
      ticketRepo.findOne.mockResolvedValue({
        ...mockBoardedTicket,
        purchasedByUserId: 'user-boarding',
      });
      tripRepo.update.mockResolvedValue({ affected: 1 });

      await expect(
        service.emitLocation('trip-001', {
          ...emitDto,
          userId: 'user-boarding',
        }),
      ).resolves.not.toThrow();
    });

    it('should silently ignore a second emitter while active emitter is alive', async () => {
      tripRepo.findOne.mockResolvedValue(mockTrip);
      tripRepo.update.mockResolvedValue({ affected: 1 });

      // First emitter emits
      ticketRepo.findOne.mockResolvedValue({
        ...mockBoardedTicket,
        purchasedByUserId: 'emitter-A',
      });
      await service.emitLocation('trip-001', {
        ...emitDto,
        userId: 'emitter-A',
      });
      expect(tripRepo.update).toHaveBeenCalledTimes(1);

      // Second emitter tries to emit (should be silently ignored)
      ticketRepo.findOne.mockResolvedValue({
        ...mockBoardedTicket,
        purchasedByUserId: 'emitter-B',
      });
      await service.emitLocation('trip-001', {
        ...emitDto,
        userId: 'emitter-B',
      });
      // Still 1 — second emitter was rejected
      expect(tripRepo.update).toHaveBeenCalledTimes(1);
    });
  });

  // RULE 5: canShare
  describe('canShare (Rule 5 - 5km restriction)', () => {
    it('should throw NotFoundException for unknown trip', async () => {
      tripRepo.findOne.mockResolvedValue(null);
      await expect(service.canShare('nope')).rejects.toThrow(NotFoundException);
    });

    it('should return not shareable when no live position', async () => {
      tripRepo.findOne.mockResolvedValue(mockTrip);

      const result = await service.canShare('trip-no-pos');
      expect(result.shareable).toBe(false);
      expect(result.distanceToArrivalKm).toBeNull();
    });

    it('should return not shareable for inactive trip', async () => {
      tripRepo.findOne.mockResolvedValue({
        ...mockTrip,
        status: 'cancelled',
      });

      const result = await service.canShare('trip-001');
      expect(result.shareable).toBe(false);
    });

    it('should return shareable when within 5km of destination', async () => {
      tripRepo.findOne.mockResolvedValue(mockTrip);
      tripRepo.update.mockResolvedValue({ affected: 1 });
      ticketRepo.findOne.mockResolvedValue({
        ...mockBoardedTicket,
        purchasedByUserId: 'user-close',
      });

      // Emit a position very close to Bobo destination (11.1771, -4.2947)
      await service.emitLocation('trip-001', {
        userId: 'user-close',
        ticketId: 'TKT-X',
        latitude: 11.18,
        longitude: -4.29,
      });

      const result = await service.canShare('trip-001');
      expect(result.shareable).toBe(true);
      expect(result.distanceToArrivalKm).toBeLessThanOrEqual(5);
    });

    it('should return not shareable when far from destination', async () => {
      tripRepo.findOne.mockResolvedValue(mockTrip);
      tripRepo.update.mockResolvedValue({ affected: 1 });
      ticketRepo.findOne.mockResolvedValue({
        ...mockBoardedTicket,
        purchasedByUserId: 'user-far',
      });

      // Emit a position at Ouagadougou (far from Bobo destination)
      await service.emitLocation('trip-001', {
        userId: 'user-far',
        ticketId: 'TKT-Y',
        latitude: 12.37,
        longitude: -1.52,
      });

      const result = await service.canShare('trip-001');
      expect(result.shareable).toBe(false);
      expect(result.distanceToArrivalKm).toBeGreaterThan(5);
    });

    it('should return not shareable when destination has no GPS', async () => {
      tripRepo.findOne.mockResolvedValue({
        ...mockTrip,
        toStation: { id: 'sta-bobo', latitude: null, longitude: null },
      });

      // Inject a position directly
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      (service as any).livePositions.set('trip-001', {
        tripId: 'trip-001',
        latitude: 11.18,
        longitude: -4.29,
        heading: 0,
        speed: 0,
        accuracy: 50,
        timestamp: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        emitterId: 'u1',
        progress_percent: 95,
      });

      const result = await service.canShare('trip-001');
      expect(result.shareable).toBe(false);
    });
  });

  // Subscription management
  describe('subscribe / unsubscribe', () => {
    it('should send current position on subscribe (without emitterId)', () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      (service as any).livePositions.set('trip-sub', {
        tripId: 'trip-sub',
        latitude: 12.0,
        longitude: -1.0,
        heading: 0,
        speed: 0,
        accuracy: 50,
        timestamp: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        emitterId: 'u1',
        progress_percent: 45,
      });

      const received: any[] = [];
      service.subscribe('trip-sub', (pos) => received.push(pos));

      expect(received).toHaveLength(1); // Immediate position
      // Privacy check: emitterId must not be in the callback payload
      expect(received[0].emitterId).toBeUndefined();
      expect(received[0].progress_percent).toBe(45);
    });

    it('should unsubscribe cleanly', () => {
      const received: any[] = [];
      const unsub = service.subscribe('trip-clean', (pos) =>
        received.push(pos),
      );
      unsub();

      // After unsubscribe, broadcast should not reach
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      (service as any).broadcast('trip-clean', { tripId: 'trip-clean' });
      expect(received).toHaveLength(0);
    });
  });
});
