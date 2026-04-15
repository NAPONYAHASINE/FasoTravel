import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PoliciesService } from './policies.service';
import { OperatorPolicy, PlatformPolicy } from '../database/entities';

describe('PoliciesService', () => {
  let service: PoliciesService;

  const mockOperatorRepo = {
    find: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn((d) => d),
    save: jest.fn((d) => Promise.resolve({ id: 'policy1', ...d })),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[{ id: 'policy1' }], 1]),
    })),
  };

  const mockPlatformRepo = {
    find: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn((d) => d),
    save: jest.fn((d) => Promise.resolve({ id: 'plat1', ...d })),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[{ id: 'plat1' }], 1]),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PoliciesService,
        {
          provide: getRepositoryToken(OperatorPolicy),
          useValue: mockOperatorRepo,
        },
        {
          provide: getRepositoryToken(PlatformPolicy),
          useValue: mockPlatformRepo,
        },
      ],
    }).compile();

    service = module.get(PoliciesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ========== OPERATOR POLICIES ==========

  it('findAllOperator returns paginated list', async () => {
    const result = await service.findAllOperator({ page: 1, limit: 20 } as any);
    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it('findOneOperator returns policy', async () => {
    mockOperatorRepo.findOneBy.mockResolvedValue({ id: 'p1', title: 'Cancel' });
    const result = await service.findOneOperator('p1');
    expect(result.title).toBe('Cancel');
  });

  it('findOneOperator throws when not found', async () => {
    mockOperatorRepo.findOneBy.mockResolvedValue(null);
    await expect(service.findOneOperator('nope')).rejects.toThrow(
      'Operator policy not found',
    );
  });

  it('createOperator creates policy', async () => {
    const result = await service.createOperator({
      type: 'cancellation',
      title: 'Cancel Policy',
      description: 'Test',
    });
    expect(result.title).toBe('Cancel Policy');
    expect(mockOperatorRepo.save).toHaveBeenCalled();
  });

  it('deleteOperator removes policy', async () => {
    mockOperatorRepo.findOneBy.mockResolvedValue({ id: 'p1' });
    await service.deleteOperator('p1');
    expect(mockOperatorRepo.remove).toHaveBeenCalled();
  });

  it('updateCompliance returns updated status', async () => {
    mockOperatorRepo.findOneBy.mockResolvedValue({ id: 'p1', title: 'Test' });
    const result = await service.updateCompliance('p1', {
      complianceStatus: 'compliant',
      complianceNote: 'OK',
    });
    expect(result.complianceStatus).toBe('compliant');
  });

  // ========== PLATFORM POLICIES ==========

  it('findAllPlatform returns paginated list', async () => {
    const result = await service.findAllPlatform({ page: 1, limit: 20 } as any);
    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it('findOnePlatform returns policy', async () => {
    mockPlatformRepo.findOneBy.mockResolvedValue({ id: 'plat1', title: 'CGU' });
    const result = await service.findOnePlatform('plat1');
    expect(result.title).toBe('CGU');
  });

  it('findOnePlatform throws when not found', async () => {
    mockPlatformRepo.findOneBy.mockResolvedValue(null);
    await expect(service.findOnePlatform('nope')).rejects.toThrow(
      'Platform policy not found',
    );
  });

  it('createPlatform creates draft policy', async () => {
    const result = await service.createPlatform({
      type: 'terms',
      title: 'CGU',
      content: 'Content',
      summary: 'Summary',
    });
    expect(result.title).toBe('CGU');
    expect(result.status).toBe('draft');
    expect(mockPlatformRepo.save).toHaveBeenCalled();
  });

  it('updatePlatform updates fields', async () => {
    const policy = { id: 'plat1', title: 'Old', content: 'Old' };
    mockPlatformRepo.findOneBy.mockResolvedValue(policy);
    mockPlatformRepo.save.mockResolvedValue({ ...policy, title: 'New' });
    const result = await service.updatePlatform('plat1', { title: 'New' });
    expect(result.title).toBe('New');
  });

  it('deletePlatform removes policy', async () => {
    mockPlatformRepo.findOneBy.mockResolvedValue({ id: 'plat1' });
    await service.deletePlatform('plat1');
    expect(mockPlatformRepo.remove).toHaveBeenCalled();
  });

  it('publishPlatform sets status to published', async () => {
    const policy = {
      id: 'plat1',
      status: 'draft',
      version: '1.0',
      publishedAt: null,
      lastPublishedVersion: null,
    };
    mockPlatformRepo.findOneBy.mockResolvedValue(policy);
    mockPlatformRepo.save.mockResolvedValue({
      ...policy,
      status: 'published',
      lastPublishedVersion: '1.0',
    });
    const result = await service.publishPlatform('plat1');
    expect(result.status).toBe('published');
    expect(result.lastPublishedVersion).toBe('1.0');
  });

  it('archivePlatform sets status to archived', async () => {
    const policy = { id: 'plat1', status: 'published' };
    mockPlatformRepo.findOneBy.mockResolvedValue(policy);
    mockPlatformRepo.save.mockResolvedValue({ ...policy, status: 'archived' });
    const result = await service.archivePlatform('plat1');
    expect(result.status).toBe('archived');
  });

  it('getPublishedPolicies returns only published', async () => {
    const list = [{ id: 'plat1', status: 'published' }];
    mockPlatformRepo.find.mockResolvedValue(list);
    const result = await service.getPublishedPolicies('published', 'global');
    expect(result).toEqual(list);
    expect(mockPlatformRepo.find).toHaveBeenCalledWith({
      where: { status: 'published', scope: 'global' },
      order: { createdAt: 'DESC' },
    });
  });
});
