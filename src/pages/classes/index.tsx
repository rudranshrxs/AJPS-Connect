import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { AdminClassManager } from './AdminClassManager';

export function Classes() {
  const { currentUser } = useAuth();
  
  if (!currentUser) return null;

  switch (currentUser.role) {
    case 'Admin':
      return <AdminClassManager />;
    // We can add Teacher/Student views here later if needed
    default:
      return <div className="p-8 text-center text-gray-500">Access Denied</div>;
  }
}
