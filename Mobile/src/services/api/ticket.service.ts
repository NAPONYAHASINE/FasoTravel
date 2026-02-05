/**
 * Ticket Service - TransportBF Mobile
 * 
 * Gère:
 * - Récupérer mes tickets
 * - Récupérer détails ticket
 * 
 * ✅ Dual-mode (DEV mock / PROD backend)
 * 🔴 ZÉRO données mock ici - tout vient de models.ts
 */

import { apiClient } from './apiClient';
import { API_ENDPOINTS } from '../config';
import { MOCK_TICKETS } from '../../data/models';
import type { Ticket } from '../types';
import { isDevelopment } from '../../shared/config/deployment';

// Map models.ts Ticket (snake_case) to services Ticket (camelCase)
function mapTicketFromModel(modelTicket: any): Ticket {
  return {
    id: modelTicket.ticket_id,
    bookingId: modelTicket.booking_id,
    tripId: modelTicket.trip_id,
    userId: 'USER_001', // Hardcoded current user for mock
    passengerName: modelTicket.passenger_name,
    passengerPhone: modelTicket.passenger_phone,
    seatNumber: modelTicket.seat_number,
    price: modelTicket.price,
    paymentMethod: modelTicket.payment_method,
    status: modelTicket.status,
    qrCode: modelTicket.qr_code,
    embarkationTime: modelTicket.departure_time,
    createdAt: modelTicket.created_at,
    updatedAt: modelTicket.updated_at
  };
}

class TicketService {
  /**
   * Récupère tous les tickets de l'utilisateur
   */
  async getMyTickets(): Promise<Ticket[]> {
    if (isDevelopment()) {
      // Return all mock tickets (simulates user's tickets)
      return MOCK_TICKETS.map(mapTicketFromModel);
    }

    // PRODUCTION: Call backend API
    return apiClient.get<Ticket[]>(API_ENDPOINTS.tickets.list);
  }

  /**
   * Récupère un ticket par ID
   */
  async getTicketById(ticketId: string): Promise<Ticket> {
    if (isDevelopment()) {
      const tickets = await this.getMyTickets();
      const ticket = tickets.find(t => t.id === ticketId);
      if (!ticket) throw new Error('Ticket not found');
      return ticket;
    }

    return apiClient.get<Ticket>(API_ENDPOINTS.tickets.detail(ticketId));
  }
}

export const ticketService = new TicketService();
