const fs = require('fs');
let code = fs.readFileSync('src/pages/attendance/TeacherAttendance.tsx', 'utf8');

const target = `  const toggleDate = (date: string) => {
    setExpandedDates(prev => ({ ...prev, [date]: !prev[date] }));
  };`;

code = code.replace(target, '');

fs.writeFileSync('src/pages/attendance/TeacherAttendance.tsx', code);
