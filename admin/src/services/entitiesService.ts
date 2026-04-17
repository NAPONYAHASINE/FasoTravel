/**
 * Services Métier pour toutes les entités FasoTravel Admin
 * Backend-ready: Chaque service utilise AppConfig pour switcher mock/real
 * Version 2.0 - Switch centralisé via AppConfig
 */

import { AppConfig } from '../config/app.config';
import { apiService, ApiResponse } from './apiService';
import {
  TransportCompany,
  PassengerUser,
  Station,
  Support,
  Incident,
  Story,
  StoryCircle,
  AuditLog,
  Notification,
  OperatorUser,
  OperatorPolicy,
  OperatorService,
  Advertisement,
  Promotion,
  Integration,
  FeatureFlag,
  UserSession,
  Review,
  AutomationRule,
  SentCampaign,
  NotifTemplate,
  ScheduledNotification,
  NotifStats,
  AudienceSegment,
  ChannelStat,
  WeeklyNotifStat,
  Referral,
  ReferralCoupon,
  ReferralStats,
} from '../shared/types/standardized';

// Import mock data
import {
  MOCK_TRANSPORT_COMPANIES,
  MOCK_PASSENGERS,
  MOCK_STATIONS,
  MOCK_SUPPORT_TICKETS,
  MOCK_INCIDENTS,
  MOCK_STORIES,
  MOCK_STORY_CIRCLES,
  MOCK_AUDIT_LOGS,
  MOCK_NOTIFICATIONS,
  MOCK_OPERATOR_USERS,
  MOCK_OPERATOR_POLICIES,
  MOCK_OPERATOR_SERVICES,
  MOCK_ADVERTISEMENTS,
  MOCK_PROMOTIONS,
  MOCK_INTEGRATIONS,
  MOCK_FEATURE_FLAGS,
  MOCK_USER_SESSIONS,
  MOCK_REVIEWS,
  MOCK_AUTOMATION_RULES,
  MOCK_SENT_HISTORY,
  MOCK_NOTIF_TEMPLATES,
  MOCK_SCHEDULED_NOTIFICATIONS,
  MOCK_NOTIF_STATS,
  MOCK_AUDIENCE_SEGMENTS,
  MOCK_CHANNEL_STATS,
  MOCK_WEEKLY_NOTIF_STATS,
  MOCK_REFERRALS,
  MOCK_REFERRAL_COUPONS,
  MOCK_REFERRAL_STATS,
} from '../lib/adminMockData';

// ============================================================================
// TRANSPORT COMPANIES SERVICE
// ============================================================================

class TransportCompaniesService {
  private mockData = MOCK_TRANSPORT_COMPANIES;
  
  // Helper pour créer des audit logs
  private createAuditLog(action: string, entityId: string, changes?: any) {
    if (AppConfig.isMock) {
      const newLog: AuditLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: 'admin_001', // Admin actuel (à améliorer avec le contexte utilisateur)
        userName: 'Admin FasoTravel',
        action,
        entityType: 'company',
        entityId,
        changes,
        ipAddress: '127.0.0.1',
        userAgent: navigator.userAgent || 'Unknown',
        createdAt: new Date().toISOString()
      };
      MOCK_AUDIT_LOGS.unshift(newLog); // Ajouter au début pour avoir les plus récents en premier
    }
  }

  async getAll(): Promise<ApiResponse<TransportCompany[]>> {
    if (AppConfig.isMock) {
      return { success: true, data: this.mockData };
    }
    // Backend: return await apiService.get('/admin/companies');
    return await apiService.get('/admin/companies');
  }

  async getById(id: string): Promise<ApiResponse<TransportCompany>> {
    if (AppConfig.isMock) {
      const company = this.mockData.find(c => c.id === id);
      return company
        ? { success: true, data: company }
        : { success: false, error: 'Société non trouvée' };
    }
    // Backend: return await apiService.get(`/admin/companies/${id}`);
    return await apiService.get(`/admin/companies/${id}`);
  }

  async approve(id: string): Promise<ApiResponse<TransportCompany>> {
    if (AppConfig.isMock) {
      const index = this.mockData.findIndex(c => c.id === id);
      if (index !== -1) {
        const oldStatus = this.mockData[index].status;
        this.mockData[index] = { ...this.mockData[index], status: 'active' };
        
        // Créer l'audit log
        this.createAuditLog('approve', id, {
          status: { oldValue: oldStatus, newValue: 'active' }
        });
        
        return { success: true, data: this.mockData[index] };
      }
      return { success: false, error: 'Société non trouvée' };
    }
    // Backend: return await apiService.post(`/admin/companies/${id}/approve`);
    const index = this.mockData.findIndex(c => c.id === id);
    if (index !== -1) {
      this.mockData[index] = { ...this.mockData[index], status: 'active' };
      return { success: true, data: this.mockData[index] };
    }
    return { success: false, error: 'Société non trouvée' };
  }

  async suspend(id: string, reason: string): Promise<ApiResponse<TransportCompany>> {
    if (AppConfig.isMock) {
      const index = this.mockData.findIndex(c => c.id === id);
      if (index !== -1) {
        const oldStatus = this.mockData[index].status;
        this.mockData[index] = { ...this.mockData[index], status: 'suspended' };
        
        // Créer l'audit log
        this.createAuditLog('suspend', id, {
          status: { oldValue: oldStatus, newValue: 'suspended' },
          reason: { oldValue: null, newValue: reason }
        });
        
        return { success: true, data: this.mockData[index] };
      }
      return { success: false, error: 'Société non trouvée' };
    }
    // Backend: return await apiService.post(`/admin/companies/${id}/suspend`, { reason });
    const index = this.mockData.findIndex(c => c.id === id);
    if (index !== -1) {
      this.mockData[index] = { ...this.mockData[index], status: 'suspended' };
      return { success: true, data: this.mockData[index] };
    }
    return { success: false, error: 'Société non trouvée' };
  }

  async create(data: Partial<TransportCompany>): Promise<ApiResponse<TransportCompany>> {
    if (AppConfig.isMock) {
      // Générer un ID unique
      const newCompany: TransportCompany = {
        id: `company_${Date.now()}`,
        name: data.name || '',
        legalName: data.legalName,
        email: data.email || '',
        phoneNumber: data.phoneNumber || '',
        address: data.address,
        registrationNumber: data.registrationNumber,
        taxId: data.taxId,
        contactPersonName: data.contactPersonName,
        contactPersonWhatsapp: data.contactPersonWhatsapp,
        contactPersonEmail: data.contactPersonEmail,
        status: 'pending', // Nouvelle société en attente d'approbation
        commission: data.commission || 10,
        fleetSize: 0,
        totalRoutes: 0,
        totalTrips: 0,
        rating: 0,
        logoUrl: data.logoUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.mockData.push(newCompany);
      
      // Créer l'audit log
      this.createAuditLog('create', newCompany.id, {
        name: { oldValue: null, newValue: newCompany.name },
        status: { oldValue: null, newValue: newCompany.status }
      });
      
      return { success: true, data: newCompany };
    }
    // Backend: return await apiService.post('/admin/companies', data);
    return await apiService.post('/admin/companies', data);
  }

  async update(id: string, data: Partial<TransportCompany>): Promise<ApiResponse<TransportCompany>> {
    if (AppConfig.isMock) {
      const index = this.mockData.findIndex(c => c.id === id);
      if (index !== -1) {
        const oldData = this.mockData[index];
        this.mockData[index] = { 
          ...this.mockData[index], 
          ...data,
          updatedAt: new Date().toISOString()
        };
        
        // Créer l'audit log avec les changements
        const changes: any = {};
        Object.keys(data).forEach(key => {
          if (oldData[key as keyof TransportCompany] !== data[key as keyof Partial<TransportCompany>]) {
            changes[key] = {
              oldValue: oldData[key as keyof TransportCompany],
              newValue: data[key as keyof Partial<TransportCompany>]
            };
          }
        });
        
        if (Object.keys(changes).length > 0) {
          this.createAuditLog('update', id, changes);
        }
        
        return { success: true, data: this.mockData[index] };
      }
      return { success: false, error: 'Société non trouvée' };
    }
    // Backend: return await apiService.put(`/admin/companies/${id}`, data);
    const index = this.mockData.findIndex(c => c.id === id);
    if (index !== -1) {
      this.mockData[index] = { 
        ...this.mockData[index], 
        ...data,
        updatedAt: new Date().toISOString()
      };
      return { success: true, data: this.mockData[index] };
    }
    return { success: false, error: 'Société non trouvée' };
  }

  /**
   * 🔥 Upload du logo de la société (Backend-ready)
   * Mode Mock: Convertit en base64
   * Mode Production: Upload le fichier vers le backend et retourne l'URL
   */
  async uploadLogo(companyId: string, file: File): Promise<ApiResponse<{ url: string }>> {
    if (AppConfig.isMock) {
      // Mode Mock: Convertir en base64
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          resolve({ success: true, data: { url: base64String } });
        };
        reader.onerror = () => {
          reject({ success: false, error: 'Erreur lors de la lecture du fichier' });
        };
        reader.readAsDataURL(file);
      });
    }
    
    // Mode Production: Upload vers le backend
    const formData = new FormData();
    formData.append('logo', file);
    return await apiService.uploadFile(`/admin/companies/${companyId}/logo`, formData);
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    if (AppConfig.isMock) {
      const index = this.mockData.findIndex(c => c.id === id);
      if (index !== -1) {
        const companyName = this.mockData[index].name;
        this.mockData.splice(index, 1);
        
        // Créer l'audit log
        this.createAuditLog('delete', id, {
          name: { oldValue: companyName, newValue: null }
        });
        
        return { success: true };
      }
      return { success: false, error: 'Société non trouvée' };
    }
    // Backend: return await apiService.delete(`/admin/companies/${id}`);
    return await apiService.delete(`/admin/companies/${id}`);
  }
}

