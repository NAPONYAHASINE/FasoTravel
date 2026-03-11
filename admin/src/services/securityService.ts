/**
 * Service Sécurité Admin - Settings > Sécurité
 * Backend-ready: Mock service qui peut être facilement remplacé par de vrais appels API
 * 
 * RESPONSABILITES:
 * - Gestion du mot de passe admin
 * - Activation/désactivation 2FA (flux OTP complet)
 * - Sessions actives de l'admin connecté (≠ sessionService qui est platform-wide)
 * - Journal des événements de sécurité
 * - ZERO génération de données dans ce service
 * 
 * ENDPOINTS PRODUCTION:
 * - GET    /admin/security/profile              → getSecurityProfile()
 * - POST   /admin/security/change-password      → changePassword(current, new)
 * - POST   /admin/security/2fa/enable           → initiate2FA()
 * - POST   /admin/security/2fa/verify           → verify2FA(code)
 * - POST   /admin/security/2fa/disable          → disable2FA()
 * - GET    /admin/security/sessions             → getActiveSessions()
 * - DELETE /admin/security/sessions/:id/revoke  → revokeSession(id)
 * - DELETE /admin/security/sessions/revoke-others → revokeAllOtherSessions()
 * - GET    /admin/security/events               → getSecurityEvents()
 */

import { AppConfig } from '../config/app.config';
import { apiService } from './apiService';
import { ENDPOINTS } from './endpoints';
import {
  MOCK_ADMIN_ACTIVE_SESSIONS,
  MOCK_SECURITY_EVENTS,
} from '../lib/adminMockData';
import type {
  AdminActiveSession,
  SecurityEvent,
  TwoFactorSetup,
  AdminSecurityProfile,
} from '../shared/types/standardized';

// ============================================================================
// MOCK STATE (mutable copies for mock mutations)
// ============================================================================

let mockSessions: AdminActiveSession[] = [...MOCK_ADMIN_ACTIVE_SESSIONS];
let mockEvents: SecurityEvent[] = [...MOCK_SECURITY_EVENTS];
let mock2FAEnabled = false;
let mockLastPasswordChange = '2026-03-05T11:20:00Z';

// ============================================================================
// SERVICE
// ============================================================================

class SecurityService {

  /**
   * Récupère le profil de sécurité complet de l'admin connecté
   * Mode MOCK: Agrège les données mock
   * Mode PRODUCTION: GET /admin/security/profile
   */
  async getSecurityProfile(): Promise<AdminSecurityProfile> {
    if (AppConfig.isMock) {
      console.log('[SecurityService] Mode MOCK - Chargement profil sécurité');
      return {
        twoFactorEnabled: mock2FAEnabled,
        lastPasswordChange: mockLastPasswordChange,
        activeSessions: [...mockSessions],
        recentEvents: [...mockEvents].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
      };
    }

    const response = await apiService.get<AdminSecurityProfile>(
      ENDPOINTS.security.profile()
    );
    if (response.success && response.data) return response.data;
    throw new Error(response.error || 'Erreur chargement profil sécurité');
  }

  /**
   * Change le mot de passe de l'admin
   * Mode MOCK: Validation côté client + simulation
   * Mode PRODUCTION: POST /admin/security/change-password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    if (AppConfig.isMock) {
      console.log('[SecurityService] Mode MOCK - Changement mot de passe');
      
      // Simulate validation delay
      await this.simulateDelay(500);

      // Mock validation: reject if current = "wrong"
      if (currentPassword === 'wrong') {
        throw new Error('Mot de passe actuel incorrect');
      }

      // Update mock state
      mockLastPasswordChange = new Date().toISOString();
      mockEvents = [
        {
          id: `sec_evt_${Date.now()}`,
          type: 'password_change',
          description: 'Mot de passe modifié avec succès',
          ipAddress: '196.28.245.12',
          location: 'Ouagadougou, Burkina Faso',
          createdAt: new Date().toISOString(),
        },
        ...mockEvents,
      ];
      return;
    }

    const response = await apiService.post<void>(
      ENDPOINTS.security.changePassword(),
      { currentPassword, newPassword }
    );
    if (!response.success) {
      throw new Error(response.error || 'Erreur changement mot de passe');
    }
  }

  /**
   * Initie l'activation 2FA — retourne un secret + QR code
   * L'admin doit scanner le QR avec une app authenticator
   * Mode MOCK: Retourne un faux secret + codes backup
   * Mode PRODUCTION: POST /admin/security/2fa/enable
   */
  async initiate2FA(): Promise<TwoFactorSetup> {
    if (AppConfig.isMock) {
      console.log('[SecurityService] Mode MOCK - Initiation 2FA');
      await this.simulateDelay(300);

      return {
        secret: 'JBSWY3DPEHPK3PXP', // Fake TOTP secret
        qrCodeUrl: '', // Not used in mock — UI shows manual code
        backupCodes: [
          'A1B2-C3D4',
          'E5F6-G7H8',
          'I9J0-K1L2',
          'M3N4-O5P6',
          'Q7R8-S9T0',
        ],
      };
    }

    const response = await apiService.post<TwoFactorSetup>(
      ENDPOINTS.security.enable2FA()
    );
    if (response.success && response.data) return response.data;
    throw new Error(response.error || 'Erreur activation 2FA');
  }

