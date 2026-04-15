/**
 * Service API pour l'authentification
 * 
 * ✅ Utilise config/types/constants communs avec Mobile
 */

import { isDevelopment } from '../../shared/config/deployment';
import { API_ENDPOINTS } from '../config';
import { apiClient } from './apiClient';
import { storageService } from '../storage/localStorage.service';
import { logger } from '../../utils/logger';
import { STORAGE_AUTH_TOKEN, STORAGE_REFRESH_TOKEN, STORAGE_CURRENT_USER, STORAGE_MANAGERS, STORAGE_CASHIERS } from '../../shared/constants/storage';
import type { AuthResponse, OperatorUser } from '../../shared/types/common';
import type { LoginDto, RegisterDto, ResetPasswordDto } from '../types';

class AuthService {
  /**
   * Connexion utilisateur
   */
  async login(data: LoginDto): Promise<AuthResponse> {
    logger.info('🔐 Tentative connexion', { email: data.email });

    if (isDevelopment()) {
      // MODE LOCAL : Vérifier dans localStorage
      const managers = storageService.get(STORAGE_MANAGERS) || [];
      const cashiers = storageService.get(STORAGE_CASHIERS) || [];
      
      // Chercher l'utilisateur (par email ou whatsapp@phone.transportbf.bf)
      const rawPhone = data.email.replace(/@phone\.transportbf\.bf$/, '');
      const manager = managers.find((m: any) => m.email === data.email || m.whatsapp === rawPhone);
      const cashier = cashiers.find((c: any) => c.email === data.email || c.whatsapp === rawPhone);
      
      let user: any = manager || cashier;

      if (!user) {
        // Comptes démo : inférer le rôle depuis le numéro WhatsApp de démo
        const demoRoles: Record<string, string> = {
          '70000001': 'responsable',
          '70000002': 'manager',
          '70000003': 'cashier',
        };
        const inferredRole = demoRoles[rawPhone];

        if (inferredRole) {
          user = {
            id: inferredRole === 'manager' ? 'mgr_dev_1' : inferredRole === 'cashier' ? 'cash_dev_1' : 'resp_1',
            name: inferredRole === 'manager' ? 'Manager Dev' : inferredRole === 'cashier' ? 'Caissier Dev' : 'Jean Ouédraogo',
            email: data.email,
            whatsapp: rawPhone,
            role: inferredRole,
            status: 'active',
            companyId: 'soc_1',
            companyName: 'TSR - Transport Sayouba Rasmané',
            ...(inferredRole !== 'responsable' ? { gareId: 'gare_1', gareName: 'Gare Ouaga Centre' } : {}),
          };
        } else {
          throw new Error('Numéro WhatsApp ou mot de passe incorrect');
        }
      }

      // Vérifier le statut
      if (user.status !== 'active') {
        throw new Error('Compte inactif');
      }

      // Étape 1 : retourner otpRequired (ne PAS sauvegarder de session)
      // On stocke temporairement l'user pour que verifyOtp puisse le retrouver
      storageService.set('_pending_otp_user', user);

      const authResponse: AuthResponse = {
        otpRequired: true,
        identifier: data.email,
        message: 'OTP envoyé sur votre WhatsApp (mode démo: entrez 123456)',
        otpCode: '123456', // affiché en dev uniquement
      };

      logger.info('📨 OTP requis (local)', { email: data.email, otpCode: '123456' });

      return authResponse;
    } else {
      // MODE API : Utiliser apiClient
      const authResponse = await apiClient.post<AuthResponse>(API_ENDPOINTS.auth.login, data);

      // Si OTP requis (envoyé via WhatsApp), ne pas sauvegarder de tokens
      if (authResponse.otpRequired) {
        logger.info('📨 OTP requis via WhatsApp', { identifier: authResponse.identifier });
        return authResponse;
      }

      // Sauvegarder la session
      if (authResponse.token) {
        storageService.set(STORAGE_AUTH_TOKEN, authResponse.token);
      }
      if (authResponse.user) {
        storageService.set(STORAGE_CURRENT_USER, authResponse.user);
      }
      if (authResponse.refreshToken) {
        storageService.set(STORAGE_REFRESH_TOKEN, authResponse.refreshToken);
      }

logger.info('✅ Connexion réussie (API)', {
        user: authResponse.user?.email,
        role: (authResponse.user as OperatorUser)?.role 
      });

      return authResponse;
    }
  }

  /**
   * Inscription utilisateur
   */
  async register(data: RegisterDto): Promise<AuthResponse> {
    logger.info('📝 Inscription utilisateur', { email: data.email, role: data.role });

    if (isDevelopment()) {
      // En mode local, l'inscription se fait via les pages de gestion
      throw new Error('Inscription non disponible en mode local');
    } else {
      return await apiClient.post<AuthResponse>(API_ENDPOINTS.auth.register, data);
    }
  }

