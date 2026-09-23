const fs = require('fs');

const useExamsCode = `import { useState, useEffect } from 'react';

export interface Exam {
  id: string;
  name: string;
  month: string;
  startDate: string;
  endDate: string;
  classes: string[];
  isMarksEntryOpen?: boolean;
}

export interface DatesheetRow {
  subject: string;
  date: string;
  time?: string;
}

export interface Datesheet {
  id: string;
  examId: string;
  classKey: string;
  schedule: DatesheetRow[];
}

export type MarksRecord = Record<string, Record<string, number>>; // studentId -> { subject: marks }

export interface ExamResult {
  id: string;
  examId: string;
  classKey: string;
  marks: MarksRecord;
  isPublished: boolean;
}

const EXAMS_KEY = 'ajps_exams';
const DATESHEETS_KEY = 'ajps_datesheets';
const RESULTS_KEY = 'ajps_results';

export function useExams() {
  const [exams, setExams] = useState<Exam[]>(() => {
    const stored = localStorage.getItem(EXAMS_KEY);
    return stored ? (JSON.parse(stored) || []) : [];
  });

  const [datesheets, setDatesheets] = useState<Datesheet[]>(() => {
    const stored = localStorage.getItem(DATESHEETS_KEY);
    return stored ? (JSON.parse(stored) || []) : [];
  });

  const [results, setResults] = useState<ExamResult[]>(() => {
    const stored = localStorage.getItem(RESULTS_KEY);
    return stored ? (JSON.parse(stored) || []) : [];
  });

  useEffect(() => {
    const handleSync = () => {
      const storedExams = localStorage.getItem(EXAMS_KEY);
      const storedDatesheets = localStorage.getItem(DATESHEETS_KEY);
      const storedResults = localStorage.getItem(RESULTS_KEY);
      
      if (storedExams) setExams(JSON.parse(storedExams) || []);
      if (storedDatesheets) setDatesheets(JSON.parse(storedDatesheets) || []);
      if (storedResults) setResults(JSON.parse(storedResults) || []);
    };
    
    window.addEventListener('exams_updated', handleSync);
    window.addEventListener('storage', handleSync);
    
    return () => {
      window.removeEventListener('exams_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const addExam = (exam: Exam) => {
    const existingIndex = exams.findIndex(e => e.id === exam.id);
    let newExams = [...exams];
    if (existingIndex >= 0) {
      newExams[existingIndex] = exam;
    } else {
      newExams.push(exam);
    }
    localStorage.setItem(EXAMS_KEY, JSON.stringify(newExams));
    setExams(newExams);
    window.dispatchEvent(new Event('exams_updated'));
  };

  const deleteExam = (examId: string) => {
    const newExams = exams.filter(e => e.id !== examId);
    localStorage.setItem(EXAMS_KEY, JSON.stringify(newExams));
    setExams(newExams);
    window.dispatchEvent(new Event('exams_updated'));
  };

  const toggleMarksEntry = (examId: string) => {
    const newExams = exams.map(e => e.id === examId ? { ...e, isMarksEntryOpen: !e.isMarksEntryOpen } : e);
    localStorage.setItem(EXAMS_KEY, JSON.stringify(newExams));
    setExams(newExams);
    window.dispatchEvent(new Event('exams_updated'));
  };

  const postponeExam = (examId: string, daysToShift: number) => {
    let shifted = false;
    const newDatesheets = datesheets.map(ds => {
      if (ds.examId === examId) {
        shifted = true;
        const newSchedule = ds.schedule.map(row => {
          const newDate = new Date(row.date);
          newDate.setDate(newDate.getDate() + daysToShift);
          // Sunday check
          if (newDate.getDay() === 0) {
            newDate.setDate(newDate.getDate() + 1);
          }
          return { ...row, date: newDate.toISOString().split('T')[0] };
        });
        return { ...ds, schedule: newSchedule };
      }
      return ds;
    });

    if (shifted) {
      localStorage.setItem(DATESHEETS_KEY, JSON.stringify(newDatesheets));
      setDatesheets(newDatesheets);
    }
    
    const newExams = exams.map(e => {
        if (e.id === examId) {
            const newStart = new Date(e.startDate);
            newStart.setDate(newStart.getDate() + daysToShift);
            if (newStart.getDay() === 0) newStart.setDate(newStart.getDate() + 1);
            
            const newEnd = new Date(e.endDate);
            newEnd.setDate(newEnd.getDate() + daysToShift);
            if (newEnd.getDay() === 0) newEnd.setDate(newEnd.getDate() + 1);
            
            return {
                ...e,
                startDate: newStart.toISOString().split('T')[0],
                endDate: newEnd.toISOString().split('T')[0]
            };
        }
        return e;
    });
    localStorage.setItem(EXAMS_KEY, JSON.stringify(newExams));
    setExams(newExams);
    
    window.dispatchEvent(new Event('exams_updated'));
  };

  const addDatesheet = (datesheet: Datesheet) => {
    const newDatesheets = datesheets.filter(d => !(d.examId === datesheet.examId && d.classKey === datesheet.classKey));
    newDatesheets.push(datesheet);
    localStorage.setItem(DATESHEETS_KEY, JSON.stringify(newDatesheets));
    setDatesheets(newDatesheets);
    window.dispatchEvent(new Event('exams_updated'));
  };

  const saveMarks = (examId: string, classKey: string, marks: MarksRecord) => {
    let newResults = [...results];
    const existingIndex = newResults.findIndex(r => r.examId === examId && r.classKey === classKey);
    
    if (existingIndex >= 0) {
      newResults[existingIndex].marks = marks;
    } else {
      newResults.push({
        id: \`\${examId}_\${classKey}\`,
        examId,
        classKey,
        marks,
        isPublished: false
      });
    }
    
    localStorage.setItem(RESULTS_KEY, JSON.stringify(newResults));
    setResults(newResults);
    window.dispatchEvent(new Event('exams_updated'));
  };

  const publishResult = (examId: string, classKey: string) => {
    const newResults = results.map(r => 
      (r.examId === examId && r.classKey === classKey) ? { ...r, isPublished: true } : r
    );
    localStorage.setItem(RESULTS_KEY, JSON.stringify(newResults));
    setResults(newResults);
    window.dispatchEvent(new Event('exams_updated'));
  };

  return {
    exams,
    datesheets,
    results,
    addExam,
    deleteExam,
    toggleMarksEntry,
    postponeExam,
    addDatesheet,
    saveMarks,
    publishResult
  };
}
`

