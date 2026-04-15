import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import {
  Integration,
  IntegrationAlertRule,
  IntegrationAlert,
} from '../database/entities';

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);

  constructor(
    @InjectRepository(Integration)
    private readonly integrationRepo: Repository<Integration>,
    @InjectRepository(IntegrationAlertRule)
    private readonly ruleRepo: Repository<IntegrationAlertRule>,
    @InjectRepository(IntegrationAlert)
    private readonly alertRepo: Repository<IntegrationAlert>,
    private readonly configService: ConfigService,
  ) {}

  // ═══════ INTEGRATIONS CRUD ═══════

  async findAll() {
    return this.integrationRepo.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string) {
    const i = await this.integrationRepo.findOneBy({ id });
    if (!i) throw new NotFoundException('Integration not found');
    return i;
  }

  async create(dto: Record<string, any>) {
    const integration = this.integrationRepo.create(dto);
    return this.integrationRepo.save(integration);
  }

  async update(id: string, dto: Record<string, any>) {
    const i = await this.findOne(id);
    Object.assign(i, dto);
    return this.integrationRepo.save(i);
  }

  async remove(id: string) {
    const i = await this.findOne(id);
    await this.integrationRepo.remove(i);
  }

  async testConnectivity(id: string) {
    const i = await this.findOne(id);
    // Simulate connectivity test
    i.lastHealthCheck = new Date();
    i.healthStatus = 'healthy';
    await this.integrationRepo.save(i);
    return { status: 'healthy', checkedAt: i.lastHealthCheck };
  }

  async toggle(id: string) {
    const i = await this.findOne(id);
    i.status = i.status === 'active' ? 'inactive' : 'active';
    return this.integrationRepo.save(i);
  }

  async getActiveAlertCount() {
    const count = await this.alertRepo.count({
      where: { acknowledgedAt: undefined as unknown as Date },
    });
    return { activeCount: count };
  }

  // ═══════ ALERT RULES ═══════

  async getAlertRules(integrationId: string) {
    return this.ruleRepo.find({
      where: { integrationId },
      order: { name: 'ASC' },
    });
  }

  async createAlertRule(integrationId: string, dto: Record<string, any>) {
    const rule = this.ruleRepo.create({ integrationId, ...dto });
    return this.ruleRepo.save(rule);
  }

  async updateAlertRule(id: string, dto: Record<string, any>) {
    const rule = await this.ruleRepo.findOneBy({ id });
    if (!rule) throw new NotFoundException('Alert rule not found');
    Object.assign(rule, dto);
    return this.ruleRepo.save(rule);
  }

  async deleteAlertRule(id: string) {
    const rule = await this.ruleRepo.findOneBy({ id });
    if (!rule) throw new NotFoundException('Alert rule not found');
    await this.ruleRepo.remove(rule);
  }

  // ═══════ ALERTS ═══════

  async getAlerts(integrationId?: string) {
    const where = integrationId ? { integrationId } : {};
    return this.alertRepo.find({
      where,
      order: { firedAt: 'DESC' },
      take: 100,
    });
  }

  async acknowledgeAlert(id: string, userId: string) {
    const alert = await this.alertRepo.findOneBy({ id });
    if (!alert) throw new NotFoundException('Alert not found');
    alert.status = 'acknowledged';
    alert.acknowledgedBy = userId;
    alert.acknowledgedAt = new Date();
    return this.alertRepo.save(alert);
  }

  // ═══════ PAYDUNYA ADMIN ═══════

  async getPaydunyaConfig() {
    const i = await this.integrationRepo.findOneBy({ type: 'paydunya' });
    return i ?? { type: 'paydunya', status: 'not_configured', config: {} };
  }

  async updatePaydunyaConfig(dto: Record<string, string>) {
    let i = await this.integrationRepo.findOneBy({ type: 'paydunya' });
    if (!i) {
      i = this.integrationRepo.create({
        name: 'PaydunYa',
        type: 'paydunya',
        status: 'active',
        config: dto,
        mode: dto.mode ?? 'sandbox',
      });
    } else {
      i.config = { ...i.config, ...dto };
      if (dto.mode) i.mode = dto.mode;
    }
    return this.integrationRepo.save(i);
  }

  async getPaydunyaHealth() {
    const i = await this.integrationRepo.findOneBy({ type: 'paydunya' });
    return {
      status: i?.healthStatus ?? 'unknown',
      lastCheck: i?.lastHealthCheck,
      mode: i?.mode ?? 'sandbox',
    };
  }

  getPaydunyaStats() {
    return {
      totalTransactions: 0,
      successRate: 0,
      channels: ['orange_money', 'moov_money', 'wave', 'card'],
    };
  }

  getPaydunyaWebhookLogs() {
    return [] as unknown[];
  }

  async switchPaydunyaMode(mode: string) {
    let i = await this.integrationRepo.findOneBy({ type: 'paydunya' });
    if (!i) {
      i = this.integrationRepo.create({
        name: 'PaydunYa',
        type: 'paydunya',
        status: 'active',
        config: {},
        mode,
      });
    } else {
      i.mode = mode;
    }
    return this.integrationRepo.save(i);
  }

  async togglePaydunyaChannel(channelKey: string) {
    const i = await this.integrationRepo.findOneBy({ type: 'paydunya' });
    if (!i) {
      throw new NotFoundException('PaydunYa integration not configured');
    }
    const channels = (i.config?.channels ?? {}) as Record<
      string,
      { enabled: boolean; fee?: number }
    >;
    if (!channels[channelKey]) {
      channels[channelKey] = { enabled: true };
    } else {
      channels[channelKey].enabled = !channels[channelKey].enabled;
    }
    i.config = { ...i.config, channels };
    return this.integrationRepo.save(i);
  }

  async updatePaydunyaChannelFee(channelKey: string, fee: number) {
    const i = await this.integrationRepo.findOneBy({ type: 'paydunya' });
    if (!i) {
      throw new NotFoundException('PaydunYa integration not configured');
    }
    const channels = (i.config?.channels ?? {}) as Record<
      string,
      { enabled: boolean; fee?: number }
    >;
    if (!channels[channelKey]) {
      channels[channelKey] = { enabled: true, fee };
    } else {
      channels[channelKey].fee = fee;
    }
    i.config = { ...i.config, channels };
    return this.integrationRepo.save(i);
  }

  async testPaydunyaConnection() {
    const i = await this.integrationRepo.findOneBy({ type: 'paydunya' });
    if (!i) {
      return { success: false, message: 'PaydunYa integration not configured' };
    }
    // In production: make a test API call to PaydunYa sandbox
    return {
      success: true,
      mode: i.mode ?? 'sandbox',
      testedAt: new Date().toISOString(),
    };
  }

  // ═══════ WHATSAPP ADMIN ═══════

  async getWhatsappInfo() {
    const i = await this.integrationRepo.findOneBy({ type: 'whatsapp' });
    return i ?? { type: 'whatsapp', status: 'not_configured', config: {} };
  }

  sendWhatsappTestMessage(dto: { phone: string; message: string }) {
    return {
      status: 'sent',
      to: dto.phone,
      message: dto.message,
      sentAt: new Date().toISOString(),
    };
  }

  getWhatsappHealth() {
    return { status: 'healthy', provider: 'infobip' };
  }

  /**
   * Envoie un OTP via WhatsApp (Infobip).
   * En dev: log seulement. En prod: appel Infobip WhatsApp Business API.
   */
  async sendOtpViaWhatsApp(phone: string, otpCode: string): Promise<boolean> {
    const isProd = this.configService.get('NODE_ENV') === 'production';

    if (!isProd) {
      this.logger.log(`[DEV] OTP WhatsApp → ${phone}: ${otpCode}`);
      return true;
    }

    // Production: Infobip WhatsApp Business API
    const apiKey = this.configService.get<string>('INFOBIP_API_KEY');
    const baseUrl = this.configService.get<string>('INFOBIP_BASE_URL');

    if (!apiKey || !baseUrl) {
      this.logger.warn('Infobip WhatsApp non configuré — OTP non envoyé');
      return false;
    }

    try {
      const response = await fetch(`${baseUrl}/whatsapp/1/message/text`, {
        method: 'POST',
        headers: {
          Authorization: `App ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.configService.get<string>(
            'WHATSAPP_SENDER_NUMBER',
            '226XXXXXXXX',
          ),
          to: phone.replace(/\s/g, ''),
          content: {
            text: `Votre code de vérification FasoTravel est : ${otpCode}. Valide pendant 10 minutes.`,
          },
        }),
      });

      if (!response.ok) {
        this.logger.error(`Infobip WhatsApp error: ${response.status}`);
        return false;
      }

      this.logger.log(`OTP WhatsApp envoyé à ${phone}`);
      return true;
    } catch (error) {
      this.logger.error(`Erreur envoi WhatsApp OTP: ${error}`);
      return false;
    }
  }

  getWhatsappDeliveryStats() {
    return { sent: 0, delivered: 0, failed: 0, deliveryRate: 0 };
  }

  // ═══════ AWS ADMIN ═══════

  getAwsHealth() {
    return {
      s3: 'healthy',
      cloudfront: 'healthy',
      lightsail: 'healthy',
    };
  }

  getS3Stats() {
    return {
      totalObjects: 0,
      totalSizeBytes: 0,
      buckets: [] as string[],
    };
  }

  getCdnStats() {
    return {
      totalRequests: 0,
      bytesTransferred: 0,
      cacheHitRate: 0,
    };
  }

  getLightsailMetrics() {
    return {
      cpuUtilization: 0,
      networkIn: 0,
      networkOut: 0,
      statusChecksFailed: 0,
    };
  }

  purgeCdn() {
    return { status: 'purge_initiated', timestamp: new Date().toISOString() };
  }

  restartLightsail() {
    return { status: 'restart_initiated', timestamp: new Date().toISOString() };
  }
}
