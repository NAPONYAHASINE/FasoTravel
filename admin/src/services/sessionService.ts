/**
 * Service Gestion des Sessions FasoTravel Admin
 * Backend-ready: Mock service qui peut être facilement remplacé par de vrais appels API
 * 
 * RESPONSABILITÉS:
 * - Fournir l'interface entre le frontend et le backend pour les sessions utilisateurs
 * - En mode MOCK: utilise les données de /lib/adminMockData.ts
 * - En mode PRODUCTION: effectue de vrais appels API
 * - ZÉRO génération de données dans ce service
 * 
 * ENDPOINTS PRODUCTION:
 * - GET    /api/admin/sessions              → getAllSessions(params)
 * - GET    /api/admin/sessions/:id          → getSessionById(id)
 * - GET    /api/admin/sessions/stats        → getStats()
 * - DELETE /api/admin/sessions/:id/terminate → terminateSession(id)
 * - POST   /api/admin/sessions/terminate-bulk → terminateBulk(ids)
 * - DELETE /api/admin/sessions/user/:userId/terminate → terminateByUser(userId)
 */

import { AppConfig } from '../config/app.config';
import { apiService, type ApiResponse } from './apiService';
import { ENDPOINTS } from './endpoints';
import { MOCK_USER_SESSIONS } from '../lib/adminMockData';
import type { UserSession } from '../shared/types/standardized';

// ============================================================================
// TYPES
// ============================================================================

export type DeviceType = UserSession['deviceType'];
export type UserType = UserSession['userType'];
export type StatusFilter = 'all' | 'active' | 'inactive';

export interface SessionFilters {
  search?: string;
  deviceType?: DeviceType;
  userType?: UserType;
  status?: StatusFilter;
}

export interface SessionPaginationParams {
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

export interface SessionStats {
  total: number;
  active: number;
  inactive: number;
  suspicious: number;
  byDevice: Record<DeviceType, number>;
  byUserType: Record<UserType, number>;
  suspiciousUserIds: string[];
  blockedIps: string[];
}

// ============================================================================
// EXPORT CSV HELPER
// ============================================================================

function sessionsToCSV(sessions: UserSession[]): string {
  const headers = ['ID', 'User ID', 'Nom', 'Type', 'Appareil', 'Info Appareil', 'IP', 'Localisation', 'Connexion', 'Dernière Activité', 'Déconnexion', 'Actif'];
  const rows = sessions.map(s => [
    s.id,
    s.userId,
    s.userName || '',
    s.userType,
    s.deviceType,
    s.deviceInfo || '',
    s.ipAddress || '',
    s.location || '',
    s.loginAt,
    s.lastActivityAt,
    s.logoutAt || '',
    s.active ? 'Oui' : 'Non',
  ]);
  return [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Détecte les sessions suspectes : un userId avec > 2 IPs distinctes
 */
function detectSuspiciousUserIds(sessions: UserSession[]): string[] {
  const ipsByUser = new Map<string, Set<string>>();
  sessions.forEach(s => {
    if (!ipsByUser.has(s.userId)) ipsByUser.set(s.userId, new Set());
    if (s.ipAddress) ipsByUser.get(s.userId)!.add(s.ipAddress);
  });
  const suspicious: string[] = [];
  ipsByUser.forEach((ips, userId) => {
    if (ips.size > 2) suspicious.push(userId);
  });
  return suspicious;
}

// ============================================================================
// CACHE EN MÉMOIRE
// ============================================================================

let cachedSessions: UserSession[] | null = null;
let cachedStats: SessionStats | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60000; // 1 minute

// ============================================================================
// MOCK: FILTRAGE CÔTÉ CLIENT
// ============================================================================

function applyMockFilters(sessions: UserSession[], filters: SessionFilters): UserSession[] {
  let result = [...sessions];

  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(s =>
      (s.id || '').toLowerCase().includes(q) ||
      (s.userId || '').toLowerCase().includes(q) ||
      (s.userName || '').toLowerCase().includes(q) ||
      (s.ipAddress || '').toLowerCase().includes(q) ||
      (s.location || '').toLowerCase().includes(q) ||
      (s.deviceInfo || '').toLowerCase().includes(q)
    );
  }

  if (filters.deviceType) {
    result = result.filter(s => s.deviceType === filters.deviceType);
  }

  if (filters.userType) {
    result = result.filter(s => s.userType === filters.userType);
  }

  if (filters.status && filters.status !== 'all') {
    const isActive = filters.status === 'active';
    result = result.filter(s => s.active === isActive);
  }

  // Sort: active first, then by lastActivityAt desc
  result.sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1;
    return new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime();
  });

