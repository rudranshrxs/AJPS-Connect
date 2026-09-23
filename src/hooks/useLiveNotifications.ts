import { useNotification } from '../context/NotificationContext';

export function useLiveNotifications() {
  const { notifications, markAsRead, markAllAsRead, getUnreadCount } = useNotification();

  return { 
    notifications, 
    unreadCount: getUnreadCount(), 
    markAsRead, 
    markAllAsRead 
  };
}
