/**
 * AuthPage - Connexion / Inscription avec UX en 2 étapes
 * 
 * DEV NOTES:
 * - Endpoint: POST /auth/login, POST /auth/register
 * - Event: login_attempt, register_attempt
 * - UX: D'abord 2 boutons, puis formulaire slide up après choix
 * - Images: Monuments de Ouagadougou (jour/nuit)
 */

import type { Page } from '../App';
import { useState, useEffect } from 'react';
import { Mail, Lock, Phone, User, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { motion, AnimatePresence } from 'motion/react';
import { feedback } from '../lib/interactions';
import brandLogo from '../assets/brand/logo.png';
import bgDay from 'figma:asset/bcca83482c8b3b02fad6bfe11da57e59506831e5.png';
import bgNight from 'figma:asset/b9ee1e83da37e8d99fdb6bc684feefadda356498.png';

interface AuthPageProps {
  onAuth: (user: { name: string; email: string; phone: string; isGuest: boolean }) => void;
  onBack: () => void;
  onNavigate?: (page: Page) => void;
}

export function AuthPage({ onAuth, onBack, onNavigate }: AuthPageProps) {
  // État global : 'choice' (choix connexion/inscription) ou 'form' (formulaire affiché)
  const [stage, setStage] = useState<'choice' | 'form'>('choice');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>('phone');
  
  // Login
  const [loginPhone, setLoginPhone] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginErrors, setLoginErrors] = useState<{ identifier?: string; password?: string }>({});
  
  // Register
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerErrors, setRegisterErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
  }>({});

  // Déterminer l'heure pour choisir l'image des monuments
  const [bgImage, setBgImage] = useState(bgDay);
  
  useEffect(() => {
    const hour = new Date().getHours();
    // De 6h à 19h = jour, sinon nuit
    setBgImage((hour >= 6 && hour < 19) ? bgDay : bgNight);
  }, []);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePhone = (phone: string) => {
    // Burkina Faso : 8 chiffres exactement
    return /^\d{8}$/.test(phone.replace(/\s/g, ''));
  };

  const handleChoiceLogin = () => {
    feedback.tap();
    setMode('login');
    setStage('form');
  };

  const handleChoiceRegister = () => {
    feedback.tap();
    setMode('register');
    setStage('form');
  };

  const handleBackToChoice = () => {
    feedback.tap();
    setStage('choice');
  };

  const handleLogin = () => {
    const errors: { identifier?: string; password?: string } = {};
    
    if (loginMethod === 'phone') {
      if (!loginPhone) {
        errors.identifier = 'Numéro requis';
      } else if (!validatePhone(loginPhone)) {
        errors.identifier = 'Format: 8 chiffres (ex: 70123456)';
      }
    } else {
      if (!loginEmail) {
        errors.identifier = 'Email requis';
      } else if (!validateEmail(loginEmail)) {
        errors.identifier = 'Email invalide';
      }
    }
    
    if (!loginPassword) {
      errors.password = 'Mot de passe requis';
    } else if (loginPassword.length < 6) {
      errors.password = 'Minimum 6 caractères';
    }
    
    setLoginErrors(errors);
    
    if (Object.keys(errors).length === 0) {
      const loginData = loginMethod === 'phone' 
        ? { phone: loginPhone, password: loginPassword }
        : { email: loginEmail, password: loginPassword };
      
      console.log('[AUTH] Login:', loginData);
      feedback.success();
      
      onAuth({
        name: 'NAPON Yahasine',
        email: loginMethod === 'email' ? loginEmail : 'yahasine@transportbf.bf',
        phone: loginMethod === 'phone' ? loginPhone : '70123456',
        isGuest: false
      });
    } else {
      feedback.error();
    }
  };

  const handleRegister = () => {
    const errors: {
      name?: string;
      email?: string;
      phone?: string;
      password?: string;
    } = {};
    
    if (!registerName) {
      errors.name = 'Nom complet requis';
    } else {
      const nameParts = registerName.trim().split(/\s+/);
      if (nameParts.length < 2) {
        errors.name = 'Prénom et nom requis (minimum 2 mots)';
      }
    }
    
    if (registerEmail && !validateEmail(registerEmail)) {
      errors.email = 'Email invalide';
    }
    
    if (!registerPhone) {
      errors.phone = 'Téléphone requis';
    } else if (!validatePhone(registerPhone)) {
      errors.phone = 'Format: 8 chiffres (ex: 70123456)';
    }
    
    if (!registerPassword) {
      errors.password = 'Mot de passe requis';
    } else if (registerPassword.length < 6) {
      errors.password = 'Minimum 6 caractères';
    }
    
    setRegisterErrors(errors);
    
    if (Object.keys(errors).length === 0) {
      console.log('[AUTH] Register:', { 
        name: registerName, 
        email: registerEmail, 
        phone: registerPhone 
      });
      feedback.success();
      
      onAuth({
        name: registerName,
        email: registerEmail || `${registerPhone.replace(/\s/g, '')}@transportbf.bf`,
        phone: registerPhone,
        isGuest: false
      });
    } else {
      feedback.error();
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Image - Monuments de Ouagadougou */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `url(${bgImage})`,
        }}
      >
        {/* Overlay sombre pour lisibilité */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/70"></div>
      </div>

      {/* Bouton retour - En haut à gauche */}
      <div className="relative z-20 pt-6 px-6">
        <motion.button
          onClick={() => {
            feedback.tap();
            if (stage === 'form') {
              handleBackToChoice();
            } else {
              onBack();
            }
          }}
          className="text-white/90 hover:text-white flex items-center gap-2 backdrop-blur-sm bg-black/20 px-4 py-2 rounded-full"
          whileHover={{ scale: 1.05, x: -5 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </motion.button>
      </div>

      {/* STAGE 1: CHOIX - Connexion ou Inscription */}
      <AnimatePresence mode="wait">
        {stage === 'choice' && (
          <motion.div
            key="choice"
            className="relative z-10 flex flex-col items-center justify-end min-h-screen pb-12 px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Logo et Titre */}
            <motion.div 
              className="mb-12 text-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <motion.div 
                className="w-24 h-24 flex items-center justify-center mx-auto mb-6"
                whileHover={{ scale: 1.05, rotate: 5 }}
              >
                <img 
                  src={brandLogo} 
                  alt="FasoTravel"
                  className="w-full h-full object-contain"
                />
              </motion.div>
              
              <h1 className="text-4xl text-white mb-3 drop-shadow-lg">
                Bienvenue sur<br />FasoTravel
              </h1>
              <p className="text-lg text-white/90 drop-shadow">
                Voyagez en toute sérénité
              </p>
            </motion.div>

            {/* Boutons Choix - Petits et côte à côte */}
            <motion.div 
              className="w-full max-w-[280px] mx-auto flex gap-2"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {/* Bouton S'inscrire - Blanc transparent */}
              <motion.button
                onClick={handleChoiceRegister}
                className="flex-1 py-3 px-4 bg-white/90 backdrop-blur-sm hover:bg-white text-gray-900 rounded-xl shadow-lg transition-all text-sm"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                Inscription
              </motion.button>

              {/* Bouton Se connecter - Gradient rouge-doré-vert */}
              <motion.button
                onClick={handleChoiceLogin}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-red-600 via-amber-500 to-green-600 hover:from-red-700 hover:via-amber-600 hover:to-green-700 text-white rounded-xl shadow-lg transition-all text-sm"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                Connexion
              </motion.button>
            </motion.div>

            {/* Petit texte légal */}
            <motion.div 
              className="text-center text-xs text-white/70 mt-8 px-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <p>
                En continuant, vous acceptez nos{' '}
                <button
                  onClick={() => {
                    feedback.tap();
                    onNavigate?.('terms-conditions');
                  }}
                  className="text-white/90 hover:text-white underline transition-colors"
                >
                  Conditions d'utilisation
                </button>
                <span className="mx-2 text-white/60">|</span>
                <button
                  onClick={() => {
                    feedback.tap();
                    onNavigate?.('terms-conditions');
                  }}
                  className="text-white/90 hover:text-white underline transition-colors"
                >
                  Politique de confidentialité
                </button>
              </p>
            </motion.div>
          </motion.div>
        )}

        {/* STAGE 2: FORMULAIRE - Slide up depuis le bas */}
        {stage === 'form' && (
          <motion.div
            key="form"
            className="fixed bottom-0 left-0 right-0 z-30"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl max-h-[80vh] overflow-y-auto">
              {/* Header du formulaire */}
              <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 rounded-t-3xl z-10">
                <h2 className="text-2xl text-gray-900 dark:text-white text-center">
                  {mode === 'login' ? 'Connexion' : 'Inscription'}
                </h2>
              </div>

              <div className="p-6">
                <AnimatePresence mode="wait">
                  {mode === 'login' ? (
                    <motion.div
                      key="login"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-4"
                    >
                      {/* Toggle Login Method */}
                      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <button
                          onClick={() => {
                            feedback.tap();
                            setLoginMethod('phone');
                          }}
                          className={`flex-1 py-2 px-3 rounded-md text-sm transition-all ${
                            loginMethod === 'phone'
                              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
                              : 'text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          <Phone className="w-4 h-4 inline mr-1" />
                          Téléphone
                        </button>
                        <button
                          onClick={() => {
                            feedback.tap();
                            setLoginMethod('email');
                          }}
                          className={`flex-1 py-2 px-3 rounded-md text-sm transition-all ${
                            loginMethod === 'email'
                              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
                              : 'text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          <Mail className="w-4 h-4 inline mr-1" />
                          Email
                        </button>
                      </div>

                      {loginMethod === 'phone' ? (
                        <div>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                              type="tel"
                              value={loginPhone}
                              onChange={(e) => {
                                setLoginPhone(e.target.value);
                                setLoginErrors({ ...loginErrors, identifier: undefined });
                              }}
                              placeholder="70123456"
                              maxLength={8}
                              className={`pl-10 ${loginErrors.identifier ? 'border-red-500' : ''}`}
                            />
                          </div>
                          {loginErrors.identifier && (
                            <p className="text-xs text-red-500 mt-1">{loginErrors.identifier}</p>
                          )}
                        </div>
                      ) : (
                        <div>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                              type="email"
                              value={loginEmail}
                              onChange={(e) => {
                                setLoginEmail(e.target.value);
                                setLoginErrors({ ...loginErrors, identifier: undefined });
                              }}
                              placeholder="votre@email.com"
                              className={`pl-10 ${loginErrors.identifier ? 'border-red-500' : ''}`}
                            />
                          </div>
                          {loginErrors.identifier && (
                            <p className="text-xs text-red-500 mt-1">{loginErrors.identifier}</p>
                          )}
                        </div>
                      )}

                      <div>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            value={loginPassword}
                            onChange={(e) => {
                              setLoginPassword(e.target.value);
                              setLoginErrors({ ...loginErrors, password: undefined });
                            }}
                            placeholder="••••••••"
                            className={`pl-10 pr-10 ${loginErrors.password ? 'border-red-500' : ''}`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                        {loginErrors.password && (
                          <p className="text-xs text-red-500 mt-1">{loginErrors.password}</p>
                        )}
                      </div>

                      <Button
                        onClick={handleLogin}
                        className="w-full bg-gradient-to-r from-red-600 via-amber-500 to-green-600 hover:from-red-700 hover:via-amber-600 hover:to-green-700 py-6"
                      >
                        Se connecter
                      </Button>

                      {/* Lien vers inscription */}
                      <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
                        Pas encore de compte ?{' '}
                        <button
                          onClick={() => {
                            feedback.tap();
                            setMode('register');
                          }}
                          className="text-green-600 dark:text-green-400"
                        >
                          S'inscrire
                        </button>
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="register"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <div>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <Input
                            type="text"
                            value={registerName}
                            onChange={(e) => {
                              setRegisterName(e.target.value);
                              setRegisterErrors({ ...registerErrors, name: undefined });
                            }}
                            placeholder="Ex: Marie Ouédraogo"
                            className={`pl-10 ${registerErrors.name ? 'border-red-500' : ''}`}
                          />
                        </div>
                        {registerErrors.name && (
                          <p className="text-xs text-red-500 mt-1">{registerErrors.name}</p>
                        )}
                      </div>

                      <div>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <Input
                            type="tel"
                            value={registerPhone}
                            onChange={(e) => {
                              setRegisterPhone(e.target.value);
                              setRegisterErrors({ ...registerErrors, phone: undefined });
                            }}
                            placeholder="70123456"
                            maxLength={8}
                            className={`pl-10 ${registerErrors.phone ? 'border-red-500' : ''}`}
                          />
                        </div>
                        {registerErrors.phone && (
                          <p className="text-xs text-red-500 mt-1">{registerErrors.phone}</p>
                        )}
                      </div>

                      <div>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <Input
                            type="email"
                            value={registerEmail}
                            onChange={(e) => {
                              setRegisterEmail(e.target.value);
                              setRegisterErrors({ ...registerErrors, email: undefined });
                            }}
                            placeholder="Email (optionnel)"
                            className={`pl-10 ${registerErrors.email ? 'border-red-500' : ''}`}
                          />
                        </div>
                        {registerErrors.email && (
                          <p className="text-xs text-red-500 mt-1">{registerErrors.email}</p>
                        )}
                      </div>

                      <div>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            value={registerPassword}
                            onChange={(e) => {
                              setRegisterPassword(e.target.value);
                              setRegisterErrors({ ...registerErrors, password: undefined });
                            }}
                            placeholder="••••••••"
                            className={`pl-10 pr-10 ${registerErrors.password ? 'border-red-500' : ''}`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                        {registerErrors.password && (
                          <p className="text-xs text-red-500 mt-1">{registerErrors.password}</p>
                        )}
                      </div>

                      <Button
                        onClick={handleRegister}
                        className="w-full bg-gradient-to-r from-red-600 via-amber-500 to-green-600 hover:from-red-700 hover:via-amber-600 hover:to-green-700 py-6"
                      >
                        Créer mon compte
                      </Button>

                      {/* Lien vers connexion */}
                      <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
                        Déjà un compte ?{' '}
                        <button
                          onClick={() => {
                            feedback.tap();
                            setMode('login');
                          }}
                          className="text-green-600 dark:text-green-400"
                        >
                          Se connecter
                        </button>
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
