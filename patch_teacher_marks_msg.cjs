const fs = require('fs');

let file = fs.readFileSync('src/pages/exams/TeacherExam.tsx', 'utf8');

const oldMsg = /Marks entry will unlock after the exam on \{openDate \? new Date\(openDate\)\.toLocaleDateString\('en-GB', \{ day: '2-digit', month: 'short', year: 'numeric' \}\) : 'the scheduled date'\}\./;

file = file.replace(oldMsg, 'Marks entry is currently locked by the Admin.');

fs.writeFileSync('src/pages/exams/TeacherExam.tsx', file);
