/**
 * Payment Service - TransportBF Mobile
 * 
 * Gère:
 * - Créer paiement
 * - Récupérer status paiement
 * - Lister méthodes paiement (Orange Money, Moov)
 * 
 * ✅ Dual-mode
 */

import { apiClient } from './apiClient';
import { storageService } from '../storage/localStorage.service';
import { API_ENDPOINTS, isDevelopment } from '../config';
import type { Payment, PaymentMethod } from '../types';

class PaymentService {
  /**
   * Crée un paiement (pour confirmation booking)
   */
  async createPayment(bookingId: string, method: PaymentMethod, amount: number): Promise<Payment> {
    if (isDevelopment()) {
      return this.mockCreatePayment(bookingId, method, amount);
    }

    return apiClient.post<Payment>(
      API_ENDPOINTS.payments.create,
      { bookingId, method, amount }
    );
  }

  /**
   * Récupère le status d'un paiement
   */
  async getPayment(paymentId: string): Promise<Payment> {
    if (isDevelopment()) {
      const payment = storageService.get<Payment>(`payment_${paymentId}`);
      if (!payment) throw new Error(`Payment ${paymentId} not found`);
      return payment;
    }

    return apiClient.get<Payment>(API_ENDPOINTS.payments.detail(paymentId));
  }

  /**
   * Récupère les méthodes de paiement disponibles
   */
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    if (isDevelopment()) {
      return this.mockGetPaymentMethods();
    }

    return apiClient.get<PaymentMethod[]>(API_ENDPOINTS.payments.methods);
  }

  /**
   * Valide et process un paiement (webhook simulé)
   */
  async processPayment(paymentId: string, code: string): Promise<Payment> {
    if (isDevelopment()) {
      const payment = storageService.get<Payment>(`payment_${paymentId}`);
      if (!payment) throw new Error(`Payment not found`);
      payment.status = code === '0000' ? 'COMPLETED' : 'FAILED';
      storageService.set(`payment_${paymentId}`, payment);
      return payment;
    }

    return apiClient.post<Payment>(
      API_ENDPOINTS.payments.create,
      { paymentId, code }
    );
  }

  // ============================================
  // MOCK DATA
  // ============================================

  private mockCreatePayment(bookingId: string, method: PaymentMethod, amount: number): Payment {
    const payment: Payment = {
      id: `payment_${Date.now()}`,
      bookingId,
      userId: 'current_user',
      amount,
      currency: 'XOF',
      method,
      status: 'PENDING',
      transactionId: `TX${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    storageService.set(`payment_${payment.id}`, payment);
    return payment;
  }

  private mockGetPaymentMethods(): PaymentMethod[] {
    return [
      'ORANGE_MONEY',
      'MOOV_MONEY',
      'CARTE_BANCAIRE',
      'CASH',
    ];
  }
}

export const paymentService = new PaymentService();
