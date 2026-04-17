/**
 * OTPVerificationPage - Vérification du code OTP
 * 
 * DEV NOTES:
 * - Endpoint: POST /auth/verify-otp, POST /payment/verify-otp
 * - Event: otp_sent, otp_verified, otp_failed
 * - UX: 6 chiffres, auto-focus, timer avec résend
 * - Support: Auth (login/register) + Payment verification
 */

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Clock, RotateCw, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { motion, AnimatePresence } from 'motion/react';
import { feedback } from '../lib/interactions';
import { authService } from '../services/api/auth.service';
import bgDay from 'figma:asset/bcca83482c8b3b02fad6bfe11da57e59506831e5.png';

interface OTPVerificationPageProps {
  identifier: string; // WhatsApp number or email
  mode: 'auth' | 'payment' | 'forgot-password'; // From auth flow, payment flow, or forgot password
  onVerified: (code: string) => void; // What to do after OTP verified
  onBack: () => void;
  darkMode?: boolean;
  authData?: { name: string; email: string; phone: string; isGuest: boolean }; // User data for auth mode
  onAuthSuccess?: (user: { name: string; email: string; phone: string; isGuest: boolean }) => void; // Callback for auth success
  paymentMethod?: string; // Payment method name if in payment mode
}

export function OTPVerificationPage({
  identifier,
  mode,
  onVerified,
  onBack,
  darkMode = false,
  authData,
  onAuthSuccess,
  paymentMethod
}: OTPVerificationPageProps) {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [remainingTime, setRemainingTime] = useState(60); // 60 second timer
  const [canResend, setCanResend] = useState(false);
  const hiddenInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // Timer for resend button
    if (remainingTime === 0) {
      setCanResend(true);
      return;
    }

    const timer = setInterval(() => {
      setRemainingTime(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingTime]);

  const handleHiddenInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits, max 6
    const value = e.target.value.replace(/\D/g, '').substring(0, 6);
    setOtp(value);
    setError(null);
  };

  const handleBoxClick = () => {
    // Focus hidden input when clicking on any box
    hiddenInputRef.current?.focus();
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      setError('Veuillez entrer 6 chiffres');
      feedback.error();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (mode === 'forgot-password') {
        // For forgot-password, we just pass the OTP through — it will be validated at reset-password
        feedback.success();
        onVerified(otp);
      } else {
        // Vérifier OTP via authService
        await authService.verifyOtp(identifier, otp, mode);

        feedback.success();
      
        // If auth mode and authData provided, complete authentication
        if (mode === 'auth' && authData && onAuthSuccess) {
          onAuthSuccess(authData);
        } else {
          onVerified(otp);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur de vérification';
      setError(message);
      feedback.error();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;

    setResendLoading(true);
    setError(null);

    try {
      // Renvoyer OTP via authService
      await authService.resendOtp(identifier, mode);

      feedback.success();
      setOtp('');
      setCanResend(false);
      setRemainingTime(60);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du renvoi du code';
      setError(message);
      feedback.error();
    } finally {
      setResendLoading(false);
    }
  };

  // Détect contact type — les logins téléphone utilisent {phone}@phone.transportbf.bf
  const isPhoneSynthetic = identifier.endsWith('@phone.transportbf.bf');
  const isEmail = identifier.includes('@') && !isPhoneSynthetic;
  const contactType = isEmail ? 'adresse e-mail' : 'numéro WhatsApp';
  
  // Pour les identifiants téléphone synthétiques, extraire le numéro
  const displayIdentifier = isPhoneSynthetic 
    ? identifier.replace('@phone.transportbf.bf', '')
    : identifier;
  
  const maskedIdentifier = isEmail 
    ? displayIdentifier.substring(0, 3) + '***' + displayIdentifier.substring(displayIdentifier.lastIndexOf('@') - 2)
    : displayIdentifier.replace(/(\d)(?=(\d{2})+(?!\d))/g, '*');

  return (
    <div
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-cover bg-center"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(239, 68, 68, 0.1) 50%, rgba(34, 197, 94, 0.1) 100%), url(${bgDay})`,
      }}
    >
      {/* Dark overlay for dark mode */}
      {darkMode && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-slate-900 to-black opacity-85" />
      )}

      {/* Back button - Always visible */}
      <button
        onClick={onBack}
        aria-label="Retour"
        title="Retour"
        className="absolute top-6 left-6 z-10 p-2 rounded-lg bg-gradient-to-r from-red-600 via-amber-500 to-green-600 shadow-lg hover:shadow-xl transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
      >
        <ArrowLeft className="w-5 h-5 text-white" />
      </button>

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md px-6 py-8"
      >
        {/* Card */}
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 space-y-6 border border-gray-100 dark:border-gray-700">
          {/* Icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="flex justify-center"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 via-yellow-500 to-red-500 flex items-center justify-center shadow-lg">
              <Clock className="w-8 h-8 text-white" />
            </div>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center space-y-2"
          >
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Vérification du code
            </h1>
            {mode === 'auth' || mode === 'forgot-password' ? (
              <>
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  {mode === 'forgot-password' ? 'Entrez le code reçu pour réinitialiser votre mot de passe' : 'Entrez le code reçu sur votre'}
                </p>
                {mode !== 'forgot-password' && (
                  <p className="text-base font-bold text-green-600 dark:text-green-400 capitalize">
                    {contactType}
                  </p>
                )}
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {maskedIdentifier}
                </p>
              </>
            ) : (
              <>
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  Vérifiez votre {contactType} pour confirmer
                </p>
                <p className="text-base font-bold text-amber-600 dark:text-amber-400">
                  {paymentMethod || 'ce paiement'}
                </p>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {maskedIdentifier}
                </p>
              </>
            )}
          </motion.div>

          {/* OTP Input */}
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            onSubmit={handleVerifyOtp}
            className="space-y-4"
          >
            {/* 6-digit input - Hidden input captures all keystrokes */}
            <input
              ref={hiddenInputRef}
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={handleHiddenInputChange}
              autoFocus
              className="sr-only"
              aria-label="Code OTP"
            />

            {/* Visual representation of OTP digits */}
            <div className="flex justify-center gap-2" onClick={handleBoxClick} role="button" tabIndex={0}>
              {Array.from({ length: 6 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="w-12 h-12 flex items-center justify-center text-2xl font-bold border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white cursor-text transition-all hover:border-green-400 hover:shadow-md dark:hover:border-green-500"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {otp[i] || ''}
                </motion.div>
              ))}
            </div>

            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                >
                  <p className="text-sm text-red-600 dark:text-red-400">
                    ❌ {error}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Verify button */}
            <Button
              type="submit"
              disabled={isLoading || otp.length !== 6}
              className={`w-full py-3 font-semibold transition-all ${
                otp.length === 6
                  ? 'bg-gradient-to-r from-red-600 via-amber-500 to-green-600 hover:from-red-700 hover:via-amber-600 hover:to-green-700'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                  Vérification...
                </>
              ) : (
                'Vérifier le code'
              )}
            </Button>
          </motion.form>

          {/* Resend info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center space-y-3"
          >
            {canResend ? (
              <button
                onClick={handleResendOtp}
                disabled={resendLoading}
                className="inline-flex items-center gap-2 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium transition-colors"
              >
                {resendLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <RotateCw className="w-4 h-4" />
                    Renvoyer le code
                  </>
                )}
              </button>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Renvoyer dans{' '}
                  <span className="font-bold text-green-600 dark:text-green-400">
                    {remainingTime}s
                  </span>
                </p>
              </div>
            )}

            <p className="text-xs text-gray-500 dark:text-gray-500">
              {mode === 'auth'
                ? 'Code valide pendant 10 minutes'
                : 'Code valide pendant 5 minutes'}
            </p>
          </motion.div>

          {/* Help text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
          >
            <p className="text-xs text-blue-800 dark:text-blue-300">
              💡 <strong>Conseil :</strong> {isEmail 
                ? 'Vérifiez vos e-mails indésirables si vous ne recevez pas le code.'
                : 'Vérifiez vos messages WhatsApp si vous ne recevez pas le code.'}
            </p>
          </motion.div>
        </div>

        {/* Footer message */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-xs text-gray-600 dark:text-gray-400 mt-6"
        >
          Vérification nécessaire pour votre {mode === 'auth' ? 'connexion' : 'paiement'}
        </motion.p>
      </motion.div>
    </div>
  );
}

export default OTPVerificationPage;
