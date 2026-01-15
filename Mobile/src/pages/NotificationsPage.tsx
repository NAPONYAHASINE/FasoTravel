/**
 * NotificationsPage - Gestion des notifications
 * 
 * DEV NOTES:
 * - Endpoint: GET /notifications
 * - Types: booking_reminder, payment_confirmed, trip_update, promotion
 * - Mark as read: PUT /notifications/{id}/read
 * - Event: notification_opened, notification_dismissed
 */

import { useState, useEffect } from 'react';
import { ArrowLeft, Bell, Check, X, Clock, CreditCard, Bus, Gift, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

interface NotificationsPageProps {
  onBack: () => void;
}

interface Notification {
  id: string;
  type: 'booking_reminder' | 'payment_confirmed' | 'trip_update' | 'promotion' | 'cancellation';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

// Mock notifications
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif_1',
    type: 'booking_reminder',
    title: 'Départ dans 2 heures',
    message: 'Votre bus Ouagadougou → Bobo-Dioulasso part à 14h00. N\'oubliez pas votre billet !',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
    read: false
  },
  {
    id: 'notif_2',
    type: 'payment_confirmed',
    title: 'Paiement confirmé',
    message: 'Votre paiement de 8,500 FCFA a été confirmé. Billet #TBF-1234567',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2h ago
    read: false
  },
  {
    id: 'notif_3',
    type: 'trip_update',
    title: 'Mise à jour du trajet',
    message: 'Le bus est en route ! Suivez votre trajet en temps réel.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5h ago
    read: true
  },
  {
    id: 'notif_4',
    type: 'promotion',
    title: '🎉 Promotion spéciale',
    message: 'Profitez de -20% sur tous les trajets ce week-end. Code: WEEKEND20',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    read: true
  },
  {
    id: 'notif_5',
    type: 'cancellation',
    title: 'Remboursement traité',
    message: 'Votre remboursement de 5,000 FCFA a été traité et sera crédité sous 48h.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
    read: true
  }
];

export function NotificationsPage({ onBack }: NotificationsPageProps) {
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const unreadCount = notifications.filter(n => !n.read).length;

  // Sync unreadCount to localStorage
  useEffect(() => {
    localStorage.setItem('notificationsUnreadCount', String(unreadCount));
  }, [unreadCount]);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'booking_reminder':
        return <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'payment_confirmed':
        return <CreditCard className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case 'trip_update':
        return <Bus className="w-5 h-5 text-red-600 dark:text-red-400" />;
      case 'promotion':
        return <Gift className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'cancellation':
        return <X className="w-5 h-5 text-orange-600 dark:text-orange-400" />;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'booking_reminder':
        return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700';
      case 'payment_confirmed':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700';
      case 'trip_update':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700';
      case 'promotion':
        return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700';
      case 'cancellation':
        return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700';
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `Il y a ${diffMins} min`;
    } else if (diffHours < 24) {
      return `Il y a ${diffHours}h`;
    } else if (diffDays === 1) {
      return 'Hier';
    } else if (diffDays < 7) {
      return `Il y a ${diffDays} jours`;
    } else {
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    }
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const handleDelete = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 via-amber-500 to-green-600 px-6 py-6 sticky top-0 z-10 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={onBack}
            className="text-white mb-4 flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Retour</span>
          </button>
          
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <Bell className="w-6 h-6" />
              <div>
                <h1 className="text-2xl">Notifications</h1>
                {unreadCount > 0 && (
                  <p className="text-sm opacity-90">{unreadCount} non lu{unreadCount > 1 ? 's' : ''}</p>
                )}
              </div>
            </div>

            {unreadCount > 0 && (
              <Button
                onClick={handleMarkAllAsRead}
                variant="outline"
                size="sm"
                className="bg-white/20 border-white/40 text-white hover:bg-white/30"
              >
                <Check className="w-4 h-4 mr-2" />
                Tout lire
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Filter Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 sm:px-4 py-2 rounded-lg transition-all text-sm ${
                filter === 'all'
                  ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Toutes ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 sm:px-4 py-2 rounded-lg transition-all text-sm ${
                filter === 'unread'
                  ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Non lues ({unreadCount})
            </button>
          </div>

          {/* Notifications List */}
          {filteredNotifications.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center">
              <Bell className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-base sm:text-lg text-gray-900 dark:text-white mb-2">Aucune notification</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {filter === 'unread' 
                  ? 'Vous êtes à jour ! Toutes vos notifications ont été lues.'
                  : 'Vous n\'avez pas encore de notifications.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`bg-white dark:bg-gray-800 rounded-2xl p-4 transition-all ${
                    !notification.read ? 'border-2 border-amber-200 dark:border-amber-800 shadow-sm' : 'border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex gap-4">
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                      getNotificationColor(notification.type)
                    }`}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="text-sm text-gray-900 dark:text-white flex items-center gap-2">
                          {notification.title}
                          {!notification.read && (
                            <span className="w-2 h-2 bg-amber-600 dark:bg-amber-500 rounded-full"></span>
                          )}
                        </h3>
                        <span className="text-[11px] text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {formatTimestamp(notification.timestamp)}
                        </span>
                      </div>
                      
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-3">
                        {notification.message}
                      </p>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {!notification.read && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="text-[11px] sm:text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            Marquer comme lu
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notification.id)}
                          className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1 ml-auto"
                        >
                          <Trash2 className="w-3 h-3" />
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