// ============================================================================
// PASSENGERS SERVICE
// ============================================================================

class PassengersService {
  private mockData = MOCK_PASSENGERS;

  async getAll(): Promise<ApiResponse<PassengerUser[]>> {
    if (AppConfig.isMock) {
      return { success: true, data: this.mockData };
    }
    return await apiService.get('/admin/passengers');
  }

  async getById(id: string): Promise<ApiResponse<PassengerUser>> {
    if (AppConfig.isMock) {
      const passenger = this.mockData.find(p => p.id === id);
      return passenger
        ? { success: true, data: passenger }
        : { success: false, error: 'Passager non trouvé' };
    }
    return await apiService.get(`/admin/passengers/${id}`);
  }

  async suspend(id: string, reason: string): Promise<ApiResponse<PassengerUser>> {
    if (AppConfig.isMock) {
      const index = this.mockData.findIndex(p => p.id === id);
      if (index !== -1) {
        this.mockData[index] = { ...this.mockData[index], status: 'suspended' };
        return { success: true, data: this.mockData[index] };
      }
      return { success: false, error: 'Passager non trouvé' };
    }
    return await apiService.post(`/admin/passengers/${id}/suspend`, { reason });
  }

  async reactivate(id: string): Promise<ApiResponse<PassengerUser>> {
    if (AppConfig.isMock) {
      const index = this.mockData.findIndex(p => p.id === id);
      if (index !== -1) {
        this.mockData[index] = { ...this.mockData[index], status: 'active' };
        return { success: true, data: this.mockData[index] };
      }
      return { success: false, error: 'Passager non trouvé' };
    }
    return await apiService.post(`/admin/passengers/${id}/reactivate`);
  }

  async verify(id: string): Promise<ApiResponse<PassengerUser>> {
    if (AppConfig.isMock) {
      const index = this.mockData.findIndex(p => p.id === id);
      if (index !== -1) {
        this.mockData[index] = { 
          ...this.mockData[index], 
          phoneVerified: true,
          emailVerified: true,
          phoneVerifiedAt: new Date().toISOString(),
          emailVerifiedAt: new Date().toISOString()
        };
        return { success: true, data: this.mockData[index] };
      }
      return { success: false, error: 'Passager non trouvé' };
    }
    return await apiService.post(`/admin/passengers/${id}/verify`);
  }
}

// ============================================================================
// STATIONS SERVICE
// ============================================================================

class StationsService {
  private mockData = MOCK_STATIONS;

  async getAll(): Promise<ApiResponse<Station[]>> {
    if (AppConfig.isMock) {
      return { success: true, data: this.mockData };
    }
    return await apiService.get('/admin/stations');
  }

  async getById(id: string): Promise<ApiResponse<Station>> {
    if (AppConfig.isMock) {
      const station = this.mockData.find(s => s.id === id);
      return station
        ? { success: true, data: station }
        : { success: false, error: 'Station non trouvée' };
    }
    return await apiService.get(`/admin/stations/${id}`);
  }

  async create(data: Omit<Station, 'id'>): Promise<ApiResponse<Station>> {
    if (AppConfig.isMock) {
      const newStation: Station = {
        ...data,
        id: `station-${Date.now()}`,
      };
      this.mockData.push(newStation);
      return { success: true, data: newStation };
    }
    return await apiService.post('/admin/stations', data);
  }

  async update(id: string, data: Partial<Station>): Promise<ApiResponse<Station>> {
    if (AppConfig.isMock) {
      const index = this.mockData.findIndex(s => s.id === id);
      if (index !== -1) {
        this.mockData[index] = { ...this.mockData[index], ...data };
        return { success: true, data: this.mockData[index] };
      }
      return { success: false, error: 'Station non trouvée' };
    }
    return await apiService.put(`/admin/stations/${id}`, data);
  }

  // ⚠️ SUPPRIMÉ: toggleStatus - Le statut est maintenant AUTOMATIQUE
  // Le statut est calculé basé sur les heures d'ouverture + connexion internet de l'App Société
  // Voir /lib/stationStatusUtils.ts pour la logique
}

// ============================================================================
// SUPPORT SERVICE
// ============================================================================

class SupportService {
  private mockData = MOCK_SUPPORT_TICKETS;

