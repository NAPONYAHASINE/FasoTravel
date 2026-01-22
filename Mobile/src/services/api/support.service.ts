/**
 * Support Service - TransportBF Mobile
 * 
 * Gère:
 * - Envoyer messages de support
 * - Signaler incident
 * - Récupérer incidents
 * 
 * ✅ Dual-mode
 */

import { apiClient } from './apiClient';
import { storageService } from '../storage/localStorage.service';
import { API_ENDPOINTS, isDevelopment } from '../config';
import type { SupportMessage, Incident } from '../types';

interface CreateSupportMessageParams {
  subject: string;
  message: string;
  category: 'BOOKING' | 'PAYMENT' | 'TICKET' | 'VEHICLE' | 'OTHER';
  attachments?: string[];
}

interface CreateIncidentParams {
  type: string;
  location?: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

class SupportService {
  /**
   * Envoie un message de support
   */
  async sendSupportMessage(params: CreateSupportMessageParams): Promise<SupportMessage> {
    if (isDevelopment()) {
      return this.mockSendSupportMessage(params);
    }

    return apiClient.post<SupportMessage>(
      API_ENDPOINTS.support.sendMessage,
      params
    );
  }

  /**
   * Récupère les messages de support de l'utilisateur
   */
  async getMyMessages(): Promise<SupportMessage[]> {
    if (isDevelopment()) {
      return storageService.get<SupportMessage[]>('user_support_messages') || [];
    }

    return apiClient.get<SupportMessage[]>(API_ENDPOINTS.support.myMessages);
  }

  /**
   * Signale un incident
   */
  async reportIncident(params: CreateIncidentParams): Promise<Incident> {
    if (isDevelopment()) {
      return this.mockReportIncident(params);
    }

    return apiClient.post<Incident>(
      API_ENDPOINTS.support.reportIncident,
      params
    );
  }

  /**
   * Récupère les incidents de l'utilisateur
   */
  async getMyIncidents(): Promise<Incident[]> {
    if (isDevelopment()) {
      return storageService.get<Incident[]>('user_incidents') || [];
    }

    return apiClient.get<Incident[]>(API_ENDPOINTS.support.myIncidents);
  }

  /**
   * Récupère un incident spécifique
   */
  async getIncident(incidentId: string): Promise<Incident> {
    if (isDevelopment()) {
      const incidents = storageService.get<Incident[]>('user_incidents') || [];
      const incident = incidents.find(i => i.id === incidentId);
      if (!incident) throw new Error(`Incident ${incidentId} not found`);
      return incident;
    }

    return apiClient.get<Incident>(API_ENDPOINTS.support.incidentDetail(incidentId));
  }

  /**
   * Ferme un incident
   */
  async closeIncident(incidentId: string, resolution: string): Promise<Incident> {
    if (isDevelopment()) {
      const incidents = storageService.get<Incident[]>('user_incidents') || [];
      const incident = incidents.find(i => i.id === incidentId);
      if (!incident) throw new Error(`Incident ${incidentId} not found`);

      incident.status = 'RESOLVED';
      storageService.set('user_incidents', incidents);
      return incident;
    }

    return apiClient.post<Incident>(
      API_ENDPOINTS.support.closeIncident(incidentId),
      { resolution }
    );
  }

  // ============================================
  // MOCK DATA
  // ============================================

  private mockSendSupportMessage(params: CreateSupportMessageParams): SupportMessage {
    const message: SupportMessage = {
      id: `support_${Date.now()}`,
      userId: 'current_user',
      subject: params.subject,
      message: params.message,
      status: 'open',
      attachments: params.attachments,
      createdAt: new Date().toISOString(),
    };

    const messages = storageService.get<SupportMessage[]>('user_support_messages') || [];
    messages.push(message);
    storageService.set('user_support_messages', messages);

    return message;
  }

  private mockReportIncident(params: CreateIncidentParams): Incident {
    const incident: Incident = {
      id: `incident_${Date.now()}`,
      tripId: 'current_trip',
      userId: 'current_user',
      type: (params.type as 'delay' | 'accident' | 'missing_passenger' | 'vehicle_issue' | 'other'),
      description: params.description,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
    };

    const incidents = storageService.get<Incident[]>('user_incidents') || [];
    incidents.push(incident);
    storageService.set('user_incidents', incidents);

    return incident;
  }
}

export const supportService = new SupportService();
