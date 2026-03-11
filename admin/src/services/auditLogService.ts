/**
 * Service Audit Logs FasoTravel Admin
 * Backend-ready: Mock service qui peut être facilement remplacé par de vrais appels API
 * 
 * RESPONSABILITÉS:
 * - Fournir l'interface entre le frontend et le backend pour les logs d'audit
 * - En mode MOCK: utilise les données de /lib/adminMockData.ts
 * - En mode PRODUCTION: effectue de vrais appels API
 * - ZÉRO génération de données dans ce service
 * 
 * ENDPOINTS PRODUCTION:
 * - GET /api/admin/audit-logs              → getAllLogs(params)
 * - GET /api/admin/audit-logs/:id          → getLogById(id)
 * - GET /api/admin/audit-logs/stats        → getStats(params)
 * - GET /api/admin/audit-logs/export       → exportLogs(params)
 */

import { AppConfig } from '../config/app.config';
import { apiService, type ApiResponse } from './apiService';
import { ENDPOINTS } from './endpoints';
import { MOCK_AUDIT_LOGS } from '../lib/adminMockData';
import type { AuditLog } from '../shared/types/standardized';

// ============================================================================
// TYPES
// ============================================================================

export type ActorType = 'admin' | 'operator' | 'passenger' | 'system';

export interface EnrichedLog extends AuditLog {
  actorType: ActorType;
}

export interface AuditLogFilters {
  search?: string;
  source?: ActorType | 'all';
  severity?: 'all' | 'info' | 'warning' | 'critical';
  category?: 'all' | 'security' | 'operations' | 'finance' | 'content' | 'config';
  entityType?: string;
  userId?: string;
  dateRange?: 'all' | '24h' | '7d' | '30d' | '90d';
}

export interface AuditLogPaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AuditStats {
  total: number;
  thisMonth: number;
  thisWeek: number;
  today: number;
  critical: number;
  warning: number;
  info: number;
  uniqueUsers: number;
  byCategory: Record<string, number>;
  byEntityType: Record<string, number>;
  byUser: { name: string; count: number; lastActive: string; actorType: ActorType }[];
  byMonth: { month: string; count: number }[];
  bySource: Record<ActorType, number>;
  avgDurationMs: number;
  topActions: { action: string; count: number }[];
}

// ============================================================================
// HELPERS (ré-utilisées en mock ET production)
// ============================================================================

export function getActorType(userId: string): ActorType {
  if (userId === 'system') return 'system';
  if (userId.startsWith('admin_')) return 'admin';
  if (userId.startsWith('operator_')) return 'operator';
  if (userId.startsWith('passenger_')) return 'passenger';
  return 'admin'; // fallback
}

function enrichLogs(logs: AuditLog[]): EnrichedLog[] {
  return logs.map(l => ({ ...l, actorType: getActorType(l.userId) }));
}

// ============================================================================
// CACHE EN MÉMOIRE
// ============================================================================

let cachedLogs: EnrichedLog[] | null = null;
let cachedStats: AuditStats | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60000; // 1 minute

// ============================================================================
// MOCK: FILTRAGE CÔTÉ CLIENT
// ============================================================================

function applyMockFilters(logs: EnrichedLog[], filters: AuditLogFilters): EnrichedLog[] {
  let result = [...logs];

  // Search
  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(l =>
      (l.details || '').toLowerCase().includes(q) ||
      (l.userName || '').toLowerCase().includes(q) ||
      (l.action || '').toLowerCase().includes(q) ||
      (l.entityType || '').toLowerCase().includes(q) ||
      (l.entityId || '').toLowerCase().includes(q) ||
      (l.ipAddress || '').toLowerCase().includes(q) ||
      (l.geoLocation || '').toLowerCase().includes(q)
    );
  }

  // Source (actorType)
  if (filters.source && filters.source !== 'all') {
    result = result.filter(l => l.actorType === filters.source);
  }

  // Severity
  if (filters.severity && filters.severity !== 'all') {
    result = result.filter(l => l.severity === filters.severity);
  }

  // Category
  if (filters.category && filters.category !== 'all') {
    result = result.filter(l => l.category === filters.category);
  }

  // Entity type
  if (filters.entityType && filters.entityType !== 'all') {
    result = result.filter(l => l.entityType === filters.entityType);
  }

  // User
  if (filters.userId && filters.userId !== 'all') {
    result = result.filter(l => l.userId === filters.userId);
  }

  // Date range
  if (filters.dateRange && filters.dateRange !== 'all') {
    const now = new Date('2026-03-09T12:00:00Z').getTime();
    const ranges: Record<string, number> = {
      '24h': 86400000, '7d': 604800000, '30d': 2592000000, '90d': 7776000000,
    };
    const cutoff = now - (ranges[filters.dateRange] || 0);
    result = result.filter(l => new Date(l.createdAt).getTime() >= cutoff);
  }

  // Sort newest first
  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return result;
}

// ============================================================================
// MOCK: CALCUL DES STATS
// ============================================================================