  async getAll(): Promise<ApiResponse<Support[]>> {
    if (AppConfig.isMock) {
      // IMPORTANT: Retourner une copie pour que React détecte le changement
      return { success: true, data: [...this.mockData] };
    }
    return await apiService.get('/admin/support');
  }

  async getById(id: string): Promise<ApiResponse<Support>> {
    if (AppConfig.isMock) {
      const ticket = this.mockData.find(t => t.id === id);
      return ticket
        ? { success: true, data: { ...ticket } }
        : { success: false, error: 'Ticket non trouvé' };
    }
    return await apiService.get(`/admin/support/${id}`);
  }

  async assign(ticketId: string, adminId: string): Promise<ApiResponse<Support>> {
    if (AppConfig.isMock) {
      const index = this.mockData.findIndex(t => t.id === ticketId);
      if (index !== -1) {
        this.mockData[index] = {
          ...this.mockData[index],
          assignedTo: adminId,
          updatedAt: new Date().toISOString(),
        };
        return { success: true, data: { ...this.mockData[index] } };
      }
      return { success: false, error: 'Ticket non trouvé' };
    }
    return await apiService.post(`/admin/support/${ticketId}/assign`, { adminId });
  }

  async resolve(ticketId: string, resolution: string): Promise<ApiResponse<Support>> {
    if (AppConfig.isMock) {
      const index = this.mockData.findIndex(t => t.id === ticketId);
      if (index !== -1) {
        this.mockData[index] = {
          ...this.mockData[index],
          status: 'resolved',
          resolution,
          resolvedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return { success: true, data: { ...this.mockData[index] } };
      }
      return { success: false, error: 'Ticket non trouvé' };
    }
    return await apiService.post(`/admin/support/${ticketId}/resolve`, { resolution });
  }

  async updatePriority(ticketId: string, priority: Support['priority']): Promise<ApiResponse<Support>> {
    if (AppConfig.isMock) {
      const index = this.mockData.findIndex(t => t.id === ticketId);
      if (index !== -1) {
        this.mockData[index] = {
          ...this.mockData[index],
          priority,
          updatedAt: new Date().toISOString(),
        };
        return { success: true, data: { ...this.mockData[index] } };
      }
      return { success: false, error: 'Ticket non trouvé' };
    }
    return await apiService.patch(`/admin/support/${ticketId}`, { priority });
  }

  async updateStatus(ticketId: string, status: Support['status']): Promise<ApiResponse<Support>> {
    if (AppConfig.isMock) {
      const index = this.mockData.findIndex(t => t.id === ticketId);
      if (index !== -1) {
        this.mockData[index] = {
          ...this.mockData[index],
          status,
          updatedAt: new Date().toISOString(),
          ...(status === 'resolved' ? { resolvedAt: new Date().toISOString() } : {}),
        };
        return { success: true, data: { ...this.mockData[index] } };
      }
      return { success: false, error: 'Ticket non trouvé' };
    }
    return await apiService.patch(`/admin/support/${ticketId}/status`, { status });
  }

  async addReply(ticketId: string, reply: { authorId: string; authorName: string; authorRole: 'admin' | 'user'; message: string }): Promise<ApiResponse<Support>> {
    if (AppConfig.isMock) {
      const index = this.mockData.findIndex(t => t.id === ticketId);
      if (index !== -1) {
        const newReply = {
          id: `reply_${Date.now()}`,
          ...reply,
          createdAt: new Date().toISOString(),
        };
        const existingReplies = this.mockData[index].replies || [];
        this.mockData[index] = {
          ...this.mockData[index],
          replies: [...existingReplies, newReply],
          updatedAt: new Date().toISOString(),
        };
        return { success: true, data: { ...this.mockData[index] } };
      }
      return { success: false, error: 'Ticket non trouvé' };
    }
    return await apiService.post(`/admin/support/${ticketId}/reply`, reply);
  }
}

// ============================================================================
// AUTRES SERVICES SIMPLIFIÉS
// ============================================================================

class IncidentsService {
  private mockData = MOCK_INCIDENTS;

  async getAll(): Promise<ApiResponse<Incident[]>> {
    return { success: true, data: [...this.mockData] };
  }

  async getById(id: string): Promise<ApiResponse<Incident>> {
    const incident = this.mockData.find(i => i.id === id);
    return incident
      ? { success: true, data: { ...incident } }
      : { success: false, error: 'Incident non trouvé' };
  }

  async updateStatus(id: string, status: 'open' | 'in-progress' | 'resolved'): Promise<ApiResponse<Incident>> {
    const index = this.mockData.findIndex(i => i.id === id);
    if (index === -1) return { success: false, error: 'Incident non trouvé' };
    this.mockData[index] = {
      ...this.mockData[index],
      status,
      updatedAt: new Date().toISOString(),
    };
    return { success: true, data: { ...this.mockData[index] } };
  }

  async resolve(id: string, resolvedBy: string, resolvedByName: string): Promise<ApiResponse<Incident>> {
    const index = this.mockData.findIndex(i => i.id === id);
    if (index === -1) return { success: false, error: 'Incident non trouvé' };
    this.mockData[index] = {
      ...this.mockData[index],
      status: 'resolved',
      resolvedBy,
      resolvedByName,
      resolvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return { success: true, data: { ...this.mockData[index] } };
  }

  async updateSeverity(id: string, severity: 'low' | 'medium' | 'high' | 'critical'): Promise<ApiResponse<Incident>> {
    const index = this.mockData.findIndex(i => i.id === id);
    if (index === -1) return { success: false, error: 'Incident non trouvé' };
    this.mockData[index] = {
      ...this.mockData[index],
      severity,
      updatedAt: new Date().toISOString(),
    };
    return { success: true, data: { ...this.mockData[index] } };
  }

  /**
   * Notifier les passagers concernés par un incident
   * BACKEND: POST /api/incidents/:id/notify → envoie push + SMS aux passagers du tripId
   * MOCK: Simule l'envoi et retourne le nombre de passagers notifiés
   */
  async notifyPassengers(
    incidentId: string,
    payload: {
      notificationType: 'delay' | 'cancellation' | 'info' | 'update' | 'resolution';
      message: string;
      channels: ('push' | 'sms')[];
    }
  ): Promise<ApiResponse<{ notifiedCount: number; channels: string[] }>> {
    const incident = this.mockData.find(i => i.id === incidentId);
    if (!incident) return { success: false, error: 'Incident non trouvé' };
    
    // MOCK: Simulate notification delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const notifiedCount = incident.passengersAffected || 0;
    return {
      success: true,
      data: {
        notifiedCount,
        channels: payload.channels,
      },
    };
  }
}

class StoriesService {
  private mockData = MOCK_STORIES;

  async getAll(): Promise<ApiResponse<Story[]>> {
    if (AppConfig.isMock) {
      return { success: true, data: [...this.mockData] };
    }
    return apiService.get<Story[]>('/admin/stories');
  }

