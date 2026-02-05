/**
 * Service API pour la gestion des billets (Tickets)
 * 
 * Gère automatiquement le mode local (localStorage) ou API (NestJS)
 * selon la configuration.
 */

import { isDevelopment } from '../../shared/config/deployment';
import { API_ENDPOINTS } from '../config';
import { apiClient } from './apiClient';
import { storageService } from '../storage/localStorage.service';
import { logger } from '../../utils/logger';
import { generateId } from '../../utils/formatters';
import type { Ticket } from '../../contexts/DataContext';
import type { CreateTicketDto, UpdateTicketDto, CancelTicketDto, TicketFilters } from '../types';

class TicketService {
  /**
   * Créer un nouveau billet
   */
  async create(data: CreateTicketDto): Promise<Ticket> {
    logger.info('🎫 Création billet', { salesChannel: data.salesChannel, gare: data.gareName });

    if (isDevelopment()) {
      // MODE LOCAL : Utiliser localStorage
      const newTicket: Ticket = {
        ...data,
        id: generateId(),
        status: 'valid',
        purchaseDate: new Date().toISOString().split('T')[0],
      } as unknown as Ticket;

      // Récupérer les billets existants
      const tickets = (storageService.get('tickets') as any as Ticket[]) || [];
      tickets.push(newTicket);
      
      // Sauvegarder
      (storageService.set as any)('tickets', tickets);

      logger.info('✅ Billet créé (local)', { id: newTicket.id });
      return newTicket;
    } else {
      // MODE API : Utiliser apiClient centralisé
      const ticket = await apiClient.post<Ticket>(API_ENDPOINTS.tickets, data);
      logger.info('✅ Billet créé (API)', { id: ticket.id });
      return ticket;
    }
  }

  /**
   * Lister les billets avec filtres optionnels
   */
  async list(filters?: TicketFilters): Promise<Ticket[]> {
    if (isDevelopment()) {
      // MODE LOCAL
      let tickets = (storageService.get('tickets') as any as Ticket[]) || [];

      // Appliquer les filtres
      if (filters) {
        if (filters.tripId) {
          tickets = tickets.filter(t => t.tripId === filters.tripId);
        }
        if (filters.gareId) {
          tickets = tickets.filter(t => t.gareId === filters.gareId);
        }
        // Note: sellerId filter skipped as Ticket doesn't have sellerId property
        if (filters.salesChannel) {
          // Map: guichet → counter, app-mobile → online
          const mappedChannel = filters.salesChannel === 'guichet' ? 'counter' : 'online';
          tickets = tickets.filter(t => t.salesChannel === mappedChannel);
        }
        if (filters.status) {
          tickets = tickets.filter(t => t.status === filters.status);
        }
        if (filters.dateFrom) {
          tickets = tickets.filter(t => t.purchaseDate >= filters.dateFrom!);
        }
        if (filters.dateTo) {
          tickets = tickets.filter(t => t.purchaseDate <= filters.dateTo!);
        }
      }

      logger.debug('📋 Billets chargés (local)', { count: tickets.length });
      return tickets;
    } else {
      // MODE API : Utiliser apiClient
      const params = new URLSearchParams(filters as any);
      const tickets = await apiClient.get<Ticket[]>(`${API_ENDPOINTS.tickets}?${params}`);
      logger.debug('📋 Billets chargés (API)', { count: tickets.length });
      return tickets;
    }
  }

  /**
   * Obtenir un billet par ID
   */
  async getById(id: string): Promise<Ticket | null> {
    if (isDevelopment()) {
      const tickets = (storageService.get('tickets') as any as Ticket[]) || [];
      return tickets.find(t => t.id === id) || null;
    } else {
      try {
        return await apiClient.get<Ticket>(`${API_ENDPOINTS.tickets}/${id}`);
      } catch {
        return null;
      }
    }
  }

  /**
   * Mettre à jour un billet
   */
  async update(id: string, data: UpdateTicketDto): Promise<Ticket> {
    logger.info('📝 Mise à jour billet', { id });

    if (isDevelopment()) {
      const tickets = (storageService.get('tickets') as any as Ticket[]) || [];
      const index = tickets.findIndex(t => t.id === id);

      if (index === -1) {
        throw new Error('Billet introuvable');
      }

      tickets[index] = { ...tickets[index], ...data };
      (storageService.set as any)('tickets', tickets);

      logger.info('✅ Billet mis à jour (local)', { id });
      return tickets[index];
    } else {
      // MODE API : Utiliser apiClient
      const ticket = await apiClient.put<Ticket>(`${API_ENDPOINTS.tickets}/${id}`, data);
      logger.info('✅ Billet mis à jour (API)', { id });
      return ticket;
    }
  }

  /**
   * Annuler un billet
   */
  async cancel(id: string, data?: CancelTicketDto): Promise<void> {
    logger.warn('🚫 Annulation billet', { id, reason: data?.reason });

    if (isDevelopment()) {
      const tickets = (storageService.get('tickets') as any as Ticket[]) || [];
      const index = tickets.findIndex(t => t.id === id);

      if (index === -1) {
        throw new Error('Billet introuvable');
      }

      tickets[index] = { 
        ...tickets[index], 
        status: 'cancelled',
      };
      
      (storageService.set as any)('tickets', tickets);
      logger.info('✅ Billet annulé (local)', { id });
    } else {
      // MODE API : Utiliser apiClient
      await apiClient.post(API_ENDPOINTS.ticketCancel(id), data || {});
      logger.info('✅ Billet annulé (API)', { id });
    }
  }

  /**
   * Rembourser un billet
   */
  async refund(id: string, amount: number): Promise<void> {
    logger.info('💰 Remboursement billet', { id, amount });

    if (isDevelopment()) {
      const tickets = (storageService.get('tickets') as any as Ticket[]) || [];
      const index = tickets.findIndex(t => t.id === id);

      if (index === -1) {
        throw new Error('Billet introuvable');
      }

      tickets[index] = { 
        ...tickets[index], 
        status: 'refunded',
      };
      
      (storageService.set as any)('tickets', tickets);
      logger.info('✅ Billet remboursé (local)', { id, amount });
    } else {
      // MODE API : Utiliser apiClient
      await apiClient.post(API_ENDPOINTS.ticketRefund(id), { amount });
      logger.info('✅ Billet remboursé (API)', { id, amount });
    }
  }

  /**
   * Obtenir les statistiques des billets
   */
  async getStats(filters?: TicketFilters): Promise<{
    total: number;
    byChannel: Record<string, number>;
    byStatus: Record<string, number>;
    totalRevenue: number;
  }> {
    const tickets = await this.list(filters);

    const stats = {
      total: tickets.length,
      byChannel: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      totalRevenue: 0,
    };

    tickets.forEach(ticket => {
      // Par canal
      stats.byChannel[ticket.salesChannel] = (stats.byChannel[ticket.salesChannel] || 0) + 1;
      
      // Par statut
      stats.byStatus[ticket.status] = (stats.byStatus[ticket.status] || 0) + 1;
      
      // Revenu total
      if (ticket.status === 'valid' || ticket.status === 'used') {
        stats.totalRevenue += ticket.price;
      }
    });

    return stats;
  }
}

// Export singleton
export const ticketService = new TicketService();