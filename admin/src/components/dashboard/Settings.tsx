import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Bell, Shield, Mail, Key, Building, Save, Monitor, Smartphone, Laptop, X, Clock, MapPin, LogOut, ShieldCheck, ShieldOff, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useSecuritySettings } from '../../hooks/useSecuritySettings';
import type { SecurityEvent } from '../../shared/types/standardized';
import { PAGE_CLASSES } from '../../lib/design-system';

// ========================================
// TYPES LOCAUX (Général + Notifications seulement)
// ========================================
interface GeneralSettingsData {
  notifications: {
    email: boolean;
    push: boolean;
    marketing: boolean;
  };
  company: {
    name: string;
    email: string;
    phone: string;
  };
}

const DEFAULT_SETTINGS: GeneralSettingsData = {
  notifications: {
    email: true,
    push: true,
    marketing: false
  },
  company: {
    name: 'FasoTravel',
    email: 'contact@fasotravel.bf',
    phone: '+226 XX XX XX XX'
  }
};

// ========================================
// HELPERS
// ========================================

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch {
    return iso;
  }
}

function timeAgo(iso: string): string {
  const now = new Date();
  const then = new Date(iso);
  const diffMs = now.getTime() - then.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'À l\'instant';
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Il y a ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  return `Il y a ${diffD}j`;
}

