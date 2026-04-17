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
    userId: 'USER_001',
    operatorId: modelTicket.operator_id,
    operatorName: modelTicket.operator_name,
    fromStopId: modelTicket.from_stop_id,
    fromStopName: modelTicket.from_stop_name,
    toStopId: modelTicket.to_stop_id,
    toStopName: modelTicket.to_stop_name,
    passengerName: modelTicket.passenger_name,
    passengerPhone: modelTicket.passenger_phone,
    passengerEmail: modelTicket.passenger_email,
    seatNumber: modelTicket.seat_number,
    price: modelTicket.price,
    currency: modelTicket.currency,
    paymentMethod: modelTicket.payment_method,
    paymentId: modelTicket.payment_id,
    status: modelTicket.status,
    qrCode: modelTicket.qr_code,
    alphanumericCode: modelTicket.alphanumeric_code,
    embarkationTime: modelTicket.departure_time,
    arrivalTime: modelTicket.arrival_time,
    createdAt: modelTicket.created_at,
    updatedAt: modelTicket.updated_at,
    holderDownloaded: modelTicket.holder_downloaded,
    holderPresented: modelTicket.holder_presented,
    canCancel: modelTicket.can_cancel,
    canTransfer: modelTicket.can_transfer
  };
}

// Map backend entity (camelCase with different field names) to services Ticket
function mapTicketFromBackend(entity: any): Ticket {
  return {
    id: entity.id,
    bookingId: entity.bookingId || '',
    tripId: entity.tripId,
    userId: entity.purchasedByUserId || '',
    operatorId: entity.operatorId || '',
    operatorName: entity.operator?.name || '',
    fromStopId: '',
    fromStopName: entity.fromStationName || '',
    toStopId: '',
    toStopName: entity.toStationName || '',
    passengerName: entity.passengerName,
    passengerPhone: entity.passengerPhone || '',
    passengerEmail: entity.passengerEmail,
    seatNumber: entity.seatNumber || '',
    price: entity.price,
    currency: entity.currency || 'XOF',
    paymentMethod: entity.paymentMethod || 'cash',
    paymentId: '',
    status: entity.status,
    qrCode: entity.qrCode,
    alphanumericCode: entity.alphanumericCode,
    embarkationTime: entity.departureTime,
    arrivalTime: entity.arrivalTime,
    createdAt: entity.purchasedAt || entity.createdAt,
    updatedAt: entity.updatedAt,
    holderDownloaded: false,
    holderPresented: false,
    canCancel: entity.canCancel ?? true,
    canTransfer: entity.canTransfer ?? true,
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

    // PRODUCTION: Backend returns PaginatedResponse { data: Ticket[], meta: {...} }
    const response = await apiClient.get<{ data: any[]; meta: any }>(API_ENDPOINTS.tickets.list);
    const tickets = response.data || [];
    return tickets.map(mapTicketFromBackend);
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

    // PRODUCTION: Backend returns raw Ticket entity
    const entity = await apiClient.get<any>(API_ENDPOINTS.tickets.detail(ticketId));
    return mapTicketFromBackend(entity);
  }
}

export const ticketService = new TicketService();
