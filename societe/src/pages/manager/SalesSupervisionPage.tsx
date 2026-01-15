import { useMemo, useState } from 'react';
import { ArrowLeft, DollarSign, Users, CreditCard, Smartphone, Banknote, Eye } from 'lucide-react@0.487.0';
import { useNavigate } from 'react-router-dom';
import { useFilteredData } from '../../hooks/useFilteredData';
import { useAuth } from '../../contexts/AuthContext';
import StatCard from '../../components/dashboard/StatCard';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { 
  calculateTicketsRevenue, 
  calculateRevenueByPaymentMethod,
  getValidTickets 
} from '../../utils/statsUtils';
import { filterByToday, filterByYesterday, getDaysAgo } from '../../utils/dateUtils';
import { formatCurrency, calculatePercentage } from '../../utils/formatters';
import { getPaymentMethodLabel } from '../../utils/labels';

export default function SalesSupervisionPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tickets, cashiers } = useFilteredData();
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'yesterday' | 'week'>('today');

  // ✅ REFACTORISÉ: Filter tickets based on selected period
  const filteredTickets = useMemo(() => {
    switch (selectedPeriod) {
      case 'today':
        return filterByToday(tickets, 'purchaseDate');
      case 'yesterday':
        return filterByYesterday(tickets, 'purchaseDate');
      case 'week':
        const weekAgo = getDaysAgo(7);
        return tickets.filter(t => new Date(t.purchaseDate) >= weekAgo);
      default:
        return tickets;
    }
  }, [tickets, selectedPeriod]);

  // ✅ REFACTORISÉ: Calculer les statistiques réelles avec fonctions centralisées
  const stats = useMemo(() => {
    const validTickets = getValidTickets(filteredTickets);
    const totalSales = calculateTicketsRevenue(validTickets);
    const paymentStats = calculateRevenueByPaymentMethod(validTickets);

    return {
      totalSales,
      cashSales: paymentStats.cash,
      mobileSales: paymentStats.mobileMoney,
      cardSales: paymentStats.card,
      ticketCount: validTickets.length,
    };
  }, [filteredTickets]);

  // ✅ REFACTORISÉ: Regrouper par caissier avec vraies données
  const cashierStats = useMemo(() => {
    const statsMap = new Map();

    // Parcourir tous les caissiers actifs
    cashiers.filter(c => c.status === 'active').forEach(cashier => {
      const cashierTickets = filteredTickets.filter(t => t.cashierId === cashier.id);
      const validTickets = getValidTickets(cashierTickets);
      const total = calculateTicketsRevenue(validTickets);
      
      statsMap.set(cashier.id, {
        name: cashier.name,
        ticketCount: validTickets.length,
        total
      });
    });

    return Array.from(statsMap.values())
      .filter(s => s.ticketCount > 0) // Seulement ceux avec des ventes
      .sort((a, b) => b.total - a.total);
  }, [cashiers, filteredTickets]);

  return (
    <div className="p-6 space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400"
      >
        <ArrowLeft size={20} />
        Retour
      </button>
      
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Supervision des Ventes
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Consultation en lecture seule des ventes de tous les caissiers de {user?.gareName || 'la gare'}
          </p>
        </div>

        {/* Filtre */}
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedPeriod('today')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedPeriod === 'today'
                ? 'bg-gradient-to-r from-[#dc2626] via-[#f59e0b] to-[#16a34a] text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Aujourd'hui
          </button>
          <button
            onClick={() => setSelectedPeriod('yesterday')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedPeriod === 'yesterday'
                ? 'bg-gradient-to-r from-[#dc2626] via-[#f59e0b] to-[#16a34a] text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Hier
          </button>
          <button
            onClick={() => setSelectedPeriod('week')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedPeriod === 'week'
                ? 'bg-gradient-to-r from-[#dc2626] via-[#f59e0b] to-[#16a34a] text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Semaine
          </button>
        </div>
      </div>

      {/* Alerte lecture seule */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <Eye className="text-blue-600 dark:text-blue-400 flex-shrink-0" size={24} />
          <div>
            <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-1">
              Mode consultation uniquement
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Vous pouvez visualiser toutes les ventes mais vous ne pouvez pas les modifier ou les annuler. 
              Seuls les caissiers peuvent annuler leurs propres ventes.
            </p>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total des ventes"
          value={formatCurrency(stats.totalSales)}
          change={`${stats.ticketCount} billets`}
          trend="up"
          icon={DollarSign}
          color="green"
        />

        <StatCard
          title="Espèces"
          value={formatCurrency(stats.cashSales)}
          change="Paiement cash"
          trend="neutral"
          icon={Banknote}
          color="blue"
        />

        <StatCard
          title="Mobile Money"
          value={formatCurrency(stats.mobileSales)}
          change="Paiement mobile"
          trend="neutral"
          icon={Smartphone}
          color="yellow"
        />

        <StatCard
          title="Carte bancaire"
          value={formatCurrency(stats.cardSales)}
          change="Paiement carte"
          trend="neutral"
          icon={CreditCard}
          color="blue"
        />
      </div>

      {/* Tableau des ventes */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Historique des ventes ({filteredTickets.length})
        </h2>
        
        {filteredTickets.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Users size={48} className="mx-auto mb-3 opacity-30" />
            <p className="text-lg">Aucune vente pour cette période</p>
            <p className="text-sm">Les ventes apparaîtront ici dès qu'un caissier vendra un billet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">N° Ticket</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Heure</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Trajet</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Client</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Siège</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Paiement</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Montant</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Vendu par</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-4">
                      <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                        {ticket.id.substring(0, 12)}...
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                      {new Date(ticket.purchaseDate).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                      {ticket.departure} - {ticket.arrival}
                    </td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{ticket.passengerName}</td>
                    <td className="py-3 px-4">
                      <Badge className="bg-[#f59e0b] text-white">{ticket.seatNumber}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      {getPaymentMethodLabel(ticket.paymentMethod)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(ticket.price)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{ticket.cashierName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Répartition par caissier */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Performance par caissier
        </h2>
        
        {cashierStats.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>Aucun caissier n'a encore effectué de vente pour cette période</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cashierStats.map(cashier => (
              <div key={cashier.name} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#dc2626] via-[#f59e0b] to-[#16a34a] rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">
                      {cashier.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{cashier.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {cashier.ticketCount} billets vendus
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(cashier.total)}
                  </p>
                  {stats.totalSales > 0 && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {calculatePercentage(cashier.total, stats.totalSales)}% du total
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}