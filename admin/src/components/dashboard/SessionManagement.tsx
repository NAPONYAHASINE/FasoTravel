/**
 * @file SessionManagement.tsx
 * @description Gestion des Sessions Utilisateurs — Admin FasoTravel
 * 
 * Architecture backend-ready (modèle BookingManagement) :
 * - TOUTE la logique métier dans useSessionManagement()
 * - ZÉRO logique métier ici — UI thin layer uniquement
 * - Design-system FasoTravel (PAGE_CLASSES, StatCard, COMPONENTS)
 * 
 * ACTIONS DISPONIBLES:
 * - Révoquer une session unique
 * - Révoquer toutes les sessions d'un utilisateur
 * - Sélection multiple + révocation en masse
 * - Révoquer toutes les sessions suspectes
 * - Bloquer une adresse IP (+ terminaison auto des sessions)
 * - Export CSV des sessions filtrées
 * - Voir détails complets d'une session (avec actions dans la modale)
 */

import {
  Monitor, Smartphone, Tablet, Search, Filter, XCircle, AlertTriangle,
  Eye, MapPin, ChevronLeft, ChevronRight, RefreshCw, Users, Shield,
  RotateCcw, Download, Ban, UserX, CheckSquare, Square, Minus,
  ShieldAlert, MoreHorizontal,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import {
  useSessionManagement,
  DEVICE_CONFIG, USER_TYPE_CONFIG,
  formatTimeAgo, formatFullDate,
  getConfirmConfig,
  type ConfirmAction,
} from '../../hooks/useSessionManagement';
import type { UserSession } from '../../shared/types/standardized';
import type { DeviceType } from '../../services/sessionService';
import { StatCard } from '../ui/stat-card';
import { PAGE_CLASSES } from '../../lib/design-system';
import { ConfirmWrapper } from '../modals/ConfirmWrapper';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { toast } from 'sonner@2.0.3';

// ============================================================================
// HELPERS UI
// ============================================================================

function DeviceIcon({ type, size = 16 }: { type: DeviceType; size?: number }) {
  switch (type) {
    case 'mobile': return <Smartphone size={size} />;
    case 'tablet': return <Tablet size={size} />;
    default: return <Monitor size={size} />;
  }
}

// ============================================================================
// DEVICE DISTRIBUTION BAR
// ============================================================================

function DeviceDistribution({ byDevice, total }: { byDevice: Record<DeviceType, number>; total: number }) {
  const devices: { type: DeviceType; color: string }[] = [
    { type: 'web', color: '#3b82f6' },
    { type: 'mobile', color: '#16a34a' },
    { type: 'tablet', color: '#f59e0b' },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700 transition-colors">
      <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-4">Distribution par Appareil</h3>
      <div className="flex gap-1 h-3 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 mb-4">
        {devices.map(({ type, color }) => {
          const pct = total > 0 ? (byDevice[type] / total) * 100 : 0;
          return pct > 0 ? (
            <div key={type} className="h-full transition-all duration-300" style={{ width: `${pct}%`, backgroundColor: color }} />
          ) : null;
        })}
      </div>
      <div className="grid grid-cols-3 gap-4">
        {devices.map(({ type, color }) => {
          const count = byDevice[type] || 0;
          const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
          return (
            <div key={type} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              <div>
                <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                  <DeviceIcon type={type} size={14} />
                  <span className="text-xs">{DEVICE_CONFIG[type].label}</span>
                </div>
                <div className="text-sm text-gray-900 dark:text-white">{count} <span className="text-xs text-gray-500">({pct}%)</span></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// ROW ACTIONS DROPDOWN
// ============================================================================

function RowActionsMenu({
  session,
  suspicious,
  onShowDetails,
  onRevoke,
  onRevokeByUser,
  onBlockIp,
}: {
  session: UserSession;
  suspicious: boolean;
  onShowDetails: () => void;
  onRevoke: () => void;
  onRevokeByUser: () => void;
  onBlockIp: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-1">
        <button
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
          onClick={onShowDetails}
          title="Détails"
        >
          <Eye size={18} />
        </button>
        {session.active && (
          <button
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            onClick={onRevoke}
            title="Révoquer"
          >
            <XCircle size={18} />
          </button>
        )}
        <button
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          onClick={() => setOpen(!open)}
          title="Plus d'actions"
        >
          <MoreHorizontal size={18} />
        </button>
      </div>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 py-1">
          <button
            className="w-full px-4 py-2.5 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2.5 transition-colors"
            onClick={() => { onShowDetails(); setOpen(false); }}
          >
            <Eye size={15} className="text-blue-500" />
            Voir les détails
          </button>
          {session.active && (
            <button
              className="w-full px-4 py-2.5 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2.5 transition-colors"
              onClick={() => { onRevoke(); setOpen(false); }}
            >
              <XCircle size={15} className="text-red-500" />
              Révoquer cette session
            </button>
          )}
          <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
          <button
            className="w-full px-4 py-2.5 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2.5 transition-colors"
            onClick={() => { onRevokeByUser(); setOpen(false); }}
          >
            <UserX size={15} className="text-orange-500" />
            Toutes les sessions de {session.userName || 'cet utilisateur'}
          </button>
          {session.ipAddress && (
            <button
              className="w-full px-4 py-2.5 text-sm text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2.5 transition-colors"
              onClick={() => { onBlockIp(); setOpen(false); }}
            >
              <Ban size={15} />
              Bloquer IP {session.ipAddress}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SESSION ROW
// ============================================================================

function SessionRow({
  session,
  suspicious,
  selected,
  onToggleSelect,
  onShowDetails,
  onRevoke,
  onRevokeByUser,
  onBlockIp,
}: {
  session: UserSession;
  suspicious: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  onShowDetails: () => void;
  onRevoke: () => void;
  onRevokeByUser: () => void;
  onBlockIp: () => void;
}) {
  const userTypeConf = USER_TYPE_CONFIG[session.userType];

  return (
    <tr className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${suspicious ? 'bg-yellow-50/60 dark:bg-yellow-900/10' : ''} ${selected ? 'bg-blue-50/60 dark:bg-blue-900/10' : ''}`}>
      {/* Checkbox */}
      <td className="px-4 py-4">
        {session.active ? (
          <button
            onClick={onToggleSelect}
            className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {selected
              ? <CheckSquare size={18} className="text-blue-600 dark:text-blue-400" />
              : <Square size={18} />
            }
          </button>
        ) : (
          <div className="w-[18px]" />
        )}
      </td>

      <td className="px-4 py-4">
        <div className="text-sm text-gray-900 dark:text-white">
          {session.userName || session.userId}
        </div>
        <div className="font-mono text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {session.userId}
        </div>
      </td>

      <td className="px-4 py-4"><span className={`px-2 py-1 rounded text-xs text-gray-900 dark:text-gray-100 ${userTypeConf.bgClass}`}>{userTypeConf.label}</span></td>

      <td className="px-4 py-4">
        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
          <DeviceIcon type={session.deviceType} />
          <div>
            <span className="text-sm">{DEVICE_CONFIG[session.deviceType].label}</span>
            {session.deviceInfo && (
              <div className="text-xs text-gray-500 dark:text-gray-400">{session.deviceInfo}</div>
            )}
          </div>
        </div>
      </td>

      <td className="px-4 py-4">
        <div className="font-mono text-sm text-gray-900 dark:text-white">{session.ipAddress || 'N/A'}</div>
        {session.location && (
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            <MapPin size={12} />
            <span>{session.location}</span>
          </div>
        )}
      </td>

      <td className="px-4 py-4">
        <div className="text-sm text-gray-600 dark:text-gray-300">
          {formatTimeAgo(session.lastActivityAt)}
        </div>
      </td>

      <td className="px-4 py-4">
        <div className="flex flex-col gap-1">
          {session.active ? (
            <span className="px-3 py-1 rounded-full text-xs bg-green-200 dark:bg-green-900/30 text-green-900 dark:text-green-400 inline-block w-fit border border-green-400 dark:border-green-700">
              Active
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 inline-block w-fit">
              Inactive
            </span>
          )}
          {suspicious && (
            <span className="px-2 py-1 rounded-full text-xs bg-yellow-200 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-400 inline-flex items-center gap-1 w-fit border border-yellow-400 dark:border-yellow-700">
              <AlertTriangle size={12} />
              Suspecte
            </span>
          )}
        </div>
      </td>

      <td className="px-4 py-4">
        <div className="flex justify-end">
          <RowActionsMenu
            session={session}
            suspicious={suspicious}
            onShowDetails={onShowDetails}
            onRevoke={onRevoke}
            onRevokeByUser={onRevokeByUser}
            onBlockIp={onBlockIp}
          />
        </div>
      </td>
    </tr>
  );
}

// ============================================================================
// BULK ACTION BAR
// ============================================================================

function BulkActionBar({
  count,
  onTerminateBulk,
  onClearSelection,
}: {
  count: number;
  onTerminateBulk: () => void;
  onClearSelection: () => void;
}) {
  if (count === 0) return null;

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <CheckSquare size={18} className="text-blue-600 dark:text-blue-400" />
        <span className="text-sm text-blue-800 dark:text-blue-300">
          <span className="tabular-nums">{count}</span> session(s) active(s) sélectionnée(s)
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onTerminateBulk}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
        >
          <XCircle size={15} />
          Révoquer la sélection
        </button>
        <button
          onClick={onClearSelection}
          className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// DETAILS MODAL (enrichie avec actions)
// ============================================================================

function SessionDetailsModal({
  session,
  open,
  onOpenChange,
  isSuspicious,
  onRevoke,
  onRevokeByUser,
  onBlockIp,
}: {
  session: UserSession | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSuspicious: boolean;
  onRevoke: (action: ConfirmAction) => void;
  onRevokeByUser: (action: ConfirmAction) => void;
  onBlockIp: (action: ConfirmAction) => void;
}) {
  if (!session) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            Détails de la Session
            {isSuspicious && (
              <span className="px-2 py-1 rounded-full text-xs bg-yellow-200 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-400 inline-flex items-center gap-1 border border-yellow-400 dark:border-yellow-700">
                <AlertTriangle size={12} />
                Suspecte
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-5">
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <DeviceIcon type={session.deviceType} />
            <span className="text-sm">{DEVICE_CONFIG[session.deviceType].label}</span>
            {session.deviceInfo && <span className="text-xs text-gray-500">({session.deviceInfo})</span>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Utilisateur</div>
              <div className="text-gray-900 dark:text-white">{session.userName || session.userId}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Type</div>
              <div className="text-gray-900 dark:text-white">
                <span className={`px-2 py-1 rounded text-xs ${USER_TYPE_CONFIG[session.userType].bgClass}`}>
                  {USER_TYPE_CONFIG[session.userType].label}
                </span>
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Adresse IP</div>
              <div className="font-mono text-gray-900 dark:text-white">{session.ipAddress || 'N/A'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Localisation</div>
              <div className="text-gray-900 dark:text-white">{session.location || 'Inconnue'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Connexion</div>
              <div className="text-gray-900 dark:text-white">{formatFullDate(session.loginAt)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Dernière activité</div>
              <div className="text-gray-900 dark:text-white">{formatTimeAgo(session.lastActivityAt)}</div>
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Statut</div>
            {session.active ? (
              <span className="px-3 py-1 rounded-full text-xs bg-green-200 dark:bg-green-900/30 text-green-900 dark:text-green-400 border border-green-400 dark:border-green-700">
                Active
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                Inactive {session.logoutAt && `(déconnexion ${formatFullDate(session.logoutAt)})`}
              </span>
            )}
          </div>

          {/* Actions dans la modale */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">Actions rapides</div>
            <div className="flex flex-wrap gap-2">
              {session.active && (
                <button
                  onClick={() => { onRevoke({ type: 'revoke', sessionId: session.id }); onOpenChange(false); }}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-800 transition-colors"
                >
                  <XCircle size={15} />
                  Révoquer cette session
                </button>
              )}
              <button
                onClick={() => { onRevokeByUser({ type: 'revokeByUser', userId: session.userId, userName: session.userName || session.userId }); onOpenChange(false); }}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded-lg border border-orange-200 dark:border-orange-800 transition-colors"
              >
                <UserX size={15} />
                Toutes les sessions de {session.userName || 'cet utilisateur'}
              </button>
              {session.ipAddress && (
                <button
                  onClick={() => { onBlockIp({ type: 'blockIp', ip: session.ipAddress! }); onOpenChange(false); }}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-800 transition-colors"
                >
                  <Ban size={15} />
                  Bloquer IP {session.ipAddress}
                </button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SessionManagement() {
  const page = useSessionManagement();

  const handleConfirm = async () => {
    const result = await page.executeConfirmAction();
    if (result.success) {
      const config = getConfirmConfig(page.confirmAction);
      toast.success(`${config.title} — ${result.count || 0} session(s) terminée(s)`);
    } else {
      toast.error('Erreur lors de l\'exécution de l\'action');
    }
    page.setConfirmAction(null);
  };

  const confirmConfig = getConfirmConfig(page.confirmAction);

  return (
    <div className={PAGE_CLASSES.container}>
      <div className={PAGE_CLASSES.content}>
        {/* Header */}
        <div className={PAGE_CLASSES.header}>
          <div className={PAGE_CLASSES.headerContent}>
            <div className={PAGE_CLASSES.headerTexts}>
              <h2 className="text-3xl text-gray-900 dark:text-white mb-2">Gestion des Sessions</h2>
              <p className="text-gray-600 dark:text-gray-400">Surveillez et gérez les sessions utilisateurs actives</p>
            </div>
            <div className={PAGE_CLASSES.headerActions}>
              {page.stats.suspicious > 0 && (
                <button
                  onClick={() => page.setConfirmAction({ type: 'revokeSuspicious' })}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
                >
                  <ShieldAlert size={16} />
                  Révoquer suspectes ({page.stats.suspicious})
                </button>
              )}
              <button
                onClick={page.exportSessions}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Download size={16} />
                Export CSV
              </button>
              <button
                onClick={page.refreshSessions}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <RefreshCw size={16} />
                Rafraîchir
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className={PAGE_CLASSES.statsGrid}>
          <StatCard
            title="Total Sessions"
            value={page.stats.total.toLocaleString()}
            icon={Monitor}
            color="blue"
          />
          <StatCard
            title="Sessions Actives"
            value={page.stats.active.toLocaleString()}
            subtitle="En ligne maintenant"
            icon={Users}
            color="green"
          />
          <StatCard
            title="Inactives"
            value={page.stats.inactive.toLocaleString()}
            icon={XCircle}
            color="red"
          />
          <StatCard
            title="Suspectes"
            value={page.stats.suspicious.toLocaleString()}
            subtitle="IPs multiples"
            icon={AlertTriangle}
            color="yellow"
          />
        </div>

        {/* Device Distribution */}
        <div className="mb-6">
          <DeviceDistribution byDevice={page.stats.byDevice} total={page.stats.total} />
        </div>

        {/* Bulk Action Bar */}
        <BulkActionBar
          count={page.selectedActiveCount}
          onTerminateBulk={() => page.setConfirmAction({ type: 'revokeBulk', ids: Array.from(page.selectedIds) })}
          onClearSelection={page.clearSelection}
        />

        {/* Filtres */}
        <div className={PAGE_CLASSES.searchSection}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Rechercher par nom, user ID, IP, localisation..."
                  value={page.searchTerm}
                  onChange={(e) => { page.setSearchTerm(e.target.value); page.setCurrentPage(1); }}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
              </div>
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <select
                value={page.deviceFilter}
                onChange={(e) => { page.setDeviceFilter(e.target.value as any); page.setCurrentPage(1); }}
                className="pl-10 pr-8 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none"
              >
                <option value="all">Tous appareils</option>
                <option value="web">Web</option>
                <option value="mobile">Mobile</option>
                <option value="tablet">Tablette</option>
              </select>
            </div>

            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <select
                value={page.userTypeFilter}
                onChange={(e) => { page.setUserTypeFilter(e.target.value as any); page.setCurrentPage(1); }}
                className="pl-10 pr-8 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none"
              >
                <option value="all">Tous types</option>
                <option value="admin">Admin</option>
                <option value="operator">Opérateur</option>
                <option value="passenger">Passager</option>
              </select>
            </div>

            <div className="relative">
              <select
                value={page.statusFilter}
                onChange={(e) => { page.setStatusFilter(e.target.value as any); page.setCurrentPage(1); }}
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none"
              >
                <option value="all">Tous statuts</option>
                <option value="active">Actives</option>
                <option value="inactive">Inactives</option>
              </select>
            </div>

            {page.hasActiveFilters && (
              <button
                onClick={page.resetFilters}
                className="inline-flex items-center gap-1.5 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <RotateCcw size={16} />
                Réinitialiser
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className={PAGE_CLASSES.tableContainer}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-4 text-left w-12">
                    <button
                      onClick={page.toggleSelectAll}
                      className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      title="Sélectionner tout"
                    >
                      {page.isAllPageSelected
                        ? <CheckSquare size={18} className="text-blue-600 dark:text-blue-400" />
                        : page.selectedIds.size > 0
                          ? <Minus size={18} className="text-blue-500" />
                          : <Square size={18} />
                      }
                    </button>
                  </th>
                  <th className="px-4 py-4 text-left text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider">Utilisateur</th>
                  <th className="px-4 py-4 text-left text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-4 text-left text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider">Appareil</th>
                  <th className="px-4 py-4 text-left text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider">IP / Localisation</th>
                  <th className="px-4 py-4 text-left text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider">Dernière Activité</th>
                  <th className="px-4 py-4 text-left text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider">Statut</th>
                  <th className="px-4 py-4 text-right text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {page.paginatedSessions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      Aucune session trouvée
                    </td>
                  </tr>
                ) : (
                  page.paginatedSessions.map((session) => (
                    <SessionRow
                      key={session.id}
                      session={session}
                      suspicious={page.isSuspicious(session)}
                      selected={page.selectedIds.has(session.id)}
                      onToggleSelect={() => page.toggleSelect(session.id)}
                      onShowDetails={() => page.handleShowDetails(session)}
                      onRevoke={() => page.setConfirmAction({ type: 'revoke', sessionId: session.id })}
                      onRevokeByUser={() => page.setConfirmAction({ type: 'revokeByUser', userId: session.userId, userName: session.userName || session.userId })}
                      onBlockIp={() => session.ipAddress && page.setConfirmAction({ type: 'blockIp', ip: session.ipAddress })}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer: count + pagination */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {page.sessions.length > 0
                ? `${(page.currentPage - 1) * page.pageSize + 1}–${Math.min(page.currentPage * page.pageSize, page.sessions.length)} sur ${page.sessions.length} sessions`
                : 'Aucune session'}
            </p>

            {page.totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => page.setCurrentPage(Math.max(1, page.currentPage - 1))}
                  disabled={page.currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {page.currentPage} / {page.totalPages}
                </span>
                <button
                  onClick={() => page.setCurrentPage(Math.min(page.totalPages, page.currentPage + 1))}
                  disabled={page.currentPage === page.totalPages}
                  className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Details Modal */}
        <SessionDetailsModal
          session={page.selectedSession}
          open={page.showDetailsModal}
          onOpenChange={page.setShowDetailsModal}
          isSuspicious={page.selectedSession ? page.isSuspicious(page.selectedSession) : false}
          onRevoke={(a) => page.setConfirmAction(a)}
          onRevokeByUser={(a) => page.setConfirmAction(a)}
          onBlockIp={(a) => page.setConfirmAction(a)}
        />

        {/* Confirm Dialog (unique, piloté par confirmAction) */}
        <ConfirmWrapper
          isOpen={page.confirmAction !== null}
          onClose={() => page.setConfirmAction(null)}
          onConfirm={handleConfirm}
          title={confirmConfig.title}
          message={confirmConfig.message}
          type={confirmConfig.confirmType}
        />
      </div>
    </div>
  );
}

export default SessionManagement;