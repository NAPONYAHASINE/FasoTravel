/**
 * HomePage - Page d'accueil avec recherche
 * 
 * DEV NOTES:
 * - Endpoint: GET /trips?from=&to=&date=&type=&operator=
 * - Event: search_submitted (track with params)
 * - Autocomplete gares: GET /stations?search=
 * - Support aller simple + aller-retour
 * - Validation: from et to obligatoires
 */

import { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, Navigation as NavigationIcon, Building2, Users } from 'lucide-react';
import { Button } from '../components/ui/button';
import { t } from '../lib/i18n';
import type { Page } from '../App';
import { ContextualHelp, HelpButton } from '../components/ContextualHelp';
import { AnimatedButton } from '../components/AnimatedButton';
import { StoriesCircle } from '../components/StoriesCircle';
import { motion } from 'motion/react';
import brandLogo from '../assets/brand/logo.png';
import { feedback } from '../lib/interactions';
import { useStations, usePopularRoutes, useUnreadNotificationCount } from '../lib/hooks';

interface HomePageProps {
  userName?: string;
  onSearch: (params: SearchParams) => void;
  onNavigate?: (page: Page, data?: any) => void;
}

export interface SearchParams {
  from: string;
  to: string;
  date?: string;
  type: 'ALLER_SIMPLE' | 'ALLER_RETOUR';
  returnDate?: string;
  operator?: string;
  passengers?: number;
}

