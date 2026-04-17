import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PromotionsService } from './promotions.service';
import { Promotion } from '../database/entities';

describe('PromotionsService', () => {
  let service: PromotionsService;
  let promoRepo: Record<string, jest.Mock>;
  let dataSource: { createQueryBuilder: jest.Mock };

  const mockPromo: Partial<Promotion> = {
    promotionId: 'PROMO-001',
    operatorId: 'op-001',
    promotionName: 'Summer Sale',
    description: 'Big discounts',
    discountType: 'PERCENTAGE',
    discountValue: 20,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2027-12-31'),
    maxUses: 100,
    usesCount: 5,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    promoRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn((e: any) => Promise.resolve(e)),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockPromo),
      })),
    };

    dataSource = {
      createQueryBuilder: jest.fn(() => ({
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 1 }),
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromotionsService,
        { provide: getRepositoryToken(Promotion), useValue: promoRepo },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<PromotionsService>(PromotionsService);
  });

  describe('validateCode', () => {
    it('should validate active promo code', async () => {
      const result = await service.validateCode({ code: 'PROMO-001' });
      expect(result.valid).toBe(true);
      expect(result.promotion).toBeDefined();
    });

    it('should reject unknown code', async () => {
      promoRepo.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      });
      const result = await service.validateCode({ code: 'NOPE' });
      expect(result.valid).toBe(false);
    });

    it('should reject inactive promo', async () => {
      promoRepo.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({ ...mockPromo, isActive: false }),
      });
      const result = await service.validateCode({ code: 'PROMO-001' });
      expect(result.valid).toBe(false);
    });

    it('should reject expired promo', async () => {
      promoRepo.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({
          ...mockPromo,
          endDate: new Date('2020-01-01'),
        }),
      });
      const result = await service.validateCode({ code: 'PROMO-001' });
      expect(result.valid).toBe(false);
    });

    it('should reject maxed out promo', async () => {
      promoRepo.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({
          ...mockPromo,
          maxUses: 5,
          usesCount: 5,
        }),
      });
      const result = await service.validateCode({ code: 'PROMO-001' });
      expect(result.valid).toBe(false);
    });
  });

  describe('findAll', () => {
    it('should return all promotions', async () => {
      promoRepo.find.mockResolvedValue([mockPromo]);
      const result = await service.findAll();
      expect(result).toHaveLength(1);
    });
  });

  describe('getStats', () => {
    it('should return stats', async () => {
      promoRepo.find.mockResolvedValue([mockPromo]);
      const result = await service.getStats();
      expect(result.total).toBe(1);
      expect(result.active).toBe(1);
      expect(result.totalUses).toBe(5);
    });
  });

  describe('findOne', () => {
    it('should return promo by ID', async () => {
      promoRepo.findOne.mockResolvedValue(mockPromo);
      const result = await service.findOne('PROMO-001');
      expect(result.promotionId).toBe('PROMO-001');
    });

    it('should throw NotFoundException', async () => {
      promoRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('nope')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a promotion', async () => {
      const result = await service.create({
        title: 'New Promo',
        operatorId: 'op-001',
        discountType: 'percentage',
        discountValue: 15,
        startDate: '2025-06-01',
        endDate: '2025-12-31',
      });
      expect(result.promotionName).toBe('New Promo');
      expect(promoRepo.save).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a promotion', async () => {
      promoRepo.findOne.mockResolvedValue({ ...mockPromo });
      const result = await service.update('PROMO-001', { title: 'Updated' });
      expect(result.promotionName).toBe('Updated');
    });
  });

  describe('approve', () => {
    it('should activate promotion', async () => {
      promoRepo.findOne.mockResolvedValue({ ...mockPromo, isActive: false });
      const result = await service.approve('PROMO-001');
      expect(result.isActive).toBe(true);
    });
  });

  describe('reject', () => {
    it('should deactivate promotion', async () => {
      promoRepo.findOne.mockResolvedValue({ ...mockPromo });
      const result = await service.reject('PROMO-001');
      expect(result.isActive).toBe(false);
    });
  });

  describe('remove', () => {
    it('should remove promotion', async () => {
      promoRepo.findOne.mockResolvedValue(mockPromo);
      await service.remove('PROMO-001');
      expect(promoRepo.remove).toHaveBeenCalled();
    });
  });

  describe('usePromotion', () => {
    it('should atomically increment usesCount', async () => {
      const result = await service.usePromotion('PROMO-001');
      expect(result.used).toBe(true);
      expect(dataSource.createQueryBuilder).toHaveBeenCalled();
    });

    it('should throw ConflictException when max uses reached', async () => {
      dataSource.createQueryBuilder.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 0 }),
      });
      await expect(service.usePromotion('PROMO-001')).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
