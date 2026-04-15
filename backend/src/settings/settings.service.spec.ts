import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SettingsService } from './settings.service';
import { AppSettings } from '../database/entities';

describe('SettingsService', () => {
  let service: SettingsService;
  let repo: Record<string, jest.Mock>;

  const mockSetting: Partial<AppSettings> = {
    id: 'set-001',
    key: 'app_name',
    value: { val: 'FasoTravel' } as any,
    category: 'general',
    description: 'App name',
    updatedBy: 'admin',
  };

  const mockBranding: Partial<AppSettings> = {
    id: 'set-002',
    key: 'app_logo',
    value: { url: 'https://cdn.example.com/logo.png' } as any,
    category: 'branding',
  };

  beforeEach(async () => {
    repo = {
      find: jest.fn().mockResolvedValue([mockSetting, mockBranding]),
      findOneBy: jest.fn(),
      create: jest.fn((e: any) => e),
      save: jest.fn((e: any) => Promise.resolve(e)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        { provide: getRepositoryToken(AppSettings), useValue: repo },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
  });

  it('getAll groups settings by category', async () => {
    const result = await service.getAll();
    expect(repo.find).toHaveBeenCalled();
    expect(result['general']).toBeDefined();
    expect(result['general']['app_name']).toEqual(mockSetting.value);
    expect(result['branding']).toBeDefined();
  });

  it('getByCategory returns flat map', async () => {
    repo.find.mockResolvedValueOnce([mockSetting]);
    const result = await service.getByCategory('general');
    expect(repo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { category: 'general' },
      }),
    );
    expect(result['app_name']).toEqual(mockSetting.value);
  });

  it('update upserts existing setting', async () => {
    repo.findOneBy.mockResolvedValueOnce({ ...mockSetting });
    const result = await service.update(
      { app_name: { val: 'NewName' } },
      'admin',
    );
    expect(repo.save).toHaveBeenCalled();
    expect(result).toHaveLength(1);
  });

  it('update creates new setting if key not found', async () => {
    repo.findOneBy.mockResolvedValueOnce(null);
    const result = await service.update({ new_key: 'some_value' }, 'admin');
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'new_key', category: 'general' }),
    );
    expect(result).toHaveLength(1);
  });

  it('uploadLogo updates existing logo setting', async () => {
    repo.findOneBy.mockResolvedValueOnce({ ...mockBranding });
    await service.uploadLogo('https://cdn.example.com/new-logo.png', 'admin');
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        value: { url: 'https://cdn.example.com/new-logo.png' },
      }),
    );
  });

  it('uploadLogo creates setting if not exists', async () => {
    repo.findOneBy.mockResolvedValueOnce(null);
    await service.uploadLogo('https://cdn.example.com/logo.png');
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'app_logo', category: 'branding' }),
    );
  });

  it('exportSettings returns all settings', async () => {
    const result = await service.exportSettings();
    expect(result.exportedAt).toBeDefined();
    expect(result.settings).toHaveLength(2);
    expect(result.settings[0].key).toBe('app_name');
  });

  it('importSettings upserts items', async () => {
    repo.findOneBy.mockResolvedValue(null);
    const data = [
      { key: 'new_1', value: 'v1', category: 'test' },
      { key: 'new_2', value: 'v2' },
    ];
    const result = await service.importSettings(data);
    expect(result.imported).toBe(2);
    expect(repo.save).toHaveBeenCalledTimes(2);
  });

  it('importSettings updates existing keys', async () => {
    repo.findOneBy.mockResolvedValueOnce({ ...mockSetting });
    const data = [{ key: 'app_name', value: { val: 'Updated' } }];
    const result = await service.importSettings(data);
    expect(result.imported).toBe(1);
    expect(repo.save).toHaveBeenCalled();
  });
});
