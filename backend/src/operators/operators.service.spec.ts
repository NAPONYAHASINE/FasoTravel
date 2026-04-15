import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { OperatorsService } from './operators.service';
import {
  Operator,
  OperatorStory,
  OperatorService,
  OperatorPolicy,
  Review,
  Booking,
} from '../database/entities';
import { BookingStatus } from '../common/constants';

const mockOperator = {
  id: 'op-tsc',
  name: 'TSC',
  status: 'active',
  rating: 4.2,
  totalReviews: 10,
  operatorLogo: '🚌',
};

const mockReview = {
  id: 'rev-uuid-1',
  tripId: 'trip-001',
  operatorId: 'op-tsc',
  userId: 'user-uuid-123',
  rating: 5,
  title: 'Great trip',
  comment: 'Loved it',
  aspects: { comfort: 5 },
  isVerifiedTraveler: true,
  status: 'approved',
};

const mockService = {
  id: 'srv-1',
  operatorId: 'op-tsc',
  serviceName: 'AC',
  isActive: true,
};

const mockStory = {
  id: 'story-1',
  operatorId: 'op-tsc',
  createdAt: new Date(),
};

const mockPolicy = {
  id: 'pol-1',
  operatorId: 'op-tsc',
  title: 'Cancellation',
};

const userId = 'user-uuid-123';

// ─── Repository mocks ───────────────────────────────────────────
const mockOperatorRepo = {
  findOne: jest.fn(),
  create: jest.fn().mockImplementation((data) => data),
  save: jest.fn().mockImplementation((e) => Promise.resolve(e)),
  remove: jest.fn().mockResolvedValue(undefined),
  update: jest.fn().mockResolvedValue({ affected: 1 }),
  createQueryBuilder: jest.fn(),
};

const mockStoryRepo = {
  find: jest.fn(),
};

const mockServiceRepo = {
  find: jest.fn(),
};

const mockPolicyRepo = {
  find: jest.fn(),
};

const mockReviewRepo = {
  findOne: jest.fn(),
  create: jest
    .fn()
    .mockImplementation((data) => ({ id: 'rev-uuid-new', ...data })),
  save: jest.fn().mockImplementation((e) => Promise.resolve(e)),
  remove: jest.fn().mockResolvedValue(undefined),
  createQueryBuilder: jest.fn(),
};

const mockBookingRepo = {
  findOne: jest.fn(),
};

