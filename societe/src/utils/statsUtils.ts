/**
 * Utilitaires de calcul des statistiques pour éviter la duplication
 * Utilisé dans tous les dashboards (Responsable, Manager, Caissier)
 */

import type { Ticket, Trip, CashTransaction } from '../contexts/DataContext';
import { getToday, getCurrentDate } from './dateUtils'; // ✅ Import des fonctions de date mockées

/**
 * Calcule le changement en pourcentage entre deux valeurs
 */
export const calculatePercentageChange = (current: number, previous: number): string => {
  if (previous === 0) return '0';
  return ((current - previous) / previous * 100).toFixed(0);
};

/**
 * Calcule les revenus d'une liste de tickets
 */
export const calculateTicketsRevenue = (tickets: Ticket[]): number => {
  return tickets
    .filter(t => t.status === 'valid' || t.status === 'used')
    .reduce((sum, t) => sum + t.price, 0);
};

/**
 * Calcule les commissions d'une liste de tickets
 */
export const calculateTicketsCommission = (tickets: Ticket[]): number => {
  return tickets
    .filter(t => t.status === 'valid' || t.status === 'used')
    .reduce((sum, t) => sum + (t.commission || 0), 0);
};

/**
 * Calcule les revenus par canal de vente (online vs counter)
 */
export const calculateRevenueByChannel = (tickets: Ticket[]) => {
  const validTickets = tickets.filter(t => t.status === 'valid' || t.status === 'used');
  
  const onlineTickets = validTickets.filter(t => t.salesChannel === 'online');
  const counterTickets = validTickets.filter(t => t.salesChannel === 'counter');
  
  const onlineRevenue = onlineTickets.reduce((sum, t) => sum + t.price, 0);
  const counterRevenue = counterTickets.reduce((sum, t) => sum + t.price, 0);
  const totalRevenue = onlineRevenue + counterRevenue;
  
  const totalCommission = onlineTickets.reduce((sum, t) => sum + (t.commission || 0), 0);
  
  const onlinePercentage = validTickets.length > 0
    ? Math.round((onlineTickets.length / validTickets.length) * 100)
    : 0;
  
  const counterPercentage = 100 - onlinePercentage;
  
  return {
    online: {
      count: onlineTickets.length,
      revenue: onlineRevenue,
      percentage: onlinePercentage
    },
    counter: {
      count: counterTickets.length,
      revenue: counterRevenue,
      percentage: counterPercentage
    },
    total: {
      count: validTickets.length,
      revenue: totalRevenue,
      commission: totalCommission
    }
  };
};

/**
 * Calcule les revenus par méthode de paiement
 */
export const calculateRevenueByPaymentMethod = (tickets: Ticket[]) => {
  const validTickets = tickets.filter(t => t.status === 'valid' || t.status === 'used');
  
  const cashTickets = validTickets.filter(t => t.paymentMethod === 'cash');
  const mobileTickets = validTickets.filter(t => t.paymentMethod === 'mobile_money');
  const cardTickets = validTickets.filter(t => t.paymentMethod === 'card');
  
  return {
    cash: cashTickets.reduce((sum, t) => sum + t.price, 0),
    mobileMoney: mobileTickets.reduce((sum, t) => sum + t.price, 0),
    card: cardTickets.reduce((sum, t) => sum + t.price, 0),
    total: validTickets.reduce((sum, t) => sum + t.price, 0)
  };
};

/**
 * Calcule les ventes (montant total) d'une liste de transactions
 */
export const calculateSalesAmount = (transactions: CashTransaction[]): number => {
  return transactions
    .filter(t => t.type === 'sale' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);
};

/**
 * Calcule le solde de caisse à partir des transactions
 */
export const calculateCashBalance = (transactions: CashTransaction[]): number => {
  return transactions.reduce((sum, t) => {
    if (t.type === 'sale' || t.type === 'deposit') {
      return sum + t.amount;
    } else if (t.type === 'refund' || t.type === 'withdrawal') {
      return sum - t.amount;
    }
    return sum;
  }, 0);
};

/**
 * Calcule le taux d'occupation moyen d'une liste de voyages
 */
export const calculateAverageOccupancy = (trips: Trip[]): number => {
  if (trips.length === 0) return 0;

  const totalOccupied = trips.reduce((sum, t) => sum + (t.totalSeats - t.availableSeats), 0);
  const totalSeats = trips.reduce((sum, t) => sum + t.totalSeats, 0);

  return totalSeats > 0 ? Math.round((totalOccupied / totalSeats) * 100) : 0;
};

