import React, { useState, useEffect } from "react";
import { GlassCard } from "../../components/ui/GlassCard";
import {
  Calendar,
  FileText,
  PieChart,
  Send,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Plane,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { NotificationService } from "../../services/NotificationService";
import { useSuccess } from "../../context/SuccessContext";
import { getSystemDate } from "../../utils/dateUtils";
import { AttendanceCalendar } from "../../components/attendance/AttendanceCalendar";
import { motion, AnimatePresence } from "framer-motion";

export function StudentAttendance() {
  const { currentUser } = useAuth();
  const { triggerSuccess } = useSuccess();

  const [attendanceSearchDate, setAttendanceSearchDate] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "history">(
    "overview",
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [leaveReason, setLeaveReason] = useState("");

  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!currentUser?.id) return;
    const parsedA = JSON.parse(
      localStorage.getItem("ajps_attendance") || "{}"
    );
    const allRecords = parsedA && typeof parsedA === 'object' ? parsedA : {};
    const history: any[] = [];

    Object.keys(allRecords).forEach((classKey) => {
      const dates = allRecords[classKey];
      Object.keys(dates).forEach((dateStr) => {
        const dateData = dates[dateStr];
        if (dateData?.records && dateData.records[currentUser.id]) {
          history.push({
            date: dateStr,
            status: dateData.records[currentUser.id],
          });
        }
      });
    });

    const leaves = JSON.parse(localStorage.getItem("ajps_leaves") || "[]");
    leaves.filter((l: any) => l.studentId === currentUser.id && l.status === "Approved").forEach((l: any) => {
      let current = new Date(l.fromDate);
      const end = new Date(l.toDate);
      while (current <= end) {
        const dateStr = current.toISOString().split("T")[0];
        const existingIdx = history.findIndex(h => h.date === dateStr);
        if (existingIdx !== -1) {
          history[existingIdx].status = "Leave";
        } else {
          history.push({ date: dateStr, status: "Leave" });
        }
        current.setDate(current.getDate() + 1);
      }
    });

    setAttendanceHistory(history);
  }, [currentUser]);

  const totalDays = attendanceHistory.length;
  const presentDays = attendanceHistory.filter(
    (h: any) => h.status === "Present",
  ).length;
  const absentDays = attendanceHistory.filter(
    (h: any) => h.status === "Absent",
  ).length;
  const leaveDays = attendanceHistory.filter(
    (h: any) => h.status === "Leave" || h.status === "On Leave",
  ).length;

  const percentage =
    totalDays === 0 ? 0 : Math.round((presentDays / totalDays) * 100);

  const handleApplyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromDate || !toDate || !leaveReason) return;

    const allLeaves = JSON.parse(localStorage.getItem("ajps_leaves") || "[]");
    const newLeave = {
      id: Math.random().toString(36).substring(2, 9),
      studentId: currentUser?.id,
      studentName: currentUser?.name,
      classId: currentUser?.classId,
      sectionId: currentUser?.sectionId,
      fromDate: fromDate,
      toDate: toDate,
      reason: leaveReason,
      status: "Pending",
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
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-[#1F2937] tracking-tight flex items-center gap-2">
            <Calendar className="w-6 h-6 text-[#A05C2B]" /> My Attendance
          </h1>
          <p className="text-sm font-semibold text-gray-500 mt-1">
            Track your daily presence and apply for leave.
          </p>
        </div>
        <div className="hidden">{/* Removed flat tab buttons */}</div>
      </div>

      <div className="mb-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Select View</label>
        <div className="relative md:w-64">
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as any)}
            className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-800 text-sm font-medium rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0B1E40]/30 shadow-sm transition-all"
          >
            <option value="overview">Overview</option>
            <option value="history">History</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Module 1: Overview */}
        {activeTab === "overview" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 md:p-6 bg-gray-50/30">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <GlassCard className="p-5 text-center bg-white/40 border-white/50">
                      <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-1">
                        Overall
                      </p>
                      <p className="text-3xl font-black text-[#A05C2B]">
                        {percentage}%
                      </p>
                    </GlassCard>
                    <GlassCard className="p-5 text-center bg-white/40 border-white/50">
                      <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-1">
                        Total
                      </p>
                      <p className="text-2xl font-black text-gray-700">
                        {totalDays}
                      </p>
                    </GlassCard>
                    <GlassCard className="p-5 text-center bg-white/40 border-white/50">
                      <p className="text-[11px] font-black text-emerald-400 uppercase tracking-wider mb-1">
                        Present
                      </p>
                      <p className="text-2xl font-black text-emerald-600">
                        {presentDays}
                      </p>
                    </GlassCard>
                    <GlassCard className="p-5 text-center bg-white/40 border-white/50">
                      <p className="text-[11px] font-black text-red-400 uppercase tracking-wider mb-1">
                        Absent
                      </p>
                      <p className="text-2xl font-black text-red-600">
                        {absentDays}
                      </p>
                    </GlassCard>
                  </div>
                </div>
                <div className="lg:col-span-1">
                  <GlassCard className="p-6 bg-[#FDF7EE]/80 border-[#A05C2B]/20 text-center flex flex-col justify-center h-full">
                    <div className="w-16 h-16 bg-[#A05C2B]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Plane className="w-8 h-8 text-[#A05C2B]" />
                    </div>
                    <h3 className="font-black text-[#1F2937] mb-2">
                      Need a break?
                    </h3>
                    <p className="text-xs text-gray-600 font-semibold mb-6">
                      Apply for leave here. Your class teacher will be notified
                      immediately.
                    </p>
                    <button
                      onClick={() => setIsLeaveModalOpen(true)}
                      className="w-full bg-[#A05C2B] text-white py-3 rounded-xl font-bold hover:bg-[#8e5226] transition-colors shadow-sm"
                    >
                      Apply for Leave
                    </button>
                  </GlassCard>
                </div>
              </div>
            </div>
        </div>
        )}

        {/* Module 2: History */}
        {activeTab === "history" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 md:p-6 bg-white animate-in fade-in zoom-in-95 duration-300">
              <AttendanceCalendar attendanceRecords={attendanceHistory} />
            </div>
        </div>
        )}
      </div>

      {/* Leave Application Modal */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-black text-gray-800 flex items-center gap-2">
                <Plane className="w-5 h-5 text-[#A05C2B]" /> Apply for Leave
              </h3>
              <button
                onClick={() => setIsLeaveModalOpen(false)}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
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
                      min={getSystemDate().toISOString().split("T")[0]}
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-[#A05C2B]/30 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1.5">
                      To Date
                    </label>
                    <input
                      type="date"
                      required
                      min={
                        fromDate || getSystemDate().toISOString().split("T")[0]
                      }
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-[#A05C2B]/30 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1.5">
                    Reason for Leave
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                    placeholder="Briefly explain the reason..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-[#A05C2B]/30 outline-none resize-none"
                  ></textarea>
                </div>
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full bg-[#A05C2B] text-white py-3.5 rounded-xl font-bold shadow-md hover:bg-[#8e5226] transition-colors flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" /> Submit Application
                  </button>
                </div>
              </form>
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
                 <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Calendar className="w-5 h-5 text-[#A05C2B]"/> Options</h2>
                 <button onClick={() => setIsDrawerOpen(false)} className="p-2 rounded-full hover:bg-gray-200 text-gray-500"><X className="w-5 h-5"/></button>
               </div>
               <div className="flex-1 overflow-y-auto p-4 space-y-2">
                 <button onClick={() => { setActiveTab('overview'); setIsDrawerOpen(false); }} className={`w-full text-left p-4 rounded-xl font-bold flex items-center gap-3 transition-colors ${activeTab === 'overview' ? 'bg-[#0B1E40] text-white shadow-md' : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-100'}`}>
                   <CheckCircle className="w-5 h-5" /> Overview & Leave
                 </button>
                 <button onClick={() => { setActiveTab('history'); setIsDrawerOpen(false); }} className={`w-full text-left p-4 rounded-xl font-bold flex items-center gap-3 transition-colors ${activeTab === 'history' ? 'bg-[#0B1E40] text-white shadow-md' : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-100'}`}>
                   <Calendar className="w-5 h-5" /> Attendance History
                 </button>
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
