import { storageService } from '../storage/localStorage.service';
import { apiClient } from './apiClient';
import { isDevelopment } from '../../lib/config';
import type { Notification } from '../../data/models';
import { MOCK_NOTIFICATIONS_LIST } from '../../data/models';

// Re-export type for convenience
export type { Notification };

// Type for notification creation params
export interface CreateNotificationParams {
  type: Notification['type'];
  title: string;
  message: string;
  deep_link?: string;
  image_url?: string;
  metadata?: Notification['metadata'];
}

// ============================================
// SERVICE CLASS
// ============================================

class NotificationService {
  private readonly storageKeyPrefix = 'notifications_user_'; // Will be namespaced per user
  
  /**
   * Get storage key for current user
   * In production, get from auth context. For dev, use 'user_1'
   */
  private getStorageKey(userId: string = 'user_1'): string {
    return `${this.storageKeyPrefix}${userId}`;
  }

  /**
   * Récupère toutes les notifications
   */
  async getNotifications(): Promise<Notification[]> {
    try {
      if (isDevelopment()) {
        return this.mockGetNotifications();
      }

      const response = await apiClient.get<Notification[]>('/notifications');

      return response || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Fallback to mock data
      return this.mockGetNotifications();
    }
  }

  /**
   * Récupère une notification spécifique
   */
  async getNotification(id: string): Promise<Notification | null> {
    try {
      if (isDevelopment()) {
        return this.mockGetNotification(id);
      }

      const response = await apiClient.get<Notification>(`/notifications/${id}`);

      return response || null;
    } catch (error) {
      console.error('Error fetching notification:', error);
      return null;
    }
  }

  /**
   * Crée une nouvelle notification (admin/backend only)
   */
  async createNotification(params: CreateNotificationParams): Promise<Notification | null> {
    try {
      if (isDevelopment()) {
        return this.mockCreateNotification(params);
      }

      const response = await apiClient.post<Notification>('/notifications', params);

      return response || null;
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  }

  /**
   * Marque une notification comme lue
   */
  async markAsRead(id: string): Promise<boolean> {
    try {
      if (isDevelopment()) {
        return this.mockMarkAsRead(id);
      }

      await apiClient.put(`/notifications/${id}/read`, {});

      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  /**
   * Marque toutes les notifications comme lues
   */
  async markAllAsRead(): Promise<boolean> {
    try {
      if (isDevelopment()) {
        return this.mockMarkAllAsRead();
      }

      await apiClient.put('/notifications/read-all', {});

      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  /**
   * Supprime une notification
   */
  async deleteNotification(id: string): Promise<boolean> {
    try {
      if (isDevelopment()) {
        return this.mockDeleteNotification(id);
      }

      await apiClient.delete(`/notifications/${id}`);

      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }

  /**
   * Récupère le nombre de notifications non lues
   */
  async getUnreadCount(): Promise<number> {
    try {
      if (isDevelopment()) {
        const notifications = this.mockGetNotifications();
        return notifications.filter(n => !n.is_read).length;
      }

      const response = await apiClient.get<{ count: number }>('/notifications/unread/count');

      return response?.count || 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }

  // ============================================
  // MOCK DATA - Uses mock data list above
  // ============================================

  private mockGetNotifications(): Notification[] {
    const userId = 'user_1'; // TODO: Get from auth context in production
    const storageKey = this.getStorageKey(userId);
    const cached = storageService.get<Notification[]>(storageKey);
    if (cached && Array.isArray(cached)) {
      return cached;
    }
    // Return a copy to avoid mutations
    return JSON.parse(JSON.stringify(MOCK_NOTIFICATIONS_LIST));
  }

  private mockGetNotification(id: string): Notification | null {
    const notifications = this.mockGetNotifications();
    return notifications.find(n => n.notification_id === id) || null;
  }

  private mockCreateNotification(params: CreateNotificationParams): Notification {
    const userId = 'user_1'; // TODO: Get from auth context in production
    const notification: Notification = {
      notification_id: `notif_${Date.now()}`,
      user_id: userId,
      ...params,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    const notifications = this.mockGetNotifications();
    notifications.unshift(notification);
    const storageKey = this.getStorageKey(userId);
    storageService.set(storageKey, notifications);

    return notification;
  }

  private mockMarkAsRead(id: string): boolean {
    const userId = 'user_1'; // TODO: Get from auth context in production
    const notifications = this.mockGetNotifications();
    const notification = notifications.find(n => n.notification_id === id);
    
    if (notification) {
      notification.is_read = true;
      const storageKey = this.getStorageKey(userId);
      storageService.set(storageKey, notifications);
      return true;
    }
    
    return false;
  }

  private mockMarkAllAsRead(): boolean {
    const userId = 'user_1'; // TODO: Get from auth context in production
    const notifications = this.mockGetNotifications();
    notifications.forEach(n => n.is_read = true);
    const storageKey = this.getStorageKey(userId);
    storageService.set(storageKey, notifications);
    return true;
  }

  private mockDeleteNotification(id: string): boolean {
    const userId = 'user_1'; // TODO: Get from auth context in production
    const notifications = this.mockGetNotifications();
    const filtered = notifications.filter(n => n.notification_id !== id);
    
    if (filtered.length < notifications.length) {
      const storageKey = this.getStorageKey(userId);
      storageService.set(storageKey, filtered);
      return true;
    }
    
    return false;
  }
}

// ============================================
// EXPORT
// ============================================

export const notificationService = new NotificationService();