  async create(data: Partial<Story>): Promise<ApiResponse<Story>> {
    if (AppConfig.isMock) {
      const newStory: Story = {
        id: `story_${Date.now()}`,
        title: data.title || '',
        description: data.description || '',
        mediaType: data.mediaType || 'image',
        mediaUrl: data.mediaUrl,
        gradient: data.gradient,
        emoji: data.emoji,
        circleId: data.circleId || 'circle_ann',
        ctaText: data.ctaText,
        actionType: data.actionType || 'none',
        actionUrl: data.actionUrl,
        internalPage: data.internalPage,
        status: 'draft',
        createdBy: 'admin_001',
        createdByName: 'Admin FasoTravel',
        viewsCount: 0,
        clicksCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...data,
      } as Story;
      this.mockData.push(newStory);
      return { success: true, data: newStory };
    }
    return apiService.post<Story>('/admin/stories', data);
  }

  async update(id: string, data: Partial<Story>): Promise<ApiResponse<Story>> {
    if (AppConfig.isMock) {
      const index = this.mockData.findIndex(s => s.id === id);
      if (index !== -1) {
        this.mockData[index] = { ...this.mockData[index], ...data, updatedAt: new Date().toISOString() };
        return { success: true, data: this.mockData[index] };
      }
      return { success: false, error: 'Story non trouvée' };
    }
    return apiService.put<Story>(`/admin/stories/${id}`, data);
  }

  async publish(id: string): Promise<ApiResponse<Story>> {
    if (AppConfig.isMock) {
      const index = this.mockData.findIndex(s => s.id === id);
      if (index !== -1) {
        this.mockData[index] = { 
          ...this.mockData[index], 
          status: 'published',
          publishedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        return { success: true, data: this.mockData[index] };
      }
      return { success: false, error: 'Story non trouvée' };
    }
    return apiService.put<Story>(`/admin/stories/${id}/publish`, {});
  }

  async archive(id: string): Promise<ApiResponse<Story>> {
    if (AppConfig.isMock) {
      const index = this.mockData.findIndex(s => s.id === id);
      if (index !== -1) {
        this.mockData[index] = { 
          ...this.mockData[index], 
          status: 'archived',
          updatedAt: new Date().toISOString()
        };
        return { success: true, data: this.mockData[index] };
      }
      return { success: false, error: 'Story non trouvée' };
    }
    return apiService.put<Story>(`/admin/stories/${id}/archive`, {});
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    if (AppConfig.isMock) {
      const index = this.mockData.findIndex(s => s.id === id);
      if (index !== -1) this.mockData.splice(index, 1);
      return { success: true, data: undefined };
    }
    return apiService.delete<void>(`/admin/stories/${id}`);
  }
}

class StoryCirclesService {
  private mockData = MOCK_STORY_CIRCLES;

  async getAll(): Promise<ApiResponse<StoryCircle[]>> {
    if (AppConfig.isMock) {
      return { success: true, data: [...this.mockData] };
    }
    return apiService.get<StoryCircle[]>('/admin/story-circles');
  }

  async create(data: Partial<StoryCircle>): Promise<ApiResponse<StoryCircle>> {
    if (AppConfig.isMock) {
      const maxOrder = this.mockData.reduce((m, c) => Math.max(m, c.order), 0);
      const newCircle: StoryCircle = {
        id: `circle_${Date.now()}`,
        name: data.name || 'Nouveau cercle',
        emoji: data.emoji || '📌',
        gradient: data.gradient || 'linear-gradient(135deg, #6b7280, #9ca3af)',
        color: data.color || 'gray',
        isDefault: false,
        order: maxOrder + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...data,
      } as StoryCircle;
      this.mockData.push(newCircle);
      return { success: true, data: newCircle };
    }
    return apiService.post<StoryCircle>('/admin/story-circles', data);
  }

  async update(id: string, data: Partial<StoryCircle>): Promise<ApiResponse<StoryCircle>> {
    if (AppConfig.isMock) {
      const index = this.mockData.findIndex(s => s.id === id);
      if (index !== -1) {
        this.mockData[index] = { ...this.mockData[index], ...data, updatedAt: new Date().toISOString() };
        return { success: true, data: this.mockData[index] };
      }
      return { success: false, error: 'Story Circle non trouvé' };
    }
    return apiService.put<StoryCircle>(`/admin/story-circles/${id}`, data);
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    if (AppConfig.isMock) {
      const index = this.mockData.findIndex(s => s.id === id);
      if (index !== -1) this.mockData.splice(index, 1);
      return { success: true, data: undefined };
    }
    return apiService.delete<void>(`/admin/story-circles/${id}`);
  }
}

class AuditLogsService {
  private mockData = MOCK_AUDIT_LOGS;

  async getAll(limit?: number): Promise<ApiResponse<AuditLog[]>> {
    const data = limit ? this.mockData.slice(0, limit) : this.mockData;
    return { success: true, data };
  }
}

class NotificationsService {
  private mockData = MOCK_NOTIFICATIONS;
  private automationRules = [...MOCK_AUTOMATION_RULES];
  private sentHistory = [...MOCK_SENT_HISTORY];
  private templates = [...MOCK_NOTIF_TEMPLATES];
  private scheduled = [...MOCK_SCHEDULED_NOTIFICATIONS];

  // ========== ADMIN INBOX NOTIFICATIONS ==========

  async getAll(): Promise<ApiResponse<Notification[]>> {
    if (AppConfig.isMock) {
      return { success: true, data: [...this.mockData] };
    }
    return apiService.get<Notification[]>('/admin/notifications');
  }

  async markAsRead(id: string): Promise<ApiResponse<Notification>> {
    if (AppConfig.isMock) {
      const index = this.mockData.findIndex(n => n.notificationId === id);
      if (index !== -1) {
        this.mockData[index] = { ...this.mockData[index], isRead: true, readAt: new Date().toISOString() };
        return { success: true, data: this.mockData[index] };
      }
      return { success: false, error: 'Notification non trouvée' };
    }
    return apiService.put<Notification>(`/admin/notifications/${id}/read`, {});
  }

