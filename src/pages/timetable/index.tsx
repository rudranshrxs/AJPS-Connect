import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { AdminTimetable } from './AdminTimetable';
import { TeacherTimetable } from './TeacherTimetable';
import { StudentTimetable } from './StudentTimetable';

export function Timetable() {
  const { currentUser } = useAuth();

  switch (currentUser?.role) {
    case 'Admin':
      return <AdminTimetable />;
    case 'Teacher':
      return <TeacherTimetable />;
    case 'Student':
      return <StudentTimetable />;
    default:
      return <div>Please log in to view timetable.</div>;
  }
}
