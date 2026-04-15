import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CashierPresence } from '../database/entities';
import { HEARTBEAT_TIMEOUT_SECONDS } from '../common/constants';

@Injectable()
export class HeartbeatService {
  private readonly logger = new Logger(HeartbeatService.name);

  constructor(
    @InjectRepository(CashierPresence)
    private readonly presenceRepo: Repository<CashierPresence>,
  ) {}

  async ping(
    userId: string,
    stationId: string,
    operatorId: string,
  ): Promise<CashierPresence> {
    let presence = await this.presenceRepo.findOne({
      where: { userId, stationId },
    });

    if (presence) {
      presence.lastPingAt = new Date();
      presence.isOnline = true;
      presence.operatorId = operatorId;
    } else {
      presence = this.presenceRepo.create({
        userId,
        stationId,
        operatorId,
        lastPingAt: new Date(),
        isOnline: true,
      });
    }

    return this.presenceRepo.save(presence);
  }

  async disconnect(userId: string, stationId: string): Promise<void> {
    await this.presenceRepo.update({ userId, stationId }, { isOnline: false });
  }

  async isStationOnline(stationId: string): Promise<boolean> {
    const threshold = new Date(Date.now() - HEARTBEAT_TIMEOUT_SECONDS * 1000);
    const count = await this.presenceRepo.count({
      where: { stationId, isOnline: true, lastPingAt: MoreThan(threshold) },
    });
    return count > 0;
  }

  async getStationCashiers(stationId: string): Promise<CashierPresence[]> {
    const threshold = new Date(Date.now() - HEARTBEAT_TIMEOUT_SECONDS * 1000);
    return this.presenceRepo.find({
      where: { stationId, isOnline: true, lastPingAt: MoreThan(threshold) },
    });
  }

  async getOnlineStations(operatorId: string): Promise<string[]> {
    const threshold = new Date(Date.now() - HEARTBEAT_TIMEOUT_SECONDS * 1000);
    const rows = await this.presenceRepo
      .createQueryBuilder('p')
      .select('DISTINCT p.station_id', 'stationId')
      .where('p.operator_id = :operatorId', { operatorId })
      .andWhere('p.is_online = true')
      .andWhere('p.last_ping_at > :threshold', { threshold })
      .getRawMany<{ stationId: string }>();
    return rows.map((r) => r.stationId);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async markStaleOffline(): Promise<void> {
    const threshold = new Date(Date.now() - HEARTBEAT_TIMEOUT_SECONDS * 1000);
    const result = await this.presenceRepo
      .createQueryBuilder()
      .update(CashierPresence)
      .set({ isOnline: false })
      .where('is_online = true')
      .andWhere('last_ping_at < :threshold', { threshold })
      .execute();

    if (result.affected && result.affected > 0) {
      this.logger.log(`Marked ${result.affected} stale cashier(s) as offline`);
    }
  }

  /**
   * Bulk heartbeat info for multiple stations (used by StationsService).
   * Returns a map: stationId → { isConnected, activeCashiers, lastHeartbeat }
   */
  async getStationsHeartbeatInfo(
    stationIds: string[],
  ): Promise<
    Map<
      string,
      { isConnected: boolean; activeCashiers: number; lastHeartbeat: Date }
    >
  > {
    if (stationIds.length === 0) return new Map();

    const threshold = new Date(Date.now() - HEARTBEAT_TIMEOUT_SECONDS * 1000);
    const rows = await this.presenceRepo
      .createQueryBuilder('p')
      .select('p.station_id', 'stationId')
      .addSelect('COUNT(*)::int', 'activeCashiers')
      .addSelect('MAX(p.last_ping_at)', 'lastHeartbeat')
      .where('p.station_id IN (:...stationIds)', { stationIds })
      .andWhere('p.is_online = true')
      .andWhere('p.last_ping_at > :threshold', { threshold })
      .groupBy('p.station_id')
      .getRawMany<{
        stationId: string;
        activeCashiers: number;
        lastHeartbeat: Date;
      }>();

    const map = new Map<
      string,
      { isConnected: boolean; activeCashiers: number; lastHeartbeat: Date }
    >();
    for (const row of rows) {
      map.set(row.stationId, {
        isConnected: true,
        activeCashiers: Number(row.activeCashiers),
        lastHeartbeat: row.lastHeartbeat,
      });
    }
    return map;
  }
}
