import React, { useState, useEffect, useMemo } from 'react';
import { Notice } from '../../types';
import { NoticesUI } from './NoticesUI';
import { useAuth } from '../../context/AuthContext';

export function StudentNotices() {
  const { currentUser } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);

  const loadNotices = () => {
    try {
      const stored = localStorage.getItem('ajps_notices');
      if (stored) setNotices(JSON.parse(stored) || []);
    } catch (e) { /* */ }
  };

  useEffect(() => {
    loadNotices();
    const handleStorage = () => loadNotices();
    window.addEventListener('storage', handleStorage);
    window.addEventListener('ajps_notices_updated', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('ajps_notices_updated', handleStorage);
    };
  }, []);

  const visibleNotices = useMemo(() => {
    if (!currentUser) return [];
    
    return notices.filter(n => {
      if (n.audienceRole === 'Both') return true;
      if (n.audienceRole === 'Student') {
        if (!n.targetClasses?.length && !n.targetStudentIds?.length) return true;
        if (n.targetClasses?.length && currentUser.classId && n.targetClasses.includes(currentUser.classId)) return true;
        if (n.targetStudentIds?.length && n.targetStudentIds.includes(currentUser.id)) return true;
        return false;
      }
      return false;
    });
  }, [notices, currentUser]);

  const readNotices = useMemo(() => {
    return visibleNotices.filter(n => n.readBy?.includes(currentUser?.id || '')).map(n => n.id);
  }, [visibleNotices, currentUser]);

  const markAsRead = (id: string) => {
    if (!currentUser) return;
    setNotices(prev => {
      let changed = false;
      const updated = prev.map(n => {
        if (n.id === id) {
          const readBy = n.readBy || [];
          if (!readBy.includes(currentUser.id)) {
            changed = true;
            return { ...n, readBy: [...readBy, currentUser.id] };
          }
        }
        return n;
      });
      if (changed) {
        localStorage.setItem('ajps_notices', JSON.stringify(updated));
      }
      return updated;
    });
  };

  return (
    <NoticesUI 
      notices={visibleNotices}
      readNotices={readNotices}
      canCreate={false} 
      onMarkRead={markAsRead}
      roleType="Student"
    />
  );
}
