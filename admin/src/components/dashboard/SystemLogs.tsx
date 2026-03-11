/**
 * @file SystemLogs.tsx
 * @description Observatoire d'Audit — Admin FasoTravel
 * 
 * Architecture backend-ready (modèle BookingManagement) :
 * - TOUTE la logique métier dans useAuditLogs()
 * - ZÉRO logique métier ici — UI thin layer uniquement
 * - Design-system FasoTravel (PAGE_CLASSES, StatCard, COMPONENTS)
 * - 3 vues : Timeline, Tableau, Statistiques
 * - Distinction claire : Admin | Société | Passager | Système
 */

import { useState } from 'react';
import {
  Search, Download, Filter, Clock, Shield, Activity, BarChart3,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Globe,
  AlertTriangle, Cpu, User, Calendar, Building2, Smartphone,
  ArrowUpRight, Eye, XCircle, ListFilter,
  Table2, LayoutList, PieChart, MapPin, Timer, Hash,
} from 'lucide-react';
import {
  useAuditLogs,
  ENTITY_LABELS, ENTITY_COLORS, ACTION_LABELS, CATEGORY_LABELS, CATEGORY_COLORS,
  SEVERITY_CONFIG, ACTOR_CONFIG, formatRelativeTime, formatFullDate, formatDuration,
} from '../../hooks/useAuditLogs';
import type { AuditTab, SeverityFilter, CategoryFilter, SourceFilter, EnrichedLog, ActorType } from '../../hooks/useAuditLogs';
import { StatCard } from '../ui/stat-card';
import { PAGE_CLASSES, COMPONENTS, GRADIENTS } from '../../lib/design-system';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';

// ============================================================================
// CONSTANTS
// ============================================================================

const TABS: { id: AuditTab; label: string; icon: any }[] = [
  { id: 'timeline', label: 'Timeline', icon: LayoutList },
  { id: 'table', label: 'Tableau', icon: Table2 },
  { id: 'stats', label: 'Statistiques', icon: PieChart },
];

const DATE_RANGES = [
  { value: 'all', label: 'Tout' },
  { value: '24h', label: '24h' },
  { value: '7d', label: '7 jours' },
  { value: '30d', label: '30 jours' },
  { value: '90d', label: '90 jours' },
] as const;

const ACTOR_ICONS: Record<ActorType, any> = {
  admin: Shield,
  operator: Building2,
  passenger: Smartphone,
  system: Cpu,
};

// ============================================================================
// ACTOR BADGE — distingue visuellement chaque source
// ============================================================================

function ActorBadge({ actorType, size = 'sm' }: { actorType: ActorType; size?: 'sm' | 'md' }) {
  const config = ACTOR_CONFIG[actorType];
  const Icon = ACTOR_ICONS[actorType];
  const isSmall = size === 'sm';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border ${isSmall ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'} ${config.bgClass}`}
      style={{ borderColor: config.color + '30' }}
    >
      <Icon size={isSmall ? 10 : 12} />
      {config.shortLabel}
    </span>
  );
}

// ============================================================================
// ACTOR AVATAR — icône ronde colorée par source
// ============================================================================

function ActorAvatar({ actorType, name, size = 32 }: { actorType: ActorType; name?: string; size?: number }) {
  const config = ACTOR_CONFIG[actorType];
  const Icon = ACTOR_ICONS[actorType];
  const initials = name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '';
  
  return (
    <div
      className="flex-shrink-0 rounded-full flex items-center justify-center"
      style={{
        width: size, height: size,
        backgroundColor: config.color + '15',
        border: `2px solid ${config.color}40`,
      }}
    >
      {actorType === 'system' ? (
        <Icon size={size * 0.45} style={{ color: config.color }} />
      ) : (
        <span style={{ color: config.color, fontSize: size * 0.32 }} className="select-none">
          {initials || <Icon size={size * 0.4} />}
        </span>
      )}
    </div>
  );
}

// ============================================================================
// SEVERITY BADGE
// ============================================================================