function computeMockStats(logs: EnrichedLog[]): AuditStats {
  const now = new Date('2026-03-09T12:00:00Z');
  const todayStart = new Date('2026-03-09T00:00:00Z').getTime();
  const weekStart = now.getTime() - 604800000;
  const monthStart = new Date('2026-03-01T00:00:00Z').getTime();

  const byCategory: Record<string, number> = {};
  const byEntityType: Record<string, number> = {};
  const byUserMap: Record<string, { name: string; count: number; lastActive: string; actorType: ActorType }> = {};
  const byMonthMap: Record<string, number> = {};
  const actionCount: Record<string, number> = {};
  const bySource: Record<ActorType, number> = { admin: 0, operator: 0, passenger: 0, system: 0 };
  let critCount = 0, warnCount = 0, infoCount = 0;
  let today = 0, week = 0, month = 0;
  let totalDuration = 0, durationCount = 0;

  logs.forEach(l => {
    const ts = new Date(l.createdAt).getTime();
    if (ts >= todayStart) today++;
    if (ts >= weekStart) week++;
    if (ts >= monthStart) month++;

    if (l.severity === 'critical') critCount++;
    else if (l.severity === 'warning') warnCount++;
    else infoCount++;

    bySource[l.actorType]++;

    if (l.category) byCategory[l.category] = (byCategory[l.category] || 0) + 1;
    if (l.entityType) byEntityType[l.entityType] = (byEntityType[l.entityType] || 0) + 1;
    actionCount[l.action] = (actionCount[l.action] || 0) + 1;

    if (l.userName) {
      if (!byUserMap[l.userId]) {
        byUserMap[l.userId] = { name: l.userName, count: 0, lastActive: l.createdAt, actorType: l.actorType };
      }
      byUserMap[l.userId].count++;
      if (l.createdAt > byUserMap[l.userId].lastActive) byUserMap[l.userId].lastActive = l.createdAt;
    }

    const m = l.createdAt.substring(0, 7);
    byMonthMap[m] = (byMonthMap[m] || 0) + 1;

    if (l.durationMs) { totalDuration += l.durationMs; durationCount++; }
  });

  const userArr = Object.values(byUserMap).sort((a, b) => b.count - a.count);
  const uniqueU = new Set(logs.map(l => l.userId).filter(id => id !== 'system'));
  const topActions = Object.entries(actionCount).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([action, count]) => ({ action, count }));
  const byMonth = Object.entries(byMonthMap).sort((a, b) => a[0].localeCompare(b[0])).map(([month, count]) => ({ month, count }));

  return {
    total: logs.length, thisMonth: month, thisWeek: week, today,
    critical: critCount, warning: warnCount, info: infoCount,
    uniqueUsers: uniqueU.size, byCategory, byEntityType,
    byUser: userArr, byMonth, bySource,
    avgDurationMs: durationCount > 0 ? Math.round(totalDuration / durationCount) : 0,
    topActions,
  };
}

// ============================================================================
// SERVICE API
// ============================================================================

class AuditLogService {
  /**
   * Récupère tous les logs enrichis (avec actorType)
   * Mode MOCK: Enrichit MOCK_AUDIT_LOGS
   * Mode PRODUCTION: Appel GET /api/admin/audit-logs (déjà enrichis côté backend)
   */
  async getAllLogs(): Promise<EnrichedLog[]> {
    const now = Date.now();
    if (cachedLogs && cachedLogs.length > 0 && (now - cacheTimestamp < CACHE_DURATION)) {
      console.log('[AuditLogService] Cache utilisé');
      return cachedLogs;
    }

    if (AppConfig.isMock) {
      console.log('[AuditLogService] Mode MOCK - Chargement depuis /lib/adminMockData.ts');
      const enriched = enrichLogs(MOCK_AUDIT_LOGS);
      console.log(`[AuditLogService] ${enriched.length} logs chargés`);
      cachedLogs = enriched;
      cacheTimestamp = now;
      return enriched;
    }

    // MODE PRODUCTION: Appel API réel
    console.log('[AuditLogService] Mode PRODUCTION - Appel API /admin/audit-logs');
    const response = await apiService.get<EnrichedLog[]>(ENDPOINTS.logs.list());
    if (response.success && response.data) {
      cachedLogs = response.data;
      cacheTimestamp = now;
      return response.data;
    }
    throw new Error(response.error || 'Erreur chargement audit logs');
  }

