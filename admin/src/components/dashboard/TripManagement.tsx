import { useState, useMemo } from 'react';
import { Search, Users, DollarSign, Bus, Ban, CheckCircle, AlertCircle } from 'lucide-react';
import { useAdminApp } from '../../context/AdminAppContext';
import { PageTemplate } from '../templates/PageTemplate';
import { PAGE_CLASSES, COMPONENTS } from '../../lib/design-system';
import { StatCard } from '../ui/stat-card';
import { formatNumber, formatCurrency } from '../../lib/utils';
import { useTrips } from '../../hooks/useTrips';

/**
 * TripManagement - Admin Version
 * Version 2.0 - Backend-ready avec ZÉRO données hardcodées
 * Vue globale de supervision des trajets de toutes les sociétés
 * Note: L'Admin ne gère PAS les trajets directement (c'est la responsabilité de l'app Société)
 * mais peut les superviser globalement
 */
export function TripManagement() {
  const { transportCompanies: _transportCompanies } = useAdminApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // 🔥 HOOK BACKEND-READY - Toute la logique métier externalisée
  const { summaries, globalStats, loading: _loading, error: _error } = useTrips({ loadGlobalStats: true });

  const filteredData = useMemo(() => {
    return summaries.filter(item => {
      const searchLower = searchTerm?.toLowerCase() || '';
      const matchesSearch = item.company_name?.toLowerCase().includes(searchLower);
      
      const matchesStatus = 
        statusFilter === 'all' ||
        (statusFilter === 'active' && item.status === 'active') ||
        (statusFilter === 'inactive' && item.status !== 'active');
      
      return matchesSearch && matchesStatus;
    });
  }, [summaries, searchTerm, statusFilter]);

  return (
    <PageTemplate
      title="Supervision des Trajets"
      subtitle="Vue globale des trajets de toutes les sociétés de transport"
      stats={
        globalStats && (
          <div className={PAGE_CLASSES.statsGrid}>
            <StatCard
              key="trips-active"
              title="Trajets Actifs"
              value={formatNumber(globalStats.totalActiveTrips)}
              icon={Bus}
              color="blue"
              subtitle="en circulation maintenant"
            />
            <StatCard
              key="trips-completed"
              title="Complétés Aujourd'hui"
              value={formatNumber(globalStats.totalCompletedToday)}
              icon={CheckCircle}
              color="green"
              subtitle="trajets terminés"
            />
            <StatCard
              key="trips-cancelled"
              title="Annulés Aujourd'hui"
              value={formatNumber(globalStats.totalCancelledToday)}
              icon={Ban}
              color="red"
              subtitle="annulations"
            />
            <StatCard
              key="trips-occupancy"
              title="Taux d'Occupation Global"
              value={`${globalStats.globalOccupancy.toFixed(1)}%`}
              icon={Users}
              color="yellow"
              subtitle={`${formatCurrency(globalStats.avgRevenue)} revenu moyen`}
            />
          </div>
        )
      }
      searchBar={
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher une société de transport..."
              className={COMPONENTS.input.replace('w-full', 'w-full pl-12')}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
          >
            <option value="all">Toutes les sociétés</option>
            <option value="active">Actives uniquement</option>
            <option value="inactive">Inactives uniquement</option>
          </select>
        </div>
      }
    >
      {/* Info Banner */}
      <div className="mb-6 bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-yellow-700 dark:text-yellow-400 mt-0.5" size={20} />
          <div>
            <h4 className="text-sm font-medium text-yellow-900 dark:text-yellow-200 mb-1">
              Vue globale supervision
            </h4>
            <p className="text-xs text-yellow-800 dark:text-yellow-300">
              Cette section affiche une vue d'ensemble des trajets gérés par chaque société. 
              La gestion détaillée des trajets se fait via l'application Société.
            </p>
          </div>
        </div>
      </div>

      {/* Companies Trip Summary */}
      <div className={PAGE_CLASSES.contentGrid}>
        {filteredData.map((item) => {
          const isActive = item.status === 'active';
          const occupancyColor = 
            item.occupancy_rate >= 80 ? 'green' : 
            item.occupancy_rate >= 50 ? 'yellow' : 'red';

          return (
            <div
              key={item.company_id}
              className={`${COMPONENTS.card} overflow-hidden`}
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`p-3 rounded-xl ${isActive ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
                      <Bus className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'} size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate mb-1">
                        {item.company_name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {item.active_trips} trajet{item.active_trips > 1 ? 's' : ''} actif{item.active_trips > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <span className={isActive ? COMPONENTS.badgeActive : COMPONENTS.badgeInactive}>
                  {isActive ? 'Actif' : 'Inactif'}
                </span>
              </div>

              {/* Stats */}
              <div className="p-6 bg-gray-50 dark:bg-gray-900">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <CheckCircle className="text-green-600 dark:text-green-400" size={16} />
                      <div className="text-xl font-bold text-gray-900 dark:text-white">
                        {item.completed_today}
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Complétés</div>
                  </div>
                  <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Ban className="text-red-600 dark:text-red-400" size={16} />
                      <div className="text-xl font-bold text-gray-900 dark:text-white">
                        {item.cancelled_today}
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Annulés</div>
                  </div>
                </div>

                {/* Occupancy */}
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Taux d'occupation</span>
                    <span className={`text-sm font-semibold ${
                      occupancyColor === 'green' ? 'text-green-600 dark:text-green-400' :
                      occupancyColor === 'yellow' ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {item.occupancy_rate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        occupancyColor === 'green' ? 'bg-green-500' :
                        occupancyColor === 'yellow' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(100, item.occupancy_rate)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {item.occupied_seats} / {item.total_seats} sièges
                    </span>
                  </div>
                </div>

                {/* Revenue */}
                <div className="mt-4 p-4 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-300 dark:border-green-800">
                  <div className="flex items-center gap-2 text-xs text-green-800 dark:text-green-300 mb-1">
                    <DollarSign size={14} />
                    <span>Revenu moyen par trajet</span>
                  </div>
                  <div className="text-lg font-bold text-green-900 dark:text-green-200">
                    {formatCurrency(item.avg_revenue_per_trip)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredData.length === 0 && (
        <div className="text-center py-16">
          <Bus className="mx-auto mb-4 text-gray-400" size={64} />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Aucune société trouvée
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm || statusFilter !== 'all'
              ? 'Essayez de modifier vos filtres'
              : 'Aucune société de transport enregistrée'}
          </p>
        </div>
      )}
    </PageTemplate>
  );
}

export default TripManagement;