function SeverityBadge({ severity }: { severity?: string }) {
  const config = SEVERITY_CONFIG[severity as keyof typeof SEVERITY_CONFIG] || SEVERITY_CONFIG.info;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] ${config.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

// ============================================================================
// ENTITY BADGE
// ============================================================================

function EntityBadge({ type }: { type?: string }) {
  const color = ENTITY_COLORS[type || ''] || '#6b7280';
  const label = ENTITY_LABELS[type || ''] || type || 'Autre';
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] border"
      style={{ color, borderColor: color + '40', backgroundColor: color + '10' }}
    >
      {label}
    </span>
  );
}

// ============================================================================
// CATEGORY BADGE
// ============================================================================

function CategoryBadge({ category }: { category?: string }) {
  const color = CATEGORY_COLORS[category || ''] || '#6b7280';
  const label = CATEGORY_LABELS[category || ''] || category || '—';
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px]"
      style={{ color, backgroundColor: color + '15' }}>
      {label}
    </span>
  );
}

// ============================================================================
// CHANGES DIFF
// ============================================================================

function ChangesDiff({ changes }: { changes?: Record<string, { oldValue: any; newValue: any }> }) {
  if (!changes || Object.keys(changes).length === 0) return null;
  return (
    <div className="mt-3 space-y-1.5">
      <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-1">Modifications :</p>
      {Object.entries(changes).map(([key, { oldValue, newValue }]) => (
        <div key={key} className="flex items-center gap-2 text-[11px] font-mono">
          <span className="text-gray-500 dark:text-gray-400 min-w-[120px] truncate">{key}</span>
          {oldValue !== null && oldValue !== undefined && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 line-through">
              {String(oldValue)}
            </span>
          )}
          <ArrowUpRight size={10} className="text-gray-400 flex-shrink-0" />
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
            {String(newValue)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// DETAIL ITEM
// ============================================================================

function DetailItem({ icon: Icon, label, value, mono }: { icon: any; label: string; value: string; mono?: boolean }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
        <Icon size={10} /> {label}
      </p>
      <p className={`text-[11px] text-gray-700 dark:text-gray-300 truncate ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}

// ============================================================================
// SOURCE FILTER PILLS — barre de filtrage par source
// ============================================================================

function SourcePills({ stats, sourceFilter, onChange }: {
  stats: ReturnType<typeof useAuditLogs>['stats'];
  sourceFilter: SourceFilter;
  onChange: (s: SourceFilter) => void;
}) {
  const sources: { key: SourceFilter; label: string; count: number; icon: any }[] = [
    { key: 'all', label: 'Tous', count: stats.total, icon: Activity },
    { key: 'admin', label: 'Admin', count: stats.bySource.admin, icon: Shield },
    { key: 'operator', label: 'Sociétés', count: stats.bySource.operator, icon: Building2 },
    { key: 'passenger', label: 'Passagers', count: stats.bySource.passenger, icon: Smartphone },
    { key: 'system', label: 'Système', count: stats.bySource.system, icon: Cpu },
  ];

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {sources.map(s => {
        const active = sourceFilter === s.key;
        const config = s.key !== 'all' ? ACTOR_CONFIG[s.key as ActorType] : null;
        const Icon = s.icon;
        return (
          <button
            key={s.key}
            onClick={() => onChange(s.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all ${
              active
                ? 'text-white shadow-sm'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
            style={active ? { 
              backgroundColor: config ? config.color : '#374151',
            } : {}}
          >
            <Icon size={14} />
            <span>{s.label}</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
              active ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
            }`}>
              {s.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// TIMELINE LOG ENTRY — avec distinction visuelle par source
// ============================================================================

function TimelineEntry({ log, expanded, onToggle }: { log: EnrichedLog; expanded: boolean; onToggle: () => void }) {
  const actorConfig = ACTOR_CONFIG[log.actorType];
  const isCritical = log.severity === 'critical';

  return (
    <div className="relative pl-10 pb-4 last:pb-0">
      {/* Vertical line */}
      <div className="absolute left-[18px] top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700 last:hidden" />
      
      {/* Actor avatar on timeline */}
      <div className="absolute left-0 top-0 z-10">
        <ActorAvatar actorType={log.actorType} name={log.userName} size={38} />
      </div>

      <div
        className={`group rounded-xl border-l-[3px] border transition-all hover:shadow-md cursor-pointer ${
          isCritical
            ? 'border-l-red-500 border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-900/10'
            : `${actorConfig.borderClass} border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800`
        }`}
        onClick={onToggle}
      >
        <div className="p-3.5">
          {/* Top line: actor + time */}
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-900 dark:text-white">
                {log.userName || log.userId}
              </span>
              <ActorBadge actorType={log.actorType} />
              <SeverityBadge severity={log.severity} />
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap">
                {formatRelativeTime(log.createdAt)}
              </span>
              {expanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
            </div>
          </div>

          {/* Action + Entity */}
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className="text-[11px] text-gray-700 dark:text-gray-300">
              {ACTION_LABELS[log.action] || log.action}
            </span>
            <EntityBadge type={log.entityType} />
            {log.category && <CategoryBadge category={log.category} />}
          </div>

          {/* Description */}
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
            {log.details || `${log.action} sur ${log.entityType} ${log.entityId || ''}`}
          </p>

          {/* Meta line */}
          <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400 dark:text-gray-500">
            {log.geoLocation && (
              <span className="flex items-center gap-1">
                <MapPin size={10} /> {log.geoLocation}
              </span>
            )}
            {log.ipAddress && (
              <span className="flex items-center gap-1 font-mono">
                <Globe size={10} /> {log.ipAddress}
              </span>
            )}
            {log.durationMs !== undefined && (
              <span className="flex items-center gap-1">
                <Timer size={10} /> {formatDuration(log.durationMs)}
              </span>
            )}
            {log.entityId && (
              <span className="flex items-center gap-1 font-mono">
                <Hash size={10} /> {log.entityId}
              </span>
            )}
          </div>
        </div>

        {/* Expanded details */}
        {expanded && (
          <div className="border-t border-gray-100 dark:border-gray-700 p-4 bg-gray-50/50 dark:bg-gray-900/30 rounded-b-xl space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <DetailItem icon={Calendar} label="Date exacte" value={formatFullDate(log.createdAt)} />
              <DetailItem icon={User} label="Acteur" value={`${log.userName || log.userId} (${ACTOR_CONFIG[log.actorType].label})`} />
              <DetailItem icon={Globe} label="Adresse IP" value={log.ipAddress || '—'} mono />
              <DetailItem icon={MapPin} label="Localisation" value={log.geoLocation || '—'} />
              {log.sessionId && <DetailItem icon={Hash} label="Session" value={log.sessionId} mono />}
              {log.durationMs !== undefined && <DetailItem icon={Timer} label="Durée" value={formatDuration(log.durationMs)} />}
              {log.entityId && <DetailItem icon={Hash} label="ID Entité" value={log.entityId} mono />}
            </div>
            {log.userAgent && (
              <div className="text-[10px] text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 rounded p-2 font-mono break-all">
                {log.userAgent}
              </div>
            )}
            <ChangesDiff changes={log.changes} />
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// TABLE VIEW — avec colonne Source
// ============================================================================

function TableView({ logs, onSelect }: { logs: EnrichedLog[]; onSelect: (l: EnrichedLog) => void }) {
  return (
    <div className={PAGE_CLASSES.tableContainer}>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="text-left p-3 text-gray-500 dark:text-gray-400">Date</th>
              <th className="text-left p-3 text-gray-500 dark:text-gray-400">Source</th>
              <th className="text-left p-3 text-gray-500 dark:text-gray-400">Acteur</th>
              <th className="text-left p-3 text-gray-500 dark:text-gray-400">Action</th>
              <th className="text-left p-3 text-gray-500 dark:text-gray-400">Entité</th>
              <th className="text-left p-3 text-gray-500 dark:text-gray-400">Sévérité</th>
              <th className="text-left p-3 text-gray-500 dark:text-gray-400">Catégorie</th>
              <th className="text-left p-3 text-gray-500 dark:text-gray-400">IP</th>
              <th className="text-left p-3 text-gray-500 dark:text-gray-400">Durée</th>
              <th className="text-center p-3 text-gray-500 dark:text-gray-400">Détail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {logs.map(log => {
              const actorConfig = ACTOR_CONFIG[log.actorType];
              return (
                <tr
                  key={log.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  style={{ borderLeft: `3px solid ${actorConfig.color}` }}
                >
                  <td className="p-3 whitespace-nowrap text-gray-500 dark:text-gray-400">
                    <div>{new Date(log.createdAt).toLocaleDateString('fr-BF', { day: '2-digit', month: '2-digit' })}</div>
                    <div className="text-[10px] text-gray-400">{new Date(log.createdAt).toLocaleTimeString('fr-BF', { hour: '2-digit', minute: '2-digit' })}</div>
                  </td>
                  <td className="p-3">
                    <ActorBadge actorType={log.actorType} />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <ActorAvatar actorType={log.actorType} name={log.userName} size={24} />
                      <span className="text-gray-700 dark:text-gray-300 truncate max-w-[120px]">{log.userName || '—'}</span>
                    </div>
                  </td>
                  <td className="p-3 text-gray-900 dark:text-white">{ACTION_LABELS[log.action] || log.action}</td>
                  <td className="p-3"><EntityBadge type={log.entityType} /></td>
                  <td className="p-3"><SeverityBadge severity={log.severity} /></td>
                  <td className="p-3"><CategoryBadge category={log.category} /></td>
                  <td className="p-3 text-gray-500 dark:text-gray-400 font-mono text-[10px]">{log.ipAddress || '—'}</td>
                  <td className="p-3 text-gray-500 dark:text-gray-400">{formatDuration(log.durationMs)}</td>
                  <td className="p-3 text-center">
                    <button onClick={() => onSelect(log)} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                      <Eye size={14} className="text-gray-500" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// STATS VIEW — avec breakdown par source
// ============================================================================

function StatsView({ stats }: { stats: ReturnType<typeof useAuditLogs>['stats'] }) {
  const maxAction = Math.max(...stats.topActions.map(a => a.count), 1);
  const maxCategory = Math.max(...Object.values(stats.byCategory), 1);
  const maxEntity = Math.max(...Object.values(stats.byEntityType), 1);

  return (
    <div className="space-y-6">
      {/* Source breakdown — PRIMARY SECTION */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="text-sm text-gray-900 dark:text-white mb-5 flex items-center gap-2">
          <Activity size={16} className="text-red-500" /> Répartition par source
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(Object.entries(ACTOR_CONFIG) as [ActorType, typeof ACTOR_CONFIG.admin][]).map(([key, config]) => {
            const count = stats.bySource[key] || 0;
            const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
            const Icon = ACTOR_ICONS[key];
            return (
              <div key={key} className="relative overflow-hidden rounded-xl border border-gray-100 dark:border-gray-700 p-4" style={{ backgroundColor: config.color + '08' }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: config.color + '15' }}>
                    <Icon size={20} style={{ color: config.color }} />
                  </div>
                  <div>
                    <p className="text-lg text-gray-900 dark:text-white">{count}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">{config.label}</p>
                  </div>
                </div>
                <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: config.color }} />
                </div>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 text-right">{pct}%</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity by user */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="text-sm text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <User size={16} className="text-blue-500" /> Activité par acteur
        </h3>
        <div className="space-y-3">
          {stats.byUser.map(u => (
            <div key={u.name} className="flex items-center gap-3">
              <ActorAvatar actorType={u.actorType} name={u.name} size={32} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-gray-900 dark:text-white truncate">{u.name}</span>
                    <ActorBadge actorType={u.actorType} />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">{u.count} actions</span>
                </div>
                <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(u.count / stats.total) * 100}%`, backgroundColor: ACTOR_CONFIG[u.actorType].color }} />
                </div>
                <span className="text-[10px] text-gray-400 dark:text-gray-500">Dernière activité : {formatRelativeTime(u.lastActive)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-sm text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Activity size={16} className="text-green-500" /> Actions les plus fréquentes
          </h3>
          <div className="space-y-2.5">
            {stats.topActions.map(a => (
              <div key={a.action}>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-gray-700 dark:text-gray-300">{ACTION_LABELS[a.action] || a.action}</span>
                  <span className="text-gray-500 dark:text-gray-400">{a.count}</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${(a.count / maxAction) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By category */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-sm text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <ListFilter size={16} className="text-purple-500" /> Par catégorie
          </h3>
          <div className="space-y-2.5">
            {Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
              <div key={cat}>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-gray-700 dark:text-gray-300">{CATEGORY_LABELS[cat] || cat}</span>
                  <span className="text-gray-500 dark:text-gray-400">{count}</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${(count / maxCategory) * 100}%`, backgroundColor: CATEGORY_COLORS[cat] || '#6b7280' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By entity type */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 md:col-span-2">
          <h3 className="text-sm text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <BarChart3 size={16} className="text-orange-500" /> Par type d'entité
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(stats.byEntityType).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
              const color = ENTITY_COLORS[type] || '#6b7280';
              return (
                <div key={type} className="p-3 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] text-gray-700 dark:text-gray-300">{ENTITY_LABELS[type] || type}</span>
                    <span className="text-xs text-gray-900 dark:text-white">{count}</span>
                  </div>
                  <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(count / maxEntity) * 100}%`, backgroundColor: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Severity breakdown + Monthly trend */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-sm text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" /> Répartition par sévérité
          </h3>
          <div className="space-y-3">
            {[
              { key: 'info', count: stats.info, label: 'Info', color: '#3b82f6' },
              { key: 'warning', count: stats.warning, label: 'Attention', color: '#f59e0b' },
              { key: 'critical', count: stats.critical, label: 'Critique', color: '#ef4444' },
            ].map(s => (
              <div key={s.key} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-700 dark:text-gray-300">{s.label}</span>
                    <span className="text-gray-500">{s.count} ({stats.total > 0 ? Math.round((s.count / stats.total) * 100) : 0}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${stats.total > 0 ? (s.count / stats.total) * 100 : 0}%`, backgroundColor: s.color }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-sm text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Calendar size={16} className="text-blue-500" /> Tendance mensuelle
          </h3>
          <div className="space-y-2">
            {stats.byMonth.map(m => {
              const maxMonth = Math.max(...stats.byMonth.map(x => x.count), 1);
              const monthLabel = new Date(m.month + '-01').toLocaleDateString('fr-BF', { month: 'short', year: 'numeric' });
              return (
                <div key={m.month} className="flex items-center gap-3">
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 w-16 text-right">{monthLabel}</span>
                  <div className="flex-1 h-5 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                    <div className="h-full rounded flex items-center pl-2" style={{ width: `${(m.count / maxMonth) * 100}%`, background: GRADIENTS.burkinabe }}>
                      <span className="text-[10px] text-white">{m.count}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// DETAIL MODAL — avec source visible
// ============================================================================

function DetailModal({ log, open, onClose }: { log: EnrichedLog | null; open: boolean; onClose: () => void }) {
  if (!log) return null;
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2 flex-wrap">
            {ACTION_LABELS[log.action] || log.action}
            <EntityBadge type={log.entityType} />
            <ActorBadge actorType={log.actorType} size="md" />
          </DialogTitle>
          <DialogDescription className="text-xs">{log.details}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="flex gap-2 flex-wrap">
            <SeverityBadge severity={log.severity} />
            {log.category && <CategoryBadge category={log.category} />}
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700">
            <ActorAvatar actorType={log.actorType} name={log.userName} size={40} />
            <div>
              <p className="text-sm text-gray-900 dark:text-white">{log.userName || log.userId}</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">{ACTOR_CONFIG[log.actorType].label}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <DetailItem icon={Calendar} label="Date" value={formatFullDate(log.createdAt)} />
            <DetailItem icon={Globe} label="IP" value={log.ipAddress || '—'} mono />
            <DetailItem icon={MapPin} label="Localisation" value={log.geoLocation || '—'} />
            {log.sessionId && <DetailItem icon={Hash} label="Session" value={log.sessionId} mono />}
            {log.entityId && <DetailItem icon={Hash} label="ID Entité" value={log.entityId} mono />}
            {log.durationMs !== undefined && <DetailItem icon={Timer} label="Durée" value={formatDuration(log.durationMs)} />}
          </div>
          {log.userAgent && (
            <div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">User Agent</p>
              <p className="text-[10px] font-mono bg-gray-50 dark:bg-gray-900 p-2 rounded break-all text-gray-600 dark:text-gray-400">{log.userAgent}</p>
            </div>
          )}
          <ChangesDiff changes={log.changes} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// EMPTY STATE
// ============================================================================

function EmptyState({ hasFilters, onReset }: { hasFilters: boolean; onReset: () => void }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
      <div className="w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center mx-auto mb-4">
        <Search className="text-gray-400" size={28} />
      </div>
      <h3 className="text-base text-gray-900 dark:text-white mb-1">Aucun log trouvé</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {hasFilters ? 'Essayez de modifier vos filtres de recherche' : 'Aucun événement enregistré'}
      </p>
      {hasFilters && (
        <button onClick={onReset} className={COMPONENTS.buttonPrimary} style={{ background: GRADIENTS.burkinabe }}>
          Réinitialiser les filtres
        </button>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SystemLogs() {
  const page = useAuditLogs();
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className={PAGE_CLASSES.container}>
      <div className={PAGE_CLASSES.content}>
        {/* Header */}
        <div className={PAGE_CLASSES.header}>
          <div className={PAGE_CLASSES.headerContent}>
            <div className={PAGE_CLASSES.headerTexts}>
              <h1 className="text-2xl text-gray-900 dark:text-white mb-1">Observatoire d'Audit</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Traçabilité complète — Admin, Sociétés, Passagers, Système — {page.stats.total} événements
              </p>
            </div>
            <div className={PAGE_CLASSES.headerActions}>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                <span className="text-xs text-green-700 dark:text-green-300">Surveillance active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className={PAGE_CLASSES.statsGrid}>
          <StatCard title="Total événements" value={page.stats.total} subtitle={`${page.stats.thisMonth} ce mois`} icon={Activity} color="blue" />
          <StatCard title="Aujourd'hui" value={page.stats.today} subtitle={`${page.stats.thisWeek} cette semaine`} icon={Clock} color="green" />
          <StatCard
            title="Alertes critiques"
            value={page.stats.critical}
            subtitle={`${page.stats.warning} avertissements`}
            icon={page.stats.critical > 0 ? AlertTriangle : Shield}
            color={page.stats.critical > 0 ? 'red' : 'green'}
          />
          <StatCard title="Acteurs distincts" value={page.stats.uniqueUsers} subtitle={`Latence moy. ${formatDuration(page.stats.avgDurationMs)}`} icon={User} color="yellow" />
        </div>

        {/* Source Filter Pills */}
        <div className="mb-5">
          <SourcePills stats={page.stats} sourceFilter={page.sourceFilter} onChange={(s) => { page.setSourceFilter(s); page.setCurrentPage(1); }} />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-4 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = page.activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => page.setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all ${
                  active
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search & Filters */}
        {page.activeTab !== 'stats' && (
          <div className={PAGE_CLASSES.searchSection}>
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Rechercher par description, acteur, IP, entité..."
                  value={page.searchTerm}
                  onChange={e => { page.setSearchTerm(e.target.value); page.setCurrentPage(1); }}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-sm"
                />
              </div>
              <div className="flex gap-2">
                {DATE_RANGES.map(r => (
                  <button
                    key={r.value}
                    onClick={() => { page.setDateRange(r.value as any); page.setCurrentPage(1); }}
                    className={`px-3 py-2 rounded-lg text-xs transition-all ${
                      page.dateRange === r.value
                        ? 'bg-gray-900 dark:bg-gray-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs transition-all ${
                    page.hasActiveFilters
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Filter size={14} />
                  Filtres
                  {page.hasActiveFilters && (
                    <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">!</span>
                  )}
                </button>
              </div>
            </div>

            {/* Advanced filters */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] text-gray-500 dark:text-gray-400 mb-1">Sévérité</label>
                  <select value={page.severityFilter} onChange={e => { page.setSeverityFilter(e.target.value as SeverityFilter); page.setCurrentPage(1); }} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-800 text-xs">
                    <option value="all">Toutes</option>
                    <option value="info">Info</option>
                    <option value="warning">Attention</option>
                    <option value="critical">Critique</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 dark:text-gray-400 mb-1">Catégorie</label>
                  <select value={page.categoryFilter} onChange={e => { page.setCategoryFilter(e.target.value as CategoryFilter); page.setCurrentPage(1); }} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-800 text-xs">
                    <option value="all">Toutes</option>
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 dark:text-gray-400 mb-1">Type d'entité</label>
                  <select value={page.entityTypeFilter} onChange={e => { page.setEntityTypeFilter(e.target.value); page.setCurrentPage(1); }} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-800 text-xs">
                    <option value="all">Tous</option>
                    {page.uniqueEntityTypes.map(t => <option key={t} value={t}>{ENTITY_LABELS[t] || t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 dark:text-gray-400 mb-1">Acteur</label>
                  <select value={page.userFilter} onChange={e => { page.setUserFilter(e.target.value); page.setCurrentPage(1); }} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-800 text-xs">
                    <option value="all">Tous</option>
                    <option value="system">Système</option>
                    {page.uniqueUsers.map(u => <option key={u.id} value={u.id}>{u.name} ({ACTOR_CONFIG[u.actorType].shortLabel})</option>)}
                  </select>
                </div>
                {page.hasActiveFilters && (
                  <div className="col-span-2 md:col-span-4 flex justify-end">
                    <button onClick={page.resetFilters} className="text-xs text-red-600 dark:text-red-400 hover:underline flex items-center gap-1">
                      <XCircle size={12} /> Réinitialiser tous les filtres
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Result count + Export */}
            <div className="mt-3 flex items-center justify-between">
              <p className="text-[11px] text-gray-400 dark:text-gray-500">
                {page.logs.length} résultat{page.logs.length > 1 ? 's' : ''}
                {page.hasActiveFilters ? ' (filtré)' : ''}
                {page.sourceFilter !== 'all' && ` — ${ACTOR_CONFIG[page.sourceFilter].label}`}
              </p>
              {page.activeTab === 'table' && (
                <button
                  className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  onClick={() => {
                    const csv = ['Date,Source,Action,Entité,Utilisateur,Sévérité,Catégorie,IP,Détails']
                      .concat(page.logs.map(l =>
                        [l.createdAt, ACTOR_CONFIG[l.actorType].shortLabel, l.action, l.entityType, l.userName, l.severity, l.category, l.ipAddress, `"${(l.details || '').replace(/"/g, '""')}"`].join(',')
                      )).join('\n');
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url; a.download = 'audit_logs.csv'; a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  <Download size={12} /> Export CSV
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        {page.activeTab === 'timeline' && (
          <div className="space-y-0">
            {page.groupedByDay.length === 0 && (
              <EmptyState hasFilters={page.hasActiveFilters} onReset={page.resetFilters} />
            )}
            {page.groupedByDay.map(group => (
              <div key={group.date} className="mb-6">
                <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm py-2 mb-3">
                  <h3 className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <Calendar size={12} />
                    {group.label}
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">({group.logs.length} événements)</span>
                  </h3>
                </div>
                <div className="ml-2">
                  {group.logs.map(log => (
                    <TimelineEntry
                      key={log.id}
                      log={log}
                      expanded={page.expandedLogId === log.id}
                      onToggle={() => page.toggleExpand(log.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {page.activeTab === 'table' && (
          <>
            {page.paginatedLogs.length === 0 ? (
              <EmptyState hasFilters={page.hasActiveFilters} onReset={page.resetFilters} />
            ) : (
              <TableView logs={page.paginatedLogs} onSelect={l => page.setSelectedLog(l)} />
            )}
          </>
        )}

        {page.activeTab === 'stats' && <StatsView stats={page.stats} />}

        {/* Pagination */}
        {page.activeTab !== 'stats' && page.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Page {page.currentPage} / {page.totalPages}
            </p>
            <div className="flex items-center gap-1">
              <button
                disabled={page.currentPage <= 1}
                onClick={() => page.setCurrentPage(p => p - 1)}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 disabled:opacity-30 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(page.totalPages, 5) }, (_, i) => {
                const p = page.currentPage <= 3 ? i + 1 : page.currentPage - 2 + i;
                if (p > page.totalPages || p < 1) return null;
                return (
                  <button
                    key={p}
                    onClick={() => page.setCurrentPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs transition-all ${
                      p === page.currentPage
                        ? 'text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                    style={p === page.currentPage ? { background: GRADIENTS.burkinabe } : {}}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                disabled={page.currentPage >= page.totalPages}
                onClick={() => page.setCurrentPage(p => p + 1)}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 disabled:opacity-30 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <DetailModal log={page.selectedLog} open={!!page.selectedLog} onClose={() => page.setSelectedLog(null)} />
    </div>
  );
}

export default SystemLogs;
