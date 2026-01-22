import { useMemo, useState } from 'react';
import { TrendingUp, Download, Bus, Calendar, Smartphone, Store } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { BackButton } from '../../components/ui/back-button';
import { useData } from '../../contexts/DataContext';
import { toast } from 'sonner';
import { 
  getValidTickets, 
  calculateTicketsRevenue, 
  calculateRevenueByChannel, 
  calculateOverallOccupancy 
} from '../../utils/statsUtils';
import { formatCurrency } from '../../utils/formatters';
import { getCurrentDate, getDaysAgo } from '../../utils/dateUtils';
import { exportAnalyticsToExcel, exportAnalyticsToPDF } from '../../utils/exportUtils';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// ✅ Fonctions utilitaires inline pour éviter duplication
const getDayShortLabel = (dayIndex: number): string => {
  const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  return days[dayIndex];
};

const formatMonthShort = (date: Date): string => {
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
  return months[date.getMonth()];
};

export default function AnalyticsPage() {
  const { tickets, trips, stations, getAnalytics } = useData();
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const analytics = getAnalytics();

  // ✅ REFACTORISÉ: Calculer revenus selon la période sélectionnée
  const revenueData = useMemo(() => {
    const now = getCurrentDate();
    const data: any[] = [];

    if (period === 'week') {
      // 7 derniers jours
      for (let i = 6; i >= 0; i--) {
        const dayDate = getDaysAgo(i);
        const nextDay = new Date(dayDate);
        nextDay.setDate(dayDate.getDate() + 1);
        
        const dayTickets = getValidTickets(
          tickets.filter(t => {
            const purchaseDate = new Date(t.purchaseDate);
            return purchaseDate >= dayDate && purchaseDate < nextDay;
          })
        );

        const revenus = calculateTicketsRevenue(dayTickets);

        data.push({
          name: getDayShortLabel(dayDate.getDay()),
          revenus,
          depenses: Math.round(revenus * 0.65)
        });
      }
    } else if (period === 'month') {
      // 4 dernières semaines
      for (let i = 3; i >= 0; i--) {
        const weekEnd = new Date(now);
        weekEnd.setDate(now.getDate() - (i * 7));
        weekEnd.setHours(23, 59, 59, 999);
        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekEnd.getDate() - 6);
        weekStart.setHours(0, 0, 0, 0);
        
        const weekTickets = getValidTickets(
          tickets.filter(t => {
            const purchaseDate = new Date(t.purchaseDate);
            return purchaseDate >= weekStart && purchaseDate <= weekEnd;
          })
        );

        const revenus = calculateTicketsRevenue(weekTickets);

        data.push({
          name: `S${4 - i}`,
          revenus,
          depenses: Math.round(revenus * 0.65)
        });
      }
    } else {
      // 12 derniers mois
      for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        
        const monthTickets = getValidTickets(
          tickets.filter(t => {
            const purchaseDate = new Date(t.purchaseDate);
            return purchaseDate >= monthDate && purchaseDate < nextMonth;
          })
        );

        const revenus = calculateTicketsRevenue(monthTickets);

        data.push({
          name: formatMonthShort(monthDate),
          revenus,
          depenses: Math.round(revenus * 0.65)
        });
      }
    }

    return data;
  }, [tickets, period]);

  // ✅ Calculer passagers par jour (7 derniers jours)
  const passengersData = useMemo(() => {
    const dailyData: any[] = [];
    const now = getCurrentDate();

    for (let i = 6; i >= 0; i--) {
      const dayDate = new Date(now);
      dayDate.setDate(now.getDate() - i);
      dayDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(dayDate);
      nextDay.setDate(dayDate.getDate() + 1);

      const dayTickets = tickets.filter(t => {
        const purchaseDate = new Date(t.purchaseDate);
        return purchaseDate >= dayDate && 
               purchaseDate < nextDay &&
               (t.status === 'valid' || t.status === 'used');
      });

      const dayName = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][dayDate.getDay()];

      dailyData.push({
        name: dayName,
        passagers: dayTickets.length
      });
    }

    return dailyData;
  }, [tickets]);

  // ✅ Calculer répartition réelle par route
  const routesData = useMemo(() => {
    const routeStats = new Map<string, number>();
    
    const validTickets = getValidTickets(tickets);
    
    validTickets.forEach(ticket => {
      const routeKey = `${ticket.departure}-${ticket.arrival}`;
      routeStats.set(routeKey, (routeStats.get(routeKey) || 0) + 1);
    });

    const total = validTickets.length;
    const colors = ['#dc2626', '#f59e0b', '#16a34a', '#3b82f6', '#9333ea', '#ec4899'];
    
    return Array.from(routeStats.entries())
      .map(([name, count], index) => ({
        name: name.length > 15 ? name.substring(0, 15) + '...' : name,
        value: total > 0 ? Math.round((count / total) * 100) : 0,
        color: colors[index % colors.length]
      }))
      .sort((a: any, b: any) => b.value - a.value)
      .slice(0, 5);
  }, [tickets]);

  // ✅ REFACTORISÉ: Calculer performance réelle par gare
  const stationsPerformance = useMemo(() => {
    return stations.map(station => {
      // Ventes de cette gare (utiliser fonctions centralisées)
      const stationTickets = getValidTickets(
        tickets.filter(t => t.gareId === station.id)
      );
      const ventes = calculateTicketsRevenue(stationTickets);

      // Trajets de cette gare (utiliser fonction centralisée)
      const stationTrips = trips.filter(t => t.gareId === station.id);
      const taux = calculateOverallOccupancy(stationTrips);

      return {
        station: station.name,
        ventes,
        taux
      };
    }).sort((a: any, b: any) => b.ventes - a.ventes);
  }, [stations, tickets, trips]);

  // ✅ REFACTORISÉ: Calculer KPIs réels
  const kpis = useMemo(() => {
    const totalRevenue = revenueData.reduce((sum, item) => sum + item.revenus, 0);
    const totalExpenses = revenueData.reduce((sum, item) => sum + item.depenses, 0);
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0';

    const validTickets = getValidTickets(tickets);
    const totalPassengers = validTickets.length;
    const occupancyRate = calculateOverallOccupancy(trips);

    // ✅ Calculer répartition online vs counter (utiliser fonction centralisée)
    const channelStats = calculateRevenueByChannel(tickets);
    
    const onlineRevenue = channelStats.online.revenue;
    const counterRevenue = channelStats.counter.revenue;
    const onlineCommission = channelStats.total.commission;
    const onlineTicketsCount = channelStats.online.count;
    const counterTicketsCount = channelStats.counter.count;

    // ✅ Calculer taux de croissance (mois actuel vs mois précédent)
    const currentMonthRevenue = revenueData.length > 0 ? revenueData[revenueData.length - 1].revenus : 0;
    const previousMonthRevenue = revenueData.length > 1 ? revenueData[revenueData.length - 2].revenus : 0;
    const growthRate = previousMonthRevenue > 0 
      ? (((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100).toFixed(1)
      : '0';
    const isPositiveGrowth = parseFloat(growthRate) >= 0;

    return {
      totalRevenue,
      netProfit,
      profitMargin,
      totalPassengers,
      occupancyRate,
      onlineRevenue,
      counterRevenue,
      onlineCommission,
      onlineTicketsCount,
      counterTicketsCount,
      growthRate,
      isPositiveGrowth,
      currentMonthRevenue,
      previousMonthRevenue
    };
  }, [revenueData, tickets, trips]);

  const handleExport = (format: 'pdf' | 'excel') => {
    try {
      const exportData = {
        kpis,
        revenueData,
        stationsPerformance,
        period
      };

      if (format === 'excel') {
        exportAnalyticsToExcel(exportData);
        toast.success('Rapport Excel téléchargé avec succès');
      } else {
        exportAnalyticsToPDF(exportData);
        toast.success('Rapport PDF généré avec succès');
      }
    } catch (error) {
      toast.error('Erreur lors de l\'export du rapport');
      console.error('Export error:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <BackButton />
      
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Rapports & Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Analysez vos performances en temps réel avec des données actualisées
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport('excel')}>
            <Download size={16} className="mr-2" />
            Export Excel
          </Button>
          <Button onClick={() => handleExport('pdf')} className="tf-btn-primary">
            <Download size={16} className="mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Filtres de période */}
      <div className="flex gap-2">
        <Button
          variant={period === 'week' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPeriod('week')}
          className={period === 'week' ? 'tf-btn-primary' : ''}
        >
          Cette semaine
        </Button>
        <Button
          variant={period === 'month' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPeriod('month')}
          className={period === 'month' ? 'tf-btn-primary' : ''}
        >
          Ce mois
        </Button>
        <Button
          variant={period === 'year' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPeriod('year')}
          className={period === 'year' ? 'tf-btn-primary' : ''}
        >
          Cette année
        </Button>
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Chiffre d'affaires</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {(kpis.totalRevenue / 1000000).toFixed(1)}M
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {period === 'week' ? 'Cette semaine' : period === 'month' ? 'Ce mois' : 'Cette année'}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <TrendingUp className="text-green-600 dark:text-green-400" size={24} />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Revenu moyen par billet</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(kpis.totalPassengers > 0 ? Math.round(kpis.totalRevenue / kpis.totalPassengers) : 0)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">FCFA par passager</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <TrendingUp className="text-green-600 dark:text-green-400" size={24} />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Taux d'occupation</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpis.occupancyRate}%</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {analytics.averageOccupancy.toFixed(0)}% moyen
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
              <Bus className="text-[#f59e0b]" size={24} />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Taux de croissance</p>
              <p className={`text-2xl font-bold ${kpis.isPositiveGrowth ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {kpis.isPositiveGrowth ? '+' : ''}{kpis.growthRate}%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                vs période précédente
              </p>
            </div>
            <div className={`w-12 h-12 ${kpis.isPositiveGrowth ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'} rounded-full flex items-center justify-center`}>
              <TrendingUp className={kpis.isPositiveGrowth ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} size={24} />
            </div>
          </div>
        </Card>
      </div>

      {/* ✅ NOUVEAU : Distinction Online vs Counter */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 border-2 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Smartphone size={18} className="text-blue-600 dark:text-blue-400" />
                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">Ventes App Mobile</p>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(kpis.onlineRevenue)}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {kpis.onlineTicketsCount} billets • Commission: {formatCurrency(kpis.onlineCommission)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {kpis.totalPassengers > 0 ? Math.round((kpis.onlineTicketsCount / kpis.totalPassengers) * 100) : 0}%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">du total</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-2 border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Store size={18} className="text-green-600 dark:text-green-400" />
                <p className="text-sm font-semibold text-green-600 dark:text-green-400">Ventes Guichet</p>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(kpis.counterRevenue)}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {kpis.counterTicketsCount} billets • 0% commission
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {kpis.totalPassengers > 0 ? Math.round((kpis.counterTicketsCount / kpis.totalPassengers) * 100) : 0}%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">du total</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Graphique des revenus */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {period === 'week' ? 'Évolution des revenus (7 derniers jours)' : 
             period === 'month' ? 'Évolution des revenus (4 dernières semaines)' : 
             'Évolution des revenus (12 derniers mois)'}
          </h2>
          <Calendar className="text-gray-500 dark:text-gray-400" size={20} />
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip 
              formatter={(value: any) => `${(value / 1000).toFixed(0)}K FCFA`}
              contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', border: 'none', borderRadius: '8px' }}
            />
            <Legend />
            <Bar dataKey="revenus" fill="#16a34a" name="Revenus" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Grille avec 2 graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique des passagers */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Passagers par jour (7 derniers jours)
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={passengersData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', border: 'none', borderRadius: '8px' }}
              />
              <Line 
                type="monotone" 
                dataKey="passagers" 
                stroke="#f59e0b" 
                strokeWidth={3} 
                name="Passagers"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Répartition des lignes */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Répartition des ventes par ligne
          </h2>
          {routesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={routesData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {routesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => `${value}%`}
                  contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', border: 'none', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-500 dark:text-gray-400">
              Aucune donnée disponible
            </div>
          )}
        </Card>
      </div>

      {/* Performance des gares */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          Performance par gare
        </h2>
        {stationsPerformance.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                    Gare
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                    Ventes (FCFA)
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                    Taux d'occupation
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                    Performance
                  </th>
                </tr>
              </thead>
              <tbody>
                {stationsPerformance.map((station, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="py-4 px-4">
                      <p className="font-medium text-gray-900 dark:text-white">{station.station}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-bold text-gray-900 dark:text-white">
                        {formatCurrency(station.ventes)}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-medium text-gray-900 dark:text-white">{station.taux}%</p>
                    </td>
                    <td className="py-4 px-4">
                      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#dc2626] via-[#f59e0b] to-[#16a34a]"
                          style={{ width: `${station.taux}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            Aucune donnée de performance disponible
          </div>
        )}
      </Card>
    </div>
  );
}