  return result;
}

// ============================================================================
// MOCK: CALCUL DES STATS
// ============================================================================

function computeMockStats(sessions: UserSession[]): SessionStats {
  const active = sessions.filter(s => s.active).length;
  const inactive = sessions.filter(s => !s.active).length;

  const byDevice: Record<DeviceType, number> = { web: 0, mobile: 0, tablet: 0 };
  const byUserType: Record<UserType, number> = { admin: 0, operator: 0, passenger: 0 };

  sessions.forEach(s => {
    byDevice[s.deviceType] = (byDevice[s.deviceType] || 0) + 1;
    byUserType[s.userType] = (byUserType[s.userType] || 0) + 1;
  });

  const suspiciousUserIds = detectSuspiciousUserIds(sessions);
  const suspicious = sessions.filter(s => suspiciousUserIds.includes(s.userId)).length;

  return {
    total: sessions.length,
    active,
    inactive,
    suspicious,
    byDevice,
    byUserType,
    suspiciousUserIds,
    blockedIps: [],
  };
}

// ============================================================================
// SERVICE API
// ============================================================================

class SessionService {
  // Mutable copy for mock mutations (revoke)
  private mockData: UserSession[] = [...MOCK_USER_SESSIONS];
  // IPs bloquées (mock)
  private blockedIps: Set<string> = new Set();

  /**
   * Récupère toutes les sessions
   * Mode MOCK: Retourne MOCK_USER_SESSIONS
   * Mode PRODUCTION: Appel GET /api/admin/sessions
   */
  async getAllSessions(): Promise<UserSession[]> {
    const now = Date.now();
    if (cachedSessions && (now - cacheTimestamp < CACHE_DURATION)) {
      console.log('[SessionService] Cache utilisé');
      return cachedSessions;
    }

    if (AppConfig.isMock) {
      console.log('[SessionService] Mode MOCK - Chargement depuis /lib/adminMockData.ts');
      console.log(`[SessionService] ${this.mockData.length} sessions chargées`);
      cachedSessions = [...this.mockData];
      cacheTimestamp = now;
      return cachedSessions;
    }

    console.log('[SessionService] Mode PRODUCTION - Appel API /admin/sessions');
    const response = await apiService.get<UserSession[]>(ENDPOINTS.sessions.list());
    if (response.success && response.data) {
      cachedSessions = response.data;
      cacheTimestamp = now;
      return response.data;
    }
    throw new Error(response.error || 'Erreur chargement sessions');
  }

