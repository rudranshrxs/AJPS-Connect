import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../../components/ui/GlassCard';
import { Lock, CheckCircle, Calendar, ChevronRight, ChevronDown, History, Search, Fingerprint, Clock, Users, Info, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NotificationService } from '../../services/NotificationService';
import { useSuccess } from '../../context/SuccessContext';
import { getSystemDate } from '../../utils/dateUtils';
import { TeacherLiveAttendance } from '../../components/attendance/TeacherLiveAttendance';
import { motion, AnimatePresence } from 'framer-motion';
import { AttendanceCalendar } from '../../components/attendance/AttendanceCalendar';

interface Student {
  id: string;
  name: string;
  rollNumber: string;
  attendanceHistory?: any[];
}

export function TeacherAttendance() {
  const { currentUser } = useAuth();
  const { triggerSuccess, triggerError } = useSuccess();
  const navigate = useNavigate();
  
  const [classDetails, setClassDetails] = useState<{ id: string, name: string, students: Student[], classId: string, sectionId: string } | null>(null);
  
  // Proxy Engine States
  const [mainClassDetails, setMainClassDetails] = useState<{ id: string, name: string, students: Student[], classId: string, sectionId: string } | null>(null);
  const [proxyClassDetails, setProxyClassDetails] = useState<{ id: string, name: string, students: Student[], classId: string, sectionId: string } | null>(null);
  const [selectedClassMode, setSelectedClassMode] = useState<'main' | 'proxy'>('main');
  
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [isLocked, setIsLocked] = useState(false);
  const [notices, setNotices] = useState<any[]>([]);
  const [historyViewMode, setHistoryViewMode] = useState<'class' | 'individual'>('class');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [animateChart, setAnimateChart] = useState(false);
  const [activeDate, setActiveDate] = useState<string>(() => getSystemDate().toISOString().split('T')[0]);
  const [selectedStudentForCalendar, setSelectedStudentForCalendar] = useState<Student | null>(null);
  
  useEffect(() => {
    if (isReady) {
      const timer = setTimeout(() => setAnimateChart(true), 100);
      return () => clearTimeout(timer);
    }
  }, [isReady]);
  
  const [activeTab, setActiveTab] = useState<'mark' | 'history' | 'leaves' | 'self'>('self');
  const [pastRecords, setPastRecords] = useState<Record<string, any>>({});
  const [leaves, setLeaves] = useState<any[]>([]);
  
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const [scannerMode, setScannerMode] = useState<'checkIn' | 'checkOut' | null>(null);
  const [isTabMenuOpen, setIsTabMenuOpen] = useState(false);
  const [globalSettings, setGlobalSettings] = useState<any>({});

  useEffect(() => {
    const settingsStr = localStorage.getItem('ajps_global_settings');
    if (settingsStr) {
      setGlobalSettings(JSON.parse(settingsStr));
    }
    if (window.location.hash === '#leaves') {
      setActiveTab('leaves');
      setTimeout(() => {
        const el = document.getElementById('leave-requests-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    
    try {
      const t_raw = JSON.parse(localStorage.getItem('ajps_timetables') || '[]');
      const timetables = Array.isArray(t_raw) ? t_raw : [];
      const u_raw = JSON.parse(localStorage.getItem('ajps_users') || '[]');
      const users = Array.isArray(u_raw) ? u_raw : [];
      const c_raw = JSON.parse(localStorage.getItem('ajps_classes') || '[]');
      const classes = Array.isArray(c_raw) ? c_raw : [];
      const n_raw = JSON.parse(localStorage.getItem('ajps_notices') || '[]');
      const noticesData = Array.isArray(n_raw) ? n_raw : [];
      setNotices(noticesData);
      
      const freshUser = users.find((u: any) => u.id === currentUser.id) || currentUser;

      // Determine class based on Period 1 of the activeDate's day
      const activeDateObj = new Date(activeDate);
      const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const currentDayStr = daysOfWeek[activeDateObj.getDay()];
      
      let targetClassId = null;
      let targetSectionId = null;

      const myClassTimetable = timetables.find((t: any) =>
        t.schedule?.[currentDayStr]?.['p1'] === freshUser.id
      );

      if (myClassTimetable) {
        targetClassId = myClassTimetable.classId || myClassTimetable.className;
        targetSectionId = myClassTimetable.sectionId;
      }

      let mainDetails = null;
      let proxyDetails = null;

      if (targetClassId && targetSectionId) {
        const sectionStudents = users.filter((u: any) => 
          u.role === 'Student' && 
          String(u.classId) === String(targetClassId) && 
          (String(u.sectionId) === String(targetSectionId) || u.sectionId === `c${targetClassId}-s${targetSectionId}` || u.section === targetSectionId)
        );
        const classObj = classes.find((c: any) => String(c.id) === String(targetClassId) || c.className === targetClassId);
        const sectionObj = classObj?.sections?.find((s: any) => (typeof s === 'string' ? s : String(s.id)) === String(targetSectionId));
        const classNameStr = classObj ? classObj.className || classObj.id : `Class ${targetClassId}`;
        const sectionNameStr = sectionObj ? (sectionObj.name || sectionObj) : targetSectionId;
        
        mainDetails = {
          id: `${targetClassId}-${targetSectionId}`,
          classId: targetClassId,
          sectionId: targetSectionId,
          name: `${classNameStr} - Section ${sectionNameStr}`,
          students: sectionStudents
        };
        setMainClassDetails(mainDetails);
      } else {
        setMainClassDetails(null);
      }
      
      // Check if teacher has a proxy class assigned
      if (freshUser.proxyClassId) {
        const [pClassId, pSectionId] = freshUser.proxyClassId.split('-');
        if (pClassId && pSectionId) {
          const proxyStudents = users.filter((u: any) => 
            u.role === 'Student' && 
            String(u.classId) === String(pClassId) && 
            (String(u.sectionId) === String(pSectionId) || u.sectionId === `c${pClassId}-s${pSectionId}` || u.section === pSectionId)
          );
          const pClassObj = classes.find((c: any) => String(c.id) === String(pClassId));
          const pSectionObj = pClassObj?.sections?.find((s: any) => (typeof s === 'string' ? s : String(s.id)) === String(pSectionId));
          const pClassNameStr = pClassObj ? pClassObj.className || pClassObj.id : `Class ${pClassId}`;
          const pSectionNameStr = pSectionObj ? (pSectionObj.name || pSectionObj) : pSectionId;
          
          proxyDetails = {
            id: freshUser.proxyClassId,
            classId: pClassId,
            sectionId: pSectionId,
            name: `${pClassNameStr} - Section ${pSectionNameStr} (Proxy)`,
            students: proxyStudents
          };
          setProxyClassDetails(proxyDetails);
        } else {
          setProxyClassDetails(null);
        }
      } else {
        setProxyClassDetails(null);
      }
      
      // Handle active details logic
      let activeDetails = selectedClassMode === 'main' ? mainDetails : proxyDetails;
      // Fallback if current mode has no details
      if (!activeDetails) {
         if (mainDetails) {
            activeDetails = mainDetails;
            setSelectedClassMode('main');
         } else if (proxyDetails) {
            activeDetails = proxyDetails;
            setSelectedClassMode('proxy');
         }
      }

      setClassDetails(activeDetails);
      
      if (activeDetails) {
        const parsedA = JSON.parse(localStorage.getItem('ajps_attendance') || '{}');
        const allRecords = parsedA && typeof parsedA === 'object' ? parsedA : {};
        
        setPastRecords(allRecords[activeDetails.id] || {});
        const dateRecord = allRecords[activeDetails.id]?.[activeDate];
        
        if (dateRecord) {
          setAttendance(dateRecord.records || {});
          setIsLocked(dateRecord.isLocked || false);
        } else {
          const draft = localStorage.getItem(`ajps_attendance_draft_${activeDetails.id}_${activeDate}`);
          setAttendance(draft ? JSON.parse(draft) : {});
          setIsLocked(false);
        }
        
        const allLeaves = JSON.parse(localStorage.getItem('ajps_leaves') || '[]');
        const myLeaves = Array.isArray(allLeaves) ? allLeaves.filter((l: any) => l.classId === activeDetails.classId && String(l.sectionId) === String(activeDetails.sectionId)) : [];
        setLeaves(myLeaves.reverse());
        
        // Only set active tab to mark if we were on 'self' (initial load), otherwise keep current tab
        setActiveTab(prev => prev === 'self' ? 'mark' : prev);
      } else {
         // Reset if no class access today
         setAttendance({});
         setIsLocked(false);
         setPastRecords({});
         setLeaves([]);
         setActiveTab(prev => prev === 'mark' ? 'self' : prev);
      }
    } catch (error) {
      console.error('Error initializing teacher attendance data:', error);
    } finally {
      setIsReady(true);
    }
  }, [currentUser, activeDate, selectedClassMode]);

  // Persist draft to local storage on change
  useEffect(() => {
    if (isReady && classDetails && Object.keys(attendance).length > 0 && !isLocked) {
       localStorage.setItem(`ajps_attendance_draft_${classDetails.id}_${activeDate}`, JSON.stringify(attendance));
    }
  }, [attendance, isReady, classDetails, activeDate, isLocked]);

  const handleBiometricSuccess = (timeString: string) => {
    if (!currentUser) return;
    
    const users = JSON.parse(localStorage.getItem('ajps_users') || '[]');
    const today = getSystemDate().toISOString().split('T')[0];
    const userIndex = users.findIndex((u: any) => u.id === currentUser.id);
    
    if (userIndex !== -1) {
      if (!users[userIndex].attendanceHistory) users[userIndex].attendanceHistory = [];
      const history = users[userIndex].attendanceHistory;
      
      const existingIndex = history.findIndex((h: any) => h.date === today);
      
      if (scannerMode === 'checkIn') {
        if (existingIndex === -1) {
          history.push({ date: today, status: 'Present', checkInTime: timeString });
          triggerSuccess('Check-In Successful');
        }
      } else if (scannerMode === 'checkOut') {
        if (existingIndex !== -1) {
          history[existingIndex].checkOutTime = timeString;
          triggerSuccess('Check-Out Successful');
        }
      }
      
      localStorage.setItem('ajps_users', JSON.stringify(users));
      currentUser.attendanceHistory = history;
      window.dispatchEvent(new Event('storage'));
      
      setHistorySearchQuery(' ');
      setTimeout(() => setHistorySearchQuery(''), 0);
    }
    
    setScannerMode(null);
  };

  let selfAttendanceHistory = [...(currentUser?.attendanceHistory || [])];
  const allLeaves = JSON.parse(localStorage.getItem('ajps_leaves') || '[]');
  allLeaves.filter((l: any) => l.studentId === currentUser?.id && l.status === "Approved").forEach((l: any) => {
    let current = new Date(l.fromDate);
    const end = new Date(l.toDate);
    while (current <= end) {
      const dateStr = current.toISOString().split("T")[0];
      const existingIdx = selfAttendanceHistory.findIndex(h => h.date === dateStr);
      if (existingIdx !== -1) {
        selfAttendanceHistory[existingIdx] = { ...selfAttendanceHistory[existingIdx], status: "Leave" };
      } else {
        selfAttendanceHistory.push({ date: dateStr, status: "Leave" });
      }
      current.setDate(current.getDate() + 1);
    }
  });
  const todayDate = getSystemDate().toISOString().split('T')[0];
  const todayRecord = selfAttendanceHistory.find((h: any) => h.date === todayDate);

  const hasCheckedIn = !!todayRecord;
  const hasCheckedOut = !!(todayRecord && todayRecord.checkOutTime);

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
    if (!classDetails) return;
    
    const currentDate = activeDate;
    const absentIds = Object.keys(attendance).filter(id => attendance[id] === 'Absent');
    
    const missingStudents = classDetails.students.filter(s => !absentIds.includes(s.id) && attendance[s.id] !== 'Present' && !checkIfOnLeave(s.id, currentDate));
    if (lockStatus && missingStudents.length > 0) {
      triggerError(`Attendance incomplete! You missed: ${missingStudents.map(s => `${s.name} (${s.rollNumber || 'N/A'})`).join(', ')}`);
      return;
    }

    if (lockStatus) setIsLocked(true);

    const users = JSON.parse(localStorage.getItem('ajps_users') || '[]');
    const updatedUsers = users.map((user: any) => { 
       if (user.classId === classDetails.classId && (user.sectionId === classDetails.sectionId || user.sectionId === `c${classDetails.classId}-s${classDetails.sectionId}` || user.section === classDetails.sectionId)) {
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

    const absentees = classDetails.students.filter(s => absentIds.includes(s.id));
    if (absentees.length > 0) {
      NotificationService.sendNotification({
        recipientIds: absentees.map(a => a.id),
        title: 'Attendance Alert',
        message: 'You were marked absent today.',
        type: 'warning',
        actionPath: '/dashboard',
        actionLabel: 'View'
      });
    }

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
    
    if (lockStatus) {
      localStorage.removeItem(`ajps_attendance_draft_${classDetails.id}_${currentDate}`);
    }
    
    triggerSuccess(lockStatus ? 'Attendance finalized and locked' : 'Attendance saved successfully');
  };

  const handleSave = () => saveAttendance(isLocked);
  const handleLock = () => saveAttendance(true);
  
  const handleEditPastDate = (date: string) => {
    if (!classDetails) return;
    setActiveDate(date);
    const allRecords = JSON.parse(localStorage.getItem('ajps_attendance') || '{}');
    const record = allRecords[classDetails.id]?.[date];
    if (record) {
      setAttendance(record.records);
      setIsLocked(false); // Unlock for editing
      setActiveTab('mark');
    }
  };

  const handleLeaveAction = (leaveId: string, newStatus: 'Approved' | 'Rejected') => {
    const allLeaves = JSON.parse(localStorage.getItem('ajps_leaves') || '[]');
    const idx = allLeaves.findIndex((l: any) => l.id === leaveId);
    if (idx >= 0) {
      allLeaves[idx].status = newStatus;
      localStorage.setItem('ajps_leaves', JSON.stringify(allLeaves));
      
      if (classDetails) {
        const myLeaves = allLeaves.filter((l: any) => l.classId === classDetails.classId && l.sectionId === classDetails.sectionId);
        setLeaves(myLeaves.reverse());
      }
      
      NotificationService.sendNotification({
        recipientIds: [allLeaves[idx].studentId],
        title: `Leave ${newStatus}`,
        message: `Your leave application for ${allLeaves[idx].date} has been ${newStatus.toLowerCase()}.`,
        type: newStatus === 'Approved' ? 'success' : 'warning'
      });
      triggerSuccess(`Leave ${newStatus}`);
    }
  };

  const isSunday = new Date(activeDate).getDay() === 0;
  const holiday = notices.find((n: any) => n.templateType === 'holiday' && n.targetDate === activeDate);
  const isHoliday = !!holiday;

  const classAttendanceRecords = React.useMemo(() => {
    return Object.keys(pastRecords).map(date => {
      const rec = pastRecords[date];
      return { date, status: rec.isLocked ? 'Present' : 'Leave' }; // Green if locked/submitted, Yellow if draft
    });
  }, [pastRecords]);

  const groupedHistory: Record<string, any[]> = {};
  if (classDetails && classDetails.students) {
    classDetails.students.forEach(student => {
      student.attendanceHistory?.forEach(record => {
        if (!groupedHistory[record.date]) groupedHistory[record.date] = [];
        groupedHistory[record.date].push({ name: student.name, rollNumber: student.rollNumber, status: record.status });
      });
    });
  }

  const displayDates = searchDate 
    ? Object.keys(groupedHistory).filter(d => d === searchDate) 
    : Object.keys(groupedHistory).sort((a,b) => new Date(b).getTime() - new Date(a).getTime());

  const totalStudents = classDetails?.students?.length || 0;
  const presentCount = classDetails?.students?.filter(s => attendance && attendance[s.id] === 'Present').length || 0;
  const absentCount = classDetails?.students?.filter(s => attendance && attendance[s.id] === 'Absent').length || 0;
  const presentPercentage = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;
  const absentPercentage = totalStudents > 0 ? Math.round((absentCount / totalStudents) * 100) : 0;
  
  const donutGradient = `conic-gradient(#16a34a ${presentPercentage}%, #ef4444 ${presentPercentage}% ${presentPercentage + absentPercentage}%, #f3f4f6 ${presentPercentage + absentPercentage}% 100%)`;

  if (!isReady) {
    return (
      <div className="w-full max-w-full px-3 py-12 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full px-3">
        
        {scannerMode && (
          <TeacherLiveAttendance 
            mode={scannerMode} 
            referenceImageBase64={currentUser?.profilePhotoUrl}
            schoolLatitude={globalSettings.schoolLatitude ? Number(globalSettings.schoolLatitude) : undefined}
            schoolLongitude={globalSettings.schoolLongitude ? Number(globalSettings.schoolLongitude) : undefined}
            onSuccess={handleBiometricSuccess}
            onClose={() => setScannerMode(null)}
          />
        )}

        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Class Attendance</h1>
          <p className="text-sm text-gray-500 mt-1">Manage attendance for {classDetails?.name || 'Class'}</p>
        </div>

        
        {/* Proxy Class Selector */}
        {mainClassDetails && proxyClassDetails && (
          <div className="flex bg-white rounded-xl shadow-sm border border-gray-100 p-1 w-full max-w-sm mb-6">
            <button 
              onClick={() => setSelectedClassMode('main')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${selectedClassMode === 'main' ? 'bg-[#FDF3E7] text-[#8B5E2E] shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              My Class
            </button>
            <button 
              onClick={() => setSelectedClassMode('proxy')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${selectedClassMode === 'proxy' ? 'bg-red-50 text-red-600 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <Users className="w-4 h-4" /> Proxy Class
            </button>
          </div>
        )}

        <div className="mb-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-2 md:p-6">
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Select View</label>
          <div className="relative md:w-64">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as any)}
              className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-800 text-sm font-medium rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0B1E40]/30 shadow-sm transition-all"
            >
              <option value="self">My Attendance</option>
              <option value="mark">Mark Class Attendance</option>
              <option value="history">Class History</option>
              <option value="leaves">Leave Requests</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          
          {/* Module 1: My Attendance */}
          {activeTab === 'self' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-1 md:p-6 bg-gray-50/30">
                {/* Content for My Attendance is handled by activeTab === 'self' wrapper */}
                <div className="space-y-6 animate-in fade-in duration-300">
            <GlassCard className="p-6 md:p-8 text-center bg-white border-gray-100 shadow-sm flex flex-col items-center justify-center rounded-2xl transition-all duration-300 ease-in-out">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Daily Biometric Check-in</h3>
              
              <div className="flex flex-col md:flex-row items-center gap-4 w-full max-w-lg justify-center">
                {!hasCheckedIn && (
                  <button 
                    onClick={() => {
                      if (!currentUser?.profilePhotoUrl || currentUser.profilePhotoUrl.includes('ui-avatars')) {
                        triggerError('Please upload your profile photo first to enable Face ID.');
                        navigate('/profile');
                      } else {
                        setScannerMode('checkIn');
                      }
                    }}
                    className="w-full flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-bold shadow-md transition-all text-lg bg-white border border-emerald-200 hover:bg-emerald-50 text-emerald-700 hover:shadow-lg"
                  >
                    <Fingerprint className="w-6 h-6" /> Check In
                  </button>
                )}

                {hasCheckedIn && !hasCheckedOut && (
                  <>
                    <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-6 py-4 rounded-xl font-bold border border-emerald-200">
                      <Clock className="w-5 h-5" /> Checked in at {todayRecord.checkInTime}
                    </div>
                    <button 
                      onClick={() => {
                        if (!currentUser?.profilePhotoUrl || currentUser.profilePhotoUrl.includes('ui-avatars')) {
                          triggerError('Please upload your profile photo first to enable Face ID.');
                          navigate('/profile');
                        } else {
                          setScannerMode('checkOut');
                        }
                      }}
                      className="w-full flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-bold shadow-md transition-all text-lg bg-white border border-blue-200 hover:bg-blue-50 text-blue-700 hover:shadow-lg"
                    >
                      <Fingerprint className="w-6 h-6" /> Check Out
                    </button>
                  </>
                )}

                {hasCheckedIn && hasCheckedOut && (
                  <div className="flex flex-col gap-2 w-full">
                    <div className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 px-6 py-3 rounded-xl font-bold border border-emerald-200">
                      <Clock className="w-5 h-5" /> In: {todayRecord.checkInTime}
                    </div>
                    <div className="flex items-center justify-center gap-2 bg-blue-50 text-blue-700 px-6 py-3 rounded-xl font-bold border border-blue-200">
                      <Clock className="w-5 h-5" /> Out: {todayRecord.checkOutTime}
                    </div>
                    <p className="text-xs font-bold text-gray-500 mt-2 uppercase tracking-wide">Duty Completed</p>
                  </div>
                )}
              </div>
            </GlassCard>

            <div className="mt-8 animate-in fade-in zoom-in-95 duration-300">
              <h3 className="font-bold text-gray-900 text-lg mb-4 ml-1">My Attendance History</h3>
              <AttendanceCalendar attendanceRecords={selfAttendanceHistory} />
            </div>
            </div>
          </div>
        </div>
        )}
          
          {/* Fallback for access restricted */}
          {!classDetails && activeTab !== 'self' && (
            <div className="flex items-center justify-center min-h-[40vh] p-4">
              <GlassCard className="max-w-md w-full p-6 md:p-8 text-center bg-white/60 border-white backdrop-blur-xl shadow-2xl rounded-3xl transition-all duration-300 ease-in-out">
                <div className="w-20 h-20 mx-auto bg-[#FDF7EE] border-2 border-[#A05C2B]/20 text-[#A05C2B] rounded-full flex items-center justify-center mb-6 shadow-sm">
                  <Lock className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-black text-[#1F2937] mb-3 tracking-tight">Access Restricted</h2>
                <p className="text-gray-600 font-semibold leading-relaxed">
                  You are not assigned as a Class Teacher.
                </p>
              </GlassCard>
            </div>
          )}

          {/* Module 2: Mark Attendance */}
          {classDetails && activeTab === 'mark' && (
          <div className="bg-transparent md:bg-white rounded-none md:rounded-2xl border-none md:border md:border-gray-100 shadow-none md:shadow-sm overflow-hidden">
            <div className="p-0 md:p-6 bg-transparent md:bg-gray-50/30">
                {/* Date Selection for Mark Attendance */}
                <div className="mb-8 flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm w-fit">
                  <label className="font-bold text-gray-800">Select Date:</label>
                  <div className="flex items-center bg-gray-50 border border-gray-200 p-2 rounded-lg">
                    <Calendar className="w-5 h-5 text-gray-400 " />
                    <input 
                      type="date" 
                      value={activeDate}
                      onChange={(e) => setActiveDate(e.target.value)}
                      className="bg-transparent border-none text-sm font-medium text-gray-700 outline-none"
                    />
                  </div>
                </div>

        {classDetails && isSunday && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6 flex flex-col items-center justify-center text-red-600 shadow-sm animate-in fade-in zoom-in duration-300">
            <Lock className="w-12 h-12 mb-3" />
            <h2 className="text-lg md:text-xl font-bold">Sunday: Attendance locked.</h2>
            <p className="text-sm text-red-500 mt-1">School is closed on Sundays. You cannot mark attendance.</p>
          </div>
        )}

        {classDetails && isHoliday && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 mb-6 flex flex-col items-center justify-center text-orange-600 shadow-sm animate-in fade-in zoom-in duration-300">
            <Lock className="w-12 h-12 mb-3" />
            <h2 className="text-lg md:text-xl font-bold">Holiday: {holiday.title}</h2>
            <p className="text-sm text-orange-500 mt-1">School is closed for this holiday. You cannot mark attendance.</p>
          </div>
        )}

        {classDetails && !(isSunday || isHoliday) && (
          <div className={`transition-all duration-300`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="w-full p-3 rounded-xl bg-white">
                <div className="bg-green-50 text-green-600 rounded-full w-12 h-12 flex items-center justify-center shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
                  <p className="text-xs text-gray-500">In Class</p>
                </div>
              </div>
              
              <div className="w-full p-3 rounded-xl bg-white">
                <div className="bg-green-100 text-green-700 rounded-full w-12 h-12 flex items-center justify-center shrink-0 font-bold text-xl">
                  P
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Present</p>
                  <p className="text-2xl font-bold text-gray-900">{presentCount}</p>
                  <p className="text-xs text-gray-500">{presentPercentage}%</p>
                </div>
              </div>

              <div className="w-full p-3 rounded-xl bg-white">
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

            <div className="w-full">
              <div className="w-[calc(100%+24px)] -mx-3 md:mx-0 md:w-full bg-transparent md:bg-white rounded-none md:rounded-2xl shadow-none md:shadow-sm border-none md:border md:border-gray-100 overflow-hidden">
                <div className="p-2 md:p-5 flex justify-between items-center border-b border-gray-200 md:border-gray-100">
                  <h3 className="font-bold text-gray-900 text-lg">{classDetails.name}</h3>
                  <span className="text-sm text-gray-500">Total Students: {totalStudents}</span>
                </div>
                
                <div className="flex flex-col divide-y divide-gray-50">
                  {classDetails.students.map((student, idx) => {
                    const status = attendance[student.id];
                    const isOnLeave = checkIfOnLeave(student.id, activeDate);
                    const shortRoll = student.rollNumber ? student.rollNumber.replace(/^132426/, '') : 'N/A';
                    
                    return (
                      <div key={student.id} className={`grid grid-cols-[auto_1fr_auto] gap-2 md:gap-3 items-center py-2 md:p-3 border-b border-gray-200 md:border-gray-50 last:border-0 transition-all duration-300 ease-in-out ${isLocked ? 'opacity-70' : 'hover:bg-gray-50'}`}>
                        <div 
                          className="w-10 h-10 md:w-10 md:h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-sm md:text-sm font-bold shrink-0 transition-all duration-300 cursor-pointer hover:bg-blue-100"
                          onClick={() => setSelectedStudentForCalendar(student)}
                        >
                          {student.name.charAt(0)}
                        </div>
                        <div 
                          className="flex flex-col min-w-0 cursor-pointer group" 
                          onClick={() => setSelectedStudentForCalendar(student)}
                        >
                          <span className="text-lg md:text-base font-bold truncate text-gray-900 group-hover:text-blue-600 transition-colors">{student.name}</span>
                          <span className="text-xs md:text-xs text-gray-500 truncate">Roll: {shortRoll}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {isOnLeave ? (
                            <div className="px-3 py-1.5 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-md text-xs font-medium">
                              On Leave
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => handleMark(student.id, 'Present')}
                                disabled={isLocked}
                                className={`w-12 h-12 md:w-10 md:h-10 rounded-md flex items-center justify-center font-bold text-base md:text-sm transition-all duration-300 ease-in-out ${
                                  status === 'Present' 
                                    ? 'bg-green-600 text-white shadow-sm scale-105' 
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
                                className={`w-12 h-12 md:w-10 md:h-10 rounded-md flex items-center justify-center font-bold text-base md:text-sm transition-all duration-300 ease-in-out ${
                                  status === 'Absent' 
                                    ? 'bg-red-500 text-white shadow-sm scale-105' 
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
                  {classDetails.students.length === 0 && (
                    <div className="py-8 text-center text-gray-500 text-sm">No students found in your class section.</div>
                  )}
                </div>
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="bg-blue-50 text-blue-800 p-3 rounded-xl text-sm flex items-start gap-2 flex-1">
                    <Info className="w-5 h-5 shrink-0" />
                    <p>Mark attendance for all students, then click 'Submit Today'.</p>
                  </div>
                  <button
                    onClick={handleLock}
                    disabled={isLocked}
                    className={`px-8 py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-base transition-colors ${
                      isLocked ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[#0B1E40] text-white hover:bg-blue-900 shadow-md'
                    }`}
                  >
                    <CheckCircle className="w-5 h-5" /> 
                    {isLocked ? 'Submitted' : 'Submit Today'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
            </div>
          </div>
          )}

          {/* Module 3: Leaves */}
          {classDetails && activeTab === 'leaves' && (
          <div id="leave-requests-section" className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-1 md:p-6 bg-gray-50/30">
                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                  {leaves.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
                      <p className="text-gray-500 font-medium">No leave requests from your class.</p>
                    </div>
                  ) : leaves.map((leave, i) => (
                    <div key={i} className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-bold text-gray-900">{leave.studentName}</h4>
                          <p className="text-xs text-gray-500 mt-1">From: {new Date(leave.fromDate).toLocaleDateString()} To: {new Date(leave.toDate).toLocaleDateString()}</p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide ${
                          leave.status === 'Pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          leave.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {leave.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100 mb-4">{leave.reason}</p>
                      
                      {leave.status === 'Pending' && (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleLeaveAction(leave.id, 'Approved')}
                            className="flex-1 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 py-2 rounded-xl text-xs font-bold transition-colors"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleLeaveAction(leave.id, 'Rejected')}
                            className="flex-1 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 py-2 rounded-xl text-xs font-bold transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
          </div>
          )}

          {/* Module 4: History */}
          {classDetails && activeTab === 'history' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-1 md:p-6 bg-gray-50/30">
                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
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
                  <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
                    <div className="flex items-center bg-white border border-gray-200 p-2 rounded-xl shadow-sm w-full">
                      <Search className="w-5 h-5 text-gray-400  shrink-0" />
                      <input 
                        type="text"
                        placeholder="Search Student..."
                        value={historySearchQuery}
                        onChange={(e) => setHistorySearchQuery(e.target.value)}
                        className="bg-transparent border-none text-sm font-medium text-gray-700 outline-none w-full px-3 py-1"
                      />
                    </div>
                    {historyViewMode === 'class' && (
                      <div className="flex items-center bg-white border border-gray-200 p-2 rounded-xl shadow-sm w-full md:w-auto shrink-0">
                        <Calendar className="w-5 h-5 text-gray-400  shrink-0" />
                        <input 
                          type="date"
                          value={searchDate}
                          onChange={(e) => setSearchDate(e.target.value)}
                          className="bg-transparent border-none text-sm font-medium text-gray-700 outline-none w-full px-3 py-1"
                        />
                      </div>
                    )}
                  </div>

                  {historyViewMode === 'class' && (
                    <>
                      {displayDates.map(date => {
                        const isExpanded = expandedDate === date;
                        
                        return (
                          <div key={date} className="overflow-hidden bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <div 
                              className="p-4 bg-gray-50 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors"
                              onClick={() => setExpandedDate(expandedDate === date ? null : date)}
                            >
                              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-500" /> 
                                {new Date(date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}
                              </h4>
                              <div className="flex items-center gap-3">
                                <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md border ${pastRecords[date]?.isLocked ? 'bg-gray-100 text-gray-600 border-gray-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                  {pastRecords[date]?.isLocked ? 'Locked' : 'Draft'}
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
                                  <div className="p-4 divide-y divide-gray-50 border-t border-gray-100">
                                    {groupedHistory[date]
                                      .filter((record: any) => !historySearchQuery || record.name.toLowerCase().includes(historySearchQuery.toLowerCase()) || (record.rollNumber && record.rollNumber.toLowerCase().includes(historySearchQuery.toLowerCase())))
                                      .map((record: any, idx: number) => (
                                      <div key={idx} className="flex justify-between items-center py-3 last:pb-1 first:pt-1">
                                        <div>
                                          <span className="text-sm font-medium text-gray-900 block">{record.name}</span>
                                          <span className="text-xs text-gray-500 mt-0.5 block">Roll No: {record.rollNumber || 'N/A'}</span>
                                        </div>
                                        <span className={
                                          record.status === 'Present' ? 'text-emerald-700 bg-emerald-50 px-3 py-1 rounded-md font-medium text-xs border border-emerald-100' : 
                                          record.status === 'Absent' ? 'text-red-700 bg-red-50 px-3 py-1 rounded-md font-medium text-xs border border-red-100' : 
                                          'text-yellow-700 bg-yellow-50 px-3 py-1 rounded-md font-medium text-xs border border-yellow-100'
                                        }>
                                          {record.status}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                      
                      {displayDates.length === 0 && (
                        <div className="p-8 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
                          <p className="text-gray-500 font-medium">No attendance history found.</p>
                        </div>
                      )}
                    </>
                  )}

                  {historyViewMode === 'individual' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-1 border border-gray-200 bg-white rounded-xl shadow-sm overflow-hidden h-[600px] flex flex-col">
                        <div className="bg-gray-50 border-b border-gray-200 p-4 shrink-0">
                          <h3 className="font-bold text-gray-800 text-sm">Select Student</h3>
                        </div>
                        <div className="overflow-y-auto flex-1 p-2 space-y-1">
                          {classDetails.students.filter(s => {
                            if (!historySearchQuery) return true;
                            const q = historySearchQuery.toLowerCase();
                            return s.name.toLowerCase().includes(q) || (s.rollNumber && s.rollNumber.toLowerCase().includes(q));
                          }).map(student => (
                            <button 
                              key={student.id} 
                              onClick={() => setSelectedStudentForCalendar(student)}
                              className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${selectedStudentForCalendar?.id === student.id ? 'bg-[#0B1E40] text-white' : 'hover:bg-gray-100'}`}
                            >
                              <div className="min-w-0">
                                <p className={`font-semibold truncate text-sm ${selectedStudentForCalendar?.id === student.id ? 'text-white' : 'text-gray-900'}`}>{student.name}</p>
                                {student.rollNumber && <p className={`text-xs truncate ${selectedStudentForCalendar?.id === student.id ? 'text-blue-200' : 'text-gray-500'}`}>Roll: {student.rollNumber}</p>}
                              </div>
                            </button>
                          ))}
                          {classDetails.students.length === 0 && (
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
                </div>
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
                   <button onClick={() => { setActiveTab('self'); setIsDrawerOpen(false); }} className={`w-full text-left p-4 rounded-xl font-bold flex items-center gap-3 transition-colors ${activeTab === 'self' ? 'bg-[#0B1E40] text-white shadow-md' : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-100'}`}>
                     <Fingerprint className="w-5 h-5" /> My Attendance
                   </button>
                   {classDetails && (
                     <>
                       <button onClick={() => { setActiveTab('mark'); setIsDrawerOpen(false); }} className={`w-full text-left p-4 rounded-xl font-bold flex items-center gap-3 transition-colors ${activeTab === 'mark' ? 'bg-[#0B1E40] text-white shadow-md' : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-100'}`}>
                         <CheckCircle className="w-5 h-5" /> Mark Class Attendance
                       </button>
                       <button onClick={() => { setActiveTab('history'); setIsDrawerOpen(false); }} className={`w-full text-left p-4 rounded-xl font-bold flex items-center gap-3 transition-colors ${activeTab === 'history' ? 'bg-[#0B1E40] text-white shadow-md' : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-100'}`}>
                         <History className="w-5 h-5" /> Class History
                       </button>
                       <button onClick={() => { setActiveTab('leaves'); setIsDrawerOpen(false); }} className={`w-full text-left p-4 rounded-xl font-bold flex items-center gap-3 transition-colors ${activeTab === 'leaves' ? 'bg-[#0B1E40] text-white shadow-md' : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-100'}`}>
                         <Calendar className="w-5 h-5" /> Leave Requests
                       </button>
                     </>
                   )}
                 </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
        </div>
      </div>
  );
}
