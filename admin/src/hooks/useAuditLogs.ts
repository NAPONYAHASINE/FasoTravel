/**
 * @file useAuditLogs.ts
 * @description Hook dédié pour la page Observatoire d'Audit — modèle BookingManagement
 * Backend-ready : toute la logique métier déléguée à auditLogService
 * 
 * ARCHITECTURE:
 *   auditLogService (mock/prod toggle) → useAuditLogs (hook page) → SystemLogs.tsx (UI)
 * 
 * ACTOR TYPES : dérivés du userId prefix
 *   admin_*     → 'admin'     (Administrateurs FasoTravel)
 *   operator_*  → 'operator'  (Employés des sociétés de transport)
 *   passenger_* → 'passenger' (Passagers app mobile)
 *   system      → 'system'    (Tâches automatiques)
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useAdminApp } from '../context/AdminAppContext';
import {
  auditLogService,
  getActorType,
  type ActorType,
  type EnrichedLog,
  type AuditStats,
  type AuditLogFilters,
} from '../services/auditLogService';

// ============================================================================
// RE-EXPORTS (pour compatibilité avec SystemLogs.tsx)
// ============================================================================

export { getActorType };
export type { ActorType, EnrichedLog, AuditStats };

export type AuditTab = 'timeline' | 'table' | 'stats';
export type SeverityFilter = 'all' | 'info' | 'warning' | 'critical';
export type CategoryFilter = 'all' | 'security' | 'operations' | 'finance' | 'content' | 'config';
export type SourceFilter = 'all' | ActorType;

// ============================================================================
// CONSTANTS (UI config — pas de logique métier)
// ============================================================================

export const ACTOR_CONFIG: Record<ActorType, {
  label: string;
  shortLabel: string;
  color: string;
  bgClass: string;
  borderClass: string;
  dotClass: string;
  icon: string;
}> = {
  admin: {
    label: 'Administrateur',
    shortLabel: 'Admin',
    color: '#3b82f6',
    bgClass: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
    borderClass: 'border-l-blue-500',
    dotClass: 'bg-blue-500',
    icon: 'shield',
  },
  operator: {
    label: 'Société de transport',
    shortLabel: 'Société',
    color: '#f59e0b',
    bgClass: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300',
    borderClass: 'border-l-amber-500',
    dotClass: 'bg-amber-500',
    icon: 'building',
  },
  passenger: {
    label: 'Passager',
    shortLabel: 'Passager',
    color: '#16a34a',
    bgClass: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300',
    borderClass: 'border-l-green-500',
    dotClass: 'bg-green-500',
    icon: 'user',
  },
  system: {
    label: 'Système',
    shortLabel: 'Système',
    color: '#6b7280',
    bgClass: 'bg-gray-100 dark:bg-gray-700/30 text-gray-600 dark:text-gray-400',
    borderClass: 'border-l-gray-400',
    dotClass: 'bg-gray-400',
    icon: 'cpu',
  },
};

export const ENTITY_LABELS: Record<string, string> = {
  company: 'Société', passenger: 'Passager', station: 'Gare', booking: 'Réservation',
  ticket: 'Billet', payment: 'Paiement', integration: 'Intégration', story: 'Story',
  promotion: 'Promotion', advertisement: 'Publicité', support: 'Support', incident: 'Incident',
  notification: 'Notification', feature_flag: 'Feature Flag', session: 'Session',
  operator: 'Opérateur', policy: 'Politique', system: 'Système',
};

export const ENTITY_COLORS: Record<string, string> = {
  company: '#dc2626', passenger: '#f59e0b', station: '#16a34a', booking: '#3b82f6',
  ticket: '#8b5cf6', payment: '#10b981', integration: '#f97316', story: '#ec4899',
  promotion: '#6366f1', advertisement: '#14b8a6', support: '#64748b', incident: '#ef4444',
  notification: '#0ea5e9', feature_flag: '#a855f7', session: '#6b7280',
  operator: '#d97706', policy: '#0891b2', system: '#374151',
};

export const ACTION_LABELS: Record<string, string> = {
  create: 'Création', update: 'Modification', delete: 'Suppression', approve: 'Approbation',
  reject: 'Rejet', suspend: 'Suspension', reactivate: 'Réactivation', verify: 'Vérification',
  resolve: 'Résolution', publish: 'Publication', archive: 'Archivage', toggle: 'Activation/Désactivation',
  export: 'Export', login: 'Connexion', login_failed: 'Echec connexion', logout: 'Déconnexion',
  config_change: 'Config. modifiée', bulk_send: 'Envoi en masse', refund: 'Remboursement',
  escalate: 'Escalade', assign: 'Assignation', terminate: 'Terminaison', health_check: 'Health check',
  alert_triggered: 'Alerte déclenchée', backup_completed: 'Backup terminé', ssl_renewal: 'Renouvellement SSL',
};

export const CATEGORY_LABELS: Record<string, string> = {
  security: 'Sécurité', operations: 'Opérations', finance: 'Finance',
  content: 'Contenu', config: 'Configuration',
};

export const CATEGORY_COLORS: Record<string, string> = {
  security: '#ef4444', operations: '#3b82f6', finance: '#10b981',
  content: '#8b5cf6', config: '#f59e0b',
};

export const SEVERITY_CONFIG = {
  info: { label: 'Info', color: '#3b82f6', bg: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
  warning: { label: 'Attention', color: '#f59e0b', bg: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
  critical: { label: 'Critique', color: '#ef4444', bg: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300', dot: 'bg-red-500' },
};

// ============================================================================
// RELATIVE TIME (utilitaires d'affichage)
// ============================================================================

export function formatRelativeTime(dateStr: string): string {
  const now = new Date('2026-03-09T12:00:00Z');
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'à l\'instant';
  if (diffMin < 60) return `il y a ${diffMin}min`;
  if (diffH < 24) return `il y a ${diffH}h`;
  if (diffD < 7) return `il y a ${diffD}j`;
  if (diffD < 30) return `il y a ${Math.floor(diffD / 7)} sem.`;
  if (diffD < 365) return `il y a ${Math.floor(diffD / 30)} mois`;
  return `il y a ${Math.floor(diffD / 365)} an(s)`;
}

export function formatFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-BF', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function formatDuration(ms?: number): string {
  if (!ms) return '—';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}min`;
}

// ============================================================================
// HOOK
// ============================================================================

export function useAuditLogs() {
  const { refreshAuditLogs } = useAdminApp();
  
  // State
  const [activeTab, setActiveTab] = useState<AuditTab>('timeline');
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [entityTypeFilter, setEntityTypeFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [dateRange, setDateRange] = useState<'all' | '24h' | '7d' | '30d' | '90d'>('all');
  const [selectedLog, setSelectedLog] = useState<EnrichedLog | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Service-driven state
  const [allLogs, setAllLogs] = useState<EnrichedLog[]>([]);
  const [stats, setStats] = useState<AuditStats>({
    total: 0, thisMonth: 0, thisWeek: 0, today: 0,
    critical: 0, warning: 0, info: 0, uniqueUsers: 0,
    byCategory: {}, byEntityType: {}, byUser: [], byMonth: [],
    bySource: { admin: 0, operator: 0, passenger: 0, system: 0 },
    avgDurationMs: 0, topActions: [],
  });
  const [uniqueEntityTypes, setUniqueEntityTypes] = useState<string[]>([]);
  const [uniqueUsers, setUniqueUsers] = useState<{ id: string; name: string; actorType: ActorType }[]>([]);

  // ── Chargement initial via le service ──────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        // 1. Charger les logs via le service (mock ou API)
        const logs = await auditLogService.getAllLogs();
        if (cancelled) return;
        setAllLogs(logs);

        // 2. Charger les stats via le service
        const computedStats = await auditLogService.getStats();
        if (cancelled) return;
        setStats(computedStats);

        // 3. Charger les options de filtres
        const filterOptions = await auditLogService.getFilterOptions();
        if (cancelled) return;
        setUniqueEntityTypes(filterOptions.entityTypes);
        setUniqueUsers(filterOptions.users);
      } catch (err) {
        console.error('[useAuditLogs] Erreur chargement:', err);
      }
    };

    loadData();
    return () => { cancelled = true; };
  }, []);

  // ── Refresh: invalidation cache + rechargement ──────────────────────────
  const refreshLogs = useCallback(async () => {
    auditLogService.clearCache();
    // Rafraîchir aussi via le contexte (pour les autres consommateurs)
    await refreshAuditLogs();

    const logs = await auditLogService.getAllLogs();
    setAllLogs(logs);

    const computedStats = await auditLogService.getStats();
    setStats(computedStats);

    const filterOptions = await auditLogService.getFilterOptions();
    setUniqueEntityTypes(filterOptions.entityTypes);
    setUniqueUsers(filterOptions.users);
  }, [refreshAuditLogs]);

  // ── Filtrage côté client (mock) ou préparation params (production) ─────
  const filters: AuditLogFilters = useMemo(() => ({
    search: searchTerm || undefined,
    source: sourceFilter !== 'all' ? sourceFilter : undefined,
    severity: severityFilter !== 'all' ? severityFilter : undefined,
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
    entityType: entityTypeFilter !== 'all' ? entityTypeFilter : undefined,
    userId: userFilter !== 'all' ? userFilter : undefined,
    dateRange: dateRange !== 'all' ? dateRange : undefined,
  }), [searchTerm, sourceFilter, severityFilter, categoryFilter, entityTypeFilter, userFilter, dateRange]);

  // Client-side filtering (mock mode — en production, le service envoie les filtres au backend)
  const filteredLogs = useMemo(() => {
    let result = [...allLogs];

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

    if (filters.source) {
      result = result.filter(l => l.actorType === filters.source);
    }

    if (filters.severity) {
      result = result.filter(l => l.severity === filters.severity);
    }

    if (filters.category) {
      result = result.filter(l => l.category === filters.category);
    }

    if (filters.entityType) {
      result = result.filter(l => l.entityType === filters.entityType);
    }

    if (filters.userId) {
      result = result.filter(l => l.userId === filters.userId);
    }

    if (filters.dateRange) {
      const now = new Date('2026-03-09T12:00:00Z').getTime();
      const ranges: Record<string, number> = {
        '24h': 86400000, '7d': 604800000, '30d': 2592000000, '90d': 7776000000,
      };
      const cutoff = now - (ranges[filters.dateRange] || 0);
      result = result.filter(l => new Date(l.createdAt).getTime() >= cutoff);
    }

    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return result;
  }, [allLogs, filters]);

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / pageSize);
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage]);

  // Group logs by day for timeline
  const groupedByDay = useMemo(() => {
    const groups: { date: string; label: string; logs: EnrichedLog[] }[] = [];
    const map = new Map<string, EnrichedLog[]>();

    paginatedLogs.forEach(l => {
      const d = l.createdAt.substring(0, 10);
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(l);
    });

    map.forEach((dayLogs, date) => {
      const d = new Date(date);
      const label = d.toLocaleDateString('fr-BF', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      groups.push({ date, label, logs: dayLogs });
    });

    return groups;
  }, [paginatedLogs]);

  // Actions
  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setSeverityFilter('all');
    setCategoryFilter('all');
    setEntityTypeFilter('all');
    setUserFilter('all');
    setSourceFilter('all');
    setDateRange('all');
    setCurrentPage(1);
  }, []);

  const toggleExpand = useCallback((id: string) => {
    setExpandedLogId(prev => prev === id ? null : id);
  }, []);

  const hasActiveFilters = !!(searchTerm || severityFilter !== 'all' || categoryFilter !== 'all' || entityTypeFilter !== 'all' || userFilter !== 'all' || sourceFilter !== 'all' || dateRange !== 'all');

  return {
    // State
    activeTab, setActiveTab,
    searchTerm, setSearchTerm,
    severityFilter, setSeverityFilter,
    categoryFilter, setCategoryFilter,
    entityTypeFilter, setEntityTypeFilter,
    userFilter, setUserFilter,
    sourceFilter, setSourceFilter,
    dateRange, setDateRange,
    selectedLog, setSelectedLog,
    expandedLogId, toggleExpand,
    currentPage, setCurrentPage, totalPages, pageSize,
    
    // Data (via service)
    logs: filteredLogs,
    paginatedLogs,
    groupedByDay,
    stats,
    uniqueEntityTypes,
    uniqueUsers,
    hasActiveFilters,

    // Actions
    resetFilters,
    refreshLogs,
  };
}
