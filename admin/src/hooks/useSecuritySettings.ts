/**
 * @file useSecuritySettings.ts
 * @description Hook dédié pour l'onglet Sécurité des Paramètres — modèle BookingManagement
 * Backend-ready : toute la logique métier déléguée à securityService
 * 
 * ARCHITECTURE:
 *   securityService (mock/prod toggle) → useSecuritySettings (hook) → Settings.tsx (UI)
 * 
 * Convention: useAdminApp() pour le refresh cross-page
 */

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner@2.0.3';
import { securityService } from '../services/securityService';
import type {
  AdminActiveSession,
  SecurityEvent,
  TwoFactorSetup,
} from '../shared/types/standardized';

// ============================================================================
// TYPES
// ============================================================================

export interface PasswordForm {
  current: string;
  new: string;
  confirm: string;
}

export type TwoFactorStep = 'idle' | 'setup' | 'verify' | 'backup_codes';

export interface UseSecuritySettingsReturn {
  // State
  twoFactorEnabled: boolean;
  lastPasswordChange: string;
  activeSessions: AdminActiveSession[];
  securityEvents: SecurityEvent[];
  passwordForm: PasswordForm;
  twoFactorStep: TwoFactorStep;
  twoFactorSetup: TwoFactorSetup | null;
  verificationCode: string;
  isLoading: boolean;

  // Password actions
  setPasswordForm: (form: PasswordForm) => void;
  handlePasswordChange: () => Promise<void>;

  // 2FA actions
  handleInitiate2FA: () => Promise<void>;
  handleVerify2FA: () => Promise<void>;
  handleDisable2FA: () => Promise<void>;
  setVerificationCode: (code: string) => void;
  cancelTwoFactorSetup: () => void;

  // Session actions
  handleRevokeSession: (sessionId: string) => Promise<void>;
  handleRevokeAllOtherSessions: () => Promise<void>;

  // Refresh
  refresh: () => Promise<void>;
}

// ============================================================================
// HOOK
// ============================================================================

export function useSecuritySettings(): UseSecuritySettingsReturn {
  // ---- State ----
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [lastPasswordChange, setLastPasswordChange] = useState('');
  const [activeSessions, setActiveSessions] = useState<AdminActiveSession[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Password form
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    current: '',
    new: '',
    confirm: '',
  });

  // 2FA flow
  const [twoFactorStep, setTwoFactorStep] = useState<TwoFactorStep>('idle');
  const [twoFactorSetup, setTwoFactorSetup] = useState<TwoFactorSetup | null>(null);
  const [verificationCode, setVerificationCode] = useState('');

  // ---- Load data ----
  const refresh = useCallback(async () => {
    try {
      const profile = await securityService.getSecurityProfile();
      setTwoFactorEnabled(profile.twoFactorEnabled);
      setLastPasswordChange(profile.lastPasswordChange);
      setActiveSessions(profile.activeSessions);
      setSecurityEvents(profile.recentEvents);
    } catch (error) {
      console.error('[useSecuritySettings] Erreur chargement:', error);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // ---- Password ----
  const handlePasswordChange = useCallback(async () => {
    if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    if (passwordForm.new !== passwordForm.confirm) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    if (passwordForm.new.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setIsLoading(true);
    try {
      await securityService.changePassword(passwordForm.current, passwordForm.new);
      toast.success('Mot de passe modifié avec succès');
      setPasswordForm({ current: '', new: '', confirm: '' });
      await refresh();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setIsLoading(false);
    }
  }, [passwordForm, refresh]);

  // ---- 2FA ----
  const handleInitiate2FA = useCallback(async () => {
    setIsLoading(true);
    try {
      const setup = await securityService.initiate2FA();
      setTwoFactorSetup(setup);
      setTwoFactorStep('verify');
      setVerificationCode('');
    } catch (error: any) {
      toast.error(error.message || 'Erreur initialisation 2FA');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleVerify2FA = useCallback(async () => {
    if (!verificationCode) {
      toast.error('Entrez le code à 6 chiffres');
      return;
    }

    setIsLoading(true);
    try {
      await securityService.verify2FA(verificationCode);
      setTwoFactorEnabled(true);
      setTwoFactorStep('backup_codes');
      toast.success('Authentification à 2 facteurs activée');
      await refresh();
    } catch (error: any) {
      toast.error(error.message || 'Code invalide');
    } finally {
      setIsLoading(false);
    }
  }, [verificationCode, refresh]);

  const handleDisable2FA = useCallback(async () => {
    setIsLoading(true);
    try {
      await securityService.disable2FA();
      setTwoFactorEnabled(false);
      setTwoFactorStep('idle');
      setTwoFactorSetup(null);
      toast.success('Authentification à 2 facteurs désactivée');
      await refresh();
    } catch (error: any) {
      toast.error(error.message || 'Erreur désactivation 2FA');
    } finally {
      setIsLoading(false);
    }
  }, [refresh]);

  const cancelTwoFactorSetup = useCallback(() => {
    setTwoFactorStep('idle');
    setTwoFactorSetup(null);
    setVerificationCode('');
  }, []);

  // ---- Sessions ----
  const handleRevokeSession = useCallback(async (sessionId: string) => {
    setIsLoading(true);
    try {
      await securityService.revokeSession(sessionId);
      toast.success('Session révoquée');
      await refresh();
    } catch (error: any) {
      toast.error(error.message || 'Erreur révocation session');
    } finally {
      setIsLoading(false);
    }
  }, [refresh]);

  const handleRevokeAllOtherSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const count = await securityService.revokeAllOtherSessions();
      if (count > 0) {
        toast.success(`${count} session(s) révoquée(s)`);
      } else {
        toast.info('Aucune autre session active');
      }
      await refresh();
    } catch (error: any) {
      toast.error(error.message || 'Erreur révocation sessions');
    } finally {
      setIsLoading(false);
    }
  }, [refresh]);

  return {
    twoFactorEnabled,
    lastPasswordChange,
    activeSessions,
    securityEvents,
    passwordForm,
    twoFactorStep,
    twoFactorSetup,
    verificationCode,
    isLoading,
    setPasswordForm,
    handlePasswordChange,
    handleInitiate2FA,
    handleVerify2FA,
    handleDisable2FA,
    setVerificationCode,
    cancelTwoFactorSetup,
    handleRevokeSession,
    handleRevokeAllOtherSessions,
    refresh,
  };
}
