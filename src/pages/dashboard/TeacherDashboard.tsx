import React, { useState, useEffect } from "react";
import { GlassCard } from "../../components/ui/GlassCard";
import { BlurRevealText } from "../../components/ui/BlurRevealText";
import { useDailyThought } from "../../hooks/useDailyThought";
import {
  Users,
  ClipboardList,
  Clock,
  PlayCircle,
  Bell,
  Plane,
  X,
  Calendar,
  User
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Timetable, DayOfWeek } from "../../types";
import { useSuccess } from "../../context/SuccessContext";
import { getSystemDate } from "../../utils/dateUtils";
import { NotificationService } from "../../services/NotificationService";
import { useLiveNotifications } from "../../hooks/useLiveNotifications";

export function TeacherDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { triggerSuccess } = useSuccess();
  const dailyThought = useDailyThought();
  const { unreadCount } = useLiveNotifications();
  const [isClassTeacher, setIsClassTeacher] = useState(false);
  const [classDetails, setClassDetails] = useState("");
  const [classAttendancePercent, setClassAttendancePercent] = useState("N/A");
  const [pendingAssignments, setPendingAssignments] = useState<
    number | "No records"
  >("No records");
  const [todaySchedule, setTodaySchedule] = useState<
    { period: string; classInfo: string }[]
  >([]);

  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [leaveReason, setLeaveReason] = useState("");

  const [currentPeriodInfo, setCurrentPeriodInfo] = useState<{
    period: string;
    classInfo: string;
  }>({ period: "--", classInfo: "Free" });

  const [totalStudentsInClass, setTotalStudentsInClass] = useState<number | "N/A">("N/A");
  const [avgPerformance, setAvgPerformance] = useState<number | "N/A">("N/A");
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);

  useEffect(() => {
    const computeStats = () => {
      if (!currentUser) return;

      let isTodayAttendanceLocked = false;
      let foundClassId = "";

      // Check Class Teacher status
      const classes = JSON.parse(localStorage.getItem("ajps_classes") || "[]");
      let foundClass = false;
      for (const c of classes) {
        for (const s of c.sections) {
          if (s.classTeacherId === currentUser.id) {
            setIsClassTeacher(true);
            setClassDetails(`Class ${c.id}-${s.name}`);
            foundClass = true;
            foundClassId = `${c.id}-${s.id || s}`;

            const todayDateStr = getSystemDate().toISOString().split("T")[0];
            const allRecords = JSON.parse(
              localStorage.getItem("ajps_attendance") || "{}",
            );
            const todayRecord = allRecords[foundClassId]?.[todayDateStr];

            if (todayRecord) {
              isTodayAttendanceLocked = todayRecord.isLocked || false;
              if (todayRecord.records) {
                const total = Object.keys(todayRecord.records).length;
                const present = Object.values(todayRecord.records).filter(
                  (st: any) => st === "Present" || st === "Late",
                ).length;
                if (total > 0) {
                  setClassAttendancePercent(
                    Math.round((present / total) * 100).toString(),
                  );
                }
              }
            }

            // Total Students
            const users = JSON.parse(localStorage.getItem("ajps_users") || "[]");
            const classStudents = users.filter((u: any) => u.role === "Student" && u.classId === c.id && u.sectionId === s.id);
            setTotalStudentsInClass(classStudents.length);

            // Avg Performance (calculated based on results)
            const results = JSON.parse(localStorage.getItem("ajps_exam_results") || "[]");
            if (results.length > 0) {
               let totalMarks = 0;
               let count = 0;
               results.forEach((exam: any) => {
                   if (exam.status === 'Published' && exam.marks) {
                       classStudents.forEach((student: any) => {
                           if (exam.marks[student.id]) {
                               Object.values(exam.marks[student.id]).forEach((m: any) => {
                                   totalMarks += Number(m) || 0;
                                   count += 1;
                               });
                           }
                       });
                   }
               });
               setAvgPerformance(count > 0 ? Math.round(totalMarks / count) : "N/A");
            } else {
               setAvgPerformance("N/A");
            }

            // Leave requests for this class
            const allLeaves = JSON.parse(localStorage.getItem("ajps_leaves") || "[]");
            const classLeaves = allLeaves.filter((l: any) => l.classId === c.id && l.sectionId === s.id && l.status === "Pending");
            setLeaveRequests(classLeaves);
            
            break;
          }
        }
        if (foundClass) break;
      }

      // Check today's schedule
      const timetables: Timetable[] = JSON.parse(
        localStorage.getItem("ajps_timetables") || "[]",
      );
      const todayIndex = getSystemDate().getDay(); // 0 is Sunday, 1 is Monday
      const days: DayOfWeek[] = [
        "monday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ];
      const currentDay = todayIndex === 0 ? "monday" : days[todayIndex]; // Fallback to Monday if Sunday

      const schedule: { period: string; classInfo: string }[] = [];
      const periods = ["p1", "p2", "p3", "p4", "p5", "p6"];

      for (const p of periods) {
        let assignedClass = "";
        for (const tt of timetables) {
          if (
            tt.schedule[currentDay]?.[
            p as keyof (typeof tt.schedule)[typeof currentDay]
            ] === currentUser.id
          ) {
            assignedClass = `Class ${tt.classId}-${tt.sectionId}`;
            break;
          }
        }
        if (assignedClass) {
          schedule.push({ period: p.toUpperCase(), classInfo: assignedClass });
        }
      }

      setTodaySchedule(schedule);

      // Check Current Period Based on Time
      const systemTime = getSystemDate().toTimeString().substring(0, 5);
      const globalTimetable = JSON.parse(
        localStorage.getItem("ajps_global_timetable") || "[]",
      );

      let currentP = { period: "--", classInfo: "Free" };

      for (const row of globalTimetable) {
        if (row.type === "class") {
          if (systemTime >= row.startTime && systemTime <= row.endTime) {
            const match = schedule.find(
              (s) => s.period === row.label.replace("eriod ", "").toUpperCase(),
            );
            if (match) {
              currentP = { period: row.label, classInfo: match.classInfo };
            } else {
              currentP = { period: row.label, classInfo: "Free" };
            }
          }
        }
      }

      setCurrentPeriodInfo(currentP);

      // Automated Alert: Missing Attendance
      if (isClassTeacher && !isTodayAttendanceLocked) {
        const p2Row = globalTimetable.find((r: any) => r.label === "Period 2");
        if (p2Row && systemTime > p2Row.endTime) {
          const users = JSON.parse(localStorage.getItem("ajps_users") || "[]");
          const admins = users.filter((u: any) => u.role === "Admin");

          const lastAlertStr = localStorage.getItem(
            `ajps_attendance_alert_${currentUser.id}_${getSystemDate().toISOString().split("T")[0]}`,
          );

          if (!lastAlertStr) {
            NotificationService.sendNotification({
              recipientIds: admins.map((a: any) => a.id),
              title: "Attendance Not Submitted",
              message: `${currentUser.name} has not submitted attendance for ${classDetails}.`,
              type: "warning",
              actionPath: "/admin/attendance",
              actionLabel: "View",
            });
            localStorage.setItem(
              `ajps_attendance_alert_${currentUser.id}_${getSystemDate().toISOString().split("T")[0]}`,
              "sent",
            );
          }
        }
      }

      const exams = JSON.parse(localStorage.getItem("ajps_exams") || "[]");
      const toReview = exams.filter(
        (e: any) => e.teacherId === currentUser.id && e.status === "Needs Review",
      ).length;
      setPendingAssignments(toReview > 0 ? toReview : 0);
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

  const todayDate = getSystemDate();
  const dateOptions: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "2-digit",
    year: "numeric"
  };
  const formattedDate = todayDate.toLocaleDateString("en-US", dateOptions);
  const dayName = todayDate.toLocaleDateString("en-US", { weekday: "long" });

  const handleApplyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromDate || !toDate || !leaveReason) return;

    const allLeaves = JSON.parse(localStorage.getItem("ajps_leaves") || "[]");
    const newLeave = {
      id: `lv-${Date.now()}`,
      studentId: currentUser?.id,
      studentName: currentUser?.name,
      classId: "",
      sectionId: "",
      fromDate,
      toDate,
      reason: leaveReason,
      status: "Pending",
      date: new Date().toISOString().split("T")[0],
      role: "Teacher",
    };

    allLeaves.push(newLeave);
    localStorage.setItem("ajps_leaves", JSON.stringify(allLeaves));

    triggerSuccess("Leave Application Submitted to Admin");
    setIsLeaveModalOpen(false);
    setFromDate("");
    setToDate("");
    setLeaveReason("");
  };

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
              text={`${currentUser?.name || "Teacher"}${currentUser?.rollNumber ? ` | ${currentUser.rollNumber}` : ""} 👋`}
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

      {/* Phase 5: Anti-Overlap Stat Cards (4-Column Grid) */}
      <div className="stats-grid-responsive z-20 grid grid-cols-2 md:grid-cols-4 w-full gap-4">
        {/* Card 1: Class Assigned & Total Students */}
        <div className="stat-card stat-card-glass flex flex-col justify-center gap-2 min-w-0 overflow-hidden relative break-words">
          <p className="text-sm md:text-lg lg:text-xl font-bold break-words min-w-0 relative z-10 opacity-100 text-[#6B5E4E] uppercase tracking-[0.04em]">
            {isClassTeacher ? classDetails : "Class Assigned"}
          </p>
          <div className="flex items-center justify-between gap-2 w-full relative z-10 opacity-100 min-w-0">
            <h4 className="stat-number font-[700] text-gray-900 break-words min-w-0 opacity-100">
              {totalStudentsInClass}
            </h4>
            <div className="stat-icon-circle rounded-[10px] bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="stat-title text-[#22C55E] break-words min-w-0">Total Students</p>
        </div>

        {/* Card 2: Current Period */}
        <div className="stat-card stat-card-glass flex flex-col justify-center gap-2 min-w-0 overflow-hidden relative break-words">
          <p className="text-sm md:text-lg lg:text-xl font-bold break-words min-w-0 relative z-10 opacity-100 text-[#6B5E4E] uppercase tracking-[0.04em]">
            Current Period
          </p>
          <div className="flex items-center justify-between gap-2 w-full relative z-10 opacity-100 min-w-0">
            <h4 className="stat-number font-[700] text-gray-900 break-words min-w-0 opacity-100">
              {currentPeriodInfo.period}
            </h4>
            <div className="stat-icon-circle rounded-[10px] bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[12px] text-[#8B5E2E] break-words font-bold min-w-0">
            {currentPeriodInfo.classInfo}
          </p>
        </div>

        {/* Card 3: Class Avg Attendance */}
        <div className="stat-card stat-card-glass flex flex-col justify-center gap-2 min-w-0 overflow-hidden relative break-words">
          <p className="text-sm md:text-lg lg:text-xl font-bold break-words min-w-0 relative z-10 opacity-100 text-[#6B5E4E] uppercase tracking-[0.04em]">
            Class Avg Attendance
          </p>
          <div className="flex items-center justify-between gap-2 w-full relative z-10 opacity-100 min-w-0">
            <h4 className="stat-number font-[700] text-gray-900 break-words min-w-0 opacity-100">
              {classAttendancePercent}
              {classAttendancePercent !== "N/A" && "%"}
            </h4>
            <div className="stat-icon-circle rounded-[10px] bg-green-50 flex items-center justify-center text-green-600 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <p className="stat-title text-[#22C55E] break-words min-w-0">Today</p>
        </div>

        {/* Card 4: Avg Performance */}
        <div className="stat-card stat-card-glass flex flex-col justify-center gap-2 min-w-0 overflow-hidden relative break-words">
          <p className="text-sm md:text-lg lg:text-xl font-bold break-words min-w-0 relative z-10 opacity-100 text-[#6B5E4E] uppercase tracking-[0.04em]">
            Avg Performance
          </p>
          <div className="flex items-center justify-between gap-2 w-full relative z-10 opacity-100 min-w-0">
            <h4 className="stat-number font-[700] text-gray-900 break-words min-w-0 opacity-100">
              {avgPerformance}
              {avgPerformance !== "N/A" && "%"}
            </h4>
            <div className="stat-icon-circle rounded-[10px] bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
              <ClipboardList className="w-5 h-5" />
            </div>
          </div>
          <p className="stat-title text-[#8B5CF6] break-words min-w-0">Last Exam</p>
        </div>
      </div>
      <div className="space-y-6 flex-1 mt-20 relative z-10">
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <GlassCard className="p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800">Today's Schedule</h3>
            </div>
            {todaySchedule.length > 0 ? (
              <div className="space-y-3 flex-1 overflow-y-auto">
                {todaySchedule.map((s, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center p-3 rounded-xl border border-[#A05C2B]/20 bg-white/40 shadow-sm"
                  >
                    <span className="font-bold text-[#A05C2B] uppercase text-sm">
                      {s.period}
                    </span>
                    <span className="font-semibold text-gray-700 text-sm">
                      {s.classInfo}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 font-medium italic flex-1 flex items-center justify-center">
                No classes assigned for today.
              </div>
            )}
          </GlassCard>

          <GlassCard className="p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800">Leave Requests (Your Class)</h3>
              <button className="text-xs font-bold text-blue-600 hover:text-blue-800 uppercase tracking-wider">
                View All
              </button>
            </div>
            {leaveRequests.length > 0 ? (
              <div className="space-y-3 flex-1 overflow-y-auto">
                {leaveRequests.map((l, i) => (
                  <div key={i} className="flex justify-between items-center p-3 rounded-xl border border-gray-100 bg-white shadow-sm">
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{l.studentName}</p>
                      <p className="text-xs text-gray-500">{l.fromDate} to {l.toDate}</p>
                    </div>
                    <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">{l.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 font-medium italic flex-1 flex items-center justify-center">
                No pending leave requests.
              </div>
            )}
          </GlassCard>
        </section>
      </div>

      {/* Leave Application Modal */}
      {isLeaveModalOpen && (
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
      )}
    </div>
  );
}
