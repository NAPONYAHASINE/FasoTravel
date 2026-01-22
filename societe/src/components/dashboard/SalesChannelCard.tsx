import { useMemo, useState } from 'react';
import { TrendingUp, Smartphone, Store, DollarSign } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import type { Ticket } from '../../contexts/DataContext';
import { calculateRevenueByChannel } from '../../utils/statsUtils';
import { getCurrentDate } from '../../utils/dateUtils';

interface SalesChannelCardProps {
  tickets: Ticket[];
}

type PeriodFilter = 'all' | '1year' | 'month' | 'week' | 'today';

export default function SalesChannelCard({ tickets }: SalesChannelCardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('today');

  // Filtrer les tickets selon la période
  const filteredTickets = useMemo(() => {
    if (selectedPeriod === 'all') return tickets;

    const now = getCurrentDate();
    const filterDate = new Date(now);

    switch (selectedPeriod) {
      case '1year':
        filterDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'month':
        filterDate.setMonth(now.getMonth() - 1);
        break;
      case 'week':
        filterDate.setDate(now.getDate() - 7);
        break;
      case 'today':
        filterDate.setHours(0, 0, 0, 0);
        break;
    }

    return tickets.filter(t => {
      const purchaseDate = new Date(t.purchaseDate);
      return purchaseDate >= filterDate;
    });
  }, [tickets, selectedPeriod]);

  // ✅ Utilise la fonction centralisée pour éviter duplication
  const channelStats = useMemo(() => 
    calculateRevenueByChannel(filteredTickets),
    [filteredTickets]
  );

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' F';
  };

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'all': return 'Tout l\'historique';
      case '1year': return '12 derniers mois';
      case 'month': return '30 derniers jours';
      case 'week': return '7 derniers jours';
      case 'today': return 'Aujourd\'hui';
    }
  };

  const { online, counter, total } = channelStats;
  const adoptionRate = online.percentage;

  const periodButtons: { value: PeriodFilter; label: string }[] = [
    { value: 'all', label: 'Tout' },
    { value: '1year', label: '1 an' },
    { value: 'month', label: 'Mois' },
    { value: 'week', label: 'Semaine' },
    { value: 'today', label: 'Aujourd\'hui' }
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <div>
            <CardTitle>Canal de Vente</CardTitle>
            <CardDescription className="mt-1 text-gray-600 dark:text-gray-400">
              App Mobile vs Guichet - {getPeriodLabel()}
            </CardDescription>
          </div>
          <Badge 
            variant={adoptionRate >= 50 ? 'default' : 'secondary'} 
            className={adoptionRate >= 50 ? 'bg-green-600' : 'bg-orange-500'}
          >
            {adoptionRate}% App
          </Badge>
        </div>

        {/* Filtres de période */}
        <div className="flex gap-2 flex-wrap">
          {periodButtons.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setSelectedPeriod(value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedPeriod === value
                  ? 'bg-[#f59e0b] text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Ventes App Mobile (Online) */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Smartphone className="text-blue-600 dark:text-blue-400" size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                App Mobile
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {online.count} billets ({online.percentage}%)
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold text-gray-900 dark:text-white">
              {formatMoney(online.revenue)}
            </p>
            <p className="text-xs text-green-600 dark:text-green-400 font-medium">
              +{formatMoney(total.commission)} commission
            </p>
          </div>
        </div>

        {/* Ventes Guichet (Counter) */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <Store className="text-orange-600 dark:text-orange-400" size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Guichet
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {counter.count} billets ({counter.percentage}%)
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold text-gray-900 dark:text-white">
              {formatMoney(counter.revenue)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Pas de commission
            </p>
          </div>
        </div>

        {/* Barre de progression taux adoption */}
        <div className="pt-2">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Taux d'adoption App
              </span>
            </div>
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {adoptionRate}%
            </span>
          </div>
          <Progress 
            value={adoptionRate} 
            className="h-2"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {adoptionRate >= 60 
              ? '✓ Objectif atteint (60%+)' 
              : `Objectif: 60% (${60 - adoptionRate}% à atteindre)`
            }
          </p>
        </div>

        {/* Résumé total */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Total Billets
            </p>
            <p className="font-bold text-gray-900 dark:text-white">
              {total.count}
            </p>
          </div>
          <div className="flex justify-between items-center mt-2">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Chiffre d'Affaires
            </p>
            <p className="font-bold text-gray-900 dark:text-white">
              {formatMoney(total.revenue)}
            </p>
          </div>
          <div className="flex justify-between items-center mt-2">
            <p className="text-sm font-medium text-green-700 dark:text-green-400">
              Commission Totale (5%)
            </p>
            <p className="font-bold text-green-700 dark:text-green-400">
              {formatMoney(total.commission)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

