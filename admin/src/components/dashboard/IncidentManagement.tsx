/**
 * IncidentManagement - Gestion des incidents
 * 
 * BACKEND-READY (modèle BookingManagement)
 * - Données: useIncidents() → incidentsService.getAll() → MOCK_INCIDENTS
 * - Actions: useIncidentActions() → updateStatus / resolve / updateSeverity
 * - Incidents signalés par PASSAGERS ou SOCIÉTÉS, liés à un TRAJET
 */

import { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  Eye,
  Loader2,
  ArrowUpCircle,
  MapPin,
  User,
  Zap,
  Search,
  Filter,
  Download,
  PlayCircle,
  Shield,
  RefreshCw,
  ChevronDown,
  AlertCircle,
  Calendar,
  Hash,
  FileText,
  Activity,
  Building2,
  Bus,
  Phone,
  Users,
  Bell,
  Send,
  Smartphone,
  MessageSquare,
} from 'lucide-react';
import { useIncidents, useIncidentActions } from '../../hooks/useEntities';
import { useAdminApp } from '../../context/AdminAppContext';
import { getRelativeTime, exportToCSV } from '../../lib/utils';
import { STATUS_LABELS } from '../../lib/constants';
import { StatCard } from '../ui/stat-card';
import { PAGE_CLASSES, COMPONENTS } from '../../lib/design-system';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { toast } from 'sonner@2.0.3';
import type { Incident } from '../../shared/types/standardized';

// ==================== CONFIG ====================

type FilterStatus = 'all' | 'open' | 'in-progress' | 'resolved';
type FilterType = 'all' | 'mechanical' | 'delay' | 'cancellation' | 'accident' | 'other';
type FilterSeverity = 'all' | 'low' | 'medium' | 'high' | 'critical';
type FilterReporter = 'all' | 'passenger' | 'company';

const SEVERITY_LABELS: Record<string, string> = {
  low: 'Faible',
  medium: 'Moyen',
  high: 'Élevé',
  critical: 'Critique',
};

const SEVERITY_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  critical: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', border: 'border-red-300 dark:border-red-700', dot: 'bg-red-500' },
  high: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-300 dark:border-orange-700', dot: 'bg-orange-500' },
  medium: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-300 dark:border-blue-700', dot: 'bg-blue-500' },
  low: { bg: 'bg-gray-100 dark:bg-gray-700/50', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-300 dark:border-gray-600', dot: 'bg-gray-400' },
};

const STATUS_BADGE: Record<string, string> = {
  open: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700',
  'in-progress': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700',
  resolved: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700',
};

const TYPE_CONFIG: Record<string, { icon: string; label: string }> = {
  mechanical: { icon: '🔧', label: 'Panne' },
  delay: { icon: '⏰', label: 'Retard' },
  cancellation: { icon: '❌', label: 'Annulation' },
  accident: { icon: '🚨', label: 'Accident' },
  other: { icon: '📌', label: 'Autre' },
};