/**
 * Calcule le taux d'occupation d'un seul voyage
 */
export const calculateTripOccupancy = (trip: Trip): number => {
  if (trip.totalSeats === 0) return 0;
  return Math.round(((trip.totalSeats - trip.availableSeats) / trip.totalSeats) * 100);
};

/**
 * Formate un montant en milliers (K) ou millions (M)
 */
export const formatAmount = (amount: number, unit: 'K' | 'M' = 'K'): string => {
  const divisor = unit === 'M' ? 1000000 : 1000;
  return `${(amount / divisor).toFixed(1)}${unit}`;
};

/**
 * Détermine la tendance (up/down/neutral) basée sur une valeur de changement
 */
export const getTrend = (changePercent: string | number): 'up' | 'down' | 'neutral' => {
  const value = typeof changePercent === 'string' ? parseFloat(changePercent) : changePercent;
  if (value > 0) return 'up';
  if (value < 0) return 'down';
  return 'neutral';
};

/**
 * Formate le changement en pourcentage avec signe + ou -
 */
export const formatChange = (changePercent: string | number): string => {
  const value = typeof changePercent === 'string' ? parseFloat(changePercent) : changePercent;
  const sign = value > 0 ? '+' : '';
  return `${sign}${typeof changePercent === 'string' ? changePercent : changePercent.toFixed(0)}%`;
};

/**
 * Filtre les tickets valides (valid ou used)
 */
export const getValidTickets = (tickets: Ticket[]): Ticket[] => {
  return tickets.filter(t => t.status === 'valid' || t.status === 'used');
};

/**
 * Filtre les transactions de type vente complétées
 */
export const getSalesTransactions = (transactions: CashTransaction[]): CashTransaction[] => {
  return transactions.filter(t => t.type === 'sale' && t.status === 'completed');
};

/**
 * Compte le nombre de tickets vendus par canal
 */
export const countTicketsBySalesChannel = (tickets: Ticket[]): { online: number; counter: number } => {
  const validTickets = getValidTickets(tickets);
  return {
    online: validTickets.filter(t => t.salesChannel === 'online').length,
    counter: validTickets.filter(t => t.salesChannel === 'counter').length,
  };
};

/**
 * Calcule le pourcentage de tickets par canal
 */
export const calculateSalesChannelPercentage = (tickets: Ticket[]): { online: number; counter: number } => {
  const counts = countTicketsBySalesChannel(tickets);
  const total = counts.online + counts.counter;
  
  if (total === 0) return { online: 0, counter: 0 };
  
  return {
    online: Math.round((counts.online / total) * 100),
    counter: Math.round((counts.counter / total) * 100),
  };
};

/**
 * Calcule les revenus par canal de vente
 */
export const calculateRevenueBySalesChannel = (tickets: Ticket[]): { online: number; counter: number } => {
  const validTickets = getValidTickets(tickets);
  return {
    online: validTickets.filter(t => t.salesChannel === 'online').reduce((sum, t) => sum + t.price, 0),
    counter: validTickets.filter(t => t.salesChannel === 'counter').reduce((sum, t) => sum + t.price, 0),
  };
};

/**
 * Filtre les voyages actifs (en cours ou embarquement) - seulement aujourd'hui ou futurs
 */
export const getActiveTrips = (trips: Trip[]): Trip[] => {
  const today = getToday();
  
  return trips.filter(t => {
    const departureTime = new Date(t.departureTime);
    // Ne compte que les trips d'aujourd'hui ou futurs
    return departureTime >= today && (t.status === 'departed' || t.status === 'boarding');
  });
};

/**
 * Filtre les voyages actifs ET à venir (departed, boarding, scheduled dans le futur)
 * Utilisé pour compter les "départs actifs" dans les dashboards
 * ✅ Logique unifiée Manager + Responsable
 */
export const getActiveAndUpcomingTrips = (trips: Trip[]): Trip[] => {
  const now = getCurrentDate();
  const today = getToday();
  
  return trips.filter(t => {
    const departureTime = new Date(t.departureTime);
    
    // Only count trips from today onwards
    if (departureTime < today) return false;
    
    return t.status === 'departed' || 
           t.status === 'boarding' || 
           (t.status === 'scheduled' && departureTime > now);
  });
};

/**
 * Filtre les voyages programmés
 */