  async create(data: Omit<Notification, 'notificationId' | 'isRead' | 'createdAt' | 'readAt'>): Promise<ApiResponse<Notification>> {
    if (AppConfig.isMock) {
      const newNotif: Notification = {
        ...data,
        notificationId: `notif_${Date.now()}`,
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      this.mockData.unshift(newNotif);
      return { success: true, data: newNotif };
    }
    return apiService.post<Notification>('/admin/notifications', data);
  }

  // ========== BULK SEND (Backend-ready) ==========

  async sendBulk(payload: {
    title: string;
    message: string;
    type: Notification['type'];
    channels: string[];
    audience: string;
    actionUrl?: string;
    scheduledAt?: string;
  }): Promise<ApiResponse<{ sentCount: number; scheduledAt?: string }>> {
    if (AppConfig.isMock) {
      const audienceSegment = MOCK_AUDIENCE_SEGMENTS.find(s => s.value === payload.audience);
      const sentCount = audienceSegment?.count ?? 1245;

      // If scheduled, add to scheduled list
      if (payload.scheduledAt) {
        const newScheduled: ScheduledNotification = {
          id: `sch_${Date.now()}`,
          title: payload.title,
          message: payload.message,
          scheduledAt: payload.scheduledAt,
          audience: audienceSegment?.label ?? payload.audience,
          audienceCount: sentCount,
          channels: payload.channels,
          status: 'pending',
          createdAt: new Date().toISOString(),
        };
        this.scheduled.unshift(newScheduled);
        return { success: true, data: { sentCount, scheduledAt: payload.scheduledAt } };
      }

      // Immediate send — add to admin inbox AND sent history
      const newNotif: Notification = {
        notificationId: `notif_${Date.now()}`,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        isRead: false,
        deepLink: payload.actionUrl,
        createdAt: new Date().toISOString(),
      };
      this.mockData.unshift(newNotif);

      // Add to sent history so it shows in Historique tab
      const newCampaign: SentCampaign = {
        id: `hist_${Date.now()}`,
        title: payload.title,
        message: payload.message,
        source: 'manual',
        sourceName: 'Campagne admin',
        audience: audienceSegment?.label ?? payload.audience,
        audienceCount: sentCount,
        channels: payload.channels,
        sentAt: new Date().toISOString(),
        deliveredCount: Math.round(sentCount * 0.984),
        openedCount: 0,
        clickedCount: 0,
        status: 'delivered',
      };
      this.sentHistory.unshift(newCampaign);

      return { success: true, data: { sentCount } };
    }
    return apiService.post<{ sentCount: number; scheduledAt?: string }>('/admin/notifications/send-bulk', payload);
  }

  // ========== STATS (Backend-ready) ==========

  async getStats(): Promise<ApiResponse<NotifStats>> {
    if (AppConfig.isMock) {
      return { success: true, data: { ...MOCK_NOTIF_STATS, scheduledCount: this.scheduled.filter(s => s.status === 'pending').length, templatesCount: this.templates.length } };
    }
    return apiService.get<NotifStats>('/admin/notifications/stats');
  }

  async getChannelStats(): Promise<ApiResponse<ChannelStat[]>> {
    if (AppConfig.isMock) {
      return { success: true, data: [...MOCK_CHANNEL_STATS] };
    }
    return apiService.get<ChannelStat[]>('/admin/notifications/stats/channels');
  }

  async getWeeklyStats(): Promise<ApiResponse<WeeklyNotifStat[]>> {
    if (AppConfig.isMock) {
      return { success: true, data: [...MOCK_WEEKLY_NOTIF_STATS] };
    }
    return apiService.get<WeeklyNotifStat[]>('/admin/notifications/stats/weekly');
  }

  async getAudienceSegments(): Promise<ApiResponse<AudienceSegment[]>> {
    if (AppConfig.isMock) {
      return { success: true, data: [...MOCK_AUDIENCE_SEGMENTS] };
    }
    return apiService.get<AudienceSegment[]>('/admin/notifications/audiences');
  }

  // ========== AUTOMATION RULES (Backend-ready) ==========

  async getAutomationRules(): Promise<ApiResponse<AutomationRule[]>> {
    if (AppConfig.isMock) {
      return { success: true, data: [...this.automationRules] };
    }
    return apiService.get<AutomationRule[]>('/admin/notifications/automations');
  }

  async toggleAutomationRule(id: string, isActive: boolean): Promise<ApiResponse<AutomationRule>> {
    if (AppConfig.isMock) {
      const index = this.automationRules.findIndex(r => r.id === id);
      if (index !== -1) {
        this.automationRules[index] = { ...this.automationRules[index], isActive };
        return { success: true, data: this.automationRules[index] };
      }
      return { success: false, error: 'Règle non trouvée' };
    }
    return apiService.put<AutomationRule>(`/admin/notifications/automations/${id}`, { isActive });
  }

  async updateAutomationRule(id: string, data: Partial<AutomationRule>): Promise<ApiResponse<AutomationRule>> {
    if (AppConfig.isMock) {
      const index = this.automationRules.findIndex(r => r.id === id);
      if (index !== -1) {
        this.automationRules[index] = { ...this.automationRules[index], ...data };
        return { success: true, data: this.automationRules[index] };
      }
      return { success: false, error: 'Règle non trouvée' };
    }
    return apiService.put<AutomationRule>(`/admin/notifications/automations/${id}`, data);
  }

  async createAutomationRule(data: Omit<AutomationRule, 'id' | 'sentCount' | 'lastTriggered'>): Promise<ApiResponse<AutomationRule>> {
    if (AppConfig.isMock) {
      const newRule: AutomationRule = {
        ...data,
        id: `auto_${Date.now()}`,
        sentCount: 0,
        lastTriggered: undefined,
      };
      this.automationRules.push(newRule);
      return { success: true, data: newRule };
    }
    return apiService.post<AutomationRule>('/admin/notifications/automations', data);
  }

  async deleteAutomationRule(id: string): Promise<ApiResponse<void>> {
    if (AppConfig.isMock) {
      const index = this.automationRules.findIndex(r => r.id === id);
      if (index !== -1) {
        this.automationRules.splice(index, 1);
        return { success: true, data: undefined };
      }
      return { success: false, error: 'Règle non trouvée' };
    }
    return apiService.delete<void>(`/admin/notifications/automations/${id}`);
  }

  // ========== SENT HISTORY (Backend-ready) ==========

  async getSentHistory(): Promise<ApiResponse<SentCampaign[]>> {
    if (AppConfig.isMock) {
      return { success: true, data: [...this.sentHistory] };
    }
    return apiService.get<SentCampaign[]>('/admin/notifications/history');
  }

  // ========== TEMPLATES (Backend-ready) ==========

  async getTemplates(): Promise<ApiResponse<NotifTemplate[]>> {
    if (AppConfig.isMock) {
      return { success: true, data: [...this.templates] };
    }
    return apiService.get<NotifTemplate[]>('/admin/notifications/templates');
  }

  async createTemplate(data: Omit<NotifTemplate, 'id' | 'usageCount' | 'lastUsed'>): Promise<ApiResponse<NotifTemplate>> {
    if (AppConfig.isMock) {
      const newTpl: NotifTemplate = {
        ...data,
        id: `tpl_${Date.now()}`,
        usageCount: 0,
      };
      this.templates.push(newTpl);
      return { success: true, data: newTpl };
    }
    return apiService.post<NotifTemplate>('/admin/notifications/templates', data);
  }

  async updateTemplate(id: string, data: Partial<NotifTemplate>): Promise<ApiResponse<NotifTemplate>> {
    if (AppConfig.isMock) {
      const index = this.templates.findIndex(t => t.id === id);
      if (index !== -1) {
        this.templates[index] = { ...this.templates[index], ...data };
        return { success: true, data: this.templates[index] };
      }
      return { success: false, error: 'Template non trouvé' };
    }
    return apiService.put<NotifTemplate>(`/admin/notifications/templates/${id}`, data);
  }

  async deleteTemplate(id: string): Promise<ApiResponse<void>> {
    if (AppConfig.isMock) {
      const index = this.templates.findIndex(t => t.id === id);
      if (index !== -1) {
        this.templates.splice(index, 1);
        return { success: true, data: undefined };
      }
      return { success: false, error: 'Template non trouvé' };
    }
    return apiService.delete<void>(`/admin/notifications/templates/${id}`);
  }

  async useTemplate(id: string): Promise<ApiResponse<NotifTemplate>> {
    if (AppConfig.isMock) {
      const index = this.templates.findIndex(t => t.id === id);
      if (index !== -1) {
        this.templates[index] = { ...this.templates[index], usageCount: this.templates[index].usageCount + 1, lastUsed: new Date().toISOString().split('T')[0] };
        return { success: true, data: this.templates[index] };
      }
      return { success: false, error: 'Template non trouvé' };
    }
    return apiService.put<NotifTemplate>(`/admin/notifications/templates/${id}/use`, {});
  }

  // ========== SCHEDULED (Backend-ready) ==========

  async getScheduled(): Promise<ApiResponse<ScheduledNotification[]>> {
    if (AppConfig.isMock) {
      return { success: true, data: [...this.scheduled] };
    }
    return apiService.get<ScheduledNotification[]>('/admin/notifications/scheduled');
  }

  async cancelScheduled(id: string): Promise<ApiResponse<ScheduledNotification>> {
    if (AppConfig.isMock) {
      const index = this.scheduled.findIndex(s => s.id === id);
      if (index !== -1) {
        this.scheduled[index] = { ...this.scheduled[index], status: 'cancelled' };
        return { success: true, data: this.scheduled[index] };
      }
      return { success: false, error: 'Programmation non trouvée' };
    }
    return apiService.put<ScheduledNotification>(`/admin/notifications/scheduled/${id}/cancel`, {});
  }
}

// Services supplémentaires (pattern similaire)
class OperatorUsersService {
  private mockData = MOCK_OPERATOR_USERS;
  async getAll(): Promise<ApiResponse<OperatorUser[]>> {
    return { success: true, data: this.mockData };
  }
}

class AdvertisementsService {
  private mockData = MOCK_ADVERTISEMENTS;
  async getAll(): Promise<ApiResponse<Advertisement[]>> {
    if (AppConfig.isMock) {
      return { success: true, data: [...this.mockData] };
    }
    return apiService.get<Advertisement[]>('/admin/advertisements');
  }
  async update(id: string, data: Partial<Advertisement>): Promise<ApiResponse<Advertisement>> {
    if (AppConfig.isMock) {
      const index = this.mockData.findIndex(a => a.id === id);
      if (index !== -1) {
        this.mockData[index] = { ...this.mockData[index], ...data };
        return { success: true, data: this.mockData[index] };
      }
      return { success: false, error: 'Publicité non trouvée', data: {} as Advertisement };
    }
    return apiService.put<Advertisement>(`/admin/advertisements/${id}`, data);
  }
  async create(data: Partial<Advertisement>): Promise<ApiResponse<Advertisement>> {
    if (AppConfig.isMock) {
      const newAd: Advertisement = {
        ...data,
        id: `ad_${Date.now()}`,
        impressions: 0,
        clicks: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Advertisement;
      this.mockData.push(newAd);
      return { success: true, data: newAd };
    }
    return apiService.post<Advertisement>('/admin/advertisements', data);
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    if (AppConfig.isMock) {
      const index = this.mockData.findIndex(a => a.id === id);
      if (index !== -1) this.mockData.splice(index, 1);
      return { success: true, data: undefined };
    }
    return apiService.delete<void>(`/admin/advertisements/${id}`);
  }
}

class PromotionsService {
  private mockData = MOCK_PROMOTIONS;
  async getAll(): Promise<ApiResponse<Promotion[]>> {
    return { success: true, data: this.mockData };
  }
}

class IntegrationsService {
  private mockData = [...MOCK_INTEGRATIONS];
  async getAll(): Promise<ApiResponse<Integration[]>> {
    if (AppConfig.isMock) {
      return { success: true, data: [...this.mockData] };
    }
    return await apiService.get('/admin/integrations');
  }
  async getById(id: string): Promise<ApiResponse<Integration>> {
    if (AppConfig.isMock) {
      const integration = this.mockData.find(i => i.id === id);
      return integration
        ? { success: true, data: { ...integration } }
        : { success: false, error: 'Intégration non trouvée' };
    }
    return await apiService.get(`/admin/integrations/${id}`);
  }
  async toggleStatus(id: string): Promise<ApiResponse<Integration>> {
    if (AppConfig.isMock) {
      const idx = this.mockData.findIndex(i => i.id === id);
      if (idx !== -1) {
        const newStatus = this.mockData[idx].status === 'active' ? 'inactive' : 'active';
        this.mockData[idx] = { ...this.mockData[idx], status: newStatus, updatedAt: new Date().toISOString() };
        return { success: true, data: { ...this.mockData[idx] } };
      }
      return { success: false, error: 'Intégration non trouvée' };
    }
    return await apiService.put(`/admin/integrations/${id}/toggle`);
  }
  async testConnection(id: string): Promise<ApiResponse<{ success: boolean; latencyMs: number; message: string }>> {
    if (AppConfig.isMock) {
      const integration = this.mockData.find(i => i.id === id);
      if (!integration) return { success: false, error: 'Intégration non trouvée' };
      await new Promise(r => setTimeout(r, 800 + Math.random() * 600));
      if (integration.status === 'error') {
        return { success: true, data: { success: false, latencyMs: 0, message: integration.errorMessage || 'Connexion impossible' } };
      }
      const latencyMs = Math.round(50 + Math.random() * 300);
      return { success: true, data: { success: true, latencyMs, message: `API ${integration.name} opérationnelle` } };
    }
    return await apiService.post(`/admin/integrations/${id}/test`);
  }
  async update(id: string, data: Partial<Integration>): Promise<ApiResponse<Integration>> {
    if (AppConfig.isMock) {
      const idx = this.mockData.findIndex(i => i.id === id);
      if (idx !== -1) {
        this.mockData[idx] = { ...this.mockData[idx], ...data, updatedAt: new Date().toISOString() };
        return { success: true, data: { ...this.mockData[idx] } };
      }
      return { success: false, error: 'Intégration non trouvée' };
    }
    return await apiService.put(`/admin/integrations/${id}`, data);
  }
  async create(data: Partial<Integration>): Promise<ApiResponse<Integration>> {
    if (AppConfig.isMock) {
      const newIntegration: Integration = {
        id: `integration_${Date.now()}`,
        name: data.name || '',
        type: data.type || 'sms',
        provider: data.provider || '',
        status: 'inactive',
        billingType: data.billingType || 'usage',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...data,
      } as Integration;
      this.mockData.push(newIntegration);
      return { success: true, data: { ...newIntegration } };
    }
    return await apiService.post('/admin/integrations', data);
  }
  async delete(id: string): Promise<ApiResponse<void>> {
    if (AppConfig.isMock) {
      const idx = this.mockData.findIndex(i => i.id === id);
      if (idx !== -1) this.mockData.splice(idx, 1);
      return { success: true, data: undefined };
    }
    return await apiService.delete(`/admin/integrations/${id}`);
  }
}

class FeatureFlagsService {
  private mockData = [...MOCK_FEATURE_FLAGS];
  async getAll(): Promise<ApiResponse<FeatureFlag[]>> {
    if (AppConfig.isMock) {
      return { success: true, data: [...this.mockData] };
    }
    return await apiService.get('/admin/feature-flags');
  }
  async getById(id: string): Promise<ApiResponse<FeatureFlag>> {
    if (AppConfig.isMock) {
      const flag = this.mockData.find(f => f.id === id);
      return flag
        ? { success: true, data: flag }
        : { success: false, error: 'Feature flag non trouvé' };
    }
    return await apiService.get(`/admin/feature-flags/${id}`);
  }
  async toggle(id: string): Promise<ApiResponse<FeatureFlag>> {
    if (AppConfig.isMock) {
      const idx = this.mockData.findIndex(f => f.id === id);
      if (idx !== -1) {
        this.mockData[idx] = { ...this.mockData[idx], enabled: !this.mockData[idx].enabled, updatedAt: new Date().toISOString() };
        return { success: true, data: this.mockData[idx] };
      }
      return { success: false, error: 'Feature flag non trouvé' };
    }
    return await apiService.put(`/admin/feature-flags/${id}/toggle`);
  }
  async create(data: Partial<FeatureFlag>): Promise<ApiResponse<FeatureFlag>> {
    if (AppConfig.isMock) {
      const newFlag: FeatureFlag = {
        id: `flag_${Date.now()}`,
        name: data.name || '',
        key: data.key || '',
        description: data.description || '',
        enabled: false,
        rolloutPercentage: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...data,
      } as FeatureFlag;
      this.mockData.push(newFlag);
      return { success: true, data: newFlag };
    }
    return await apiService.post('/admin/feature-flags', data);
  }
  async update(id: string, data: Partial<FeatureFlag>): Promise<ApiResponse<FeatureFlag>> {
    if (AppConfig.isMock) {
      const idx = this.mockData.findIndex(f => f.id === id);
      if (idx !== -1) {
        this.mockData[idx] = { ...this.mockData[idx], ...data, updatedAt: new Date().toISOString() };
        return { success: true, data: this.mockData[idx] };
      }
      return { success: false, error: 'Feature flag non trouvé' };
    }
    return await apiService.put(`/admin/feature-flags/${id}`, data);
  }
  async delete(id: string): Promise<ApiResponse<void>> {
    if (AppConfig.isMock) {
      const idx = this.mockData.findIndex(f => f.id === id);
      if (idx !== -1) this.mockData.splice(idx, 1);
      return { success: true, data: undefined };
    }
    return await apiService.delete(`/admin/feature-flags/${id}`);
  }
}

class ReviewsService {
  private mockData = MOCK_REVIEWS;
  async getAll(): Promise<ApiResponse<Review[]>> {
    if (AppConfig.isMock) {
      return { success: true, data: this.mockData };
    }
    return await apiService.get('/admin/reviews');
  }
  async getById(id: string): Promise<ApiResponse<Review>> {
    if (AppConfig.isMock) {
      const review = this.mockData.find(r => r.id === id);
      return review
        ? { success: true, data: review }
        : { success: false, error: 'Avis non trouvé' };
    }
    return await apiService.get(`/admin/reviews/${id}`);
  }
  async delete(id: string): Promise<ApiResponse<void>> {
    if (AppConfig.isMock) {
      const idx = this.mockData.findIndex(r => r.id === id);
      if (idx !== -1) this.mockData.splice(idx, 1);
      return { success: true, data: undefined };
    }
    return await apiService.delete(`/admin/reviews/${id}`);
  }
}

class UserSessionsService {
  private mockData = MOCK_USER_SESSIONS;
  async getAll(): Promise<ApiResponse<UserSession[]>> {
    if (AppConfig.isMock) {
      return { success: true, data: this.mockData };
    }
    return await apiService.get('/admin/sessions');
  }
  async getById(id: string): Promise<ApiResponse<UserSession>> {
    if (AppConfig.isMock) {
      const session = this.mockData.find(s => s.id === id);
      return session
        ? { success: true, data: session }
        : { success: false, error: 'Session non trouvée' };
    }
    return await apiService.get(`/admin/sessions/${id}`);
  }
  async revoke(id: string): Promise<ApiResponse<void>> {
    if (AppConfig.isMock) {
      const idx = this.mockData.findIndex(s => s.id === id);
      if (idx !== -1) {
        this.mockData[idx] = { ...this.mockData[idx], active: false, logoutAt: new Date().toISOString() };
      }
      return { success: true, data: undefined };
    }
    return await apiService.delete(`/admin/sessions/${id}`);
  }
  async terminate(id: string): Promise<ApiResponse<void>> {
    return this.revoke(id);
  }
}

class OperatorPoliciesService {
  private mockData = MOCK_OPERATOR_POLICIES;
  async getAll(): Promise<ApiResponse<OperatorPolicy[]>> {
    if (AppConfig.isMock) {
      return { success: true, data: this.mockData };
    }
    return await apiService.get('/admin/policies');
  }
  async getById(id: string): Promise<ApiResponse<OperatorPolicy>> {
    if (AppConfig.isMock) {
      const policy = this.mockData.find(p => p.id === id);
      return policy
        ? { success: true, data: policy }
        : { success: false, error: 'Politique non trouvée' };
    }
    return await apiService.get(`/admin/policies/${id}`);
  }
  async create(data: Partial<OperatorPolicy>): Promise<ApiResponse<OperatorPolicy>> {
    if (AppConfig.isMock) {
      const newPolicy: OperatorPolicy = {
        id: `policy_${Date.now()}`,
        type: data.type || 'cancellation',
        title: data.title || '',
        description: data.description || '',
        rules: data.rules || {},
        source: data.source || 'platform',
        status: 'active',
        effectiveFrom: data.effectiveFrom || new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...data,
      } as OperatorPolicy;
      this.mockData.push(newPolicy);
      return { success: true, data: newPolicy };
    }
    return await apiService.post('/admin/policies', data);
  }
  async update(id: string, data: Partial<OperatorPolicy>): Promise<ApiResponse<OperatorPolicy>> {
    if (AppConfig.isMock) {
      const idx = this.mockData.findIndex(p => p.id === id);
      if (idx !== -1) {
        this.mockData[idx] = { ...this.mockData[idx], ...data, updatedAt: new Date().toISOString() };
        return { success: true, data: this.mockData[idx] };
      }
      return { success: false, error: 'Politique non trouvée' };
    }
    return await apiService.put(`/admin/policies/${id}`, data);
  }
  async delete(id: string): Promise<ApiResponse<void>> {
    if (AppConfig.isMock) {
      const idx = this.mockData.findIndex(p => p.id === id);
      if (idx !== -1) this.mockData.splice(idx, 1);
      return { success: true, data: undefined };
    }
    return await apiService.delete(`/admin/policies/${id}`);
  }
}

class OperatorServicesService {
  private mockData = MOCK_OPERATOR_SERVICES;
  async getAll(): Promise<ApiResponse<OperatorService[]>> {
    if (AppConfig.isMock) {
      return { success: true, data: this.mockData };
    }
    return await apiService.get('/admin/operator-services');
  }
  async getByOperator(operatorId: string): Promise<ApiResponse<OperatorService[]>> {
    if (AppConfig.isMock) {
      const filtered = this.mockData.filter(s => s.companyId === operatorId);
      return { success: true, data: filtered };
    }
    return await apiService.get(`/operators/${operatorId}/services`);
  }
  async getById(id: string): Promise<ApiResponse<OperatorService>> {
    if (AppConfig.isMock) {
      const service = this.mockData.find(s => s.id === id);
      if (service) {
        return { success: true, data: service };
      }
      return { success: false, error: 'Service non trouvé' };
    }
    return await apiService.get(`/admin/operator-services/${id}`);
  }
  async create(data: Partial<OperatorService>): Promise<ApiResponse<OperatorService>> {
    if (AppConfig.isMock) {
      const newService: OperatorService = {
        id: `service_${Date.now()}`,
        companyId: data.companyId || '',
        type: data.type || 'luggage',
        name: data.name || '',
        description: data.description,
        price: data.price || 0,
        currency: data.currency || 'FCFA',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...data,
      } as OperatorService;
      this.mockData.push(newService);
      return { success: true, data: newService };
    }
    return await apiService.post('/admin/operator-services', data);
  }
  async update(id: string, data: Partial<OperatorService>): Promise<ApiResponse<OperatorService>> {
    if (AppConfig.isMock) {
      const idx = this.mockData.findIndex(s => s.id === id);
      if (idx !== -1) {
        this.mockData[idx] = { ...this.mockData[idx], ...data, updatedAt: new Date().toISOString() };
        return { success: true, data: this.mockData[idx] };
      }
      return { success: false, error: 'Service non trouvé' };
    }
    return await apiService.put(`/admin/operator-services/${id}`, data);
  }
  async delete(id: string): Promise<ApiResponse<void>> {
    if (AppConfig.isMock) {
      const idx = this.mockData.findIndex(s => s.id === id);
      if (idx !== -1) this.mockData.splice(idx, 1);
      return { success: true, data: undefined };
    }
    return await apiService.delete(`/admin/operator-services/${id}`);
  }
}

// ============================================================================
// REFERRALS SERVICE (Parrainage)
// ============================================================================

class ReferralsService {
  private mockData = MOCK_REFERRALS;
  private mockCoupons = MOCK_REFERRAL_COUPONS;

