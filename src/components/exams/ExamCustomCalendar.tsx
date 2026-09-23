import React from 'react';

export function ExamCustomCalendar({ monthString, onSelect, holidayDates = [] }: { monthString: string, onSelect: (date: string) => void, holidayDates?: string[] }) {
  const [monthName, yearStr] = monthString.split(' ');
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  let startMonthIndex = monthNames.indexOf(monthName);
  let startYear = yearStr ? parseInt(yearStr) : new Date().getFullYear();
  
  // Fallback to current month and year if invalid string provided
  if (startMonthIndex === -1 || isNaN(startYear)) {
    const today = new Date();
    startMonthIndex = today.getMonth();
    startYear = today.getFullYear();
  }
  
  const generateDays = (year: number, month: number) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    const today = new Date();
    today.setHours(0,0,0,0);
    
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const isSunday = d.getDay() === 0;
      const isPast = d < today;
      const dateStr = d.toLocaleDateString('en-CA'); // gets YYYY-MM-DD
      const isHoliday = holidayDates.includes(dateStr);
      days.push({ day: i, dateStr, isSunday, isPast, isHoliday, isSelectable: !isSunday && !isPast && !isHoliday });
    }
    return days;
  };

  const month1Days = generateDays(startYear, startMonthIndex);
  let month2Year = startYear;
  let month2Index = startMonthIndex + 1;
  if (month2Index > 11) {
    month2Index = 0;
    month2Year++;
  }
  const month2Days = generateDays(month2Year, month2Index);

  const renderMonth = (name: string, days: any[]) => (
    <div className="flex-1 min-w-[260px]">
      <h4 className="text-sm font-bold text-gray-800 text-center mb-4">{name}</h4>
      <div className="grid grid-cols-7 gap-2">
        {['S','M','T','W','T','F','S'].map((d, i) => <div key={`${d}-${i}`} className="text-center text-xs font-black text-gray-400">{d}</div>)}
        {Array.from({ length: new Date(days[0].dateStr).getDay() }).map((_, i) => <div key={`pad-${i}`} />)}
        {days.map(d => (
          <button
            key={d.day}
            disabled={!d.isSelectable}
            onClick={() => onSelect(d.dateStr)}
            title={d.isHoliday ? 'Holiday Declared' : ''}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all mx-auto relative
              ${d.isHoliday ? 'bg-red-50 text-red-600 border border-red-200 cursor-not-allowed' :
                d.isSunday ? 'text-red-300 bg-red-50/50 cursor-not-allowed' : 
                d.isPast ? 'text-gray-300 cursor-not-allowed opacity-50' : 
                'text-gray-700 bg-white border border-gray-200 hover:bg-[#A05C2B] hover:text-white hover:border-[#A05C2B] hover:shadow-md'}`}
          >
            {d.day}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="w-full overflow-x-auto custom-scrollbar">
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mb-6 flex flex-wrap gap-8 justify-between min-w-[600px]">
        {renderMonth(`${monthNames[startMonthIndex]} ${startYear}`, month1Days)}
        {renderMonth(`${monthNames[month2Index]} ${month2Year}`, month2Days)}
      </div>
    </div>
  );
}
