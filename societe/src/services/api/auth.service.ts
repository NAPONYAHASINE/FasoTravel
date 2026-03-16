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
          role: manager ? 'manager' : 'cashier',
          status: 'active',
          gareId: user.gareId,
          gareName: user.gareName,
        } as OperatorUser,
        token: `mock_token_${user.id}`,
      };

      // Sauvegarder la session
      storageService.set(STORAGE_AUTH_TOKEN, authResponse.token);
      storageService.set(STORAGE_CURRENT_USER, authResponse.user);

      logger.info('✅ Connexion réussie (local)', { 
        user: authResponse.user.email, 
        role: (authResponse.user as OperatorUser).role 
      });

      return authResponse;
    } else {
      // MODE API : Utiliser apiClient
      const authResponse = await apiClient.post<AuthResponse>(API_ENDPOINTS.auth.login, data);

      // Sauvegarder la session
      storageService.set(STORAGE_AUTH_TOKEN, authResponse.token);
      storageService.set(STORAGE_CURRENT_USER, authResponse.user);
      if (authResponse.refreshToken) {
        storageService.set(STORAGE_REFRESH_TOKEN, authResponse.refreshToken);
      }

logger.info('✅ Connexion réussie (API)', {
        user: authResponse.user.email,
        role: (authResponse.user as OperatorUser).role 
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
   * Obtenir l'ID de la gare de l'utilisateur connecté
   */
  getCurrentGareId(): string | undefined {
    const user = this.getCurrentUser() as OperatorUser | null;
    return user?.gareId;
  }
}

export const authService = new AuthService();