describe('OperatorsService', () => {
  let service: OperatorsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OperatorsService,
        { provide: getRepositoryToken(Operator), useValue: mockOperatorRepo },
        { provide: getRepositoryToken(OperatorStory), useValue: mockStoryRepo },
        {
          provide: getRepositoryToken(OperatorService),
          useValue: mockServiceRepo,
        },
        {
          provide: getRepositoryToken(OperatorPolicy),
          useValue: mockPolicyRepo,
        },
        { provide: getRepositoryToken(Review), useValue: mockReviewRepo },
        { provide: getRepositoryToken(Booking), useValue: mockBookingRepo },
      ],
    }).compile();
    service = module.get(OperatorsService);
  });

  // helper to set up recalculateRating mock
  function setupRecalculateRating(avg = '4.5', count = '5') {
    mockReviewRepo.createQueryBuilder.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ avg, count }),
    });
  }

  // ─── findAll ──────────────────────────────────────────────────
  describe('findAll', () => {
    it('should return paginated active operators', async () => {
      const qb = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockOperator], 1]),
      };
      mockOperatorRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll({ page: 1, limit: 20, skip: 0 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(qb.where).toHaveBeenCalledWith('o.status = :status', {
        status: 'active',
      });
    });
  });

  // ─── findOne ──────────────────────────────────────────────────
  describe('findOne', () => {
    it('should return operator', async () => {
      mockOperatorRepo.findOne.mockResolvedValue(mockOperator);
      const result = await service.findOne('op-tsc');
      expect(result.id).toBe('op-tsc');
    });

    it('should throw NotFoundException', async () => {
      mockOperatorRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('nope')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── findServices ─────────────────────────────────────────────
  describe('findServices', () => {
    it('should return active services for operator', async () => {
      mockOperatorRepo.findOne.mockResolvedValue(mockOperator);
      mockServiceRepo.find.mockResolvedValue([mockService]);

      const result = await service.findServices('op-tsc');

      expect(result).toHaveLength(1);
      expect(result[0].serviceName).toBe('AC');
    });
  });

  // ─── findStories ──────────────────────────────────────────────
  describe('findStories', () => {
    it('should return stories for operator', async () => {
      mockOperatorRepo.findOne.mockResolvedValue(mockOperator);
      mockStoryRepo.find.mockResolvedValue([mockStory]);

      const result = await service.findStories('op-tsc');

      expect(result).toHaveLength(1);
    });
  });

  // ─── findReviews ──────────────────────────────────────────────
  describe('findReviews', () => {
    it('should return paginated approved reviews', async () => {
      mockOperatorRepo.findOne.mockResolvedValue(mockOperator);
      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockReview], 1]),
      };
      mockReviewRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findReviews('op-tsc', {
        page: 1,
        limit: 20,
        skip: 0,
      });

      expect(result.data).toHaveLength(1);
      expect(qb.andWhere).toHaveBeenCalledWith('r.status = :status', {
        status: 'approved',
      });
    });
  });

  // ─── findPolicies ─────────────────────────────────────────────
  describe('findPolicies', () => {
    it('should return policies for operator', async () => {
      mockOperatorRepo.findOne.mockResolvedValue(mockOperator);
      mockPolicyRepo.find.mockResolvedValue([mockPolicy]);

      const result = await service.findPolicies('op-tsc');

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Cancellation');
    });
  });

  // ─── createReview ─────────────────────────────────────────────
  describe('createReview', () => {
    const dto = {
      tripId: 'trip-001',
      operatorId: 'op-tsc',
      rating: 5,
      title: 'Great',
      comment: 'Loved it',
    };

    it('should create a review when user has completed booking', async () => {
      mockOperatorRepo.findOne.mockResolvedValue(mockOperator);
      mockBookingRepo.findOne.mockResolvedValue({
        id: 'bk-1',
        status: BookingStatus.COMPLETED,
      });
      mockReviewRepo.findOne.mockResolvedValue(null); // no duplicate
      setupRecalculateRating();

      const result = await service.createReview(userId, dto);

      expect(result.isVerifiedTraveler).toBe(true);
      expect(result.status).toBe('approved');
      expect(mockReviewRepo.save).toHaveBeenCalled();
      expect(mockOperatorRepo.update).toHaveBeenCalled();
    });

    it('should throw BadRequestException if no completed booking', async () => {
      mockOperatorRepo.findOne.mockResolvedValue(mockOperator);
      mockBookingRepo.findOne.mockResolvedValue(null);

      await expect(service.createReview(userId, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException if duplicate review', async () => {
      mockOperatorRepo.findOne.mockResolvedValue(mockOperator);
      mockBookingRepo.findOne.mockResolvedValue({
        id: 'bk-1',
        status: BookingStatus.COMPLETED,
      });
      mockReviewRepo.findOne.mockResolvedValue(mockReview);

      await expect(service.createReview(userId, dto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  // ─── findMyReviews ────────────────────────────────────────────
  describe('findMyReviews', () => {
    it('should return paginated user reviews', async () => {
      const qb = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockReview], 1]),
      };
      mockReviewRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findMyReviews(userId, {
        page: 1,
        limit: 20,
        skip: 0,
      });

      expect(result.data).toHaveLength(1);
    });
  });

  // ─── updateReview ─────────────────────────────────────────────
  describe('updateReview', () => {
    it('should update own review and recalculate rating', async () => {
      mockReviewRepo.findOne.mockResolvedValue({ ...mockReview });
      setupRecalculateRating();

      const result = await service.updateReview('rev-uuid-1', userId, {
        rating: 4,
        title: 'Updated',
      });

      expect(result.rating).toBe(4);
      expect(result.title).toBe('Updated');
      expect(mockOperatorRepo.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if review not owned by user', async () => {
      mockReviewRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateReview('rev-uuid-1', 'other-user', { rating: 1 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── deleteReview ─────────────────────────────────────────────
  describe('deleteReview', () => {
    it('should delete review and recalculate rating', async () => {
      mockReviewRepo.findOne.mockResolvedValue({ ...mockReview });
      setupRecalculateRating('0', '0');

      await service.deleteReview('rev-uuid-1', userId);

      expect(mockReviewRepo.remove).toHaveBeenCalled();
      expect(mockOperatorRepo.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if review not found', async () => {
      mockReviewRepo.findOne.mockResolvedValue(null);

      await expect(service.deleteReview('rev-uuid-1', userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── Admin: create ────────────────────────────────────────────
  describe('create (admin)', () => {
    const dto = {
      id: 'op-new',
      name: 'New Operator',
      operatorLogo: '🚐',
      logoUrl: 'https://example.com/logo.png',
      description: 'A new operator',
    } as any;

    it('should create operator', async () => {
      mockOperatorRepo.findOne.mockResolvedValue(null);

      const result = await service.create(dto);

      expect(result.id).toBe('op-new');
      expect(mockOperatorRepo.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if operator already exists', async () => {
      mockOperatorRepo.findOne.mockResolvedValue(mockOperator);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  // ─── Admin: update ────────────────────────────────────────────
  describe('update (admin)', () => {
    it('should update operator', async () => {
      mockOperatorRepo.findOne.mockResolvedValue({ ...mockOperator });

      const result = await service.update('op-tsc', { name: 'TSC Updated' });

      expect(result.name).toBe('TSC Updated');
      expect(mockOperatorRepo.save).toHaveBeenCalled();
    });
  });

  // ─── Admin: remove ────────────────────────────────────────────
  describe('remove (admin)', () => {
    it('should remove operator', async () => {
      mockOperatorRepo.findOne.mockResolvedValue(mockOperator);

      await service.remove('op-tsc');

      expect(mockOperatorRepo.remove).toHaveBeenCalledWith(mockOperator);
    });

    it('should throw NotFoundException if not found', async () => {
      mockOperatorRepo.findOne.mockResolvedValue(null);

      await expect(service.remove('nope')).rejects.toThrow(NotFoundException);
    });
  });
});
