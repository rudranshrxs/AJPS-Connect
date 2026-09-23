import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Role, User } from '../types';
import { initializeDummyDatabase } from '../utils/seedData';

interface AuthContextType {
  currentUser: User | null;
  loginAsUser: (userId: string) => void;
  switchRole: (role: Role) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        // Initialize DB (async — fetches real student JSON if not seeded)
        await initializeDummyDatabase();
      } catch (e) {
        console.error('DB init error', e);
      }

      const storedUsers = localStorage.getItem('ajps_users');
      if (storedUsers) {
        const parsedUsers: User[] = JSON.parse(storedUsers);
        setUsers(parsedUsers);

        const lastUserId = localStorage.getItem('ajps_current_user_id');
        if (lastUserId) {
          const found = parsedUsers.find(u => u.id === lastUserId);
          setCurrentUser(found || parsedUsers.find(u => u.role === 'Admin') || null);
        } else {
          setCurrentUser(parsedUsers.find(u => u.role === 'Admin') || null);
        }
      }
      setIsLoading(false);
    };

    init();
  }, []);

  const loginAsUser = (userId: string) => {
    const found = users.find(u => u.id === userId);
    if (found) {
      setCurrentUser(found);
      localStorage.setItem('ajps_current_user_id', userId);
      window.dispatchEvent(new Event('auth_changed'));
    }
  };

  const switchRole = (role: Role) => {
    const found = users.find(u => u.role === role);
    if (found) loginAsUser(found.id);
  };

  return (
    <AuthContext.Provider value={{ currentUser, loginAsUser, switchRole, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
