/**
 * NotificationsPage - Gestion des notifications
 * 
 * DEV NOTES:
 * - Endpoint: GET /notifications
 * - Types: BOOKING_CONFIRMED, TRIP_REMINDER, PRICE_DROP, OPERATOR_UPDATE, PROMO, TRIP_COMPLETED
 * - Mark as read: PUT /notifications/{id}/read
 * - Event: notification_opened, notification_dismissed
 */

import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Bell, Check, X, Clock, CreditCard, Bus, Gift, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import type { Notification } from '../data/models';
import { notificationService } from '../services/api/notification.service';

interface NotificationsPageProps {
  onBack: () => void;
}

export function NotificationsPage({ onBack }: NotificationsPageProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const loadNotifications = useCallback(async () => {
    const data = await notificationService.getNotifications();
    setNotifications(data);
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Sync unreadCount to localStorage
  useEffect(() => {
    localStorage.setItem('notificationsUnreadCount', String(unreadCount));
  }, [unreadCount]);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'TRIP_REMINDER':
        return <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'BOOKING_CONFIRMED':
        return <CreditCard className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case 'OPERATOR_UPDATE':
        return <Bus className="w-5 h-5 text-red-600 dark:text-red-400" />;
      case 'PROMO':
      case 'PRICE_DROP':
        return <Gift className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'TRIP_COMPLETED':
      case 'TRIP_COMPLETED_RATING':
        return <X className="w-5 h-5 text-orange-600 dark:text-orange-400" />;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'TRIP_REMINDER':
        return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700';
      case 'BOOKING_CONFIRMED':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700';
      case 'OPERATOR_UPDATE':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700';
      case 'PROMO':
      case 'PRICE_DROP':
        return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700';
      case 'TRIP_COMPLETED':
      case 'TRIP_COMPLETED_RATING':
        return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700';
    }
  };

  const formatTimestamp = (dateStr: string) => {
    const date = new Date(dateStr);
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

  const handleMarkAsRead = async (id: string) => {
    await notificationService.markAsRead(id);
    setNotifications(prev => prev.map(n => 
      n.notificationId === id ? { ...n, isRead: true } : n
    ));
  };

  const handleMarkAllAsRead = async () => {
    await notificationService.markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleDelete = async (id: string) => {
    await notificationService.deleteNotification(id);
    setNotifications(prev => prev.filter(n => n.notificationId !== id));
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.isRead)
    : notifications;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0 overflow-x-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 via-amber-500 to-green-600 px-4 sm:px-6 py-6 sticky top-0 z-10 shadow-lg pt-safe-area-6">
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
      <div className="px-4 sm:px-6 py-6">
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
                  key={notification.notificationId}
                  className={`bg-white dark:bg-gray-800 rounded-2xl p-4 transition-all ${
                    !notification.isRead ? 'border-2 border-amber-200 dark:border-amber-800 shadow-sm' : 'border border-gray-200 dark:border-gray-700'
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
                          {!notification.isRead && (
                            <span className="w-2 h-2 bg-amber-600 dark:bg-amber-500 rounded-full"></span>
                          )}
                        </h3>
                        <span className="text-[11px] text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {formatTimestamp(notification.createdAt)}
                        </span>
                      </div>
                      
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-3">
                        {notification.message}
                      </p>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {!notification.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notification.notificationId)}
                            className="text-[11px] sm:text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            Marquer comme lu
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notification.notificationId)}
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
