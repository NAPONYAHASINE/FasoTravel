import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IntegrationsService } from './integrations.service';
import {
  Integration,
  IntegrationAlertRule,
  IntegrationAlert,
} from '../database/entities';

describe('IntegrationsService', () => {
  let service: IntegrationsService;
  let integrationRepo: Record<string, jest.Mock>;
  let ruleRepo: Record<string, jest.Mock>;
  let alertRepo: Record<string, jest.Mock>;

  const mockIntegration: Partial<Integration> = {
    id: 'int-001',
    name: 'PaydunYa',
    type: 'paydunya',
    status: 'active',
    config: { apiKey: '***' },
    mode: 'sandbox',
    healthStatus: 'healthy',
    lastHealthCheck: new Date(),
  };

  const mockRule: Partial<IntegrationAlertRule> = {
    id: 'rule-001',
    integrationId: 'int-001',
    name: 'Latency Alert',
    type: 'latency',
    isActive: true,
  };

  const mockAlert: Partial<IntegrationAlert> = {
    id: 'alert-001',
    ruleId: 'rule-001',
    integrationId: 'int-001',
    status: 'active',
    severity: 'warning',
    message: 'High latency detected',
    firedAt: new Date(),
  };

  beforeEach(async () => {
    integrationRepo = {
      find: jest.fn().mockResolvedValue([mockIntegration]),
      findOneBy: jest.fn().mockResolvedValue(mockIntegration),
      create: jest.fn((e: any) => e),
      save: jest.fn((e: any) => Promise.resolve(e)),
      remove: jest.fn(),
    };

    ruleRepo = {
      find: jest.fn().mockResolvedValue([mockRule]),
      findOneBy: jest.fn().mockResolvedValue(mockRule),
      create: jest.fn((e: any) => e),
      save: jest.fn((e: any) => Promise.resolve(e)),
      remove: jest.fn(),
    };

    alertRepo = {
      find: jest.fn().mockResolvedValue([mockAlert]),
      findOneBy: jest.fn().mockResolvedValue(mockAlert),
      save: jest.fn((e: any) => Promise.resolve(e)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntegrationsService,
        { provide: getRepositoryToken(Integration), useValue: integrationRepo },
        {
          provide: getRepositoryToken(IntegrationAlertRule),
          useValue: ruleRepo,
        },
        {
          provide: getRepositoryToken(IntegrationAlert),
          useValue: alertRepo,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, fallback?: string) => fallback ?? null),
          },
        },
      ],
    }).compile();

    service = module.get<IntegrationsService>(IntegrationsService);
  });

  // ═══════ CRUD ═══════

  it('findAll returns integrations', async () => {
    const result = await service.findAll();
    expect(result).toEqual([mockIntegration]);
  });

  it('findOne returns integration', async () => {
    const result = await service.findOne('int-001');
    expect(result).toEqual(mockIntegration);
  });

  it('findOne throws when not found', async () => {
    integrationRepo.findOneBy.mockResolvedValueOnce(null);
    await expect(service.findOne('x')).rejects.toThrow(NotFoundException);
  });

  it('create saves new integration', async () => {
    const dto = { name: 'WhatsApp', type: 'whatsapp', status: 'active' };
    await service.create(dto);
    expect(integrationRepo.create).toHaveBeenCalledWith(dto);
    expect(integrationRepo.save).toHaveBeenCalled();
  });

  it('update merges dto into existing', async () => {
    await service.update('int-001', { status: 'inactive' });
    expect(integrationRepo.save).toHaveBeenCalled();
  });

  it('remove deletes integration', async () => {
    await service.remove('int-001');
    expect(integrationRepo.remove).toHaveBeenCalled();
  });

  it('testConnectivity updates health status', async () => {
    const result = await service.testConnectivity('int-001');
    expect(result.status).toBe('healthy');
    expect(integrationRepo.save).toHaveBeenCalled();
  });

  // ═══════ ALERT RULES ═══════

  it('getAlertRules returns rules for integration', async () => {
    const result = await service.getAlertRules('int-001');
    expect(ruleRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { integrationId: 'int-001' },
      }),
    );
    expect(result).toEqual([mockRule]);
  });

  it('createAlertRule creates rule', async () => {
    const dto = { name: 'Error Rate', type: 'error_rate' };
    await service.createAlertRule('int-001', dto);
    expect(ruleRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ integrationId: 'int-001', name: 'Error Rate' }),
    );
  });

  it('updateAlertRule updates existing rule', async () => {
    await service.updateAlertRule('rule-001', { name: 'Updated' });
    expect(ruleRepo.save).toHaveBeenCalled();
  });

  it('updateAlertRule throws when not found', async () => {
    ruleRepo.findOneBy.mockResolvedValueOnce(null);
    await expect(service.updateAlertRule('x', { name: 'A' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('deleteAlertRule removes rule', async () => {
    await service.deleteAlertRule('rule-001');
    expect(ruleRepo.remove).toHaveBeenCalled();
  });

  it('deleteAlertRule throws when not found', async () => {
    ruleRepo.findOneBy.mockResolvedValueOnce(null);
    await expect(service.deleteAlertRule('x')).rejects.toThrow(
      NotFoundException,
    );
  });

  // ═══════ ALERTS ═══════

  it('getAlerts returns alerts', async () => {
    const result = await service.getAlerts('int-001');
    expect(alertRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { integrationId: 'int-001' },
      }),
    );
    expect(result).toEqual([mockAlert]);
  });

  it('getAlerts returns all when no integrationId', async () => {
    await service.getAlerts();
    expect(alertRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    );
  });

  it('acknowledgeAlert updates alert', async () => {
    const result = await service.acknowledgeAlert('alert-001', 'usr-001');
    expect(alertRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'acknowledged',
        acknowledgedBy: 'usr-001',
      }),
    );
    expect(result).toBeDefined();
  });

  it('acknowledgeAlert throws when not found', async () => {
    alertRepo.findOneBy.mockResolvedValueOnce(null);
    await expect(service.acknowledgeAlert('x', 'usr-001')).rejects.toThrow(
      NotFoundException,
    );
  });

  // ═══════ PAYDUNYA ═══════

  it('getPaydunyaConfig returns config or default', async () => {
    const result = await service.getPaydunyaConfig();
    expect(result).toEqual(mockIntegration);
  });

  it('getPaydunyaConfig returns default when not found', async () => {
    integrationRepo.findOneBy.mockResolvedValueOnce(null);
    const result = await service.getPaydunyaConfig();
    expect(result).toEqual(
      expect.objectContaining({ type: 'paydunya', status: 'not_configured' }),
    );
  });

  it('updatePaydunyaConfig creates integration if not found', async () => {
    integrationRepo.findOneBy.mockResolvedValueOnce(null);
    await service.updatePaydunyaConfig({ mode: 'live' });
    expect(integrationRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'PaydunYa', type: 'paydunya' }),
    );
  });

  it('updatePaydunyaConfig updates existing', async () => {
    integrationRepo.findOneBy.mockResolvedValueOnce({ ...mockIntegration });
    await service.updatePaydunyaConfig({ apiKey: 'new-key' });
    expect(integrationRepo.save).toHaveBeenCalled();
  });

  it('getPaydunyaHealth returns health status', async () => {
    const result = await service.getPaydunyaHealth();
    expect(result.status).toBeDefined();
  });

  it('getPaydunyaStats returns stats', () => {
    const result = service.getPaydunyaStats();
    expect(result.channels).toContain('orange_money');
  });

  it('getPaydunyaWebhookLogs returns array', () => {
    const result = service.getPaydunyaWebhookLogs();
    expect(Array.isArray(result)).toBe(true);
  });

  // ═══════ WHATSAPP ═══════

  it('getWhatsappInfo returns info', async () => {
    const result = await service.getWhatsappInfo();
    expect(result).toBeDefined();
  });

  it('sendWhatsappTestMessage returns sent status', () => {
    const result = service.sendWhatsappTestMessage({
      phone: '+22670000000',
      message: 'Test',
    });
    expect(result.status).toBe('sent');
    expect(result.to).toBe('+22670000000');
  });

  it('getWhatsappHealth returns healthy', () => {
    const result = service.getWhatsappHealth();
    expect(result.status).toBe('healthy');
  });

  it('getWhatsappDeliveryStats returns stats', () => {
    const result = service.getWhatsappDeliveryStats();
    expect(result).toHaveProperty('sent');
    expect(result).toHaveProperty('delivered');
  });

  // ═══════ AWS ═══════

  it('getAwsHealth returns service statuses', () => {
    const result = service.getAwsHealth();
    expect(result).toHaveProperty('s3');
    expect(result).toHaveProperty('cloudfront');
    expect(result).toHaveProperty('lightsail');
  });

  it('getS3Stats returns stats', () => {
    const result = service.getS3Stats();
    expect(result).toHaveProperty('totalObjects');
  });

  it('getCdnStats returns stats', () => {
    const result = service.getCdnStats();
    expect(result).toHaveProperty('cacheHitRate');
  });

  it('getLightsailMetrics returns metrics', () => {
    const result = service.getLightsailMetrics();
    expect(result).toHaveProperty('cpuUtilization');
  });

  it('purgeCdn returns initiated status', () => {
    const result = service.purgeCdn();
    expect(result.status).toBe('purge_initiated');
  });

  it('restartLightsail returns initiated status', () => {
    const result = service.restartLightsail();
    expect(result.status).toBe('restart_initiated');
  });
});
