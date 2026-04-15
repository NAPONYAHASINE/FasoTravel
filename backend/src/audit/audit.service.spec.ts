import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditLog } from '../database/entities';

const mockQb = {
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  clone: jest.fn().mockReturnThis(),
  getCount: jest.fn().mockResolvedValue(0),
  getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
  getMany: jest.fn().mockResolvedValue([]),
  getRawOne: jest.fn().mockResolvedValue({ cnt: '0' }),
  getRawMany: jest.fn().mockResolvedValue([]),
};

const mockAuditRepo = {
  create: jest.fn().mockImplementation((d) => d),
  save: jest
    .fn()
    .mockImplementation((d) => Promise.resolve({ id: 'log-1', ...d })),
  findOne: jest.fn(),
  count: jest.fn().mockResolvedValue(0),
  createQueryBuilder: jest.fn().mockReturnValue({ ...mockQb }),
};

describe('AuditService', () => {
  let service: AuditService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: getRepositoryToken(AuditLog), useValue: mockAuditRepo },
      ],
    }).compile();

    service = module.get(AuditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createLog', () => {
    it('should create an audit log entry', async () => {
      const result = await service.createLog({
        action: 'CREATE',
        entityType: 'booking',
        userId: 'user-1',
      });
      expect(result).toHaveProperty('id', 'log-1');
      expect(mockAuditRepo.create).toHaveBeenCalled();
      expect(mockAuditRepo.save).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated audit logs', async () => {
      const result = await service.findAll({
        page: 1,
        limit: 20,
        get skip() {
          return 0;
        },
      });
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page', 1);
    });

    it('should apply severity filter', async () => {
      await service.findAll({
        page: 1,
        limit: 20,
        severity: 'critical',
        get skip() {
          return 0;
        },
      });
      expect(mockAuditRepo.createQueryBuilder).toHaveBeenCalled();
    });

    it('should apply search filter', async () => {
      await service.findAll({
        page: 1,
        limit: 20,
        search: 'test',
        get skip() {
          return 0;
        },
      });
      expect(mockAuditRepo.createQueryBuilder).toHaveBeenCalled();
    });

    it('should apply date range filter', async () => {
      await service.findAll({
        page: 1,
        limit: 20,
        dateRange: '7d',
        get skip() {
          return 0;
        },
      });
      expect(mockAuditRepo.createQueryBuilder).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single log', async () => {
      mockAuditRepo.findOne.mockResolvedValue({
        id: 'log-1',
        action: 'CREATE',
      });
      const result = await service.findOne('log-1');
      expect(result.id).toBe('log-1');
    });

    it('should throw NotFoundException', async () => {
      mockAuditRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('nope')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStats', () => {
    it('should return audit stats', async () => {
      const result = await service.getStats();
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('today');
      expect(result).toHaveProperty('thisWeek');
      expect(result).toHaveProperty('thisMonth');
      expect(result).toHaveProperty('byCategory');
      expect(result).toHaveProperty('byEntityType');
      expect(result).toHaveProperty('topActions');
    });
  });

  describe('exportLogs', () => {
    it('should export logs as json', async () => {
      const result = await service.exportLogs({ format: 'json' });
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('format', 'json');
    });

    it('should export with date range', async () => {
      const result = await service.exportLogs({
        format: 'csv',
        dateRange: '30d',
      });
      expect(result.format).toBe('csv');
    });
  });
});
