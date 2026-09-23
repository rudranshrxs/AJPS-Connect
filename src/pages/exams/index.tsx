import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { AdminExam } from './AdminExam';
import { TeacherExam } from './TeacherExam';
import { StudentExam } from './StudentExam';

export function Exams() {
  const { currentUser } = useAuth();
  
  if (currentUser?.role === 'Admin') return <AdminExam />;
  if (currentUser?.role === 'Teacher') return <TeacherExam />;
  return <StudentExam />;
}
