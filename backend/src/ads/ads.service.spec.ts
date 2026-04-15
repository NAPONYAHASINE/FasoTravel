import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { AdsService } from './ads.service';
import {
  Advertisement,
  AdImpression,
  AdClick,
  AdConversion,
} from '../database/entities';

describe('AdsService', () => {
  let service: AdsService;
  let adRepo: Record<string, jest.Mock>;
  let impressionRepo: Record<string, jest.Mock>;
  let clickRepo: Record<string, jest.Mock>;
  let conversionRepo: Record<string, jest.Mock>;

  const mockAd: Partial<Advertisement> = {
    id: 'ad-001',
    title: 'Summer Sale',
    description: 'Big discounts',
    mediaType: 'image',
    actionType: 'internal',
    targetPages: ['home'],
    targetNewUsers: false,
    priority: 5,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2027-12-31'),
    impressionsCount: 10,
    clicksCount: 2,
    isActive: true,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    adRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn((e: any) => Promise.resolve(e)),
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockAd]),
      })),
    };

    impressionRepo = {
      save: jest.fn((e: any) => Promise.resolve(e)),
      count: jest.fn().mockResolvedValue(10),
    };

    clickRepo = {
      save: jest.fn((e: any) => Promise.resolve(e)),
      count: jest.fn().mockResolvedValue(2),
    };

    conversionRepo = {
      save: jest.fn((e: any) => Promise.resolve(e)),
      count: jest.fn().mockResolvedValue(1),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdsService,
        { provide: getRepositoryToken(Advertisement), useValue: adRepo },
        { provide: getRepositoryToken(AdImpression), useValue: impressionRepo },
        { provide: getRepositoryToken(AdClick), useValue: clickRepo },
        { provide: getRepositoryToken(AdConversion), useValue: conversionRepo },
      ],
    }).compile();

    service = module.get<AdsService>(AdsService);
  });

  describe('findActive', () => {
    it('should return active ads', async () => {
      const result = await service.findActive();
      expect(result).toHaveLength(1);
    });

    it('should filter by page', async () => {
      const result = await service.findActive('home');
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return ad by ID', async () => {
      adRepo.findOne.mockResolvedValue(mockAd);
      const result = await service.findOne('ad-001');
      expect(result.id).toBe('ad-001');
    });

    it('should throw NotFoundException', async () => {
      adRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('nope')).rejects.toThrow(NotFoundException);
    });
  });

  describe('trackImpression', () => {
    it('should increment count and save impression', async () => {
      adRepo.findOne.mockResolvedValue({ ...mockAd });
      await service.trackImpression('ad-001', 'user-001', { page: 'home' });
      expect(adRepo.save).toHaveBeenCalled();
      expect(impressionRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException for unknown ad', async () => {
      adRepo.findOne.mockResolvedValue(null);
      await expect(
        service.trackImpression('nope', 'user-001', {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('trackClick', () => {
    it('should increment count and save click', async () => {
      adRepo.findOne.mockResolvedValue({ ...mockAd });
      await service.trackClick('ad-001', 'user-001', { page: 'home' });
      expect(adRepo.save).toHaveBeenCalled();
      expect(clickRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException for unknown ad', async () => {
      adRepo.findOne.mockResolvedValue(null);
      await expect(service.trackClick('nope', 'user-001', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('trackConversion', () => {
    it('should save conversion', async () => {
      adRepo.findOne.mockResolvedValue({ ...mockAd });
      await service.trackConversion('ad-001', 'user-001', {
        conversionType: 'booking',
      });
      expect(conversionRepo.save).toHaveBeenCalled();
    });
  });

  describe('findAll (admin)', () => {
    it('should return all ads', async () => {
      adRepo.find.mockResolvedValue([mockAd]);
      const result = await service.findAll();
      expect(result).toHaveLength(1);
    });
  });

  describe('getStats', () => {
    it('should return ad stats', async () => {
      adRepo.findOne.mockResolvedValue(mockAd);
      const result = await service.getStats('ad-001');
      expect(result.stats.impressions).toBe(10);
      expect(result.stats.clicks).toBe(2);
      expect(result.stats.conversions).toBe(1);
      expect(result.stats.ctr).toBe(20);
    });
  });
});
