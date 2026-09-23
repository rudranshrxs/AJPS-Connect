import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { useAuth } from '../../context/AuthContext';
import { Printer } from 'lucide-react';
import { Timetable, DayOfWeek } from '../../types';

const DAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export function TeacherTimetable() {
  const { currentUser } = useAuth();
  const [schedule, setSchedule] = useState<Record<DayOfWeek, Record<string, string>>>({} as any);
  const [totalPeriods, setTotalPeriods] = useState(6);
  
  const PERIODS = Array.from({ length: totalPeriods }, (_, i) => `p${i + 1}`);

  useEffect(() => {
    if (!currentUser) return;
    loadTimetable();
  }, [currentUser]);

  const loadTimetable = () => {
    const timetables: Timetable[] = JSON.parse(localStorage.getItem('ajps_timetables') || '[]');
    const settings = JSON.parse(localStorage.getItem('ajps_global_settings') || '{}');
    const tPeriods = settings.totalPeriods || 6;
    setTotalPeriods(tPeriods);
    const dynamicPeriods = Array.from({ length: tPeriods }, (_, i) => `p${i + 1}`);
    
    const parsedSchedule: Record<DayOfWeek, Record<string, string>> = {
      monday: {}, tuesday: {}, wednesday: {}, thursday: {}, friday: {}, saturday: {}
    };
    
    const classSet = new Set<string>();

    DAYS.forEach(day => {
      dynamicPeriods.forEach(p => {
        let assignedClass = 'Free';
        for (const tt of timetables) {
          classSet.add(`Class ${tt.classId}-${tt.sectionId}`);
          if (tt.schedule[day]?.[p as keyof typeof tt.schedule[typeof day]] === currentUser?.id) {
            assignedClass = `Class ${tt.classId}-${tt.sectionId}`;
          }
        }
        parsedSchedule[day][p] = assignedClass;
      });
    });

    setSchedule(parsedSchedule);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center print:hidden">
        <h2 className="text-2xl font-bold text-gray-800">My Timetable</h2>
        <div className="flex items-center gap-3">
          <button 
            onClick={handlePrint}
            className="bg-white/50 hover:bg-white/80 text-gray-800 px-4 py-2 rounded-xl text-sm font-bold shadow-sm flex items-center gap-2 border border-white/60 transition-colors"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </div>

      <GlassCard className="p-0 overflow-hidden print:shadow-none print:border-none print:bg-white print:backdrop-blur-none">
        <div className="p-4 bg-[#A05C2B]/5 border-b border-[#A05C2B]/10 hidden print:block mb-4">
          <h1 className="text-xl font-bold text-gray-900 text-center">Amar Jyoti Public School</h1>
          <p className="text-center text-gray-600 font-medium">Timetable - {currentUser?.name}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px] print:text-black">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 border-r border-gray-100">Day</th>
                {PERIODS.map(p => (
                  <th key={p} className="px-4 py-3 text-center text-sm font-semibold text-gray-600 border-r border-gray-100 last:border-0">
                    Period {p.replace('p', '')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.map(day => (
                <tr key={day} className="border-b border-white/20 last:border-0 hover:bg-white/20 print:border-gray-200 print:hover:bg-transparent">
                  <td className="p-4 font-bold text-gray-700 capitalize print:text-black">{day}</td>
                  {PERIODS.map(p => (
                    <td key={p} className="p-4 text-center print:border-gray-200">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        schedule[day]?.[p] === 'Free' 
                          ? 'bg-gray-100 text-gray-500 print:bg-transparent print:border print:border-gray-300' 
                          : 'bg-[#FDF7EE] text-[#A05C2B] print:bg-transparent print:border print:border-black'
                      }`}>
                        {schedule[day]?.[p] || 'Free'}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
