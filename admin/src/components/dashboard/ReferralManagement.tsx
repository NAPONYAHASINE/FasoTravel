/**
 * ReferralManagement - Système de Parrainage Admin
 * 
 * Tabs:
 * 1. Vue d'ensemble - Stats globales, top parrains, distribution badges
 * 2. Parrainages - Liste auto-validée, clic parrain → arbre filleuls
 * 3. Coupons - Suivi automatique (actif/utilisé/expiré)
 * 
 * Features:
 * - Toggle On/Off du système de parrainage (situation financière)
 * - Arbre de filleuls par parrain (dialog)
 * - Coupons automatiques (pas de validation manuelle)
 * - Coût total coupons visible dans stats
 * 
 * Backend-ready: AppConfig.isMock toggle
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  Users,
  Award,
  Ticket,
  CheckCircle2,
  Clock,
  Download,
  BarChart3,
  Power,
  Eye,
  X,
  Wallet,
  Ban,
  XCircle,
} from 'lucide-react';
import { StatCard } from '../ui/stat-card';
import { PAGE_CLASSES } from '../../lib/design-system';
import { exportToCSV } from '../../lib/utils';
import { toast } from 'sonner@2.0.3';
import { referralsService } from '../../services/entitiesService';
import type { Referral, ReferralCoupon, ReferralStats, ReferralBadgeLevel } from '../../shared/types/standardized';
import { POINTS_PER_REFERRAL } from '../../shared/types/standardized';

type TabKey = 'overview' | 'referrals' | 'coupons';
type CouponStatusFilter = 'all' | 'active' | 'used' | 'expired' | 'cancelled';

const BADGE_CONFIG: Record<ReferralBadgeLevel, { label: string; color: string; bg: string; emoji: string }> = {
  standard: { label: 'Standard', color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-700', emoji: '🌱' },
  ambassadeur: { label: 'Ambassadeur', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30', emoji: '⭐' },
  super_ambassadeur: { label: 'Super Amb.', color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30', emoji: '🏆' },
  legende: { label: 'Légende', color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30', emoji: '👑' },
};

const COUPON_STATUS_BADGE: Record<ReferralCoupon['status'], { label: string; icon: typeof CheckCircle2 | null; classes: string }> = {
  active: { label: 'Actif', icon: CheckCircle2, classes: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' },
  used: { label: 'Utilisé', icon: null, classes: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400' },
  expired: { label: 'Expiré', icon: Clock, classes: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
  cancelled: { label: 'Annulé', icon: XCircle, classes: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' },
};

function ReferralManagement() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [coupons, setCoupons] = useState<ReferralCoupon[]>([]);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [referralSearch, setReferralSearch] = useState('');
  const [couponSearch, setCouponSearch] = useState('');
  const [couponStatusFilter, setCouponStatusFilter] = useState<CouponStatusFilter>('all');

  // Referrer tree dialog
  const [treeDialogOpen, setTreeDialogOpen] = useState(false);
  const [treeReferrer, setTreeReferrer] = useState<{ userId: string; name: string; code: string } | null>(null);
  const [treeFilleuls, setTreeFilleuls] = useState<Referral[]>([]);
  const [treeLoading, setTreeLoading] = useState(false);

  // Toggle config dialog
  const [toggleDialogOpen, setToggleDialogOpen] = useState(false);
  const [disableReason, setDisableReason] = useState('');

  // Cancel coupon dialog
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelCouponTarget, setCancelCouponTarget] = useState<ReferralCoupon | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [refRes, couponRes, statsRes] = await Promise.all([
        referralsService.getAll(),
        referralsService.getCoupons(),
        referralsService.getStats(),
      ]);
      if (refRes.success && refRes.data) setReferrals(refRes.data);
      if (couponRes.success && couponRes.data) setCoupons(couponRes.data);
      if (statsRes.success && statsRes.data) setStats(statsRes.data);
    } catch {
      toast.error('Erreur lors du chargement des données de parrainage');
    } finally {
      setLoading(false);
    }
  };

  // === REFERRER TREE ===
  const openReferrerTree = useCallback(async (userId: string, name: string, code: string) => {
    setTreeReferrer({ userId, name, code });
    setTreeDialogOpen(true);
    setTreeLoading(true);
    try {
      const res = await referralsService.getUserReferrals(userId);
      if (res.success && res.data) {
        setTreeFilleuls(res.data);
      }
    } catch {
      toast.error('Erreur lors du chargement des filleuls');
    } finally {
      setTreeLoading(false);
    }
  }, []);

  // === TOGGLE CONFIG ===
  const handleToggleConfig = async () => {
    if (!stats) return;
    const newEnabled = !stats.config.enabled;
    try {
      const res = await referralsService.toggleConfig(newEnabled, newEnabled ? undefined : disableReason || undefined);
      if (res.success) {
        setStats(prev => prev ? { ...prev, config: { ...prev.config, enabled: newEnabled, disabledReason: newEnabled ? undefined : disableReason || undefined, updatedAt: new Date().toISOString() } } : prev);
        toast.success(newEnabled ? 'Système de parrainage activé' : 'Système de parrainage désactivé');
        setToggleDialogOpen(false);
        setDisableReason('');
      }
    } catch {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  // === CANCEL COUPON ===
  const openCancelDialog = (coupon: ReferralCoupon) => {
    setCancelCouponTarget(coupon);
    setCancelReason('');
    setCancelDialogOpen(true);
  };

  const handleCancelCoupon = async () => {
    if (!cancelCouponTarget || !cancelReason.trim()) return;
    setCancelLoading(true);
    try {
      const res = await referralsService.cancelCoupon(cancelCouponTarget.id, cancelReason.trim());
      if (res.success) {
        setCoupons(prev => prev.map(c => c.id === cancelCouponTarget.id ? { ...c, status: 'cancelled' as const, cancelledAt: new Date().toISOString(), cancelReason: cancelReason.trim() } : c));
        toast.success(`Coupon ${cancelCouponTarget.code} annulé`);
        setCancelDialogOpen(false);
        setCancelCouponTarget(null);
        setCancelReason('');
      } else {
        toast.error(res.error || 'Erreur lors de l\'annulation');
      }
    } catch {
      toast.error('Erreur lors de l\'annulation du coupon');
    } finally {
      setCancelLoading(false);
    }
  };

  // Filtered data
  const filteredReferrals = useMemo(() => {
    return referrals.filter(r => {
      return !referralSearch ||
        r.referrerName.toLowerCase().includes(referralSearch.toLowerCase()) ||
        r.referredName.toLowerCase().includes(referralSearch.toLowerCase()) ||
        r.referrerCode.toLowerCase().includes(referralSearch.toLowerCase());
    });
  }, [referrals, referralSearch]);

  const filteredCoupons = useMemo(() => {
    return coupons.filter(c => {
      const matchSearch = !couponSearch ||
        c.userName.toLowerCase().includes(couponSearch.toLowerCase()) ||
        c.code.toLowerCase().includes(couponSearch.toLowerCase());
      const matchStatus = couponStatusFilter === 'all' || c.status === couponStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [coupons, couponSearch, couponStatusFilter]);

  // Group referrals by referrer for tree view
  const referrerMap = useMemo(() => {
    const map = new Map<string, { name: string; code: string; filleuls: Referral[] }>();
    referrals.forEach(r => {
      const existing = map.get(r.referrerUserId);
      if (existing) {
        existing.filleuls.push(r);
      } else {
        map.set(r.referrerUserId, { name: r.referrerName, code: r.referrerCode, filleuls: [r] });
      }
    });
    return map;
  }, [referrals]);

  const handleExportReferrals = () => {
    exportToCSV(referrals.map(r => ({
      ID: r.id,
      Parrain: r.referrerName,
      Code: r.referrerCode,
      Filleul: r.referredName,
      Points: r.pointsAwarded,
      Statut: r.status,
      Date: r.createdAt,
    })), 'parrainages');
    toast.success('Export CSV téléchargé');
  };

  const handleExportCoupons = () => {
    exportToCSV(coupons.map(c => ({
      ID: c.id,
      Utilisateur: c.userName,
      Code: c.code,
      Montant: `${c.amount} FCFA`,
      Points: c.pointsCost,
      Statut: c.status,
      Créé: c.createdAt,
      Expire: c.expiresAt,
    })), 'coupons-parrainage');
    toast.success('Export CSV téléchargé');
  };

  const tabs: { key: TabKey; label: string; icon: typeof BarChart3 }[] = [
    { key: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
    { key: 'referrals', label: 'Parrainages', icon: Users },
    { key: 'coupons', label: 'Coupons', icon: Ticket },
  ];

  if (loading) {
    return (
      <div className={PAGE_CLASSES.container}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-red-600" />
        </div>
      </div>
    );
  }

  return (
    <div className={PAGE_CLASSES.container}>
      <div className={PAGE_CLASSES.content}>
        {/* Header */}
        <div className={PAGE_CLASSES.header}>
          <div className={PAGE_CLASSES.headerContent}>
            <div className={PAGE_CLASSES.headerTexts}>
              <h1 className="text-3xl text-gray-900 dark:text-white mb-2">Système de Parrainage</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Suivi des parrainages, coupons et gestion du système
              </p>
            </div>
            <div className={PAGE_CLASSES.headerActions}>
              {/* On/Off Toggle */}
              {stats && (
                <button
                  onClick={() => {
                    if (stats.config.enabled) {
                      setToggleDialogOpen(true);
                    } else {
                      handleToggleConfig();
                    }
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                    stats.config.enabled
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
                      : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
                  }`}
                  title={stats.config.enabled ? 'Désactiver le parrainage' : 'Activer le parrainage'}
                >
                  <Power className="w-4 h-4" />
                  {stats.config.enabled ? 'Actif' : 'Désactivé'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Disabled banner */}
        {stats && !stats.config.enabled && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
            <Power className="w-5 h-5 text-red-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-700 dark:text-red-400">Système de parrainage désactivé</p>
              {stats.config.disabledReason && (
                <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">Raison : {stats.config.disabledReason}</p>
              )}
            </div>
            <button
              onClick={handleToggleConfig}
              className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
            >
              Réactiver
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-6 w-fit">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${isActive
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* =================== VUE D'ENSEMBLE =================== */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className={PAGE_CLASSES.statsGrid}>
              <StatCard
                title="Total Parrainages"
                value={stats.totalReferrals}
                icon={Users}
                trend={{ value: POINTS_PER_REFERRAL, label: 'pts/parrainage' }}
                color="green"
              />
              <StatCard
                title="Points Distribués"
                value={stats.totalPointsDistributed}
                icon={Award}
                trend={{ value: stats.activeReferrers, label: 'parrains actifs' }}
                color="blue"
              />
              <StatCard
                title="Coupons Générés"
                value={stats.totalCouponsGenerated}
                icon={Ticket}
                trend={{ value: stats.totalCouponsUsed, label: 'utilisés' }}
                color="purple"
              />
              <StatCard
                title="Coût Total Coupons"
                value={`${stats.totalCouponsCost.toLocaleString('fr-FR')} FCFA`}
                icon={Wallet}
                trend={{ value: stats.totalCouponsUsed, label: 'utilisés' }}
                color="red"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Badge Distribution */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Distribution des badges
                </h3>
                <div className="space-y-4">
                  {(Object.entries(stats.badgeDistribution) as [ReferralBadgeLevel, number][]).map(([level, count]) => {
                    const config = BADGE_CONFIG[level];
                    const total = Object.values(stats.badgeDistribution).reduce((a, b) => a + b, 0);
                    const pct = total > 0 ? (count / total) * 100 : 0;
                    return (
                      <div key={level} className="flex items-center gap-3">
                        <span className="text-xl">{config.emoji}</span>
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">{count} ({pct.toFixed(0)}%)</span>
                          </div>
                          <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${config.bg.replace('dark:bg-', 'bg-').split(' ')[0]} ${config.bg}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top Referrers — clickable to see tree */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Top Parrains
                </h3>
                <div className="space-y-3">
                  {stats.topReferrers.map((referrer, idx) => {
                    const config = BADGE_CONFIG[referrer.badge];
                    return (
                      <button
                        key={referrer.userId}
                        onClick={() => openReferrerTree(referrer.userId, referrer.name, referrerMap.get(referrer.userId)?.code || '')}
                        className="w-full flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          idx === 0 ? 'bg-amber-100 text-amber-700' :
                          idx === 1 ? 'bg-gray-200 text-gray-600' :
                          idx === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{referrer.name}</p>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs ${config.color}`}>{config.emoji} {config.label}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-green-600">{referrer.referrals}</p>
                          <p className="text-xs text-gray-400">filleuls</p>
                        </div>
                        <Eye className="w-4 h-4 text-gray-400" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>


          </div>
        )}

        {/* =================== PARRAINAGES LIST =================== */}
        {activeTab === 'referrals' && (
          <div className="space-y-4">
            {/* Search */}
            <div className={PAGE_CLASSES.searchSection}>
              <div className="flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 min-w-[250px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={referralSearch}
                    onChange={e => setReferralSearch(e.target.value)}
                    placeholder="Rechercher par nom ou code..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={handleExportReferrals}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              </div>
            </div>

            {/* Table */}
            <div className={PAGE_CLASSES.tableContainer}>
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700/50">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Parrain</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Code</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Filleul</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Points</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Statut</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredReferrals.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-400">
                        Aucun parrainage trouvé
                      </td>
                    </tr>
                  ) : (
                    filteredReferrals.map(ref => (
                      <tr key={ref.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{ref.referrerName}</p>
                        </td>
                        <td className="px-6 py-4">
                          <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded font-mono text-green-700 dark:text-green-400">
                            {ref.referrerCode}
                          </code>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-700 dark:text-gray-300">{ref.referredName}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-green-600">+{ref.pointsAwarded}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Auto-validé
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(ref.createdAt).toLocaleDateString('fr-FR')}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => openReferrerTree(ref.referrerUserId, ref.referrerName, ref.referrerCode)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Voir les filleuls de ce parrain"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Filleuls
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =================== COUPONS LIST =================== */}
        {activeTab === 'coupons' && (
          <div className="space-y-4">
            {/* Search & Filter */}
            <div className={PAGE_CLASSES.searchSection}>
              <div className="flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 min-w-[250px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={couponSearch}
                    onChange={e => setCouponSearch(e.target.value)}
                    placeholder="Rechercher par nom ou code coupon..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={couponStatusFilter}
                  onChange={e => setCouponStatusFilter(e.target.value as CouponStatusFilter)}
                  className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="active">Actif</option>
                  <option value="used">Utilisé</option>
                  <option value="expired">Expiré</option>
                  <option value="cancelled">Annulé</option>
                </select>
                <button
                  onClick={handleExportCoupons}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              </div>
            </div>

            {/* Table */}
            <div className={PAGE_CLASSES.tableContainer}>
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700/50">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Utilisateur</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Code</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Montant</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Points</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Statut</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Créé le</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredCoupons.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-400">
                        Aucun coupon trouvé
                      </td>
                    </tr>
                  ) : (
                    filteredCoupons.map(coupon => {
                      const statusConfig = COUPON_STATUS_BADGE[coupon.status];
                      const StatusIcon = statusConfig.icon;
                      return (
                        <tr key={coupon.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{coupon.userName}</p>
                          </td>
                          <td className="px-6 py-4">
                            <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded font-mono">
                              {coupon.code}
                            </code>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {coupon.amount.toLocaleString('fr-FR')} FCFA
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-500">{coupon.pointsCost} pts</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.classes}`}>
                              {StatusIcon && <StatusIcon className="w-3.5 h-3.5" />}
                              {statusConfig.label}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(coupon.createdAt).toLocaleDateString('fr-FR')}
                            </p>
                            <p className="text-xs text-gray-400">
                              Exp: {new Date(coupon.expiresAt).toLocaleDateString('fr-FR')}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {coupon.status === 'active' ? (
                              <button
                                onClick={() => openCancelDialog(coupon)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                              >
                                <Ban className="w-3.5 h-3.5" />
                                Annuler
                              </button>
                            ) : coupon.status === 'cancelled' && coupon.cancelReason ? (
                              <span className="text-xs text-gray-400 italic" title={coupon.cancelReason}>
                                {coupon.cancelReason.length > 30 ? coupon.cancelReason.slice(0, 30) + '...' : coupon.cancelReason}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* =================== REFERRER TREE DIALOG =================== */}
      {treeDialogOpen && treeReferrer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setTreeDialogOpen(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Arbre de filleuls
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {treeReferrer.name} {treeReferrer.code && `(${treeReferrer.code})`}
                </p>
              </div>
              <button
                onClick={() => setTreeDialogOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {treeLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-600" />
                </div>
              ) : treeFilleuls.length === 0 ? (
                <p className="text-center text-gray-400 py-12">Aucun filleul trouvé</p>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {treeFilleuls.length} filleul{treeFilleuls.length > 1 ? 's' : ''} parrainé{treeFilleuls.length > 1 ? 's' : ''}
                  </p>
                  {treeFilleuls.map((ref, idx) => (
                    <div key={ref.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-sm font-bold text-green-700 dark:text-green-400">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{ref.referredName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(ref.createdAt).toLocaleDateString('fr-FR')} • +{ref.pointsAwarded} pts
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                        <CheckCircle2 className="w-3 h-3" /> Validé
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =================== TOGGLE DISABLE DIALOG =================== */}
      {toggleDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setToggleDialogOpen(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Désactiver le système de parrainage
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Les nouveaux parrainages ne seront plus enregistrés. Les coupons existants restent valides.
              </p>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Raison (optionnelle)
              </label>
              <textarea
                value={disableReason}
                onChange={e => setDisableReason(e.target.value)}
                placeholder="Ex: Situation financière tendue, pause temporaire..."
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => { setToggleDialogOpen(false); setDisableReason(''); }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleToggleConfig}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Désactiver
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================== CANCEL COUPON DIALOG =================== */}
      {cancelDialogOpen && cancelCouponTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => { setCancelDialogOpen(false); setCancelCouponTarget(null); setCancelReason(''); }}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <Ban className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Annuler le coupon
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Cette action est irréversible
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Code</span>
                  <span className="font-mono font-semibold text-gray-900 dark:text-white">{cancelCouponTarget.code}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Montant</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{cancelCouponTarget.amount} FCFA</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Utilisateur</span>
                  <span className="text-gray-900 dark:text-white">{cancelCouponTarget.userName || cancelCouponTarget.userId}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Raison de l'annulation <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  placeholder="Ex: Fraude détectée, demande de l'utilisateur..."
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-gray-400 mt-1">{cancelReason.length}/500</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => { setCancelDialogOpen(false); setCancelCouponTarget(null); setCancelReason(''); }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                disabled={cancelLoading}
              >
                Fermer
              </button>
              <button
                onClick={handleCancelCoupon}
                disabled={cancelLoading || !cancelReason.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {cancelLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Annulation...
                  </>
                ) : (
                  <>
                    <Ban className="w-4 h-4" />
                    Confirmer l'annulation
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReferralManagement;
