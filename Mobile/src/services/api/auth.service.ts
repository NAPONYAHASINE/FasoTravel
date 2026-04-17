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
  private pendingOtp: string = '';

  /**
   * Login utilisateur
   * Non-admin: backend renvoie { otpRequired, identifier } → OTP via WhatsApp
   * Admin: backend renvoie { user, token, refreshToken } directement
   */
  async login(credentials: AuthCredentials): Promise<AuthResponse> {
    if (isDevelopment()) {
      // Mock login — simule le flow OTP WhatsApp
      return this.mockLogin(credentials);
    }

    const response = await apiClient.post<AuthResponse>(
      API_ENDPOINTS.auth.login,
      credentials
    );

    // Si OTP requis (non-admin), ne pas sauvegarder de tokens
    if (response.otpRequired) {
      return response;
    }

    this.saveAuthData(response as Required<Pick<AuthResponse, 'token' | 'user'>> & AuthResponse);
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
   * Vérifie un code OTP et sauvegarde les tokens retournés
   */
  async verifyOtp(identifier: string, code: string, mode: string): Promise<AuthResponse> {
    if (isDevelopment()) {
      // Valider le code OTP exact généré au login
      if (code.length !== 6) throw new Error('Code OTP invalide');
      if (this.pendingOtp && code !== this.pendingOtp) {
        throw new Error('Code OTP incorrect');
      }
      this.pendingOtp = '';
      const storedUser = storageService.get<User>(STORAGE_CURRENT_USER);
      const mockResponse: AuthResponse = {
        user: storedUser || undefined,
        token: `mock_token_${Date.now()}`,
        refreshToken: `mock_refresh_${Date.now()}`,
        expiresIn: 3600,
      };
      this.saveAuthData(mockResponse);
      return mockResponse;
    }

    const response = await apiClient.post<AuthResponse>(
      API_ENDPOINTS.auth.verifyOtp,
      { identifier, code, mode }
    );
    this.saveAuthData(response);
    return response;
  }

  /**
   * Renvoyer un code OTP
   */
  async resendOtp(identifier: string, mode: string): Promise<void> {
    if (isDevelopment()) {
      // Régénérer un nouveau code OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      this.pendingOtp = otpCode;
      console.log(`🔐 [DEV] Nouveau code OTP renvoyé à ${identifier.replace(/@phone\.transportbf\.bf$/, '')}: ${otpCode}`);
      return;
    }

    await apiClient.post(API_ENDPOINTS.auth.resendOtp, { identifier, mode });
  }

  /**
   * Mot de passe oublié — envoie un OTP au numéro WhatsApp
   */
  async forgotPassword(email: string): Promise<{ message: string; otpCode?: string }> {
    if (isDevelopment()) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      console.log(`🔐 [DEV] OTP mot de passe oublié: ${otp}`);
      return { message: 'OTP envoyé sur votre WhatsApp', otpCode: otp };
    }

    return apiClient.post<{ message: string; otpCode?: string }>(
      API_ENDPOINTS.auth.forgotPassword,
      { email }
    );
  }

  /**
   * Réinitialiser le mot de passe avec OTP
   */
  async resetPassword(email: string, code: string, newPassword: string): Promise<{ message: string }> {
    if (isDevelopment()) {
      return { message: 'Mot de passe réinitialisé avec succès' };
    }

    return apiClient.post<{ message: string }>(
      API_ENDPOINTS.auth.resetPassword,
      { email, code, newPassword }
    );
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
    if (response.token) {
      storageService.set(STORAGE_AUTH_TOKEN, response.token);
    }
    if (response.refreshToken) {
      storageService.set(STORAGE_REFRESH_TOKEN, response.refreshToken);
    }
    if (response.user) {
      storageService.set(STORAGE_CURRENT_USER, response.user);
    }
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
    // Générer un vrai OTP aléatoire (comme Admin et Société)
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    this.pendingOtp = otpCode;
    console.log(`🔐 [DEV] Code OTP envoyé à ${credentials.email.replace(/@phone\.transportbf\.bf$/, '')}: ${otpCode}`);
    return {
      otpRequired: true,
      identifier: credentials.email,
      message: 'OTP envoyé sur votre WhatsApp',
      otpCode,
    };
  }

  private mockRegister(data: AuthRegisterData): AuthResponse {
    // Generate referral code: FT-226-XXXX
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let suffix = '';
    for (let i = 0; i < 4; i++) {
      suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const referralCode = `FT-226-${suffix}`;

    const mockUser: PassengerUser = {
      id: `user_${Date.now()}`,
      email: data.email,
      phone: data.phone,
      firstName: data.firstName,
      lastName: data.lastName,
      role: 'PASSENGER',
      status: 'active',
      referralCode,
      referredBy: data.referralCode || undefined,
      referralPointsBalance: 0,
      totalReferrals: 0,
      badgeLevel: 'standard',
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
