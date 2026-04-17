import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AD_DEFAULT_EXPIRATION_DAYS } from '../common/constants';
import {
  Advertisement,
  AdImpression,
  AdClick,
  AdConversion,
} from '../database/entities';
import {
  TrackImpressionDto,
  TrackClickDto,
  TrackConversionDto,
  CreateAdDto,
  UpdateAdDto,
} from './dto';

@Injectable()
export class AdsService {
  constructor(
    @InjectRepository(Advertisement)
    private readonly adRepo: Repository<Advertisement>,
    @InjectRepository(AdImpression)
    private readonly impressionRepo: Repository<AdImpression>,
    @InjectRepository(AdClick)
    private readonly clickRepo: Repository<AdClick>,
    @InjectRepository(AdConversion)
    private readonly conversionRepo: Repository<AdConversion>,
  ) {}

  /**
   * GET /ads/active — Active ads, optionally filtered by page and user type.
   */
  async findActive(page?: string, userId?: string, isNewUser?: boolean) {
    const now = new Date();
    const qb = this.adRepo
      .createQueryBuilder('ad')
      .where('ad.is_active = true')
      .andWhere('ad.start_date <= :now', { now })
      .andWhere('ad.end_date >= :now', { now });

    if (page) {
      qb.andWhere(':page = ANY(ad.target_pages)', { page });
    }

    if (isNewUser !== undefined) {
      if (isNewUser) {
        // New users see both targeted + general ads
      } else {
        qb.andWhere('ad.target_new_users = false');
      }
    }

    qb.orderBy('ad.priority', 'DESC').addOrderBy('ad.created_at', 'DESC');

    return qb.getMany();
  }

  /**
   * GET /ads/:id
   */
  async findOne(id: string) {
    const ad = await this.adRepo.findOne({ where: { id } });
    if (!ad) {
      throw new NotFoundException(`Ad ${id} introuvable`);
    }
    return ad;
  }

  /**
   * POST /ads/:id/impression — Record an impression.
   */
  async trackImpression(
    adId: string,
    userId: string | undefined,
    dto: TrackImpressionDto,
  ) {
    const ad = await this.adRepo.findOne({ where: { id: adId } });
    if (!ad) {
      throw new NotFoundException(`Ad ${adId} introuvable`);
    }

    await this.adRepo.increment({ id: adId }, 'impressionsCount', 1);

    const impression = new AdImpression();
    impression.adId = adId;
    if (userId) impression.userId = userId;
    if (dto.page) impression.page = dto.page;
    if (dto.deviceType) impression.deviceType = dto.deviceType;
    return this.impressionRepo.save(impression);
  }

  /**
   * POST /ads/:id/click — Record a click.
   */
  async trackClick(
    adId: string,
    userId: string | undefined,
    dto: TrackClickDto,
  ) {
    const ad = await this.adRepo.findOne({ where: { id: adId } });
    if (!ad) {
      throw new NotFoundException(`Ad ${adId} introuvable`);
    }

    await this.adRepo.increment({ id: adId }, 'clicksCount', 1);

    const click = new AdClick();
    click.adId = adId;
    if (userId) click.userId = userId;
    if (dto.page) click.page = dto.page;
    if (dto.actionType) click.actionType = dto.actionType;
    if (dto.deviceType) click.deviceType = dto.deviceType;
    return this.clickRepo.save(click);
  }

  /**
   * POST /ads/:id/conversion — Record a conversion.
   */
  async trackConversion(adId: string, userId: string, dto: TrackConversionDto) {
    const ad = await this.adRepo.findOne({ where: { id: adId } });
    if (!ad) {
      throw new NotFoundException(`Ad ${adId} introuvable`);
    }

    const conversion = new AdConversion();
    conversion.adId = adId;
    conversion.userId = userId;
    if (dto.conversionType) conversion.conversionType = dto.conversionType;
    if (dto.revenueFcfa) conversion.revenueFcfa = dto.revenueFcfa;
    if (dto.bookingId) conversion.bookingId = dto.bookingId;
    return this.conversionRepo.save(conversion);
  }

  // ─── Admin methods ─────────────────────────────────────────

  /**
   * GET /admin/ads — List all ads.
   */
  async findAll() {
    return this.adRepo.find({ order: { createdAt: 'DESC' } });
  }

  /**
   * GET /admin/ads/:id/stats
   */
  async getStats(adId: string) {
    const ad = await this.findOne(adId);
    const [impressions, clicks, conversions] = await Promise.all([
      this.impressionRepo.count({ where: { adId } }),
      this.clickRepo.count({ where: { adId } }),
      this.conversionRepo.count({ where: { adId } }),
    ]);
    return {
      ad,
      stats: {
        impressions,
        clicks,
        conversions,
        ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      },
    };
  }

  /**
   * POST /admin/advertisements — Create ad.
   */
  async createAd(dto: CreateAdDto) {
    const ad = this.adRepo.create({
      title: dto.title,
      description: dto.description ?? '',
      mediaType: dto.mediaType ?? 'image',
      mediaUrl: dto.mediaUrl,
      gradient: dto.gradient,
      emoji: dto.emoji,
      ctaText: dto.ctaText,
      actionType: dto.actionType ?? 'none',
      actionUrl: dto.actionUrl,
      internalPage: dto.internalPage,
      internalData: dto.internalData,
      targetPages: dto.targetPages,
      startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
      endDate: dto.endDate
        ? new Date(dto.endDate)
        : new Date(
            Date.now() + AD_DEFAULT_EXPIRATION_DAYS * 24 * 60 * 60 * 1000,
          ),
      priority: dto.priority ?? 5,
      targetNewUsers: dto.targetNewUsers ?? false,
      isActive: true,
    });
    return this.adRepo.save(ad);
  }

  /**
   * PUT /admin/advertisements/:id — Update ad.
   */
  async updateAd(id: string, dto: UpdateAdDto) {
    const ad = await this.findOne(id);
    if (dto.title !== undefined) ad.title = dto.title;
    if (dto.description !== undefined) ad.description = dto.description;
    if (dto.mediaType !== undefined) ad.mediaType = dto.mediaType;
    if (dto.mediaUrl !== undefined) ad.mediaUrl = dto.mediaUrl;
    if (dto.gradient !== undefined) ad.gradient = dto.gradient;
    if (dto.emoji !== undefined) ad.emoji = dto.emoji;
    if (dto.ctaText !== undefined) ad.ctaText = dto.ctaText;
    if (dto.actionType !== undefined) ad.actionType = dto.actionType;
    if (dto.actionUrl !== undefined) ad.actionUrl = dto.actionUrl;
    if (dto.internalPage !== undefined) ad.internalPage = dto.internalPage;
    if (dto.internalData !== undefined) ad.internalData = dto.internalData;
    if (dto.targetPages !== undefined) ad.targetPages = dto.targetPages;
    if (dto.targetNewUsers !== undefined)
      ad.targetNewUsers = dto.targetNewUsers;
    if (dto.priority !== undefined) ad.priority = dto.priority;
    if (dto.isActive !== undefined) ad.isActive = dto.isActive;
    if (dto.startDate) ad.startDate = new Date(dto.startDate);
    if (dto.endDate) ad.endDate = new Date(dto.endDate);
    return this.adRepo.save(ad);
  }

  /**
   * DELETE /admin/advertisements/:id — Delete ad.
   */
  async deleteAd(id: string) {
    const ad = await this.findOne(id);
    await this.adRepo.remove(ad);
  }
}
