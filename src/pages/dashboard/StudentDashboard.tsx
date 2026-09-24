import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GlassCard } from "../../components/ui/GlassCard";
import { BlurRevealText } from "../../components/ui/BlurRevealText";
import { useDailyThought } from "../../hooks/useDailyThought";
import {
  CalendarCheck,
  Wallet,
  Percent,
  Award,
  FileText,
  ChevronRight,
  Plane,
  X,
  Search,
  Filter,
  AlertCircle,
  CheckCircle,
  Calendar,
  ClipboardList,
  BookOpen,
  Bell,
  User,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Notice } from "../../types";
import { useSuccess } from "../../context/SuccessContext";
import { NotificationService } from "../../services/NotificationService";
import { useFees } from "../../hooks/useFees";
import { useLiveNotifications } from "../../hooks/useLiveNotifications";

// Helper for subject icons
const getSubjectIcon = (name: string) => {
  if (name.toLowerCase().includes("math"))
    return <Percent className="w-4 h-4" />;
  if (name.toLowerCase().includes("sci")) return <Award className="w-4 h-4" />;
  if (name.toLowerCase().includes("eng"))
    return <BookOpen className="w-4 h-4" />;
  return <FileText className="w-4 h-4" />;
};

export function StudentDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { triggerSuccess } = useSuccess();
  const dailyThought = useDailyThought();
  const { unreadCount } = useLiveNotifications();

  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [leaveReason, setLeaveReason] = useState("");

  const [attendancePercent, setAttendancePercent] = useState("N/A");
  const [averageMarks, setAverageMarks] = useState("N/A");
  const [weakSubject, setWeakSubject] = useState("N/A");
  const [pendingAssignments, setPendingAssignments] = useState<
    number | "No records"
  >("No records");

  const { getStudentFeeBreakdown } = useFees();
  const feeDues = getStudentFeeBreakdown(currentUser?.id || "").outstanding;

  const [subjects, setSubjects] = useState<{ name: string; marks: number }[]>(
    [],
  );
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [recentNotices, setRecentNotices] = useState<Notice[]>([]);

  useEffect(() => {
    const computeStats = () => {
      // 1. Attendance
      if (
        currentUser?.attendanceHistory &&
        currentUser.attendanceHistory.length > 0
      ) {
        const history = currentUser.attendanceHistory;
        const total = history.length;
        const present = history.filter((h: any) => h.status === "Present").length;
        const percent = Math.round((present / total) * 100);
        setAttendancePercent(percent.toString());
      } else {
        setAttendancePercent("N/A");
      }

      // 2. Subjects & Average Marks
      const results = JSON.parse(
        localStorage.getItem("ajps_exam_results") || "[]",
      );
      let totalMarks = 0;
      let count = 0;
      const subjMap: Record<string, number> = {};

      results.forEach((exam: any) => {
        if (
          exam.status === "Published" &&
          exam.marks &&
          exam.marks[currentUser?.id]
        ) {
          const studentMarks = exam.marks[currentUser.id];
          Object.keys(studentMarks).forEach((sub) => {
            const m = Number(studentMarks[sub]) || 0;
            totalMarks += m;
            count++;
            subjMap[sub] = m;
          });
        }
      });

      const realSubjects = Object.keys(subjMap).map((k) => ({
        name: k,
        marks: subjMap[k],
      }));
      setSubjects(realSubjects);

      if (count > 0) {
        const avg = Math.round(totalMarks / count);
        setAverageMarks(avg.toString());
      } else {
        setAverageMarks("N/A");
      }

      if (realSubjects.length > 0) {
         const minSub = realSubjects.reduce((prev, curr) => (prev.marks < curr.marks ? prev : curr));
         setWeakSubject(minSub.name);
      } else {
         setWeakSubject("N/A");
      }

      // 3. Events / Assignments
      const exams = JSON.parse(localStorage.getItem("ajps_exams") || "[]");
      const myExams = exams.filter(
        (e: any) =>
          e.targetClasses?.includes(currentUser?.classId) || exams.length > 0,
      );
      setUpcomingEvents(myExams.slice(0, 3));
      setPendingAssignments(myExams.length > 0 ? myExams.length : "No records");

      // 4. Notices
      const allNotices = JSON.parse(localStorage.getItem("ajps_notices") || "[]");
      const myNotices = allNotices.filter(
        (n: Notice) => n.audienceRole === "Student" || n.audienceRole === "Both",
      );
      setRecentNotices(myNotices.slice(0, 3));
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
  }, [currentUser]);

  // For the horizontal progress bars transition
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setTimeout(() => setMounted(true), 100);
  }, []);

  // Format date for Floating Date Card
  const today = new Date();
  const dateOptions: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "2-digit",
    year: "numeric"
  };
  const formattedDate = today.toLocaleDateString("en-US", dateOptions);
  const dayName = today.toLocaleDateString("en-US", { weekday: "long" });

  const shortRollNo = currentUser?.rollNumber?.replace(/^132426/, '') || "0000";

  const handleApplyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromDate || !toDate || !leaveReason) return;

    const allLeaves = JSON.parse(localStorage.getItem("ajps_leaves") || "[]");
    const newLeave = {
      id: `lv-${Date.now()}`,
      studentId: currentUser?.id,
      studentName: currentUser?.name,
      classId: currentUser?.classId,
      sectionId: currentUser?.sectionId,
      fromDate,
      toDate,
      reason: leaveReason,
      status: "Pending",
      date: new Date().toISOString().split("T")[0],
      role: "Student",
    };

    allLeaves.push(newLeave);
    localStorage.setItem("ajps_leaves", JSON.stringify(allLeaves));
    window.dispatchEvent(new Event('ajps_leaves_updated'));

    const users = JSON.parse(localStorage.getItem("ajps_users") || "[]");
    const classTeacher = users.find((u: any) => 
      u.role === "Teacher" && 
      u.isClassTeacher && 
      (u.classTeacherClass === currentUser?.classId || u.classTeacherClass === currentUser?.className || u.classId === currentUser?.classId)
    );
    
    let recipientId = classTeacher?.id;
    if (!recipientId) {
      const admin = users.find((u: any) => u.role === "Admin");
      recipientId = admin?.id;
    }

    if (recipientId) {
      NotificationService.sendNotification({
        recipientIds: [recipientId],
        title: "New Leave Request",
        message: `${currentUser?.name} has applied for leave from ${fromDate} to ${toDate}.`,
        type: "LEAVE_REQUEST",
        actionPath: "/attendance#leaves",
        actionLabel: "View Request",
      });
      window.dispatchEvent(new Event("new-notification"));
    }

    triggerSuccess("Leave Application Submitted");
    setIsLeaveModalOpen(false);
    setFromDate("");
    setToDate("");
    setLeaveReason("");
  };

  return (
    <div className="h-full pb-24 animate-in fade-in transition-all duration-300 bg-transparent flex flex-col gap-6">
        {/* Phase 3: Hero Area */}
        <div className="hero-responsive rounded-t-2xl rounded-b-none banner-left-fade relative overflow-hidden w-full">
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
            <button
              onClick={() => setIsLeaveModalOpen(true)}
              className="top-btn-glass px-[16px] py-[10px] text-[13px] font-[700] flex items-center gap-2 cursor-pointer pointer-events-auto transition hover:bg-white/70"
            >
              <Plane size={16} /> Apply Leave
            </button>
          </div>

          {/* Layer 3 — Glass Date Card */}
          <div className="hidden md:flex absolute z-20 date-card-responsive glass-card-responsive text-white flex-col justify-center items-start shadow-lg pointer-events-none w-fit px-4">
            <span className="text-[14px] font-bold text-white leading-tight whitespace-nowrap">
              {formattedDate}
            </span>
            <span className="text-[12px] opacity-90">{dayName}</span>
          </div>

          {/* Layer 2 — Bottom-Left Greeting Content */}
          <div className="hero-content z-10 relative pointer-events-none">
            <p className="hero-greeting font-[400] text-white mb-1">
              Good Morning,
            </p>
            <h1 className="hero-name text-white leading-tight text-2xl md:text-4xl font-extrabold mb-1">
              <BlurRevealText
                initialDelay={0.5}
                text={`${currentUser?.name || "Student"}${currentUser?.rollNumber ? ` | ${currentUser.rollNumber}` : ""} 👋`}
              />
            </h1>
            <p className="hero-subtitle text-white/80 mt-0.5">
              Welcome back to Amar Jyoti Public School
            </p>
            <p className="text-white/80 italic text-sm mt-3 max-w-lg">
              {dailyThought}
            </p>
          </div>
        </div>
             {/* Phase 5: Anti-Overlap Stat Cards (2-Column Grid) */}
        <div className="stats-grid-responsive z-20 grid grid-cols-2 md:grid-cols-4 w-full gap-4">
          {/* Card 1: Avg Attendance */}
          <div className="stat-card stat-card-glass flex flex-col justify-center gap-2 min-w-0 overflow-hidden relative break-words">
            <p className="text-sm md:text-lg lg:text-xl font-bold break-words min-w-0 relative z-10 opacity-100 text-[#6B5E4E] uppercase tracking-[0.04em]">
              Avg Attendance
            </p>
            <div className="flex items-center justify-between gap-2 w-full relative z-10 opacity-100 min-w-0">
              <h4 className="stat-number font-[700] text-gray-900 break-words min-w-0 opacity-100">
                {attendancePercent}
                {attendancePercent !== "N/A" && "%"}
              </h4>
              <div className="stat-icon-circle rounded-[10px] bg-green-50 flex items-center justify-center text-green-600 shrink-0">
                <CalendarCheck className="w-5 h-5" />
              </div>
            </div>
            <p className="stat-title text-[#22C55E] break-words min-w-0">This Month</p>
          </div>

          {/* Card 2: Fee Dues */}
          <div className="stat-card stat-card-glass flex flex-col justify-center gap-2 min-w-0 overflow-hidden relative break-words">
            <p className="text-sm md:text-lg lg:text-xl font-bold break-words min-w-0 relative z-10 opacity-100 text-[#6B5E4E] uppercase tracking-[0.04em]">
              Fee Dues
            </p>
            <div className="flex items-center justify-between gap-2 w-full relative z-10 opacity-100 min-w-0">
              <h4 className="stat-number font-[700] text-gray-900 break-words min-w-0 opacity-100">
                ₹{Number(feeDues).toLocaleString('en-IN')}
              </h4>
              <div className="stat-icon-circle rounded-[10px] bg-orange-50 flex items-center justify-center text-orange-600 shrink-0">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <p className="stat-title text-[#F59E0B] break-words min-w-0">Pending</p>
          </div>

          {/* Card 3: Score in Last Exam */}
          <div className="stat-card stat-card-glass flex flex-col justify-center gap-2 min-w-0 overflow-hidden relative break-words">
            <p className="text-sm md:text-lg lg:text-xl font-bold break-words min-w-0 relative z-10 opacity-100 text-[#6B5E4E] uppercase tracking-[0.04em]">
              Score in Last Exam
            </p>
            <div className="flex items-center justify-between gap-2 w-full relative z-10 opacity-100 min-w-0">
              <h4 className="stat-number font-[700] text-gray-900 break-words min-w-0 opacity-100">
                {averageMarks}
                {averageMarks !== "N/A" && "%"}
              </h4>
              <div className="stat-icon-circle rounded-[10px] bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                <Award className="w-5 h-5" />
              </div>
            </div>
            <p className="stat-title text-[#8B5CF6] break-words min-w-0">Overall Average</p>
          </div>

          {/* Card 4: Weak Subject */}
          <div className="stat-card stat-card-glass flex flex-col justify-center gap-2 min-w-0 overflow-hidden relative break-words">
            <p className="text-sm md:text-lg lg:text-xl font-bold break-words min-w-0 relative z-10 opacity-100 text-[#6B5E4E] uppercase tracking-[0.04em]">
              Weakest Subject
            </p>
            <div className="flex items-center justify-between gap-2 w-full relative z-10 opacity-100 min-w-0">
              <h4 className="stat-number font-[700] text-gray-900 break-words min-w-0 opacity-100">
                {weakSubject}
              </h4>
              <div className="stat-icon-circle rounded-[10px] bg-red-50 flex items-center justify-center text-red-600 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>
            <p className="stat-title text-[#EF4444] break-words min-w-0">Needs Attention</p>
          </div>
        </div>

      <div className="space-y-6 flex-1 mt-20 relative z-10">
        {/* Step 4: Upcoming Events & Recent Notices */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
          {/* Upcoming Events */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800">Upcoming Events</h3>
              <button className="text-xs font-medium text-[#A05C2B] hover:underline">
                View All
              </button>
            </div>

            <div className="space-y-4">
              {upcomingEvents.length === 0 ? (
                <div className="text-center text-sm text-gray-500 py-4">
                  No upcoming events.
                </div>
              ) : (
                upcomingEvents.map((event, i) => {
                  const edate = new Date(
                    event.startDate || Date.now() + i * 86400000,
                  );
                  const day = edate.toLocaleDateString("en-GB", {
                    day: "2-digit",
                  });
                  const month = edate
                    .toLocaleDateString("en-GB", { month: "short" })
                    .toUpperCase();

                  return (
                    <div
                      key={i}
                      className="flex items-center gap-4 group cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex flex-col items-center justify-center shrink-0 transition-colors group-hover:bg-amber-100">
                        <span className="text-[16px] font-black text-[#A05C2B] leading-none">
                          {day}
                        </span>
                        <span className="text-[10px] font-bold text-amber-700 mt-0.5">
                          {month}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-900 group-hover:text-[#A05C2B] transition-colors line-clamp-1">
                          {event.title || "Event"}
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {event.type || "Event"}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Recent Notices */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800">Recent Notices</h3>
              <button
                className="text-xs font-medium text-[#A05C2B] hover:underline"
                onClick={() => navigate("/notices")}
              >
                View All
              </button>
            </div>

            <div className="space-y-0">
              {recentNotices.length === 0 ? (
                <div className="text-center text-sm text-gray-500 py-4">
                  No recent notices.
                </div>
              ) : (
                recentNotices.map((notice, i) => (
                  <div
                    key={notice.id}
                    onClick={() => navigate("/notices")}
                    className="flex items-center gap-4 p-3 -mx-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 text-blue-600 group-hover:scale-110 transition-transform duration-300">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0 pr-2">
                      <h4 className="text-sm font-semibold text-gray-900 truncate">
                        {notice.title}
                      </h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {new Date(notice.datePosted).toLocaleDateString()}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-bold text-gray-800 mb-3 ml-1">
            Subject Overview
          </h3>
          <div className="subject-overview-responsive overflow-x-auto scrollbar-hide pb-4">
            <div className="subject-grid">
              {subjects.map((subj, i) => (
                <div
                  key={i}
                  className="subject-card bg-white rounded-2xl shadow-sm border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                      {getSubjectIcon(subj.name)}
                    </div>
                    <h4 className="text-xs font-bold text-gray-700 truncate">
                      {subj.name}
                    </h4>
                  </div>
                  <div className="flex items-end justify-between mb-1">
                    <span className="text-xl font-black text-gray-900">
                      {subj.marks}%
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium mb-1 opacity-0">
                      80%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all ease-out"
                      style={{
                        width: mounted ? `${subj.marks}%` : "0%",
                        backgroundColor:
                          subj.marks >= 90
                            ? "#8b5cf6"
                            : subj.marks >= 75
                              ? "#10b981"
                              : "#f59e0b",
                        transitionDuration: "1.5s",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Leave Application Modal */ }
  {
    isLeaveModalOpen && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Plane className="w-5 h-5 text-[#A05C2B]" /> Apply for Leave
            </h3>
            <button
              onClick={() => setIsLeaveModalOpen(false)}
              className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6">
            <form onSubmit={handleApplyLeave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1.5">
                    From Date
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split("T")[0]}
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:ring-2 focus:ring-[#A05C2B]/30 outline-none text-gray-700 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1.5">
                    To Date
                  </label>
                  <input
                    type="date"
                    required
                    min={fromDate || new Date().toISOString().split("T")[0]}
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:ring-2 focus:ring-[#A05C2B]/30 outline-none text-gray-700 shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1.5">
                  Reason for Leave
                </label>
                <textarea
                  required
                  placeholder="Please specify your reason..."
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-[#A05C2B]/30 outline-none text-gray-700 shadow-sm h-24 resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-[#A05C2B] text-white rounded-xl py-3 text-sm font-bold shadow-md hover:bg-[#8B5E2E] hover:shadow-lg transition-all active:scale-[0.98]"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  }
    </div >
  );
}
