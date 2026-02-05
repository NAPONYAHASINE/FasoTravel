import { useState } from 'react';
import './styles.css';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Bus, Lock, Mail, Shield, Loader2, ChevronRight, Sun, Moon } from "lucide-react";
import logoImage from "figma:asset/ddaf4c7eb0e28936f4d0223e859065e25d5c3fc8.png";

type UserRole = 'responsable' | 'manager' | 'caissier';

export default function LoginPage() {
  const { darkMode, toggleDarkMode } = useTheme();
  const [step, setStep] = useState<'role' | 'credentials' | 'otp'>('role');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const roles = [
    {
      id: 'responsable' as UserRole,
      name: 'Responsable Société',
      icon: '👔',
      color: 'from-red-500 to-red-600',
      description: 'Pilotage stratégique complet',
      features: ['Vue multi-gares', 'Analytics avancées', 'Gestion tarifs', 'Stories & Marketing']
    },
    {
      id: 'manager' as UserRole,
      name: 'Manager de Gare',
      icon: '🏪',
      color: 'from-yellow-500 to-yellow-600',
      description: 'Opérations terrain quotidiennes',
      features: ['Supervision caissiers', 'Gestion départs', 'Suivi ventes local', 'Incidents terrain']
    },
    {
      id: 'caissier' as UserRole,
      name: 'Caissier',
      icon: '💰',
      color: 'from-green-500 to-green-600',
      description: 'Vente et gestion de caisse',
      features: ['Vente billets guichet', 'Gestion caisse', 'Impression listes', 'Mode offline']
    }
  ];

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setStep('credentials');
    // Pré-remplir l'email de démo
    setEmail(`${role}@tsr.bf`);
    setPassword('demo123');
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      setStep('otp');
    } catch (err) {
      setError('Identifiants incorrects. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password, otp);
    } catch (err) {
      setError('Code OTP incorrect. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetToRoleSelection = () => {
    setStep('role');
    setSelectedRole(null);
    setEmail('');
    setPassword('');
    setOtp('');
    setError('');
  };

  return (
    <div className="min-h-screen flex relative">
      {/* Bouton de thème en haut à droite */}
      <button
        onClick={toggleDarkMode}
        className="absolute top-4 right-4 z-50 p-3 rounded-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700"
        title={darkMode ? 'Mode clair' : 'Mode sombre'}
      >
        {darkMode ? (
          <Sun size={20} className="text-yellow-500" />
        ) : (
          <Moon size={20} className="text-gray-700" />
        )}
      </button>

      {/* Côté gauche - Branding */}
      <div 
        className="hidden lg:flex lg:w-1/2 p-12 flex-col justify-between text-white relative overflow-hidden login-brand-gradient"
      >
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <img 
              src={logoImage}
              alt="FasoTravel Logo"
              className="w-16 h-16 object-contain bg-white/10 backdrop-blur-sm rounded-xl p-2"
            />
            <div>
              <h1 className="text-2xl font-bold">FasoTravel</h1>
              <p className="text-sm text-white/90">Dashboard Professionnel</p>
            </div>
          </div>

          <div className="space-y-6 mt-16">
            <div>
              <h2 className="text-4xl font-bold mb-4">
                3 Rôles, 3 Interfaces
              </h2>
              <p className="text-lg text-white/90">
                Une expérience adaptée à chaque niveau de responsabilité
              </p>
            </div>

            <div className="grid gap-4 mt-12">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <span className="text-lg">👔</span>
                  </div>
                  <h3 className="font-semibold">Responsable Société</h3>
                </div>
                <p className="text-sm text-white/80 ml-11">
                  Vision stratégique multi-gares avec analytics et pilotage complet
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <span className="text-lg">🏪</span>
                  </div>
                  <h3 className="font-semibold">Manager de Gare</h3>
                </div>
                <p className="text-sm text-white/80 ml-11">
                  Supervision terrain : caissiers, départs et opérations locales
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <span className="text-lg">💰</span>
                  </div>
                  <h3 className="font-semibold">Caissier</h3>
                </div>
                <p className="text-sm text-white/80 ml-11">
                  Vente billets, gestion caisse et mode offline intégré
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm text-white/70">
          © 2024 FasoTravel - Transport Burkina Faso
        </div>

        {/* Pattern background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 pattern-background"></div>
        </div>
      </div>

      {/* Côté droit - Formulaire */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="w-full max-w-2xl">
          {/* Logo mobile */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center login-logo-gradient"
            >
              <Bus className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tf-gradient-text">FasoTravel</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Dashboard</p>
            </div>
          </div>

          {/* ÉTAPE 1 : Sélection du rôle */}
          {step === 'role' && (
            <div className="animate-fade-in">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                  Choisissez votre profil
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Sélectionnez votre rôle pour accéder à votre interface dédiée
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {roles.map((role: any) => (
                  <button
                    key={role.id}
                    onClick={() => handleRoleSelect(role.id)}
                    className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all border-2 border-transparent hover:border-[#f59e0b] text-left"
                  >
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <span className="text-3xl">{role.icon}</span>
                    </div>
                    
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                      {role.name}
                    </h3>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {role.description}
                    </p>

                    <ul className="space-y-2 mb-4">
                      {role.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-500">
                          <span className="text-[#16a34a] mt-0.5">✓</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-sm font-medium text-[#f59e0b]">Connexion →</span>
                      <ChevronRight className="text-gray-400 group-hover:text-[#f59e0b] transition-colors" size={20} />
                    </div>
                  </button>
                ))}
              </div>

              <div className="text-center mt-6">
                <a href="/status" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  📊 Voir l'état du développement
                </a>
              </div>
            </div>
          )}

          {/* ÉTAPE 2 : Identifiants */}
          {step === 'credentials' && selectedRole && (
            <div className="animate-fade-in">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
                {/* Rôle sélectionné */}
                <div className="flex items-center justify-between mb-6 p-4 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-700/50">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">
                      {roles.find(r => r.id === selectedRole)?.icon}
                    </span>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Connexion en tant que</p>
                      <p className="font-bold text-gray-900 dark:text-white">
                        {roles.find(r => r.id === selectedRole)?.name}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={resetToRoleSelection}
                    className="text-sm text-[#f59e0b] hover:text-[#d97706] font-medium"
                  >
                    Changer
                  </button>
                </div>

                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Identifiants
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Entrez vos identifiants professionnels
                  </p>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                  </div>
                )}

                <form onSubmit={handleCredentialsSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email professionnel
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="text-gray-500 dark:text-gray-400" size={20} />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:border-transparent"
                        placeholder="votre@email.bf"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Mot de passe
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="text-gray-400" size={20} />
                      </div>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:border-transparent"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full tf-btn-primary flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        <span>Vérification...</span>
                      </>
                    ) : (
                      <span>Continuer</span>
                    )}
                  </button>
                </form>

                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    💡 <strong>Mode démo :</strong> Les identifiants sont pré-remplis. Cliquez sur "Continuer" pour accéder.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ÉTAPE 3 : OTP */}
          {step === 'otp' && selectedRole && (
            <div className="animate-fade-in">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Vérification OTP
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Un code de sécurité a été envoyé à votre numéro
                  </p>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                  </div>
                )}

                <form onSubmit={handleOtpSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Code OTP (6 chiffres)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Shield className="text-gray-400" size={20} />
                      </div>
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#f59e0b] focus:border-transparent text-center text-2xl tracking-widest"
                        placeholder="000000"
                        maxLength={6}
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || otp.length !== 6}
                    className="w-full tf-btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        <span>Vérification...</span>
                      </>
                    ) : (
                      <span>Se connecter</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep('credentials')}
                    className="w-full text-sm text-[#f59e0b] hover:text-[#d97706] font-medium"
                  >
                    ← Retour aux identifiants
                  </button>
                </form>

                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    💡 <strong>Mode démo :</strong> Entrez n'importe quel code à 6 chiffres (ex: 123456)
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


