import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { StoriesService } from './stories.service';
import { OperatorStory, AdminStory, StoryView } from '../database/entities';

describe('StoriesService', () => {
  let service: StoriesService;
  let operatorStoryRepo: Record<string, jest.Mock>;
  let adminStoryRepo: Record<string, jest.Mock>;
  let storyViewRepo: Record<string, jest.Mock>;

  const mockStory: Partial<OperatorStory> = {
    id: 'story-001',
    operatorId: 'op-001',
    type: 'PROMOTIONS',
    mediaType: 'image',
    title: 'Promo Ete',
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  };

  beforeEach(async () => {
    operatorStoryRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn((e: any) => Promise.resolve(e)),
      create: jest.fn((e: any) => ({ ...e })),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockStory]),
      })),
    };

    adminStoryRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      })),
    };

    storyViewRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn((e: any) => Promise.resolve(e)),
      create: jest.fn((e: any) => ({ ...e })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoriesService,
        {
          provide: getRepositoryToken(OperatorStory),
          useValue: operatorStoryRepo,
        },
        { provide: getRepositoryToken(AdminStory), useValue: adminStoryRepo },
        { provide: getRepositoryToken(StoryView), useValue: storyViewRepo },
      ],
    }).compile();

    service = module.get<StoriesService>(StoriesService);
  });

  describe('findAll', () => {
    it('should return operator and admin stories', async () => {
      operatorStoryRepo.find.mockResolvedValue([mockStory]);
      adminStoryRepo.find.mockResolvedValue([]);

      const result = await service.findAll();
      expect(result.operatorStories).toHaveLength(1);
      expect(result.adminStories).toHaveLength(0);
    });
  });

  describe('findActive', () => {
    it('should return active non-expired stories', async () => {
      const result = await service.findActive();
      expect(result.operatorStories).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return story by ID', async () => {
      operatorStoryRepo.findOne.mockResolvedValue(mockStory);
      const result = await service.findOne('story-001');
      expect(result.id).toBe('story-001');
    });

    it('should throw NotFoundException when not found', async () => {
      operatorStoryRepo.findOne.mockResolvedValue(null);
      adminStoryRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('nope')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create an operator story', async () => {
      const result = await service.create('op-001', {
        title: 'New Route',
        type: 'NEW_ROUTE',
        mediaType: 'gradient',
      });
      expect(result.title).toBe('New Route');
      expect(result.operatorId).toBe('op-001');
      expect(operatorStoryRepo.save).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update own story', async () => {
      operatorStoryRepo.findOne.mockResolvedValue({ ...mockStory });
      const result = await service.update('story-001', 'op-001', {
        title: 'Updated',
      });
      expect(result.title).toBe('Updated');
    });

    it('should throw ForbiddenException for other operator', async () => {
      operatorStoryRepo.findOne.mockResolvedValue({ ...mockStory });
      await expect(
        service.update('story-001', 'op-other', { title: 'Hack' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException', async () => {
      operatorStoryRepo.findOne.mockResolvedValue(null);
      await expect(
        service.update('nope', 'op-001', { title: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove own story', async () => {
      operatorStoryRepo.findOne.mockResolvedValue({ ...mockStory });
      await service.remove('story-001', 'op-001');
      expect(operatorStoryRepo.remove).toHaveBeenCalled();
    });

    it('should throw ForbiddenException for other operator', async () => {
      operatorStoryRepo.findOne.mockResolvedValue({ ...mockStory });
      await expect(service.remove('story-001', 'op-other')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('markViewed', () => {
    it('should create a new view', async () => {
      storyViewRepo.findOne.mockResolvedValue(null);
      await service.markViewed('user-001', 'story-001');
      expect(storyViewRepo.create).toHaveBeenCalled();
      expect(storyViewRepo.save).toHaveBeenCalled();
    });

    it('should update existing view', async () => {
      const existing = {
        userId: 'user-001',
        storyId: 'story-001',
        viewedAt: new Date(),
      };
      storyViewRepo.findOne.mockResolvedValue(existing);
      await service.markViewed('user-001', 'story-001');
      expect(storyViewRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-001' }),
      );
    });
  });

  describe('getViewedStories', () => {
    it('should return viewed story IDs', async () => {
      storyViewRepo.find.mockResolvedValue([
        { userId: 'user-001', storyId: 'story-001' },
        { userId: 'user-001', storyId: 'story-002' },
      ]);
      const result = await service.getViewedStories('user-001');
      expect(result).toEqual(['story-001', 'story-002']);
    });
  });
});
