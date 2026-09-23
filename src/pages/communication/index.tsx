import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { TeacherChat } from './TeacherChat';
import { ParentChat } from './ParentChat';



export function Messages() {
  const { currentUser } = useAuth();
  
  if (!currentUser) return null;

  switch (currentUser.role) {
    case 'Admin':
    case 'Teacher':
      return <TeacherChat />;
    case 'Student':
      return <ParentChat />;
    default:
      return <div className="p-8 text-center text-gray-500">Access Denied</div>;
  }
}
