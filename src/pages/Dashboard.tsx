import React from 'react';
import { useAuth } from '../context/AuthContext';
import { GlassCard } from '../components/ui/GlassCard';
import { BlurRevealText } from '../components/ui/BlurRevealText';
import { AdminDashboard } from './dashboard/AdminDashboard';
import { TeacherDashboard } from './dashboard/TeacherDashboard';
import { StudentDashboard } from './dashboard/StudentDashboard';
import { Calendar, Bell, User } from 'lucide-react';

export function Dashboard() {
  const { currentUser } = useAuth();
  
  const today = new Date();
  const dateOptions: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' };
  const formattedDate = today.toLocaleDateString('en-GB', dateOptions);

  const renderDashboard = () => {
    switch (currentUser?.role) {
      case 'Admin':
        return <AdminDashboard />;
      case 'Teacher':
        return <TeacherDashboard />;
      case 'Student':
        return <StudentDashboard />;
      case 'Driver':
        return (
          <GlassCard className="p-8 text-center text-gray-600">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Driver Portal</h3>
            <p>Welcome to the transport management portal. Route information will appear here soon.</p>
          </GlassCard>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 p-2 md:p-3 overflow-y-auto no-scrollbar flex flex-col w-full">
      {renderDashboard()}
    </div>
  );
}