export const getScheduledTrips = (trips: Trip[]): Trip[] => {
  return trips.filter(t => t.status === 'scheduled');
};

/**
 * Filtre les voyages à venir dans les X prochaines heures
 */
export const getUpcomingTrips = (trips: Trip[], hoursAhead: number): Trip[] => {
  const now = getCurrentDate();
  const futureTime = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);
  
  return trips.filter(t => {
    const departureTime = new Date(t.departureTime);
    return (t.status === 'scheduled' || t.status === 'boarding') &&
           departureTime >= now && 
           departureTime <= futureTime;
  }).sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime());
};

/**
 * Calcule le nombre de sièges vendus pour un trip
 */
export const getSoldSeatsCount = (trip: Trip): number => {
  return trip.totalSeats - trip.availableSeats;
};

/**
 * Trie un tableau d'items par date (ordre chronologique ou inverse)
 * @param items - Tableau d'items
 * @param dateField - Champ de date à utiliser pour le tri
 * @param order - Ordre de tri ('asc' ou 'desc')
 */
export const sortByDate = <T extends { [key: string]: any }>(
  items: T[],
  dateField: keyof T,
  order: 'asc' | 'desc' = 'desc'
): T[] => {
  return [...items].sort((a, b) => {
    const dateA = new Date(a[dateField] as string).getTime();
    const dateB = new Date(b[dateField] as string).getTime();
    return order === 'desc' ? dateB - dateA : dateA - dateB;
  });
};

/**
 * Calcule le panier moyen (revenu moyen par ticket)
 */
export const calculateAverageBasket = (tickets: Ticket[]): number => {
  const validTickets = getValidTickets(tickets);
  if (validTickets.length === 0) return 0;
  
  const totalRevenue = calculateTicketsRevenue(validTickets);
  return Math.round(totalRevenue / validTickets.length);
};

/**
 * Groupe les tickets par trajet
 */
export const groupTicketsByTrip = (tickets: Ticket[]): Map<string, Ticket[]> => {
  const grouped = new Map<string, Ticket[]>();
  
  tickets.forEach(ticket => {
    if (!grouped.has(ticket.tripId)) {
      grouped.set(ticket.tripId, []);
    }
    grouped.get(ticket.tripId)!.push(ticket);
  });
  
  return grouped;
};

/**
 * Filtre les tickets d'un trip spécifique avec statut valide
 */
export const getTripValidTickets = (tickets: Ticket[], tripId: string): Ticket[] => {
  return tickets.filter(t => t.tripId === tripId && (t.status === 'valid' || t.status === 'used'));
};

/**
 * Calcule le total des dépôts et retraits
 */
export const calculateCashMovements = (transactions: CashTransaction[]): {
  deposits: number;
  withdrawals: number;
  net: number;
  depositsCount: number;
  withdrawalsCount: number;
  salesCount: number;
  refundsCount: number;
} => {
  const deposits = transactions
    .filter(t => t.type === 'deposit' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);
  const depositsCount = transactions.filter(t => t.type === 'deposit' && t.status === 'completed').length;
    
  const withdrawals = transactions
    .filter(t => t.type === 'withdrawal' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);
  const withdrawalsCount = transactions.filter(t => t.type === 'withdrawal' && t.status === 'completed').length;
  
  const salesCount = transactions.filter(t => t.type === 'sale' && t.status === 'completed').length;
  const refundsCount = transactions.filter(t => t.type === 'refund' && t.status === 'completed').length;
    
  return {
    deposits,
    withdrawals,
    net: deposits - withdrawals,
    depositsCount,
    withdrawalsCount,
    salesCount,
    refundsCount
  };
};

/**
 * Calcule le nombre de remboursements
 */
export const calculateRefundsCount = (transactions: CashTransaction[]): number => {
  return transactions.filter(t => t.type === 'refund' && t.status === 'completed').length;
};

/**
 * Calcule le montant total des remboursements
 */
export const calculateRefundsAmount = (transactions: CashTransaction[]): number => {
  return transactions
    .filter(t => t.type === 'refund' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);
};

/**
 * Calcule le revenu net (solde) à partir des transactions
 * Formule: ventes + dépôts - remboursements - retraits
 */
export const calculateNetRevenue = (transactions: CashTransaction[]): number => {
  const sales = calculateSalesAmount(transactions);
  const refunds = calculateRefundsAmount(transactions);
  const { deposits, withdrawals } = calculateCashMovements(transactions);
  
  return sales + deposits - refunds - withdrawals;
};