const adminExamCode = `import React, { useState, useEffect } from 'react';
import { Plus, Settings, AlertTriangle, CheckCircle, Save, Edit3, X, Calendar, ArrowLeft, Clock } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Toast } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';
import { useSuccess } from '../../context/SuccessContext';
import { useExams, Exam } from '../../hooks/useExams';
import { NotificationService } from '../../services/NotificationService';

export function AdminExam() {
  const { currentUser } = useAuth();
  const { triggerSuccess, triggerError } = useSuccess();
  const { exams, addExam, deleteExam, toggleMarksEntry, postponeExam, datesheets } = useExams();

  const [isCreating, setIsCreating] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  
  const [toastMsg, setToastMsg] = useState('');

  // Form State
  const [examName, setExamName] = useState('');
  const [examMonth, setExamMonth] = useState('July');
  const [examStartDate, setExamStartDate] = useState('');
  const [examEndDate, setExamEndDate] = useState('');
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  
  // Postpone state
  const [isPostponeModalOpen, setIsPostponeModalOpen] = useState(false);
  const [postponeDays, setPostponeDays] = useState<number | ''>('');

  useEffect(() => {
    const classes = JSON.parse(localStorage.getItem('ajps_classes') || '[]');
    setAvailableClasses(classes.map((c: any) => c.className || c.id));
  }, []);

  // Sync selectedExam if it gets updated via toggleMarksEntry or postpone
  useEffect(() => {
    if (selectedExam) {
      const updated = exams.find(e => e.id === selectedExam.id);
      if (updated) {
        setSelectedExam(updated);
      } else {
        setSelectedExam(null);
      }
    }
  }, [exams]);

  const handleCreateExam = () => {
    if (!examName.trim() || !examStartDate || !examEndDate || selectedClasses.length === 0) {
      triggerError('Please fill all required fields and select at least one class.');
      return;
    }
    
    if (new Date(examStartDate) > new Date(examEndDate)) {
      triggerError('Start Date cannot be after End Date.');
      return;
    }

    const newExam: Exam = {
      id: Math.random().toString(36).substr(2, 9),
      name: examName.trim(),
      month: examMonth,
      startDate: examStartDate,
      endDate: examEndDate,
      classes: selectedClasses,
      isMarksEntryOpen: false
    };

    addExam(newExam);
    setIsCreating(false);
    
    // Notification for all students in selected classes
    const allUsers = JSON.parse(localStorage.getItem('ajps_users') || '[]');
    const targetStudents = allUsers.filter((u: any) => u.role === 'Student' && selectedClasses.includes(u.classId || u.className));
    
    NotificationService.sendNotification({
      recipientIds: targetStudents.map((s: any) => s.id),
      title: \`New Exam Scheduled\`,
      message: \`New Exam: \${newExam.name} is scheduled from \${newExam.startDate} to \${newExam.endDate}.\`,
      type: 'info',
      actionPath: '/student/exams',
      actionLabel: 'View Exam'
    });
    
    // Reset
    setExamName('');
    setExamStartDate('');
    setExamEndDate('');
    setSelectedClasses([]);
    
    triggerSuccess('Exam created successfully');
  };

  const handleToggleClass = (cls: string) => {
    if (selectedClasses.includes(cls)) {
      setSelectedClasses(selectedClasses.filter(c => c !== cls));
    } else {
      setSelectedClasses([...selectedClasses, cls]);
    }
  };

  const handleDelete = (examId: string) => {
    if (confirm('Are you sure you want to delete this exam?')) {
        deleteExam(examId);
        triggerSuccess('Exam deleted');
        setSelectedExam(null);
    }
  };

  const handlePostpone = () => {
    if (!selectedExam || !postponeDays || postponeDays <= 0) {
      triggerError('Please enter a valid number of days.');
      return;
    }
    
    postponeExam(selectedExam.id, Number(postponeDays));
    
    const allUsers = JSON.parse(localStorage.getItem('ajps_users') || '[]');
    const targetStudents = allUsers.filter((u: any) => u.role === 'Student' && (selectedExam.classes || []).includes(u.classId || u.className));
    
    NotificationService.sendNotification({
      recipientIds: targetStudents.map((s: any) => s.id),
      title: \`Exam Postponed\`,
      message: \`Alert: Exams have been postponed by \${postponeDays} days. Please view the updated datesheet.\`,
      type: 'warning',
      actionPath: '/student/exams',
      actionLabel: 'View Datesheet'
    });

    setIsPostponeModalOpen(false);
    setPostponeDays('');
    triggerSuccess('Exam postponed successfully');
  };

  // If a specific exam is selected, show detailed view
  if (selectedExam) {
    const hasDatesheets = datesheets.some(d => d.examId === selectedExam.id && d.schedule.length > 0);
    
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 min-h-[calc(100vh-4rem)] pb-24 md:pb-8 animate-in fade-in zoom-in-95 duration-300">
        <button 
          onClick={() => setSelectedExam(null)}
          className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#A05C2B] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Exams
        </button>

        <GlassCard className="p-6 md:p-8 bg-white border border-gray-200 shadow-xl">
          <div className="border-b border-gray-100 pb-6 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-black text-gray-900">{selectedExam.name}</h1>
                <p className="text-sm font-semibold text-gray-500 flex items-center gap-2 mt-2">
                  <Calendar className="w-4 h-4 text-[#A05C2B]" /> {selectedExam.month} Term
                </p>
              </div>
              <span className={\`px-3 py-1 text-xs font-black uppercase tracking-wider rounded-lg \${selectedExam.isMarksEntryOpen ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'}\`}>
                {selectedExam.isMarksEntryOpen ? 'Marks Unlocked' : 'Marks Locked'}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="bg-[#FDFBF7] p-5 rounded-xl border border-gray-100">
              <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Schedule</h3>
              <p className="text-sm font-semibold text-gray-900"><span className="text-gray-500 w-16 inline-block">Start:</span> {selectedExam.startDate}</p>
              <p className="text-sm font-semibold text-gray-900 mt-2"><span className="text-gray-500 w-16 inline-block">End:</span> {selectedExam.endDate}</p>
            </div>
            
            <div className="bg-[#FDFBF7] p-5 rounded-xl border border-gray-100">
              <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Applicable Classes</h3>
              <div className="flex flex-wrap gap-2">
                {(selectedExam.classes || []).map(c => (
                  <span key={c} className="bg-white border border-gray-200 text-gray-700 px-3 py-1 rounded-lg text-sm font-bold shadow-sm">
                    Class {c}
                  </span>
                ))}
                {(!selectedExam.classes || selectedExam.classes.length === 0) && (
                  <span className="text-sm text-gray-500 italic">No classes assigned</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => toggleMarksEntry(selectedExam.id)}
              className={\`w-full py-3.5 rounded-xl text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2 \${selectedExam.isMarksEntryOpen ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#10B981] hover:bg-[#059669]'}\`}
            >
              <Settings className="w-5 h-5" />
              {selectedExam.isMarksEntryOpen ? 'Lock Marks Entry' : 'Unlock Marks Entry'}
            </button>
            
            <div className="flex gap-3">
              {hasDatesheets && (
                <button 
                  onClick={() => setIsPostponeModalOpen(true)}
                  className="flex-1 bg-white border-2 border-[#A05C2B] text-[#A05C2B] py-3 rounded-xl font-bold text-sm shadow-sm hover:bg-[#FDF7EE] transition-colors flex items-center justify-center gap-2"
                >
                  <Clock className="w-5 h-5" />
                  Postpone Exam
                </button>
              )}
              
              <button 
                onClick={() => handleDelete(selectedExam.id)}
                className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
              >
                Delete Exam
              </button>
            </div>
          </div>
        </GlassCard>

        {isPostponeModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#1F2937]/40 backdrop-blur-sm animate-in fade-in">
            <GlassCard className="w-full max-w-sm bg-white p-6 border border-white/50 shadow-2xl relative">
              <button onClick={() => setIsPostponeModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-[#A05C2B]" /> Postpone Exam
              </h2>
              <p className="text-sm text-gray-500 mb-6">Shift all datesheets by a set number of days.</p>
              
              <div className="mb-6">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Days to Postpone</label>
                <input 
                  type="number"
                  min="1"
                  value={postponeDays}
                  onChange={e => setPostponeDays(Number(e.target.value) || '')}
                  className="w-full bg-[#FDFBF7] border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#A05C2B]/30 font-bold"
                  placeholder="e.g. 2"
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setIsPostponeModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handlePostpone}
                  className="px-5 py-2.5 bg-[#A05C2B] text-white text-sm font-bold rounded-xl shadow-md hover:bg-[#8e5226] transition-colors"
                >
                  Confirm
                </button>
              </div>
            </GlassCard>
          </div>
        )}
        
        <Toast message={toastMsg} />
      </div>
    );
  }

  // List View
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 min-h-[calc(100vh-4rem)] pb-24 md:pb-8 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-2xl font-black text-[#1F2937] tracking-tight">Exam Administration</h1>
          <p className="text-sm font-semibold text-gray-500 mt-1">Manage exam windows and evaluation locks.</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="bg-[#1F2937] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-gray-800 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Declare New Exam
        </button>
      </div>

      {isCreating && (
        <GlassCard className="p-6 md:p-8 bg-white border border-gray-200 shadow-xl relative z-10 animate-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#A05C2B]" /> Declare New Examination
            </h2>
            <button onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-gray-600 p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Exam Title</label>
              <input 
                type="text" 
                value={examName} onChange={e => setExamName(e.target.value)}
                placeholder="e.g. Mid Term Examination"
                className="w-full bg-[#FDFBF7] border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#A05C2B]/30 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Term / Month</label>
              <select 
                value={examMonth} onChange={e => setExamMonth(e.target.value)}
                className="w-full bg-[#FDFBF7] border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#A05C2B]/30 font-medium"
              >
                {['July', 'September', 'December', 'March'].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Start Date</label>
              <input 
                type="date" 
                value={examStartDate} onChange={e => setExamStartDate(e.target.value)}
                className="w-full bg-[#FDFBF7] border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#A05C2B]/30 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">End Date</label>
              <input 
                type="date" 
                value={examEndDate} onChange={e => setExamEndDate(e.target.value)}
                className="w-full bg-[#FDFBF7] border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#A05C2B]/30 font-medium"
              />
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-3">Applicable Classes</label>
            <div className="flex flex-wrap gap-2">
              {availableClasses.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No classes found in system.</p>
              ) : availableClasses.map(cls => (
                <button
                  key={cls}
                  onClick={() => handleToggleClass(cls)}
                  className={\`px-4 py-2 rounded-xl text-sm font-bold border transition-colors \${selectedClasses.includes(cls) ? 'bg-[#A05C2B] text-white border-[#A05C2B] shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}\`}
                >
                  Class {cls}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button 
              onClick={() => setIsCreating(false)}
              className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleCreateExam}
              className="px-6 py-2.5 bg-[#A05C2B] text-white text-sm font-bold rounded-xl shadow-md hover:bg-[#8e5226] transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Save Exam
            </button>
          </div>
        </GlassCard>
      )}

      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600" /> Active Exams
        </h3>
        {exams.length === 0 ? (
          <GlassCard className="p-12 text-center bg-white/40 border-white shadow-sm">
             <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
             <h3 className="text-lg font-bold text-gray-800">No Exams Declared</h3>
             <p className="text-sm text-gray-500 mt-2 font-medium">Click "Declare New Exam" to schedule.</p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exams.map(exam => (
              <GlassCard 
                key={exam.id} 
                className="p-5 bg-white border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer group relative"
                onClick={() => setSelectedExam(exam)}
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-gray-900 text-lg group-hover:text-[#A05C2B] transition-colors">{exam.name}</h4>
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wide">
                      {exam.month}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 mb-2">
                     <p className="text-xs text-gray-500 font-semibold">
                       <span className="text-gray-400 font-medium">Date:</span> {exam.startDate} to {exam.endDate}
                     </p>
                     <p className="text-xs text-gray-500 font-semibold line-clamp-1">
                       <span className="text-gray-400 font-medium">Classes:</span> {(exam.classes || []).join(', ')}
                     </p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                    <span className={\`text-[10px] font-bold uppercase tracking-wider \${exam.isMarksEntryOpen ? 'text-amber-600' : 'text-gray-400'}\`}>
                      {exam.isMarksEntryOpen ? '🔓 Marks Unlocked' : '🔒 Marks Locked'}
                    </span>
                    <span className="text-xs font-bold text-[#A05C2B] opacity-0 group-hover:opacity-100 transition-opacity">
                        View Details &rarr;
                    </span>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
      <Toast message={toastMsg} />
    </div>
  );
}
`
fs.writeFileSync('src/hooks/useExams.ts', useExamsCode);
fs.writeFileSync('src/pages/exams/AdminExam.tsx', adminExamCode);