  private createAuditLog(action: string, entityId: string, changes?: any) {
    if (AppConfig.isMock) {
      const newLog: AuditLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: 'admin_001',
        userName: 'Admin FasoTravel',
        action,
        entityType: 'referral',
        entityId,
        changes,
        ipAddress: '127.0.0.1',
        userAgent: navigator.userAgent || 'Unknown',
        createdAt: new Date().toISOString()
      };
      MOCK_AUDIT_LOGS.unshift(newLog);
    }
  }

  async getAll(): Promise<ApiResponse<Referral[]>> {
    if (AppConfig.isMock) {
      return { success: true, data: this.mockData };
    }
    return await apiService.get('/admin/referrals');
  }

  async getById(id: string): Promise<ApiResponse<Referral>> {
    if (AppConfig.isMock) {
      const item = this.mockData.find(r => r.id === id);
      if (!item) return { success: false, error: 'Parrainage non trouvé' };
      return { success: true, data: item };
    }
    return await apiService.get(`/admin/referrals/${id}`);
  }

  /** Get all referrals where a specific user is the referrer */
  async getUserReferrals(userId: string): Promise<ApiResponse<Referral[]>> {
    if (AppConfig.isMock) {
      const items = this.mockData.filter(r => r.referrerUserId === userId);
      return { success: true, data: items };
    }
    return await apiService.get(`/admin/referrals/user/${userId}`);
  }

