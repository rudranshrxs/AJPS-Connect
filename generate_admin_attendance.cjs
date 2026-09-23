const fs = require('fs');

const code = `import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Users, Search, Filter, Calendar, ChevronDown, ChevronRight, GraduationCap, Lock, CheckCircle, History } from 'lucide-react';
import { getSystemDate } from '../../utils/dateUtils';
import { NotificationService } from '../../services/NotificationService';
import { useSuccess } from '../../context/SuccessContext';

export function AdminAttendance() {
  const { triggerSuccess } = useSuccess();
  const [classes, setClasses] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any>({});
  
  const [selectedClassId, setSelectedClassId] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  
  const [activeTab, setActiveTab] = useState<'mark' | 'history'>('mark');
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    const c = JSON.parse(localStorage.getItem('ajps_classes') || '[]');
    const u = JSON.parse(localStorage.getItem('ajps_users') || '[]');
    const a = JSON.parse(localStorage.getItem('ajps_attendance') || '{}');
    setClasses(c);
    setUsers(u);
    setAttendanceData(a);
    if (c.length > 0) {
      setSelectedClassId(\`\${c[0].id}-\${typeof c[0].sections?.[0] === 'string' ? c[0].sections[0] : (c[0].sections?.[0]?.id || '')}\`);
    }
  }, []);

  const classOptions: { id: string, name: string }[] = [];
  classes.forEach(c => {
    c.sections?.forEach((s: any) => { 
      const secName = typeof s === 'string' ? s : s.name;
      const secId = typeof s === 'string' ? s : (s.id || s.name);
      classOptions.push({
        id: \`\${c.id}-\${secId}\`,
        name: \`\${c.className} - Section \${secName}\`
      });
    });
  });

  useEffect(() => {
    if (!selectedClassId && classOptions.length > 0) {
      setSelectedClassId(classOptions[0].id);
    }
  }, [classOptions, selectedClassId]);

  const toggleDate = (date: string) => {
    setExpandedDates(prev => ({ ...prev, [date]: !prev[date] }));
  };

  const [classId, sectionId] = selectedClassId.split('-');
  const allStudents = users.filter(u => u.role === 'Student' && u.classId === classId && (u.sectionId === \`c\${classId}-s\${sectionId}\` || u.sectionId === sectionId || u.section === sectionId));

  useEffect(() => {
    if (!selectedClassId) return;
    const today = getSystemDate().toISOString().split('T')[0];
    const classRecords = attendanceData[selectedClassId] || {};
    const todayRecord = classRecords[today];
    
    if (todayRecord) {
      setAttendance(todayRecord.records);
      setIsLocked(todayRecord.isLocked || false);
    } else {
      const initial: Record<string, string> = {};
      allStudents.forEach((s: any) => initial[s.id] = 'Present');
      setAttendance(initial);
      setIsLocked(false);
    }
  }, [selectedClassId, attendanceData]);

  const checkIfOnLeave = (studentId: string, currentDate: string) => {
    const allLeaves = JSON.parse(localStorage.getItem('ajps_leaves') || '[]');
    return allLeaves.some((l: any) => 
      l.studentId === studentId && 
      l.status === 'Approved' && 
      currentDate >= l.fromDate && 
      currentDate <= l.toDate
    );
  };

  const handleMark = (id: string, status: string) => {
    if (isLocked) return;
    setAttendance(prev => ({ ...prev, [id]: status }));
  };

  const saveAttendance = (lockStatus: boolean) => {
    if (lockStatus) setIsLocked(true);
    
    const currentDate = getSystemDate().toISOString().split('T')[0];
    const absentIds = Object.keys(attendance).filter(id => attendance[id] === 'Absent');
    
    const u = JSON.parse(localStorage.getItem('ajps_users') || '[]');
    const updatedUsers = u.map((user: any) => { 
       if (user.classId === classId && (user.sectionId === \`c\${classId}-s\${sectionId}\` || user.sectionId === sectionId || user.section === sectionId)) {
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
    setUsers(updatedUsers);
    window.dispatchEvent(new Event('ajps_users_updated'));

    const absentees = allStudents.filter(s => absentIds.includes(s.id));
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

    const allRecords = JSON.parse(localStorage.getItem('ajps_attendance') || '{}');
    if (!allRecords[selectedClassId]) {
      allRecords[selectedClassId] = {};
    }
    
    const fullAttendance: Record<string, string> = {};
    allStudents.forEach(student => { 
       fullAttendance[student.id] = absentIds.includes(student.id) ? 'Absent' : (checkIfOnLeave(student.id, currentDate) ? 'On Leave' : 'Present');
    });

    allRecords[selectedClassId][currentDate] = {
      records: fullAttendance,
      isLocked: lockStatus
    };
    
    localStorage.setItem('ajps_attendance', JSON.stringify(allRecords));
    setAttendanceData(allRecords);
    
    triggerSuccess(lockStatus ? 'Attendance finalized and locked' : 'Attendance saved successfully');
  };

  const handleSave = () => saveAttendance(isLocked);
  const handleLock = () => saveAttendance(true);

  const classRecords = attendanceData[selectedClassId] || {};
  const dates = Object.keys(classRecords).sort().reverse();
  const filteredDates = searchDate ? dates.filter(d => d === searchDate) : dates;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 pb-24 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-[#1F2937] tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-[#A05C2B]" /> Class Attendance History
          </h1>
          <p className="text-sm font-semibold text-gray-500 mt-1">View comprehensive attendance records for all classes.</p>
        </div>
      </div>

      <GlassCard className="p-4 bg-white/40 border-white/50 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Select Class & Section</label>
            <select 
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full appearance-none bg-white/60 border border-gray-200 text-gray-800 text-sm font-medium rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#A05C2B]/30 shadow-sm"
            >
              {classOptions.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.name}</option>
              ))}
            </select>
          </div>
          {activeTab === 'history' && (
            <>
              <div className="relative">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Filter by Date</label>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="date" 
                    value={searchDate}
                    onChange={e => setSearchDate(e.target.value)}
                    className="w-full bg-white/60 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm font-medium focus:ring-2 focus:ring-[#A05C2B]/30 outline-none text-gray-700 shadow-sm"
                  />
                </div>
              </div>
              <div className="relative">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Search Student</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Name or Roll No..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-white/60 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm font-medium focus:ring-2 focus:ring-[#A05C2B]/30 outline-none placeholder:text-gray-400 shadow-sm"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </GlassCard>

      <div className="flex gap-2 bg-white/40 p-1.5 rounded-xl border border-white/60 backdrop-blur-md w-max shadow-sm mb-6">
        <button 
          onClick={() => setActiveTab('mark')}
          className={\`px-5 py-2 rounded-lg text-sm font-bold transition-all \${activeTab === 'mark' ? 'bg-white text-[#A05C2B] shadow-sm' : 'text-gray-500 hover:text-gray-700'}\`}
        >
          Mark Attendance
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={\`px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-1 \${activeTab === 'history' ? 'bg-white text-[#A05C2B] shadow-sm' : 'text-gray-500 hover:text-gray-700'}\`}
        >
          <History className="w-4 h-4" /> View History
        </button>
      </div>

      {activeTab === 'mark' && (
        <GlassCard className="p-0 overflow-hidden border border-white shadow-sm">
          <div className="p-5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 flex justify-between items-center">
            <div>
              <h3 className="font-black text-gray-800 tracking-tight">Today's Attendance</h3>
              <p className="text-xs text-gray-500 font-bold">{getSystemDate().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleSave} 
                disabled={isLocked}
                className={\`px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all border \${isLocked ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white border-[#A05C2B]/30 text-[#A05C2B] hover:bg-[#FDF7EE]'}\`}
              >
                Save
              </button>
              <button 
                onClick={handleLock}
                disabled={isLocked}
                className={\`px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 \${isLocked ? 'bg-emerald-600 text-white opacity-80 cursor-not-allowed' : 'bg-[#A05C2B] text-white hover:bg-[#8e5226]'}\`}
              >
                {isLocked ? <><Lock className="w-3.5 h-3.5" /> Locked</> : <><CheckCircle className="w-3.5 h-3.5" /> Lock & Submit</>}
              </button>
            </div>
          </div>
          
          <div className="divide-y divide-gray-50">
            {allStudents.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500 font-bold">No students found in this class section.</p>
              </div>
            ) : (
              allStudents.map(student => {
                const isOnLeave = checkIfOnLeave(student.id, getSystemDate().toISOString().split('T')[0]);
                const status = attendance[student.id] || 'Present';
                
                return (
                  <div key={student.id} className={\`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors \${isLocked ? 'opacity-70' : 'hover:bg-white/50'}\`}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#FDF7EE] border border-[#A05C2B]/20 flex items-center justify-center text-[#A05C2B] font-black shadow-sm">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800">{student.name}</h4>
                        <span className="text-[10px] text-gray-400 font-bold block mt-0.5">Roll No: {student.rollNumber || 'N/A'}</span>
                      </div>
                    </div>
                    
                    <div className="flex bg-gray-100 p-1 rounded-xl shadow-inner w-full sm:w-auto">
                      {isOnLeave ? (
                        <div className="px-6 py-2 bg-yellow-50 text-yellow-600 border border-yellow-200 rounded-lg text-xs font-bold w-full text-center">
                          On Approved Leave
                        </div>
                      ) : (
                        <>
                          <button 
                            onClick={() => handleMark(student.id, 'Present')}
                            disabled={isLocked}
                            className={\`flex-1 sm:flex-none px-6 py-2 rounded-lg text-xs font-bold transition-all \${status === 'Present' ? 'bg-white text-emerald-600 shadow-sm border border-emerald-100' : 'text-gray-500 hover:bg-gray-200/50'}\`}
                          >
                            Present
                          </button>
                          <button 
                            onClick={() => handleMark(student.id, 'Absent')}
                            disabled={isLocked}
                            className={\`flex-1 sm:flex-none px-6 py-2 rounded-lg text-xs font-bold transition-all \${status === 'Absent' ? 'bg-white text-red-600 shadow-sm border border-red-100' : 'text-gray-500 hover:bg-gray-200/50'}\`}
                          >
                            Absent
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </GlassCard>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4">
          {filteredDates.map(date => {
            const record = classRecords[date];
            
            const studentsToRender = allStudents.filter(s => {
              if (!searchQuery) return true;
              const query = searchQuery.toLowerCase();
              return s.name.toLowerCase().includes(query) || (s.rollNumber && s.rollNumber.toLowerCase().includes(query));
            });

            if (studentsToRender.length === 0 && searchQuery) return null;

            const isExpanded = expandedDates[date];

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
                    {studentsToRender.length === 0 ? (
                      <p className="text-sm text-gray-500 py-2">No students found.</p>
                    ) : studentsToRender.map(student => (
                      <div key={student.id} className="flex justify-between items-center py-2.5 last:border-0">
                        <div>
                          <span className="text-sm font-bold text-gray-700 block">{student.name}</span>
                          <span className="text-[10px] font-semibold text-gray-400">Roll No: {student.rollNumber || 'N/A'}</span>
                        </div>
                        <span className={
                          record.records[student.id] === 'Present' ? 'text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md font-semibold' :
                          record.records[student.id] === 'Absent' ? 'text-red-500 bg-red-500/10 px-2 py-1 rounded-md font-semibold' : 
                          record.records[student.id] === 'Leave' || record.records[student.id] === 'On Leave' ? 'text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-md font-semibold' :
                          'text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-md font-semibold'
                        }>
                          {record.records[student.id] || 'Not Marked'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            );
          })}

          {filteredDates.length === 0 && (
             <GlassCard className="p-8 text-center bg-white/40 border-white/50">
               <p className="text-gray-500 font-bold">No attendance records found matching your filters.</p>
             </GlassCard>
          )}
        </div>
      )}
    </div>
  );
}
`;

fs.writeFileSync('src/pages/attendance/AdminAttendance.tsx', code);
