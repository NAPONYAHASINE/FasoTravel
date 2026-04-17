/**
 * @file authService.ts
 * @description Service d'authentification unifié — Mock + Production
 * 
 * Architecture backend-ready :
 * - Mode mock : validation locale depuis adminMockData (MOCK_ADMIN_USERS)
 * - Mode production : appels API vers /auth/*
 * 
 * ENDPOINTS MAPPÉS :
 * POST   /auth/login          → login()
 * POST   /auth/logout         → logout()
 * POST   /auth/verify-otp     → verifyOtp()
 * POST   /auth/resend-otp     → resendOtp()
 * POST   /auth/refresh        → refreshToken()
 * GET    /auth/me             → getMe()
 * POST   /auth/reset-password → resetPassword()
 */

import { AppConfig } from '../config/app.config';
import { apiService } from './apiService';
import { ENDPOINTS } from './endpoints';
import { MOCK_ADMIN_USERS } from '../lib/adminMockData';
import type { AdminUser } from '../shared/types/standardized';

// ============================================================================
// TYPES
// ============================================================================

export interface LoginResult {
  success: boolean;
  user?: AdminUser;
  otpSent?: boolean;
  token?: string;
  refreshToken?: string;
  error?: string;
}

export interface OtpVerifyResult {
  success: boolean;
  user?: AdminUser;
  token?: string;
  refreshToken?: string;
  error?: string;
}

// ============================================================================
// SERVICE
// ============================================================================

class AuthService {
  private pendingOtp: string = '';
  private pendingUser: AdminUser | null = null;

  /**
   * Login — étape 1 : valider les credentials et envoyer OTP
   */
  async login(email: string, password: string): Promise<LoginResult> {
    if (AppConfig.isMock) {
      await new Promise(r => setTimeout(r, 1000));
      
      const cleanEmail = email.trim().toLowerCase();
      const cleanPassword = password.trim();
      
      const admin = MOCK_ADMIN_USERS.find(u => u.email.toLowerCase() === cleanEmail);
      
      if (!admin || cleanPassword !== 'Admin123!') {
        return { success: false, error: 'Email ou mot de passe incorrect' };
      }
      
      // Générer OTP mock
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      this.pendingOtp = otp;
      this.pendingUser = admin;
      
      console.log(`🔐 [MOCK] Code OTP envoyé à ${cleanEmail}: ${otp}`);
      
      return { success: true, user: admin, otpSent: true };
    }
    
    // MODE PRODUCTION
    const response = await apiService.post<{ token: string; refreshToken: string; user: AdminUser; expiresIn: number; otpRequired?: boolean; identifier?: string }>(
      ENDPOINTS.auth.login(),
      { email, password }
    );
    
    if (response.success && response.data) {
      this.pendingUser = response.data.user;

      // Admin roles: backend returns tokens directly (no OTP)
      if (response.data.token && !response.data.otpRequired) {
        return {
          success: true,
          user: response.data.user,
          token: response.data.token,
          refreshToken: response.data.refreshToken,
          otpSent: false,
        };
      }

      // Non-admin: OTP flow
      return {
        success: true,
        user: response.data.user,
        otpSent: true,
      };
    }
    
    return { success: false, error: response.error || 'Échec de l\'authentification serveur' };
  }

  /**
   * Vérifier le code OTP — étape 2
   */
  async verifyOtp(code: string, email?: string): Promise<OtpVerifyResult> {
    if (AppConfig.isMock) {
      await new Promise(r => setTimeout(r, 800));
      
      if (code !== this.pendingOtp) {
        return { success: false, error: 'Code OTP incorrect. Vérifiez votre email et réessayez.' };
      }
      
      const user = this.pendingUser;
      this.clearPending();
      
      return { success: true, user: user || undefined };
    }
    
    // MODE PRODUCTION
    const response = await apiService.post<{ token: string; refreshToken: string; user: AdminUser }>(
      ENDPOINTS.auth.verifyOtp(),
      { code, email }
    );
    
    if (response.success && response.data) {
      this.clearPending();
      return {
        success: true,
        user: response.data.user,
        token: response.data.token,
        refreshToken: response.data.refreshToken,
      };
    }
    
    return { success: false, error: response.error || 'Code OTP invalide' };
  }

  /**
   * Renvoyer un nouveau code OTP
   */
  async resendOtp(email: string): Promise<{ success: boolean; error?: string }> {
    if (AppConfig.isMock) {
      await new Promise(r => setTimeout(r, 500));
      
      const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
      this.pendingOtp = newOtp;
      
      console.log(`🔐 [MOCK] Nouveau code OTP envoyé à ${email}: ${newOtp}`);
      
      return { success: true };
    }
    
    // MODE PRODUCTION
    const response = await apiService.post('/auth/resend-otp', { email });
    return { success: response.success, error: response.error };
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    if (AppConfig.isMock) {
      this.clearPending();
      return;
    }
    
    await apiService.post(ENDPOINTS.auth.logout());
    this.clearPending();
  }

  /**
   * Refresh token
   */
  async refreshToken(refreshToken: string): Promise<{ token?: string; error?: string }> {
    if (AppConfig.isMock) {
      return { token: 'mock_refreshed_token_' + Date.now() };
    }
    
    const response = await apiService.post<{ token: string }>(
      ENDPOINTS.auth.refresh(),
      { refreshToken }
    );
    
    if (response.success && response.data) {
      return { token: response.data.token };
    }
    return { error: response.error || 'Refresh failed' };
  }

  /**
   * Récupérer l'utilisateur courant
   */
  async getMe(): Promise<AdminUser | null> {
    if (AppConfig.isMock) {
      return this.pendingUser;
    }
    
    const response = await apiService.get<AdminUser>(ENDPOINTS.auth.me());
    return response.success && response.data ? response.data : null;
  }

  /**
   * Demander une réinitialisation de mot de passe (envoie OTP)
   */
  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    if (AppConfig.isMock) {
      await new Promise(r => setTimeout(r, 800));
      return { success: true };
    }
    
    const response = await apiService.post(
      ENDPOINTS.auth.forgotPassword(),
      { email }
    );
    return { success: response.success, error: response.error };
  }

  /**
   * Obtenir l'utilisateur en attente d'OTP (pour le context)
   */
  getPendingUser(): AdminUser | null {
    return this.pendingUser;
  }

  private clearPending(): void {
    this.pendingOtp = '';
    this.pendingUser = null;
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const authService = new AuthService();
