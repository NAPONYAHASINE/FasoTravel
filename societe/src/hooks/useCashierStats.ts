/**
 * Hook personnalisé pour les statistiques du caissier
 * Évite la duplication de code et garantit des calculs cohérents
 */

import { useMemo } from 'react';
import type { Ticket, CashTransaction } from '../contexts/DataContext';
import { filterByToday, filterByYesterday } from '../utils/dateUtils';
import { calculateTicketsRevenue, calculateCashBalance, calculatePercentageChange, getTrend, formatChange, sortByDate } from '../utils/statsUtils';

interface CashierStatsOptions {
  tickets: Ticket[];
  cashTransactions: CashTransaction[];
  cashierId: string;
  limit?: number; // Pour limiter le nombre de ventes récentes
}

export const useCashierStats = ({ tickets, cashTransactions, cashierId, limit = 5 }: CashierStatsOptions) => {
  
  // ✅ FONCTION CENTRALISÉE: Filtre les tickets du caissier pour aujourd'hui
  const myTodayTickets = useMemo(() => {
    return filterByToday(tickets, 'purchaseDate').filter(
      t => t.cashierId === cashierId && (t.status === 'valid' || t.status === 'used')
    );
  }, [tickets, cashierId]);

  // ✅ FONCTION CENTRALISÉE: Filtre les tickets du caissier pour hier
  const myYesterdayTickets = useMemo(() => {
    return filterByYesterday(tickets, 'purchaseDate').filter(
      t => t.cashierId === cashierId && (t.status === 'valid' || t.status === 'used')
    );
  }, [tickets, cashierId]);

  // ✅ FONCTION CENTRALISÉE: Calcule les stats d'aujourd'hui
  const todayStats = useMemo(() => {
    const totalSales = calculateTicketsRevenue(myTodayTickets);
    const ticketCount = myTodayTickets.length;
    
    // Solde de caisse (basé sur les transactions)
    const myTodayTransactions = filterByToday(cashTransactions, 'timestamp').filter(
      t => t.cashierId === cashierId && t.status === 'completed'
    );
    const cashBalance = calculateCashBalance(myTodayTransactions);

    return {
      totalSales,
      ticketCount,
      cashBalance,
    };
  }, [myTodayTickets, cashTransactions, cashierId]);

  // ✅ FONCTION CENTRALISÉE: Calcule le trend (comparaison avec hier)
  const salesTrend = useMemo(() => {
    const yesterdaySales = calculateTicketsRevenue(myYesterdayTickets);
    const change = calculatePercentageChange(todayStats.totalSales, yesterdaySales);
    
    return {
      trend: getTrend(change),
      changeFormatted: formatChange(change)
    };
  }, [myYesterdayTickets, todayStats.totalSales]);

  // ✅ FONCTION CENTRALISÉE: Ventes récentes (réutilise myTodayTickets)
  const recentSales = useMemo(() => {
    return sortByDate(myTodayTickets, 'purchaseDate', 'desc').slice(0, limit);
  }, [myTodayTickets, limit]);

  return {
    myTodayTickets, // Export pour réutilisation
    myYesterdayTickets, // Export pour réutilisation
    todayStats,
    salesTrend,
    recentSales
  };
};
