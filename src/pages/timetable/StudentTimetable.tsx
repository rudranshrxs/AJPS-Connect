import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Clock, MapPin, User as UserIcon } from 'lucide-react';
import { getSystemDate } from '../../utils/dateUtils';
import { Timetable, DayOfWeek } from '../../types';

export function StudentTimetable() {
  const { currentUser } = useAuth();
  const [timetable, setTimetable] = useState<Timetable | null>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [globalTimetable, setGlobalTimetable] = useState<any[]>([]);

  useEffect(() => {
    const storedTimetables = JSON.parse(localStorage.getItem('ajps_timetables') || '[]');
    const myTimetable = storedTimetables.find((t: any) => t.classId === currentUser?.classId && t.sectionId === currentUser?.sectionId);
    setTimetable(myTimetable || null);

    const storedUsers = JSON.parse(localStorage.getItem('ajps_users') || '[]');
    setAllUsers(storedUsers);
    
    const storedGlobalTimetable = JSON.parse(localStorage.getItem('ajps_global_timetable') || '[]');
    setGlobalTimetable(storedGlobalTimetable);
  }, [currentUser]);

  const days: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const todayStr = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][getSystemDate().getDay()];

  if (!timetable) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 pb-24 min-h-[80vh] flex items-center justify-center">
        <GlassCard className="max-w-md w-full p-8 text-center bg-white/60 border-white backdrop-blur-xl shadow-2xl rounded-3xl">
          <div className="w-20 h-20 mx-auto bg-[#FDF7EE] border-2 border-[#A05C2B]/20 text-[#A05C2B] rounded-full flex items-center justify-center mb-6 shadow-sm">
            <Calendar className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-[#1F2937] mb-3 tracking-tight">No Timetable Found</h2>
          <p className="text-gray-600 font-semibold leading-relaxed">
            Your class timetable has not been published yet. Please check back later.
          </p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 pb-24 min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-[#1F2937] tracking-tight flex items-center gap-2">
          <Calendar className="w-6 h-6 text-[#A05C2B]" /> My Weekly Timetable
        </h1>
        <p className="text-sm font-semibold text-gray-500 mt-1">
          {currentUser?.className} {currentUser?.sectionName || currentUser?.section}
        </p>
      </div>

      {globalTimetable.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-[#1F2937] mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#A05C2B]" /> School Bell Schedule
          </h2>
          <GlassCard className="p-0 overflow-hidden border border-white shadow-sm">
            <div className="p-4 bg-white/60 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {globalTimetable.map((slot) => (
                <div key={slot.id} className={`p-3 rounded-xl border text-center ${slot.type === 'break' ? 'bg-orange-50 border-orange-100' : 'bg-white border-gray-100 shadow-sm'}`}>
                  <span className={`block text-[11px] font-black uppercase tracking-wider mb-1 ${slot.type === 'break' ? 'text-orange-600' : 'text-gray-500'}`}>
                    {slot.label}
                  </span>
                  <span className="block text-xs font-bold text-[#1F2937]">
                    {slot.startTime} - {slot.endTime}
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      <div className="space-y-6">
        {days.map(day => (
          <GlassCard key={day} className={`p-0 overflow-hidden border ${todayStr === day ? 'border-[#A05C2B]/40 ring-1 ring-[#A05C2B]/20 shadow-md' : 'border-white shadow-sm'}`}>
            <div className={`px-6 py-3 border-b flex justify-between items-center ${todayStr === day ? 'bg-[#FDF7EE] border-[#A05C2B]/20' : 'bg-gray-50/50 border-gray-100'}`}>
              <h3 className="text-sm font-black text-[#1F2937] uppercase tracking-wider">{day}</h3>
              {todayStr === day && <span className="bg-[#A05C2B] text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase">Today</span>}
            </div>
            
            <div className="p-4 bg-white/40 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
              {['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'].map((period, idx) => {
                const teacherId = timetable.schedule[day]?.[period as any];
                const teacher = allUsers.find(u => u.id === teacherId);
                
                return (
                  <div key={period} className="bg-white border border-gray-100 p-3 rounded-xl shadow-sm text-center hover:border-[#A05C2B]/30 transition-colors">
                    <span className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">P{idx + 1}</span>
                    {teacher ? (
                      <>
                        <span className="block text-[13px] font-bold text-[#1F2937] truncate">{teacher.subjects?.[0] || 'Subject'}</span>
                        <span className="block text-[10px] font-semibold text-[#A05C2B] truncate mt-0.5">{teacher.name}</span>
                      </>
                    ) : (
                      <span className="block text-[12px] font-medium text-gray-400 italic mt-2">Free</span>
                    )}
                  </div>
                );
              })}
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
