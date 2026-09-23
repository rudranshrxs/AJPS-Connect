import React, { useEffect, useState } from 'react';
import { X, Bell, CheckCircle, XCircle, AlertCircle, Info, FileText, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLiveNotifications } from '../../hooks/useLiveNotifications';
import { AppNotification } from '../../types/notification';
import { useAuth } from '../../context/AuthContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationDrawer({ isOpen, onClose }: Props) {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useLiveNotifications();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isOpen) setMounted(true);
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleAction = (notification: AppNotification, action: 'approve' | 'reject') => {
    // In a real app, this would call an API. For now, we'll just mark as read.
    markAsRead(notification.id);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'LEAVE_REQUEST': return <FileText className="w-5 h-5 text-amber-600" />;
      case 'FEE_ALERT': return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'SYSTEM': return <Info className="w-5 h-5 text-blue-600" />;
      default: return <Bell className="w-5 h-5 text-[#A05C2B]" />;
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const { currentUser } = useAuth();

  const isUnread = (notification: any) => {
    return notification.readBy && Array.isArray(notification.readBy)
      ? !notification.readBy.includes(currentUser?.id || '')
      : !notification.isRead;
  };

  if (!mounted && !isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-[100] transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Drawer Panel */}
      <div
        className={`fixed z-[101] flex flex-col bg-white/70 backdrop-blur-2xl border-white/60 shadow-[0_-10px_40px_-15px_rgba(160,92,43,0.15)] md:shadow-[-10px_0_40px_-15px_rgba(160,92,43,0.15)] transition-transform duration-300 ease-out
          inset-x-0 bottom-0 rounded-t-3xl border-t
          md:inset-auto md:right-0 md:top-0 md:bottom-0 md:w-[400px] md:max-w-md md:rounded-none md:border-l md:border-t-0
          ${isOpen ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-y-0 md:translate-x-full'}
        `}
        style={{ top: window.innerWidth < 768 ? '4rem' : '0' }} // Leaves room at the top on mobile so it looks like a bottom sheet
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/40 bg-white/30 shrink-0 mt-2 md:mt-0">
          <div className="flex items-center gap-3">
            <div className="bg-[#A05C2B]/10 p-2 rounded-xl">
              <Bell className="w-5 h-5 text-[#A05C2B]" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 font-sans tracking-tight">Notifications</h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                {unreadCount} New
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-800 hover:bg-white/50 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar */}
        {unreadCount > 0 && (
          <div className="px-6 py-3 border-b border-white/40 bg-white/20 shrink-0 flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-600">You have {unreadCount} unread messages</span>
            <button
              onClick={markAllAsRead}
              className="text-xs font-bold text-[#A05C2B] hover:text-[#8e5226] transition-colors"
            >
              Mark all as read
            </button>
          </div>
        )}

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-6 opacity-60">
              <Bell className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-sm font-semibold text-gray-600">You're all caught up!</p>
              <p className="text-xs text-gray-500 mt-1">No new notifications right now.</p>
            </div>
          ) : (
            notifications.map((notification) => {
              const unread = isUnread(notification);
              return (
                <div
                  key={notification.id}
                  className={`relative p-4 rounded-2xl border transition-all cursor-pointer ${unread
                      ? 'bg-white/80 border-white shadow-sm hover:bg-white'
                      : 'bg-white/40 border-white/50 opacity-75 hover:opacity-100 hover:bg-white/60'
                    }`}
                  onClick={() => unread && markAsRead(notification.id)}
                >
                  {unread && (
                    <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                  )}

                  <div className="flex gap-3">
                    <div className="shrink-0 mt-1">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-[13px] font-bold text-gray-900 pr-4">{notification.title}</h4>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">{notification.message}</p>
                      <span className="text-[10px] font-bold text-gray-400 mt-2 block uppercase tracking-wider">
                        {formatTime(notification.createdAt)}
                      </span>

                      {/* Smart Action Path */}
                      {notification.actionPath && notification.actionLabel && unread && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                            onClose();
                            navigate(notification.actionPath!);
                          }}
                          className="mt-3 w-full flex items-center justify-center gap-2 bg-[#A05C2B]/10 text-[#A05C2B] border border-[#A05C2B]/20 px-3 py-2.5 rounded-xl text-xs font-bold hover:bg-[#A05C2B]/20 transition-colors shadow-sm"
                        >
                          {notification.actionLabel} <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Actionable UI for LEAVE_REQUEST */}
                      {notification.type === 'LEAVE_REQUEST' && unread && (
                        <div className="mt-4 flex gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleAction(notification, 'approve'); }}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-green-50/80 text-green-700 border border-green-200/80 px-3 py-2.5 rounded-xl text-xs font-bold hover:bg-green-100 hover:border-green-300 transition-colors shadow-sm"
                          >
                            <CheckCircle className="w-4 h-4" /> Approve
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleAction(notification, 'reject'); }}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-red-50/80 text-red-700 border border-red-200/80 px-3 py-2.5 rounded-xl text-xs font-bold hover:bg-red-100 hover:border-red-300 transition-colors shadow-sm"
                          >
                            <XCircle className="w-4 h-4" /> Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </>
  );
}
