/**
 * Auth Service - TransportBF Mobile
 * 
 * Gère:
 * - Login / Register
 * - Token management
 * - Session management
 * - Logout
 * 
 * ✅ Dual-mode: LOCAL (dev) / API (prod)
 * ✅ Utilise config/types/constants communs avec Societe
 */

import { apiClient } from './apiClient';
import { storageService } from '../storage/localStorage.service';
import { API_ENDPOINTS } from '../config';
import { isDevelopment } from '../../shared/config/deployment';
import { STORAGE_AUTH_TOKEN, STORAGE_REFRESH_TOKEN, STORAGE_CURRENT_USER, STORAGE_TOKEN_EXPIRES_AT } from '../../shared/constants/storage';
import type { User, AuthCredentials, AuthRegisterData, AuthResponse, PassengerUser } from '../../shared/types/common';

class AuthService {
  /**
   * Login utilisateur
   */
  async login(credentials: AuthCredentials): Promise<AuthResponse> {
    if (isDevelopment()) {
      // Mock login
      return this.mockLogin(credentials);
    }

    const response = await apiClient.post<AuthResponse>(
      API_ENDPOINTS.auth.login,
      credentials
    );

    this.saveAuthData(response);
    return response;
  }

  /**
   * Register nouvel utilisateur
   */
  async register(data: AuthRegisterData): Promise<AuthResponse> {
    if (isDevelopment()) {
      // Mock register
      return this.mockRegister(data);
    }

    const response = await apiClient.post<AuthResponse>(
      API_ENDPOINTS.auth.register,
      data
    );

    this.saveAuthData(response);
    return response;
  }

  /**
   * Logout utilisateur
   */
  async logout(): Promise<void> {
    try {
      if (!isDevelopment()) {
        await apiClient.post(API_ENDPOINTS.auth.logout);
      }
    } finally {
      this.clearAuthData();
    }
  }

  /**
   * Récupère le profil utilisateur actuel
   */
  async getCurrentUser(): Promise<User | null> {
    if (isDevelopment()) {
      // Mock: récupérer depuis cache
      return storageService.get<User>(STORAGE_CURRENT_USER);
    }

    try {
      const user = await apiClient.get<User>(API_ENDPOINTS.auth.me);
      return user;
    } catch {
      return null;
    }
  }

  /**
   * Refresh token
   */
  async refreshToken(): Promise<string> {
    if (isDevelopment()) {
      // Mock: générer un nouveau token
      const newToken = `mock_token_${Date.now()}`;
      storageService.set(STORAGE_AUTH_TOKEN, newToken);
      return newToken;
    }

    const response = await apiClient.post<{ token: string }>(
      API_ENDPOINTS.auth.refresh
    );

    storageService.set(STORAGE_AUTH_TOKEN, response.token);
    return response.token;
  }

  /**
   * Récupère le token actuel
   */
  getToken(): string | null {
    return storageService.get<string>(STORAGE_AUTH_TOKEN);
  }

  /**
   * Vérifie si l'utilisateur est authentifié
   */
  isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  /**
   * Sauvegarde les données d'auth
   */
  private saveAuthData(response: AuthResponse): void {
    storageService.set(STORAGE_AUTH_TOKEN, response.token);
    storageService.set(STORAGE_REFRESH_TOKEN, response.refreshToken);
    storageService.set(STORAGE_CURRENT_USER, response.user);
    storageService.set(STORAGE_TOKEN_EXPIRES_AT, Date.now() + (response.expiresIn || 3600) * 1000);
  }

  /**
   * Efface les données d'auth
   */
  private clearAuthData(): void {
    storageService.remove(STORAGE_AUTH_TOKEN);
    storageService.remove(STORAGE_REFRESH_TOKEN);
    storageService.remove(STORAGE_CURRENT_USER);
    storageService.remove(STORAGE_TOKEN_EXPIRES_AT);
  }

  // ============================================
  // MOCK DATA
  // ============================================

  private mockLogin(credentials: AuthCredentials): AuthResponse {
    const mockUser: PassengerUser = {
      id: 'user_1',
      email: credentials.email,
      phone: '+226 70 11 22 33',
      firstName: 'John',
      lastName: 'Doe',
      role: 'PASSENGER',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const mockResponse: AuthResponse = {
      user: mockUser,
      token: `mock_token_${Date.now()}`,
      refreshToken: `mock_refresh_${Date.now()}`,
      expiresIn: 3600,
    };

    this.saveAuthData(mockResponse);
    return mockResponse;
  }

  private mockRegister(data: AuthRegisterData): AuthResponse {
    const mockUser: PassengerUser = {
      id: `user_${Date.now()}`,
      email: data.email,
      phone: data.phone,
      firstName: data.firstName,
      lastName: data.lastName,
      role: 'PASSENGER',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const mockResponse: AuthResponse = {
      user: mockUser,
      token: `mock_token_${Date.now()}`,
      refreshToken: `mock_refresh_${Date.now()}`,
      expiresIn: 3600,
    };

    this.saveAuthData(mockResponse);
    return mockResponse;
  }
}

export const authService = new AuthService();
