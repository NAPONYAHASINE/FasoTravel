/**
 * Hook réutilisable pour la gestion des billets
 * Backend-ready: Gère le loading, erreurs, cache, et appels API
 * 
 * ⚠️ RAPPEL: BILLETS ≠ RÉSERVATIONS
 * Billets: ACTIF, EMBARQUÉ, EXPIRÉ, ANNULÉ
 * Réservations: EN_ATTENTE, CONFIRMÉ, TERMINÉ, ANNULÉ
 * 
 * USAGE:
 * ```tsx
 * const { tickets, stats, loading, error, refresh } = useTickets();
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { ticketService } from '../services/ticketService';
import type { Ticket, TicketStats } from '../shared/types/standardized';

export interface UseTicketsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  loadStats?: boolean;
}

export interface UseTicketsReturn {
  tickets: Ticket[];
  stats: TicketStats | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
}

export function useTickets(
  options: UseTicketsOptions = {}
): UseTicketsReturn {
  const {
    autoRefresh = false,
    refreshInterval = 30000,
    loadStats = true,
  } = options;
  
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchTickets = useCallback(async () => {
    setError(null);

    try {
      const ticketsData = await ticketService.getAllTickets();
      setTickets(ticketsData || []);

      if (loadStats) {
        const statsData = await ticketService.getTicketStats();
        setStats(statsData);
      }

      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      console.error('❌ [useTickets] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [loadStats]);

  useEffect(() => {
    let cancelled = false;
    
    const load = async () => {
      setError(null);
      
      try {
        const ticketsData = await ticketService.getAllTickets();
        if (!cancelled) {
          setTickets(ticketsData || []);
        }
        
        if (loadStats) {
          const statsData = await ticketService.getTicketStats();
          if (!cancelled) {
            setStats(statsData);
          }
        }
        
        if (!cancelled) {
          setLastUpdated(new Date());
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erreur inconnue');
          setLoading(false);
        }
      }
    };
    
    load();
    return () => { cancelled = true; };
  }, [loadStats]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchTickets, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchTickets]);

  return {
    tickets,
    stats,
    loading,
    error,
    refresh: fetchTickets,
    lastUpdated,
  };
}