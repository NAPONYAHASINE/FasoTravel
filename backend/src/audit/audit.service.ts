import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { AuditLog } from '../database/entities';
import { AuditLogQueryDto, ExportLogsQueryDto } from './dto';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  /* ────────── Create a log entry (called by interceptor or services) ───── */
  async createLog(data: Partial<AuditLog>) {
    const log = this.auditRepo.create(data);
    return this.auditRepo.save(log);
  }

  /* ────────── GET /logs ────────── */
  async findAll(query: AuditLogQueryDto) {
    const qb = this.auditRepo
      .createQueryBuilder('log')
      .orderBy('log.created_at', query.order ?? 'DESC')
      .skip(query.skip)
      .take(query.limit);

    if (query.search) {
      qb.andWhere(
        '(log.action ILIKE :s OR log.description ILIKE :s OR log.user_name ILIKE :s)',
        { s: `%${query.search}%` },
      );
    }
    if (query.source && query.source !== 'all') {
      qb.andWhere('log.actor_type = :source', { source: query.source });
    }
    if (query.severity && query.severity !== 'all') {
      qb.andWhere('log.severity = :severity', { severity: query.severity });
    }
    if (query.category && query.category !== 'all') {
      qb.andWhere('log.category = :category', { category: query.category });
    }
    if (query.entityType) {
      qb.andWhere('log.entity_type = :entityType', {
        entityType: query.entityType,
      });
    }
    if (query.userId) {
      qb.andWhere('log.user_id = :userId', { userId: query.userId });
    }

    const since = this.dateRangeToDate(query.dateRange);
    if (since) {
      qb.andWhere('log.created_at >= :since', { since });
    }

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  /* ────────── GET /logs/:id ────────── */
  async findOne(id: string) {
    const log = await this.auditRepo.findOne({ where: { id } });
    if (!log) {
      throw new NotFoundException(`Audit log ${id} not found`);
    }
    return log;
  }

  /* ────────── GET /logs/stats ────────── */
  async getStats(dateRange?: string) {
    const since = this.dateRangeToDate(dateRange);

    const baseQb = this.auditRepo.createQueryBuilder('log');
    if (since) {
      baseQb.where('log.created_at >= :since', { since });
    }

    const total = await baseQb.clone().getCount();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date();
    monthStart.setMonth(monthStart.getMonth() - 1);

    const [today, thisWeek, thisMonth] = await Promise.all([
      this.auditRepo.count({
        where: { createdAt: MoreThanOrEqual(todayStart) },
      }),
      this.auditRepo.count({
        where: { createdAt: MoreThanOrEqual(weekStart) },
      }),
      this.auditRepo.count({
        where: { createdAt: MoreThanOrEqual(monthStart) },
      }),
    ]);

    const severityCounts = await this.auditRepo
      .createQueryBuilder('log')
      .select('log.severity', 'severity')
      .addSelect('COUNT(*)', 'count')
      .groupBy('log.severity')
      .getRawMany<{ severity: string; count: string }>();

    const severityMap: Record<string, number> = {};
    for (const row of severityCounts) {
      severityMap[row.severity] = Number(row.count);
    }

    const categoryCounts = await this.auditRepo
      .createQueryBuilder('log')
      .select('log.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .groupBy('log.category')
      .getRawMany<{ category: string; count: string }>();

    const byCategory: Record<string, number> = {};
    for (const row of categoryCounts) {
      byCategory[row.category] = Number(row.count);
    }

    const entityTypeCounts = await this.auditRepo
      .createQueryBuilder('log')
      .select('log.entity_type', 'entityType')
      .addSelect('COUNT(*)', 'count')
      .groupBy('log.entity_type')
      .getRawMany<{ entityType: string; count: string }>();

    const byEntityType: Record<string, number> = {};
    for (const row of entityTypeCounts) {
      byEntityType[row.entityType] = Number(row.count);
    }

    const topActions = await this.auditRepo
      .createQueryBuilder('log')
      .select('log.action', 'action')
      .addSelect('COUNT(*)', 'count')
      .groupBy('log.action')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany<{ action: string; count: string }>();

    const uniqueUsers = await this.auditRepo
      .createQueryBuilder('log')
      .select('COUNT(DISTINCT log.user_id)', 'cnt')
      .getRawOne<{ cnt: string }>();

    return {
      total,
      thisMonth,
      thisWeek,
      today,
      critical: severityMap['critical'] ?? 0,
      warning: severityMap['warning'] ?? 0,
      info: severityMap['info'] ?? 0,
      uniqueUsers: Number(uniqueUsers?.cnt ?? 0),
      byCategory,
      byEntityType,
      topActions: topActions.map((a) => ({
        action: a.action,
        count: Number(a.count),
      })),
    };
  }

  /* ────────── GET /logs/export ────────── */
  async exportLogs(query: ExportLogsQueryDto) {
    const qb = this.auditRepo
      .createQueryBuilder('log')
      .orderBy('log.created_at', 'DESC');

    const since = this.dateRangeToDate(query.dateRange);
    if (since) {
      qb.andWhere('log.created_at >= :since', { since });
    }

    const data = await qb.getMany();

    return {
      data,
      format: query.format ?? 'json',
    };
  }

  /* ────────── helpers ────────── */

  private dateRangeToDate(range?: string): Date | null {
    if (!range || range === 'all') return null;
    const now = new Date();
    switch (range) {
      case '24h':
        now.setHours(now.getHours() - 24);
        return now;
      case '7d':
        now.setDate(now.getDate() - 7);
        return now;
      case '30d':
        now.setDate(now.getDate() - 30);
        return now;
      case '90d':
        now.setDate(now.getDate() - 90);
        return now;
      default:
        return null;
    }
  }
}
