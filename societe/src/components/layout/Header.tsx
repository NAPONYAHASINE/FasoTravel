import { Bell, Moon, Sun, Search, Wifi, WifiOff, X } from "lucide-react";
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import logoImage from "figma:asset/ddaf4c7eb0e28936f4d0223e859065e25d5c3fc8.png";

interface HeaderProps {
  title: string;
  showSearch?: boolean;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
}

export default function Header({ title, showSearch = false }: HeaderProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved === null ? true : saved === 'true';
  });
  
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Nouveau départ',
      message: 'Le bus BF-2245-OG est parti à l\'heure',
      time: 'Il y a 5 min',
      read: false,
      type: 'success'
    },
    {
      id: '2',
      title: 'Alerte caisse',
      message: 'Caisse principale atteint 500 000 FCFA',
      time: 'Il y a 15 min',
      read: false,
      type: 'warning'
    },
    {
      id: '3',
      title: 'Rapport journalier',
      message: 'Le rapport de la journée est prêt',
      time: 'Il y a 1h',
      read: true,
      type: 'info'
    }
  ]);
  const { user } = useAuth();
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Appliquer le thème au chargement
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Écouter les changements de connexion
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Fermer les notifications si on clique ailleurs
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDark]);

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notif => ({ ...notif, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(notif => notif.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400';
      case 'warning':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400';
      case 'error':
        return 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400';
      default:
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400';
    }
  };

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo + Titre */}
          <div className="flex items-center gap-4">
            <img 
              src={logoImage}
              alt="FasoTravel Logo"
              className="w-10 h-10 object-contain flex-shrink-0"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {title}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {new Date().toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Barre de recherche (optionnelle) */}
            {showSearch && (
              <div className="hidden md:flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-lg flex-1 max-w-md">
                <Search size={18} className="text-gray-500 dark:text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  className="bg-transparent border-none outline-none text-sm text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 w-full"
                />
              </div>
            )}

            {/* Statut connexion */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
              isOnline 
                ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
                : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
            }`}>
              {isOnline ? (
                <>
                  <Wifi size={16} />
                  <span className="text-xs font-medium hidden sm:inline">En ligne</span>
                </>
              ) : (
                <>
                  <WifiOff size={16} />
                  <span className="text-xs font-medium hidden sm:inline">Hors ligne</span>
                </>
              )}
            </div>

            {/* Mode sombre */}
            <button
              onClick={() => {
                const newMode = !isDark;
                setIsDark(newMode);
                localStorage.setItem('darkMode', String(newMode));
                if (newMode) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-gray-300 dark:border-gray-600"
              title={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
            >
              {isDark ? (
                <>
                  <Sun size={20} className="text-yellow-500" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Clair</span>
                </>
              ) : (
                <>
                  <Moon size={20} className="text-gray-700" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Sombre</span>
                </>
              )}
            </button>

            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={toggleNotifications}
                className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Bell size={20} className="text-gray-600 dark:text-gray-400" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Panneau de notifications */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
                  {/* En-tête */}
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 dark:text-white">
                      Notifications ({unreadCount})
                    </h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-[#f59e0b] hover:underline"
                      >
                        Tout marquer comme lu
                      </button>
                    )}
                  </div>

                  {/* Liste des notifications */}
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`px-4 py-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                            !notif.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`w-2 h-2 rounded-full ${getNotificationColor(notif.type)}`}></span>
                                <h4 className="font-medium text-sm text-gray-900 dark:text-white">
                                  {notif.title}
                                </h4>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                {notif.message}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500">
                                {notif.time}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              {!notif.read && (
                                <button
                                  onClick={() => markAsRead(notif.id)}
                                  className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded"
                                  title="Marquer comme lu"
                                >
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              )}
                              <button
                                onClick={() => deleteNotification(notif.id)}
                                className="p-1 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                                title="Supprimer"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        Aucune notification
                      </div>
                    )}
                  </div>

                  {/* Pied */}
                  {notifications.length > 0 && (
                    <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 text-center">
                      <button className="text-sm text-[#f59e0b] hover:underline">
                        Voir toutes les notifications
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