  /** Toggle referral system on/off */
  async toggleConfig(enabled: boolean, reason?: string): Promise<ApiResponse<ReferralStats>> {
    if (AppConfig.isMock) {
      MOCK_REFERRAL_STATS.config.enabled = enabled;
      MOCK_REFERRAL_STATS.config.updatedAt = new Date().toISOString();
      MOCK_REFERRAL_STATS.config.updatedBy = 'Admin FasoTravel';
      if (!enabled && reason) MOCK_REFERRAL_STATS.config.disabledReason = reason;
      else delete MOCK_REFERRAL_STATS.config.disabledReason;
      this.createAuditLog('referral_config_toggle', 'config', { enabled, reason });
      return { success: true, data: MOCK_REFERRAL_STATS };
    }
    return await apiService.post('/admin/referrals/config', { enabled, reason });
  }

  async getStats(): Promise<ApiResponse<ReferralStats>> {
    if (AppConfig.isMock) {
      return { success: true, data: MOCK_REFERRAL_STATS };
    }
    return await apiService.get('/admin/referrals/stats');
  }

  async getCoupons(): Promise<ApiResponse<ReferralCoupon[]>> {
    if (AppConfig.isMock) {
      return { success: true, data: this.mockCoupons };
    }
    return await apiService.get('/admin/referrals/coupons');
  }

