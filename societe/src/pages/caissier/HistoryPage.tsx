import { useMemo, useState } from 'react';
import { Card } from '../../components/ui/card';
import { BackButton } from '../../components/ui/back-button';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import { useFilteredData } from '../../hooks/useFilteredData';
import { getToday, getDaysAgo, formatDateTime } from '../../utils/dateUtils';
import { getTransactionTypeLabel, getPaymentMethodLabel } from '../../utils/labels';
import { formatCurrency } from '../../utils/formatters';
import { calculateSalesAmount, calculateRefundsAmount, calculateCashMovements, calculateNetRevenue } from '../../utils/statsUtils';
import { DollarSign, TrendingDown, TrendingUp, Wallet, Calendar, Filter } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

// Helper function to get period label
const getPeriodLabel = (period: 'today' | 'week' | 'month'): string => {
  switch (period) {
    case 'today':
      return "aujourd'hui";
    case 'week':
      return 'des 7 derniers jours';
    case 'month':
      return 'des 30 derniers jours';
  }
};

export default function HistoryPage() {
  const { user } = useAuth();
  const { cashTransactions } = useFilteredData();
  
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');

  // Get transactions based on selected period
  const filteredTransactions = useMemo(() => {
    let startDate: Date;
    
    if (period === 'today') {
      startDate = getToday();
    } else if (period === 'week') {
      startDate = getDaysAgo(7);
    } else {
      startDate = getDaysAgo(30);
    }

    return cashTransactions
      .filter(t => {
        const transDate = new Date(t.timestamp);
        return transDate >= startDate && t.status === 'completed';
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [cashTransactions, period]);

  // Calculate stats
  const stats = useMemo(() => {
    const salesAmount = calculateSalesAmount(filteredTransactions);
    const refundsAmount = calculateRefundsAmount(filteredTransactions);
    const cashMovements = calculateCashMovements(filteredTransactions);
    const netRevenue = calculateNetRevenue(filteredTransactions);

    return {
      sales: { count: cashMovements.salesCount, amount: salesAmount },
      refunds: { count: cashMovements.refundsCount, amount: refundsAmount },
      deposits: { count: cashMovements.depositsCount, amount: cashMovements.deposits },
      withdrawals: { count: cashMovements.withdrawalsCount, amount: cashMovements.withdrawals },
      netRevenue,
    };
  }, [filteredTransactions]);

  const getTypeInfo = (type: string) => {
    const configs = {
      sale: {
        label: getTransactionTypeLabel(type),
        icon: TrendingUp,
        color: 'bg-green-100 dark:bg-green-900/20',
        iconColor: 'text-green-600 dark:text-green-400',
      },
      refund: {
        label: getTransactionTypeLabel(type),
        icon: TrendingDown,
        color: 'bg-red-100 dark:bg-red-900/20',
        iconColor: 'text-red-600 dark:text-red-400',
      },
      deposit: {
        label: getTransactionTypeLabel(type),
        icon: Wallet,
        color: 'bg-blue-100 dark:bg-blue-900/20',
        iconColor: 'text-blue-600 dark:text-blue-400',
      },
      withdrawal: {
        label: getTransactionTypeLabel(type),
        icon: Wallet,
        color: 'bg-orange-100 dark:bg-orange-900/20',
        iconColor: 'text-orange-600 dark:text-orange-400',
      },
    };

    return configs[type as keyof typeof configs] || configs.sale;
  };

  const handleExport = () => {
    // Generate CSV data
    const csvData = filteredTransactions.map(t => {
      const typeInfo = getTypeInfo(t.type);
      return [
        formatDateTime(t.timestamp),
        typeInfo.label,
        t.description,
        getPaymentMethodLabel(t.method),
        t.amount,
        t.type === 'sale' || t.type === 'deposit' ? '+' : '-'
      ].join(',');
    }).join('\n');

    const csv = `Date,Type,Description,Mode de paiement,Montant,Sens\n${csvData}`;
    
    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historique-${period}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Historique exporté avec succès');
  };

  if (!user) return null;

  return (
    <div className="p-6 space-y-6">
      <BackButton />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Historique des Transactions
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Consultez l'historique de vos opérations
          </p>
        </div>
        <Button
          onClick={handleExport}
          variant="outline"
          disabled={filteredTransactions.length === 0}
        >
          <Calendar className="mr-2" size={18} />
          Exporter
        </Button>
      </div>

      {/* Period Filter */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-500 dark:text-gray-400" />
            <span className="font-medium text-gray-900 dark:text-white">Période:</span>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={period === 'today' ? 'default' : 'outline'}
              onClick={() => setPeriod('today')}
              className={period === 'today' ? 'bg-[#f59e0b] hover:bg-[#d97706]' : ''}
            >
              Aujourd'hui
            </Button>
            <Button
              size="sm"
              variant={period === 'week' ? 'default' : 'outline'}
              onClick={() => setPeriod('week')}
              className={period === 'week' ? 'bg-[#f59e0b] hover:bg-[#d97706]' : ''}
            >
              7 jours
            </Button>
            <Button
              size="sm"
              variant={period === 'month' ? 'default' : 'outline'}
              onClick={() => setPeriod('month')}
              className={period === 'month' ? 'bg-[#f59e0b] hover:bg-[#d97706]' : ''}
            >
              30 jours
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <TrendingUp className="text-green-600 dark:text-green-400" size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Ventes</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {stats.sales.count}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">
                +{formatCurrency(stats.sales.amount)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <TrendingDown className="text-red-600 dark:text-red-400" size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Remboursements</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {stats.refunds.count}
              </p>
              <p className="text-xs text-red-600 dark:text-red-400">
                -{formatCurrency(stats.refunds.amount)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Wallet className="text-blue-600 dark:text-blue-400" size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Dépôts</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {stats.deposits.count}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                +{formatCurrency(stats.deposits.amount)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <Wallet className="text-orange-600 dark:text-orange-400" size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Retraits</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {stats.withdrawals.count}
              </p>
              <p className="text-xs text-orange-600 dark:text-orange-400">
                -{formatCurrency(stats.withdrawals.amount)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-[#f59e0b] to-[#d97706]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <DollarSign className="text-white" size={20} />
            </div>
            <div>
              <p className="text-xs text-white/80">Résultat net</p>
              <p className="text-lg font-bold text-white">
                {filteredTransactions.length}
              </p>
              <p className={`text-xs font-medium ${stats.netRevenue >= 0 ? 'text-white' : 'text-red-200'}`}>
                {stats.netRevenue >= 0 ? '+' : ''}{formatCurrency(stats.netRevenue)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Transactions List */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Transactions {getPeriodLabel(period)}
        </h3>

        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Calendar size={48} className="mx-auto mb-3 opacity-30" />
            <p>Aucune transaction pour cette période</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTransactions.map((transaction) => {
              const typeInfo = getTypeInfo(transaction.type);
              const Icon = typeInfo.icon;
              const isPositive = transaction.type === 'sale' || transaction.type === 'deposit';

              return (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-[#f59e0b] transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${typeInfo.color.split(' ')[0]} dark:${typeInfo.color.split('dark:')[1]}`}>
                      <Icon className={typeInfo.iconColor} size={20} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {typeInfo.label}
                        </p>
                        <Badge className={typeInfo.color}>
                          {getPaymentMethodLabel(transaction.method)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {transaction.description}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className={`text-lg font-bold ${
                      isPositive 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {isPositive ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDateTime(transaction.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}