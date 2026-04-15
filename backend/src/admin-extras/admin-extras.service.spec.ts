import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { AdminExtrasService } from './admin-extras.service';
import { StoryCircle, FeatureFlag } from '../database/entities';

const mockStoryCircle = {
  id: 'sc-1',
  name: 'Test Circle',
  description: 'desc',
  sortOrder: 0,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockFeatureFlag = {
  id: 'ff-1',
  key: 'dark_mode',
  name: 'Dark Mode',
  description: 'Enable dark mode',
  isEnabled: false,
  conditions: {},
  category: 'release',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('AdminExtrasService', () => {
  let service: AdminExtrasService;

  const storyCircleRepo = {
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };
  const featureFlagRepo = {
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminExtrasService,
        { provide: getRepositoryToken(StoryCircle), useValue: storyCircleRepo },
        { provide: getRepositoryToken(FeatureFlag), useValue: featureFlagRepo },
      ],
    }).compile();

    service = module.get(AdminExtrasService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── Story Circles ────────────────────────────────────────────

  describe('findAllStoryCircles', () => {
    it('should return paginated story circles', async () => {
      storyCircleRepo.findAndCount.mockResolvedValue([[mockStoryCircle], 1]);
      const result = await service.findAllStoryCircles({
        page: 1,
        limit: 10,
        skip: 0,
      } as any);
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findOneStoryCircle', () => {
    it('should return a story circle', async () => {
      storyCircleRepo.findOne.mockResolvedValue(mockStoryCircle);
      const result = await service.findOneStoryCircle('sc-1');
      expect(result.id).toBe('sc-1');
    });

    it('should throw NotFoundException', async () => {
      storyCircleRepo.findOne.mockResolvedValue(null);
      await expect(service.findOneStoryCircle('nope')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createStoryCircle', () => {
    it('should create and return', async () => {
      storyCircleRepo.create.mockReturnValue(mockStoryCircle);
      storyCircleRepo.save.mockResolvedValue(mockStoryCircle);
      const result = await service.createStoryCircle({ name: 'Test' });
      expect(result.id).toBe('sc-1');
    });
  });

  describe('updateStoryCircle', () => {
    it('should update and return', async () => {
      storyCircleRepo.findOne.mockResolvedValue({ ...mockStoryCircle });
      storyCircleRepo.save.mockResolvedValue({
        ...mockStoryCircle,
        name: 'Updated',
      });
      const result = await service.updateStoryCircle('sc-1', {
        name: 'Updated',
      });
      expect(result.name).toBe('Updated');
    });
  });

  describe('deleteStoryCircle', () => {
    it('should delete', async () => {
      storyCircleRepo.findOne.mockResolvedValue(mockStoryCircle);
      storyCircleRepo.remove.mockResolvedValue(mockStoryCircle);
      await service.deleteStoryCircle('sc-1');
      expect(storyCircleRepo.remove).toHaveBeenCalled();
    });
  });

  // ─── Feature Flags ────────────────────────────────────────────

  describe('findAllFeatureFlags', () => {
    it('should return paginated flags', async () => {
      featureFlagRepo.findAndCount.mockResolvedValue([[mockFeatureFlag], 1]);
      const result = await service.findAllFeatureFlags({
        page: 1,
        limit: 10,
        skip: 0,
      } as any);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('findOneFeatureFlag', () => {
    it('should return a flag', async () => {
      featureFlagRepo.findOne.mockResolvedValue(mockFeatureFlag);
      const result = await service.findOneFeatureFlag('ff-1');
      expect(result.key).toBe('dark_mode');
    });

    it('should throw NotFoundException', async () => {
      featureFlagRepo.findOne.mockResolvedValue(null);
      await expect(service.findOneFeatureFlag('nope')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createFeatureFlag', () => {
    it('should create and return', async () => {
      featureFlagRepo.create.mockReturnValue(mockFeatureFlag);
      featureFlagRepo.save.mockResolvedValue(mockFeatureFlag);
      const result = await service.createFeatureFlag({ key: 'dark_mode' });
      expect(result.key).toBe('dark_mode');
    });
  });

  describe('toggleFeatureFlag', () => {
    it('should toggle isEnabled', async () => {
      featureFlagRepo.findOne.mockResolvedValue({
        ...mockFeatureFlag,
        isEnabled: false,
      });
      featureFlagRepo.save.mockResolvedValue({
        ...mockFeatureFlag,
        isEnabled: true,
      });
      const result = await service.toggleFeatureFlag('ff-1');
      expect(result.isEnabled).toBe(true);
    });
  });

  describe('deleteFeatureFlag', () => {
    it('should delete', async () => {
      featureFlagRepo.findOne.mockResolvedValue(mockFeatureFlag);
      featureFlagRepo.remove.mockResolvedValue(mockFeatureFlag);
      await service.deleteFeatureFlag('ff-1');
      expect(featureFlagRepo.remove).toHaveBeenCalled();
    });
  });
});
