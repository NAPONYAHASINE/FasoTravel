/**
 * @file OtpVerification.tsx
 * @description Page de vérification OTP après connexion
 * 
 * FLUX: Login (email/password) → OTP Verification → Dashboard
 * 
 * En mode Mock: le code OTP est affiché dans la console + accepte "000000"
 * En production: le code est envoyé via WhatsApp Business ou email selon le canal
 */

import { useState, useRef, useEffect } from 'react';
import { ShieldCheck, ArrowLeft, RefreshCw, Loader, AlertCircle, CheckCircle2, Mail } from 'lucide-react';
import { useAdminAppSafe } from '../context/AdminAppContext';
import { useNavigate, Navigate } from 'react-router';
import { toast } from 'sonner@2.0.3';
import logo from 'figma:asset/ddaf4c7eb0e28936f4d0223e859065e25d5c3fc8.png';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // secondes

export function OtpVerification() {
  const ctx = useAdminAppSafe();
  const navigate = useNavigate();

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer de renvoi — HOOK avant tout return conditionnel
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  // Focus auto sur le premier input au montage
  useEffect(() => {
    const timer = setTimeout(() => inputRefs.current[0]?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  // Redirections conditionnelles APRÈS les hooks
  if (!ctx?.otpPending && !ctx?.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (ctx?.isAuthenticated && !ctx?.otpPending && !success) {
    return <Navigate to="/" replace />;
  }

  // Masquer l'email partiellement
  const maskedEmail = ctx?.pendingUserEmail
    ? ctx.pendingUserEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3')
    : '***@***.bf';

  // Gestion de la saisie d'un chiffre
  const handleDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);
    setError('');

    // Auto-focus sur le champ suivant
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit si tous les chiffres sont remplis
    if (digit && index === OTP_LENGTH - 1) {
      const fullCode = newDigits.join('');
      if (fullCode.length === OTP_LENGTH) {
        handleVerify(fullCode);
      }
    }
  };

  // Gestion du backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newDigits = [...digits];
      newDigits[index - 1] = '';
      setDigits(newDigits);
    }
    if (e.key === 'Enter') {
      const fullCode = digits.join('');
      if (fullCode.length === OTP_LENGTH) {
        handleVerify(fullCode);
      }
    }
  };

  // Gestion du collage
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (pasted.length > 0) {
      const newDigits = Array(OTP_LENGTH).fill('');
      pasted.split('').forEach((char, i) => {
        if (i < OTP_LENGTH) newDigits[i] = char;
      });
      setDigits(newDigits);
      setError('');
      
      const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
      inputRefs.current[focusIndex]?.focus();

      if (pasted.length === OTP_LENGTH) {
        handleVerify(pasted);
      }
    }
  };

  // Vérification du code
  const handleVerify = async (code: string) => {
    if (!ctx?.verifyOtp) return;
    
    setIsVerifying(true);
    setError('');

    try {
      await ctx.verifyOtp(code);
      setSuccess(true);
      toast.success('Vérification réussie ! Bienvenue sur FasoTravel Admin');
      setTimeout(() => navigate('/'), 600);
    } catch (err: any) {
      setError(err.message || 'Code OTP invalide');
      toast.error(err.message || 'Code OTP invalide');
      setDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  // Renvoi du code
  const handleResend = async () => {
    if (!ctx?.resendOtp || !canResend || isResending) return;

    setIsResending(true);
    try {
      await ctx.resendOtp();
      toast.success('Nouveau code OTP envoyé !');
      setResendTimer(RESEND_COOLDOWN);
      setCanResend(false);
      setDigits(Array(OTP_LENGTH).fill(''));
      setError('');
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors du renvoi');
    } finally {
      setIsResending(false);
    }
  };

  // Retour au login
  const handleBack = () => {
    ctx?.cancelOtp?.();
    navigate('/login');
  };

  const fullCode = digits.join('');
  const isCodeComplete = fullCode.length === OTP_LENGTH;

  return (
    <div className="login-page-bg min-h-screen flex items-center justify-center p-4 transition-colors">
      {/* Grille de fond */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyMjAsIDM4LCAzOCwgMC4xKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40 hidden dark:block"></div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgwLCAwLCAwLCAwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40 block dark:hidden"></div>

      <div className="relative w-full max-w-md">
        {/* Card principale */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-10 border border-white/20 dark:border-gray-700/50">
          
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-yellow-500 to-green-600 rounded-2xl blur-xl opacity-20"></div>
              <div className="relative w-16 h-16 flex items-center justify-center">
                <img src={logo} alt="FasoTravel" className="w-full h-full object-contain drop-shadow-xl" />
              </div>
            </div>
          </div>

          {/* Icône de sécurité */}
          <div className="flex justify-center mb-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
              success
                ? 'bg-green-100 dark:bg-green-900/30'
                : 'bg-red-50 dark:bg-red-900/20'
            }`}>
              {success ? (
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              ) : (
                <ShieldCheck className="h-8 w-8 text-red-500" />
              )}
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl text-gray-900 dark:text-white mb-2">
              {success ? 'Vérification réussie !' : 'Vérification OTP'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {success ? (
                'Redirection vers le tableau de bord...'
              ) : (
                <>
                  Un code à 6 chiffres a été envoyé à{' '}
                  <span className="text-gray-700 dark:text-gray-300">{maskedEmail}</span>
                </>
              )}
            </p>
          </div>

          {/* Indicateur d'envoi */}
          {!success && (
            <div className="flex items-center gap-2 justify-center mb-6 px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/50">
              <Mail className="h-4 w-4 text-blue-500 flex-shrink-0" />
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Vérifiez votre boîte mail (et vos spams)
              </p>
            </div>
          )}

          {/* Erreur */}
          {error && (
            <div className="mb-5 p-3 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Champs OTP */}
          {!success && (
            <>
              <div className="flex justify-center gap-3 mb-6">
                {digits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    pattern="\d{1}"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    disabled={isVerifying}
                    className={`w-12 h-14 text-center text-xl rounded-xl border-2 transition-all duration-200 outline-none
                      ${digit 
                        ? 'border-red-400 dark:border-red-500 bg-red-50/50 dark:bg-red-900/20 text-gray-900 dark:text-white' 
                        : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white'
                      }
                      focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-800
                      disabled:opacity-50 disabled:cursor-not-allowed
                      placeholder-gray-300 dark:placeholder-gray-600
                    `}
                    placeholder="·"
                  />
                ))}
              </div>

              {/* Bouton Vérifier */}
              <button
                onClick={() => handleVerify(fullCode)}
                disabled={!isCodeComplete || isVerifying}
                className="group relative w-full py-3.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 overflow-hidden mb-4"
              >
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                <span className="relative flex items-center justify-center gap-2">
                  {isVerifying ? (
                    <>
                      <Loader className="h-5 w-5 animate-spin" />
                      <span>Vérification...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-5 w-5" />
                      <span>Vérifier le code</span>
                    </>
                  )}
                </span>
              </button>

              {/* Renvoi + Retour */}
              <div className="flex items-center justify-between">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Retour
                </button>

                <button
                  onClick={handleResend}
                  disabled={!canResend || isResending}
                  className="flex items-center gap-1.5 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                >
                  {isResending ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {canResend ? (
                    'Renvoyer le code'
                  ) : (
                    <span>Renvoyer ({resendTimer}s)</span>
                  )}
                </button>
              </div>
            </>
          )}

          {/* Aide démo */}
          {!success && (
            <div className="mt-6 p-3 bg-gradient-to-r from-red-50 to-yellow-50 dark:from-red-900/20 dark:to-yellow-900/20 rounded-xl border border-red-200/50 dark:border-red-800/50">
              <p className="text-xs text-red-800 dark:text-red-200 mb-1">
                Mode démo — Code de test :
              </p>
              <div className="flex items-center gap-2">
                <code className="px-2 py-1 bg-white/60 dark:bg-gray-800/60 rounded text-sm text-red-700 dark:text-red-300 tracking-widest">
                  000000
                </code>
                <button
                  onClick={() => {
                    const testCode = '000000'.split('');
                    setDigits(testCode);
                    setError('');
                  }}
                  className="text-xs text-red-600 dark:text-red-400 hover:underline"
                >
                  Remplir
                </button>
              </div>
              <p className="text-[10px] text-gray-500 dark:text-gray-500 mt-1">
                Le vrai code est aussi dans la console du navigateur (F12)
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-500">
              © 2026 FasoTravel · Sécurisé par WhatsApp Business
            </p>
          </div>
        </div>

        {/* Floating decoration */}
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-red-400 to-yellow-400 rounded-full opacity-20 blur-2xl animate-pulse"></div>
        <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-green-400 to-yellow-400 rounded-full opacity-20 blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
    </div>
  );
}
