import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../../components/ui/GlassCard';
import { BlurRevealText } from '../../components/ui/BlurRevealText';
import { 
  Users, Briefcase, IndianRupee, Bell, Plane, X, 
  Calendar, Activity, AlertCircle, ChevronRight, LayoutGrid, User
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSuccess } from '../../context/SuccessContext';
import { useDailyThought } from '../../hooks/useDailyThought';
import { useLiveNotifications } from '../../hooks/useLiveNotifications';
import { getSystemDate } from '../../utils/dateUtils';

export function AdminDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { triggerSuccess } = useSuccess();
  const dailyThought = useDailyThought();
  const { notifications, unreadCount } = useLiveNotifications();
  
  const [stats, setStats] = useState({
    attendancePresent: 0,
    attendanceTotal: 0,
    attendancePercent: 0,
    staffPresent: 0,
    staffTotal: 0,
    revenue: 0,
    bestClassInfo: "N/A"
  });

  const [isBeforeP2, setIsBeforeP2] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [absentStaffList, setAbsentStaffList] = useState<any[]>([]);
  const [timingChangeAlert, setTimingChangeAlert] = useState<string | null>(null);

  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    const computeStats = () => {
      const users = JSON.parse(localStorage.getItem('ajps_users') || '[]');
      const students = users.filter((u: any) => u.role === 'Student');
      const teachers = users.filter((u: any) => u.role === 'Teacher');
      
      // Check if before P2
      const systemTime = getSystemDate().toTimeString().substring(0, 5);
      const globalTimetable = JSON.parse(localStorage.getItem("ajps_global_timetable") || "[]");
      const p2Row = globalTimetable.find((r: any) => r.label === "Period 2");
      const beforeP2 = p2Row && systemTime < p2Row.endTime;
      setIsBeforeP2(!!beforeP2);

      // Calculate Today's Attendance
      const todayDateStr = getSystemDate().toISOString().split("T")[0];
      const allRecords = JSON.parse(localStorage.getItem("ajps_attendance") || "{}");
      let presentStudents = 0;
      
      Object.keys(allRecords).forEach(classId => {
         const todayRecord = allRecords[classId]?.[todayDateStr];
         if (todayRecord && todayRecord.records) {
             presentStudents += Object.values(todayRecord.records).filter((st: any) => st === "Present" || st === "Late").length;
         }
      });

      const attPercent = students.length > 0 ? Math.round((presentStudents / students.length) * 100) : 0;

      // Check for Timing Change notices effective today
      const allNotices = JSON.parse(localStorage.getItem('ajps_notices') || '[]');
      const activeTimingNotice = allNotices.find((n: any) => n.templateType === 'change_timings' && n.effectiveDate === todayDateStr);
      if (activeTimingNotice) {
        setTimingChangeAlert("Timing change effective today. Update Timetable Engine periods.");
      }

      // Calculate Staff Present
      const allLeaves = JSON.parse(localStorage.getItem("ajps_leaves") || "[]");
      const absentStaff = teachers.filter((t: any) => {
          const hasLeave = allLeaves.some((l: any) => l.studentId === t.id && l.status === "Approved" && l.fromDate <= todayDateStr && l.toDate >= todayDateStr);
          return hasLeave; // For now just considering leave = absent. True system would cross check attendance.
      });
      setAbsentStaffList(absentStaff.map((t: any) => ({ ...t, reason: "(On Leave)" })));

      // Calculate Revenue
      let totalDues = 0;
      students.forEach((s: any) => {
          totalDues += Number(s.feeDues) || 0;
      });
      const expectedRevenue = students.length * 20000;
      const actualRevenue = expectedRevenue - totalDues;

      // Calculate Best Performing Class
      const results = JSON.parse(localStorage.getItem('ajps_exam_results') || '[]');
      let bestClass = "N/A";
      let bestAvg = 0;
      
      if (results.length > 0) {
          // Group by classId
          const classAverages: Record<string, {total: number, count: number}> = {};
          results.forEach((exam: any) => {
              if (exam.status === 'Published' && exam.marks) {
                  Object.keys(exam.marks).forEach(studentId => {
                      const st = students.find((s: any) => s.id === studentId);
                      if (st) {
                          const cid = `${st.classId}-${st.sectionId}`;
                          if (!classAverages[cid]) classAverages[cid] = { total: 0, count: 0 };
                          
                          Object.values(exam.marks[studentId]).forEach((m: any) => {
                              classAverages[cid].total += Number(m) || 0;
                              classAverages[cid].count += 1;
                          });
                      }
                  });
              }
          });
          
          Object.keys(classAverages).forEach(cid => {
              const avg = classAverages[cid].count > 0 ? (classAverages[cid].total / classAverages[cid].count) : 0;
              if (avg > bestAvg) {
                  bestAvg = avg;
                  bestClass = cid;
              }
          });
      }

      setStats({
        attendancePresent: presentStudents,
        attendanceTotal: students.length,
        attendancePercent: attPercent,
        staffPresent: teachers.length - absentStaff.length,
        staffTotal: teachers.length,
        revenue: actualRevenue > 0 ? actualRevenue : 0,
        bestClassInfo: bestAvg > 0 ? `${Math.round(bestAvg)}% / Class ${bestClass}` : "N/A"
      });

      setRecentActivities(
        notifications.slice(0, 4).map((n: any, idx: number) => ({
          id: n.id || idx,
          text: n.title || n.message,
          time: new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        }))
      );
    };

    computeStats();

    window.addEventListener('storage', computeStats);
    window.addEventListener('exams_updated', computeStats);
    window.addEventListener('ajps_users_updated', computeStats);
    window.addEventListener('ajps_leaves_updated', computeStats);
    window.addEventListener('new-notification', computeStats);

    return () => {
      window.removeEventListener('storage', computeStats);
      window.removeEventListener('exams_updated', computeStats);
      window.removeEventListener('ajps_users_updated', computeStats);
      window.removeEventListener('ajps_leaves_updated', computeStats);
      window.removeEventListener('new-notification', computeStats);
    };
  }, [notifications]);

  const today = new Date();
  const dateOptions: Intl.DateTimeFormatOptions = { month: 'short', day: '2-digit', year: 'numeric' };
  const formattedDate = today.toLocaleDateString('en-US', dateOptions);
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });

  return (
    <div className="h-full pb-24 animate-in fade-in transition-all duration-300 bg-transparent flex flex-col gap-6">
      {/* Phase 3: Hero Banner */}
      <div className="hero-responsive rounded-t-2xl rounded-b-none banner-left-fade relative overflow-hidden w-full">
        {/* Layer 0 — Background Image */}
        <div className="absolute inset-0 bg-[url('/school.png')] bg-cover bg-center" style={{ WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)', maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)' }} />
        
        {/* Layer 1 — Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-[rgba(0,0,0,0.60)] to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.50)] to-transparent pointer-events-none" />

          {/* Layer 1.5 — Bottom Fade */}
          <div 
            className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent pointer-events-none z-[3]"
          />

        {/* Top-Right Area: Apply Leave, Avatar, Bell */}
        <div className="absolute top-[16px] right-[16px] z-[60] hidden md:flex items-center gap-3 flex-row-reverse pointer-events-auto cursor-pointer">
          <button 
            onClick={() => window.dispatchEvent(new Event('open-notifications'))}
            className="relative w-11 h-11 top-btn-glass cursor-pointer pointer-events-auto transition hover:bg-white/70 rounded-2xl flex items-center justify-center"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#FF8C00] rounded-full animate-pulse" />
            )}
          </button>
          <button 
            onClick={() => navigate('/profile')}
            className="w-11 h-11 top-btn-glass overflow-hidden cursor-pointer pointer-events-auto p-0 rounded-2xl"
          >
            <User size={20} />
          </button>
        </div>

          {/* Layer 3 — Glass Date Card */}
          <div className="hidden md:flex absolute z-20 date-card-responsive glass-card-responsive text-white flex-col justify-center items-start shadow-lg pointer-events-none w-fit px-4">
            <span className="text-[14px] font-bold text-white leading-tight whitespace-nowrap">{formattedDate}</span>
            <span className="text-[12px] opacity-90">{dayName}</span>
          </div>

        {/* Layer 2 — Bottom-Left Greeting Content */}
        <div className="hero-content z-10 relative pointer-events-none">
          <p className="hero-greeting font-[400] text-white mb-1">Good Morning,</p>
          <BlurRevealText 
            className="hero-name font-[700] text-white leading-tight text-xl md:text-3xl" 
            initialDelay={0.5} 
            text={`${currentUser?.name || 'Administrator'} 👋`} 
          />
          <p className="hero-subtitle text-white/80 mt-0.5">School Management Dashboard</p>
          <p className="text-white/80 italic text-sm mt-3 max-w-lg">
            {dailyThought}
          </p>
        </div>
      </div>

      {timingChangeAlert && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mx-4 md:mx-0 rounded-r-xl shadow-sm animate-in fade-in slide-in-from-top-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-red-800">Action Required</h3>
            <p className="text-sm text-red-700 mt-1">{timingChangeAlert}</p>
          </div>
        </div>
      )}

        {/* Phase 5: Anti-Overlap Stat Cards (4-Column Grid) */}
        <div className="stats-grid-responsive z-20 grid grid-cols-2 md:grid-cols-4 w-full gap-4">
          
        {/* Card 1: Today's Attendance */}
        <div className="stat-card stat-card-glass flex flex-col justify-center gap-2 min-w-0 overflow-hidden relative break-words">
          <p className="text-sm md:text-lg lg:text-xl font-bold break-words min-w-0 relative z-10 opacity-100 text-[#6B5E4E] uppercase tracking-[0.04em]">Today's Attendance</p>
          <div className="flex items-center justify-between gap-2 w-full relative z-10 opacity-100 min-w-0">
            <h4 className="stat-number font-[700] text-gray-900 break-words min-w-0 opacity-100">
              {isBeforeP2 ? "Pending..." : `${stats.attendancePercent}%`}
            </h4>
            <div className="stat-icon-circle rounded-[10px] bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="stat-title text-[#22C55E] break-words min-w-0">
            {isBeforeP2 ? "Waiting for P2..." : `${stats.attendancePresent} / ${stats.attendanceTotal} (Whole School)`}
          </p>
        </div>

        {/* Card 2: Staff Present */}
        <div 
          className="stat-card stat-card-glass flex flex-col justify-center gap-2 min-w-0 overflow-hidden relative cursor-pointer hover:shadow-md transition-shadow break-words"
          onClick={() => setIsStaffModalOpen(true)}
        >
          <p className="text-sm md:text-lg lg:text-xl font-bold break-words min-w-0 relative z-10 opacity-100 text-[#6B5E4E] uppercase tracking-[0.04em]">Staff Present</p>
          <div className="flex items-center justify-between gap-2 w-full relative z-10 opacity-100 min-w-0">
            <h4 className="stat-number font-[700] text-gray-900 break-words min-w-0 opacity-100">
              {isBeforeP2 ? "Pending..." : `${stats.staffPresent} / ${stats.staffTotal}`}
            </h4>
            <div className="stat-icon-circle rounded-[10px] bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <p className="stat-title text-[#8B5CF6] break-words min-w-0">Click to view absent staff</p>
        </div>

        {/* Card 3: Fee Collected */}
        <div className="stat-card stat-card-glass flex flex-col justify-center gap-2 min-w-0 overflow-hidden relative break-words">
          <p className="text-sm md:text-lg lg:text-xl font-bold break-words min-w-0 relative z-10 opacity-100 text-[#6B5E4E] uppercase tracking-[0.04em]">Fee Collected</p>
          <div className="flex items-center justify-between gap-2 w-full relative z-10 opacity-100 min-w-0">
            <h4 className="stat-number font-[700] text-gray-900 break-words min-w-0 opacity-100">₹{stats.revenue.toLocaleString('en-IN')}</h4>
            <div className="stat-icon-circle rounded-[10px] bg-orange-50 flex items-center justify-center text-orange-600 shrink-0">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <p className="stat-title text-[#F59E0B] break-words min-w-0">Total Received</p>
        </div>

        {/* Card 4: Best Performing Class */}
        <div className="stat-card stat-card-glass flex flex-col justify-center gap-2 min-w-0 overflow-hidden relative break-words">
          <p className="text-sm md:text-lg lg:text-xl font-bold break-words min-w-0 relative z-10 opacity-100 text-[#6B5E4E] uppercase tracking-[0.04em]">Best Class</p>
          <div className="flex items-center justify-between gap-2 w-full relative z-10 opacity-100 min-w-0">
            <h4 className="stat-number font-[700] text-gray-900 break-words min-w-0 opacity-100">{stats.bestClassInfo}</h4>
            <div className="stat-icon-circle rounded-[10px] bg-green-50 flex items-center justify-center text-green-600 shrink-0">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <p className="stat-title text-[#22C55E] break-words min-w-0">In Last Exam</p>
        </div>

        </div>
      <div className="space-y-6 flex-1 mt-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
          {/* Recent Activity */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800">Recent Activity</h3>
              <button 
                onClick={() => window.dispatchEvent(new Event('open-notifications'))}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 uppercase tracking-wider"
              >
                View All
              </button>
            </div>
            <div className="space-y-4">
              {recentActivities.length > 0 ? recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0 mt-0.5">
                    <Activity className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{activity.text}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              )) : (
                <p className="text-gray-400 text-sm text-center py-4 italic">No recent activities.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Staff Absence Modal */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#A05C2B]" /> Absent Staff
              </h3>
              <button
                onClick={() => setIsStaffModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {absentStaffList.length === 0 ? (
                <p className="text-center text-gray-500 py-4 italic">All staff are present today.</p>
              ) : (
                <div className="space-y-3">
                  {absentStaffList.map((staff, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 rounded-xl border border-gray-100 bg-white shadow-sm">
                      <div className="flex items-center gap-3">
                        <img src={staff.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(staff.name)}`} alt={staff.name} className="w-10 h-10 rounded-full border border-gray-200" />
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{staff.name}</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-md">{staff.reason}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}