import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OperatorStory, AdminStory, StoryView } from '../database/entities';
import {
  CreateStoryDto,
  UpdateStoryDto,
  CreateAdminStoryDto,
  UpdateAdminStoryDto,
} from './dto';
import { randomUUID } from 'crypto';
import { STORY_EXPIRATION_DAYS } from '../common/constants';

@Injectable()
export class StoriesService {
  constructor(
    @InjectRepository(OperatorStory)
    private readonly operatorStoryRepo: Repository<OperatorStory>,
    @InjectRepository(AdminStory)
    private readonly adminStoryRepo: Repository<AdminStory>,
    @InjectRepository(StoryView)
    private readonly storyViewRepo: Repository<StoryView>,
  ) {}

  /**
   * GET /stories — List all stories (operator + admin).
   */
  async findAll() {
    const [operatorStories, adminStories] = await Promise.all([
      this.operatorStoryRepo.find({ order: { createdAt: 'DESC' } }),
      this.adminStoryRepo.find({
        where: { isActive: true },
        order: { priority: 'DESC', createdAt: 'DESC' },
      }),
    ]);
    return { operatorStories, adminStories };
  }

  /**
   * GET /stories/active — Active, non-expired stories.
   */
  async findActive() {
    const now = new Date();
    const operatorStories = await this.operatorStoryRepo
      .createQueryBuilder('s')
      .where('s.expires_at > :now', { now })
      .orderBy('s.created_at', 'DESC')
      .getMany();

    const adminStories = await this.adminStoryRepo
      .createQueryBuilder('s')
      .where('s.is_active = true')
      .andWhere('(s.expires_at IS NULL OR s.expires_at > :now)', { now })
      .orderBy('s.priority', 'DESC')
      .addOrderBy('s.created_at', 'DESC')
      .getMany();

    return { operatorStories, adminStories };
  }

  /**
   * GET /stories/:id
   */
  async findOne(id: string) {
    const story =
      (await this.operatorStoryRepo.findOne({ where: { id } })) ||
      (await this.adminStoryRepo.findOne({ where: { id } }));
    if (!story) {
      throw new NotFoundException(`Story ${id} introuvable`);
    }
    return story;
  }

  /**
   * POST /stories — Create an operator story (societe).
   */
  async create(operatorId: string, dto: CreateStoryDto) {
    const story = this.operatorStoryRepo.create({
      id: randomUUID(),
      operatorId,
      type: dto.type,
      mediaType: dto.mediaType,
      mediaUrl: dto.mediaUrl,
      gradient: dto.gradient,
      title: dto.title,
      subtitle: dto.subtitle,
      description: dto.description,
      emoji: dto.emoji,
      ctaText: dto.ctaText,
      ctaLink: dto.ctaLink,
      durationSeconds: dto.durationSeconds ?? 5,
      categoryId: dto.categoryId,
      expiresAt: new Date(
        Date.now() + STORY_EXPIRATION_DAYS * 24 * 60 * 60 * 1000,
      ),
    });
    return this.operatorStoryRepo.save(story);
  }

  /**
   * PUT /stories/:id — Update an operator story.
   */
  async update(id: string, operatorId: string, dto: UpdateStoryDto) {
    const story = await this.operatorStoryRepo.findOne({ where: { id } });
    if (!story) {
      throw new NotFoundException(`Story ${id} introuvable`);
    }
    if (story.operatorId !== operatorId) {
      throw new ForbiddenException(
        'Vous ne pouvez modifier que vos propres stories',
      );
    }
    Object.assign(story, dto);
    return this.operatorStoryRepo.save(story);
  }

  /**
   * DELETE /stories/:id
   */
  async remove(id: string, operatorId: string) {
    const story = await this.operatorStoryRepo.findOne({ where: { id } });
    if (!story) {
      throw new NotFoundException(`Story ${id} introuvable`);
    }
    if (story.operatorId !== operatorId) {
      throw new ForbiddenException(
        'Vous ne pouvez supprimer que vos propres stories',
      );
    }
    await this.operatorStoryRepo.remove(story);
  }