const EVENT_CONFIG: Record<SecurityEvent['type'], { icon: typeof CheckCircle; color: string; bgColor: string }> = {
  login: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' },
  logout: { icon: LogOut, color: 'text-gray-600', bgColor: 'bg-gray-100' },
  password_change: { icon: Key, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  '2fa_enabled': { icon: ShieldCheck, color: 'text-green-600', bgColor: 'bg-green-100' },
  '2fa_disabled': { icon: ShieldOff, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  session_revoked: { icon: X, color: 'text-red-600', bgColor: 'bg-red-100' },
  failed_login: { icon: AlertTriangle, color: 'text-red-600', bgColor: 'bg-red-100' },
};

// ========================================
// COMPOSANT SETTINGS
// ========================================
export function Settings() {
  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'security'>('general');
  
  // États Général + Notifications
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  
  const [companySettings, setCompanySettings] = useState({
    name: 'FasoTravel',
    email: 'contact@fasotravel.bf',
    phone: '+226 XX XX XX XX'
  });

  // Hook backend-ready pour la sécurité
  const security = useSecuritySettings();

  // ========================================
  // CHARGEMENT DEPUIS LOCALSTORAGE AU MONTAGE
  // ========================================
  useEffect(() => {
    try {
      const saved = localStorage.getItem('fasotravel_settings');
      if (saved) {
        const settings: GeneralSettingsData = JSON.parse(saved);
        setEmailNotifications(settings.notifications?.email ?? true);
        setPushNotifications(settings.notifications?.push ?? true);
        setMarketingEmails(settings.notifications?.marketing ?? false);
        setCompanySettings(settings.company || DEFAULT_SETTINGS.company);
      }
    } catch (error) {
      // Silently use default settings if loading fails
    }
  }, []);

  const tabs = [
    { id: 'general', label: 'Général', icon: SettingsIcon },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Sécurité', icon: Shield }
  ];

  // ========================================
  // HANDLERS GÉNÉRAL + NOTIFICATIONS
  // ========================================
  
  const handleSave = () => {
    try {
      const settingsToSave: GeneralSettingsData = {
        notifications: {
          email: emailNotifications,
          push: pushNotifications,
          marketing: marketingEmails
        },
        company: companySettings
      };
      
      localStorage.setItem('fasotravel_settings', JSON.stringify(settingsToSave));
      toast.success('Paramètres sauvegardés avec succès');
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleProfileEdit = () => {
    toast.info('Fonctionnalité de modification du profil disponible prochainement');
  };

  const handleReset = () => {
    setEmailNotifications(DEFAULT_SETTINGS.notifications.email);
    setPushNotifications(DEFAULT_SETTINGS.notifications.push);
    setMarketingEmails(DEFAULT_SETTINGS.notifications.marketing);
    setCompanySettings(DEFAULT_SETTINGS.company);
    
    toast.info('Paramètres réinitialisés');
  };

  return (
    <div className={PAGE_CLASSES.container}>
      {/* Header */}
      <div className={PAGE_CLASSES.header}>
        <div className={PAGE_CLASSES.headerContent}>
          <div className={PAGE_CLASSES.headerTexts}>
            <h1 className="text-4xl text-gray-900 dark:text-white mb-2 tracking-tight">Paramètres</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">Configurez votre compte et vos préférences</p>
          </div>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Sidebar Tabs */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg p-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 text-white shadow-md'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-sm">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg p-8">
            {/* Général */}
            {activeTab === 'general' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl text-gray-900 dark:text-white mb-6">Paramètres Généraux</h2>
                  
                  <div className="space-y-6">
                    {/* Profil */}
                    <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 via-yellow-500 to-green-500 flex items-center justify-center text-white text-2xl shadow-lg">
                          A
                        </div>
                        <div>
                          <h3 className="text-lg text-gray-900 dark:text-white">Admin FasoTravel</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">admin@fasotravel.bf</p>
                        </div>
                      </div>
                      <button 
                        onClick={handleProfileEdit}
                        className="px-6 py-3 bg-gray-900 dark:bg-gray-700 text-white rounded-xl hover:bg-gray-800 dark:hover:bg-gray-600 transition-all shadow-md hover:shadow-lg"
                      >
                        Modifier le profil
                      </button>
                    </div>

                    {/* Entreprise */}
                    <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                      <label className="flex items-center gap-3 mb-3">
                        <Building className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        <span className="text-base text-gray-900 dark:text-white">Informations Entreprise</span>
                      </label>
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="Nom de l'entreprise"
                          value={companySettings.name}
                          onChange={(e) => setCompanySettings({ ...companySettings, name: e.target.value })}
                          className="w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-red-500 transition-all text-gray-900 dark:text-white"
                        />
                        <input
                          type="email"
                          placeholder="Email de contact"
                          value={companySettings.email}
                          onChange={(e) => setCompanySettings({ ...companySettings, email: e.target.value })}
                          className="w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-red-500 transition-all text-gray-900 dark:text-white"
                        />
                        <input
                          type="tel"
                          placeholder="Téléphone"
                          value={companySettings.phone}
                          onChange={(e) => setCompanySettings({ ...companySettings, phone: e.target.value })}
                          className="w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-red-500 transition-all text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications */}
            {activeTab === 'notifications' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl text-gray-900 dark:text-white mb-6">Préférences de Notification</h2>
                  
                  <div className="space-y-4">
                    {/* Email Notifications */}
                    <div className="flex items-center justify-between p-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                          <Mail className="h-6 w-6 text-red-600" />
                        </div>
                        <div>
                          <h3 className="text-base text-gray-900 dark:text-white">Notifications Email</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Recevoir des alertes par email</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setEmailNotifications(!emailNotifications)}
                        title={emailNotifications ? 'Désactiver les notifications email' : 'Activer les notifications email'}
                        aria-label={emailNotifications ? 'Désactiver les notifications email' : 'Activer les notifications email'}
                        className="relative inline-flex items-center cursor-pointer"
                      >
                        <div className={`w-14 h-7 rounded-full transition-all shadow-inner ${
                          emailNotifications ? 'bg-green-500' : 'bg-gray-300'
                        }`}>
                          <div className={`absolute top-0.5 left-0.5 bg-white w-6 h-6 rounded-full transition-transform shadow-md ${
                            emailNotifications ? 'translate-x-7' : 'translate-x-0'
                          }`}></div>
                        </div>
                      </button>
                    </div>

                    {/* Push Notifications */}
                    <div className="flex items-center justify-between p-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                          <Bell className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-base text-gray-900 dark:text-white">Notifications Push</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Alertes en temps réel</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setPushNotifications(!pushNotifications)}
                        title={pushNotifications ? 'Désactiver les notifications push' : 'Activer les notifications push'}
                        aria-label={pushNotifications ? 'Désactiver les notifications push' : 'Activer les notifications push'}
                        className="relative inline-flex items-center cursor-pointer"
                      >
                        <div className={`w-14 h-7 rounded-full transition-all shadow-inner ${
                          pushNotifications ? 'bg-green-500' : 'bg-gray-300'
                        }`}>
                          <div className={`absolute top-0.5 left-0.5 bg-white w-6 h-6 rounded-full transition-transform shadow-md ${
                            pushNotifications ? 'translate-x-7' : 'translate-x-0'
                          }`}></div>
                        </div>
                      </button>
                    </div>

                    {/* Marketing Emails */}
                    <div className="flex items-center justify-between p-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                          <Mail className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div>
                          <h3 className="text-base text-gray-900 dark:text-white">Emails Marketing</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Nouveautés et promotions</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setMarketingEmails(!marketingEmails)}
                        title={marketingEmails ? 'Désactiver les emails marketing' : 'Activer les emails marketing'}
                        aria-label={marketingEmails ? 'Désactiver les emails marketing' : 'Activer les emails marketing'}
                        className="relative inline-flex items-center cursor-pointer"
                      >
                        <div className={`w-14 h-7 rounded-full transition-all shadow-inner ${
                          marketingEmails ? 'bg-green-500' : 'bg-gray-300'
                        }`}>
                          <div className={`absolute top-0.5 left-0.5 bg-white w-6 h-6 rounded-full transition-transform shadow-md ${
                            marketingEmails ? 'translate-x-7' : 'translate-x-0'
                          }`}></div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sécurité — Backend-ready via useSecuritySettings */}
            {activeTab === 'security' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl text-gray-900 dark:text-white mb-6">Sécurité & Confidentialité</h2>
                  
                  <div className="space-y-6">

                    {/* ==================== 2FA ==================== */}
                    <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            security.twoFactorEnabled ? 'bg-green-100' : 'bg-red-100'
                          }`}>
                            {security.twoFactorEnabled 
                              ? <ShieldCheck className="h-6 w-6 text-green-600" />
                              : <Shield className="h-6 w-6 text-red-600" />
                            }
                          </div>
                          <div>
                            <h3 className="text-base text-gray-900 dark:text-white">Authentification à 2 facteurs</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {security.twoFactorEnabled 
                                ? 'Activée — votre compte est protégé' 
                                : 'Désactivée — activez pour plus de sécurité'}
                            </p>
                          </div>
                        </div>
                        {security.twoFactorStep === 'idle' && (
                          <button
                            onClick={security.twoFactorEnabled ? security.handleDisable2FA : security.handleInitiate2FA}
                            disabled={security.isLoading}
                            className={`px-5 py-2.5 rounded-xl transition-all text-sm ${
                              security.twoFactorEnabled
                                ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'
                                : 'bg-green-500 text-white hover:bg-green-600 shadow-md'
                            }`}
                          >
                            {security.twoFactorEnabled ? 'Désactiver' : 'Activer'}
                          </button>
                        )}
                      </div>

                      {/* 2FA Setup Flow — Étape Vérification */}
                      {security.twoFactorStep === 'verify' && security.twoFactorSetup && (
                        <div className="mt-4 p-5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                          <h4 className="text-sm text-gray-900 dark:text-white mb-3">
                            Configurez votre application Authenticator
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Entrez ce code secret dans votre app (Google Authenticator, Authy, etc.) :
                          </p>
                          <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg mb-4 font-mono text-center text-lg tracking-widest text-gray-900 dark:text-white">
                            {security.twoFactorSetup.secret}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            Puis entrez le code à 6 chiffres généré :
                          </p>
                          <div className="flex gap-3">
                            <input
                              type="text"
                              maxLength={6}
                              placeholder="000000"
                              value={security.verificationCode}
                              onChange={(e) => security.setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              className="flex-1 px-4 py-3 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-green-500 transition-all text-gray-900 dark:text-white font-mono text-center text-xl tracking-[0.5em]"
                            />
                            <button
                              onClick={security.handleVerify2FA}
                              disabled={security.isLoading || security.verificationCode.length !== 6}
                              className="px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all shadow-md disabled:opacity-50"
                            >
                              Vérifier
                            </button>
                            <button
                              onClick={security.cancelTwoFactorSetup}
                              className="px-4 py-3 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-500 transition-all"
                            >
                              Annuler
                            </button>
                          </div>
                        </div>
                      )}

                      {/* 2FA Setup Flow — Backup Codes */}
                      {security.twoFactorStep === 'backup_codes' && security.twoFactorSetup && (
                        <div className="mt-4 p-5 bg-white dark:bg-gray-800 rounded-xl border border-green-200 dark:border-green-700">
                          <div className="flex items-center gap-2 mb-3">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <h4 className="text-sm text-green-700 dark:text-green-400">2FA activé avec succès !</h4>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            Sauvegardez ces codes de secours. Chaque code ne peut être utilisé qu'une seule fois.
                          </p>
                          <div className="grid grid-cols-2 gap-2 mb-4">
                            {security.twoFactorSetup.backupCodes.map((code, i) => (
                              <div key={i} className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg font-mono text-sm text-center text-gray-900 dark:text-white">
                                {code}
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={security.cancelTwoFactorSetup}
                            className="px-6 py-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all text-sm"
                          >
                            J'ai sauvegardé mes codes
                          </button>
                        </div>
                      )}
                    </div>

                    {/* ==================== Changer mot de passe ==================== */}
                    <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-4">
                        <label className="flex items-center gap-3">
                          <Key className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                          <span className="text-base text-gray-900 dark:text-white">Changer le mot de passe</span>
                        </label>
                        {security.lastPasswordChange && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Dernier changement : {formatDateTime(security.lastPasswordChange)}
                          </span>
                        )}
                      </div>
                      <div className="space-y-3">
                        <input
                          type="password"
                          placeholder="Mot de passe actuel"
                          value={security.passwordForm.current}
                          onChange={(e) => security.setPasswordForm({ ...security.passwordForm, current: e.target.value })}
                          className="w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-red-500 transition-all text-gray-900 dark:text-white"
                        />
                        <input
                          type="password"
                          placeholder="Nouveau mot de passe"
                          value={security.passwordForm.new}
                          onChange={(e) => security.setPasswordForm({ ...security.passwordForm, new: e.target.value })}
                          className="w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-red-500 transition-all text-gray-900 dark:text-white"
                        />
                        <input
                          type="password"
                          placeholder="Confirmer le nouveau mot de passe"
                          value={security.passwordForm.confirm}
                          onChange={(e) => security.setPasswordForm({ ...security.passwordForm, confirm: e.target.value })}
                          className="w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-red-500 transition-all text-gray-900 dark:text-white"
                        />
                      </div>
                      <button 
                        onClick={security.handlePasswordChange}
                        disabled={security.isLoading}
                        className="mt-4 px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                      >
                        Mettre à jour le mot de passe
                      </button>
                    </div>

                    {/* ==================== Sessions actives ==================== */}
                    <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base text-gray-900 dark:text-white">Sessions Actives</h3>
                        {security.activeSessions.filter(s => !s.isCurrent).length > 0 && (
                          <button
                            onClick={security.handleRevokeAllOtherSessions}
                            disabled={security.isLoading}
                            className="text-sm px-4 py-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-all disabled:opacity-50"
                          >
                            Déconnecter tout
                          </button>
                        )}
                      </div>
                      <div className="space-y-3">
                        {security.activeSessions.map((session) => {
                          // Detect device icon
                          const isPhone = session.deviceInfo.toLowerCase().includes('iphone') || session.deviceInfo.toLowerCase().includes('android');
                          const isLaptop = session.deviceInfo.toLowerCase().includes('macbook') || session.deviceInfo.toLowerCase().includes('laptop');
                          const DeviceIcon = isPhone ? Smartphone : isLaptop ? Laptop : Monitor;

                          return (
                            <div 
                              key={session.id} 
                              className={`flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border ${
                                session.isCurrent 
                                  ? 'border-green-300 dark:border-green-700' 
                                  : 'border-gray-200 dark:border-gray-700'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <DeviceIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                                <div>
                                  <p className="text-sm text-gray-900 dark:text-white">{session.deviceInfo}</p>
                                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                    <MapPin size={12} />
                                    <span>{session.location}</span>
                                    <span>•</span>
                                    <Clock size={12} />
                                    <span>{session.isCurrent ? 'Maintenant' : timeAgo(session.lastActivityAt)}</span>
                                  </div>
                                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">IP: {session.ipAddress}</p>
                                </div>
                              </div>
                              {session.isCurrent ? (
                                <span className="px-3 py-1 bg-green-200 dark:bg-green-900/30 text-green-900 dark:text-green-400 rounded-full text-xs border border-green-400 dark:border-green-700">
                                  Actuelle
                                </span>
                              ) : (
                                <button
                                  onClick={() => security.handleRevokeSession(session.id)}
                                  disabled={security.isLoading}
                                  className="px-3 py-1.5 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-all disabled:opacity-50"
                                >
                                  Révoquer
                                </button>
                              )}
                            </div>
                          );
                        })}
                        {security.activeSessions.length === 0 && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                            Aucune session active
                          </p>
                        )}
                      </div>
                    </div>

                    {/* ==================== Journal de sécurité ==================== */}
                    <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                      <h3 className="text-base text-gray-900 dark:text-white mb-4">Journal de Sécurité</h3>
                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {security.securityEvents.slice(0, 10).map((event) => {
                          const config = EVENT_CONFIG[event.type];
                          const EventIcon = config.icon;
                          return (
                            <div key={event.id} className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${config.bgColor}`}>
                                <EventIcon className={`h-4 w-4 ${config.color}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-900 dark:text-white">{event.description}</p>
                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  <span>{formatDateTime(event.createdAt)}</span>
                                  <span>•</span>
                                  <span>{event.location}</span>
                                  <span>•</span>
                                  <span>IP: {event.ipAddress}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {security.securityEvents.length === 0 && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                            Aucun événement de sécurité
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions (Général + Notifications seulement) */}
            {activeTab !== 'security' && (
              <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between items-center">
                <button
                  onClick={handleReset}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all"
                >
                  Réinitialiser
                </button>
                <button
                  onClick={handleSave}
                  className="px-8 py-3 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <Save size={20} />
                  <span>Enregistrer les modifications</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;