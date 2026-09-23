import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { AdminTransport } from './AdminTransport';
import { DriverTransport } from './DriverTransport';
import { StudentTransport } from './StudentTransport';

export function Transport() {
  const { currentUser } = useAuth();
  
  if (!currentUser) return null;

  switch (currentUser.role) {
    case 'Admin':
      return <AdminTransport />;
    case 'Driver':
      return <DriverTransport />;
    case 'Teacher':
    case 'Student':
      return <StudentTransport />;
    default:
      return <div className="p-8 text-center text-gray-500">Access Denied</div>;
  }
}
