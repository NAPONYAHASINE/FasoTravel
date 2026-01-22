import { useNavigate } from 'react-router-dom';
import { Clock, DollarSign, MapPin, ShoppingCart, TrendingUp, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFilteredData } from '../../hooks/useFilteredData';
import { useTripStats } from '../../hooks/useDashboardStats';
import { useCashierStats } from '../../hooks/useCashierStats';
import { formatAmount, calculateTripOccupancy } from '../../utils/statsUtils';
import { formatTime } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/formatters';
import StatCard from '../../components/dashboard/StatCard';
import { Card } from '../../components/ui/card';

export default function DashboardHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tickets, cashTransactions, trips } = useFilteredData();

  // ✅ REFACTORISÉ: Utilise le hook centralisé pour éviter la duplication
  const { todayStats, salesTrend, recentSales } = useCashierStats({
    tickets,
    cashTransactions,
    cashierId: user?.id || '',
    limit: 5
  });

  // ✅ Trips à venir (réutilise le hook existant)
  const { upcomingTrips } = useTripStats(trips, 4);

  const stats = [
    {
      title: 'Ventes du Jour',
      value: formatAmount(todayStats.totalSales),
      change: salesTrend.changeFormatted,
      trend: salesTrend.trend,
      icon: DollarSign,
      color: 'green' as const,
      subtitle: 'FCFA'
    },
    {
      title: 'Billets Vendus',
      value: todayStats.ticketCount.toString(),
      change: "Aujourd'hui",
      trend: 'neutral' as const,
      icon: ShoppingCart,
      color: 'yellow' as const,
      subtitle: 'Transactions'
    },
    {
      title: 'Caisse',
      value: formatAmount(todayStats.cashBalance),
      change: 'En main',
      trend: 'neutral' as const,
      icon: Users,
      color: 'red' as const,
      subtitle: 'FCFA'
    },
    {
      title: 'Prochains Départs',
      value: upcomingTrips.length.toString(),
      change: '4h',
      trend: 'neutral' as const,
      icon: TrendingUp,
      color: 'green' as const,
      subtitle: 'Disponibles'
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

      {/* Ventes récentes + Prochains départs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventes récentes */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Ventes Récentes
            </h3>
            <button 
              onClick={() => navigate('/caissier/historique')}
              className="text-sm text-[#f59e0b] hover:text-[#d97706] font-medium"
            >
              Voir tout
            </button>
          </div>

          {recentSales.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <ShoppingCart size={48} className="mx-auto mb-3 opacity-30" />
              <p>Aucune vente récente</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentSales.map((ticket: any) => (
                <div
                  key={ticket.id}
                  className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-[#f59e0b] transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {ticket.passengerName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {ticket.departure} → {ticket.arrival}
                      </p>
                    </div>
                    <p className="font-bold text-[#f59e0b]">
                      {formatCurrency(ticket.price)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{formatTime(ticket.purchaseDate)}</span>
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
              onClick={() => navigate('/caissier/vente')}
              className="text-sm text-[#f59e0b] hover:text-[#d97706] font-medium"
            >
              Vendre
            </button>
          </div>

          {upcomingTrips.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <MapPin size={48} className="mx-auto mb-3 opacity-30" />
              <p>Aucun départ imminent</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingTrips.map((trip: any) => {
                const occupancyRate = calculateTripOccupancy(trip);
                
                return (
                  <div
                    key={trip.id}
                    className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-[#f59e0b] transition-colors cursor-pointer"
                    onClick={() => navigate('/caissier/vente')}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white mb-1">
                          {trip.departure} → {trip.arrival}
                        </p>
                        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Clock size={14} />
                            <span>{formatTime(trip.departureTime)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users size={14} />
                            <span>{trip.availableSeats} places</span>
                          </div>
                        </div>
                      </div>
                      <p className="font-bold text-[#f59e0b]">
                        {formatCurrency(trip.price)}
                      </p>
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
            onClick={() => navigate('/caissier/vente')}
            className="p-6 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-[#f59e0b] hover:bg-[#f59e0b]/5 transition-all text-gray-900 dark:text-white"
          >
            <ShoppingCart size={32} className="mx-auto mb-3 text-[#f59e0b]" />
            <p className="font-medium">Vendre un billet</p>
          </button>

          <button
            onClick={() => navigate('/caissier/caisse')}
            className="p-6 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-[#16a34a] hover:bg-[#16a34a]/5 transition-all text-gray-900 dark:text-white"
          >
            <DollarSign size={32} className="mx-auto mb-3 text-[#16a34a]" />
            <p className="font-medium">Gérer la caisse</p>
          </button>

          <button
            onClick={() => navigate('/caissier/annulation')}
            className="p-6 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-[#dc2626] hover:bg-[#dc2626]/5 transition-all text-gray-900 dark:text-white"
          >
            <TrendingUp size={32} className="mx-auto mb-3 text-[#dc2626]" />
            <p className="font-medium">Rembourser</p>
          </button>
        </div>
      </Card>
    </div>
  );
}



