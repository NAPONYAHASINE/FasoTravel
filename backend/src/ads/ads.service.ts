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

    ad.impressionsCount += 1;
    await this.adRepo.save(ad);

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

    ad.clicksCount += 1;
    await this.adRepo.save(ad);

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
      mediaType: dto.type ?? 'banner',
      mediaUrl: dto.imageUrl,
      actionUrl: dto.linkUrl,
      actionType: 'link',
      createdBy: dto.advertiser ?? '00000000-0000-0000-0000-000000000000',
      targetPages: dto.targetPages,
      startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
      endDate: dto.endDate
        ? new Date(dto.endDate)
        : new Date(
            Date.now() + AD_DEFAULT_EXPIRATION_DAYS * 24 * 60 * 60 * 1000,
          ),
      priority: dto.priority ?? 0,
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
    Object.assign(ad, dto);
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