  /**
   * Vérifie le code OTP pour confirmer l'activation 2FA
   * Mode MOCK: Accepte "123456" comme code valide
   * Mode PRODUCTION: POST /admin/security/2fa/verify
   */
  async verify2FA(code: string): Promise<void> {
    if (AppConfig.isMock) {
      console.log('[SecurityService] Mode MOCK - Vérification code 2FA');
      await this.simulateDelay(400);

      // Accept any 6-digit code in mock mode
      if (code.length !== 6 || !/^\d{6}$/.test(code)) {
        throw new Error('Code invalide — entrez 6 chiffres');
      }

      mock2FAEnabled = true;
      mockEvents = [
        {
          id: `sec_evt_${Date.now()}`,
          type: '2fa_enabled',
          description: 'Authentification à 2 facteurs activée',
          ipAddress: '196.28.245.12',
          location: 'Ouagadougou, Burkina Faso',
          createdAt: new Date().toISOString(),
        },
        ...mockEvents,
      ];
      return;
    }

    const response = await apiService.post<void>(
      ENDPOINTS.security.verify2FA(),
      { code }
    );
    if (!response.success) {
      throw new Error(response.error || 'Code 2FA invalide');
    }
  }

  /**
   * Désactive le 2FA
   * Mode MOCK: Met mock2FAEnabled à false
   * Mode PRODUCTION: POST /admin/security/2fa/disable
   */
  async disable2FA(): Promise<void> {
    if (AppConfig.isMock) {
      console.log('[SecurityService] Mode MOCK - Désactivation 2FA');
      await this.simulateDelay(300);

      mock2FAEnabled = false;
      mockEvents = [
        {
          id: `sec_evt_${Date.now()}`,
          type: '2fa_disabled',
          description: 'Authentification à 2 facteurs désactivée',
          ipAddress: '196.28.245.12',
          location: 'Ouagadougou, Burkina Faso',
          createdAt: new Date().toISOString(),
        },
        ...mockEvents,
      ];
      return;
    }

    const response = await apiService.post<void>(
      ENDPOINTS.security.disable2FA()
    );
    if (!response.success) {
      throw new Error(response.error || 'Erreur désactivation 2FA');
    }
  }

  /**
   * Récupère les sessions actives de l'admin connecté
   * Mode MOCK: Retourne MOCK_ADMIN_ACTIVE_SESSIONS
   * Mode PRODUCTION: GET /admin/security/sessions
   */
  async getActiveSessions(): Promise<AdminActiveSession[]> {
    if (AppConfig.isMock) {
      return [...mockSessions];
    }

    const response = await apiService.get<AdminActiveSession[]>(
      ENDPOINTS.security.activeSessions()
    );
    if (response.success && response.data) return response.data;
    throw new Error(response.error || 'Erreur chargement sessions');
  }

  /**
   * Révoque une session spécifique
   * Mode MOCK: Retire la session de la liste
   * Mode PRODUCTION: DELETE /admin/security/sessions/:id/revoke
   */
  async revokeSession(sessionId: string): Promise<void> {
    if (AppConfig.isMock) {
      console.log(`[SecurityService] Mode MOCK - Révocation session ${sessionId}`);
      await this.simulateDelay(300);

      const session = mockSessions.find(s => s.id === sessionId);
      if (!session) throw new Error('Session introuvable');
      if (session.isCurrent) throw new Error('Impossible de révoquer la session courante');

      mockSessions = mockSessions.filter(s => s.id !== sessionId);
      mockEvents = [
        {
          id: `sec_evt_${Date.now()}`,
          type: 'session_revoked',
          description: `Session révoquée: ${session.deviceInfo}`,
          ipAddress: '196.28.245.12',
          location: 'Ouagadougou, Burkina Faso',
          createdAt: new Date().toISOString(),
        },
        ...mockEvents,
      ];
      return;
    }

    const response = await apiService.delete<void>(
      ENDPOINTS.security.revokeSession(sessionId)
    );
    if (!response.success) {
      throw new Error(response.error || 'Erreur révocation session');
    }
  }

  /**
   * Révoque toutes les sessions sauf la courante
   * Mode MOCK: Filtre les sessions non-courantes
   * Mode PRODUCTION: DELETE /admin/security/sessions/revoke-others
   */
  async revokeAllOtherSessions(): Promise<number> {
    if (AppConfig.isMock) {
      console.log('[SecurityService] Mode MOCK - Révocation toutes les autres sessions');
      await this.simulateDelay(500);

      const othersCount = mockSessions.filter(s => !s.isCurrent).length;
      mockSessions = mockSessions.filter(s => s.isCurrent);
      
      if (othersCount > 0) {
        mockEvents = [
          {
            id: `sec_evt_${Date.now()}`,
            type: 'session_revoked',
            description: `${othersCount} session(s) révoquée(s) en masse`,
            ipAddress: '196.28.245.12',
            location: 'Ouagadougou, Burkina Faso',
            createdAt: new Date().toISOString(),
          },
          ...mockEvents,
        ];
      }
      return othersCount;
    }

    const response = await apiService.delete<{ count: number }>(
      ENDPOINTS.security.revokeAllOtherSessions()
    );
    if (response.success && response.data) return response.data.count;
    throw new Error(response.error || 'Erreur révocation sessions');
  }

  /**
   * Récupère le journal des événements de sécurité
   * Mode MOCK: Retourne MOCK_SECURITY_EVENTS
   * Mode PRODUCTION: GET /admin/security/events
   */
  async getSecurityEvents(): Promise<SecurityEvent[]> {
    if (AppConfig.isMock) {
      return [...mockEvents].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    const response = await apiService.get<SecurityEvent[]>(
      ENDPOINTS.security.securityEvents()
    );
    if (response.success && response.data) return response.data;
    throw new Error(response.error || 'Erreur chargement événements');
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  private simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const securityService = new SecurityService();
export default securityService;
