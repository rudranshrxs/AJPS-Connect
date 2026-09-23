import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppNotification, NotificationType } from '../types/notification';
import { useAuth } from './AuthContext';
import { Role } from '../types';
import { NOTIF_KEY } from '../services/NotificationService';

interface NotificationContextType {
  notifications: AppNotification[];
  addNotification: (notification: Omit<AppNotification, 'id' | 'readBy' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  getUnreadCount: () => number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const getStoredNotifications = (): AppNotification[] => {
  try {
    const data = localStorage.getItem(NOTIF_KEY);
    if (data) {
      const parsed = JSON.parse(data); return parsed || [];
    }
  } catch (err) {
    console.error('Error reading notifications from local storage:', err);
  }
  return [];
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [allNotifications, setAllNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    // Initial load
    setAllNotifications(getStoredNotifications());

    // Listen to changes (from other tabs or same tab custom event)
    const handleStorageChange = (e: StorageEvent | CustomEvent | Event) => {
      if (e.type === 'storage' && (e as StorageEvent).key === NOTIF_KEY) {
        setAllNotifications(getStoredNotifications());
      } else if (e.type === 'notifications_updated' || e.type === 'new-notification') {
        setAllNotifications(getStoredNotifications());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('notifications_updated', handleStorageChange as EventListener);
    window.addEventListener('new-notification', handleStorageChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('notifications_updated', handleStorageChange as EventListener);
      window.removeEventListener('new-notification', handleStorageChange as EventListener);
    };
  }, []);

  const saveNotifications = (newNotifications: AppNotification[]) => {
    localStorage.setItem(NOTIF_KEY, JSON.stringify(newNotifications));
    setAllNotifications(newNotifications);
    window.dispatchEvent(new Event('notifications_updated'));
  };

  const addNotification = (notification: Omit<AppNotification, 'id' | 'readBy' | 'createdAt'>) => {
    const newNotification: AppNotification = {
      ...notification,
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      readBy: [],
      createdAt: new Date().toISOString(),
    };
    
    const stored = getStoredNotifications();
    saveNotifications([newNotification, ...stored]);
  };

  const markAsRead = (id: string) => {
    if (!currentUser) return;
    const stored = getStoredNotifications();
    const updated = stored.map(n => {
      if (n.id === id) {
        const readList = Array.isArray(n.readBy) ? n.readBy : [];
        if (!readList.includes(currentUser.id)) {
          return { ...n, readBy: [...readList, currentUser.id] };
        }
      }
      return n;
    });
    saveNotifications(updated);
  };

  const markAllAsRead = () => {
    if (!currentUser) return;
    const stored = getStoredNotifications();
    const updated = stored.map(n => {
      const isRecipient = n.recipientRole === currentUser.role || n.recipientIds?.includes(currentUser.id) || (!n.recipientIds && !n.recipientRole);
      if (isRecipient) {
        const readList = Array.isArray(n.readBy) ? n.readBy : [];
        if (!readList.includes(currentUser.id)) {
          return { ...n, readBy: [...readList, currentUser.id] };
        }
      }
      return n;
    });
    saveNotifications(updated);
  };

  // Filter notifications for the current user's role
  const notifications = currentUser
    ? allNotifications.filter(n => {
        const sn = n as any;
        if (sn.recipientIds && sn.recipientIds.includes(currentUser.id)) return true;
        if (sn.role && sn.role === currentUser.role) return true;
        if (n.recipientRole && n.recipientRole === currentUser.role) return true;
        if (!sn.recipientIds && !sn.role && !n.recipientRole) return true;
        return false;
      })
    : [];

  const getUnreadCount = () => {
    if (!currentUser) return 0;
    return notifications.filter((n: any) => {
      return n.readBy && Array.isArray(n.readBy) 
        ? !n.readBy.includes(currentUser.id) 
        : !n.isRead;
    }).length;
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, markAsRead, markAllAsRead, getUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
