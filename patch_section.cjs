const fs = require('fs');

let file = fs.readFileSync('src/pages/classes/AdminClassManager.tsx', 'utf8');
file = file.replace(
  /export interface Section \{\n  id: string;\n  name: string;\n\}/g,
  `export interface Section {\n  id: string;\n  name: string;\n  classTeacherId?: string;\n  classTeacherName?: string;\n}`
);
fs.writeFileSync('src/pages/classes/AdminClassManager.tsx', file);

