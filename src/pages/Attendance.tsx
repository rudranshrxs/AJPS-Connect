import React from 'react';
import { useAuth } from '../context/AuthContext';
import { GlassCard } from '../components/ui/GlassCard';
import { AdminAttendance } from './attendance/AdminAttendance';
import { TeacherAttendance } from './attendance/TeacherAttendance';
import { StudentAttendance } from './attendance/StudentAttendance';

export function Attendance() {
  const { currentUser } = useAuth();

  const renderContent = () => {
    switch (currentUser?.role) {
      case 'Admin':
        return <AdminAttendance />;
      case 'Teacher':
        return <TeacherAttendance />;
      case 'Student':
        return <StudentAttendance />;
      case 'Driver':
        return (
          <GlassCard className="p-8 text-center text-gray-600">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Transport Attendance</h3>
            <p>Driver specific attendance features will be available here.</p>
          </GlassCard>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <GlassCard className="p-6 bg-white/30 border-white/40">
        <h2 className="text-xl md:text-2xl font-bold text-[#1F2937]">Smart Attendance Module</h2>
        <p className="text-sm text-gray-600 mt-1">Manage and track attendance records contextually.</p>
      </GlassCard>
      
      {renderContent()}
    </div>
  );
}
