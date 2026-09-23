const fs = require('fs');
let code = fs.readFileSync('src/pages/timetable/StudentTimetable.tsx', 'utf8');

code = code.replace(/className=\{\\\`p-0 overflow-hidden border \\\$\{(.*?)\}\\\`\}/, 'className={`p-0 overflow-hidden border ${$1}`}');
code = code.replace(/className=\{\\\`px-6 py-3 border-b flex justify-between items-center \\\$\{(.*?)\}\\\`\}/, 'className={`px-6 py-3 border-b flex justify-between items-center ${$1}`}');

fs.writeFileSync('src/pages/timetable/StudentTimetable.tsx', code);