/**
 * Calcule les montants de caisse par méthode de paiement
 * Utilisé dans CashManagementPage pour afficher la répartition cash/mobile/card
 */
export const calculateCashByPaymentMethod = (
  transactions: CashTransaction[]
): { cash: number; mobile_money: number; card: number } => {
  const byMethod = {
    cash: 0,
    mobile_money: 0,
    card: 0,
  };

  transactions.forEach(t => {
    if (t.type === 'sale' || t.type === 'deposit') {
      byMethod[t.method] += t.amount;
    } else if (t.type === 'refund' || t.type === 'withdrawal') {
      byMethod[t.method] -= t.amount;
    }
  });

  return byMethod;
};

/**
 * Retourne la liste des caissiers actifs (avec au moins une transaction aujourd'hui)
 */
export const getActiveCashiers = (
  cashiers: any[], 
  cashTransactions: CashTransaction[]
): any[] => {
  const todayTransactions = cashTransactions.filter(t => {
    const today = getToday();
    return new Date(t.timestamp) >= today;
  });
  
  const activeCashierIds = new Set(todayTransactions.map(t => t.cashierId));
  return cashiers.filter(c => activeCashierIds.has(c.id) && c.status === 'active');
};

/**
 * ✅ NOUVELLE FONCTION - Obtenir les trips disponibles pour la vente
 * Utilisé dans TicketSalePage (Caissier)
 * Filtre: futurs, scheduled/boarding, avec places disponibles
 */
export const getAvailableTripsForSale = (trips: Trip[]): Trip[] => {
  const now = getCurrentDate();
  return trips.filter(trip => {
    const departureTime = new Date(trip.departureTime);
    return (
      (trip.status === 'scheduled' || trip.status === 'boarding') &&
      trip.availableSeats > 0 &&
      departureTime > now
    );
  }).sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime());
};

/**
 * ✅ NOUVELLE FONCTION - Obtenir les trips des prochaines 24h
 * Utilisé dans PassengerListsPage (Caissier)
 * Filtre: prochaines 24h, scheduled/boarding
 */
export const getUpcomingTrips24h = (trips: Trip[]): Trip[] => {
  const now = getCurrentDate();
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  
  return trips.filter(trip => {
    const departureTime = new Date(trip.departureTime);
    return departureTime >= now && 
           departureTime <= in24Hours &&
           (trip.status === 'scheduled' || trip.status === 'boarding');
  }).sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime());
};

/**
 * ✅ NOUVELLE FONCTION - Obtenir les trips en cours pour le suivi local
 * Utilisé dans LocalMapPage (Manager)
 * Filtre: boarding, departed, ou scheduled dans les X prochaines heures
 */
export const getActiveLocalTrips = (trips: Trip[], windowHours: number = 2): Trip[] => {
  const now = getCurrentDate();
  
  return trips.filter(trip => {
    // Toujours afficher boarding et departed
    if (trip.status === 'boarding' || trip.status === 'departed') {
      return true;
    }
    
    // Pour scheduled, vérifier si c'est dans la fen��tre de temps
    if (trip.status === 'scheduled') {
      const departureTime = new Date(trip.departureTime);
      const hoursUntilDeparture = (departureTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      return hoursUntilDeparture <= windowHours && hoursUntilDeparture >= 0;
    }
    
    return false;
  }).sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime());
};

/**
 * Calcule le taux d'occupation global de tous les trips
 * @param trips - Liste des trips
 * @returns Taux d'occupation en pourcentage (0-100)
 */
export const calculateOverallOccupancy = (trips: Trip[]): number => {
  const totalSeats = trips.reduce((sum, t) => sum + t.totalSeats, 0);
  const occupiedSeats = trips.reduce((sum, t) => sum + (t.totalSeats - t.availableSeats), 0);
  return totalSeats > 0 ? Math.round((occupiedSeats / totalSeats) * 100) : 0;
};

/**
 * Filtre les éléments par date d'aujourd'hui
 * @param items - Liste d'items à filtrer
 * @param dateField - Champ de date à utiliser pour le filtre
 * @returns Items dont la date correspond à aujourd'hui
 */
export const filterByToday = <T extends { [key: string]: any }>(
  items: T[],
  dateField: keyof T
): T[] => {
  const today = getToday();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return items.filter(item => {
    const itemDate = new Date(item[dateField] as string);
    return itemDate >= today && itemDate < tomorrow;
  });
};