  /**
   * POST /stories/mark-viewed — Record that a user viewed a story.
   */
  async markViewed(userId: string, storyId: string) {
    const existing = await this.storyViewRepo.findOne({
      where: { userId, storyId },
    });
    if (existing) {
      existing.viewedAt = new Date();
      return this.storyViewRepo.save(existing);
    }
    const view = this.storyViewRepo.create({
      userId,
      storyId,
      viewedAt: new Date(),
    });
    return this.storyViewRepo.save(view);
  }

  /**
   * GET /stories/viewed — Get all story IDs viewed by the user.
   */
  async getViewedStories(userId: string) {
    const views = await this.storyViewRepo.find({ where: { userId } });
    return views.map((v) => v.storyId);
  }

  // ─── Admin: List all stories ──────────────────────────────────
  async findAllAdmin() {
    const [operatorStories, adminStories] = await Promise.all([
      this.operatorStoryRepo.find({ order: { createdAt: 'DESC' } }),
      this.adminStoryRepo.find({ order: { createdAt: 'DESC' } }),
    ]);
    return { operatorStories, adminStories };
  }

  // ─── Admin: Create admin story ────────────────────────────────
  async createAdminStory(dto: CreateAdminStoryDto) {
    const story = this.adminStoryRepo.create({
      id: randomUUID(),
      title: dto.title,
      description: dto.description ?? '',
      mediaType: dto.mediaType ?? 'gradient',
      mediaUrl: dto.mediaUrl,
      gradient: dto.gradient,
      emoji: dto.emoji,
      circleId: dto.circleId,
      ctaText: dto.ctaText,
      actionType: dto.actionType ?? 'none',
      actionUrl: dto.actionUrl,
      internalPage: dto.internalPage,
      status: 'draft',
      priority: 0,
      isActive: true,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
    });
    return this.adminStoryRepo.save(story);
  }

  // ─── Admin: Update admin story ────────────────────────────────
  async updateAdminStory(id: string, dto: UpdateAdminStoryDto) {
    const story = await this.adminStoryRepo.findOne({ where: { id } });
    if (!story) throw new NotFoundException(`Admin story ${id} introuvable`);
    if (dto.title !== undefined) story.title = dto.title;
    if (dto.description !== undefined) story.description = dto.description;
    if (dto.mediaType !== undefined) story.mediaType = dto.mediaType;
    if (dto.mediaUrl !== undefined) story.mediaUrl = dto.mediaUrl;
    if (dto.gradient !== undefined) story.gradient = dto.gradient;
    if (dto.emoji !== undefined) story.emoji = dto.emoji;
    if (dto.circleId !== undefined) story.circleId = dto.circleId;
    if (dto.ctaText !== undefined) story.ctaText = dto.ctaText;
    if (dto.actionType !== undefined) story.actionType = dto.actionType;
    if (dto.actionUrl !== undefined) story.actionUrl = dto.actionUrl;
    if (dto.internalPage !== undefined) story.internalPage = dto.internalPage;
    if (dto.expiresAt !== undefined) story.expiresAt = new Date(dto.expiresAt);
    return this.adminStoryRepo.save(story);
  }

  // ─── Admin: Publish story ────────────────────────────────────
  async publishStory(id: string) {
    const story = await this.adminStoryRepo.findOne({ where: { id } });
    if (!story) throw new NotFoundException(`Admin story ${id} introuvable`);
    story.isActive = true;
    story.status = 'published';
    story.publishedAt = new Date();
    return this.adminStoryRepo.save(story);
  }

  // ─── Admin: Archive story ────────────────────────────────────
  async archiveStory(id: string) {
    const story = await this.adminStoryRepo.findOne({ where: { id } });
    if (!story) throw new NotFoundException(`Admin story ${id} introuvable`);
    story.isActive = false;
    story.status = 'archived';
    return this.adminStoryRepo.save(story);
  }

  // ─── Admin: Delete admin story ────────────────────────────────
  async removeAdminStory(id: string) {
    const story = await this.adminStoryRepo.findOne({ where: { id } });
    if (!story) throw new NotFoundException(`Admin story ${id} introuvable`);
    await this.adminStoryRepo.remove(story);
  }

  getUploadUrl(fileName: string, contentType: string, operatorId?: string) {
    // Generate a unique key for the upload
    const key = `stories/${operatorId ?? 'general'}/${randomUUID()}-${fileName}`;
    // In production this would return a pre-signed S3 URL
    return {
      uploadUrl: `/uploads/${key}`,
      key,
      contentType,
    };
  }
}
