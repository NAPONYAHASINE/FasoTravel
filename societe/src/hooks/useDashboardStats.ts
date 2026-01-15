/**
 * Hook personnalisé pour les statistiques du dashboard
 * Centralise les calculs répétitifs entre Responsable, Manager et Caissier
 */

import { useMemo } from 'react';
import type { Ticket, Trip, CashTransaction } from '../contexts/DataContext';
import { getToday, getYesterday, getYesterdayEnd, filterByToday, filterByYesterday, getCurrentDate, getDaysAgo } from '../utils/dateUtils';
import { 
  calculateTicketsRevenue, 
  calculateSalesAmount,
  calculatePercentageChange,
  calculateAverageOccupancy,
  getActiveTrips,
  getUpcomingTrips,
  getTrend,
  formatChange
} from '../utils/statsUtils';

/**
 * Hook pour les statistiques de revenus (jour vs hier)
 */
export function useRevenueStats(tickets: Ticket[]) {
  const todayRevenue = useMemo(() => {
    const todayTickets = filterByToday(tickets, 'purchaseDate');
    return calculateTicketsRevenue(todayTickets);
  }, [tickets]);

  const yesterdayRevenue = useMemo(() => {
    const yesterdayTickets = filterByYesterday(tickets, 'purchaseDate');
    return calculateTicketsRevenue(yesterdayTickets);
  }, [tickets]);

  const revenueChange = useMemo(() => 
    calculatePercentageChange(todayRevenue, yesterdayRevenue),
    [todayRevenue, yesterdayRevenue]
  );

  return {
    todayRevenue,
    yesterdayRevenue,
    revenueChange,
    revenueChangeFormatted: formatChange(revenueChange),
    revenueTrend: getTrend(revenueChange)
  };
}

/**
 * Hook pour les statistiques de ventes (transactions de caisse)
 */
export function useSalesStats(cashTransactions: CashTransaction[]) {
  const todaySales = useMemo(() => {
    const todayTransactions = filterByToday(cashTransactions, 'timestamp')
      .filter(t => t.type === 'sale' && t.status === 'completed');
    return calculateSalesAmount(todayTransactions);
  }, [cashTransactions]);

  const yesterdaySales = useMemo(() => {
    const yesterdayTransactions = filterByYesterday(cashTransactions, 'timestamp')
      .filter(t => t.type === 'sale' && t.status === 'completed');
    return calculateSalesAmount(yesterdayTransactions);
  }, [cashTransactions]);

  const salesChange = useMemo(() => 
    calculatePercentageChange(todaySales, yesterdaySales),
    [todaySales, yesterdaySales]
  );

  return {
    todaySales,
    yesterdaySales,
    salesChange,
    salesChangeFormatted: formatChange(salesChange),
    salesTrend: getTrend(salesChange)
  };
}

/**
 * Hook pour les statistiques d'occupation (jour vs hier)
 */
export function useOccupancyStats(trips: Trip[]) {
  const todayOccupancy = useMemo(() => {
    const today = getToday();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayTrips = trips.filter(t => {
      const departureTime = new Date(t.departureTime);
      return departureTime >= today && departureTime < tomorrow;
    });
    return calculateAverageOccupancy(todayTrips);
  }, [trips]);

  const yesterdayOccupancy = useMemo(() => {
    const yesterday = getYesterday();
    const yesterdayEnd = getYesterdayEnd();
    
    const yesterdayTrips = trips.filter(t => {
      const departureTime = new Date(t.departureTime);
      return departureTime >= yesterday && departureTime <= yesterdayEnd;
    });
    return calculateAverageOccupancy(yesterdayTrips);
  }, [trips]);

  const occupancyChange = useMemo(() => 
    todayOccupancy - yesterdayOccupancy,
    [todayOccupancy, yesterdayOccupancy]
  );

  return {
    todayOccupancy,
    yesterdayOccupancy,
    occupancyChange,
    occupancyChangeFormatted: `${occupancyChange > 0 ? '+' : ''}${occupancyChange}%`,
    occupancyTrend: getTrend(occupancyChange)
  };
}

/**
 * Hook pour les statistiques de voyages actifs et à venir
 */
export function useTripStats(trips: Trip[], upcomingHours: number = 6) {
  const activeTrips = useMemo(() => getActiveTrips(trips), [trips]);
  
  const upcomingTrips = useMemo(() => getUpcomingTrips(trips, upcomingHours), [trips, upcomingHours]);

  return {
    activeTrips,
    activeTripsCount: activeTrips.length,
    upcomingTrips,
    upcomingTripsCount: upcomingTrips.length
  };
}

/**
 * Hook pour compter les tickets vendus aujourd'hui
 */
export function useTodayTicketsCount(tickets: Ticket[]) {
  return useMemo(() => {
    const todayTickets = filterByToday(tickets, 'purchaseDate');
    return todayTickets.filter(t => t.status === 'valid' || t.status === 'used').length;
  }, [tickets]);
}

/**
 * Hook pour les ventes des 7 derniers jours (graphique)
 */
export function useLast7DaysSales(tickets: Ticket[]) {
  return useMemo(() => {
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const salesData = [];

    for (let i = 6; i >= 0; i--) {
      const date = getCurrentDate();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dateEnd = new Date(date);
      dateEnd.setHours(23, 59, 59, 999);

      const dayTickets = tickets.filter(t => {
        const purchaseDate = new Date(t.purchaseDate);
        return purchaseDate >= date && purchaseDate <= dateEnd && (t.status === 'valid' || t.status === 'used');
      });

      const online = dayTickets.filter(t => t.salesChannel === 'online').length;
      const guichet = dayTickets.filter(t => t.salesChannel === 'counter').length;

      salesData.push({
        day: days[date.getDay()],
        online,
        guichet,
        total: online + guichet
      });
    }

    return salesData;
  }, [tickets]);
}