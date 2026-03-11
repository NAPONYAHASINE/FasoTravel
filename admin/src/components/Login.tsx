import React, { useState } from 'react';
import { LogIn, Mail, Lock, AlertCircle, Eye, EyeOff, Loader } from 'lucide-react';
import { useAdminAppSafe } from '../context/AdminAppContext';
import { useNavigate } from 'react-router';
import { toast } from 'sonner@2.0.3';
import logo from 'figma:asset/ddaf4c7eb0e28936f4d0223e859065e25d5c3fc8.png';

export function Login() {
  const ctx = useAdminAppSafe();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 🔥 PLUS DE SPINNER BLOQUANT - Le formulaire s'affiche TOUJOURS
  // Si ctx est null (HMR Figma Make), on utilise un fallback local
  const loginFn = ctx?.login;
  const theme = ctx?.theme ?? (document.documentElement.classList.contains('dark') ? 'dark' : 'light');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setIsLoading(true);
    
    try {
      if (loginFn) {
        await loginFn(email, password);
        toast.success('Code OTP envoyé ! Vérifiez votre email.');
        navigate('/verify-otp');
      } else {
        // Contexte pas encore disponible (HMR) - réessayer après un court délai
        setError('Initialisation en cours... Réessayez dans un instant.');
      }
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page-bg min-h-screen flex items-center justify-center p-4 transition-colors">
      {/* Grille de fond adaptative au thème */}
      {/* Mode sombre: grille rouge subtile */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyMjAsIDM4LCAzOCwgMC4xKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40 hidden dark:block"></div>

      <div className="relative w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex flex-col items-center justify-center text-center p-12">
          <div className="mb-8">
            {/* Logo FasoTravel sans fond */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-yellow-500 to-green-600 rounded-3xl blur-2xl opacity-20 animate-pulse"></div>
              <div className="relative w-40 h-40 flex items-center justify-center transform hover:scale-110 transition-transform duration-300">
                <img src={logo} alt="FasoTravel Logo" className="w-full h-full object-contain drop-shadow-2xl" />
              </div>
            </div>
          </div>

          <h1 className="text-5xl text-gray-900 dark:text-white mb-4 tracking-tight">
            FasoTravel
          </h1>
          <p className="text-xl text-gray-700 dark:text-gray-300 mb-2">
            Administration Plateforme
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            Supervision de l'écosystème transport
          </p>

          {/* Features */}
          <div className="space-y-4 max-w-md">
            {[
              { icon: '🏢', text: 'Gestion des sociétés de transport' },
              { icon: '👥', text: 'Supervision des passagers' },
              { icon: '🚏', text: 'Gestion des gares/stations' },
              { icon: '📊', text: 'Analytics multi-société' }
            ].map((feature, index) => (
              <div 
                key={index}
                className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-200 dark:border-gray-700/50"
              >
                <div className="text-3xl">{feature.icon}</div>
                <div className="text-left">
                  <p className="text-sm text-gray-700 dark:text-gray-300">{feature.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="relative">
          {/* Card blanche en clair, sombre en dark */}
          <div className="bg-white dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-12 border border-gray-200 dark:border-gray-700/50">
            {/* Mobile Logo */}
            <div className="lg:hidden flex justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-yellow-500 to-green-600 rounded-2xl blur-xl opacity-20"></div>
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <img src={logo} alt="FasoTravel Logo" className="w-full h-full object-contain drop-shadow-xl" />
                </div>
              </div>
            </div>

            {/* Header */}
            <div className="mb-8">
              <h2 className="text-3xl text-gray-900 dark:text-white mb-2">Connexion Admin</h2>
              <p className="text-gray-600 dark:text-gray-400">Supervision de la plateforme FasoTravel</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                  Adresse Email
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@fasotravel.bf"
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-red-500 focus:bg-white dark:focus:bg-gray-600 transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                  Mot de Passe
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-4 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-red-500 focus:bg-white dark:focus:bg-gray-600 transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Se souvenir de moi</span>
                </label>
                <button 
                  type="button"
                  className="text-sm text-red-600 hover:text-red-700 transition-colors"
                >
                  Mot de passe oublié?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 overflow-hidden"
              >
                {/* Shimmer Effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                
                <span className="relative flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <Loader className="h-5 w-5 animate-spin" />
                      <span>Connexion en cours...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="h-5 w-5" />
                      <span>Se Connecter</span>
                    </>
                  )}
                </span>
              </button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-8 p-4 bg-gradient-to-r from-red-50 to-yellow-50 dark:from-red-900/20 dark:to-yellow-900/20 rounded-xl border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-900 dark:text-red-200 mb-2">🔐 Accès démo:</p>
              <div className="space-y-1 text-xs text-red-700 dark:text-red-300">
                <p><strong>Email:</strong> admin@fasotravel.bf</p>
                <p><strong>Mot de passe:</strong> Admin123!</p>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                © 2026 FasoTravel. Tous droits réservés.
              </p>
            </div>
          </div>

          {/* Floating Elements */}
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-red-400 to-yellow-400 rounded-full opacity-20 blur-2xl animate-pulse"></div>
          <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-green-400 to-yellow-400 rounded-full opacity-20 blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
      </div>
    </div>
  );
}