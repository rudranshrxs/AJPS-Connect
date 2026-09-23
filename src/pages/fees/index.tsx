import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AdminFees } from './AdminFees';
import { StudentFees } from './StudentFees';
import { TeacherFees } from './TeacherFees';

export function Fees() {
  const { currentUser } = useAuth();
  
  if (!currentUser) return null;

  switch (currentUser.role) {
    case 'Admin':
      return <AdminFees />;
    case 'Student':
      return <StudentFees />;
    case 'Teacher':
      return <TeacherFees />;
    default:
      return <Navigate to="/" replace />;
  }
}
