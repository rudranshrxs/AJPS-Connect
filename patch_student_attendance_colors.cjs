const fs = require('fs');
let code = fs.readFileSync('src/pages/attendance/StudentAttendance.tsx', 'utf8');

const targetHistory = /<span className=\{\`px-4 py-1\.5 rounded-lg text-\[10px\] font-black uppercase tracking-wider border \\\$\{\s*record\.status === 'Present' \? 'bg-emerald-50 text-emerald-700 border-emerald-100' :\s*record\.status === 'Absent' \? 'bg-red-50 text-red-700 border-red-100' :\s*'bg-amber-50 text-amber-700 border-amber-100'\s*\}\`\}>/g;

const replacementHistory = `<span className={
                    record.status === 'Present' ? 'text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md font-semibold' :
                    record.status === 'Absent' ? 'text-red-500 bg-red-500/10 px-2 py-1 rounded-md font-semibold' :
                    'text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-md font-semibold'
                  }>`;

code = code.replace(targetHistory, replacementHistory);

const targetSearch = /<div className="p-5 bg-gray-50 border-b border-gray-100">\s*<h3 className="font-black text-gray-800">Recent Attendance History<\/h3>\s*<\/div>/g;

const replacementSearch = `<div className="p-5 bg-gray-50 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="font-black text-gray-800">Recent Attendance History</h3>
            <div className="relative w-full sm:w-auto">
              <input 
                type="date"
                value={attendanceSearchDate}
                onChange={(e) => setAttendanceSearchDate(e.target.value)}
                className="w-full sm:w-auto bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-[#A05C2B]/30 outline-none text-gray-700 shadow-sm"
              />
            </div>
          </div>`;

code = code.replace(targetSearch, replacementSearch);

const targetFilter = /attendanceHistory\.sort/g;
const replacementFilter = `attendanceHistory.filter((h: any) => !attendanceSearchDate || h.date.startsWith(attendanceSearchDate)).sort`;

code = code.replace(targetFilter, replacementFilter);

fs.writeFileSync('src/pages/attendance/StudentAttendance.tsx', code);
