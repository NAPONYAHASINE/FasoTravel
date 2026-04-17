import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Promotion } from '../database/entities';
import {
  CreatePromotionDto,
  UpdatePromotionDto,
  ValidatePromotionDto,
} from './dto';
import { randomUUID } from 'crypto';

@Injectable()
export class PromotionsService {
  constructor(
    @InjectRepository(Promotion)
    private readonly promoRepo: Repository<Promotion>,
    private readonly dataSource: DataSource,
  ) {}

  // ─── Public / Mobile ──────────────────────────────────────

  /**
   * POST /promotions/validate — Validate a promo code at booking time.
   */
  async validateCode(dto: ValidatePromotionDto) {
    const promo = await this.promoRepo
      .createQueryBuilder('p')
      .where('p.promotion_id = :code OR p.promotion_name = :code', {
        code: dto.code,
      })
      .getOne();

    if (!promo) {
      return { valid: false, message: 'Code promotion invalide' };
    }

    const now = new Date();
    if (!promo.isActive) {
      return { valid: false, message: "Cette promotion n'est plus active" };
    }
    if (now < promo.startDate) {
      return {
        valid: false,
        message: "Cette promotion n'est pas encore active",
      };
    }
    if (now > promo.endDate) {
      return { valid: false, message: 'Cette promotion a expire' };
    }
    if (promo.maxUses && promo.usesCount >= promo.maxUses) {
      return {
        valid: false,
        message: "Cette promotion a atteint son nombre maximum d'utilisations",
      };
    }
    if (dto.tripId && promo.tripId && promo.tripId !== dto.tripId) {
      return {
        valid: false,
        message: "Cette promotion ne s'applique pas a ce trajet",
      };
    }

    return {
      valid: true,
      promotion: promo,
    };
  }

  /**
   * POST /promotions/use — Atomically increment usesCount when a promotion is consumed.
   * Uses optimistic concurrency via UPDATE ... SET usesCount = usesCount + 1 WHERE usesCount < maxUses.
   */
  async usePromotion(promotionId: string): Promise<{ used: boolean }> {
    const result = await this.dataSource
      .createQueryBuilder()
      .update(Promotion)
      .set({ usesCount: () => '"uses_count" + 1' })
      .where('promotion_id = :id', { id: promotionId })
      .andWhere('is_active = true')
      .andWhere('(max_uses IS NULL OR uses_count < max_uses)')
      .execute();

    if (result.affected === 0) {
      throw new ConflictException(
        "Promotion invalide ou nombre maximum d'utilisations atteint",
      );
    }

    return { used: true };
  }

  // ─── Admin ────────────────────────────────────────────────

  /**
   * GET /admin/promotions — List all promotions.
   */
  async findAll() {
    return this.promoRepo.find({ order: { createdAt: 'DESC' } });
  }

  /**
   * GET /admin/promotions/stats
   */
  async getStats() {
    const all = await this.promoRepo.find();
    const now = new Date();
    const active = all.filter(
      (p) => p.isActive && now >= p.startDate && now <= p.endDate,
    );
    const expired = all.filter((p) => now > p.endDate);
    const totalUses = all.reduce((sum, p) => sum + p.usesCount, 0);

    return {
      total: all.length,
      active: active.length,
      expired: expired.length,
      totalUses,
    };
  }

  /**
   * GET /admin/promotions/:id
   */
  async findOne(id: string) {
    const promo = await this.promoRepo.findOne({ where: { promotionId: id } });
    if (!promo) {
      throw new NotFoundException(`Promotion ${id} introuvable`);
    }
    return promo;
  }

  /**
   * POST /admin/promotions — Create a promotion.
   */
  async create(dto: CreatePromotionDto) {
    const promo = new Promotion();
    promo.promotionId = dto.code || randomUUID();
    promo.operatorId = dto.operatorId;
    if (dto.tripId) promo.tripId = dto.tripId;
    promo.promotionName = dto.title;
    if (dto.description) promo.description = dto.description;
    promo.discountType = dto.discountType.toUpperCase();
    promo.discountValue = dto.discountValue;
    promo.startDate = new Date(dto.startDate);
    promo.endDate = new Date(dto.endDate);
    if (dto.usageLimit) promo.maxUses = dto.usageLimit;
    promo.usesCount = 0;
    promo.isActive = true;
    return this.promoRepo.save(promo);
  }

  /**
   * PATCH /admin/promotions/:id — Update a promotion.
   */
  async update(id: string, dto: UpdatePromotionDto) {
    const promo = await this.findOne(id);
    if (dto.title !== undefined) promo.promotionName = dto.title;
    if (dto.description !== undefined) promo.description = dto.description;
    if (dto.discountType !== undefined)
      promo.discountType = dto.discountType.toUpperCase();
    if (dto.discountValue !== undefined)
      promo.discountValue = dto.discountValue;
    if (dto.usageLimit !== undefined) promo.maxUses = dto.usageLimit;
    if (dto.startDate !== undefined) promo.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) promo.endDate = new Date(dto.endDate);
    if (dto.isActive !== undefined) promo.isActive = dto.isActive;
    return this.promoRepo.save(promo);
  }

  /**
   * PATCH /admin/promotions/:id/approve
   */
  async approve(id: string) {
    const promo = await this.findOne(id);
    promo.isActive = true;
    return this.promoRepo.save(promo);
  }

  /**
   * PATCH /admin/promotions/:id/reject
   */
  async reject(id: string) {
    const promo = await this.findOne(id);
    promo.isActive = false;
    return this.promoRepo.save(promo);
  }

  /**
   * PATCH /admin/promotions/:id/activate
   */
  async activate(id: string) {
    return this.approve(id);
  }

  /**
   * PATCH /admin/promotions/:id/deactivate
   */
  async deactivate(id: string) {
    return this.reject(id);
  }

  /**
   * DELETE /admin/promotions/:id
   */
  async remove(id: string) {
    const promo = await this.findOne(id);
    await this.promoRepo.remove(promo);
  }
}
