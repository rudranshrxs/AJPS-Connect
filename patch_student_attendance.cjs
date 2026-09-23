const fs = require('fs');
let code = fs.readFileSync('src/pages/attendance/StudentAttendance.tsx', 'utf8');

// Insert attendanceSearchDate state
code = code.replace(/const \[activeTab, setActiveTab\] = useState/, `const [attendanceSearchDate, setAttendanceSearchDate] = useState('');\n  const [activeTab, setActiveTab] = useState`);

const targetHistory = `{activeTab === 'history' && (
        <GlassCard className="p-0 overflow-hidden bg-white/60 border-white">
          <div className="p-5 bg-gray-50 border-b border-gray-100">
            <h3 className="font-black text-gray-800">Recent Attendance History</h3>
          </div>
          <div className="divide-y divide-gray-50 p-2">
            {attendanceHistory.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500 font-bold">No attendance marked yet.</p>
              </div>
            ) : (
              attendanceHistory.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((record: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center p-4 hover:bg-white/50 transition-colors rounded-xl">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-bold text-gray-800">{new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                  </div>
                  <span className={\`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border \${
                    record.status === 'Present' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                    record.status === 'Absent' ? 'bg-red-50 text-red-700 border-red-100' :
                    'bg-amber-50 text-amber-700 border-amber-100'
                  }\`}>
                    {record.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </GlassCard>
      )}`;

const replacementHistory = `{activeTab === 'history' && (
        <GlassCard className="p-0 overflow-hidden bg-white/60 border-white">
          <div className="p-5 bg-gray-50 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="font-black text-gray-800">Attendance History</h3>
            <div className="relative w-full sm:w-auto">
              <input 
                type="date"
                value={attendanceSearchDate}
                onChange={(e) => setAttendanceSearchDate(e.target.value)}
                className="w-full sm:w-auto bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-[#A05C2B]/30 outline-none text-gray-700 shadow-sm"
              />
            </div>
          </div>
          <div className="divide-y divide-gray-50 p-2">
            {attendanceHistory.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500 font-bold">No attendance marked yet.</p>
              </div>
            ) : (
              attendanceHistory
                .filter((h: any) => !attendanceSearchDate || h.date.startsWith(attendanceSearchDate))
                .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((record: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center p-4 hover:bg-white/50 transition-colors rounded-xl">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-bold text-gray-800">{new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                  </div>
                  <span className={
                    record.status === 'Present' ? 'text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md font-semibold' :
                    record.status === 'Absent' ? 'text-red-500 bg-red-500/10 px-2 py-1 rounded-md font-semibold' :
                    'text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-md font-semibold'
                  }>
                    {record.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </GlassCard>
      )}`;

code = code.replace(targetHistory, replacementHistory);

fs.writeFileSync('src/pages/attendance/StudentAttendance.tsx', code);