const REPORTER_BADGE: Record<string, { label: string; classes: string; icon: typeof User }> = {
  passenger: { label: 'Passager', classes: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700', icon: User },
  company: { label: 'Société', classes: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700', icon: Building2 },
};

export function IncidentManagement() {
  const { data: incidents, refresh: refreshIncidents } = useIncidents();
  const incidentActions = useIncidentActions();
  const { currentUser } = useAdminApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterSeverity, setFilterSeverity] = useState<FilterSeverity>('all');
  const [filterReporter, setFilterReporter] = useState<FilterReporter>('all');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Notification modal state
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyIncident, setNotifyIncident] = useState<Incident | null>(null);
  const [notifyType, setNotifyType] = useState<'delay' | 'cancellation' | 'info' | 'update' | 'resolution'>('info');
  const [notifyMessage, setNotifyMessage] = useState('');
  const [notifyChannels, setNotifyChannels] = useState<{ push: boolean; sms: boolean }>({ push: true, sms: false });
  const [notifySending, setNotifySending] = useState(false);

  // ==================== STATS ====================
  const stats = useMemo(() => {
    const open = incidents.filter(i => i.status === 'open').length;
    const inProgress = incidents.filter(i => i.status === 'in-progress').length;
    const resolved = incidents.filter(i => i.status === 'resolved').length;
    const critical = incidents.filter(i => i.severity === 'critical').length;
    const high = incidents.filter(i => i.severity === 'high').length;
    const byPassenger = incidents.filter(i => i.reporterType === 'passenger').length;
    const byCompany = incidents.filter(i => i.reporterType === 'company').length;
    const totalAffected = incidents
      .filter(i => i.status !== 'resolved')
      .reduce((sum, i) => sum + (i.passengersAffected || 0), 0);
    return { open, inProgress, resolved, critical, high, byPassenger, byCompany, totalAffected, total: incidents.length };
  }, [incidents]);

  // ==================== FILTER + SORT ====================
  const filteredIncidents = useMemo(() => {
    let result = [...incidents];

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(i =>
        i.title.toLowerCase().includes(lower) ||
        i.description.toLowerCase().includes(lower) ||
        i.id.toLowerCase().includes(lower) ||
        i.reportedByName?.toLowerCase().includes(lower) ||
        i.gareName?.toLowerCase().includes(lower) ||
        i.companyName?.toLowerCase().includes(lower) ||
        i.tripRoute?.toLowerCase().includes(lower)
      );
    }

    if (filterStatus !== 'all') result = result.filter(i => i.status === filterStatus);
    if (filterType !== 'all') result = result.filter(i => i.type === filterType);
    if (filterSeverity !== 'all') result = result.filter(i => i.severity === filterSeverity);
    if (filterReporter !== 'all') result = result.filter(i => i.reporterType === filterReporter);

    return result.sort((a, b) => {
      const activeA = a.status !== 'resolved' ? 1 : 0;
      const activeB = b.status !== 'resolved' ? 1 : 0;
      if (activeA !== activeB) return activeB - activeA;
      const sevOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
      const sevDiff = (sevOrder[b.severity] || 0) - (sevOrder[a.severity] || 0);
      if (sevDiff !== 0) return sevDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [incidents, searchTerm, filterStatus, filterType, filterSeverity, filterReporter]);

  const activeCount = filteredIncidents.filter(i => i.status !== 'resolved').length;

  const currentSelected = useMemo(() => {
    if (!selectedIncident) return null;
    return incidents.find(i => i.id === selectedIncident.id) || null;
  }, [selectedIncident, incidents]);

  // ==================== ACTIONS ====================
  const runAction = async (actionName: string, actionFn: () => Promise<any>, successMsg: string, errorMsg: string) => {
    setActionLoading(actionName);
    try {
      const res = await actionFn();
      if (res?.success) {
        toast.success(successMsg);
        await refreshIncidents();
      } else {
        toast.error(errorMsg);
      }
    } catch {
      toast.error(errorMsg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkInProgress = (incident: Incident) => {
    if (incident.status === 'in-progress') return toast.info('Déjà en cours');
    if (incident.status === 'resolved') return toast.info('Incident déjà résolu');
    runAction(`progress-${incident.id}`, () => incidentActions.updateStatus(incident.id, 'in-progress'), `"${incident.title}" → En Cours`, 'Erreur lors de la mise à jour');
  };

  const handleResolve = (incident: Incident) => {
    if (incident.status === 'resolved') return toast.info('Déjà résolu');
    const adminId = currentUser?.id || 'admin_001';
    const adminName = currentUser?.name || 'Admin FasoTravel';
    runAction(`resolve-${incident.id}`, () => incidentActions.resolve(incident.id, adminId, adminName), `"${incident.title}" → Résolu`, 'Erreur lors de la résolution');
  };

  const handleEscalate = (incident: Incident) => {
    if (incident.severity === 'critical') return toast.info('Déjà en sévérité critique');
    const next = incident.severity === 'low' ? 'medium' : incident.severity === 'medium' ? 'high' : 'critical';
    runAction(`escalate-${incident.id}`, () => incidentActions.updateSeverity(incident.id, next), `Sévérité → ${SEVERITY_LABELS[next]}`, "Erreur lors de l'escalade");
  };

  const handleReopen = (incident: Incident) => {
    if (incident.status === 'open') return toast.info('Déjà ouvert');
    runAction(`reopen-${incident.id}`, () => incidentActions.updateStatus(incident.id, 'open'), `"${incident.title}" → Ré-ouvert`, 'Erreur');
  };

  const handleDowngrade = (incident: Incident) => {
    if (incident.severity === 'low') return toast.info('Sévérité déjà minimale');
    const next = incident.severity === 'critical' ? 'high' : incident.severity === 'high' ? 'medium' : 'low';
    runAction(`downgrade-${incident.id}`, () => incidentActions.updateSeverity(incident.id, next), `Sévérité → ${SEVERITY_LABELS[next]}`, 'Erreur');
  };

  // ==================== NOTIFY PASSENGERS ====================
  const getNotifyTemplate = (incident: Incident): { type: 'delay' | 'cancellation' | 'info' | 'update' | 'resolution'; message: string } => {
    const route = incident.tripRoute || 'votre trajet';
    const company = incident.companyName || 'la société de transport';
    const time = incident.tripDepartureTime
      ? new Date(incident.tripDepartureTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      : '';
    const timeStr = time ? ` de ${time}` : '';

    switch (incident.type) {
      case 'delay':
        return {
          type: 'delay',
          message: `Chers passagers, nous vous informons d'un retard sur le trajet ${route}${timeStr} opéré par ${company}. ${incident.title}. Nous nous excusons pour la gêne occasionnée et vous tiendrons informés de l'évolution de la situation. — FasoTravel`,
        };
      case 'cancellation':
        return {
          type: 'cancellation',
          message: `Chers passagers, le trajet ${route}${timeStr} opéré par ${company} a été annulé. ${incident.description}. Veuillez contacter le service client pour un transfert ou un remboursement. — FasoTravel`,
        };
      case 'accident':
        return {
          type: 'info',
          message: `Information importante concernant le trajet ${route}${timeStr}. Un incident a été signalé. ${incident.title}. La sécurité des passagers est notre priorité. Nous vous communiquerons les prochaines étapes. — FasoTravel`,
        };
      case 'mechanical':
        return {
          type: 'update',
          message: `Chers passagers du trajet ${route}${timeStr}, un problème technique a été signalé sur le véhicule de ${company}. ${incident.title}. Notre équipe intervient. Merci de votre patience. — FasoTravel`,
        };
      default:
        return {
          type: 'info',
          message: `Information concernant le trajet ${route}${timeStr} de ${company}. ${incident.title}. L'équipe FasoTravel suit la situation. — FasoTravel`,
        };
    }
  };

  const openNotifyModal = (incident: Incident) => {
    const template = getNotifyTemplate(incident);
    setNotifyIncident(incident);
    setNotifyType(template.type);
    setNotifyMessage(template.message);
    setNotifyChannels({ push: true, sms: false });
    setShowNotifyModal(true);
  };

  const handleSendNotification = async () => {
    if (!notifyIncident || !notifyMessage.trim()) return;
    const channels: ('push' | 'sms')[] = [];
    if (notifyChannels.push) channels.push('push');
    if (notifyChannels.sms) channels.push('sms');
    if (channels.length === 0) {
      toast.error('Sélectionnez au moins un canal de notification');
      return;
    }

    setNotifySending(true);
    try {
      const res = await incidentActions.notifyPassengers(notifyIncident.id, {
        notificationType: notifyType,
        message: notifyMessage,
        channels,
      });
      if (res?.success) {
        const channelNames = channels.map(c => c === 'push' ? 'Push' : 'SMS').join(' + ');
        toast.success(`Notification envoyée à ${res.data?.notifiedCount ?? 0} passager(s) via ${channelNames}`);
        setShowNotifyModal(false);
      } else {
        toast.error("Erreur lors de l'envoi de la notification");
      }
    } catch {
      toast.error("Erreur lors de l'envoi");
    } finally {
      setNotifySending(false);
    }
  };

  const handleExport = () => {
    const data = filteredIncidents.map(i => ({
      'ID': i.id,
      'Titre': i.title,
      'Type': (TYPE_CONFIG[i.type] || TYPE_CONFIG.other).label,
      'Sévérité': SEVERITY_LABELS[i.severity],
      'Statut': STATUS_LABELS.incident[i.status],
      'Trajet': i.tripRoute || '',
      'Société': i.companyName || '',
      'Source': i.reporterType === 'passenger' ? 'Passager' : 'Société',
      'Signalé par': i.reportedByName || '',
      'Téléphone': i.reportedByPhone || '',
      'Passagers affectés': i.passengersAffected ?? '',
      'Impact': i.impactEstimate || '',
      'Date': new Date(i.createdAt).toLocaleString('fr-FR'),
    }));
    exportToCSV(data, 'incidents');
    toast.success(`${data.length} incident(s) exporté(s)`);
  };

  const handleRefreshAll = async () => {
    setActionLoading('refresh');
    await refreshIncidents();
    setActionLoading(null);
    toast.success('Données actualisées');
  };

  // ==================== RENDER ====================
  return (
    <div className={PAGE_CLASSES.container}>
      {/* HEADER */}
      <div className={PAGE_CLASSES.header}>
        <div className={PAGE_CLASSES.headerContent}>
          <div className={PAGE_CLASSES.headerTexts}>
            <h1 className="text-3xl text-gray-900 dark:text-white mb-2">Gestion des Incidents</h1>
            <p className="text-gray-600 dark:text-gray-400">Suivi et résolution des incidents signalés par les passagers et sociétés de transport</p>
          </div>
          <div className={PAGE_CLASSES.headerActions}>
            <button onClick={handleRefreshAll} disabled={actionLoading === 'refresh'} className={COMPONENTS.buttonSecondary}>
              <RefreshCw size={18} className={actionLoading === 'refresh' ? 'animate-spin' : ''} />
              Actualiser
            </button>
            <button onClick={handleExport} className={COMPONENTS.buttonSecondary}>
              <Download size={18} />
              Exporter CSV
            </button>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <StatCard title="Ouverts" value={stats.open} icon={AlertTriangle} color="red" subtitle="En attente d'action" />
        <StatCard title="En Cours" value={stats.inProgress} icon={Clock} color="yellow" subtitle="Prise en charge" />
        <StatCard title="Résolus" value={stats.resolved} icon={CheckCircle} color="green" />
        <StatCard title="Critiques + Élevés" value={stats.critical + stats.high} icon={Zap} color="red" subtitle={`${stats.critical} critiques, ${stats.high} élevés`} />
        <StatCard title="Passagers affectés" value={stats.totalAffected} icon={Users} color="blue" subtitle={`${stats.byPassenger} par passagers, ${stats.byCompany} par sociétés`} />
      </div>

      {/* FILTERS */}
      <div className={PAGE_CLASSES.searchSection}>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher par titre, trajet, société, signaleur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={COMPONENTS.input.replace('w-full', 'w-full pl-12')}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <SelectFilter icon={<Filter size={16} />} value={filterType} onChange={(v) => setFilterType(v as FilterType)}
              options={[
                { value: 'all', label: 'Tous types' },
                { value: 'mechanical', label: '🔧 Panne' },
                { value: 'delay', label: '⏰ Retard' },
                { value: 'cancellation', label: '❌ Annulation' },
                { value: 'accident', label: '🚨 Accident' },
                { value: 'other', label: '📌 Autre' },
              ]}
            />
            <SelectFilter icon={<Shield size={16} />} value={filterSeverity} onChange={(v) => setFilterSeverity(v as FilterSeverity)}
              options={[
                { value: 'all', label: 'Toute sévérité' },
                { value: 'critical', label: '🔴 Critique' },
                { value: 'high', label: '🟠 Élevé' },
                { value: 'medium', label: '🔵 Moyen' },
                { value: 'low', label: '⚪ Faible' },
              ]}
            />
            <SelectFilter icon={<User size={16} />} value={filterReporter} onChange={(v) => setFilterReporter(v as FilterReporter)}
              options={[
                { value: 'all', label: 'Toute source' },
                { value: 'passenger', label: '👤 Passager' },
                { value: 'company', label: '🏢 Société' },
              ]}
            />
          </div>
        </div>
        {/* Status tabs */}
        <div className="flex gap-2 mt-4 flex-wrap">
          {([
            { key: 'all' as FilterStatus, label: 'Tous', count: incidents.length, gradient: true },
            { key: 'open' as FilterStatus, label: 'Ouverts', count: stats.open, color: 'bg-[#dc2626]' },
            { key: 'in-progress' as FilterStatus, label: 'En Cours', count: stats.inProgress, color: 'bg-[#f59e0b]' },
            { key: 'resolved' as FilterStatus, label: 'Résolus', count: stats.resolved, color: 'bg-[#16a34a]' },
          ]).map(f => (
            <button
              key={f.key}
              onClick={() => setFilterStatus(f.key)}
              className={`px-5 py-2 rounded-lg text-sm transition-all ${
                filterStatus === f.key
                  ? f.gradient ? 'text-white shadow-md' : `${f.color} text-white shadow-md`
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              style={filterStatus === f.key && f.gradient ? { background: 'linear-gradient(to right, #dc2626, #f59e0b, #16a34a)' } : undefined}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>
      </div>

      {/* TABLE */}
      <div className={PAGE_CLASSES.tableContainer}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-5 py-4 text-left text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wider">Incident</th>
                <th className="px-4 py-4 text-left text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wider">Trajet / Société</th>
                <th className="px-4 py-4 text-left text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wider">Source</th>
                <th className="px-4 py-4 text-left text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wider">Sévérité</th>
                <th className="px-4 py-4 text-left text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wider">Statut</th>
                <th className="px-4 py-4 text-left text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wider">Impact</th>
                <th className="px-4 py-4 text-left text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wider">Date</th>
                <th className="px-5 py-4 text-right text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center text-gray-500 dark:text-gray-400">
                    <AlertTriangle className="mx-auto mb-3 text-gray-400" size={48} />
                    <p className="text-lg mb-1">Aucun incident trouvé</p>
                    <p className="text-sm">
                      {searchTerm || filterStatus !== 'all' || filterType !== 'all' || filterSeverity !== 'all' || filterReporter !== 'all'
                        ? 'Modifiez vos filtres pour voir plus de résultats'
                        : 'Aucun incident enregistré'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((incident, index) => {
                  const isActive = incident.status !== 'resolved';
                  const typeConf = TYPE_CONFIG[incident.type] || TYPE_CONFIG.other;
                  const sevColors = SEVERITY_COLORS[incident.severity] || SEVERITY_COLORS.low;
                  const reporterConf = REPORTER_BADGE[incident.reporterType] || REPORTER_BADGE.passenger;
                  const showSep = filterStatus === 'all' && activeCount > 0 && index === activeCount;
                  const isLoading = (key: string) => actionLoading === `${key}-${incident.id}`;

                  return (
                    <TableRows key={incident.id}>
                      {showSep && (
                        <tr>
                          <td colSpan={8} className="px-6 py-2">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-0.5 bg-gradient-to-r from-green-500 via-green-300 to-transparent rounded-full" />
                              <span className="text-xs text-green-600 dark:text-green-400 whitespace-nowrap">↓ {filteredIncidents.length - activeCount} résolu(s)</span>
                              <div className="flex-1 h-0.5 bg-gradient-to-l from-green-500 via-green-300 to-transparent rounded-full" />
                            </div>
                          </td>
                        </tr>
                      )}
                      <tr className={`transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 ${isActive ? 'bg-red-50/30 dark:bg-red-900/5' : ''}`}>
                        {/* INCIDENT */}
                        <td className="px-5 py-4">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl mt-0.5 flex-shrink-0">{typeConf.icon}</span>
                            <div className="min-w-0">
                              <p className="text-sm text-gray-900 dark:text-white truncate max-w-[200px]">{incident.title}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-gray-400 font-mono">#{incident.id.slice(-6)}</span>
                                <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">{typeConf.label}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* TRAJET / SOCIÉTÉ */}
                        <td className="px-4 py-4">
                          {incident.tripRoute ? (
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <Bus size={13} className="text-gray-400 flex-shrink-0" />
                                <p className="text-sm text-gray-900 dark:text-white truncate max-w-[180px]">{incident.tripRoute}</p>
                              </div>
                              {incident.companyName && (
                                <div className="flex items-center gap-1.5 mt-1">
                                  <Building2 size={12} className="text-gray-400 flex-shrink-0" />
                                  <span className="text-xs text-gray-500 dark:text-gray-400">{incident.companyName}</span>
                                </div>
                              )}
                              {incident.tripDepartureTime && (
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <Calendar size={11} className="text-gray-400 flex-shrink-0" />
                                  <span className="text-xs text-gray-400">
                                    {new Date(incident.tripDepartureTime).toLocaleDateString('fr-FR')} à {new Date(incident.tripDepartureTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>

                        {/* SOURCE (qui a signalé) */}
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs ${reporterConf.classes}`}>
                              <reporterConf.icon size={12} />
                              {reporterConf.label}
                            </span>
                            <p className="text-sm text-gray-800 dark:text-gray-200 truncate max-w-[130px]">{incident.reportedByName || '—'}</p>
                            {incident.reportedByPhone && (
                              <p className="text-xs text-gray-400 flex items-center gap-1">
                                <Phone size={10} />{incident.reportedByPhone}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* SÉVÉRITÉ */}
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border ${sevColors.bg} ${sevColors.text} ${sevColors.border}`}>
                            <span className={`w-2 h-2 rounded-full ${sevColors.dot}`} />
                            {SEVERITY_LABELS[incident.severity]}
                          </span>
                        </td>

                        {/* STATUT */}
                        <td className="px-4 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs ${STATUS_BADGE[incident.status]}`}>
                            {STATUS_LABELS.incident[incident.status]}
                          </span>
                        </td>

                        {/* IMPACT */}
                        <td className="px-4 py-4">
                          {incident.passengersAffected != null ? (
                            <div className="flex items-center gap-1.5">
                              <Users size={14} className="text-gray-400" />
                              <span className="text-sm text-gray-800 dark:text-gray-200">{incident.passengersAffected}</span>
                              <span className="text-xs text-gray-400">passager{incident.passengersAffected > 1 ? 's' : ''}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>

                        {/* DATE */}
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-600 dark:text-gray-400">{new Date(incident.createdAt).toLocaleDateString('fr-FR')}</div>
                          <div className="text-xs text-gray-400">{getRelativeTime(incident.createdAt)}</div>
                        </td>

                        {/* ACTIONS */}
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <ActionBtn icon={<Eye size={16} />} tooltip="Voir détails" onClick={() => { setSelectedIncident(incident); setShowDetailModal(true); }} color="gray" />
                            {incident.status !== 'resolved' && incident.tripId && (
                              <ActionBtn icon={<Bell size={16} />} tooltip="Notifier les passagers" onClick={() => openNotifyModal(incident)} color="blue" disabled={!!actionLoading} />
                            )}
                            {incident.status === 'open' && (
                              <ActionBtn icon={isLoading('progress') ? <Loader2 size={16} className="animate-spin" /> : <PlayCircle size={16} />} tooltip="Prendre en charge" onClick={() => handleMarkInProgress(incident)} color="yellow" disabled={!!actionLoading} />
                            )}
                            {incident.status !== 'resolved' && (
                              <ActionBtn icon={isLoading('resolve') ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />} tooltip="Résoudre" onClick={() => handleResolve(incident)} color="green" disabled={!!actionLoading} />
                            )}
                            {incident.status !== 'resolved' && incident.severity !== 'critical' && (
                              <ActionBtn icon={isLoading('escalate') ? <Loader2 size={16} className="animate-spin" /> : <ArrowUpCircle size={16} />} tooltip="Escalader" onClick={() => handleEscalate(incident)} color="red" disabled={!!actionLoading} />
                            )}
                            {incident.status !== 'resolved' && incident.severity !== 'low' && (
                              <ActionBtn icon={isLoading('downgrade') ? <Loader2 size={16} className="animate-spin" /> : <ChevronDown size={16} />} tooltip="Réduire sévérité" onClick={() => handleDowngrade(incident)} color="blue" disabled={!!actionLoading} />
                            )}
                            {incident.status === 'resolved' && (
                              <ActionBtn icon={isLoading('reopen') ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} tooltip="Ré-ouvrir" onClick={() => handleReopen(incident)} color="orange" disabled={!!actionLoading} />
                            )}
                          </div>
                        </td>
                      </tr>
                    </TableRows>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {filteredIncidents.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span className="text-gray-900 dark:text-white">{filteredIncidents.length}</span> / {incidents.length} incidents
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              {stats.open + stats.inProgress > 0 && (
                <span className="text-red-600 dark:text-red-400">{stats.open + stats.inProgress} actif(s)</span>
              )}
              <span>👤 {stats.byPassenger} passagers</span>
              <span>🏢 {stats.byCompany} sociétés</span>
            </div>
          </div>
        )}
      </div>

      {/* ==================== DETAIL MODAL ==================== */}
      {showDetailModal && currentSelected && (
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="text-xl">{(TYPE_CONFIG[currentSelected.type] || TYPE_CONFIG.other).icon}</span>
                <span className="truncate">{currentSelected.title}</span>
              </DialogTitle>
              <DialogDescription>
                #{currentSelected.id.slice(-6)} — {(TYPE_CONFIG[currentSelected.type] || TYPE_CONFIG.other).label}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Badges row */}
              <div className="flex gap-2 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-xs ${STATUS_BADGE[currentSelected.status]}`}>
                  {STATUS_LABELS.incident[currentSelected.status]}
                </span>
                {(() => {
                  const sc = SEVERITY_COLORS[currentSelected.severity] || SEVERITY_COLORS.low;
                  return <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border ${sc.bg} ${sc.text} ${sc.border}`}><span className={`w-2 h-2 rounded-full ${sc.dot}`} />{SEVERITY_LABELS[currentSelected.severity]}</span>;
                })()}
                {(() => {
                  const rc = REPORTER_BADGE[currentSelected.reporterType] || REPORTER_BADGE.passenger;
                  return <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs ${rc.classes}`}><rc.icon size={12} />{rc.label}</span>;
                })()}
              </div>

              {/* TRAJET SECTION */}
              {currentSelected.tripRoute && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                  <h4 className="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Bus size={14} /> Trajet concerné</h4>
                  <p className="text-sm text-blue-900 dark:text-blue-200">{currentSelected.tripRoute}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-blue-700 dark:text-blue-300">
                    {currentSelected.companyName && (
                      <span className="flex items-center gap-1"><Building2 size={12} />{currentSelected.companyName}</span>
                    )}
                    {currentSelected.tripDepartureTime && (
                      <span className="flex items-center gap-1"><Calendar size={12} />{new Date(currentSelected.tripDepartureTime).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    )}
                    {currentSelected.passengersAffected != null && (
                      <span className="flex items-center gap-1"><Users size={12} />{currentSelected.passengersAffected} passager(s) affecté(s)</span>
                    )}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2"><FileText size={14} />Description</div>
                <p className="text-sm text-gray-800 dark:text-gray-200">{currentSelected.description}</p>
              </div>

              {/* SIGNALEMENT + RÉSOLUTION */}
              <div className="grid grid-cols-2 gap-4">
                {/* Qui a signalé */}
                <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
                  <h4 className="text-xs text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-2">Signalé par</h4>
                  <p className="text-sm text-gray-900 dark:text-white">{currentSelected.reportedByName || '—'}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {(() => {
                      const rc = REPORTER_BADGE[currentSelected.reporterType] || REPORTER_BADGE.passenger;
                      return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${rc.classes}`}><rc.icon size={11} />{rc.label}</span>;
                    })()}
                  </div>
                  {currentSelected.reportedByPhone && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1"><Phone size={11} />{currentSelected.reportedByPhone}</p>
                  )}
                </div>

                {/* Résolution ou impact */}
                {currentSelected.resolvedByName ? (
                  <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-xl p-4">
                    <h4 className="text-xs text-green-600 dark:text-green-400 uppercase tracking-wider mb-2">Résolu par</h4>
                    <p className="text-sm text-gray-900 dark:text-white">{currentSelected.resolvedByName}</p>
                    {currentSelected.resolvedAt && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{new Date(currentSelected.resolvedAt).toLocaleString('fr-FR')}</p>
                    )}
                  </div>
                ) : currentSelected.impactEstimate ? (
                  <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
                    <h4 className="text-xs text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-2">Impact estimé</h4>
                    <p className="text-sm text-gray-900 dark:text-white">{currentSelected.impactEstimate}</p>
                  </div>
                ) : null}
              </div>

              {/* Extra details grid */}
              <div className="grid grid-cols-2 gap-4">
                {currentSelected.gareName && <DetailField icon={<MapPin size={14} />} label="Gare" value={currentSelected.gareName} />}
                <DetailField icon={<Calendar size={14} />} label="Créé le" value={new Date(currentSelected.createdAt).toLocaleString('fr-FR')} />
                <DetailField icon={<Hash size={14} />} label="ID Incident" value={currentSelected.id} />
                {currentSelected.estimatedResolutionTime && <DetailField icon={<Clock size={14} />} label="Résolution estimée" value={new Date(currentSelected.estimatedResolutionTime).toLocaleString('fr-FR')} />}
              </div>

              {/* Timeline */}
              <div>
                <h4 className="text-sm text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider flex items-center gap-2"><Activity size={14} />Chronologie</h4>
                <div className="space-y-2">
                  <TimelineItem icon={<AlertTriangle size={14} />} color="red" label="Incident signalé" detail={`par ${currentSelected.reportedByName || 'Inconnu'} (${currentSelected.reporterType === 'passenger' ? 'passager' : 'société'})`} time={getRelativeTime(currentSelected.createdAt)} />
                  {(currentSelected.status === 'in-progress' || currentSelected.status === 'resolved') && (
                    <TimelineItem icon={<Clock size={14} />} color="yellow" label="Prise en charge" time={getRelativeTime(currentSelected.updatedAt)} />
                  )}
                  {currentSelected.resolvedAt && (
                    <TimelineItem icon={<CheckCircle size={14} />} color="green" label="Incident résolu" detail={currentSelected.resolvedByName ? `par ${currentSelected.resolvedByName}` : undefined} time={getRelativeTime(currentSelected.resolvedAt)} />
                  )}
                </div>
              </div>

              {/* ACTIONS */}
              {currentSelected.status !== 'resolved' && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
                  <h4 className="text-sm text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wider">Actions</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {currentSelected.status === 'open' && (
                      <ModalAction label="Prendre en charge" icon={<PlayCircle size={16} />} bgColor="bg-[#f59e0b] hover:bg-[#d97706]" loading={actionLoading === `progress-${currentSelected.id}`} disabled={!!actionLoading} onClick={() => handleMarkInProgress(currentSelected)} />
                    )}
                    <ModalAction label="Marquer Résolu" icon={<CheckCircle size={16} />} bgColor="bg-[#16a34a] hover:bg-[#15803d]" loading={actionLoading === `resolve-${currentSelected.id}`} disabled={!!actionLoading} onClick={() => handleResolve(currentSelected)} />
                    {currentSelected.severity !== 'critical' && (
                      <ModalAction label="Escalader sévérité" icon={<ArrowUpCircle size={16} />} bgColor="bg-[#dc2626] hover:bg-[#b91c1c]" loading={actionLoading === `escalate-${currentSelected.id}`} disabled={!!actionLoading} onClick={() => handleEscalate(currentSelected)} />
                    )}
                    {currentSelected.severity !== 'low' && (
                      <ModalAction label="Réduire sévérité" icon={<ChevronDown size={16} />} bgColor="bg-[#3b82f6] hover:bg-[#2563eb]" loading={actionLoading === `downgrade-${currentSelected.id}`} disabled={!!actionLoading} onClick={() => handleDowngrade(currentSelected)} />
                    )}
                    {currentSelected.tripId && (
                      <ModalAction label="Notifier les passagers" icon={<Bell size={16} />} bgColor="bg-[#8b5cf6] hover:bg-[#7c3aed]" loading={false} disabled={false} onClick={() => { setShowDetailModal(false); openNotifyModal(currentSelected); }} fullWidth />
                    )}
                  </div>
                </div>
              )}

              {currentSelected.status === 'resolved' && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-5 space-y-3">
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-3">
                    <CheckCircle className="text-green-600 dark:text-green-400 flex-shrink-0" size={20} />
                    <div>
                      <p className="text-sm text-green-800 dark:text-green-300">Incident résolu{currentSelected.resolvedByName ? ` par ${currentSelected.resolvedByName}` : ''}</p>
                      {currentSelected.resolvedAt && <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">{getRelativeTime(currentSelected.resolvedAt)}</p>}
                    </div>
                  </div>
                  <ModalAction label="Ré-ouvrir l'incident" icon={<RefreshCw size={16} />} bgColor="bg-orange-500 hover:bg-orange-600" loading={actionLoading === `reopen-${currentSelected.id}`} disabled={!!actionLoading} onClick={() => handleReopen(currentSelected)} fullWidth />
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ==================== NOTIFY MODAL ==================== */}
      {showNotifyModal && notifyIncident && (
        <Dialog open={showNotifyModal} onOpenChange={setShowNotifyModal}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bell size={20} className="text-purple-600" />
                Notifier les passagers
              </DialogTitle>
              <DialogDescription>
                Envoyer une notification aux passagers du trajet concerné
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5">
              {/* Recap trajet */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{(TYPE_CONFIG[notifyIncident.type] || TYPE_CONFIG.other).icon}</span>
                  <p className="text-sm text-blue-900 dark:text-blue-200">{notifyIncident.title}</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-blue-700 dark:text-blue-300 flex-wrap">
                  {notifyIncident.tripRoute && (
                    <span className="flex items-center gap-1"><Bus size={12} />{notifyIncident.tripRoute}</span>
                  )}
                  {notifyIncident.companyName && (
                    <span className="flex items-center gap-1"><Building2 size={12} />{notifyIncident.companyName}</span>
                  )}
                  {notifyIncident.tripDepartureTime && (
                    <span className="flex items-center gap-1"><Calendar size={12} />{new Date(notifyIncident.tripDepartureTime).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                  )}
                </div>
                {notifyIncident.passengersAffected != null && (
                  <div className="mt-2 flex items-center gap-1.5 text-sm text-blue-800 dark:text-blue-200">
                    <Users size={14} />
                    <span className="font-medium">{notifyIncident.passengersAffected}</span> passager(s) seront notifié(s)
                  </div>
                )}
              </div>

              {/* Type de notification */}
              <div>
                <label htmlFor="notifyType" className="text-sm text-gray-700 dark:text-gray-300 mb-2 block">Type de notification</label>
                <select
                  id="notifyType"
                  value={notifyType}
                  onChange={(e) => setNotifyType(e.target.value as any)}
                  className="w-full py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 dark:text-white text-sm"
                >
                  <option value="delay">Retard</option>
                  <option value="cancellation">Annulation</option>
                  <option value="update">Mise à jour</option>
                  <option value="info">Information</option>
                  <option value="resolution">Résolution</option>
                </select>
              </div>

              {/* Canaux */}
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300 mb-3 block">Canaux d'envoi</label>
                <div className="flex gap-4">
                  <label className={`flex-1 flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    notifyChannels.push
                      ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700'
                      : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                  }`}>
                    <input type="checkbox" checked={notifyChannels.push} onChange={(e) => setNotifyChannels({ ...notifyChannels, push: e.target.checked })} className="sr-only" />
                    <Smartphone size={18} className={notifyChannels.push ? 'text-purple-600' : 'text-gray-400'} />
                    <div>
                      <p className={`text-sm ${notifyChannels.push ? 'text-purple-700 dark:text-purple-300' : 'text-gray-600 dark:text-gray-400'}`}>Push</p>
                      <p className="text-xs text-gray-400">App mobile</p>
                    </div>
                    <div className={`ml-auto w-4 h-4 rounded-full border-2 ${notifyChannels.push ? 'bg-purple-600 border-purple-600' : 'border-gray-300 dark:border-gray-500'}`} />
                  </label>
                  <label className={`flex-1 flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    notifyChannels.sms
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                      : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                  }`}>
                    <input type="checkbox" checked={notifyChannels.sms} onChange={(e) => setNotifyChannels({ ...notifyChannels, sms: e.target.checked })} className="sr-only" />
                    <MessageSquare size={18} className={notifyChannels.sms ? 'text-green-600' : 'text-gray-400'} />
                    <div>
                      <p className={`text-sm ${notifyChannels.sms ? 'text-green-700 dark:text-green-300' : 'text-gray-600 dark:text-gray-400'}`}>SMS</p>
                      <p className="text-xs text-gray-400">Téléphone</p>
                    </div>
                    <div className={`ml-auto w-4 h-4 rounded-full border-2 ${notifyChannels.sms ? 'bg-green-600 border-green-600' : 'border-gray-300 dark:border-gray-500'}`} />
                  </label>
                </div>
              </div>

              {/* Message */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-700 dark:text-gray-300">Message</label>
                  <span className="text-xs text-gray-400">{notifyMessage.length} caractères</span>
                </div>
                <textarea
                  value={notifyMessage}
                  onChange={(e) => setNotifyMessage(e.target.value)}
                  rows={5}
                  className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 dark:text-white text-sm resize-none"
                  placeholder="Message de notification..."
                />
                <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                  <AlertCircle size={11} />
                  Le message est pré-rempli selon le type d'incident. Vous pouvez le modifier librement.
                </p>
              </div>

              {/* Send button */}
              <button
                onClick={handleSendNotification}
                disabled={notifySending || !notifyMessage.trim() || (!notifyChannels.push && !notifyChannels.sms)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-xl transition-colors disabled:opacity-50 text-sm"
              >
                {notifySending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                Envoyer à {notifyIncident.passengersAffected || 0} passager(s)
                {notifyChannels.push && notifyChannels.sms ? ' (Push + SMS)' : notifyChannels.push ? ' (Push)' : notifyChannels.sms ? ' (SMS)' : ''}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ==================== SUB-COMPONENTS ====================

function TableRows({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function SelectFilter({ icon, value, onChange, options }: {
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>
      <select
        aria-label={options[0]?.label || 'Filtre'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9 pr-8 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 dark:text-white appearance-none transition-colors min-w-[150px] text-sm"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function ActionBtn({ icon, tooltip, onClick, color, disabled }: {
  icon: React.ReactNode; tooltip: string; onClick: () => void;
  color: 'gray' | 'yellow' | 'green' | 'red' | 'blue' | 'orange'; disabled?: boolean;
}) {
  const colorMap = {
    gray: 'text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700',
    yellow: 'text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 dark:hover:bg-yellow-900/20',
    green: 'text-green-600 hover:text-green-800 hover:bg-green-50 dark:hover:bg-green-900/20',
    red: 'text-red-500 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20',
    blue: 'text-blue-500 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20',
    orange: 'text-orange-500 hover:text-orange-800 hover:bg-orange-50 dark:hover:bg-orange-900/20',
  };
  return (
    <button onClick={(e) => { e.stopPropagation(); onClick(); }} disabled={disabled} title={tooltip}
      className={`p-2 rounded-lg transition-colors ${colorMap[color]} disabled:opacity-40 disabled:cursor-not-allowed`}>
      {icon}
    </button>
  );
}

function ModalAction({ label, icon, bgColor, loading, disabled, onClick, fullWidth }: {
  label: string; icon: React.ReactNode; bgColor: string; loading: boolean;
  disabled: boolean; onClick: () => void; fullWidth?: boolean;
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`flex items-center justify-center gap-2 px-4 py-3 text-white rounded-xl transition-colors disabled:opacity-50 text-sm ${bgColor} ${fullWidth ? 'col-span-2' : ''}`}>
      {loading ? <Loader2 size={16} className="animate-spin" /> : icon}
      {label}
    </button>
  );
}

function DetailField({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-1">{icon}{label}</div>
      <span className="text-sm text-gray-900 dark:text-white break-all">{value}</span>
    </div>
  );
}

function TimelineItem({ icon, color, label, detail, time }: {
  icon: React.ReactNode; color: 'red' | 'yellow' | 'green'; label: string; detail?: string; time: string;
}) {
  const colorMap = {
    red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300',
  };
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${colorMap[color]}`}>
      {icon}
      <div className="flex-1">
        <p className="text-sm">{label}</p>
        {detail && <p className="text-xs opacity-75">{detail}</p>}
      </div>
      <span className="text-xs opacity-75 flex-shrink-0">{time}</span>
    </div>
  );
}

export default IncidentManagement;