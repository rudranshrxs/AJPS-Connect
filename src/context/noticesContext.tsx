import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Notice } from '../types';

interface NoticesContextType {
  notices: Notice[];
  readNotices: string[];
  addNotice: (notice: Notice) => void;
  markAsRead: (id: string) => void;
  isRead: (id: string) => boolean;
  reload: () => void;
}

const NoticesContext = createContext<NoticesContextType | undefined>(undefined);

const NOTICES_KEY = 'ajps_notices';
const READ_KEY = 'ajps_read_notices';

export const NoticesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [readNotices, setReadNotices] = useState<string[]>([]);

  const loadNotices = useCallback(() => {
    try {
      const stored = localStorage.getItem(NOTICES_KEY);
      if (stored) setNotices(JSON.parse(stored) || []);
    } catch (e) { /* */ }
  }, []);

  const loadReadNotices = useCallback(() => {
    try {
      const stored = localStorage.getItem(READ_KEY);
      if (stored) setReadNotices(JSON.parse(stored) || []);
    } catch (e) { /* */ }
  }, []);

  useEffect(() => {
    loadNotices();
    loadReadNotices();

    const handleChange = () => { loadNotices(); loadReadNotices(); };
    window.addEventListener('storage', handleChange);
    window.addEventListener('ajps_notices_updated', handleChange);
    return () => {
      window.removeEventListener('storage', handleChange);
      window.removeEventListener('ajps_notices_updated', handleChange);
    };
  }, [loadNotices, loadReadNotices]);

  const addNotice = useCallback((notice: Notice) => {
    setNotices(prev => {
      const updated = [notice, ...prev];
      localStorage.setItem(NOTICES_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('ajps_notices_updated'));
      return updated;
    });
  }, []);

  const markAsRead = useCallback((id: string) => {
    setReadNotices(prev => {
      const updated = [...new Set([...prev, id])];
      localStorage.setItem(READ_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const isRead = useCallback((id: string) => {
    return readNotices.includes(id);
  }, [readNotices]);

  const reload = useCallback(() => {
    loadNotices();
    loadReadNotices();
  }, [loadNotices, loadReadNotices]);

  return (
    <NoticesContext.Provider value={{ notices, readNotices, addNotice, markAsRead, isRead, reload }}>
      {children}
    </NoticesContext.Provider>
  );
};

export const useNotices = () => {
  const context = useContext(NoticesContext);
  if (context === undefined) {
    throw new Error('useNotices must be used within a NoticesProvider');
  }
  return context;
};