  /**
   * Déconnexion
   */
  async logout(): Promise<void> {
    logger.info('👋 Déconnexion');

    if (isDevelopment()) {
      storageService.remove(STORAGE_AUTH_TOKEN);
      storageService.remove(STORAGE_CURRENT_USER);
      logger.info('✅ Déconnexion (local)');
    } else {
      await apiClient.post(API_ENDPOINTS.auth.logout, {});

      storageService.remove(STORAGE_AUTH_TOKEN);
      storageService.remove(STORAGE_REFRESH_TOKEN);
      storageService.remove(STORAGE_CURRENT_USER);
      logger.info('✅ Déconnexion (API)');
    }
  }

  /**
   * Obtenir l'utilisateur connecté
   */
  getCurrentUser(): AuthResponse['user'] | null {
    return storageService.get(STORAGE_CURRENT_USER);
  }

  /**
   * Vérifier si l'utilisateur est connecté
   */
  isAuthenticated(): boolean {
    return !!storageService.get(STORAGE_AUTH_TOKEN);
  }

  /**
   * Obtenir le token d'authentification
   */
  getToken(): string | null {
    return storageService.get(STORAGE_AUTH_TOKEN);
  }

  /**
   * Réinitialiser le mot de passe
   */
  async resetPassword(data: ResetPasswordDto): Promise<void> {
    logger.info('🔄 Réinitialisation mot de passe', { email: data.email });

    if (isDevelopment()) {
      // Simuler l'envoi d'email
      logger.warn('⚠️ Email de réinitialisation simulé (mode local)');
      return;
    } else {
      await apiClient.post(API_ENDPOINTS.auth.resetPassword, data);
      logger.info('✅ Email de réinitialisation envoyé');
    }
  }

  /**
   * Rafraîchir le token d'authentification
   */
  async refreshToken(): Promise<string> {
    const refreshToken = storageService.get(STORAGE_REFRESH_TOKEN);
    if (!refreshToken) {
      throw new Error('Aucun refresh token disponible');
    }

    const response = await apiClient.post<{ token: string }>(
      API_ENDPOINTS.auth.refreshToken,
      { refreshToken },
    );

    storageService.set(STORAGE_AUTH_TOKEN, response.token);
    logger.info('🔄 Token rafraîchi');
    return response.token;
  }

  /**
   * Vérifier si l'utilisateur a un rôle spécifique
   */
  hasRole(role: 'responsable' | 'manager' | 'cashier'): boolean {
    const user = this.getCurrentUser() as OperatorUser | null;
    return user?.role === role;
  }

  /**
   * Vérifier un code OTP (après login WhatsApp)
   */
  async verifyOtp(identifier: string, code: string): Promise<AuthResponse> {
    if (isDevelopment()) {
      // Mock: accepter tout code de 6 chiffres
      if (code.length !== 6) throw new Error('Code OTP invalide');

      // Récupérer l'utilisateur stocké lors du login (étape 1)
      const pendingUser = storageService.get('_pending_otp_user');
      storageService.remove('_pending_otp_user');

      if (!pendingUser) {
        throw new Error('Session expirée, veuillez vous reconnecter');
      }

      const authResponse: AuthResponse = {
        user: {
          id: (pendingUser as any).id,
          email: (pendingUser as any).email,
          name: (pendingUser as any).name,
          role: (pendingUser as any).role,
          status: 'active',
          gareId: (pendingUser as any).gareId,
          gareName: (pendingUser as any).gareName,
          companyId: (pendingUser as any).companyId,
          companyName: (pendingUser as any).companyName,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as OperatorUser,
        token: `mock_token_otp_${Date.now()}`,
        refreshToken: `mock_refresh_otp_${Date.now()}`,
        expiresIn: 3600,
      };

      // Sauvegarder la session
      if (authResponse.token) {
        storageService.set(STORAGE_AUTH_TOKEN, authResponse.token);
      }
      if (authResponse.user) {
        storageService.set(STORAGE_CURRENT_USER, authResponse.user);
      }

      return authResponse;
    }

    const response = await apiClient.post<AuthResponse>(
      API_ENDPOINTS.auth.verifyOtp,
      { identifier, code, mode: 'auth' }
    );

    // Sauvegarder les tokens après vérification OTP réussie
    if (response.token) {
      storageService.set(STORAGE_AUTH_TOKEN, response.token);
    }
    if (response.user) {
      storageService.set(STORAGE_CURRENT_USER, response.user);
    }
    if (response.refreshToken) {
      storageService.set(STORAGE_REFRESH_TOKEN, response.refreshToken);
    }

    return response;
  }

  /**
   * Renvoyer un code OTP
   */
  async resendOtp(email: string): Promise<{ message: string; otpCode?: string }> {
    if (isDevelopment()) {
      return { message: 'OTP renvoyé sur votre WhatsApp', otpCode: '123456' };
    }

    return apiClient.post(API_ENDPOINTS.auth.resendOtp, { email });
  }

  /**
   * Obtenir l'ID de la gare de l'utilisateur connecté
   */
  getCurrentGareId(): string | undefined {
    const user = this.getCurrentUser() as OperatorUser | null;
    return user?.gareId;
  }
}

export const authService = new AuthService();