import type { Page } from '../App';
/**
 * EditProfilePage - Modification des informations personnelles
 * 
 * DEV NOTES:
 * - Endpoint: PATCH /users/me
 * - Validation: nom (min 3 chars), email (format), numéro WhatsApp (format)
 * - Succès: retour à ProfilePage avec notification
 * - Erreur: affichage message d'erreur
 */

import { useState } from 'react';
import { ArrowLeft, Save, Loader, Lock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { motion, AnimatePresence } from 'motion/react';
import { feedback } from '../lib/interactions';
import { updateUserProfile } from '../lib/api';
import { authService } from '../services/api/auth.service';

interface EditProfilePageProps {
  onNavigate: (page: Page, data?: any) => void;
  onBack: () => void;
  onUpdateUser?: (userData: { name: string; email: string; phone: string }) => void;
  onAutoLogin?: () => void;
  initialName?: string;
  initialEmail?: string;
  initialPhone?: string;
  forgotPasswordEmail?: string;
  forgotPasswordOtp?: string;
}

export function EditProfilePage({
  onNavigate,
  onBack,
  onUpdateUser,
  onAutoLogin,
  initialName = 'NAPON Yahasine',
  initialEmail = 'yahasine@transportbf.bf',
  initialPhone = '+226 70 12 34 56',
  forgotPasswordEmail,
  forgotPasswordOtp,
}: EditProfilePageProps) {
  // En mode forgot-password, extraire le téléphone de l'email synthétique
  const derivedPhone = forgotPasswordEmail
    ? `+226 ${forgotPasswordEmail.replace(/@phone\.transportbf\.bf$/, '')}`
    : '';
  const [name, setName] = useState(initialName || (forgotPasswordEmail ? derivedPhone : ''));
  const [email, setEmail] = useState(forgotPasswordEmail || initialEmail);
  const [phone, setPhone] = useState(derivedPhone || initialPhone);
  
  // Password change fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isForgotPasswordMode = !!forgotPasswordEmail;

  // Validation
  const isValid = () => {
    if (isForgotPasswordMode) {
      return newPassword.length >= 6 && newPassword === confirmPassword;
    }
    if (name.trim().length < 3) return false;
    if (!email.includes('@')) return false;
    if (phone.trim().length < 8) return false;
    // Password change is optional when editing profile normally
    if (newPassword && (newPassword.length < 6 || newPassword !== confirmPassword)) return false;
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!isValid()) {
      setError(isForgotPasswordMode ? 'Le mot de passe doit faire au moins 6 caractères et les deux champs doivent correspondre' : 'Veuillez vérifier vos informations');
      feedback.tap();
      return;
    }

    try {
      setLoading(true);
      feedback.tap();

      if (isForgotPasswordMode) {
        // Reset password via backend with OTP code from verification step
        await authService.resetPassword(forgotPasswordEmail!, forgotPasswordOtp || '', newPassword);
        setSuccess(true);
        feedback.success();
        // Auto-login after password reset
        if (onAutoLogin) {
          setTimeout(() => {
            onAutoLogin();
          }, 1500);
        } else {
          setTimeout(() => {
            onNavigate('auth');
          }, 1500);
        }
        return;
      }

      // Normal profile update
      await updateUserProfile({ name, email, phone });

      // If password change requested along with profile update
      if (newPassword) {
        const currentUser = await authService.getCurrentUser();
        const userEmail = currentUser?.email || email;
        await authService.resetPassword(userEmail, '', newPassword);
      }

      if (onUpdateUser) {
        onUpdateUser({ name, email, phone });
      }

      setSuccess(true);
      feedback.success();

      setTimeout(() => {
        onNavigate('profile', { name, email, phone });
      }, 1500);
    } catch (err) {
      setError('Erreur lors de la mise à jour. Veuillez réessayer.');
      feedback.error();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 overflow-x-hidden">
      {/* Header */}
      <motion.div
        className="bg-gradient-to-r from-red-600 via-amber-500 to-green-600 px-4 sm:px-6 py-6 sticky top-0 z-10"
        style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))' }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="max-w-4xl mx-auto">
          <motion.button
            onClick={() => {
              feedback.tap();
              onBack();
            }}
            className="text-white mb-4 flex items-center gap-2 hover:opacity-80 transition-opacity"
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
            <h1 className="text-xl sm:text-2xl mb-1">{isForgotPasswordMode ? 'Réinitialiser mot de passe' : 'Modifier mon profil'}</h1>
            <p className="text-xs sm:text-sm opacity-90">{isForgotPasswordMode ? 'Entrez votre nouveau mot de passe ci-dessous' : 'Mettez à jour vos informations personnelles'}</p>
          </motion.div>
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        className="px-4 sm:px-6 py-6 pb-24"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="max-w-2xl mx-auto">
          {/* Success Message */}
          <AnimatePresence mode="wait">
            {success && (
              <motion.div
                key="success"
                className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                ✓ {isForgotPasswordMode ? 'Mot de passe réinitialisé avec succès. Redirection...' : 'Vos informations ont été mises à jour avec succès. Redirection en cours...'}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Message */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="error"
                className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                ✗ {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <motion.form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl p-5 sm:p-6 shadow-lg space-y-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nom complet <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: NAPON Yahasine"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 transition-colors"
                disabled={loading || isForgotPasswordMode}
                required={!isForgotPasswordMode}
                minLength={3}
              />
              {!isForgotPasswordMode && name.length < 3 && name.length > 0 && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  Le nom doit contenir au moins 3 caractères
                </p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Adresse e-mail <span className="text-red-600">*</span>
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: votre@email.com"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 transition-colors"
                disabled={loading || isForgotPasswordMode}
                required={!isForgotPasswordMode}
              />
              {!isForgotPasswordMode && email && !email.includes('@') && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  Veuillez entrer une adresse e-mail valide
                </p>
              )}
            </div>

            {/* Phone Field */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Numéro WhatsApp <span className="text-red-600">*</span>
              </label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex: +226 70 12 34 56"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 transition-colors"
                disabled={loading || isForgotPasswordMode}
                required={!isForgotPasswordMode}
                minLength={8}
              />
              {!isForgotPasswordMode && phone.length < 8 && phone.length > 0 && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  Le numéro doit contenir au moins 8 caractères
                </p>
              )}
            </div>

            {/* Password Change Fields */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {isForgotPasswordMode ? 'Nouveau mot de passe' : 'Changer le mot de passe'} {isForgotPasswordMode && <span className="text-red-600">*</span>}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 caractères"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 transition-colors"
                  disabled={loading}
                  minLength={6}
                  required={isForgotPasswordMode}
                />
              </div>
              {newPassword && newPassword.length < 6 && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  Le mot de passe doit contenir au moins 6 caractères
                </p>
              )}
            </div>

            {(isForgotPasswordMode || newPassword) && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirmer le mot de passe <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Répétez le mot de passe"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 transition-colors"
                    disabled={loading}
                    required
                  />
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    Les mots de passe ne correspondent pas
                  </p>
                )}
              </div>
            )}

            {/* Info Box */}
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-xs text-blue-700 dark:text-blue-400">
                💡 <strong>Conseil :</strong> Assurez-vous que vos informations sont correctes avant de les enregistrer.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  feedback.tap();
                  onBack();
                }}
                className="flex-1"
                disabled={loading}
              >
                Annuler
              </Button>

              <Button
                type="submit"
                className="flex-1 bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white"
                disabled={loading || !isValid()}
              >
                <span className="inline-flex items-center gap-2">
                  <AnimatePresence mode="wait">
                    {loading ? (
                      <motion.span
                        key="loader"
                        initial={{ opacity: 0, rotate: -90 }}
                        animate={{ opacity: 1, rotate: 0 }}
                        exit={{ opacity: 0, rotate: 90 }}
                      >
                        <Loader className="w-4 h-4 animate-spin" />
                      </motion.span>
                    ) : (
                      <motion.span
                        key="save"
                        initial={{ opacity: 0, rotate: 90 }}
                        animate={{ opacity: 1, rotate: 0 }}
                        exit={{ opacity: 0, rotate: -90 }}
                      >
                        <Save className="w-4 h-4" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                  <span>{loading ? 'Enregistrement...' : isForgotPasswordMode ? 'Réinitialiser' : 'Enregistrer'}</span>
                </span>
              </Button>
            </div>
          </motion.form>

          {/* Help Text */}
          <motion.div
            className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs sm:text-sm text-gray-600 dark:text-gray-400"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">❓ Besoin d'aide ?</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Votre nom doit contenir au moins 3 caractères</li>
              <li>Votre e-mail doit être au format valide (ex: user@example.com)</li>
              <li>Votre téléphone doit contenir au moins 8 chiffres</li>
            </ul>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
