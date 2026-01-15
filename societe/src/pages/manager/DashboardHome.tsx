import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, DollarSign, Bus, TrendingUp, Clock, MapPin, CheckCircle } from "lucide-react@0.487.0";
import { useFilteredData } from '../../hooks/useFilteredData';
import { useAuth } from '../../contexts/AuthContext';
import { useRevenueStats, useTripStats, useTodayTicketsCount } from '../../hooks/useDashboardStats';
import { formatCurrency } from '../../utils/formatters';
import { getActiveCashiers, getValidTickets, calculateCashBalance, calculateTicketsRevenue, formatAmount, calculateTripOccupancy } from '../../utils/statsUtils';
import { filterByToday } from '../../utils/dateUtils';
import { getTripStatusLabel } from '../../utils/labels';
import { getTripStatusBadgeInfo } from '../../utils/styleUtils';
import StatCard from '../../components/dashboard/StatCard';
import TripCard from '../../components/dashboard/TripCard';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import type { Trip } from '../../contexts/DataContext';

export default function DashboardHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cashiers, tickets, trips, cashTransactions } = useFilteredData();

  // Use custom hooks for stats
  const { todayRevenue, revenueChangeFormatted, revenueTrend } = useRevenueStats(tickets);
  const { activeTrips, upcomingTrips, activeTripsCount } = useTripStats(trips, 4);
  const todayTicketsCount = useTodayTicketsCount(tickets);

  // Active cashiers (those who made at least one transaction today)
  const activeCashiers = useMemo(() => {
    const todayTransactions = filterByToday(cashTransactions, 'timestamp');
    const activeCashierIds = new Set(todayTransactions.map(t => t.cashierId));
    return cashiers.filter(c => activeCashierIds.has(c.id) && c.status === 'active');
  }, [cashiers, cashTransactions]);

  // Upcoming departures (next 4 hours) - limited to 4
  const upcomingDepartures = useMemo(() => 
    upcomingTrips.slice(0, 4),
    [upcomingTrips]
  );

  // Cashier performance
  const cashierPerformance = useMemo(() => {
    const todayTickets = filterByToday(tickets, 'purchaseDate');

    return cashiers
      .filter(c => c.status === 'active')
      .map(cashier => {
        const cashierTickets = getValidTickets(
          todayTickets.filter(t => t.cashierId === cashier.id)
        );

        const cashierTransactions = filterByToday(
          cashTransactions.filter(t => t.cashierId === cashier.id),
          'timestamp'
        );

        const cashBalance = calculateCashBalance(cashierTransactions);

        return {
          ...cashier,
          sales: cashierTickets.length,
          revenue: calculateTicketsRevenue(cashierTickets),
          cashBalance,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);
  }, [cashiers, tickets, cashTransactions]);

  const stats = [
    {
      title: 'Caissiers Actifs',
      value: activeCashiers.length.toString(),
      change: `sur ${cashiers.filter(c => c.status === 'active').length}`,
      trend: 'neutral' as const,
      icon: Users,
      color: 'yellow' as const,
      subtitle: 'En service'
    },
    {
      title: 'Revenus du Jour',
      value: formatAmount(todayRevenue, 'K'),
      change: revenueChangeFormatted,
      trend: revenueTrend,
      icon: DollarSign,
      color: 'green' as const,
      subtitle: 'FCFA'
    },
    {
      title: 'Départs Actifs',
      value: activeTripsCount.toString(),
      change: "En cours",
      trend: 'neutral' as const,
      icon: Bus,
      color: 'red' as const,
      subtitle: 'Trajets'
    },
    {
      title: 'Billets Vendus',
      value: todayTicketsCount.toString(),
      change: "Aujourd'hui",
      trend: 'up' as const,
      icon: TrendingUp,
      color: 'green' as const,
      subtitle: 'Transactions'
    }
  ];

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Stats principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Performance Caissiers + Prochains Départs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance des caissiers */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Performance des Caissiers
            </h3>
            <button 
              onClick={() => navigate('/manager/caissiers')}
              className="text-sm text-[#f59e0b] hover:text-[#d97706] font-medium"
            >
              Voir détails
            </button>
          </div>

          {cashierPerformance.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Users size={48} className="mx-auto mb-3 opacity-30" />
              <p>Aucun caissier actif</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cashierPerformance.slice(0, 4).map((cashier) => (
                <div
                  key={cashier.id}
                  className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-[#f59e0b] transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {cashier.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={
                          cashier.sales > 0 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                        }>
                          {cashier.sales > 0 ? 'Actif' : 'Inactif'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Ventes</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {cashier.sales}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Caisse</p>
                      <p className="font-semibold text-[#f59e0b]">
                        {formatAmount(cashier.revenue, 'K')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Prochains départs */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Prochains Départs
            </h3>
            <button 
              onClick={() => navigate('/manager/departs')}
              className="text-sm text-[#f59e0b] hover:text-[#d97706] font-medium"
            >
              Gérer
            </button>
          </div>

          {upcomingDepartures.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Bus size={48} className="mx-auto mb-3 opacity-30" />
              <p>Aucun départ imminent</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingDepartures.map((trip) => {
                const occupancyRate = calculateTripOccupancy(trip);
                
                return (
                  <div
                    key={trip.id}
                    className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-[#f59e0b] transition-colors cursor-pointer"
                    onClick={() => navigate('/manager/departs')}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {trip.departure} → {trip.arrival}
                          </p>
                          <Badge className={getTripStatusBadgeInfo(trip.status).color}>
                            {getTripStatusLabel(trip.status)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Clock size={14} />
                            <span>{new Date(trip.departureTime).toLocaleTimeString('fr-FR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}</span>
                          </div>
                          <span>Bus {trip.busNumber}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600 dark:text-gray-400">
                        {trip.totalSeats - trip.availableSeats}/{trip.totalSeats} places
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {occupancyRate.toFixed(0)}%
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all rounded-full"
                        style={{
                          width: `${occupancyRate}%`,
                          backgroundColor: occupancyRate >= 80 ? '#16a34a' : occupancyRate >= 50 ? '#f59e0b' : '#dc2626'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Actions Rapides
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/manager/departs')}
            className="p-6 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-[#f59e0b] hover:bg-[#f59e0b]/5 transition-all text-gray-900 dark:text-white"
          >
            <Bus size={32} className="mx-auto mb-3 text-[#f59e0b]" />
            <p className="font-medium">Gérer les départs</p>
          </button>

          <button
            onClick={() => navigate('/manager/caissiers')}
            className="p-6 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-[#16a34a] hover:bg-[#16a34a]/5 transition-all text-gray-900 dark:text-white"
          >
            <Users size={32} className="mx-auto mb-3 text-[#16a34a]" />
            <p className="font-medium">Gérer les caissiers</p>
          </button>

          <button
            onClick={() => navigate('/manager/ventes')}
            className="p-6 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-[#dc2626] hover:bg-[#dc2626]/5 transition-all text-gray-900 dark:text-white"
          >
            <DollarSign size={32} className="mx-auto mb-3 text-[#dc2626]" />
            <p className="font-medium">Superviser les ventes</p>
          </button>
        </div>
      </Card>
    </div>
  );
}