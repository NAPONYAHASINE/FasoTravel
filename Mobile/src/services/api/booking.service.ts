/**
 * Booking Service - TransportBF Mobile
 * 
 * Gère:
 * - Créer booking HOLD
 * - Confirmer booking (paiement)
 * - Annuler booking
 * - Status booking
 * 
 * ✅ Dual-mode
 */

import { apiClient } from './apiClient';
import { storageService } from '../storage/localStorage.service';
import { API_ENDPOINTS, isDevelopment } from '../config';
import type { Booking, Ticket, CreateHoldBookingParams, ConfirmBookingParams } from '../types';

class BookingService {
  /**
   * Crée une réservation HOLD (10 minutes TTL)
   */
  async createHoldBooking(params: CreateHoldBookingParams): Promise<Booking> {
    if (isDevelopment()) {
      return this.mockCreateHoldBooking(params);
    }

    return apiClient.post<Booking>(
      API_ENDPOINTS.bookings.create,
      params
    );
  }

  /**
   * Confirme une réservation (paiement)
   */
  async confirmBooking(params: ConfirmBookingParams): Promise<Ticket> {
    if (isDevelopment()) {
      return this.mockConfirmBooking(params);
    }

    return apiClient.post<Ticket>(
      API_ENDPOINTS.bookings.confirm(params.bookingId),
      params
    );
  }

  /**
   * Annule une réservation
   */
  async cancelBooking(bookingId: string): Promise<void> {
    if (isDevelopment()) {
      storageService.remove(`booking_${bookingId}`);
      return;
    }

    await apiClient.delete(API_ENDPOINTS.bookings.cancel(bookingId));
  }

  /**
   * Récupère les détails d'une réservation
   */
  async getBooking(bookingId: string): Promise<Booking> {
    if (isDevelopment()) {
      const booking = storageService.get<Booking>(`booking_${bookingId}`);
      if (!booking) throw new Error(`Booking ${bookingId} not found`);
      return booking;
    }

    return apiClient.get<Booking>(API_ENDPOINTS.bookings.detail(bookingId));
  }

  // ============================================
  // MOCK DATA
  // ============================================

  private mockCreateHoldBooking(params: CreateHoldBookingParams): Booking {
    const booking: Booking = {
      id: `booking_${Date.now()}`,
      userId: 'current_user',
      tripId: params.tripId,
      numSeats: 1,
      status: 'HOLD',
      holdExpiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 min
      basePrice: 5000,
      servicesPrice: params.selectedServices?.length ? 1500 : 0,
      totalPrice: 5000 + (params.selectedServices?.length ? 1500 : 0),
      selectedServices: params.selectedServices,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    storageService.set(`booking_${booking.id}`, booking);
    return booking;
  }

  private mockConfirmBooking(params: ConfirmBookingParams): Ticket {
    const booking = storageService.get<Booking>(`booking_${params.bookingId}`);
    if (!booking) throw new Error(`Booking ${params.bookingId} not found`);

    const ticket: Ticket = {
      id: `ticket_${Date.now()}`,
      bookingId: params.bookingId,
      tripId: booking.tripId,
      userId: 'current_user',
      passengerName: 'John Doe',
      passengerPhone: '+226 70 11 22 33',
      seatNumber: 'A1',
      price: booking.totalPrice,
      paymentMethod: params.paymentMethod,
      status: 'PAID',
      qrCode: `QR_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Mettre à jour booking status
    booking.status = 'CONFIRMED';
    storageService.set(`booking_${params.bookingId}`, booking);

    // Sauvegarder le ticket
    const tickets = storageService.get<Ticket[]>('user_tickets') || [];
    tickets.push(ticket);
    storageService.set('user_tickets', tickets);

    return ticket;
  }
}

export const bookingService = new BookingService();
