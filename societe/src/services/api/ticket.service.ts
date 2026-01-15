/**
 * Service API pour la gestion des billets (Tickets)
 * 
 * Gère automatiquement le mode local (localStorage) ou API (NestJS)
 * selon la configuration.
 */

import { isLocalMode, API_ENDPOINTS } from '../config';
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

    if (isLocalMode()) {
      // MODE LOCAL : Utiliser localStorage
      const newTicket: Ticket = {
        ...data,
        id: generateId(),
        ticketNumber: this.generateTicketNumber(),
        status: 'active',
        purchaseDate: new Date().toISOString().split('T')[0],
        purchaseTime: new Date().toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
      };

      // Récupérer les billets existants
      const tickets = storageService.get<Ticket[]>('tickets') || [];
      tickets.push(newTicket);
      
      // Sauvegarder
      const result = storageService.set('tickets', tickets);
      
      if (!result.success) {
        throw new Error(result.error || 'Erreur sauvegarde billet');
      }

      logger.success('✅ Billet créé (local)', { id: newTicket.id, ticketNumber: newTicket.ticketNumber });
      return newTicket;
    } else {
      // MODE API : Utiliser apiClient centralisé
      const ticket = await apiClient.post<Ticket>(API_ENDPOINTS.tickets, data);
      logger.success('✅ Billet créé (API)', { id: ticket.id, ticketNumber: ticket.ticketNumber });
      return ticket;
    }
  }

  /**
   * Lister les billets avec filtres optionnels
   */
  async list(filters?: TicketFilters): Promise<Ticket[]> {
    if (isLocalMode()) {
      // MODE LOCAL
      let tickets = storageService.get<Ticket[]>('tickets') || [];

      // Appliquer les filtres
      if (filters) {
        if (filters.tripId) {
          tickets = tickets.filter(t => t.tripId === filters.tripId);
        }
        if (filters.gareId) {
          tickets = tickets.filter(t => t.gareId === filters.gareId);
        }
        if (filters.sellerId) {
          tickets = tickets.filter(t => t.sellerId === filters.sellerId);
        }
        if (filters.salesChannel) {
          tickets = tickets.filter(t => t.salesChannel === filters.salesChannel);
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
    if (isLocalMode()) {
      const tickets = storageService.get<Ticket[]>('tickets') || [];
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

    if (isLocalMode()) {
      const tickets = storageService.get<Ticket[]>('tickets') || [];
      const index = tickets.findIndex(t => t.id === id);

      if (index === -1) {
        throw new Error('Billet introuvable');
      }

      tickets[index] = { ...tickets[index], ...data };
      storageService.set('tickets', tickets);

      logger.success('✅ Billet mis à jour (local)', { id });
      return tickets[index];
    } else {
      // MODE API : Utiliser apiClient
      const ticket = await apiClient.put<Ticket>(`${API_ENDPOINTS.tickets}/${id}`, data);
      logger.success('✅ Billet mis à jour (API)', { id });
      return ticket;
    }
  }

  /**
   * Annuler un billet
   */
  async cancel(id: string, data?: CancelTicketDto): Promise<void> {
    logger.warn('🚫 Annulation billet', { id, reason: data?.reason });

    if (isLocalMode()) {
      const tickets = storageService.get<Ticket[]>('tickets') || [];
      const index = tickets.findIndex(t => t.id === id);

      if (index === -1) {
        throw new Error('Billet introuvable');
      }

      tickets[index] = { 
        ...tickets[index], 
        status: 'cancelled',
        cancelReason: data?.reason,
        cancelDate: new Date().toISOString(),
      };
      
      storageService.set('tickets', tickets);
      logger.success('✅ Billet annulé (local)', { id });
    } else {
      // MODE API : Utiliser apiClient
      await apiClient.post(API_ENDPOINTS.ticketCancel(id), data || {});
      logger.success('✅ Billet annulé (API)', { id });
    }
  }

  /**
   * Rembourser un billet
   */
  async refund(id: string, amount: number): Promise<void> {
    logger.info('💰 Remboursement billet', { id, amount });

    if (isLocalMode()) {
      const tickets = storageService.get<Ticket[]>('tickets') || [];
      const index = tickets.findIndex(t => t.id === id);

      if (index === -1) {
        throw new Error('Billet introuvable');
      }

      tickets[index] = { 
        ...tickets[index], 
        status: 'refunded',
        refundAmount: amount,
        refundDate: new Date().toISOString(),
      };
      
      storageService.set('tickets', tickets);
      logger.success('✅ Billet remboursé (local)', { id, amount });
    } else {
      // MODE API : Utiliser apiClient
      await apiClient.post(API_ENDPOINTS.ticketRefund(id), { amount });
      logger.success('✅ Billet remboursé (API)', { id, amount });
    }
  }

  /**
   * Générer un numéro de billet unique
   */
  private generateTicketNumber(): string {
    const prefix = 'TBF';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
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
      if (ticket.status === 'active' || ticket.status === 'used') {
        stats.totalRevenue += ticket.price;
      }
    });

    return stats;
  }
}

// Export singleton
export const ticketService = new TicketService();