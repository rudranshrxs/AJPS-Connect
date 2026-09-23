const fs = require('fs');
let code = fs.readFileSync('src/pages/attendance/AdminAttendance.tsx', 'utf8');

const target = /<span className=\{\`px-3 py-1 text-xs font-black uppercase tracking-wider rounded-lg \\\$\{\s*record\.records\[student\.id\] === 'Present' \? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :\s*record\.records\[student\.id\] === 'Absent' \? 'bg-red-50 text-red-600 border border-red-100' : \s*record\.records\[student\.id\] === 'Leave' \|\| record\.records\[student\.id\] === 'On Leave' \? 'bg-blue-50 text-blue-600 border border-blue-100' :\s*'bg-amber-50 text-amber-600 border border-amber-100'\s*\}\`\}>/g;

const replacement = `<span className={
                        record.records[student.id] === 'Present' ? 'text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md font-semibold' :
                        record.records[student.id] === 'Absent' ? 'text-red-500 bg-red-500/10 px-2 py-1 rounded-md font-semibold' : 
                        record.records[student.id] === 'Leave' || record.records[student.id] === 'On Leave' ? 'text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-md font-semibold' :
                        'text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-md font-semibold'
                      }>`;

code = code.replace(target, replacement);

fs.writeFileSync('src/pages/attendance/AdminAttendance.tsx', code);
