import React, { useState } from 'react';
import { GlassModal } from './GlassModal';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDDMMMYYYY } from '../../hooks/useAttendance';

interface Props {
  value: string;
  onChange: (val: string) => void;
  label: string;
  required?: boolean;
}

export function GlassDatePicker({ value, onChange, label, required }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Basic calendar logic (simplified for UI)
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const generateDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();
    
    const days = [];
    for (let i = 0; i < firstDayIndex; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  };

  const handleSelect = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    onChange(`${yyyy}-${mm}-${dd}`);
    setIsOpen(false);
  };

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));

  return (
    <div className="w-full">
      <div 
        onClick={() => setIsOpen(true)}
        className="w-full min-h-[44px] flex items-center bg-white/50 backdrop-blur-md border border-white/60 text-gray-800 text-sm font-medium rounded-xl px-4 py-3 cursor-pointer shadow-sm hover:bg-white/60 transition-colors"
      >
        <Calendar className="w-4 h-4 text-gray-500 mr-2" />
        {value ? formatDDMMMYYYY(value) : <span className="text-gray-400">Select Date...</span>}
      </div>
      
      <GlassModal isOpen={isOpen} onClose={() => setIsOpen(false)} title={label}>
        <div className="w-full max-w-sm mx-auto">
          <div className="flex justify-between items-center mb-4">
            <button type="button" onClick={prevMonth} className="p-2 hover:bg-white/50 rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center">
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <h4 className="font-bold text-gray-800">
              {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h4>
            <button type="button" onClick={nextMonth} className="p-2 hover:bg-white/50 rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center">
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
          </div>
          
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-gray-500 mb-2">
            <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {generateDays().map((d, i) => (
              <div key={i} className="aspect-square flex items-center justify-center">
                {d && (
                  <button
                    type="button"
                    onClick={() => handleSelect(d)}
                    className={`w-full h-full min-h-[40px] rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                      value === `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
                        ? 'bg-[#A05C2B] text-white shadow-md'
                        : 'text-gray-700 hover:bg-white/60'
                    }`}
                  >
                    {d.getDate()}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </GlassModal>
    </div>
  );
}
