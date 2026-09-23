const fs = require('fs');

let file = fs.readFileSync('src/pages/classes/AdminClassManager.tsx', 'utf8');

file = file.replace(/const sectionStudents = users\.filter.*?;\n/g, 
  `const sectionStudents = users.filter(u => u.role === 'Student' && u.classId === classObj.id && u.sectionId === section.id);\n`);

file = file.replace(/const tt = timetables\.find\(t => t\.classId === classObj\.className && t\.id === section\.id\);\n/g, 
  `const tt = timetables.find(t => t.classId === classObj.id && t.sectionId === section.id);\n`);

file = file.replace(/onClick=\{\(\) => window\.location\.href = `\/students\?class=\$\{classObj\.className\}&section=\$\{section\.id\}`\}/g,
  `onClick={() => {\n              setSelectedSectionForStudents({ classObj, section, students: sectionStudents });\n              setIsViewStudentsModalOpen(true);\n            }}`);

fs.writeFileSync('src/pages/classes/AdminClassManager.tsx', file);
