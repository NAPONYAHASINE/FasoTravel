import type { Page } from '../App';
/**
 * ProfilePage - Profil utilisateur et paramètres
 * 
 * DEV NOTES:
 * - Endpoint: GET /users/me, PATCH /users/me
 * - Consentements: géoloc, push (avec timestamps)
 * - Langue: fr/en/mo
 * - Export data (GDPR)
 * - Event: consent_updated, language_changed, data_export_requested
 */

import { useState, useEffect } from 'react';
import { ArrowLeft, User, Globe, Bell, MapPin, Download, LogOut, Shield } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import { setLanguage, Language } from '../lib/i18n';
import { motion } from 'motion/react';
import { feedback } from '../lib/interactions';

interface ProfilePageProps {
  onNavigate: (page: Page) => void;
  onBack: () => void;
  onLogout: () => void;
  darkMode?: boolean;
  onToggleDarkMode?: (enabled: boolean) => void;
  updatedUserData?: { name: string; email: string; phone: string }; // Updated from edit-profile
}

export function ProfilePage({ onNavigate, onBack, onLogout, darkMode = false, onToggleDarkMode, updatedUserData }: ProfilePageProps) {
  const [userName, setUserName] = useState(updatedUserData?.name || 'NAPON Yahasine');
  const [userEmail, setUserEmail] = useState(updatedUserData?.email || 'yahasine@transportbf.bf');
  const [userPhone, setUserPhone] = useState(updatedUserData?.phone || '+226 70 12 34 56');
  
  const [language, setLang] = useState<Language>('fr');
  const [geoConsent, setGeoConsent] = useState(true);
  const [pushConsent, setPushConsent] = useState(true);

  // Update user data when updatedUserData prop changes (from edit-profile)
  useEffect(() => {
    if (updatedUserData) {
      setUserName(updatedUserData.name);
      setUserEmail(updatedUserData.email);
      setUserPhone(updatedUserData.phone);
    }
  }, [updatedUserData]);

  const handleEditProfile = () => {
    feedback.tap();
    onNavigate('edit-profile');
  };

  const handleUpdateUser = (userData: { name: string; email: string; phone: string }) => {
    setUserName(userData.name);
    setUserEmail(userData.email);
    setUserPhone(userData.phone);
    console.log('User data updated:', userData);
    // PATCH /users/me { name, email, phone }
  };

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    setLanguage(newLang);
    console.log('Language changed to:', newLang);
    // PATCH /users/me { language: newLang }
  };

  const handleGeoConsentChange = (enabled: boolean) => {
    setGeoConsent(enabled);
    console.log('Geo consent:', enabled);
    // PATCH /users/me { geo_consent: enabled, geo_consent_timestamp: new Date() }
    if (!enabled) {
      alert('La géolocalisation a été désactivée.\n\nVous ne pourrez plus voir les gares et véhicules à proximité.\n\nVos données de localisation existantes seront supprimées dans 7 jours.');
    }
  };

  const handlePushConsentChange = (enabled: boolean) => {
    setPushConsent(enabled);
    console.log('Push consent:', enabled);
    // PATCH /users/me { push_consent: enabled, push_consent_timestamp: new Date() }
  };

  const handleDataExport = () => {
    console.log('Export user data');
    // GET /users/me/export
    alert('Export de vos données en cours...\n\nVous recevrez un email avec toutes vos données personnelles au format JSON.');
  };

  const handleLogout = () => {
    if (window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      console.log('Logout');
      // POST /auth/logout
      onLogout(); // This will clear user and redirect to landing
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <motion.div 
        className="bg-gradient-to-r from-red-600 via-amber-500 to-green-600 px-6 py-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="max-w-4xl mx-auto">
          <motion.button
            onClick={() => {
              feedback.tap();
              onBack();
            }}
            className="text-white mb-4 flex items-center gap-2"
            whileHover={{ x: -5 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Retour</span>
          </motion.button>
          
          <motion.div 
            className="text-white"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="text-xl sm:text-2xl mb-1">Mon profil</h1>
            <p className="text-xs sm:text-sm opacity-90">Paramètres et préférences</p>
          </motion.div>
        </div>
      </motion.div>

      {/* Content */}
      <motion.div 
        className="px-6 py-6 pb-24"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="max-w-2xl mx-auto space-y-6">
          {/* User Info */}
          <motion.div 
            className="bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl p-5 sm:p-6 shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-4 mb-6">
              <motion.div 
                className="w-16 h-16 bg-gradient-to-br from-red-600 to-amber-500 rounded-full flex items-center justify-center text-white text-2xl border-2 border-white shadow-lg"
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                {userName.charAt(0).toUpperCase()}
              </motion.div>
              <div>
                <h2 className="text-lg sm:text-xl text-gray-900 dark:text-white">{userName}</h2>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{userEmail}</p>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300 text-sm">
                <User className="w-4 h-4" />
                <span>{userName}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300 text-sm">
                <span className="text-lg">📧</span>
                <span className="break-all">{userEmail}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300 text-sm">
                <span className="text-lg">📱</span>
                <span>{userPhone}</span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={handleEditProfile}
            >
              Modifier mes informations
            </Button>
          </motion.div>

          {/* Theme Toggle */}
          <motion.div 
            className="bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl p-5 sm:p-6 shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">🌓</span>
              <h3 className="text-base sm:text-lg text-gray-900 dark:text-white">Thème</h3>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-900 dark:text-white mb-1">Mode sombre</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Activer le thème sombre pour réduire la fatigue oculaire
                </p>
              </div>
              <Switch
                checked={darkMode}
                onCheckedChange={(checked) => {
                  onToggleDarkMode?.(checked);
                  feedback.tap();
                }}
              />
            </div>
          </motion.div>

          {/* Language */}
          <motion.div 
            className="bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl p-5 sm:p-6 shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-green-600 dark:text-green-400" />
              <h3 className="text-base sm:text-lg text-gray-900 dark:text-white">Langue</h3>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handleLanguageChange('fr')}
                className={`w-full flex items-center justify-between p-2.5 sm:p-3 border rounded-lg transition-colors text-sm ${
                  language === 'fr' 
                    ? 'border-green-600 dark:border-green-500 bg-green-50 dark:bg-green-900/20' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600'
                }`}
              >
                <span className="text-gray-900 dark:text-gray-100">🇫🇷 Français</span>
                {language === 'fr' && <span className="text-green-600 dark:text-green-400">✓</span>}
              </button>

              <button
                onClick={() => handleLanguageChange('en')}
                className={`w-full flex items-center justify-between p-2.5 sm:p-3 border rounded-lg transition-colors text-sm ${
                  language === 'en' 
                    ? 'border-green-600 dark:border-green-500 bg-green-50 dark:bg-green-900/20' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600'
                }`}
              >
                <span className="text-gray-900 dark:text-gray-100">🇬🇧 English</span>
                {language === 'en' && <span className="text-green-600 dark:text-green-400">✓</span>}
              </button>

              <button
                onClick={() => handleLanguageChange('mo')}
                className={`w-full flex items-center justify-between p-2.5 sm:p-3 border rounded-lg transition-colors text-sm ${
                  language === 'mo' 
                    ? 'border-green-600 dark:border-green-500 bg-green-50 dark:bg-green-900/20' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600'
                }`}
              >
                <span className="text-gray-900 dark:text-gray-100">🇧🇫 Mooré</span>
                {language === 'mo' && <span className="text-green-600 dark:text-green-400">✓</span>}
              </button>
            </div>
          </motion.div>

          {/* Privacy & Consents */}
          <motion.div 
            className="bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl p-5 sm:p-6 shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
              <h3 className="text-base sm:text-lg text-gray-900 dark:text-white">Confidentialité</h3>
            </div>

            <div className="space-y-4">
              {/* Geo Consent */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <p className="text-sm text-gray-900 dark:text-white">Géolocalisation</p>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Autoriser l'accès à votre position pour voir les gares et véhicules à proximité
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-500 mt-1">
                    Vos données de localisation sont supprimées après 7 jours
                  </p>
                </div>
                <Switch
                  checked={geoConsent}
                  onCheckedChange={handleGeoConsentChange}
                />
              </div>

              {/* Push Consent */}
              <div className="flex items-start justify-between gap-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Bell className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <p className="text-sm text-gray-900 dark:text-white">Notifications</p>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Recevoir des notifications sur vos voyages (départ, embarquement, etc.)
                  </p>
                </div>
                <Switch
                  checked={pushConsent}
                  onCheckedChange={handlePushConsentChange}
                />
              </div>
            </div>
          </motion.div>

          {/* Data Export */}
          <motion.div 
            className="bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl p-5 sm:p-6 shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Download className="w-5 h-5 text-green-600 dark:text-green-400" />
              <h3 className="text-base sm:text-lg text-gray-900 dark:text-white">Mes données</h3>
            </div>

            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4">
              Vous pouvez exporter toutes vos données personnelles conformément au RGPD
            </p>

            <Button
              onClick={handleDataExport}
              variant="outline"
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Exporter mes données
            </Button>
          </motion.div>

          {/* About */}
          <motion.div 
            className="bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl p-5 sm:p-6 shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
          >
            <h3 className="text-base sm:text-lg text-gray-900 dark:text-white mb-3">À propos</h3>
            
            <div className="space-y-2.5 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              <div className="flex justify-between">
                <span>Version</span>
                <span className="text-gray-900 dark:text-white">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span>Build</span>
                <span className="text-gray-900 dark:text-white">2025.10.27</span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-1.5">
              <Button 
                variant="ghost" 
                className="w-full justify-start text-sm dark:text-gray-300 dark:hover:bg-gray-700"
                onClick={() => {
                  feedback.tap();
                  onNavigate('terms-conditions');
                }}
              >
                Conditions d'utilisation
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-sm dark:text-gray-300 dark:hover:bg-gray-700"
                onClick={() => {
                  feedback.tap();
                  onNavigate('terms-conditions');
                }}
              >
                Politique de confidentialité
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-sm dark:text-gray-300 dark:hover:bg-gray-700"
                onClick={() => {
                  feedback.tap();
                  onNavigate('support');
                }}
              >
                Aide et support
              </Button>
            </div>
          </motion.div>

          {/* Logout */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Se déconnecter
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
