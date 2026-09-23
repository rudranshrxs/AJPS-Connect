const fs = require('fs');
let code = fs.readFileSync('src/pages/attendance/TeacherAttendance.tsx', 'utf8');

const target = /<span className=\{\`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md border \$\{\s*record\.status === 'Present' \? 'bg-green-500\/10 text-green-600 border-green-500\/20' : \s*record\.status === 'Absent' \? 'bg-red-500\/10 text-red-600 border-red-500\/20' : \s*'bg-amber-50 text-amber-600 border-amber-100'\s*\}\`\}>/g;

const replacement = `<span className={
                          record.status === 'Present' ? 'text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md font-semibold' : 
                          record.status === 'Absent' ? 'text-red-500 bg-red-500/10 px-2 py-1 rounded-md font-semibold' : 
                          'text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-md font-semibold'
                        }>`;

code = code.replace(target, replacement);

fs.writeFileSync('src/pages/attendance/TeacherAttendance.tsx', code);
