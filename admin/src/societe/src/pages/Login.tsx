/**
 * @file Login.tsx
 * @description Login page for FasoTravel Societe (Admin)
 * 
 * TEMPORARY: Using local validation until @shared is linked
 */

import { useState } from 'react';
import { LogIn, Mail, Lock, AlertCircle, Eye, EyeOff, Loader } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

// Temporary validators
const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const getEmailError = (email: string) => {
  if (!email) return 'Email requis';
  if (!isValidEmail(email)) return 'Email invalide';
  return null;
};

const getPasswordError = (password: string) => {
  if (!password) return 'Mot de passe requis';
  if (password.length < 6) return 'Minimum 6 caractères';
  return null;
};

export default function Login() {
  const { login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation using @shared validators
    const emailError = getEmailError(email);
    const passwordError = getPasswordError(password);

    if (emailError) {
      setError(emailError);
      return;
    }

    if (passwordError) {
      setError(passwordError);
      return;
    }

    setIsLoading(true);

    try {
      await login(email, password);
      // Success - AppContext will handle redirect
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Échec de la connexion');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-yellow-50 to-green-50 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyMjAsIDM4LCAzOCwgMC4xKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40"></div>

      <div className="relative w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex flex-col items-center justify-center text-center p-12">
          <div className="mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-yellow-500 to-green-600 rounded-3xl blur-2xl opacity-20 animate-pulse"></div>
              <div className="relative w-40 h-40 flex items-center justify-center">
                <div className="w-32 h-32 bg-gradient-to-br from-fasotravel-red via-fasotravel-yellow to-fasotravel-green rounded-2xl flex items-center justify-center text-white text-4xl font-bold shadow-2xl">
                  FT
                </div>
              </div>
            </div>
          </div>

          <h1 className="text-5xl text-gray-900 mb-4 tracking-tight font-bold">
            FasoTravel
          </h1>
          <p className="text-xl text-gray-700 mb-8">
            Plateforme de Transport au Burkina Faso
          </p>

          {/* Features */}
          <div className="space-y-4 max-w-md">
            {[
              { icon: '🚌', text: 'Gestion complète des opérateurs' },
              { icon: '📊', text: 'Analytiques en temps réel' },
              { icon: '🎫', text: 'Billetterie digitale' },
              { icon: '🗺️', text: 'Suivi GPS des véhicules' }
            ].map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 bg-white/50 backdrop-blur-sm rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                <div className="text-3xl">{feature.icon}</div>
                <div className="text-left">
                  <p className="text-sm text-gray-700">{feature.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full">
          <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl p-8 lg:p-12 border border-white/20">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-fasotravel-red via-fasotravel-yellow to-fasotravel-green rounded-2xl mb-4 shadow-lg">
                <LogIn className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Connexion Admin
              </h2>
              <p className="text-gray-600">
                Accédez à votre espace de gestion
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-fade-in">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-800 font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-fasotravel-red focus:border-transparent transition-all outline-none"
                    placeholder="votre@email.com"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-fasotravel-red focus:border-transparent transition-all outline-none"
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-fasotravel-red focus:ring-fasotravel-red"
                  />
                  <span className="ml-2 text-sm text-gray-600">Se souvenir de moi</span>
                </label>
                <button
                  type="button"
                  className="text-sm text-fasotravel-red hover:text-red-700 font-medium"
                >
                  Mot de passe oublié?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-fasotravel-red via-fasotravel-yellow to-fasotravel-green text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Connexion en cours...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    Se connecter
                  </>
                )}
              </button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-xs text-gray-600 text-center mb-2 font-semibold">
                Comptes de démonstration
              </p>
              <div className="space-y-2 text-xs text-gray-700">
                <p>👨‍💼 <strong>Responsable:</strong> admin@tsr.bf / Pass123!</p>
                <p>🏢 <strong>Manager:</strong> manager@gare-ouaga.bf / Pass123!</p>
                <p>💵 <strong>Caissier:</strong> caissier@gare-ouaga.bf / Pass123!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}