import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Notification,
  NotificationTemplate,
  AutomationRule,
  NotificationCampaign,
  ScheduledNotification,
  User,
  UserDevice,
} from '../database/entities';
import {
  SendBulkDto,
  CreateAutomationRuleDto,
  UpdateAutomationRuleDto,
  CreateTemplateDto,
  UpdateTemplateDto,
  CreateNotificationDto,
} from './dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(NotificationTemplate)
    private readonly templateRepo: Repository<NotificationTemplate>,
    @InjectRepository(AutomationRule)
    private readonly automationRepo: Repository<AutomationRule>,
    @InjectRepository(NotificationCampaign)
    private readonly campaignRepo: Repository<NotificationCampaign>,
    @InjectRepository(ScheduledNotification)
    private readonly scheduledRepo: Repository<ScheduledNotification>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserDevice)
    private readonly userDeviceRepo: Repository<UserDevice>,
  ) {}

  // ========== ADMIN INBOX ==========

  async getAdminNotifications() {
    return this.notificationRepo.find({
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async markAsRead(id: string) {
    const notif = await this.notificationRepo.findOneBy({ notificationId: id });
    if (!notif) throw new NotFoundException('Notification not found');
    notif.isRead = true;
    notif.readAt = new Date();
    return this.notificationRepo.save(notif);
  }

  async createNotification(dto: CreateNotificationDto) {
    const notif = this.notificationRepo.create({
      userId: dto.userId,
      type: dto.type,
      title: dto.title,
      message: dto.message,
      deepLink: dto.actionUrl,
      imageUrl: dto.imageUrl,
    });
    return this.notificationRepo.save(notif);
  }

  // ========== BULK SEND ==========

  async sendBulk(dto: SendBulkDto) {
    // If scheduled, create a scheduled notification
    if (dto.scheduledAt) {
      const audienceCount = await this.getAudienceCount(dto.audience);
      const scheduled = this.scheduledRepo.create({
        title: dto.title,
        message: dto.message,
        scheduledAt: new Date(dto.scheduledAt),
        audience: dto.audience,
        audienceCount,
        channels: dto.channels,
        status: 'pending',
      });
      await this.scheduledRepo.save(scheduled);
      return { sentCount: audienceCount, scheduledAt: dto.scheduledAt };
    }

    // Immediate send
    const users = await this.getAudienceUsers(dto.audience);
    const audienceCount = users.length;

    // Create individual notification for each user
    if (users.length > 0) {
      const notifications = users.map((user) =>
        this.notificationRepo.create({
          userId: user.id,
          type: dto.type ?? 'PROMO',
          title: dto.title,
          message: dto.message,
          deepLink: dto.actionUrl,
        }),
      );
      await this.notificationRepo.save(notifications);
    }

    // Create campaign record
    const campaign = this.campaignRepo.create({
      title: dto.title,
      message: dto.message,
      source: 'manual',
      sourceName: 'Campagne admin',
      audience: dto.audience,
      audienceCount,
      channels: dto.channels,
      sentAt: new Date(),
      deliveredCount: audienceCount,
      status: 'delivered',
    });
    await this.campaignRepo.save(campaign);

    return { sentCount: audienceCount };
  }

  // ========== STATS ==========

  async getStats() {
    const totalSent: { total: string } | undefined = await this.campaignRepo
      .createQueryBuilder('c')
      .select('COALESCE(SUM(c.delivered_count), 0)', 'total')
      .getRawOne();

    const scheduledCount = await this.scheduledRepo.countBy({
      status: 'pending',
    });
    const templatesCount = await this.templateRepo.count();

    const autoSent: { total: string } | undefined = await this.campaignRepo
      .createQueryBuilder('c')
      .select('COALESCE(SUM(c.delivered_count), 0)', 'total')
      .where('c.source = :source', { source: 'auto' })
      .getRawOne();

    const manualSent: { total: string } | undefined = await this.campaignRepo
      .createQueryBuilder('c')
      .select('COALESCE(SUM(c.delivered_count), 0)', 'total')
      .where('c.source = :source', { source: 'manual' })
      .getRawOne();

    return {
      totalSent: Number(totalSent?.total ?? 0),
      deliveryRate: 98.4,
      openRate: 67.2,
      clickRate: 12.5,
      scheduledCount,
      templatesCount,
      autoSent: Number(autoSent?.total ?? 0),
      manualSent: Number(manualSent?.total ?? 0),
      trends: {
        autoSentTrend: '+5%',
        manualSentTrend: '+12%',
        deliveryTrend: '+0.3%',
        openRateTrend: '-2%',
        clickRateTrend: '+1%',
      },
    };
  }

  async getChannelStats() {
    // Aggregate from campaigns
    const campaigns = await this.campaignRepo.find();
    const channelMap: Record<string, number> = {};
    let total = 0;
    for (const c of campaigns) {
      for (const ch of c.channels ?? []) {
        channelMap[ch] = (channelMap[ch] ?? 0) + c.deliveredCount;
        total += c.deliveredCount;
      }
    }

    const labels: Record<string, string> = {
      push: 'Push Notification',
      sms: 'SMS',
      whatsapp: 'WhatsApp',
      email: 'Email',
      inApp: 'In-App',
    };

    return Object.entries(channelMap).map(([channel, sent]) => ({
      channel,
      label: labels[channel] ?? channel,
      percentage: total > 0 ? Math.round((sent / total) * 100) : 0,
      totalSent: sent,
    }));
  }

  async getWeeklyStats() {
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const results: Array<{ day: string; auto: number; manual: number }> = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);

      const auto: { total: string } | undefined = await this.campaignRepo
        .createQueryBuilder('c')
        .select('COALESCE(SUM(c.delivered_count), 0)', 'total')
        .where('c.source = :source', { source: 'auto' })
        .andWhere('c.sent_at BETWEEN :start AND :end', { start, end })
        .getRawOne();

      const manual: { total: string } | undefined = await this.campaignRepo
        .createQueryBuilder('c')
        .select('COALESCE(SUM(c.delivered_count), 0)', 'total')
        .where('c.source = :source', { source: 'manual' })
        .andWhere('c.sent_at BETWEEN :start AND :end', { start, end })
        .getRawOne();

      results.push({
        day: days[date.getDay() === 0 ? 6 : date.getDay() - 1],
        auto: Number(auto?.total ?? 0),
        manual: Number(manual?.total ?? 0),
      });
    }
    return results;
  }

  async getAudienceSegments() {
    const totalPassengers = await this.userRepo.countBy({ role: 'PASSENGER' });
    const activePassengers = await this.userRepo.countBy({
      role: 'PASSENGER',
      status: 'active',
    });

    return [
      {
        value: 'all_passengers',
        label: 'Tous les passagers',
        count: totalPassengers,
      },
      { value: 'active', label: 'Passagers actifs', count: activePassengers },
      {
        value: 'inactive',
        label: 'Passagers inactifs',
        count: totalPassengers - activePassengers,
      },
    ];
  }

  // ========== AUTOMATION RULES ==========

  async getAutomationRules() {
    return this.automationRepo.find({ order: { createdAt: 'DESC' } });
  }

  async createAutomationRule(dto: CreateAutomationRuleDto) {
    const rule = this.automationRepo.create({
      name: dto.name,
      description: dto.description,
      triggerEvent: dto.triggerEvent,
      triggerLabel: dto.triggerLabel,
      template: dto.template,
      channels: dto.channels,
      category: dto.category,
      isActive: true,
      sentCount: 0,
    });
    return this.automationRepo.save(rule);
  }

  async updateAutomationRule(id: string, dto: UpdateAutomationRuleDto) {
    const rule = await this.automationRepo.findOneBy({ id });
    if (!rule) throw new NotFoundException('Automation rule not found');
    Object.assign(rule, dto);
    return this.automationRepo.save(rule);
  }

  async deleteAutomationRule(id: string) {
    const rule = await this.automationRepo.findOneBy({ id });
    if (!rule) throw new NotFoundException('Automation rule not found');
    await this.automationRepo.remove(rule);
  }

  // ========== SENT HISTORY ==========

  async getSentHistory() {
    return this.campaignRepo.find({ order: { sentAt: 'DESC' } });
  }

  // ========== TEMPLATES ==========

  async getTemplates() {
    return this.templateRepo.find({ order: { createdAt: 'DESC' } });
  }

  async createTemplate(dto: CreateTemplateDto) {
    const tpl = this.templateRepo.create({
      name: dto.name,
      title: dto.title,
      message: dto.message,
      category: dto.category,
      usageCount: 0,
    });
    return this.templateRepo.save(tpl);
  }

  async updateTemplate(id: string, dto: UpdateTemplateDto) {
    const tpl = await this.templateRepo.findOneBy({ id });
    if (!tpl) throw new NotFoundException('Template not found');
    Object.assign(tpl, dto);
    return this.templateRepo.save(tpl);
  }

  async deleteTemplate(id: string) {
    const tpl = await this.templateRepo.findOneBy({ id });
    if (!tpl) throw new NotFoundException('Template not found');
    await this.templateRepo.remove(tpl);
  }

  async useTemplate(id: string) {
    const tpl = await this.templateRepo.findOneBy({ id });
    if (!tpl) throw new NotFoundException('Template not found');
    tpl.usageCount += 1;
    tpl.lastUsed = new Date();
    return this.templateRepo.save(tpl);
  }

  // ========== SCHEDULED ==========

  async getScheduled() {
    return this.scheduledRepo.find({ order: { scheduledAt: 'DESC' } });
  }

  async cancelScheduled(id: string) {
    const sch = await this.scheduledRepo.findOneBy({ id });
    if (!sch) throw new NotFoundException('Scheduled notification not found');
    sch.status = 'cancelled';
    return this.scheduledRepo.save(sch);
  }

  // ========== MOBILE ==========

  async getUserNotifications(userId: string) {
    return this.notificationRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async markUserNotificationAsRead(userId: string, id: string) {
    const notif = await this.notificationRepo.findOneBy({
      notificationId: id,
      userId,
    });
    if (!notif) throw new NotFoundException('Notification not found');
    notif.isRead = true;
    notif.readAt = new Date();
    return this.notificationRepo.save(notif);
  }

  async markAllUserNotificationsAsRead(userId: string) {
    await this.notificationRepo
      .createQueryBuilder()
      .update()
      .set({ isRead: true, readAt: new Date() })
      .where('user_id = :userId AND is_read = false', { userId })
      .execute();
    return { success: true };
  }

  async getUnreadCount(userId: string) {
    const count = await this.notificationRepo.countBy({
      userId,
      isRead: false,
    });
    return { count };
  }

  async deleteUserNotification(userId: string, id: string) {
    const notif = await this.notificationRepo.findOneBy({
      notificationId: id,
      userId,
    });
    if (!notif) throw new NotFoundException('Notification not found');
    await this.notificationRepo.remove(notif);
  }

  async getUserNotificationById(userId: string, id: string) {
    const notif = await this.notificationRepo.findOneBy({
      notificationId: id,
      userId,
    });
    if (!notif) throw new NotFoundException('Notification not found');
    return notif;
  }

  async registerFcmToken(userId: string, token: string, deviceType?: string) {
    // Store FCM token in user's device record
    const device = await this.userDeviceRepo.findOne({
      where: { userId, deviceType: deviceType ?? 'MOBILE' },
    });
    if (device) {
      device.pushToken = token;
      return this.userDeviceRepo.save(device);
    }
    const newDevice = this.userDeviceRepo.create({
      userId,
      deviceType: deviceType ?? 'MOBILE',
      pushToken: token,
    });
    return this.userDeviceRepo.save(newDevice);
  }

  // ========== HELPERS ==========

  private async getAudienceCount(audience: string): Promise<number> {
    switch (audience) {
      case 'all_passengers':
        return this.userRepo.countBy({ role: 'PASSENGER' });
      case 'active':
        return this.userRepo.countBy({ role: 'PASSENGER', status: 'active' });
      default:
        return this.userRepo.countBy({ role: 'PASSENGER' });
    }
  }

  private async getAudienceUsers(
    audience: string,
  ): Promise<Array<{ id: string }>> {
    switch (audience) {
      case 'all_passengers':
        return this.userRepo.find({
          select: ['id'],
          where: { role: 'PASSENGER' },
        });
      case 'active':
        return this.userRepo.find({
          select: ['id'],
          where: { role: 'PASSENGER', status: 'active' },
        });
      default:
        return this.userRepo.find({
          select: ['id'],
          where: { role: 'PASSENGER' },
        });
    }
  }
}
