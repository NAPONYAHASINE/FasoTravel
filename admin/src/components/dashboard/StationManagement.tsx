import { useState, useMemo } from 'react';
import { useAdminApp } from '../../context/AdminAppContext';
import { 
  MapPin, 
  Search, 
  Plus, 
  CheckCircle, 
  AlertCircle, 
  Radio, 
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  Wifi,
  WifiOff
} from 'lucide-react';
import { PAGE_CLASSES, COMPONENTS } from '../../lib/design-system';
import { PageTemplate } from '../templates/PageTemplate';
import { StatCard } from '../ui/stat-card';
import { formatNumber, formatCurrency } from '../../lib/utils';
import { CreateStationModal } from '../modals/CreateStationModal';
import { useStations, useStationStatsMap } from '../../hooks/useStations';
import { StationStatusUtils } from '../../lib/stationStatusUtils';

/**
 * StationManagement - Admin Version
 * Version 2.0 - Backend-ready avec ZÉRO données hardcodées
 * Gestion et supervision de toutes les gares/stations
 */
export function StationManagement() {
  const { stations } = useAdminApp(); // ⚠️ SUPPRIMÉ toggleStationStatus
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // 🔥 HOOKS BACKEND-READY - Toute la logique métier externalisée
  const { stationStats: _stationStats, globalStats, loading: _loading, error: _error } = useStations({ loadGlobalStats: true });
  const statsMap = useStationStatsMap();

  const handleCreateStation = (data: any) => {
    console.log('Création gare:', data);
    // TODO: Intégrer avec backend/context
    setShowCreateModal(false);
  };

  // Stats globales - Utiliser globalStats du hook
  const stats = useMemo(() => {
    if (!globalStats) {
      // Fallback si les données ne sont pas encore chargées
      const active = stations.filter(s => s.status === 'active').length;
      const inactive = stations.filter(s => s.status === 'inactive').length;
      const total = stations.length;
      const activePercentage = total > 0 ? (active / total) * 100 : 0;
      
      return { 
        active, 
        inactive, 
        total, 
        activePercentage, 
        totalSales: 0, 
        totalRevenue: 0 
      };
    }
    
    return {
      active: globalStats.active_stations,
      inactive: globalStats.inactive_stations,
      total: globalStats.total_stations,
      activePercentage: globalStats.active_percentage,
      totalSales: globalStats.total_sales_today,
      totalRevenue: globalStats.total_revenue_today,
    };
  }, [stations, globalStats]);

  // Filtrage
  const filteredStations = useMemo(() => {
    return stations.filter((station) => {
      const matchesSearch =
        station.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        station.city?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' && station.status === 'active') ||
        (filterStatus === 'inactive' && station.status === 'inactive');

      return matchesSearch && matchesStatus;
    });
  }, [stations, searchTerm, filterStatus]);

  // Tri
  const sortedStations = useMemo(() => {
    return [...filteredStations].sort((a, b) => {
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;
      return 0; // Pas de tri supplémentaire basé sur les ventes dans ce mock
    });
  }, [filteredStations]);

  // Stats cards memoized
  const statsCards = useMemo(() => [
    {
      key: "stations-active",
      title: "Gares Actives",
      value: `${stats.active}/${stats.total}`,
      icon: CheckCircle,
      color: "green" as const,
      subtitle: `${stats.activePercentage.toFixed(1)}% opérationnelles`
    },
    {
      key: "stations-inactive",
      title: "Gares Inactives",
      value: stats.inactive.toString(),
      icon: AlertCircle,
      color: "red" as const,
      subtitle: "nécessitent attention"
    },
    {
      key: "stations-sales",
      title: "Ventes Aujourd'hui",
      value: formatNumber(stats.totalSales),
      icon: Users,
      color: "blue" as const,
      subtitle: "billets vendus"
    },
    {
      key: "stations-revenue",
      title: "Revenus du Jour",
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      color: "yellow" as const,
      subtitle: "chiffre d'affaires"
    }
  ], [stats]);

  return (
    <PageTemplate
      title="Gestion des Gares"
      subtitle="Supervision de toutes les stations de transport"
      stats={
        <div className={PAGE_CLASSES.statsGrid}>
          {statsCards.map(stat => (
            <StatCard
              key={stat.key}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              color={stat.color}
              subtitle={stat.subtitle}
            />
          ))}
        </div>
      }
      searchBar={
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher une gare par nom ou ville..."
              className={COMPONENTS.input.replace('w-full', 'w-full pl-12')}
            />
          </div>
          <select
            aria-label="Filtrer par statut"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
          >
            <option value="all">Tous statuts</option>
            <option value="active">Actives uniquement</option>
            <option value="inactive">Inactives uniquement</option>
          </select>
        </div>
      }
      actions={[{
        label: 'Ajouter une gare',
        icon: Plus,
        onClick: () => setShowCreateModal(true),
      }]}
    >
      {/* Stations Grid */}
      <div className={PAGE_CLASSES.contentGrid}>
        {sortedStations.map((station) => {
          // 🔥 CALCUL AUTOMATIQUE DU STATUT
          const isOpen = StationStatusUtils.isStationOpen(station);
          const isConnected = StationStatusUtils.isStationConnected(station);
          const statusReason = StationStatusUtils.getStationStatusReason(station);
          const connectionIndicator = StationStatusUtils.getConnectionIndicator(station);
          const isActive = station.status === 'active';
          
          // Récupérer les stats de cette gare depuis le statsMap
          const stationStat = statsMap.get(station.id);
          const salesToday = stationStat?.sales_today || 0;
          const salesYesterday = stationStat?.sales_yesterday || 0;
          const changeDaily = stationStat?.sales_change_daily || 0;

          return (
            <div
              key={station.id}
              className={`${COMPONENTS.card} overflow-hidden`}
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`p-3 rounded-xl ${isActive ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                      <MapPin className={isActive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate mb-1">
                        {station.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{station.city}</p>
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className={isActive ? COMPONENTS.badgeActive : COMPONENTS.badgeInactive}>
                    <Radio size={12} />
                    {isActive ? 'Active' : 'Inactive'}
                  </span>
                  
                  {/* 🔥 Indicateur de connexion Internet */}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                    isConnected 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                      : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                  }`}>
                    {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
                    {connectionIndicator.text}
                  </span>
                  
                  {/* 🔥 Nombre de caissiers connectés */}
                  {station.activeCashiers !== undefined && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                      station.activeCashiers > 0
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      <Users size={12} />
                      {station.activeCashiers} caissier{station.activeCashiers > 1 ? 's' : ''}
                    </span>
                  )}
                  
                  {/* Heures d'ouverture */}
                  {station.openingTime && station.closingTime && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                      isOpen
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      <Clock size={12} />
                      {station.openingTime} - {station.closingTime}
                    </span>
                  )}
                  
                  {changeDaily > 0 && isActive && (
                    <span className={COMPONENTS.badgeInfo}>
                      <TrendingUp size={12} />
                      {changeDaily >= 0 ? '+' : ''}{changeDaily.toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="p-6 bg-gray-50 dark:bg-gray-900">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatNumber(salesToday)}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Aujourd'hui</div>
                  </div>
                  <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                      {formatNumber(salesYesterday)}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Hier</div>
                  </div>
                </div>

                {/* Location */}
                {(station.latitude && station.longitude) && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                    📍 {station.latitude.toFixed(4)}, {station.longitude.toFixed(4)}
                  </div>
                )}
              </div>

              {/* 🔥 INFO STATUT AUTOMATIQUE (LECTURE SEULE) */}
              <div className="p-6 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    Statut automatique
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {statusReason}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    {isOpen && !isConnected && '⚠️ Ventes en ligne stoppées (protection anti-surbooking)'}
                    {isOpen && isConnected && '✅ Ventes en ligne autorisées'}
                    {!isOpen && '🌙 Ventes en ligne autorisées (caisse fermée)'}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {sortedStations.length === 0 && (
        <div className="text-center py-16">
          <MapPin className="mx-auto mb-4 text-gray-400" size={64} />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Aucune gare trouvée
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm || filterStatus !== 'all'
              ? 'Essayez de modifier vos filtres'
              : 'Aucune gare enregistrée dans le système'}
          </p>
        </div>
      )}

      {/* Modales */}
      <CreateStationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateStation}
      />
    </PageTemplate>
  );
}

export default StationManagement;