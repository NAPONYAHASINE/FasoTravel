/**
 * Service API pour l'authentification
 */

import { isLocalMode, API_ENDPOINTS, API_CONFIG } from '../config';
import { apiClient } from './apiClient';
import { storageService } from '../storage/localStorage.service';
import { logger } from '../../utils/logger';
import type { LoginDto, RegisterDto, AuthResponse, ResetPasswordDto } from '../types';

class AuthService {
  /**
   * Connexion utilisateur
   */
  async login(data: LoginDto): Promise<AuthResponse> {
    logger.info('🔐 Tentative connexion', { email: data.email });

    if (isLocalMode()) {
      // MODE LOCAL : Vérifier dans localStorage
      const managers = storageService.get('managers') || [];
      const cashiers = storageService.get('cashiers') || [];
      
      // Chercher l'utilisateur
      const manager = managers.find((m: any) => m.email === data.email && m.password === data.password);
      const cashier = cashiers.find((c: any) => c.email === data.email && c.password === data.password);
      
      const user = manager || cashier;

      if (!user) {
        throw new Error('Email ou mot de passe incorrect');
      }

      // Vérifier le statut
      if (user.status !== 'active') {
        throw new Error('Compte inactif');
      }

      const authResponse: AuthResponse = {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: manager ? 'manager' : 'cashier',
          gareId: user.gareId,
          gareName: user.gareName,
        },
        token: `mock_token_${user.id}`,
      };

      // Sauvegarder la session
      storageService.set('auth_token', authResponse.token);
      storageService.set('auth_user', authResponse.user);

      logger.success('✅ Connexion réussie (local)', { 
        user: authResponse.user.name, 
        role: authResponse.user.role 
      });

      return authResponse;
    } else {
      // MODE API : Utiliser apiClient
      const authResponse = await apiClient.post<AuthResponse>(API_ENDPOINTS.auth.login, data);

      // Sauvegarder la session
      storageService.set('auth_token', authResponse.token);
      storageService.set('auth_user', authResponse.user);

      logger.success('✅ Connexion réussie (API)', { 
        user: authResponse.user.name, 
        role: authResponse.user.role 
      });

      return authResponse;
    }
  }

  /**
   * Inscription utilisateur
   */
  async register(data: RegisterDto): Promise<AuthResponse> {
    logger.info('📝 Inscription utilisateur', { email: data.email, role: data.role });

    if (isLocalMode()) {
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

    if (isLocalMode()) {
      storageService.remove('auth_token');
      storageService.remove('auth_user');
      logger.success('✅ Déconnexion (local)');
    } else {
      await apiClient.post(API_ENDPOINTS.auth.logout, {});

      storageService.remove('auth_token');
      storageService.remove('auth_user');
      logger.success('✅ Déconnexion (API)');
    }
  }

  /**
   * Obtenir l'utilisateur connecté
   */
  getCurrentUser(): AuthResponse['user'] | null {
    return storageService.get('auth_user');
  }

  /**
   * Vérifier si l'utilisateur est connecté
   */
  isAuthenticated(): boolean {
    return !!storageService.get('auth_token');
  }

  /**
   * Obtenir le token d'authentification
   */
  getToken(): string | null {
    return storageService.get('auth_token');
  }

  /**
   * Réinitialiser le mot de passe
   */
  async resetPassword(data: ResetPasswordDto): Promise<void> {
    logger.info('🔄 Réinitialisation mot de passe', { email: data.email });

    if (isLocalMode()) {
      // Simuler l'envoi d'email
      logger.warn('⚠️ Email de réinitialisation simulé (mode local)');
      return;
    } else {
      await apiClient.post(API_ENDPOINTS.auth.resetPassword, data);
      logger.success('✅ Email de réinitialisation envoyé');
    }
  }

  /**
   * Vérifier si l'utilisateur a un rôle spécifique
   */
  hasRole(role: 'responsable' | 'manager' | 'cashier'): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  /**
   * Obtenir l'ID de la gare de l'utilisateur connecté
   */
  getCurrentGareId(): string | undefined {
    const user = this.getCurrentUser();
    return user?.gareId;
  }
}

export const authService = new AuthService();