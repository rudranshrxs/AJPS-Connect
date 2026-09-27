import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon } from 'lucide-react';
import { getSystemDate } from '../../utils/dateUtils';
import { motion, AnimatePresence } from 'framer-motion';

interface AttendanceRecord {
  date: string; // YYYY-MM-DD
  status: 'Present' | 'Absent' | 'Leave' | 'On Leave' | 'Holiday' | string;
  reason?: string;
}

interface Props {
  attendanceRecords: AttendanceRecord[];
  onDateSelect?: (date: string) => void;
  selectedDate?: string;
}

export function AttendanceCalendar({ attendanceRecords, onDateSelect, selectedDate }: Props) {
  const [currentDate, setCurrentDate] = useState(() => getSystemDate());
  const [selectedDateRecord, setSelectedDateRecord] = useState<AttendanceRecord | null>(null);
  const [notices, setNotices] = useState<any[]>([]);

  if (!attendanceRecords || !Array.isArray(attendanceRecords)) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#A05C2B] mb-4"></div>
        <p>Loading calendar data...</p>
      </div>
    );
  }

  useEffect(() => {
    const n = JSON.parse(localStorage.getItem('ajps_notices') || '[]');
    setNotices(Array.isArray(n) ? n : []);
  }, []);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const getRecordForDate = (dayNumber: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
    
    // Check if it's a Sunday
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNumber);
    if (d.getDay() === 0) {
      return { date: dateStr, status: 'Holiday', reason: 'Sunday' };
    }
    
    // Check if it's a Holiday
    const holiday = notices.find((n: any) => n.templateType === 'holiday' && n.targetDate === dateStr);
    if (holiday) {
      return { date: dateStr, status: 'Holiday', reason: holiday.title };
    }

    const record = attendanceRecords.find(r => r.date === dateStr);
    return record || { date: dateStr, status: 'No Data' };
  };

  const getColorClass = (status: string) => {
    if (status === 'Present') return 'bg-green-500 text-white shadow-sm';
    if (status === 'Absent') return 'bg-red-500 text-white shadow-sm';
    if (status === 'Leave' || status === 'On Leave') return 'bg-yellow-500 text-white shadow-sm';
    if (status === 'Holiday') return 'bg-orange-500 text-white shadow-sm';
    return 'text-gray-700 hover:bg-gray-100'; // Default
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative w-[100vw] -ml-4 sm:w-full sm:ml-0 md:max-w-xl md:mx-auto">
      <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-100 bg-gray-50/50">
        <h2 className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
          <CalendarIcon className="w-6 h-6 text-indigo-600" />
          {currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <button onClick={nextMonth} className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="p-1 md:p-6">
        <div className="grid grid-cols-7 gap-2 mb-4">
          {days.map(day => (
            <div key={day} className="text-center text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-tighter md:tracking-wider">
              <span className="hidden md:inline">{day}</span>
              <span className="md:hidden">{day.charAt(0)}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 w-full gap-1 md:gap-2">
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="w-8 h-8 md:w-10 md:h-10 mx-auto"></div>
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const record = getRecordForDate(day);
            const todayStr = getSystemDate().toISOString().split('T')[0];
            const isFuture = new Date(record.date) > new Date(todayStr);
            const isHolidayLocked = !!onDateSelect && record.status === 'Holiday';
            const isDisabled = isFuture || isHolidayLocked;
            const isFilled = record.status !== 'No Data';

            return (
              <div key={day} className="flex justify-center">
                <button
                  onClick={() => {
                    if (isDisabled) return;
                    if (onDateSelect) {
                      onDateSelect(record.date);
                    } else {
                      setSelectedDateRecord(record);
                    }
                  }}
                  disabled={isDisabled}
                  className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-[11px] md:text-sm mx-auto transition-all duration-200 
                    ${isFuture ? 'opacity-30 cursor-not-allowed bg-gray-50 text-gray-400' : 
                      selectedDate === record.date ? 'ring-4 ring-[#A05C2B]/50 scale-110 ' + getColorClass(record.status) : 
                      getColorClass(record.status)
                    } 
                    ${(isFilled || onDateSelect) && !isDisabled ? 'hover:scale-110 active:scale-95 cursor-pointer' : ''}
                    ${isHolidayLocked ? 'cursor-not-allowed opacity-60' : ''}
                  `}
                >
                  {day}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {selectedDateRecord && selectedDateRecord.status !== 'No Data' && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-4 left-4 right-4 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 z-10"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  {new Date(selectedDateRecord.date).toLocaleDateString('default', { weekday: 'long' })}
                </p>
                <p className="text-lg font-black text-gray-900">
                  {new Date(selectedDateRecord.date).toLocaleDateString('default', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <button 
                onClick={() => setSelectedDateRecord(null)}
                className="p-1 hover:bg-gray-100 rounded-full text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className={`inline-block px-3 py-1 rounded-md text-sm font-bold uppercase tracking-wide border mt-2 ${
              selectedDateRecord.status === 'Present' ? 'bg-green-50 text-green-700 border-green-200' :
              selectedDateRecord.status === 'Absent' ? 'bg-red-50 text-red-700 border-red-200' :
              selectedDateRecord.status === 'Holiday' ? 'bg-orange-50 text-orange-700 border-orange-200' :
              'bg-yellow-50 text-yellow-700 border-yellow-200'
            }`}>
              {selectedDateRecord.status}
            </div>

            {selectedDateRecord.reason && (
              <p className="text-sm text-gray-600 mt-3 bg-gray-50 p-2 rounded-lg border border-gray-100">
                <span className="font-semibold text-gray-700">Reason:</span> {selectedDateRecord.reason}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-2 md:p-6 border-t border-gray-100 bg-gray-50/30">
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-gray-600 mb-4">
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500"></span> Present</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500"></span> Absent</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-yellow-500"></span> Leave</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-orange-500"></span> Holiday</div>
        </div>

        {(() => {
          let present = 0, absent = 0, leave = 0, workingDays = 0;
          for (let i = 1; i <= daysInMonth; i++) {
            const r = getRecordForDate(i);
            if (r.status !== 'Holiday' && r.status !== 'No Data') {
              workingDays++;
              if (r.status === 'Present') present++;
              if (r.status === 'Absent') absent++;
              if (r.status === 'Leave' || r.status === 'On Leave') leave++;
            }
          }
          return (
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
              <span className="font-semibold text-gray-800">Total Working Days: {workingDays}</span>
              <span className="text-green-700 font-medium">Present: {present}</span>
              <span className="text-red-700 font-medium">Absent: {absent}</span>
              <span className="text-yellow-700 font-medium">Leave: {leave}</span>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
