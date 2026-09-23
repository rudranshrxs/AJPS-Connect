const fs = require('fs');
let code = fs.readFileSync('src/pages/dashboard/StudentDashboard.tsx', 'utf8');

code = code.replace(/<GlassCard className="p-5 bg-white\/40 border-white\/50">\s*<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">\s*<h4 className="text-\[14px\] font-bold text-gray-800 flex items-center gap-2">\s*<History className="w-4 h-4 text-\[#A05C2B\]" \/>\s*Attendance Records\s*<\/h4>[\s\S]*?<\/GlassCard>\s*<GlassCard className="p-5 bg-white\/40 border-white\/50">\s*<h4 className="text-\[14px\] font-bold mb-4 text-gray-800 flex items-center gap-2">/g, 
`<GlassCard className="p-5 bg-white/40 border-white/50">
            <h4 className="text-[14px] font-bold mb-4 text-gray-800 flex items-center gap-2">`);

code = code.replace(/const \[attendanceSearchDate, setAttendanceSearchDate\] = useState\(''\);\n/g, '');

fs.writeFileSync('src/pages/dashboard/StudentDashboard.tsx', code);
