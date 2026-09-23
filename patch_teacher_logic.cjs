const fs = require('fs');
let code = fs.readFileSync('src/pages/attendance/TeacherAttendance.tsx', 'utf8');

const target = `  return (
    <div className="p-4`;

const replacement = `  const groupedHistory: Record<string, any[]> = {};
  if (classDetails && classDetails.students) {
    classDetails.students.forEach(student => {
      student.attendanceHistory?.forEach(record => {
        if (!groupedHistory[record.date]) groupedHistory[record.date] = [];
        groupedHistory[record.date].push({ name: student.name, rollNumber: student.rollNumber, status: record.status });
      });
    });
  }

  const displayDates = searchDate 
    ? Object.keys(groupedHistory).filter(d => d === searchDate) 
    : Object.keys(groupedHistory).sort((a,b) => new Date(b).getTime() - new Date(a).getTime());

  return (
    <div className="p-4`;

code = code.replace(target, replacement);
fs.writeFileSync('src/pages/attendance/TeacherAttendance.tsx', code);
