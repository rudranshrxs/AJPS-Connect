import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { StudentDirectory } from '../directory/StudentDirectory';
import { TeacherStudentDirectory } from './TeacherStudentDirectory';

export function Students() {
  const { currentUser } = useAuth();

  if (currentUser?.role === 'Admin') return <StudentDirectory />;
  if (currentUser?.role === 'Teacher') return <StudentDirectory />;
  
  // Student role - perhaps they just see their own profile or denied access
  return (
    <div className="p-8 text-center">
      <h2 className="text-xl font-bold text-gray-900">Access Denied</h2>
      <p className="text-gray-600 mt-2">Students do not have access to the global directory.</p>
    </div>
  );
}
