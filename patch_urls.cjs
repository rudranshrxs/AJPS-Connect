const fs = require('fs');
const paths = [
  'src/utils/rollNumberEngine.ts',
  'src/pages/profile/Profile.tsx',
  'src/pages/fees/TeacherFees.tsx',
  'src/pages/exams/TeacherExam.tsx',
  'src/pages/exams/ExamWizard.tsx',
  'src/pages/fees/StudentFees.tsx',
  'src/pages/exams/AdminExam.tsx',
  'src/pages/fees/AdminFees.tsx',
  'src/pages/dashboard/TeacherDashboard.tsx',
  'src/pages/dashboard/StudentDashboard.tsx',
  'src/pages/attendance/AdminAttendance.tsx',
  'src/pages/attendance/StudentAttendance.tsx',
  'src/pages/attendance/TeacherAttendance.tsx',
  'src/hooks/useNotificationCron.ts',
  'src/components/academic/MarksEntry.tsx'
];

paths.forEach(p => {
  const fullPath = 'e:\\\\Time Pass Ofline\\\\A.J.P.S. Cnnect\\\\' + p;
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    content = content.replace(/actionPath:\s*(['"`])\/(student|teacher|admin)\//g, 'actionPath: $1/');
    fs.writeFileSync(fullPath, content);
  }
});
console.log('Fixed actionPaths!');
