import { useAdminApp } from '../../context/AdminAppContext';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { COLORS } from '../../lib/constants';
import { useFinancialMetrics } from '../../hooks/useFinancialMetrics';
import { FinancialKPICard } from '../shared/FinancialKPICard';
import { RevenueChart } from '../shared/RevenueChart';
import { PaymentMethodsDistribution } from '../shared/PaymentMethodsDistribution';
import { TopCompaniesChart } from '../shared/TopCompaniesChart';
import { TimePeriod, FinancialKPI } from '../../types/financial';
import { PAGE_CLASSES } from '../../lib/design-system';

/**
 * AnalyticsDashboard - Admin Version
 * Version: 4.0 - Backend-ready avec architecture propre et zéro duplication
 */
export function AnalyticsDashboard() {
  const { transportCompanies, passengers, supportTickets, stations, theme } = useAdminApp();
  
  // 🔥 UN SEUL STATE - Le hook gère tout
  const { kpis: financialKPIs, metrics, loading: _loading, setPeriod, period } = useFinancialMetrics({
    period: TimePeriod.WEEK,
  });

  // 🔥 Changement de période - Appelle juste setPeriod
  const handlePeriodChange = (newPeriod: TimePeriod) => {
    setPeriod(newPeriod);
  };

  // KPIs non-financiers
  const platformKPIs: FinancialKPI[] = [
    { 
      label: 'Sociétés de Transport', 
      value: transportCompanies.length.toLocaleString(), 
      rawValue: transportCompanies.length,
      change: `${transportCompanies.filter(c => c.status === 'active').length} actives`,
      changeValue: transportCompanies.filter(c => c.status === 'active').length,
      trend: 'up',
      format: 'number',
      subtext: `${transportCompanies.filter(c => c.status === 'pending').length} en attente`,
      icon: 'Building2',
      color: 'red',
    },
    { 
      label: 'Passagers Inscrits', 
      value: passengers.length.toLocaleString(), 
      rawValue: passengers.length,
      change: `${passengers.filter(p => p.verified).length} vérifiés`,
      changeValue: passengers.filter(p => p.verified).length,
      trend: 'up',
      format: 'number',
      subtext: `${passengers.filter(p => p.status === 'active').length} actifs`,
      icon: 'Users',
      color: 'blue',
    },
    { 
      label: 'Gares/Stations', 
      value: stations.length.toLocaleString(), 
      rawValue: stations.length,
      change: 'Infrastructure réseau',
      changeValue: stations.length,
      trend: 'up',
      format: 'number',
      subtext: 'Points de départ et arrivée',
      icon: 'MapPin',
      color: 'green',
    },
  ];

  // Distribution des statuts des sociétés
  const companyStatusData = [
    { 
      name: 'Actives', 
      value: transportCompanies.filter(c => c.status === 'active').length, 
      color: COLORS.green 
    },
    { 
      name: 'En attente', 
      value: transportCompanies.filter(c => c.status === 'pending').length, 
      color: COLORS.yellow 
    },
    { 
      name: 'Suspendues', 
      value: transportCompanies.filter(c => c.status === 'suspended').length, 
      color: COLORS.red 
    }
  ];

  // Tickets support par priorité
  const ticketsByPriority = [
    { 
      name: 'Urgent', 
      value: supportTickets.filter(t => t.priority === 'urgent').length, 
      color: COLORS.red 
    },
    { 
      name: 'Élevée', 
      value: supportTickets.filter(t => t.priority === 'high').length, 
      color: COLORS.yellow 
    },
    { 
      name: 'Normale', 
      value: supportTickets.filter(t => t.priority === 'normal').length, 
      color: COLORS.blue 
    }
  ];

  return (
    <div className={PAGE_CLASSES.container}>
      {/* Header */}
      <div className={PAGE_CLASSES.header}>
        <div className={PAGE_CLASSES.headerContent}>
          <div className={PAGE_CLASSES.headerTexts}>
            <h1 className="text-4xl text-gray-900 dark:text-white mb-2 tracking-tight">Analytics Plateforme</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">Vue d'ensemble des performances de l'écosystème FasoTravel</p>
          </div>
          <div className={PAGE_CLASSES.headerActions}>
            <select
              aria-label="Période d'analyse"
              value={period}
              onChange={(e) => handlePeriodChange(e.target.value as TimePeriod)}
              className="px-6 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-red-500 transition-all dark:text-white"
            >
              <option value={TimePeriod.TODAY}>Aujourd'hui</option>
              <option value={TimePeriod.WEEK}>Cette semaine</option>
              <option value={TimePeriod.MONTH}>Ce mois</option>
              <option value={TimePeriod.YEAR}>Cette année</option>
            </select>
          </div>
        </div>
      </div>

      {/* 🔥 KPIs COMBINÉS - Financiers + Plateforme */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            {/* KPIs Financiers */}
            {financialKPIs.map((kpi, index) => (
              <FinancialKPICard key={`financial-kpi-${index}`} kpi={kpi} />
            ))}
            {/* KPIs Plateforme */}
            {platformKPIs.map((kpi, index) => (
              <FinancialKPICard key={`platform-kpi-${index}`} kpi={kpi} />
            ))}
      </div>

      {/* 🔥 GRAPHIQUES FINANCIERS */}
      {metrics && (
        <>
          {/* Section 1: Évolutions */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
            {/* Évolution Revenus */}
            <RevenueChart
              data={metrics.dailyRevenue}
              title="Évolution des Revenus"
              subtitle={`Revenus sur ${period === TimePeriod.WEEK ? '7 jours' : period === TimePeriod.MONTH ? '30 jours' : 'la période'}`}
              growth={metrics.revenue.growthRate}
              theme={theme}
              type="line"
              color="#10b981"
              period={period}
            />

            {/* Statuts des sociétés */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 transition-colors">
              <div className="mb-6">
                <h3 className="text-xl text-gray-900 dark:text-white mb-1">Statuts des Sociétés</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Distribution par statut</p>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={companyStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {companyStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme === 'dark' ? '#1f2937' : 'white', 
                      border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                      color: theme === 'dark' ? '#f9fafb' : '#111827'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3 mt-4">
                {companyStatusData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{item.name}</span>
                    </div>
                    <span className="text-sm text-gray-900 dark:text-white font-semibold">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Top Sociétés & Paiements */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
            {/* Top Sociétés par Revenus */}
            <TopCompaniesChart
              data={metrics.topCompaniesByRevenue}
              title="Top Sociétés par Revenus"
              subtitle="Classement des plus performantes"
              metric="revenue"
              theme={theme}
              color="#10b981"
            />

            {/* Distribution Méthodes de Paiement */}
            <PaymentMethodsDistribution
              data={metrics.paymentMethods}
              totalTransactions={metrics.transactions.totalCount}
              successRate={metrics.transactions.successRate}
              theme={theme}
            />
          </div>

          {/* Section 3: Transactions & Support */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Volume Transactions */}
            <RevenueChart
              data={metrics.dailyRevenue}
              title="Volume des Transactions"
              subtitle={`${metrics.transactions.totalCount.toLocaleString()} transactions sur la période`}
              growth={(metrics.transactions.successRate - 95) * 2}
              theme={theme}
              type="bar"
              color="#3b82f6"
              showGrowthBadge={false}
              period={period}
            />

            {/* Support par priorité */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 transition-colors">
              <div className="mb-6">
                <h3 className="text-xl text-gray-900 dark:text-white mb-1">Tickets Support</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Par niveau de priorité</p>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={ticketsByPriority}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {ticketsByPriority.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme === 'dark' ? '#1f2937' : 'white', 
                      border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                      color: theme === 'dark' ? '#f9fafb' : '#111827'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3 mt-4">
                {ticketsByPriority.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{item.name}</span>
                    </div>
                    <span className="text-sm text-gray-900 dark:text-white font-semibold">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default AnalyticsDashboard;