  /**
   * Récupère les logs filtrés et paginés
   * Mode MOCK: Filtre côté client
   * Mode PRODUCTION: Appel GET /api/admin/audit-logs?filters...&page=X&pageSize=Y
   */
  async getFilteredLogs(
    filters: AuditLogFilters,
    pagination: AuditLogPaginationParams
  ): Promise<PaginatedResponse<EnrichedLog>> {
    if (AppConfig.isMock) {
      const allLogs = await this.getAllLogs();
      const filtered = applyMockFilters(allLogs, filters);
      const total = filtered.length;
      const totalPages = Math.ceil(total / pagination.pageSize);
      const start = (pagination.page - 1) * pagination.pageSize;
      const data = filtered.slice(start, start + pagination.pageSize);

      return { data, total, page: pagination.page, pageSize: pagination.pageSize, totalPages };
    }

    // MODE PRODUCTION: Filtres envoyés au backend
    console.log('[AuditLogService] Mode PRODUCTION - Appel API avec filtres', filters);
    const params: Record<string, any> = {
      page: pagination.page,
      limit: pagination.pageSize,
      ...(filters.search && { search: filters.search }),
      ...(filters.source && filters.source !== 'all' && { source: filters.source }),
      ...(filters.severity && filters.severity !== 'all' && { severity: filters.severity }),
      ...(filters.category && filters.category !== 'all' && { category: filters.category }),
      ...(filters.entityType && filters.entityType !== 'all' && { entityType: filters.entityType }),
      ...(filters.userId && filters.userId !== 'all' && { userId: filters.userId }),
      ...(filters.dateRange && filters.dateRange !== 'all' && { dateRange: filters.dateRange }),
    };

    const response = await apiService.get<PaginatedResponse<EnrichedLog>>(
      ENDPOINTS.logs.list(params)
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Erreur chargement logs filtrés');
  }

  /**
   * Récupère les statistiques d'audit
   * Mode MOCK: Calcule côté client depuis les logs enrichis
   * Mode PRODUCTION: Appel GET /api/admin/audit-logs/stats (agrégation SQL côté backend)
   */
  async getStats(filters?: AuditLogFilters): Promise<AuditStats> {
    if (AppConfig.isMock) {
      const allLogs = await this.getAllLogs();
      // En mock, on calcule les stats sur tous les logs (pas filtrés)
      // Les stats globales reflètent l'ensemble des données
      const stats = computeMockStats(allLogs);
      cachedStats = stats;
      return stats;
    }

    // MODE PRODUCTION: Appel API — les stats sont calculées côté backend (agrégation SQL)
    console.log('[AuditLogService] Mode PRODUCTION - Appel API /admin/audit-logs/stats');
    const params: Record<string, any> = {};
    if (filters?.dateRange && filters.dateRange !== 'all') {
      params.dateRange = filters.dateRange;
    }

    const response = await apiService.get<AuditStats>(
      ENDPOINTS.logs.stats(params)
    );
    if (response.success && response.data) {
      cachedStats = response.data;
      return response.data;
    }
    throw new Error(response.error || 'Erreur chargement stats audit');
  }

  /**
   * Récupère un log par ID
   * Mode MOCK: Recherche dans MOCK_AUDIT_LOGS
   * Mode PRODUCTION: Appel GET /api/admin/audit-logs/:id
   */
  async getLogById(id: string): Promise<EnrichedLog | null> {
    if (AppConfig.isMock) {
      const allLogs = await this.getAllLogs();
      return allLogs.find(l => l.id === id) || null;
    }

    const response = await apiService.get<EnrichedLog>(ENDPOINTS.logs.get(id));
    if (response.success && response.data) {
      return response.data;
    }
    return null;
  }

  /**
   * Exporte les logs selon les filtres
   * Mode MOCK: Retourne les logs filtrés en JSON
   * Mode PRODUCTION: Appel GET /api/admin/audit-logs/export?format=csv|json
   */
  async exportLogs(
    filters: AuditLogFilters,
    format: 'json' | 'csv' = 'json'
  ): Promise<{ data: EnrichedLog[]; format: string }> {
    if (AppConfig.isMock) {
      const allLogs = await this.getAllLogs();
      const filtered = applyMockFilters(allLogs, filters);
      console.log(`[AuditLogService] Export MOCK: ${filtered.length} logs en ${format}`);
      return { data: filtered, format };
    }

    // MODE PRODUCTION: Appel API pour export
    console.log(`[AuditLogService] Mode PRODUCTION - Export ${format}`);
    const response = await apiService.get<any>(ENDPOINTS.logs.export({ format }));
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Erreur export logs');
  }

  /**
   * Récupère les valeurs uniques pour les filtres
   * Mode MOCK: Calcule côté client
   * Mode PRODUCTION: Pourrait être un endpoint dédié ou calculé depuis getAllLogs
   */
  async getFilterOptions(): Promise<{
    entityTypes: string[];
    users: { id: string; name: string; actorType: ActorType }[];
  }> {
    const allLogs = await this.getAllLogs();

    const entityTypesSet = new Set(allLogs.map(l => l.entityType).filter(Boolean));
    const usersMap = new Map<string, { name: string; actorType: ActorType }>();
    allLogs.forEach(l => {
      if (l.userName && l.userId !== 'system') {
        usersMap.set(l.userId, { name: l.userName, actorType: l.actorType });
      }
    });

    return {
      entityTypes: Array.from(entityTypesSet) as string[],
      users: Array.from(usersMap.entries()).map(([id, v]) => ({ id, name: v.name, actorType: v.actorType })),
    };
  }

  /**
   * Invalide le cache (utile après une action qui génère un nouveau log)
   */
  clearCache(): void {
    cachedLogs = null;
    cachedStats = null;
    cacheTimestamp = 0;
    console.log('[AuditLogService] Cache invalidé');
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const auditLogService = new AuditLogService();
export default auditLogService;