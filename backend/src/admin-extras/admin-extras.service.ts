import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoryCircle, FeatureFlag } from '../database/entities';
import { PaginatedResponse } from '../common/dto/paginated-response.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class AdminExtrasService {
  constructor(
    @InjectRepository(StoryCircle)
    private readonly storyCircleRepo: Repository<StoryCircle>,
    @InjectRepository(FeatureFlag)
    private readonly featureFlagRepo: Repository<FeatureFlag>,
  ) {}

  // ─── Story Circles ────────────────────────────────────────────

  async findAllStoryCircles(pagination: PaginationDto) {
    const [data, total] = await this.storyCircleRepo.findAndCount({
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
      skip: pagination.skip,
      take: pagination.limit,
    });
    return new PaginatedResponse(
      data,
      total,
      pagination.page,
      pagination.limit,
    );
  }

  async findOneStoryCircle(id: string) {
    const sc = await this.storyCircleRepo.findOne({ where: { id } });
    if (!sc) throw new NotFoundException(`StoryCircle ${id} not found`);
    return sc;
  }

  async createStoryCircle(dto: Partial<StoryCircle>) {
    const sc = this.storyCircleRepo.create(dto);
    return this.storyCircleRepo.save(sc);
  }

  async updateStoryCircle(id: string, dto: Partial<StoryCircle>) {
    const sc = await this.findOneStoryCircle(id);
    Object.assign(sc, dto);
    return this.storyCircleRepo.save(sc);
  }

  async deleteStoryCircle(id: string) {
    const sc = await this.findOneStoryCircle(id);
    return this.storyCircleRepo.remove(sc);
  }

  // ─── Feature Flags ────────────────────────────────────────────

  async findAllFeatureFlags(pagination: PaginationDto) {
    const [data, total] = await this.featureFlagRepo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: pagination.skip,
      take: pagination.limit,
    });
    return new PaginatedResponse(
      data,
      total,
      pagination.page,
      pagination.limit,
    );
  }

  async findOneFeatureFlag(id: string) {
    const ff = await this.featureFlagRepo.findOne({ where: { id } });
    if (!ff) throw new NotFoundException(`FeatureFlag ${id} not found`);
    return ff;
  }

  async createFeatureFlag(dto: Partial<FeatureFlag>) {
    const ff = this.featureFlagRepo.create(dto);
    return this.featureFlagRepo.save(ff);
  }

  async updateFeatureFlag(id: string, dto: Partial<FeatureFlag>) {
    const ff = await this.findOneFeatureFlag(id);
    Object.assign(ff, dto);
    return this.featureFlagRepo.save(ff);
  }

  async toggleFeatureFlag(id: string) {
    const ff = await this.findOneFeatureFlag(id);
    ff.isEnabled = !ff.isEnabled;
    return this.featureFlagRepo.save(ff);
  }

  async deleteFeatureFlag(id: string) {
    const ff = await this.findOneFeatureFlag(id);
    return this.featureFlagRepo.remove(ff);
  }
}
