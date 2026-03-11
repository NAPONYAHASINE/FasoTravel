/**
 * @file useSessionManagement.ts
 * @description Hook dédié pour la page Gestion des Sessions — modèle BookingManagement
 * Backend-ready : toute la logique métier déléguée à sessionService
 * 
 * ARCHITECTURE:
 *   sessionService (mock/prod toggle) → useSessionManagement (hook page) → SessionManagement.tsx (UI)
 * 
 * Convention: useAdminApp() pour le refresh cross-page
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  sessionService,
  type SessionFilters,
  type SessionStats,
  type DeviceType,
  type UserType,
  type StatusFilter,
} from '../services/sessionService';
import type { UserSession } from '../shared/types/standardized';

// ============================================================================
// RE-EXPORTS
// ============================================================================

export type { DeviceType, UserType, StatusFilter, SessionStats };

// ============================================================================
// CONSTANTS (UI config — pas de logique métier)
// ============================================================================

export const DEVICE_CONFIG: Record<DeviceType, { label: string; icon: string }> = {
  web: { label: 'Web', icon: 'monitor' },
  mobile: { label: 'Mobile', icon: 'smartphone' },
  tablet: { label: 'Tablette', icon: 'tablet' },
};

export const USER_TYPE_CONFIG: Record<UserType, {
  label: string;
  bgClass: string;
}> = {
  admin: {
    label: 'Admin',
    bgClass: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  },
  operator: {
    label: 'Opérateur',
    bgClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  },
  passenger: {
    label: 'Passager',
    bgClass: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  },
};

// ============================================================================
// RELATIVE TIME (date fixe mock)
// ============================================================================

export function formatTimeAgo(dateStr: string): string {
  const now = new Date('2026-03-09T12:00:00Z');
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'à l\'instant';
  if (diffMin < 60) return `il y a ${diffMin} min`;
  if (diffH < 24) return `il y a ${diffH}h`;
  if (diffD < 7) return `il y a ${diffD}j`;
  return `il y a ${Math.floor(diffD / 7)} sem.`;
}

export function formatFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-BF', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ============================================================================
// CONFIRM ACTION TYPE
// ============================================================================

export type ConfirmAction =
  | { type: 'revoke'; sessionId: string }
  | { type: 'revokeByUser'; userId: string; userName: string }
  | { type: 'revokeBulk'; ids: string[] }
  | { type: 'revokeSuspicious' }
  | { type: 'blockIp'; ip: string }
  | null;

export function getConfirmConfig(action: ConfirmAction): {
  title: string;
  message: string;
  confirmType: 'danger' | 'warning';
} {
  if (!action) return { title: '', message: '', confirmType: 'danger' };
  switch (action.type) {
    case 'revoke':
      return {
        title: 'Révoquer la session',
        message: 'Êtes-vous sûr de vouloir révoquer cette session ? L\'utilisateur sera déconnecté immédiatement.',
        confirmType: 'danger',
      };
    case 'revokeByUser':
      return {
        title: `Révoquer toutes les sessions de ${action.userName}`,
        message: `Toutes les sessions actives de ${action.userName} seront terminées. L'utilisateur sera déconnecté de tous ses appareils.`,
        confirmType: 'danger',
      };
    case 'revokeBulk':
      return {
        title: `Révoquer ${action.ids.length} session(s)`,
        message: `${action.ids.length} session(s) sélectionnée(s) seront terminées immédiatement.`,
        confirmType: 'danger',
      };
    case 'revokeSuspicious':
      return {
        title: 'Révoquer toutes les sessions suspectes',
        message: 'Toutes les sessions marquées comme suspectes (IPs multiples) seront terminées. Les utilisateurs concernés devront se reconnecter.',
        confirmType: 'warning',
      };
    case 'blockIp':
      return {
        title: `Bloquer l'IP ${action.ip}`,
        message: `L'adresse IP ${action.ip} sera bloquée. Toutes les sessions actives depuis cette IP seront terminées et les nouvelles connexions empêchées.`,
        confirmType: 'danger',
      };
  }
}

// ============================================================================
// HOOK
// ============================================================================

export function useSessionManagement() {
  // ── Filtres UI ───────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [deviceFilter, setDeviceFilter] = useState<DeviceType | 'all'>('all');
  const [userTypeFilter, setUserTypeFilter] = useState<UserType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // ── Modals ───────────────────────────────────────────────────────────────
  const [selectedSession, setSelectedSession] = useState<UserSession | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  // ── Sélection multiple ───────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ── Service-driven state ─────────────────────────────────────────────────
  const [allSessions, setAllSessions] = useState<UserSession[]>([]);
  const [stats, setStats] = useState<SessionStats>({
    total: 0, active: 0, inactive: 0, suspicious: 0,
    byDevice: { web: 0, mobile: 0, tablet: 0 },
    byUserType: { admin: 0, operator: 0, passenger: 0 },
    suspiciousUserIds: [],
    blockedIps: [],
  });

  // ── Chargement initial via le service ──────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        const sessions = await sessionService.getAllSessions();
        if (cancelled) return;
        setAllSessions(sessions);

        const computedStats = await sessionService.getStats();
        if (cancelled) return;
        setStats(computedStats);
      } catch (err) {
        console.error('[useSessionManagement] Erreur chargement:', err);
      }
    };

    loadData();
    return () => { cancelled = true; };
  }, []);

  // ── Refresh: invalidation cache + rechargement ──────────────────────────
  const refreshSessions = useCallback(async () => {
    sessionService.clearCache();
    const sessions = await sessionService.getAllSessions();
    setAllSessions(sessions);
    const computedStats = await sessionService.getStats();
    setStats(computedStats);
    setSelectedIds(new Set()); // reset sélection après refresh
  }, []);

  // ── Filtrage côté client (mock) ─────────────────────────────────────────
  const filters: SessionFilters = useMemo(() => ({
    search: searchTerm || undefined,
    deviceType: deviceFilter !== 'all' ? deviceFilter : undefined,
    userType: userTypeFilter !== 'all' ? userTypeFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  }), [searchTerm, deviceFilter, userTypeFilter, statusFilter]);

  const filteredSessions = useMemo(() => {
    let result = [...allSessions];

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
  }, [allSessions, filters]);

  // ── Pagination ──────────────────────────────────────────────────────────
  const totalPages = Math.ceil(filteredSessions.length / pageSize);
  const paginatedSessions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSessions.slice(start, start + pageSize);
  }, [filteredSessions, currentPage]);

  // ── Sélection ───────────────────────────────────────────────────────────
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    const activeOnPage = paginatedSessions.filter(s => s.active).map(s => s.id);
    const allSelected = activeOnPage.length > 0 && activeOnPage.every(id => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        activeOnPage.forEach(id => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        activeOnPage.forEach(id => next.add(id));
        return next;
      });
    }
  }, [paginatedSessions, selectedIds]);

  const isAllPageSelected = useMemo(() => {
    const activeOnPage = paginatedSessions.filter(s => s.active).map(s => s.id);
    return activeOnPage.length > 0 && activeOnPage.every(id => selectedIds.has(id));
  }, [paginatedSessions, selectedIds]);

  const selectedActiveCount = useMemo(() => {
    return Array.from(selectedIds).filter(id => {
      const s = allSessions.find(ss => ss.id === id);
      return s?.active;
    }).length;
  }, [selectedIds, allSessions]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // ── Actions unitaires ───────────────────────────────────────────────────
  const isSuspicious = useCallback((session: UserSession): boolean => {
    return stats.suspiciousUserIds.includes(session.userId);
  }, [stats.suspiciousUserIds]);

  const terminateSession = useCallback(async (sessionId: string) => {
    await sessionService.terminateSession(sessionId);
    await refreshSessions();
  }, [refreshSessions]);

  const terminateByUser = useCallback(async (userId: string) => {
    const count = await sessionService.terminateByUser(userId);
    await refreshSessions();
    return count;
  }, [refreshSessions]);

  // ── Actions en masse ────────────────────────────────────────────────────
  const terminateBulk = useCallback(async (ids: string[]) => {
    const count = await sessionService.terminateBulk(ids);
    await refreshSessions();
    return count;
  }, [refreshSessions]);

  const terminateAllSuspicious = useCallback(async () => {
    const count = await sessionService.terminateAllSuspicious();
    await refreshSessions();
    return count;
  }, [refreshSessions]);

  // ── Blocage IP ──────────────────────────────────────────────────────────
  const blockIp = useCallback(async (ip: string, reason?: string) => {
    const count = await sessionService.blockIp(ip, reason);
    await refreshSessions();
    return count;
  }, [refreshSessions]);

  // ── Export ──────────────────────────────────────────────────────────────
  const exportSessions = useCallback(async () => {
    await sessionService.exportSessions(filteredSessions);
  }, [filteredSessions]);

  // ── UI helpers ──────────────────────────────────────────────────────────
  const handleShowDetails = useCallback((session: UserSession) => {
    setSelectedSession(session);
    setShowDetailsModal(true);
  }, []);

  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setDeviceFilter('all');
    setUserTypeFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
  }, []);

  const hasActiveFilters = !!(searchTerm || deviceFilter !== 'all' || userTypeFilter !== 'all' || statusFilter !== 'all');

  // ── Confirm dispatcher ──────────────────────────────────────────────────
  const executeConfirmAction = useCallback(async (): Promise<{ success: boolean; count?: number }> => {
    if (!confirmAction) return { success: false };
    try {
      switch (confirmAction.type) {
        case 'revoke':
          await terminateSession(confirmAction.sessionId);
          return { success: true, count: 1 };
        case 'revokeByUser': {
          const count = await terminateByUser(confirmAction.userId);
          return { success: true, count };
        }
        case 'revokeBulk': {
          const count = await terminateBulk(confirmAction.ids);
          return { success: true, count };
        }
        case 'revokeSuspicious': {
          const count = await terminateAllSuspicious();
          return { success: true, count };
        }
        case 'blockIp': {
          const count = await blockIp(confirmAction.ip);
          return { success: true, count };
        }
      }
    } catch (err) {
      console.error('[useSessionManagement] Erreur action:', err);
      return { success: false };
    }
  }, [confirmAction, terminateSession, terminateByUser, terminateBulk, terminateAllSuspicious, blockIp]);

  return {
    // State
    searchTerm, setSearchTerm,
    deviceFilter, setDeviceFilter,
    userTypeFilter, setUserTypeFilter,
    statusFilter, setStatusFilter,
    currentPage, setCurrentPage, totalPages, pageSize,

    // Modals
    selectedSession, setSelectedSession,
    showDetailsModal, setShowDetailsModal,
    confirmAction, setConfirmAction,

    // Sélection multiple
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    isAllPageSelected,
    selectedActiveCount,
    clearSelection,

    // Data (via service)
    sessions: filteredSessions,
    paginatedSessions,
    stats,
    hasActiveFilters,

    // Actions
    isSuspicious,
    terminateSession,
    terminateByUser,
    terminateBulk,
    terminateAllSuspicious,
    blockIp,
    exportSessions,
    executeConfirmAction,
    handleShowDetails,
    resetFilters,
    refreshSessions,
  };
}
