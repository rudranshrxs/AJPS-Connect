const fs = require('fs');
let code = fs.readFileSync('src/pages/dashboard/StudentDashboard.tsx', 'utf8');

// 1. Add states for fromDate, toDate, myTimetable
const stateReplacement = `
  const [attendancePercent, setAttendancePercent] = useState('0%');
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [myTimetable, setMyTimetable] = useState<any>(null);

  useEffect(() => {
    if (currentUser?.attendanceHistory && currentUser.attendanceHistory.length > 0) {
      const history = currentUser.attendanceHistory;
      const total = history.length;
      const present = history.filter((h: any) => h.status === 'Present').length;
      const percent = Math.round((present / total) * 100);
      setAttendancePercent(\`\${percent}%\`);
    } else {
      setAttendancePercent('N/A');
    }
    
    // Fetch timetable
    const timetables = JSON.parse(localStorage.getItem('ajps_timetables') || '[]');
    const mt = timetables.find((t: any) => t.classId === currentUser?.classId && t.sectionId === currentUser?.sectionId);
    setMyTimetable(mt);
  }, [currentUser]);

  const handleApplyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromDate || !toDate || !leaveReason) return;

    const allLeaves = JSON.parse(localStorage.getItem('ajps_leaves') || '[]');
    const newLeave = {
      id: Math.random().toString(36).substring(2, 9),
      studentId: currentUser?.id,
      studentName: currentUser?.name,
      classId: currentUser?.classId,
      sectionId: currentUser?.sectionId,
      fromDate: fromDate,
      toDate: toDate,
      reason: leaveReason,
      status: 'Pending'
    };
    
    allLeaves.push(newLeave);
    localStorage.setItem('ajps_leaves', JSON.stringify(allLeaves));
    
    const timetables = JSON.parse(localStorage.getItem('ajps_timetables') || '[]');
    const classTeacherId = timetables.find((t: any) => t.classId === currentUser?.classId && t.sectionId === currentUser?.sectionId)?.schedule?.monday?.p1;

    if (classTeacherId) {
      NotificationService.sendNotification({
        recipientIds: [classTeacherId],
        title: 'New Leave Request',
        message: \`\${currentUser?.name} has applied for leave from \${fromDate} to \${toDate}.\`,
        type: 'warning'
      });
      window.dispatchEvent(new Event('new-notification'));
    }

    triggerSuccess('Leave Application Submitted');
    setIsLeaveModalOpen(false);
    setFromDate('');
    setToDate('');
    setLeaveReason('');
  };
`;
code = code.replace(/const \[attendancePercent, setAttendancePercent\] = useState\('0%'\);[\s\S]*?setLeaveReason\(''\);\n  \};/, stateReplacement.trim());


// 2. Update the modal rendering
const formReplacement = `
            <form onSubmit={handleApplyLeave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">From Date</label>
                  <input 
                    type="date" 
                    required
                    min={getSystemDate().toISOString().split('T')[0]}
                    value={fromDate}
                    onChange={e => setFromDate(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-[#A05C2B]/30 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">To Date</label>
                  <input 
                    type="date" 
                    required
                    min={fromDate || getSystemDate().toISOString().split('T')[0]}
                    value={toDate}
                    onChange={e => setToDate(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-[#A05C2B]/30 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Reason</label>
                <textarea 
                  required
                  rows={3}
                  value={leaveReason}
                  onChange={e => setLeaveReason(e.target.value)}
                  placeholder="Please state your reason..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-[#A05C2B]/30 outline-none resize-none"
                ></textarea>
              </div>
              <button 
                type="submit"
                className="w-full bg-[#A05C2B] text-white py-3.5 rounded-xl font-bold shadow-md hover:bg-[#8B4E24] transition-colors"
              >
                Submit Application
              </button>
            </form>
`;
code = code.replace(/<form onSubmit=\{handleApplyLeave\} className="space-y-4">[\s\S]*?<\/form>/, formReplacement.trim());

// 3. Add Timetable Section before Subject Overview
const getDayKey = () => {
    const day = getSystemDate().getDay();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[day];
};

const timetableReplacement = `
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 pb-16 md:pb-0">
        <GlassCard className="p-5 bg-white/40 border-white/50 col-span-1 lg:col-span-2">
          <h4 className="text-[14px] font-bold mb-4 text-gray-800 flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-[#A05C2B]" />
            Today's Timetable
          </h4>
          
          {!myTimetable ? (
            <div className="p-6 text-center text-gray-500 font-bold bg-white/30 rounded-xl border border-white">
              No timetable assigned for your class yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
              {['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'].map((period, idx) => {
                const day = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][getSystemDate().getDay()];
                const teacherId = myTimetable?.schedule?.[day]?.[period];
                const allUsers = JSON.parse(localStorage.getItem('ajps_users') || '[]');
                const teacher = allUsers.find((u: any) => u.id === teacherId);
                
                if (!teacher) return null;
                
                return (
                  <div key={period} className="bg-white/60 border border-white p-3 rounded-xl shadow-sm text-center">
                    <span className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Period {idx + 1}</span>
                    <span className="block text-[13px] font-bold text-[#1F2937] truncate">{teacher.subjects?.[0] || 'Subject'}</span>
                    <span className="block text-[10px] font-semibold text-[#A05C2B] truncate mt-0.5">{teacher.name}</span>
                  </div>
                );
              })}
              {(!myTimetable?.schedule?.[['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][getSystemDate().getDay()]] || 
                 Object.values(myTimetable.schedule[['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][getSystemDate().getDay()]]).every(v => !v)) && (
                <div className="col-span-full p-6 text-center text-gray-500 font-bold bg-white/30 rounded-xl border border-white">
                  No classes scheduled for today.
                </div>
              )}
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-5 bg-white/40 border-white/50">
`;

code = code.replace(/<section className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 pb-16 md:pb-0">\s*<GlassCard className="p-5 bg-white\/40 border-white\/50">/, timetableReplacement.trim());

fs.writeFileSync('src/pages/dashboard/StudentDashboard.tsx', code);
