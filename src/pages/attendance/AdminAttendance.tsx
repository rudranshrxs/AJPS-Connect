import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Users, Search, Filter, Calendar, ChevronDown, ChevronRight, GraduationCap, Lock, CheckCircle, History, Clock, Info, X } from 'lucide-react';
import { getSystemDate } from '../../utils/dateUtils';
import { NotificationService } from '../../services/NotificationService';
import { useSuccess } from '../../context/SuccessContext';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

import { AttendanceCalendar } from '../../components/attendance/AttendanceCalendar';

export function AdminAttendance() {
  const { currentUser } = useAuth();
  const { triggerSuccess, triggerError } = useSuccess();
  const [classes, setClasses] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any>({});
  
  const [selectedClassId, setSelectedClassId] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  
  const [targetType, setTargetType] = useState<'Students' | 'Teachers'>('Students');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  
  const [activeTab, setActiveTab] = useState<'mark' | 'history' | 'leaves'>('mark');
  const [activeDate, setActiveDate] = useState<string>(() => getSystemDate().toISOString().split('T')[0]);
  const [selectedStudentForCalendar, setSelectedStudentForCalendar] = useState<any | null>(null);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [isLocked, setIsLocked] = useState(false);
  const [notices, setNotices] = useState<any[]>([]);
  const [adminLeaves, setAdminLeaves] = useState<any[]>([]);
  
  const [historyViewMode, setHistoryViewMode] = useState<'class' | 'individual'>('class');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const c = JSON.parse(localStorage.getItem('ajps_classes') || '[]');
    const u = JSON.parse(localStorage.getItem('ajps_users') || '[]');
    const a = JSON.parse(localStorage.getItem('ajps_attendance') || '{}');
    const n = JSON.parse(localStorage.getItem('ajps_notices') || '[]');
    setClasses(Array.isArray(c) ? c : []);
    setUsers(Array.isArray(u) ? u : []);
    setAttendanceData(a && typeof a === 'object' ? a : {});
    setNotices(Array.isArray(n) ? n : []);
    if (Array.isArray(c) && c.length > 0) {
      setSelectedClassId(`${c[0].id}-${typeof c[0].sections?.[0] === 'string' ? c[0].sections[0] : (c[0].sections?.[0]?.id || '')}`);
    }

    const allLeaves = JSON.parse(localStorage.getItem('ajps_leaves') || '[]');
    setAdminLeaves(Array.isArray(allLeaves) ? allLeaves.reverse() : []);

    if (window.location.hash === '#leaves') {
      setActiveTab('leaves');
      setTimeout(() => {
        const el = document.getElementById('leave-requests-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  }, []);

  const isSunday = new Date(activeDate).getDay() === 0;
  const holiday = notices.find((n: any) => n.templateType === 'holiday' && n.targetDate === activeDate);
  const isHoliday = !!holiday;

  const classAttendanceRecords = React.useMemo(() => {
    const classRecords = attendanceData[selectedClassId] || {};
    return Object.keys(classRecords).map(date => {
      const rec = classRecords[date];
      return { date, status: rec.isLocked ? 'Present' : 'Leave' };
    });
  }, [attendanceData, selectedClassId]);

  let classOptions: { id: string, name: string }[] = [];
  classes.forEach(c => {
    c.sections?.forEach((s: any) => { 
      const secName = typeof s === 'string' ? s : s.name;
      const secId = typeof s === 'string' ? s : (s.id || s.name);
      classOptions.push({
        id: `${c.id}-${secId}`,
        name: `${c.className} - Section ${secName}`
      });
    });
  });

  if (currentUser?.role === 'Teacher') {
    classOptions = classOptions.filter(opt => {
      const [clsId, secId] = opt.id.split('-');
      return (
        (currentUser.assignedClass === opt.id) ||
        (currentUser.isClassTeacher && currentUser.classTeacherClass === clsId && currentUser.classTeacherSection === secId) ||
        (currentUser.proxyClassId === opt.id)
      );
    });
  }

  useEffect(() => {
    if (!selectedClassId && classOptions.length > 0) {
      setSelectedClassId(classOptions[0].id);
    }
  }, [classOptions, selectedClassId]);

  useEffect(() => {
    const teachers = users.filter(u => u.role === 'Teacher');
    if (!selectedTeacherId && teachers.length > 0) {
      setSelectedTeacherId(teachers[0].id);
    }
  }, [users, selectedTeacherId]);

  const toggleDate = (date: string) => {
    setExpandedDate(prev => (prev === date ? null : date));
  };

  const classIdParts = selectedClassId.split('-');
  const classId = classIdParts[0];
  const sectionId = classIdParts.slice(1).join('-');
  const allStudents = users.filter(u => u.role === 'Student' && u.classId === classId && (u.sectionId === `c${classId}-s${sectionId}` || u.sectionId === sectionId || u.section === sectionId));

  useEffect(() => {
    if (!selectedClassId) return;
    const classRecords = attendanceData[selectedClassId] || {};
    const record = classRecords[activeDate];
    
    if (record) {
      setAttendance(record.records || {});
      setIsLocked(record.isLocked || false);
    } else {
      const draft = localStorage.getItem(`ajps_attendance_draft_admin_${selectedClassId}_${activeDate}`);
      setAttendance(draft ? JSON.parse(draft) : {});
      setIsLocked(false);
    }
  }, [selectedClassId, attendanceData, activeDate]);

  // Persist draft to local storage on change
  useEffect(() => {
    if (selectedClassId && Object.keys(attendance).length > 0 && !isLocked) {
       localStorage.setItem(`ajps_attendance_draft_admin_${selectedClassId}_${activeDate}`, JSON.stringify(attendance));
    }
  }, [attendance, selectedClassId, activeDate, isLocked]);

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
    const currentDate = activeDate;
    const absentIds = Object.keys(attendance).filter(id => attendance[id] === 'Absent');
    
    const u = JSON.parse(localStorage.getItem('ajps_users') || '[]');
    const missingStudents = allStudents.filter(s => !absentIds.includes(s.id) && attendance[s.id] !== 'Present' && !checkIfOnLeave(s.id, currentDate));
    
    if (lockStatus && missingStudents.length > 0) {
      triggerError(`Attendance incomplete! You missed: ${missingStudents.map(s => `${s.name} (${s.rollNumber || 'N/A'})`).join(', ')}`);
      return;
    }

    if (lockStatus) setIsLocked(true);

    const updatedUsers = u.map((user: any) => { 
       if (user.classId === classId && (user.sectionId === `c${classId}-s${sectionId}` || user.sectionId === sectionId || user.section === sectionId)) {
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
    
    if (lockStatus) {
      localStorage.removeItem(`ajps_attendance_draft_admin_${selectedClassId}_${currentDate}`);
    }
    
    triggerSuccess(lockStatus ? 'Attendance finalized and locked' : 'Attendance saved successfully');
  };

  const handleSave = () => saveAttendance(isLocked);
  const handleLock = () => saveAttendance(true);
  
  const handleEditPastDate = (date: string) => {
    if (!selectedClassId) return;
    setActiveDate(date);
    const allRecords = JSON.parse(localStorage.getItem('ajps_attendance') || '{}');
    const record = allRecords[selectedClassId]?.[date];
    if (record) {
      setAttendance(record.records);
      setIsLocked(false); // Unlock for editing
      setActiveTab('mark');
    }
  };

  const handleLeaveAction = (leaveId: string, newStatus: 'Approved' | 'Rejected') => {
    const allLeaves = JSON.parse(localStorage.getItem('ajps_leaves') || '[]');
    const idx = allLeaves.findIndex((l: any) => l.id === leaveId);
    if (idx > -1) {
      allLeaves[idx].status = newStatus;
      localStorage.setItem('ajps_leaves', JSON.stringify(allLeaves));
      setAdminLeaves([...allLeaves].reverse());

      NotificationService.sendNotification({
        recipientIds: [allLeaves[idx].studentId], // studentId actually holds the requester's ID (Teacher/Student)
        title: `Leave ${newStatus}`,
        message: `Your leave application for ${allLeaves[idx].date} has been ${newStatus.toLowerCase()}.`,
        type: newStatus === 'Approved' ? 'success' : 'warning'
      });
      triggerSuccess(`Leave ${newStatus}`);
    }
  };

  const classRecords = attendanceData[selectedClassId] || {};
  const dates = Object.keys(classRecords).sort().reverse();
  const filteredDates = searchDate ? dates.filter(d => d === searchDate) : dates;

  const totalStudents = allStudents.length || 0;
  const presentCount = allStudents.filter(s => attendance && attendance[s.id] === 'Present').length || 0;
  const absentCount = allStudents.filter(s => attendance && attendance[s.id] === 'Absent').length || 0;
  const presentPercentage = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;
  const absentPercentage = totalStudents > 0 ? Math.round((absentCount / totalStudents) * 100) : 0;
  
  const donutGradient = `conic-gradient(#16a34a ${presentPercentage}%, #ef4444 ${presentPercentage}% ${presentPercentage + absentPercentage}%, #f3f4f6 ${presentPercentage + absentPercentage}% 100%)`;

  const selectedClassOption = classOptions.find(opt => opt.id === selectedClassId);
  const classNameDisplay = selectedClassOption ? selectedClassOption.name : 'Unknown Class';

  return (

      <div className="bg-slate-50 min-h-screen pb-24 overflow-x-hidden w-full max-w-full">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Admin Attendance</h1>
          <p className="text-sm text-gray-500 mt-1">Home &gt; Attendance</p>
        </div>

        <div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Select View</label>
              <div className="relative">
                <select
                  value={activeTab}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    setActiveTab(val);
                    if (val === 'mark') setTargetType('Students');
                  }}
                  className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-800 text-sm font-medium rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0B1E40]/30 shadow-sm transition-all"
                >
                  <option value="mark">Mark Attendance</option>
                  <option value="history">Attendance History</option>
                  <option value="leaves">Leave Requests</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </div>
              </div>
            </div>

            {activeTab !== 'mark' && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Select Target</label>
                <select 
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value as any)}
                  className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-800 text-sm font-medium rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0B1E40]/30 shadow-sm transition-all"
                >
                  <option value="Students">Students</option>
                  <option value="Teachers">Teachers</option>
                </select>
              </div>
            )}

            {targetType === 'Students' ? (
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Select Class & Section</label>
                <select 
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-800 text-sm font-medium rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0B1E40]/30 shadow-sm transition-all"
                >
                  {classOptions.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Select Teacher</label>
                <select 
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-800 text-sm font-medium rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0B1E40]/30 shadow-sm transition-all"
                >
                  {users.filter(u => u.role === 'Teacher').map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}
            {activeTab === 'history' && targetType === 'Students' && (
              <>
                <div className="relative">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Filter by Date</label>
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="date" 
                      value={searchDate}
                      onChange={e => setSearchDate(e.target.value)}
                      min="2026-04-01"
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm font-medium focus:ring-2 focus:ring-[#0B1E40]/30 outline-none text-gray-700 shadow-sm transition-all"
                    />
                  </div>
                </div>
              </>
            )}
            
            {activeTab === 'history' && targetType === 'Students' && historyViewMode === 'individual' && (
              <div className="relative md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Search Student</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Name or Roll No..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm font-medium focus:ring-2 focus:ring-[#0B1E40]/30 outline-none placeholder:text-gray-400 shadow-sm transition-all"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        </div>

        {/* Removed tab strip */}

      <div className="space-y-4">
        {/* Module 1: Mark Attendance */}
        {targetType === 'Students' && activeTab === 'mark' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 md:p-6 bg-gray-50/30">
        {targetType === 'Students' && isSunday && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6 flex flex-col items-center justify-center text-red-600 shadow-sm animate-in fade-in zoom-in duration-300">
            <Lock className="w-12 h-12 mb-3" />
            <h2 className="text-xl font-bold">Sunday: Attendance locked.</h2>
            <p className="text-sm text-red-500 mt-1">School is closed on Sundays. You cannot mark student attendance.</p>
          </div>
        )}

        {targetType === 'Students' && isHoliday && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 mb-6 flex flex-col items-center justify-center text-orange-600 shadow-sm animate-in fade-in zoom-in duration-300">
            <Lock className="w-12 h-12 mb-3" />
            <h2 className="text-xl font-bold">Holiday: {holiday.title}</h2>
            <p className="text-sm text-orange-500 mt-1">School is closed for this holiday. You cannot mark attendance.</p>
          </div>
        )}

        {/* Date Selection for Mark Attendance */}
        <div className="mb-8 flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm w-fit">
          <label className="font-bold text-gray-800">Select Date:</label>
          <div className="flex items-center bg-gray-50 border border-gray-200 p-2 rounded-lg">
            <Calendar className="w-5 h-5 text-gray-400 mr-2" />
            <input 
              type="date" 
              value={activeDate}
              max={getSystemDate().toISOString().split('T')[0]}
              onChange={(e) => setActiveDate(e.target.value)}
              className="bg-transparent border-none text-sm font-medium text-gray-700 outline-none"
            />
          </div>
        </div>

        {((targetType === 'Students' && !(isSunday || isHoliday)) || targetType !== 'Students') && (
          <div className={`transition-all duration-300`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
                <div className="bg-green-50 text-green-600 rounded-full w-12 h-12 flex items-center justify-center shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
                  <p className="text-xs text-gray-500">In Class</p>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
                <div className="bg-green-100 text-green-700 rounded-full w-12 h-12 flex items-center justify-center shrink-0 font-bold text-xl">
                  P
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Present</p>
                  <p className="text-2xl font-bold text-gray-900">{presentCount}</p>
                  <p className="text-xs text-gray-500">{presentPercentage}%</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
                <div className="bg-red-100 text-red-600 rounded-full w-12 h-12 flex items-center justify-center shrink-0 font-bold text-xl">
                  A
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Absent</p>
                  <p className="text-2xl font-bold text-gray-900">{absentCount}</p>
                  <p className="text-xs text-gray-500">{absentPercentage}%</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 flex justify-between items-center border-b border-gray-100">
                  <h3 className="font-bold text-gray-900 text-lg">{classNameDisplay}</h3>
                  <span className="text-sm text-gray-500">Total Students: {totalStudents}</span>
                </div>
                
                <div className="flex flex-col divide-y divide-gray-50">
                  {allStudents.map((student, idx) => {
                    const status = attendance[student.id];
                    const isOnLeave = checkIfOnLeave(student.id, getSystemDate().toISOString().split('T')[0]);
                    const shortRoll = student.rollNumber ? student.rollNumber.replace(/^132426/, '') : 'N/A';
                    
                    return (
                      <div key={student.id} className={`flex items-center justify-between p-3 border-b border-gray-50 last:border-0 transition-all duration-300 ease-in-out ${isLocked ? 'opacity-70' : 'hover:bg-gray-50'}`}>
                        {/* Left Side */}
                        <div className="flex-1 min-w-0 flex items-center gap-3">
                          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs md:text-sm font-bold shrink-0">
                            {student.name.charAt(0)}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm md:text-base font-semibold truncate text-gray-900">{student.name}</span>
                            <span className="text-[10px] md:text-xs text-gray-500 truncate">Roll: {student.rollNumber ? String(student.rollNumber).slice(-4) : 'N/A'}</span>
                          </div>
                        </div>

                        {/* Right Side: P/A Buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                          {isOnLeave ? (
                            <div className="px-3 py-1.5 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-md text-xs font-medium">
                              On Leave
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => handleMark(student.id, 'Present')}
                                disabled={isLocked}
                                className={`w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center font-bold text-sm transition-colors ${
                                  status === 'Present' 
                                    ? 'bg-green-600 text-white shadow-sm' 
                                    : status === 'Absent' 
                                      ? 'bg-gray-100 text-gray-400' 
                                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                              >
                                P
                              </button>
                              <button
                                onClick={() => handleMark(student.id, 'Absent')}
                                disabled={isLocked}
                                className={`w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center font-bold text-sm transition-colors ${
                                  status === 'Absent' 
                                    ? 'bg-red-500 text-white shadow-sm' 
                                    : status === 'Present' 
                                      ? 'bg-gray-100 text-gray-400' 
                                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                              >
                                A
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {allStudents.length === 0 && (
                    <div className="py-8 text-center text-gray-500">No students found in this class section.</div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-4 flex flex-col space-y-4">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center flex flex-col items-center">
                  <h4 className="font-semibold text-gray-900 mb-6 w-full text-left">Attendance Summary</h4>
                  
                  <div 
                    className="w-40 h-40 rounded-full flex items-center justify-center mb-6 relative"
                    style={{ background: donutGradient }}
                  >
                    <div className="w-32 h-32 bg-white rounded-full flex flex-col items-center justify-center absolute">
                      <span className="text-2xl font-bold text-gray-900">{presentPercentage}%</span>
                      <span className="text-xs text-gray-500">Present</span>
                    </div>
                  </div>

                  <div className="w-full space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                        Present
                      </div>
                      <span className="font-medium text-gray-900">{presentCount} <span className="text-gray-400 font-normal">({presentPercentage}%)</span></span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                        Absent
                      </div>
                      <span className="font-medium text-gray-900">{absentCount} <span className="text-gray-400 font-normal">({absentPercentage}%)</span></span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm flex items-start gap-3">
                  <Info className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>Please mark attendance for all students and click on 'Submit Today' to finalize.</p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleLock}
                    disabled={isLocked}
                    className={`w-full rounded-xl py-4 flex items-center justify-center gap-2 font-medium text-lg transition-colors ${
                      isLocked ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[#0B1E40] text-white hover:bg-blue-900 shadow-md'
                    }`}
                  >
                    <CheckCircle className="w-5 h-5" /> 
                    {isLocked ? 'Submitted' : 'Submit Today'}
                  </button>
                  <p className="text-center text-xs text-gray-500 mt-3">You can edit submitted attendance from the History tab.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )}

        {/* Module 2: Attendance History */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 md:p-6 bg-white">
            {targetType === 'Students' && (
              <div className="flex gap-2 bg-gray-100 p-1 rounded-xl mb-4 w-full md:w-fit mx-auto md:mx-0">
                <button 
                  onClick={() => setHistoryViewMode('class')}
                  className={`flex-1 md:flex-none md:px-8 py-2 text-sm font-bold rounded-lg transition-colors ${historyViewMode === 'class' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Class View
                </button>
                <button 
                  onClick={() => setHistoryViewMode('individual')}
                  className={`flex-1 md:flex-none md:px-8 py-2 text-sm font-bold rounded-lg transition-colors ${historyViewMode === 'individual' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Individual View
                </button>
              </div>
            )}
            {historyViewMode === 'class' && (
              <>
                {filteredDates.map(date => {
                  const record = classRecords[date];
                  
                  const studentsToRender = allStudents.filter(s => {
                    if (!searchQuery) return true;
                    const query = searchQuery.toLowerCase();
                    return s.name.toLowerCase().includes(query) || (s.rollNumber && s.rollNumber.toLowerCase().includes(query));
                  });

                  if (studentsToRender.length === 0 && searchQuery) return null;

                  const isExpanded = expandedDate === date;

                  return (
                    <div key={date} className="overflow-hidden bg-white rounded-2xl border border-gray-100 shadow-sm transition-all duration-300">
                      <div 
                        onClick={() => toggleDate(date)}
                        className="p-4 bg-gray-50 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" /> 
                          {new Date(date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}
                        </h4>
                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md border ${record.isLocked ? 'bg-gray-100 text-gray-600 border-gray-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                            {record.isLocked ? 'Locked' : 'Draft'}
                          </span>
                          {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                        </div>
                      </div>

                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex justify-end">
                              <button 
                                onClick={() => handleEditPastDate(date)}
                                className="bg-white border border-blue-200 text-blue-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-50 transition-colors shadow-sm"
                              >
                                Edit Attendance
                              </button>
                            </div>
                            <div className="p-4 space-y-3 bg-white">
                              {studentsToRender.map(student => {
                                const finalStatus = record.records[student.id] || 'No Data';
                                return (
                                  <div key={student.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-3 rounded-xl border border-gray-100 bg-gray-50 gap-2 sm:gap-4 hover:border-gray-200 transition-colors">
                                    <div className="flex items-center gap-4">
                                      <img src={student.avatar || "https://ui-avatars.com/api/?name=" + encodeURIComponent(student.name) + "&background=random"} alt="" className="w-10 h-10 rounded-full bg-white shadow-sm" />
                                      <div>
                                        <p className="font-semibold text-gray-900">{student.name}</p>
                                        {student.rollNumber && (
                                          <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-white px-2 py-0.5 rounded border border-gray-100">Roll: {student.rollNumber?.replace(/^132426/, '') || 'N/A'}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <span className={
                                      finalStatus === 'Present' ? 'text-emerald-700 bg-emerald-50 px-3 py-1 rounded-md font-medium text-xs border border-emerald-100 self-start sm:self-auto' :
                                      finalStatus === 'Absent' ? 'text-red-700 bg-red-50 px-3 py-1 rounded-md font-medium text-xs border border-red-100 self-start sm:self-auto' : 
                                      'text-yellow-700 bg-yellow-50 px-3 py-1 rounded-md font-medium text-xs border border-yellow-100 self-start sm:self-auto'
                                    }>
                                      {finalStatus}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}

                {filteredDates.length === 0 && targetType === 'Students' && (
                   <div className="p-8 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
                     <p className="text-gray-500 font-medium">No attendance records found matching your filters.</p>
                   </div>
                )}
              </>
            )}

            {historyViewMode === 'individual' && targetType === 'Students' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 border border-gray-200 bg-white rounded-xl shadow-sm overflow-hidden h-[600px] flex flex-col">
                  <div className="bg-gray-50 border-b border-gray-200 p-4 shrink-0">
                    <h3 className="font-bold text-gray-800 text-sm">Select Student</h3>
                  </div>
                  <div className="overflow-y-auto flex-1 p-2 space-y-1">
                    {allStudents.filter(s => {
                      if (!searchQuery) return true;
                      const q = searchQuery.toLowerCase();
                      return s.name.toLowerCase().includes(q) || (s.rollNumber && s.rollNumber.toLowerCase().includes(q));
                    }).map(student => (
                      <button 
                        key={student.id} 
                        onClick={() => setSelectedStudentForCalendar(student)}
                        className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${selectedStudentForCalendar?.id === student.id ? 'bg-[#0B1E40] text-white' : 'hover:bg-gray-100'}`}
                      >
                        <img src={student.avatar || "https://ui-avatars.com/api/?name=" + encodeURIComponent(student.name) + "&background=random"} alt="" className="w-8 h-8 rounded-full bg-white shadow-sm shrink-0" />
                        <div className="min-w-0">
                          <p className={`font-semibold truncate text-sm ${selectedStudentForCalendar?.id === student.id ? 'text-white' : 'text-gray-900'}`}>{student.name}</p>
                          {student.rollNumber && <p className={`text-xs truncate ${selectedStudentForCalendar?.id === student.id ? 'text-blue-200' : 'text-gray-500'}`}>Roll: {student.rollNumber}</p>}
                        </div>
                      </button>
                    ))}
                    {allStudents.length === 0 && (
                      <p className="text-gray-500 text-center p-4 text-sm">No students found.</p>
                    )}
                  </div>
                </div>
                <div className="md:col-span-2">
                  {selectedStudentForCalendar ? (
                    <div className="animate-in fade-in zoom-in-95 duration-300">
                      {(() => {
                        const history = [...(selectedStudentForCalendar.attendanceHistory || [])];
                        const allLvs = JSON.parse(localStorage.getItem('ajps_leaves') || '[]');
                        allLvs.filter((l: any) => l.studentId === selectedStudentForCalendar.id && l.status === "Approved").forEach((l: any) => {
                          let current = new Date(l.fromDate);
                          const end = new Date(l.toDate);
                          while (current <= end) {
                            const dateStr = current.toISOString().split("T")[0];
                            const existingIdx = history.findIndex(h => h.date === dateStr);
                            if (existingIdx !== -1) {
                              history[existingIdx] = { ...history[existingIdx], status: "Leave" };
                            } else {
                              history.push({ date: dateStr, status: "Leave" });
                            }
                            current.setDate(current.getDate() + 1);
                          }
                        });
                        return <AttendanceCalendar attendanceRecords={history} />;
                      })()}
                    </div>
                  ) : (
                    <div className="h-full min-h-[400px] border border-gray-200 bg-white rounded-xl shadow-sm flex items-center justify-center text-gray-400 flex-col gap-4">
                      <Calendar className="w-12 h-12 text-gray-300" />
                      <p className="font-medium">Select a student to view their calendar</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {targetType === 'Teachers' && (
              <div className="animate-in fade-in zoom-in-95 duration-300">
                <AttendanceCalendar attendanceRecords={users.find(u => u.id === selectedTeacherId)?.attendanceHistory || []} />
              </div>
            )}
            </div>
          </div>
        )}

        {/* Module 3: Leave Requests */}
        {activeTab === 'leaves' && (
          <div id="leave-requests-section" className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 md:p-6 bg-gray-50/30">
              <h3 className="font-bold text-gray-900 mb-6">Leave Requests</h3>
              {adminLeaves.length === 0 ? (
                <p className="text-gray-500 font-medium text-center py-8">No leave requests found.</p>
              ) : adminLeaves.map((leave, i) => (
                <div key={i} className="mb-4 bg-white border border-gray-100 p-5 rounded-xl shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-gray-900">{leave.studentName} <span className="text-xs font-normal text-gray-500 ml-2">({leave.role || 'Student'})</span></h4>
                      <p className="text-xs text-gray-500 mt-1">From: {new Date(leave.fromDate).toLocaleDateString()} To: {new Date(leave.toDate).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md ${
                      leave.status === 'Pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      leave.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {leave.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100 mb-4">{leave.reason}</p>
                  {leave.status === 'Pending' && (
                    <div className="flex gap-3">
                      <button 
                        onClick={() => handleLeaveAction(leave.id, 'Approved')}
                        className="flex-1 bg-emerald-50 text-emerald-700 border border-emerald-200 py-2 rounded-lg text-sm font-bold hover:bg-emerald-100 transition-colors"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => handleLeaveAction(leave.id, 'Rejected')}
                        className="flex-1 bg-red-50 text-red-700 border border-red-200 py-2 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Floating Button & Drawer */}
        <button 
          onClick={() => setIsDrawerOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-[#0B1E40] text-white px-6 py-3 rounded-full shadow-xl font-bold flex items-center gap-2 hover:bg-blue-900 transition-all hover:scale-105"
        >
          <Calendar className="w-5 h-5" /> Attendance
        </button>

        <AnimatePresence>
          {isDrawerOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity" 
                onClick={() => setIsDrawerOpen(false)} 
              />
              <motion.div 
                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 right-0 w-80 bg-white shadow-2xl z-50 flex flex-col"
              >
                 <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                   <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Calendar className="w-5 h-5 text-blue-600"/> Options</h2>
                   <button onClick={() => setIsDrawerOpen(false)} className="p-2 rounded-full hover:bg-gray-200 text-gray-500"><X className="w-5 h-5"/></button>
                 </div>
                 <div className="flex-1 overflow-y-auto p-4 space-y-2">
                   <button onClick={() => { setActiveTab('mark'); setIsDrawerOpen(false); }} className={`w-full text-left p-4 rounded-xl font-bold flex items-center gap-3 transition-colors ${activeTab === 'mark' ? 'bg-[#0B1E40] text-white shadow-md' : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-100'}`}>
                     <CheckCircle className="w-5 h-5" /> Mark Attendance
                   </button>
                   <button onClick={() => { setActiveTab('history'); setIsDrawerOpen(false); }} className={`w-full text-left p-4 rounded-xl font-bold flex items-center gap-3 transition-colors ${activeTab === 'history' ? 'bg-[#0B1E40] text-white shadow-md' : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-100'}`}>
                     <History className="w-5 h-5" /> Attendance History
                   </button>
                   <button onClick={() => { setActiveTab('leaves'); setIsDrawerOpen(false); }} className={`w-full text-left p-4 rounded-xl font-bold flex items-center gap-3 transition-colors ${activeTab === 'leaves' ? 'bg-[#0B1E40] text-white shadow-md' : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-100'}`}>
                     <Calendar className="w-5 h-5" /> Leave Requests
                   </button>
                 </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
