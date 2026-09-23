import React from 'react';
import { useAuth } from '../context/AuthContext';
import { AdminNotices } from './notices/AdminNotices';
import { TeacherNotices } from './notices/TeacherNotices';
import { StudentNotices } from './notices/StudentNotices';

export function Notices() {
  const { currentUser } = useAuth();

  switch (currentUser?.role) {
    case 'Admin':
      return <AdminNotices />;
    case 'Teacher':
      return <TeacherNotices />;
    case 'Student':
      return <StudentNotices />;
    default:
      return (
        <div className="p-8 text-center text-gray-500 min-h-screen bg-[#F8F9FA] flex items-center justify-center">
          Access Denied
        </div>
      );
  }
}
