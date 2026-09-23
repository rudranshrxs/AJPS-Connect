import { User } from '../types';

export interface NotificationPayload {
  recipientIds?: string[];
  role?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'badge' | 'SYSTEM' | 'LEAVE_REQUEST' | 'FEE_ALERT';
  metadata?: any;
  actionPath?: string;
  actionLabel?: string;
}

export interface StoredNotification extends NotificationPayload {
  id: string;
  timestamp: string;
  readBy?: string[];
  createdAt?: string;
  recipientRole?: string;
}

export const NOTIF_KEY = 'amar_jyoti_notifications';

export const NotificationService = {
  sendNotification: (payload: NotificationPayload) => {
    const timestamp = new Date().toISOString();
    const newNotification: StoredNotification = {
      ...payload,
      id: `notif-${Date.now()}-${payload.recipientIds?.[0] || "all"}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: timestamp,
      createdAt: timestamp,
      readBy: [],
      recipientRole: payload.role
    };

    const existing = JSON.parse(localStorage.getItem(NOTIF_KEY) || '[]');
    existing.unshift(newNotification);
    if (existing.length > 100) existing.length = 100;
    
    localStorage.setItem(NOTIF_KEY, JSON.stringify(existing));

    window.dispatchEvent(new Event('new-notification'));
    window.dispatchEvent(new Event('notifications_updated'));
  },

  getNotificationsForUser: (user: User): StoredNotification[] => {
    const all = JSON.parse(localStorage.getItem(NOTIF_KEY) || '[]') as StoredNotification[];
    return all.filter(n => {
      if (n.recipientIds && n.recipientIds.includes(user.id)) return true;
      if (n.role && n.role === user.role) return true;
      if (!n.recipientIds && !n.role) return true; // Global blast
      return false;
    });
  }
};