  async cancelCoupon(
    couponId: string,
    reason: string,
  ): Promise<ApiResponse<ReferralCoupon>> {
    if (AppConfig.isMock) {
      const index = this.mockCoupons.findIndex((c) => c.id === couponId);
      if (index === -1) return { success: false, error: 'Coupon non trouvé' };
      this.mockCoupons[index] = {
        ...this.mockCoupons[index],
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        cancelledBy: 'admin_001',
        cancelReason: reason,
      };
      this.createAuditLog('coupon_cancelled', couponId, { reason });
      return { success: true, data: this.mockCoupons[index] };
    }
    return await apiService.post(`/admin/referrals/coupons/${couponId}/cancel`, { reason });
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const transportCompaniesService = new TransportCompaniesService();
export const passengersService = new PassengersService();
export const stationsService = new StationsService();
export const supportService = new SupportService();
export const incidentsService = new IncidentsService();
export const storiesService = new StoriesService();
export const storyCirclesService = new StoryCirclesService();
export const auditLogsService = new AuditLogsService();
export const notificationsService = new NotificationsService();
export const operatorUsersService = new OperatorUsersService();
export const advertisementsService = new AdvertisementsService();
export const promotionsService = new PromotionsService();
export const integrationsService = new IntegrationsService();
export const featureFlagsService = new FeatureFlagsService();
export const reviewsService = new ReviewsService();
export const userSessionsService = new UserSessionsService();
export const operatorPoliciesService = new OperatorPoliciesService();
export const operatorServicesService = new OperatorServicesService();
export const referralsService = new ReferralsService();

// Re-export notification types for backward compatibility
export type { AutomationRule, SentCampaign, NotifTemplate, ScheduledNotification, NotifStats, AudienceSegment, ChannelStat, WeeklyNotifStat } from '../shared/types/standardized';