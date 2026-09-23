const fs = require('fs');
let code = fs.readFileSync('src/pages/attendance/TeacherAttendance.tsx', 'utf8');

const startToken = "const notifyAbsentees = (fullAttendance: Record<string, string>) => {";
const endToken = "triggerSuccess('Attendance finalized and locked');\n  };";

const startIndex = code.indexOf(startToken);
const endIndex = code.indexOf(endToken) + endToken.length;

if (startIndex === -1 || endIndex < startIndex) {
    console.error("Could not find replacement block in TeacherAttendance.tsx");
    process.exit(1);
}

const replacement = `const saveAttendance = (lockStatus: boolean) => {
    if (!classDetails) return;
    if (lockStatus) setIsLocked(true);
    
    const currentDate = getSystemDate().toISOString().split('T')[0];
    const absentIds = Object.keys(attendance).filter(id => attendance[id] === 'Absent');
    
    // Exact mapping logic required by the prompt
    const users = JSON.parse(localStorage.getItem('ajps_users') || '[]');
    const updatedUsers = users.map((user: any) => {
       if (user.classId === classDetails.classId && user.sectionId === classDetails.sectionId) {
           const status = absentIds.includes(user.id) ? 'Absent' : (checkIfOnLeave(user.id, currentDate) ? 'On Leave' : 'Present');
           const history = user.attendanceHistory || [];
           const existingIndex = history.findIndex((h: any) => h.date === currentDate);
           if (existingIndex > -1) history[existingIndex].status = status;
           else history.push({ date: currentDate, status });
           return { ...user, attendanceHistory: history };
       }
       return user;
    });
    localStorage.setItem('ajps_users', JSON.stringify(updatedUsers));
    window.dispatchEvent(new Event('ajps_users_updated'));

    // Notifications ONLY for 'Absent'
    const absentees = classDetails.students.filter(s => absentIds.includes(s.id));
    if (absentees.length > 0) {
      NotificationService.sendNotification({
        recipientIds: absentees.map(a => a.id),
        title: 'Attendance Alert',
        message: 'You were marked absent today.',
        type: 'warning',
        actionPath: '/student/dashboard',
        actionLabel: 'View'
      });
    }

    // Save to ajps_attendance for history viewing
    const allRecords = JSON.parse(localStorage.getItem('ajps_attendance') || '{}');
    if (!allRecords[classDetails.id]) {
      allRecords[classDetails.id] = {};
    }
    
    const fullAttendance: Record<string, string> = {};
    classDetails.students.forEach(student => {
       fullAttendance[student.id] = absentIds.includes(student.id) ? 'Absent' : (checkIfOnLeave(student.id, currentDate) ? 'On Leave' : 'Present');
    });

    allRecords[classDetails.id][currentDate] = {
      records: fullAttendance,
      isLocked: lockStatus
    };
    
    localStorage.setItem('ajps_attendance', JSON.stringify(allRecords));
    setPastRecords(allRecords[classDetails.id]);
    
    triggerSuccess(lockStatus ? 'Attendance finalized and locked' : 'Attendance saved successfully');
  };

  const handleSave = () => saveAttendance(isLocked);
  const handleLock = () => saveAttendance(true);`;

code = code.substring(0, startIndex) + replacement + code.substring(endIndex);

// Now for the history UI changes
const historyStartToken = "{activeTab === 'history' && (";
const historyEndToken = ")}";

// We have multiple activeTabs. Let's do a replace using regex.
const historyRegex = /\{activeTab === 'history' && \([\s\S]*?\}\s*\)\}\s*<\/div>\s*\)\}/;

const historyReplacement = `{activeTab === 'history' && (
        <div className="space-y-6">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="date" 
              value={historyDateFilter}
              onChange={e => setHistoryDateFilter(e.target.value)}
              className="w-full bg-white/60 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-[#A05C2B]/30 outline-none text-gray-700 shadow-sm"
            />
          </div>

          <div className="space-y-4">
            {Object.keys(pastRecords)
              .filter(date => !historyDateFilter || date === historyDateFilter)
              .sort().reverse().map(date => {
                const isExpanded = expandedDates[date];
                const record = pastRecords[date];

                return (
                  <GlassCard key={date} className="p-0 overflow-hidden bg-white/60 border-white shadow-sm transition-all duration-300">
                    <div 
                      onClick={() => toggleDate(date)}
                      className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center cursor-pointer hover:bg-gray-100/80 transition-colors"
                    >
                      <h4 className="font-bold text-gray-800 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#A05C2B]" /> 
                        {new Date(date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}
                      </h4>
                      <div className="flex items-center gap-3">
                        <span className={\`px-2 py-1 text-[10px] font-bold uppercase rounded \${record.isLocked ? 'bg-gray-200 text-gray-600' : 'bg-amber-100 text-amber-700'}\`}>
                          {record.isLocked ? 'Locked' : 'Draft'}
                        </span>
                        {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="p-4 divide-y divide-gray-50">
                        {classDetails?.students.map(student => (
                          <div key={student.id} className="flex justify-between items-center py-2.5 last:border-0">
                            <div>
                              <span className="text-sm font-bold text-gray-700 block">{student.name}</span>
                              <span className="text-[10px] font-semibold text-gray-400">Roll No: {student.rollNumber}</span>
                            </div>
                            <span className={\`px-3 py-1 text-xs font-black uppercase tracking-wider rounded-lg \${
                              record.records[student.id] === 'Present' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                              record.records[student.id] === 'Absent' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                            }\`}>
                              {record.records[student.id] || 'Not Marked'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </GlassCard>
                );
              })}
            {Object.keys(pastRecords).filter(date => !historyDateFilter || date === historyDateFilter).length === 0 && (
               <GlassCard className="p-8 text-center bg-white/40 border-white/50">
                 <p className="text-gray-500 font-bold">No past attendance records found matching your filters.</p>
               </GlassCard>
            )}
          </div>
        </div>
      )}`;

code = code.replace(historyRegex, historyReplacement);

fs.writeFileSync('src/pages/attendance/TeacherAttendance.tsx', code);
