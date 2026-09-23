const fs = require('fs');
let code = fs.readFileSync('src/pages/attendance/TeacherAttendance.tsx', 'utf8');

const selfTabUI = `
      {activeTab === 'self' && (
        <div className="space-y-6">
          <GlassCard className="p-8 text-center bg-white/60 border-white shadow-sm flex flex-col items-center justify-center">
            <h3 className="text-lg font-black text-gray-800 mb-4">Daily Check-in</h3>
            <button 
              onClick={handleMarkSelfAttendance}
              disabled={hasMarkedSelfToday}
              className={\`px-8 py-4 rounded-2xl font-bold shadow-md transition-all text-lg \${hasMarkedSelfToday ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white/80 border border-white hover:bg-white text-[#A05C2B] hover:shadow-lg'}\`}
            >
              {hasMarkedSelfToday ? 'Already Marked Present Today' : 'Mark My Attendance for Today'}
            </button>
          </GlassCard>

          <GlassCard className="p-0 overflow-hidden bg-white/60 border-white shadow-sm">
            <div className="p-4 bg-gray-50 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="font-black text-gray-800">My Attendance History</h3>
              <div className="relative w-full sm:w-auto">
                <input 
                  type="date"
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  className="w-full sm:w-auto bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-[#A05C2B]/30 outline-none text-gray-700 shadow-sm"
                />
              </div>
            </div>
            <div className="divide-y divide-gray-50 p-2">
              {selfAttendanceHistory.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-500 font-bold">No attendance records found.</p>
                </div>
              ) : (
                selfAttendanceHistory
                  .filter((h: any) => !historySearchQuery || h.date.startsWith(historySearchQuery))
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
        </div>
      )}
`;

// Remove it from the early return
code = code.replace(selfTabUI, '');

// And put it at the correct end of the component return
code = code.replace(/    <\/div>\s*\);\s*\}/, selfTabUI + "    </div>\n  );\n}");

fs.writeFileSync('src/pages/attendance/TeacherAttendance.tsx', code);