export function HomePage({ userName, onSearch, onNavigate }: HomePageProps) {
  const { stations, isLoading: stationsLoading } = useStations();
  const { routes: popularRoutes, isLoading: routesLoading } = usePopularRoutes();
  const { unreadCount } = useUnreadNotificationCount();
  const [tripType, setTripType] = useState<'ALLER_SIMPLE' | 'ALLER_RETOUR'>('ALLER_SIMPLE');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [showHelp, setShowHelp] = useState(false);
  const [forceShowHelp, setForceShowHelp] = useState(false);  // Added: to track manual button clicks

  const helpTips = [
    {
      id: 'tip-1',
      title: 'Bienvenue sur FasoTravel !',
      message: 'Réservez facilement vos trajets en bus. Choisissez votre ville de départ et d\'arrivée pour commencer.'
    },
    {
      id: 'tip-2',
      title: 'Routes populaires',
      message: 'Cliquez sur une route populaire ci-dessous pour remplir automatiquement votre recherche.'
    },
    {
      id: 'tip-3',
      title: 'Paiement sécurisé',
      message: 'Payez avec Orange Money, Moov Money ou par carte bancaire. Tous les paiements sont 100% sécurisés.'
    }
  ];

  useEffect(() => {
    // Afficher l'aide SEULEMENT au premier chargement ET si l'utilisateur est connecté
    // et que c'est la première fois qu'il voit cette aide
    const hasSeenHelp = localStorage.getItem('home-help-seen');
    if (!hasSeenHelp && userName) {
      setTimeout(() => {
        setShowHelp(true);
        // Marquer qu'on a vu l'aide pour la première fois
        localStorage.setItem('home-help-seen', 'true');
      }, 500);
    }
  }, [userName]);

  const handleSearch = () => {
    if (!from || !to) {
      feedback.error();
      alert('Veuillez sélectionner une ville de départ et d\'arrivée');
      return;
    }

    feedback.success();
    onSearch({
      from,
      to,
      date: date || undefined,
      type: tripType,
      returnDate: tripType === 'ALLER_RETOUR' ? returnDate : undefined,
      passengers
    });
  };

  const handlePopularRoute = (fromId: string, toId: string) => {
    feedback.tap();
    setFrom(fromId);
    setTo(toId);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pb-24 md:pb-0 relative overflow-hidden">
      {/* Logo */}
      <motion.div 
        className="px-4 sm:px-6 pt-4 pb-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <motion.div 
            className="w-12 h-12"
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            <img 
              src={brandLogo} 
              alt="FasoTravel"
              className="w-full h-full object-contain"
            />
          </motion.div>
          
          {/* Boutons alignés */}
          <div className="flex gap-1.5 sm:gap-2">
            <motion.button 
              onClick={() => {
                feedback.tap();
                onNavigate?.('operators');
              }}
              className="w-8 h-8 sm:w-9 sm:h-9 bg-gray-100 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Building2 className="w-4 h-4" />
            </motion.button>
            <motion.button 
              onClick={() => {
                feedback.tap();
                onNavigate?.('notifications');
              }}
              className="w-8 h-8 sm:w-9 sm:h-9 bg-gray-100 dark:bg-gray-800 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 relative"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <motion.span 
                className="text-base sm:text-lg"
                animate={{ rotate: [0, 10, -10, 10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
              >
                🔔
              </motion.span>
              {/* Badge for unread notifications */}
              {unreadCount > 0 && (
                <motion.span 
                  className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 text-white text-[10px] sm:text-xs rounded-full flex items-center justify-center font-semibold"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  {unreadCount}
                </motion.span>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Stories/Annonces circulaires */}
      <motion.div 
        className="px-4 pt-4 pb-3"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="max-w-4xl mx-auto">
          <StoriesCircle />
        </div>
      </motion.div>

      {/* Hero Section - Réduit */}
      <div className="px-4 sm:px-6 pt-3 pb-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Greeting */}
          <motion.div 
            className="flex items-center gap-2 sm:gap-3 mb-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, type: "spring" }}
          >
            <motion.div 
              className="w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-br from-red-500 to-amber-500 rounded-full flex items-center justify-center text-white"
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              {(userName || 'C').charAt(0).toUpperCase()}
            </motion.div>
            <div className="text-gray-800 dark:text-gray-200">
              <motion.p 
                className="text-xs text-gray-600 dark:text-gray-400"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Bonjour {userName ? `${userName} 👋` : '👋'}
              </motion.p>
              {!userName && <p className="text-sm">Bienvenue</p>}
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1 
            className="text-lg sm:text-xl md:text-2xl text-gray-900 dark:text-white mb-1.5 leading-tight"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {t('home.title')}
          </motion.h1>
        </div>
      </div>

      {/* Search Card */}
      <div className="px-4 sm:px-6 pb-6">
        <motion.div 
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-xl border-2 border-gray-100 dark:border-gray-700 p-4 sm:p-5">
            {/* Title with link to operators */}
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm sm:text-base text-gray-900 dark:text-white">
                Recherche rapide
              </h2>
              <motion.button
                onClick={() => {
                  feedback.tap();
                  onNavigate?.('operators');
                }}
                className="flex items-center gap-1.5 text-xs sm:text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors px-2 sm:px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Choisir une compagnie</span>
                <span className="sm:hidden">Compagnies</span>
              </motion.button>
            </div>

            {/* Trip Type */}
            <div className="flex gap-2 mb-3">
              <motion.button
                onClick={() => {
                  feedback.tap();
                  setTripType('ALLER_SIMPLE');
                }}
                className={`flex-1 py-2 px-3 sm:py-2.5 sm:px-4 rounded-xl transition-all text-xs sm:text-sm ${
                  tripType === 'ALLER_SIMPLE'
                    ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg'
                    : 'bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-red-300 dark:hover:border-red-600'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {t('home.one_way')}
              </motion.button>
              <motion.button
                onClick={() => {
                  feedback.tap();
                  setTripType('ALLER_RETOUR');
                }}
                className={`flex-1 py-2 px-3 sm:py-2.5 sm:px-4 rounded-xl transition-all text-xs sm:text-sm ${
                  tripType === 'ALLER_RETOUR'
                    ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg'
                    : 'bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-red-300 dark:hover:border-red-600'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {t('home.round_trip')}
              </motion.button>
            </div>

            {/* From/To Inputs */}
            <motion.div 
              className="space-y-2.5 mb-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div>
                <label className="block text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-1.5">D'où partez-vous ?</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                  <select
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 sm:py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 hover:border-amber-400 dark:hover:border-amber-600 focus:border-amber-500 dark:focus:border-amber-500 focus:outline-none transition-colors"
                    disabled={stationsLoading}
                    title="Ville de départ"
                    aria-label="Ville de départ"
                  >
                    <option value="">
                      {stationsLoading ? 'Chargement...' : 'Choisir la ville de départ'}
                    </option>
                    {stations.map((station) => (
                      <option key={station.id} value={station.id}>
                        {station.city}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-1.5">Où allez-vous ?</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                  <select
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 sm:py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 hover:border-green-400 dark:hover:border-green-600 focus:border-green-500 dark:focus:border-green-500 focus:outline-none transition-colors"
                    disabled={stationsLoading}
                    title="Ville d'arrivée"
                    aria-label="Ville d'arrivée"
                  >
                    <option value="">
                      {stationsLoading ? 'Chargement...' : "Choisir la ville d'arrivée"}
                    </option>
                    {stations.map((station) => (
                      <option key={station.id} value={station.id}>
                        {station.city}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="date-input" className="block text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-1.5">Quand partez-vous ?</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                  <input
                    id="date-input"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 sm:py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 hover:border-red-400 dark:hover:border-red-600 focus:border-red-500 dark:focus:border-red-500 focus:outline-none transition-colors"
                    title="Sélectionnez la date de départ"
                    placeholder="jj/mm/aaaa"
                  />
                </div>
              </div>

              {tripType === 'ALLER_RETOUR' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label htmlFor="return-date-input" className="block text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-1.5">Quand revenez-vous ?</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                    <input
                      id="return-date-input"
                      type="date"
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 sm:py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 hover:border-red-400 dark:hover:border-red-600 focus:border-red-500 dark:focus:border-red-500 focus:outline-none transition-colors"
                      title="Sélectionnez la date de retour"
                      placeholder="jj/mm/aaaa"
                    />
                  </div>
                </motion.div>
              )}

              <div>
                <label className="block text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-1.5">Combien de passagers ?</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                  <select
                    value={passengers}
                    onChange={(e) => setPassengers(Number(e.target.value))}
                    className="w-full pl-10 pr-3 py-2.5 sm:py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 hover:border-green-400 dark:hover:border-green-600 focus:border-green-500 dark:focus:border-green-500 focus:outline-none transition-colors"
                    title="Nombre de passagers"
                    aria-label="Nombre de passagers"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                      <option key={num} value={num}>{num} {num === 1 ? 'passager' : 'passagers'}</option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>

            {/* Search Button */}
            <AnimatedButton
              onClick={handleSearch}
              feedbackType="click"
              variant="primary"
              size="lg"
              glow
              icon={<Search className="w-4 h-4 sm:w-5 sm:h-5" />}
              iconPosition="left"
              className="w-full text-sm sm:text-base bg-gradient-to-r from-red-600 via-amber-500 to-green-600"
            >
              Rechercher des trajets
            </AnimatedButton>
            
            {/* Help Button */}
            <motion.div 
              className="mt-3 flex justify-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <HelpButton 
                onClick={() => {
                  setShowHelp(true);
                  setForceShowHelp(true);  // Mark as manual button click
                }} 
                label="Besoin d'aide pour réserver ?" 
              />
            </motion.div>
          </div>

          {/* Popular Routes */}
          <motion.div 
            className="mt-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center gap-2 mb-2.5">
              <MapPin className="w-4 h-4 text-red-600 dark:text-red-400" />
              <h2 className="text-gray-900 dark:text-white text-xs sm:text-sm">{t('home.popular_routes')}</h2>
            </div>
            
            {/* Loading State */}
            {routesLoading && (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="bg-gray-200 dark:bg-gray-700 h-16 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            )}

            {/* Routes Grid */}
            {!routesLoading && popularRoutes.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {popularRoutes.map((route, index) => (
                  <motion.button
                    key={route.id}
                    onClick={() => handlePopularRoute(route.from_id, route.to_id)}
                    className="bg-gradient-to-br from-red-50 via-amber-50 to-green-50 dark:from-red-900/20 dark:via-amber-900/20 dark:to-green-900/20 border-2 border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-600 text-gray-800 dark:text-gray-200 px-2.5 py-2 rounded-xl transition-all hover:shadow-lg text-left"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.05 }}
                  >
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                      <span className="text-[11px] sm:text-xs truncate">{route.from}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <span className="text-[11px] sm:text-xs truncate">{route.to}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!routesLoading && popularRoutes.length === 0 && (
              <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">
                Aucune route populaire disponible
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>

      {/* Contextual Help */}
      {showHelp && (
        <ContextualHelp 
          tips={helpTips} 
          storageKey="home-help-seen"
          forceShow={forceShowHelp}
          onComplete={() => {
            setShowHelp(false);
            setForceShowHelp(false);
          }}
        />
      )}
    </div>
  );
}
