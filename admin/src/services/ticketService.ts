/**
 * Service Billets FasoTravel Admin
 * Backend-ready: Mock service qui peut être facilement remplacé par de vrais appels API
 * 
 * ⚠️ RAPPEL: BILLETS ≠ RÉSERVATIONS
 * Statuts BILLETS: ACTIF, EMBARQUÉ, EXPIRÉ, ANNULÉ
 * Statuts RÉSERVATIONS: EN_ATTENTE, CONFIRMÉ, TERMINÉ, ANNULÉ
 * 
 * RESPONSABILITÉS:
 * - Fournir l'interface entre le frontend et le backend
 * - En mode MOCK: utilise les données de /lib/adminMockData.ts
 * - En mode PRODUCTION: effectue de vrais appels API
 * - ZÉRO génération de données dans ce service
 */

import { AppConfig } from '../config/app.config';
import { apiService } from './apiService';
import type { Ticket, TicketStats } from '../shared/types/standardized';
import { MOCK_TICKETS, MOCK_TICKET_STATS } from '../lib/adminMockData';

// ============================================================================
// CACHE EN MÉMOIRE
// ============================================================================

let cachedTickets: Ticket[] | null = null;
let cachedStats: TicketStats | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60000; // 1 minute

// ============================================================================
// SERVICE API
// ============================================================================

class TicketService {
  /**
   * Récupère tous les billets
   * Mode MOCK: Retourne MOCK_TICKETS
   * Mode PRODUCTION: Appel GET /api/admin/tickets
   */
  async getAllTickets(): Promise<Ticket[]> {
    const now = Date.now();
    if (cachedTickets && cachedTickets.length > 0 && (now - cacheTimestamp < CACHE_DURATION)) {
      return cachedTickets;
    }

    if (AppConfig.isMock) {
      cachedTickets = MOCK_TICKETS;
      cacheTimestamp = now;
      return MOCK_TICKETS;
    }

    const response = await apiService.get<Ticket[]>('/admin/tickets');
    cachedTickets = response;
    cacheTimestamp = now;
    return response;
  }

  /**
   * Récupère les statistiques des billets
   * Mode MOCK: Retourne MOCK_TICKET_STATS
   * Mode PRODUCTION: Appel GET /api/admin/tickets/stats
   */
  async getTicketStats(): Promise<TicketStats> {
    const now = Date.now();
    if (cachedStats && (now - cacheTimestamp < CACHE_DURATION)) {
      return cachedStats;
    }

    if (AppConfig.isMock) {
      cachedStats = MOCK_TICKET_STATS;
      return MOCK_TICKET_STATS;
    }

    const response = await apiService.get<TicketStats>('/admin/tickets/stats');
    cachedStats = response;
    return response;
  }

  /**
   * Récupère un billet par ID
   */
  async getTicketById(ticketId: string): Promise<Ticket | null> {
    if (AppConfig.isMock) {
      const ticket = MOCK_TICKETS.find(t => t.id === ticketId);
      return ticket || null;
    }

    return await apiService.get<Ticket>(`/admin/tickets/${ticketId}`);
  }

  /**
   * Invalide le cache
   */
  clearCache(): void {
    cachedTickets = null;
    cachedStats = null;
    cacheTimestamp = 0;
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const ticketService = new TicketService();
export default ticketService;