const fs = require('fs');

let file1 = fs.readFileSync('src/hooks/useExams.ts', 'utf8');
file1 = file1.replace(/month: string;\n\}/, 'month: string;\n  isMarksEntryOpen?: boolean;\n}');
fs.writeFileSync('src/hooks/useExams.ts', file1);

let file2 = fs.readFileSync('src/pages/exams/AdminExam.tsx', 'utf8');
file2 = file2.replace(/datesheet: \{ subject: string; date: string \} \[\];\n\}/, 'datesheet: { subject: string; date: string }[];\n  isMarksEntryOpen?: boolean;\n}');
fs.writeFileSync('src/pages/exams/AdminExam.tsx', file2);