  /**
   * Récupère les sessions filtrées et paginées
   * Mode MOCK: Filtre côté client
   * Mode PRODUCTION: Appel GET /api/admin/sessions?filters...&page=X&pageSize=Y
   */
  async getFilteredSessions(
    filters: SessionFilters,
    pagination: SessionPaginationParams
  ): Promise<PaginatedResponse<UserSession>> {
    if (AppConfig.isMock) {
      const all = await this.getAllSessions();
      const filtered = applyMockFilters(all, filters);
      const total = filtered.length;
      const totalPages = Math.ceil(total / pagination.pageSize);
      const start = (pagination.page - 1) * pagination.pageSize;
      const data = filtered.slice(start, start + pagination.pageSize);
      return { data, total, page: pagination.page, pageSize: pagination.pageSize, totalPages };
    }

    const params: Record<string, any> = {
      page: pagination.page,
      limit: pagination.pageSize,
      ...(filters.search && { search: filters.search }),
      ...(filters.deviceType && { deviceType: filters.deviceType }),
      ...(filters.userType && { userType: filters.userType }),
      ...(filters.status && filters.status !== 'all' && { active: filters.status === 'active' }),
    };

    const response = await apiService.get<PaginatedResponse<UserSession>>(
      ENDPOINTS.sessions.list(params)
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Erreur chargement sessions filtrées');
  }

  /**
   * Récupère les statistiques de sessions
   * Mode MOCK: Calcule côté client
   * Mode PRODUCTION: Appel GET /api/admin/sessions/stats (agrégation SQL côté backend)
   */
  async getStats(): Promise<SessionStats> {
    if (AppConfig.isMock) {
      const all = await this.getAllSessions();
      const stats = computeMockStats(all);
      cachedStats = stats;
      return stats;
    }

    console.log('[SessionService] Mode PRODUCTION - Appel API /admin/sessions/stats');
    const response = await apiService.get<SessionStats>(ENDPOINTS.sessions.stats());
    if (response.success && response.data) {
      cachedStats = response.data;
      return response.data;
    }
    throw new Error(response.error || 'Erreur chargement stats sessions');
  }

  /**
   * Récupère une session par ID
   */
  async getSessionById(id: string): Promise<UserSession | null> {
    if (AppConfig.isMock) {
      return this.mockData.find(s => s.id === id) || null;
    }

    const response = await apiService.get<UserSession>(ENDPOINTS.sessions.get(id));
    if (response.success && response.data) {
      return response.data;
    }
    return null;
  }

  /**
   * Termine (révoque) une session
   * Mode MOCK: Marque la session comme inactive
   * Mode PRODUCTION: Appel DELETE /api/admin/sessions/:id/terminate
   */
  async terminateSession(id: string): Promise<void> {
    if (AppConfig.isMock) {
      const idx = this.mockData.findIndex(s => s.id === id);
      if (idx !== -1) {
        this.mockData[idx] = {
          ...this.mockData[idx],
          active: false,
          logoutAt: new Date().toISOString(),
        };
      }
      this.clearCache();
      return;
    }

    const response = await apiService.delete<void>(ENDPOINTS.sessions.terminate(id));
    if (!response.success) {
      throw new Error(response.error || 'Erreur terminaison session');
    }
    this.clearCache();
  }

  /**
   * Termine toutes les sessions d'un utilisateur
   * Mode MOCK: Marque toutes les sessions active de l'userId comme inactives
   * Mode PRODUCTION: Appel DELETE /api/admin/sessions/user/:userId/terminate
   */
  async terminateByUser(userId: string): Promise<number> {
    if (AppConfig.isMock) {
      let count = 0;
      this.mockData.forEach((s, idx) => {
        if (s.userId === userId && s.active) {
          this.mockData[idx] = { ...s, active: false, logoutAt: new Date().toISOString() };
          count++;
        }
      });
      this.clearCache();
      return count;
    }

    const response = await apiService.delete<{ count: number }>(
      ENDPOINTS.sessions.terminateByUser(userId)
    );
    if (response.success && response.data) {
      this.clearCache();
      return response.data.count;
    }
    throw new Error(response.error || 'Erreur terminaison sessions utilisateur');
  }

  /**
   * Termine plusieurs sessions en masse (bulk)
   * Mode MOCK: Marque les sessions sélectionnées comme inactives
   * Mode PRODUCTION: Appel POST /api/admin/sessions/terminate-bulk
   */
  async terminateBulk(ids: string[]): Promise<number> {
    if (AppConfig.isMock) {
      let count = 0;
      ids.forEach(id => {
        const idx = this.mockData.findIndex(s => s.id === id);
        if (idx !== -1 && this.mockData[idx].active) {
          this.mockData[idx] = { ...this.mockData[idx], active: false, logoutAt: new Date().toISOString() };
          count++;
        }
      });
      this.clearCache();
      return count;
    }

    const response = await apiService.post<{ count: number }>(
      ENDPOINTS.sessions.terminateBulk(),
      { sessionIds: ids }
    );
    if (response.success && response.data) {
      this.clearCache();
      return response.data.count;
    }
    throw new Error(response.error || 'Erreur terminaison en masse');
  }

  /**
   * Termine toutes les sessions marquées comme suspectes
   * Mode MOCK: Termine toutes les sessions des userIds suspects
   * Mode PRODUCTION: Appel POST /api/admin/sessions/terminate-suspicious
   */
  async terminateAllSuspicious(): Promise<number> {
    if (AppConfig.isMock) {
      const suspiciousIds = detectSuspiciousUserIds(this.mockData);
      let count = 0;
      this.mockData.forEach((s, idx) => {
        if (suspiciousIds.includes(s.userId) && s.active) {
          this.mockData[idx] = { ...s, active: false, logoutAt: new Date().toISOString() };
          count++;
        }
      });
      this.clearCache();
      return count;
    }

    const response = await apiService.post<{ count: number }>(
      ENDPOINTS.sessions.terminateSuspicious(),
      {}
    );
    if (response.success && response.data) {
      this.clearCache();
      return response.data.count;
    }
    throw new Error(response.error || 'Erreur terminaison sessions suspectes');
  }

  /**
   * Bloque une adresse IP (empêche les nouvelles connexions)
   * Mode MOCK: Ajoute l'IP à un Set local + termine les sessions actives de cette IP
   * Mode PRODUCTION: Appel POST /api/admin/sessions/block-ip
   */
  async blockIp(ip: string, reason?: string): Promise<number> {
    if (AppConfig.isMock) {
      this.blockedIps.add(ip);
      let count = 0;
      this.mockData.forEach((s, idx) => {
        if (s.ipAddress === ip && s.active) {
          this.mockData[idx] = { ...s, active: false, logoutAt: new Date().toISOString() };
          count++;
        }
      });
      this.clearCache();
      return count;
    }

    const response = await apiService.post<{ count: number }>(
      ENDPOINTS.sessions.blockIp(),
      { ip, reason }
    );
    if (response.success && response.data) {
      this.clearCache();
      return response.data.count;
    }
    throw new Error(response.error || 'Erreur blocage IP');
  }

  /**
   * Débloque une adresse IP
   */
  async unblockIp(ip: string): Promise<void> {
    if (AppConfig.isMock) {
      this.blockedIps.delete(ip);
      return;
    }

    const response = await apiService.delete<void>(ENDPOINTS.sessions.unblockIp(ip));
    if (!response.success) {
      throw new Error(response.error || 'Erreur déblocage IP');
    }
  }

  /**
   * Vérifie si une IP est bloquée
   */
  isIpBlocked(ip: string): boolean {
    return this.blockedIps.has(ip);
  }

  /**
   * Retourne les IPs bloquées
   */
  async getBlockedIps(): Promise<string[]> {
    if (AppConfig.isMock) {
      return Array.from(this.blockedIps);
    }

    const response = await apiService.get<string[]>(ENDPOINTS.sessions.blockedIps());
    if (response.success && response.data) return response.data;
    throw new Error(response.error || 'Erreur chargement IPs bloquées');
  }

  /**
   * Export des sessions en CSV
   * Mode MOCK: Génère le CSV côté client
   * Mode PRODUCTION: Appel GET /api/admin/sessions/export
   */
  async exportSessions(sessions: UserSession[], format: 'csv' = 'csv'): Promise<void> {
    const csvContent = sessionsToCSV(sessions);
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sessions_fasotravel_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Vérifie si une session est suspecte (IPs multiples pour le même userId)
   */
  async isSuspicious(session: UserSession): Promise<boolean> {
    const stats = cachedStats || await this.getStats();
    return stats.suspiciousUserIds.includes(session.userId);
  }

  /**
   * Invalide le cache
   */
  clearCache(): void {
    cachedSessions = null;
    cachedStats = null;
    cacheTimestamp = 0;
    console.log('[SessionService] Cache invalidé');
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const sessionService = new SessionService();
export default sessionService;