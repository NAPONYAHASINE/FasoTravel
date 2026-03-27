/**
 * @file TopBar.tsx
 * @description Header bar with search, notifications, theme toggle
 * Version 2.0 - Backend-ready avec React Router
 * 
 * CHANGEMENTS:
 * - Props optionnelles (compatibilité avec RootLayout)
 * - Utilise useLocation() pour détecter la page courante
 * - Utilise useNavigate() pour navigation
 * - Notifications basées sur données du contexte (backend-ready)
 */

import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { 
  Search, 
  Bell, 
  Sun, 
  Moon,
} from 'lucide-react';
import { useAdminApp } from '../context/AdminAppContext';

// ============================================================================
// TYPES
// ============================================================================

// Map des routes vers titres de pages
const PAGE_TITLES: Record<string, string> = {
  '/': 'Tableau de Bord',
  '/dashboard': 'Tableau de Bord',
  '/map': 'Carte Temps Réel',
  '/support': 'Support Client',
  '/companies': 'Sociétés de Transport',
  '/passengers': 'Gestion des Passagers',
  '/stations': 'Gestion des Gares',
  '/advertising': 'Gestion Publicité',
  '/integrations': 'Intégrations',
  '/incidents': 'Gestion des Incidents',
  '/logs': 'Logs Système',
  '/tickets': 'Gestion des Billets',
  '/bookings': 'Gestion des Réservations',
  '/payments': 'Gestion des Paiements',
  '/trips': 'Gestion des Trajets',
  '/promotions': 'Gestion des Promotions',
  '/reviews': 'Avis Clients',
  '/services': 'Gestion des Services',
  '/notifications': 'Centre de Notifications',
  '/analytics': 'Analytiques',
  '/sessions': 'Gestion des Sessions',
  '/policies': 'Politiques',
  '/referrals': 'Parrainage',
  '/settings': 'Paramètres'
};

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    theme,
    toggleTheme,
    notifications,
    markNotificationAsRead,
    refreshNotifications,
  } = useAdminApp();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const unreadCount = notifications.filter((n) => !n.read).length;
  const dropdownNotifications = notifications.slice(0, 5);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'error':
        return '🚨';
      case 'warning':
        return '⚠️';
      case 'success':
        return '✅';
      default:
        return '🔔';
    }
  };

  const formatRelativeTime = (isoDate: string) => {
    const date = new Date(isoDate);
    const diffMs = Date.now() - date.getTime();
    const minutes = Math.floor(diffMs / 60000);

    if (minutes < 1) return 'A l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Il y a ${hours} h`;
    const days = Math.floor(hours / 24);
    return `Il y a ${days} j`;
  };

  const handleMarkAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;

    await Promise.allSettled(unread.map((n) => markNotificationAsRead(n.id)));
    await refreshNotifications();
  };

  // Détection du titre de page depuis l'URL
  const currentPageTitle = PAGE_TITLES[location.pathname] || 'FasoTravel Admin';

  return (
    <div className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm transition-colors">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Left Section - Page Title */}
          <div className="flex items-center gap-4 flex-1">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl text-gray-900 dark:text-white truncate">{currentPageTitle}</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 hidden sm:block">FasoTravel Admin - Supervision Plateforme</p>
            </div>
          </div>

          {/* Center Section - Search Bar (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-xl">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher sociétés, passagers, gares..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#dc2626] focus:border-transparent text-sm bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 transition-colors"
              />
            </div>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center gap-3">
            
            {/* Debug Theme Indicator (Remove in production) */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs">
              <div className={`w-2 h-2 rounded-full ${theme === 'dark' ? 'bg-blue-500 animate-pulse' : 'bg-yellow-500'}`} />
              <span className="text-gray-600 dark:text-gray-300 font-mono">
                {theme.toUpperCase()}
              </span>
            </div>
            
            {/* Theme Toggle */}
            <button
              onClick={() => {
                console.log('🎯 Toggle clicked! Current theme:', theme);
                toggleTheme();
                console.log('🎯 Toggle theme called');
              }}
              className="p-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 border-2 border-transparent hover:border-red-500"
              title={theme === 'light' ? 'Activer le mode sombre' : 'Activer le mode clair'}
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} className="text-yellow-400" />}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => {
                  const next = !showNotifications;
                  setShowNotifications(next);
                  if (next) {
                    void refreshNotifications();
                  }
                }}
                className="relative p-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="Notifications"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-5 h-5 bg-[#dc2626] text-white text-xs rounded-full flex items-center justify-center font-semibold shadow-lg animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowNotifications(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 max-h-[500px] overflow-hidden flex flex-col animate-fadeIn">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</p>
                          {unreadCount > 0 && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</p>
                          )}
                        </div>
                        <button
                          onClick={() => void handleMarkAllAsRead()}
                          className="text-xs text-[#dc2626] hover:underline font-medium"
                        >
                          Tout marquer
                        </button>
                      </div>
                    </div>

                    {/* Notifications List */}
                    <div className="overflow-y-auto flex-1">
                      {dropdownNotifications.length > 0 ? (
                        dropdownNotifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => {
                              if (!notif.read) {
                                void markNotificationAsRead(notif.id);
                              }
                              if (notif.actionUrl) {
                                setShowNotifications(false);
                                navigate(notif.actionUrl);
                              }
                            }}
                            className={`group block p-4 rounded-lg transition-all ${
                              !notif.read ? 'bg-red-50 dark:bg-red-900/20' : ''
                            } hover:bg-gray-50 dark:hover:bg-gray-800 ${notif.actionUrl ? 'cursor-pointer' : ''}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="text-2xl flex-shrink-0">{getNotificationIcon(notif.type)}</div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">{notif.title}</p>
                                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{notif.message}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatRelativeTime(notif.createdAt)}</p>
                              </div>
                              {!notif.read && (
                                <div className="w-2 h-2 bg-[#dc2626] rounded-full flex-shrink-0 mt-1.5" />
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center">
                          <Bell className="mx-auto mb-3 text-gray-400 dark:text-gray-500" size={32} />
                          <p className="text-sm text-gray-500 dark:text-gray-400">Aucune notification</p>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    {dropdownNotifications.length > 0 && (
                      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                        <button 
                          onClick={() => {
                            setShowNotifications(false);
                            navigate('/notifications?tab=inbox'); // Vue dédiée inbox admin
                          }}
                          className="text-xs text-[#dc2626] hover:underline font-medium"
                        >
                          Voir toutes les notifications →
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Search */}
      <div className="md:hidden px-4 pb-3 pt-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#dc2626] text-sm bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 transition-colors"
          />
        </div>
      </div>
    </div>
  );
}
