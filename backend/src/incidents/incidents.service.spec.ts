import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { Incident, Trip, Ticket } from '../database/entities';

// ---- helpers ----

const mockTrip = {
  id: 'trip-1',
  fromStationName: 'Ouaga',
  toStationName: 'Bobo',
  departureTime: new Date('2025-01-15T08:00:00Z'),
  gareId: 'gare-1',
  gareName: 'Gare Ouaga',
  operatorId: 'op-1',
  operatorName: 'TSR',
} as unknown as Trip;

const mockIncident = {
  id: 'inc-1',
  tripId: 'trip-1',
  tripRoute: 'Ouaga → Bobo',
  tripDepartureTime: mockTrip.departureTime,
  gareId: 'gare-1',
  gareName: 'Gare Ouaga',
  companyId: 'op-1',
  companyName: 'TSR',
  type: 'delay',
  severity: 'medium',
  title: 'Bus delayed 30 min',
  description: 'Bus delayed 30 min due to traffic',
  status: 'open',
  reporterType: 'passenger',
  reportedBy: 'user-1',
  createdAt: new Date(),
} as unknown as Incident;

const createMockRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  count: jest.fn(),
  createQueryBuilder: jest.fn(),
});

describe('IncidentsService', () => {
  let service: IncidentsService;
  let incidentRepo: ReturnType<typeof createMockRepo>;
  let tripRepo: ReturnType<typeof createMockRepo>;
  let ticketRepo: ReturnType<typeof createMockRepo>;

  beforeEach(async () => {
    incidentRepo = createMockRepo();
    tripRepo = createMockRepo();
    ticketRepo = createMockRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncidentsService,
        { provide: getRepositoryToken(Incident), useValue: incidentRepo },
        { provide: getRepositoryToken(Trip), useValue: tripRepo },
        { provide: getRepositoryToken(Ticket), useValue: ticketRepo },
      ],
    }).compile();

    service = module.get(IncidentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ---- create ----

  describe('create()', () => {
    it('should create an incident with enriched trip data', async () => {
      tripRepo.findOne.mockResolvedValue(mockTrip);
      incidentRepo.create.mockReturnValue(mockIncident);
      incidentRepo.save.mockResolvedValue(mockIncident);

      const result = await service.create(
        {
          trip_id: 'trip-1',
          description: 'Bus delayed 30 min due to traffic',
          type: 'delay',
          severity: 'medium',
        },
        'user-1',
      );

      expect(tripRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'trip-1' },
        relations: ['fromStation', 'toStation'],
      });
      expect(incidentRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tripId: 'trip-1',
          tripRoute: 'Ouaga → Bobo',
          gareId: 'gare-1',
          companyId: 'op-1',
          status: 'open',
          reporterType: 'passenger',
          reportedBy: 'user-1',
        }),
      );
      expect(result).toEqual(mockIncident);
    });

    it('should throw NotFoundException if trip not found', async () => {
      tripRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create({ trip_id: 'bad', description: 'test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ---- findAll ----

  describe('findAll()', () => {
    it('should return paginated results', async () => {
      const qb = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockIncident], 1]),
      };
      incidentRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll({
        status: 'open',
        page: 1,
        limit: 10,
      });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.totalPages).toBe(1);
      expect(qb.andWhere).toHaveBeenCalledWith('i.status = :status', {
        status: 'open',
      });
    });

    it('should use default page/limit when not provided', async () => {
      const qb = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
      incidentRepo.createQueryBuilder.mockReturnValue(qb);

      await service.findAll({});

      expect(qb.skip).toHaveBeenCalledWith(0);
      expect(qb.take).toHaveBeenCalledWith(20);
    });
  });

  // ---- findOne ----

  describe('findOne()', () => {
    it('should return an incident', async () => {
      incidentRepo.findOne.mockResolvedValue(mockIncident);
      const result = await service.findOne('inc-1');
      expect(result).toEqual(mockIncident);
    });

    it('should throw NotFoundException if not found', async () => {
      incidentRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('bad')).rejects.toThrow(NotFoundException);
    });
  });

  // ---- update ----

  describe('update()', () => {
    it('should update incident fields', async () => {
      incidentRepo.findOne.mockResolvedValue({ ...mockIncident });
      incidentRepo.save.mockImplementation((i) => Promise.resolve(i));

      const result = await service.update('inc-1', {
        severity: 'high',
        description: 'Updated description',
      });

      expect(result.severity).toBe('high');
      expect(result.description).toBe('Updated description');
    });
  });

  // ---- resolve ----

  describe('resolve()', () => {
    it('should resolve an open incident', async () => {
      incidentRepo.findOne.mockResolvedValue({
        ...mockIncident,
        status: 'open',
      });
      incidentRepo.save.mockImplementation((i) => Promise.resolve(i));

      const result = await service.resolve('inc-1', {
        resolvedBy: 'admin-1',
        resolvedByName: 'Admin User',
        comment: 'Issue fixed',
      });

      expect(result.status).toBe('resolved');
      expect(result.resolvedBy).toBe('admin-1');
      expect(result.resolvedAt).toBeInstanceOf(Date);
    });

    it('should throw if already resolved', async () => {
      incidentRepo.findOne.mockResolvedValue({
        ...mockIncident,
        status: 'resolved',
      });

      await expect(
        service.resolve('inc-1', { resolvedBy: 'a', resolvedByName: 'A' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ---- notifyPassengers ----

  describe('notifyPassengers()', () => {
    it('should count affected passengers and return channels', async () => {
      incidentRepo.findOne.mockResolvedValue(mockIncident);
      ticketRepo.count.mockResolvedValue(25);

      const result = await service.notifyPassengers('inc-1', {
        notificationType: 'delay',
        message: 'Your bus is delayed by 30 min',
        channels: ['push', 'sms'],
      });

      expect(result.notifiedCount).toBe(25);
      expect(result.channels).toEqual(['push', 'sms']);
    });

    it('should throw if incident has no trip', async () => {
      incidentRepo.findOne.mockResolvedValue({ ...mockIncident, tripId: null });

      await expect(
        service.notifyPassengers('inc-1', {
          notificationType: 'info',
          message: 'test',
          channels: ['push'],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ---- validate (Societe) ----

  describe('validate()', () => {
    it('should validate an incident', async () => {
      incidentRepo.findOne.mockResolvedValue({ ...mockIncident });
      incidentRepo.save.mockImplementation((i) => Promise.resolve(i));

      const result = await service.validate('inc-1', {
        validationStatus: 'validated',
        validatedBy: 'manager-1',
        validationComment: 'Confirmed',
      });

      expect(result.validationStatus).toBe('validated');
      expect(result.validatedBy).toBe('manager-1');
      expect(result.validatedAt).toBeInstanceOf(Date);
    });

    it('should reject an incident', async () => {
      incidentRepo.findOne.mockResolvedValue({ ...mockIncident });
      incidentRepo.save.mockImplementation((i) => Promise.resolve(i));

      const result = await service.validate('inc-1', {
        validationStatus: 'rejected',
        validatedBy: 'manager-1',
        validationComment: 'Not accurate',
      });

      expect(result.validationStatus).toBe('rejected');
    });
  });
});
