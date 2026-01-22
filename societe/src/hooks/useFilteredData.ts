import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import type { Trip, Ticket, Cashier, CashTransaction, Incident, Station, ScheduleTemplate } from '../contexts/DataContext';

interface FilteredDataReturn {
  trips: Trip[];
  tickets: Ticket[];
  cashiers: Cashier[];
  cashTransactions: CashTransaction[];
  incidents: Incident[];
  stations: Station[];
  scheduleTemplates: ScheduleTemplate[];
  [key: string]: any;
}

export function useFilteredData(): FilteredDataReturn {
  const { user } = useAuth();
  const data = useData();

  // Filter data based on user role and permissions
  const filteredTrips = useMemo((): Trip[] => {
    if (!user) return [];
    
    if (user.role === 'responsable') {
      // Responsable sees all trips
      return data.trips;
    } else if (user.role === 'manager' || user.role === 'caissier') {
      // Manager and Caissier see only trips from their gare
      return data.trips.filter((t: Trip) => t.gareId === user.gareId);
    }
    
    return [];
  }, [data.trips, user]);

  const filteredTickets = useMemo((): Ticket[] => {
    if (!user) return [];
    
    if (user.role === 'responsable') {
      return data.tickets;
    } else if (user.role === 'manager' || user.role === 'caissier') {
      return data.tickets.filter((t: Ticket) => t.gareId === user.gareId);
    }
    
    return [];
  }, [data.tickets, user]);

  const filteredCashiers = useMemo((): Cashier[] => {
    if (!user) return [];
    
    if (user.role === 'responsable') {
      return data.cashiers;
    } else if (user.role === 'manager') {
      return data.cashiers.filter((c: Cashier) => c.gareId === user.gareId);
    }
    
    return [];
  }, [data.cashiers, user]);

  const filteredCashTransactions = useMemo((): CashTransaction[] => {
    if (!user) return [];
    
    if (user.role === 'responsable') {
      return data.cashTransactions;
    } else if (user.role === 'manager') {
      return data.cashTransactions.filter((t: CashTransaction) => {
        const cashier = data.cashiers.find((c: Cashier) => c.id === t.cashierId);
        return cashier?.gareId === user.gareId;
      });
    } else if (user.role === 'caissier') {
      return data.cashTransactions.filter((t: CashTransaction) => t.cashierId === user.id);
    }
    
    return [];
  }, [data.cashTransactions, data.cashiers, user]);

  const filteredIncidents = useMemo((): Incident[] => {
    if (!user) return [];
    
    if (user.role === 'responsable') {
      return data.incidents;
    } else if (user.role === 'manager' || user.role === 'caissier') {
      return data.incidents.filter((i: Incident) => i.gareId === user.gareId);
    }
    
    return [];
  }, [data.incidents, user]);

  const filteredStations = useMemo((): Station[] => {
    if (!user) return [];
    
    if (user.role === 'responsable') {
      return data.stations;
    } else if (user.role === 'manager' || user.role === 'caissier') {
      return data.stations.filter((s: Station) => s.id === user.gareId);
    }
    
    return [];
  }, [data.stations, user]);

  const filteredScheduleTemplates = useMemo((): ScheduleTemplate[] => {
    if (!user) return [];
    
    if (user.role === 'responsable') {
      return data.scheduleTemplates;
    } else if (user.role === 'manager') {
      return data.scheduleTemplates.filter((t: ScheduleTemplate) => t.gareId === user.gareId);
    }
    
    return [];
  }, [data.scheduleTemplates, user]);

  return {
    ...data,
    trips: filteredTrips,
    tickets: filteredTickets,
    cashiers: filteredCashiers,
    cashTransactions: filteredCashTransactions,
    incidents: filteredIncidents,
    stations: filteredStations,
    scheduleTemplates: filteredScheduleTemplates,
  };
}