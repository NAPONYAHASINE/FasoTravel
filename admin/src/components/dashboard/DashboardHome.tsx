import { useMemo } from 'react';
import { 
  AlertCircle,
  MapPin,
  Clock,
  Activity,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAdminApp } from '../../context/AdminAppContext';
import { getRelativeTime } from '../../lib/utils';
import { useFinancialMetrics } from '../../hooks/useFinancialMetrics';
import { usePlatformAnalytics } from '../../hooks/usePlatformAnalytics';
import { FinancialKPICard } from '../shared/FinancialKPICard';
import { RevenueChart } from '../shared/RevenueChart';
import { PaymentMethodsDistribution } from '../shared/PaymentMethodsDistribution';
import { TopCompaniesChart } from '../shared/TopCompaniesChart';
import { TimePeriod } from '../../types/financial';
import { PAGE_CLASSES } from '../../lib/design-system';

/**
 * DashboardHome Component - Admin Version
 * Version 5.0 - Backend-ready avec architecture propre et ZÉRO duplication + ZÉRO données hardcodées
 */
export function DashboardHome() {
  const { auditLogs, transportCompanies, passengers, theme } = useAdminApp();

  // 🔥 HOOKS BACKEND-READY - Toute la logique métier externalisée
  const { kpis, metrics, error: financialError } = useFinancialMetrics({
    period: TimePeriod.WEEK,
  });

  const { 
    weeklyRegistrations, 
    stationActivities, 
    error: platformError 
  } = usePlatformAnalytics();

  // Protected data with defaults
  const safeCompanies = transportCompanies || [];
  const safePassengers = passengers || [];
  const safeLogs = auditLogs || [];

  // Loading global
  const error = financialError || platformError;

  // KPIs non-financiers (sociétés et passagers)
  const platformKPIs = useMemo(() => [
    { 
      label: 'Sociétés de Transport', 
      value: safeCompanies.length.toLocaleString(), 
      change: `${safeCompanies.filter(c => c.status === 'active').length} actives`,
      changeValue: safeCompanies.filter(c => c.status === 'active').length,
      trend: 'up' as const,
      format: 'number' as const,
      subtext: `${safeCompanies.filter(c => c.status === 'pending').length} en attente d'approbation`,
      icon: 'Building2',
      color: 'red',
      rawValue: safeCompanies.length,
    },
    { 
      label: 'Passagers Inscrits', 
      value: safePassengers.length.toLocaleString(), 
      change: `${safePassengers.filter(p => p.status === 'active').length} actifs`,
      changeValue: safePassengers.filter(p => p.status === 'active').length,
      trend: 'up' as const,
      format: 'number' as const,
      subtext: `${safePassengers.filter(p => p.verified).length} comptes vérifiés`,
      icon: 'Users',
      color: 'yellow',
      rawValue: safePassengers.length,
    },
  ], [safeCompanies, safePassengers]);

  // Top companies par nombre de véhicules (données originales)
  const topCompaniesByVehicles = useMemo(() => {
    return safeCompanies
      .filter(c => c.status === 'active')
      .sort((a, b) => (b.vehicleCount || 0) - (a.vehicleCount || 0))
      .slice(0, 5)
      .map((c, index) => ({
        id: c.operatorId || c.id || `company-${index}`,
        name: c.name,
        value: c.vehicleCount || 0
      }));
  }, [safeCompanies]);

  // Logs récents
  const recentLogs = useMemo(() => safeLogs.slice(0, 5), [safeLogs]);

  if (error) {
    return (
      <div className={`${PAGE_CLASSES.container} flex items-center justify-center`}>
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={PAGE_CLASSES.container}>
      {/* Header Premium */}
      <div className={PAGE_CLASSES.header}>
        <div className={PAGE_CLASSES.headerContent}>
          <div className={PAGE_CLASSES.headerTexts}>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Bienvenue sur FasoTravel Admin - Supervision Plateforme
            </p>
          </div>
          <div className={PAGE_CLASSES.headerActions}>
            <div className="flex items-center gap-3 px-6 py-3 bg-gray-50 dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
              <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">Système Opérationnel</span>
            </div>
          </div>
        </div>
      </div>

      {/* 🔥 KPIs FINANCIERS + PLATEFORME - Composants réutilisables */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            {/* KPIs Financiers */}
            {kpis.map((kpi, index) => (
              <FinancialKPICard key={`financial-kpi-${index}`} kpi={kpi} />
            ))}
            {/* KPIs Plateforme */}
            {platformKPIs.map((kpi, index) => (
              <FinancialKPICard key={`platform-kpi-${index}`} kpi={kpi} />
            ))}
      </div>

      {/* 🔥 GRAPHIQUES FINANCIERS - Composants réutilisables */}
      {metrics && (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
            {/* Revenus Hebdomadaires */}
            <RevenueChart
              data={metrics.dailyRevenue}
              title="Revenus Hebdomadaires"
              subtitle={`${(metrics.revenue.periodRevenue / 1000).toFixed(0)}K FCFA cette semaine`}
              growth={metrics.revenue.growthRate}
              theme={theme}
              type="line"
              color="#10b981"
              period={TimePeriod.WEEK}
              chartId="revenue-weekly"
            />

            {/* Top Sociétés par Revenus */}
            <TopCompaniesChart
              data={metrics.topCompaniesByRevenue}
              title="Top Sociétés par Revenus"
              subtitle="Sociétés les plus performantes"
              metric="revenue"
              theme={theme}
              color="#10b981"
              chartId="top-companies-revenue"
            />
          </div>

          {/* Section Paiements & Transactions */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
            {/* Distribution Méthodes de Paiement */}
            <PaymentMethodsDistribution
              data={metrics.paymentMethods}
              totalTransactions={metrics.transactions.totalCount}
              successRate={metrics.transactions.successRate}
              theme={theme}
            />

            {/* Volume Transactions */}
            <RevenueChart
              data={metrics.dailyRevenue.map(d => ({
                ...d,
                revenue: d.transactionCount * (metrics.avgTransactionAmount || 1)
              }))}
              title="Volume Transactions"
              subtitle={`${metrics.transactions.totalCount} transactions cette période`}
              growth={(metrics.transactions.successRate - 95) * 2}
              theme={theme}
              type="bar"
              color="#3b82f6"
              showGrowthBadge={false}
              period={TimePeriod.WEEK}
              chartId="volume-transactions"
            />
          </div>
        </>
      )}

      {/* Section Plateforme - Graphiques originaux */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        {/* Evolution Inscriptions */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 transition-colors">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl text-gray-900 dark:text-white mb-1">Evolution Plateforme</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Inscriptions hebdomadaires</p>
            </div>
            <Activity className="h-5 w-5 text-green-500" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklyRegistrations} id="weekly-registrations-chart">
              <CartesianGrid key="wr-grid" strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#f0f0f0'} />
              <XAxis key="wr-xaxis" dataKey="dayName" stroke={theme === 'dark' ? '#9ca3af' : '#9ca3af'} style={{ fontSize: '12px' }} />
              <YAxis key="wr-yaxis" stroke={theme === 'dark' ? '#9ca3af' : '#9ca3af'} style={{ fontSize: '12px' }} />
              <Tooltip 
                key="wr-tooltip"
                contentStyle={{ 
                  backgroundColor: theme === 'dark' ? '#1f2937' : 'white', 
                  border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  color: theme === 'dark' ? '#f9fafb' : '#111827'
                }}
              />
              <Line key="wr-line-companies" type="monotone" dataKey="companies" stroke="#dc2626" strokeWidth={2} name="Sociétés" />
              <Line key="wr-line-passengers" type="monotone" dataKey="passengers" stroke="#f59e0b" strokeWidth={2} name="Passagers" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Sociétés par Flotte */}
        <TopCompaniesChart
          data={topCompaniesByVehicles}
          title="Top Sociétés par Flotte"
          subtitle="Classement par nombre de véhicules"
          metric="vehicles"
          theme={theme}
          color="#dc2626"
          chartId="top-companies-fleet"
        />
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Stations Populaires */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 transition-colors">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl text-gray-900 dark:text-white mb-1">Stations Principales</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Infrastructure réseau</p>
            </div>
            <MapPin className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <div className="space-y-4">
            {stationActivities.map((station, index) => (
              <div key={station.stationId} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white shadow-md">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-900 dark:text-white">{station.stationName}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{station.city}</div>
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300">{station.totalActivity} départs/j</div>
              </div>
            ))}
          </div>
        </div>

        {/* Activité Récente - Audit Logs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 transition-colors">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl text-gray-900 dark:text-white mb-1">Activité Récente</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Dernières actions système</p>
            </div>
            <Clock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <div className="space-y-3">
            {recentLogs.map((log) => {
              const isError = log.status === 'error';
              const isWarning = log.status === 'warning';
              
              return (
                <div 
                  key={log.id} 
                  className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-100 dark:border-gray-700"
                >
                  <div className={
                    isError ? 'p-2 rounded-lg bg-red-200 dark:bg-red-900/30' :
                    isWarning ? 'p-2 rounded-lg bg-yellow-200 dark:bg-yellow-900/30' :
                    'p-2 rounded-lg bg-green-200 dark:bg-green-900/30'
                  }>
                    <AlertCircle className={
                      isError ? 'h-4 w-4 text-red-700 dark:text-red-400' :
                      isWarning ? 'h-4 w-4 text-yellow-700 dark:text-yellow-400' :
                      'h-4 w-4 text-green-700 dark:text-green-400'
                    } />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-900 dark:text-white mb-1">{log.action}</div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <span>{log.userName || 'Système'}</span>
                      <span>•</span>
                      <span>{getRelativeTime(new Date(log.createdAt))}</span>
                    </div>
                  </div>
                  <span className={
                    isError ? 'px-3 py-1 rounded-full text-xs bg-red-200 dark:bg-red-900/30 text-red-900 dark:text-red-400 border border-red-400 dark:border-red-700 font-medium' :
                    isWarning ? 'px-3 py-1 rounded-full text-xs bg-yellow-200 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-400 border border-yellow-400 dark:border-yellow-700 font-medium' :
                    'px-3 py-1 rounded-full text-xs bg-green-200 dark:bg-green-900/30 text-green-900 dark:text-green-400 border border-green-400 dark:border-green-700 font-medium'
                  }>
                    {log.status || 'info'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardHome;