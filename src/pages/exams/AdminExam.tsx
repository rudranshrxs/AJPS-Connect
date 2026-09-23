import React, { useState, useEffect } from 'react';
import { Plus, Settings, AlertTriangle, CheckCircle, Save, Edit3, X, Calendar, ArrowLeft, Clock, ChevronDown, ChevronUp, Trash2, Printer, Layers } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Toast } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';
import { useSuccess } from '../../context/SuccessContext';
import { useExams, Exam } from '../../hooks/useExams';
import { NotificationService } from '../../services/NotificationService';
import { ExamWizard } from './ExamWizard';
import { ExamCustomCalendar } from '../../components/exams/ExamCustomCalendar';
import { getSystemDate } from '../../utils/dateUtils';

function ClassPillSelector({ selected, onToggle, pool }: { selected: string[], onToggle: (cls: string) => void, pool: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {pool.length === 0 ? (
        <p className="text-sm text-gray-400 italic font-medium">All classes already assigned to other groups.</p>
      ) : pool.map(cls => (
        <button key={cls} onClick={() => onToggle(cls)}
          className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full text-sm font-bold border-2 transition-all ${selected.includes(cls) ? 'bg-[#A05C2B] border-[#A05C2B] text-white shadow-md' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}
        >
          {cls}
        </button>
      ))}
    </div>
  );
}

function ScheduleEditor({ rows, onSubjectChange, onRemoveRow }: { rows: { subject: string, date: string }[], onSubjectChange: (i: number, v: string) => void, onRemoveRow: (i: number) => void }) {
  if (rows.length === 0) return null;
  return (
    <div className="mt-4 space-y-3">
      {rows.map((row, i) => (
        <div key={row.date} className="flex gap-2 md:gap-4 items-center">
          <div className="w-24 md:w-32 bg-[#FDF7EE] border-2 border-[#A05C2B]/20 rounded-xl px-2 md:px-3 py-2 md:py-2.5 text-sm md:text-base font-black text-[#A05C2B] text-center shrink-0">
            {new Date(row.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </div>
          <input type="text" placeholder="Subject Name..." value={row.subject} onChange={e => onSubjectChange(i, e.target.value)}
            className="flex-1 bg-gray-50 border-2 border-gray-100 focus:border-[#A05C2B] focus:bg-white rounded-xl px-3 md:px-5 py-2 md:py-2.5 text-base md:text-lg font-bold text-gray-800 outline-none transition-all" />
          <button onClick={() => onRemoveRow(i)} className="p-2 text-red-400 hover:bg-red-50 rounded-xl shrink-0"><X className="w-5 h-5 md:w-6 md:h-6" /></button>
        </div>
      ))}
    </div>
  );
}

export function AdminExam() {
  const { currentUser } = useAuth();
  const { triggerSuccess, triggerError } = useSuccess();
  const { exams, updateExam, addExam, deleteExam, toggleMarksEntry, postponeExam, deleteDatesheetsForExam, addDatesheet, datesheets, results, publishResult } = useExams();

  const [isCreating, setIsCreating] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'syllabus' | 'criteria' | 'datesheet' | 'result_draft'>('overview');
  const [expandedClassDraft, setExpandedClassDraft] = useState<string | null>(null);

  const [publishWarningModal, setPublishWarningModal] = useState<{ examId: string, classId: string, missingCount: number } | null>(null);
  const [unlockConfirmModal, setUnlockConfirmModal] = useState<string | null>(null); // examId

  const [adminDraftClass, setAdminDraftClass] = useState<string>('');
  const [adminDraftSection, setAdminDraftSection] = useState<string>('');
  const [adminDraftCombined, setAdminDraftCombined] = useState<boolean>(false);


  const [toastMsg, setToastMsg] = useState('');

  const [isPostponeModalOpen, setIsPostponeModalOpen] = useState(false);

  // Syllabus state
  const [expandedSyllabusClass, setExpandedSyllabusClass] = useState<string | null>(null);
  const [editingSyllabusId, setEditingSyllabusId] = useState<string | null>(null);
  const [editingTagsText, setEditingTagsText] = useState('');

  // Metrics state
  const [isMetricsLocked, setIsMetricsLocked] = useState(true);
  const [metricsType, setMetricsType] = useState<'same' | 'different'>('same');
  const [sameMetrics, setSameMetrics] = useState({ maxMarks: 100, passPercent: 33 });
  const [evalDrafts, setEvalDrafts] = useState<{ id: string; classes: string[]; maxMarks: number; passPercent: number; }[]>([]);

  // Datesheet state
  const [isDatesheetLocked, setIsDatesheetLocked] = useState(true);
  const [datesheetModalOpen, setDatesheetModalOpen] = useState(false);
  const [datesheetType, setDatesheetType] = useState<'same' | 'different'>('same');
  const [sameDatesheet, setSameDatesheet] = useState<{ subject: string, date: string }[]>([]);
  const [datesheetDrafts, setDatesheetDrafts] = useState<{ id: string; classes: string[]; rows: { subject: string, date: string }[] }[]>([]);
  const [dsClasses, setDsClasses] = useState<string[]>([]);
  const [dsRows, setDsRows] = useState<{ subject: string, date: string, time: string }[]>([{ subject: '', date: '', time: '' }]);

  useEffect(() => {
    // Classes can still be fetched if needed elsewhere, but wizard handles it
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
  }, [exams, selectedExam?.id]);

  // Sync state for criteria and datesheets when activeTab changes, exam selected, or datesheets update
  useEffect(() => {
    if (selectedExam && activeTab === 'criteria') {
      if (selectedExam.metrics) {
        setIsMetricsLocked(true);
        setMetricsType(selectedExam.metrics.type);
        if (selectedExam.metrics.same) setSameMetrics(selectedExam.metrics.same);
        if (selectedExam.metrics.different) {
          // Convert from record to array
          const draftsMap: Record<string, { id: string; classes: string[]; maxMarks: number; passPercent: number }> = {};
          let i = 1;
          for (const [cls, m] of Object.entries(selectedExam.metrics.different)) {
            const key = `${m.maxMarks}-${m.passPercent}`;
            if (!draftsMap[key]) {
              draftsMap[key] = { id: `d_${i++}`, classes: [], maxMarks: m.maxMarks, passPercent: m.passPercent };
            }
            draftsMap[key].classes.push(cls);
          }
          setEvalDrafts(Object.values(draftsMap));
        }
      } else {
        setIsMetricsLocked(false);
      }
    }

    if (selectedExam && activeTab === 'datesheet') {
      const examDs = datesheets.filter(d => d.examId === selectedExam.id);
      if (examDs.length > 0) {
        setIsDatesheetLocked(true);
        if (examDs.length === 1 && examDs[0].classes.length === (selectedExam.classes?.length || 0)) {
          setDatesheetType('same');
          setSameDatesheet((examDs[0].rows || (examDs[0] as any).schedule || []).map((r: any) => ({ subject: r.subject, date: r.date })));
          setDatesheetDrafts([]);
        } else {
          setDatesheetType('different');
          setDatesheetDrafts(examDs.map((d, index) => ({
            id: d.id || `ds_${Date.now()}_${index}`,
            classes: d.classes || [],
            rows: (d.rows || (d as any).schedule || []).map((r: any) => ({ subject: r.subject, date: r.date }))
          })));
          setSameDatesheet([]);
        }
      } else {
        setIsDatesheetLocked(false);
      }
    }
  }, [selectedExam?.id, activeTab, datesheets]);

  const handleDelete = (examId: string) => {
    if (confirm('Are you sure you want to delete this exam?')) {
      deleteExam(examId);
      triggerSuccess('Exam deleted');
      setSelectedExam(null);
    }
  };

  const handlePostpone = () => {
    if (!selectedExam) return;
    deleteDatesheetsForExam(selectedExam.id);
    const allUsers = JSON.parse(localStorage.getItem('ajps_users') || '[]');
    const targetStudents = allUsers.filter((u: any) => u.role === 'Student' && (selectedExam.classes || []).includes(u.classId || u.className));
    NotificationService.sendNotification({
      recipientIds: targetStudents.map((s: any) => s.id),
      title: `Exam Postponed`,
      message: `Alert: The datesheet for ${selectedExam.name} has been cancelled and will be rescheduled.`,
      type: 'warning',
      actionPath: '/student/exams',
      actionLabel: 'View Updates'
    });
    setIsPostponeModalOpen(false);
    triggerSuccess('Exam datesheets wiped and postponed successfully.');
    setActiveTab('datesheet');
    setIsDatesheetLocked(false);
  };

  const addDatesheetDraft = () => {
    setDatesheetDrafts([...datesheetDrafts, { id: `ds_${Date.now()}`, classes: [], rows: [] }]);
  };

  const removeDatesheetDraft = (id: string) => {
    setDatesheetDrafts(datesheetDrafts.filter(d => d.id !== id));
  };

  const toggleDsDraftClass = (draftId: string, cls: string) => {
    setDatesheetDrafts(datesheetDrafts.map(d => {
      if (d.id === draftId) {
        return { ...d, classes: d.classes.includes(cls) ? d.classes.filter(c => c !== cls) : [...d.classes, cls] };
      }
      return { ...d, classes: d.classes.filter(c => c !== cls) }; // Remove from other drafts
    }));
  };

  const addDsDraftDate = (draftId: string, dateStr: string) => {
    setDatesheetDrafts(datesheetDrafts.map(d => {
      if (d.id === draftId && !d.rows.some(r => r.date === dateStr)) {
        return { ...d, rows: [...d.rows, { subject: '', date: dateStr }].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) };
      }
      return d;
    }));
  };

  const updateDsDraftSubject = (draftId: string, rowIdx: number, subject: string) => {
    setDatesheetDrafts(datesheetDrafts.map(d => {
      if (d.id === draftId) {
        const newRows = [...d.rows];
        newRows[rowIdx] = { ...newRows[rowIdx], subject };
        return { ...d, rows: newRows };
      }
      return d;
    }));
  };

  const removeDsDraftRow = (draftId: string, rowIdx: number) => {
    setDatesheetDrafts(datesheetDrafts.map(d => {
      if (d.id === draftId) {
        return { ...d, rows: d.rows.filter((_, i) => i !== rowIdx) };
      }
      return d;
    }));
  };

  const saveDatesheet = () => {
    if (!selectedExam) return;

    // Clear old datesheets for this exam
    deleteDatesheetsForExam(selectedExam.id);

    if (datesheetType === 'same') {
      if (sameDatesheet.length === 0) {
        triggerError("Datesheet cannot be empty.");
        return;
      }
      if (sameDatesheet.some(r => !r.subject)) {
        triggerError("All dates must have a subject.");
        return;
      }
      addDatesheet(selectedExam.id, selectedExam.classes || [], sameDatesheet.map(r => ({ ...r, time: '09:00 AM' })));
    } else {
      if (datesheetDrafts.length === 0) {
        triggerError("Please add at least one datesheet group.");
        return;
      }
      if (datesheetDrafts.some(d => d.classes.length === 0)) {
        triggerError("All datesheet groups must have at least one class assigned.");
        return;
      }
      if (datesheetDrafts.some(d => d.rows.length === 0 || d.rows.some(r => !r.subject))) {
        triggerError("All datesheet dates must have a subject.");
        return;
      }

      datesheetDrafts.forEach(draft => {
        addDatesheet(selectedExam.id, draft.classes, draft.rows.map(r => ({ ...r, time: '09:00 AM' })));
      });
    }

    setIsDatesheetLocked(true);
    triggerSuccess('Datesheet saved successfully.');

    // Notification Logic for Datesheet Publish
    const allUsers = JSON.parse(localStorage.getItem('ajps_users') || '[]');
    const targetStudents = allUsers.filter((u: any) => u.role === 'Student' && (selectedExam.classes || []).includes(u.classId || u.className));
    NotificationService.sendNotification({
      recipientIds: targetStudents.map((s: any) => s.id),
      title: 'Datesheet Published',
      message: `The datesheet for ${selectedExam.name} is now available.`,
      type: 'info',
      actionPath: '/student/exams',
      actionLabel: 'View Datesheet'
    });
  };

  const addEvalDraft = () => {
    setEvalDrafts([...evalDrafts, { id: `draft_${Date.now()}`, classes: [], maxMarks: 100, passPercent: 33 }]);
  };

  const removeEvalDraft = (id: string) => {
    setEvalDrafts(evalDrafts.filter(d => d.id !== id));
  };

  const toggleEvalDraftClass = (draftId: string, cls: string) => {
    setEvalDrafts(evalDrafts.map(d => {
      if (d.id === draftId) {
        return { ...d, classes: d.classes.includes(cls) ? d.classes.filter(c => c !== cls) : [...d.classes, cls] };
      }
      return { ...d, classes: d.classes.filter(c => c !== cls) };
    }));
  };

  const updateEvalDraft = (id: string, updates: Partial<{ maxMarks: number, passPercent: number }>) => {
    setEvalDrafts(evalDrafts.map(d => d.id === id ? { ...d, ...updates } : d));
  };

  const saveMetrics = () => {
    if (!selectedExam) return;

    if (metricsType === 'different' && evalDrafts.length === 0) {
      triggerError("Please add at least one evaluation group.");
      return;
    }

    if (metricsType === 'different' && evalDrafts.some(d => d.classes.length === 0)) {
      triggerError("All evaluation groups must have at least one class assigned.");
      return;
    }

    const metricsData = {
      type: metricsType,
      same: metricsType === 'same' ? sameMetrics : undefined,
      different: metricsType === 'different' ? evalDrafts.reduce((acc, draft) => {
        draft.classes.forEach(cls => {
          acc[cls] = { maxMarks: draft.maxMarks, passPercent: draft.passPercent };
        });
        return acc;
      }, {} as Record<string, { maxMarks: number, passPercent: number }>) : undefined
    };

    updateExam({ ...selectedExam, metrics: metricsData });
    setIsMetricsLocked(true);
    triggerSuccess('Evaluation metrics saved successfully.');

    // Notification Logic for Metrics Update
    const allUsers = JSON.parse(localStorage.getItem('ajps_users') || '[]');
    const targetStudents = allUsers.filter((u: any) => u.role === 'Student' && (selectedExam.classes || []).includes(u.classId || u.className));
    NotificationService.sendNotification({
      recipientIds: targetStudents.map((s: any) => s.id),
      title: 'Evaluation Criteria Updated',
      message: `The evaluation metrics for ${selectedExam.name} have been updated.`,
      type: 'info',
      actionPath: '/student/exams',
      actionLabel: 'View Criteria'
    });
  };

  const saveSyllabusTags = (syllabusId: string, classId: string) => {
    if (!selectedExam) return;
    const newTags = editingTagsText.split(',').map(t => t.trim()).filter(Boolean);
    const updatedSyllabus = (selectedExam.syllabus || []).map(s => {
      if (s.id === syllabusId) {
        return { ...s, tags: newTags };
      }
      return s;
    });
    updateExam({ ...selectedExam, syllabus: updatedSyllabus });
    setEditingSyllabusId(null);
    triggerSuccess('Syllabus updated.');

    const allUsers = JSON.parse(localStorage.getItem('ajps_users') || '[]');
    const targetStudents = allUsers.filter((u: any) => u.role === 'Student' && String(u.classId) === String(classId));
    NotificationService.sendNotification({
      recipientIds: targetStudents.map((s: any) => s.id),
      title: 'Syllabus Updated',
      message: `The syllabus for your class has been updated.`,
      type: 'info',
      actionPath: '/student/exams',
      actionLabel: 'View Syllabus'
    });
  };

  const handlePublishClick = (examId: string, classId: string, c: string, classResult: any, clsObj: any) => {
    // Validate missing marks
    const allUsers = JSON.parse(localStorage.getItem('ajps_users') || '[]');
    let missingCount = 0;

    const sections = clsObj.sections || [];
    sections.forEach((sec: any) => {
      const secId = typeof sec === 'string' ? sec : sec.id;
      const secName = typeof sec === 'string' ? sec : sec.name;
      const sectionStudents = allUsers.filter((u: any) =>
        u.role === 'Student' && String(u.classId) === String(clsObj.id) && (String(u.sectionId) === String(secId) || u.section === secName || u.sectionId === `c${clsObj.id}-s${secId}`)
      );

      sectionStudents.forEach((s: any) => {
        const marks = classResult?.marks?.[s.id] || {};
        // Check if they have any missing marks across the expected subjects
        const expectedSubjects = (selectedExam?.syllabus || []).filter((sItem: any) => String(sItem.classId) === String(clsObj.id)).map((sItem: any) => sItem.subject);
        expectedSubjects.forEach((sub: string) => {
          if (marks[sub] === undefined || marks[sub] === null || marks[sub] === '') {
            missingCount++;
          }
        });
      });
    });

    if (missingCount > 0) {
      setPublishWarningModal({ examId, classId, missingCount });
    } else {
      executePublish(examId, classId);
    }
  };

  const executePublish = (examId: string, classId: string) => {
    try {
      publishResult(examId, classId, true); // We'll modify useExams to accept force flag
      triggerSuccess('Result published successfully');

      const allUsers = JSON.parse(localStorage.getItem('ajps_users') || '[]');
      const targetStudents = allUsers.filter((u: any) => u.role === 'Student' && String(u.classId) === String(classId));
      NotificationService.sendNotification({
        recipientIds: targetStudents.map((s: any) => s.id),
        title: 'Result Declared!',
        message: `Your result for ${selectedExam?.name} is now available to view.`,
        type: 'info',
        actionPath: '/student/exams',
        actionLabel: 'View Result'
      });
      setPublishWarningModal(null);
    } catch (err: any) {
      triggerError(err.message || 'Error publishing results');
    }
  };

  if (selectedExam) {
    const hasDatesheets = datesheets.some(d => d.examId === selectedExam.id && (d.rows || []).length > 0);

    // Overview variables
    const examDatesheets = datesheets.filter(d => d.examId === selectedExam.id);
    const allDates = examDatesheets.flatMap(d => (d.rows || (d as any).schedule || []).map((r: any) => new Date(r.date).getTime())).filter(Boolean);
    const firstDate = allDates.length > 0 ? Math.min(...allDates) : null;
    const today = getSystemDate();
    today.setHours(0, 0, 0, 0);
    const todayTime = today.getTime();

    // Marks can only be unlocked strictly after the first exam date
    const canUnlockMarks = firstDate ? todayTime >= firstDate : false;
    const autoUnlockEligible = firstDate ? todayTime >= firstDate && !selectedExam.isMarksEntryOpen : false;

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
              <span className={`px-3 py-1 text-xs font-black uppercase tracking-wider rounded-lg ${selectedExam.isMarksEntryOpen ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'}`}>
                {selectedExam.isMarksEntryOpen ? 'Marks Unlocked' : 'Marks Locked'}
              </span>
            </div>
          </div>

          <div className="mt-6 mb-4 px-6 md:px-8 relative z-10">
            <div className="w-full md:w-64">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Select View</label>
              <div className="relative">
                <select
                  value={activeTab}
                  onChange={(e) => setActiveTab(e.target.value as any)}
                  className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-800 text-sm font-medium rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#A05C2B]/30 shadow-sm transition-all capitalize"
                >
                  <option value="overview">Overview</option>
                  <option value="syllabus">Syllabus</option>
                  <option value="criteria">Criteria</option>
                  <option value="datesheet">Datesheet</option>
                  <option value="result_draft">Result Drafts</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        <div className="p-6 md:p-8 bg-gray-50/50 min-h-[400px] border border-gray-200 rounded-xl shadow-md">
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-center text-center">
                <h3 className="text-xl font-black text-gray-800 mb-6">Applicable Classes</h3>
                <div className="flex flex-wrap justify-center gap-3">
                  {(selectedExam.classes || []).map(c => (
                    <span key={c} className="bg-[#FDF7EE] border-2 border-[#A05C2B]/20 text-[#A05C2B] px-4 py-2 rounded-full text-base font-bold shadow-sm">
                      {c}
                    </span>
                  ))}
                  {(!selectedExam.classes || selectedExam.classes.length === 0) && (
                    <span className="text-sm text-gray-500 italic font-medium">No classes assigned</span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {autoUnlockEligible && (
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-xl shadow-sm mb-4">
                    <p className="text-sm font-bold text-blue-800">Exam has commenced. You can now unlock marks entry for teachers.</p>
                  </div>
                )}
                {canUnlockMarks && (
                  <button
                    onClick={() => {
                      if (!selectedExam.isMarksEntryOpen) {
                        setUnlockConfirmModal(selectedExam.id);
                      } else {
                        toggleMarksEntry(selectedExam.id);
                      }
                    }}
                    className={`w-full py-3.5 rounded-xl text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2 ${selectedExam.isMarksEntryOpen ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#10B981] hover:bg-[#059669]'}`}
                  >
                    <Settings className="w-5 h-5" />
                    {selectedExam.isMarksEntryOpen ? 'Lock Marks Entry' : 'Unlock Marks Entry'}
                  </button>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleDelete(selectedExam.id)}
                    className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    Delete Exam
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'result_draft' && (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
              {/* Draft Results */}
              {selectedExam.isMarksEntryOpen ? (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-[#A05C2B]" /> Result Drafts
                  </h3>
                  <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <p className="text-sm text-gray-600 mb-4 font-medium">Drafts are populated by teachers. Publish results to lock marks and notify students.</p>

                    <div className="flex flex-wrap gap-4 items-end mb-6">
                      <div className="flex-1 min-w-[180px]">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Select Class</label>
                        <select
                          value={adminDraftClass}
                          onChange={e => { setAdminDraftClass(e.target.value); setAdminDraftSection(''); setAdminDraftCombined(false); }}
                          className="w-full bg-[#FDFBF7] border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-[#A05C2B]/30"
                        >
                          <option value="">-- Choose Class --</option>
                          {(selectedExam.classes || []).map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      {(() => {
                        if (!adminDraftClass) return null;
                        const classesData = JSON.parse(localStorage.getItem('ajps_classes') || '[]');
                        const clsObj = classesData.find((cl: any) => String(cl.id) === String(adminDraftClass) || cl.className === adminDraftClass);
                        if (!clsObj || !clsObj.sections) return null;

                        return (
                          <>
                            {!adminDraftCombined && (
                              <div className="flex-1 min-w-[180px]">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Select Section</label>
                                <select
                                  value={adminDraftSection}
                                  onChange={e => setAdminDraftSection(e.target.value)}
                                  className="w-full bg-[#FDFBF7] border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-[#A05C2B]/30"
                                >
                                  <option value="">-- All Sections --</option>
                                  {clsObj.sections.map((s: any) => (
                                    <option key={s.id || s} value={s.id || s}>{s.name || s}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                            {clsObj.sections.length > 1 && (
                              <button
                                onClick={() => { setAdminDraftCombined(!adminDraftCombined); setAdminDraftSection(''); }}
                                className={`px-5 py-2.5 rounded-xl text-sm font-bold border-2 transition-all flex items-center gap-2 whitespace-nowrap ${adminDraftCombined
                                  ? 'bg-[#A05C2B] border-[#A05C2B] text-white shadow-md'
                                  : 'bg-white border-gray-200 text-gray-600 hover:border-[#A05C2B]/40'
                                  }`}
                              >
                                <Layers className="w-4 h-4" />
                                {adminDraftCombined ? '✓ Combined View' : 'View Combined'}
                              </button>
                            )}
                          </>
                        );
                      })()}
                    </div>

                    {/* Table View */}
                    {(() => {
                      if (!adminDraftClass) return null;
                      const c = adminDraftClass;
                      const classesData = JSON.parse(localStorage.getItem('ajps_classes') || '[]');
                      const clsObj = classesData.find((cl: any) => String(cl.id) === String(c) || cl.className === c);
                      if (!clsObj) return <p className="text-gray-500 italic">Class not found.</p>;

                      const classIdToMatch = clsObj.id;
                      const classNameToMatch = clsObj.name || clsObj.className;
                      const classKey = `${selectedExam.id}_${classNameToMatch}`;
                      const classResult = results.find(r => r.classKey === classKey);
                      const hasDrafts = classResult && Object.keys(classResult.marks).length > 0;
                      const isPublished = classResult?.isPublished;

                      if (!hasDrafts) {
                        return (
                          <div className="p-12 text-center bg-gray-50 border border-gray-100 rounded-xl shadow-inner mt-2">
                            <p className="text-gray-500 font-bold">Waiting for Drafts...</p>
                          </div>
                        );
                      }

                      const allUsers = JSON.parse(localStorage.getItem('ajps_users') || '[]');
                      const sections = clsObj.sections || [];
                      let studentList: any[] = [];
                      const allSubjects = new Set<string>();

                      const activeSection = adminDraftCombined ? 'All' : (adminDraftSection || 'All');

                      sections.forEach((sec: any) => {
                        const secId = typeof sec === 'string' ? sec : sec.id;
                        const secName = typeof sec === 'string' ? sec : sec.name;
                        if (activeSection !== 'All' && activeSection !== secName && activeSection !== String(secId)) return;

                        const sectionStudents = allUsers.filter((u: any) =>
                          u.role === 'Student' && String(u.classId) === String(clsObj.id) && (String(u.sectionId) === String(secId) || u.section === secName || u.sectionId === `c${clsObj.id}-s${secId}`)
                        );
                        sectionStudents.forEach((s: any) => {
                          const marks = classResult?.marks?.[s.id] || {};
                          Object.keys(marks).forEach(sub => allSubjects.add(sub));
                          studentList.push({ ...s, sectionLabel: secName || secId, marks });
                        });
                      });

                      studentList.sort((a, b) => (a.rollNumber || '').localeCompare(b.rollNumber || '', undefined, { numeric: true }));
                      const subjectsArr = Array.from(allSubjects).sort();

                      const emptySubjects = new Set<string>();
                      subjectsArr.forEach(sub => {
                        const isCompletelyEmpty = studentList.every(st => st.marks[sub] === undefined || st.marks[sub] === null || st.marks[sub] === '');
                        if (isCompletelyEmpty) {
                          emptySubjects.add(sub);
                        }
                      });

                      let maxMarksPerSub = 100;
                      if (selectedExam.metrics) {
                        if (selectedExam.metrics.type === 'same') {
                          maxMarksPerSub = selectedExam.metrics.same?.maxMarks || 100;
                        } else {
                          maxMarksPerSub = selectedExam.metrics.different?.[c]?.maxMarks || 100;
                        }
                      }

                      const validSubjectsCount = subjectsArr.filter(sub => !emptySubjects.has(sub)).length;
                      const totalMaxMarks = validSubjectsCount * maxMarksPerSub;

                      return (
                        <div className="w-full flex flex-col gap-4 animate-in fade-in slide-in-from-top-2">
                          <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200 shadow-sm">
                            <div className="flex items-center gap-3">
                              <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-md">Drafts Available</span>
                              {isPublished && <span className="bg-gray-200 text-gray-600 text-xs font-bold px-3 py-1 rounded-md">Published</span>}
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => window.print()} className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-xs font-bold rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
                                <Printer className="w-4 h-4" /> Print Marksheet
                              </button>
                              {!isPublished && selectedExam.isMarksEntryOpen && (
                                <button
                                  onClick={() => handlePublishClick(selectedExam.id, classIdToMatch, c, classResult, clsObj)}
                                  className="px-5 py-2 bg-[#1F2937] text-white text-xs font-bold rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
                                >
                                  Publish Result
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="w-full overflow-x-auto custom-scrollbar printable-marksheet">
                            <style>{`
                               @media print {
                                  body * { visibility: hidden; }
                                  .printable-marksheet, .printable-marksheet * { visibility: visible; }
                                  .printable-marksheet { position: absolute; left: 0; top: 0; width: 100%; }
                                  .print-header { display: block !important; text-align: center; margin-bottom: 20px; }
                               }
                             `}</style>
                            <div className="print-header hidden">
                              <h1 className="text-2xl font-black">{selectedExam.name} - Marksheet</h1>
                              <h2 className="text-lg font-bold">{c} {activeSection !== 'All' ? ` - Section ${activeSection}` : ''}</h2>
                            </div>
                            <table className="w-full text-left text-sm min-w-max border-collapse border border-gray-300 shadow-sm">
                              <thead className="bg-[#1F2937] text-white">
                                <tr>
                                  <th className="p-3 font-bold text-xs uppercase text-center border border-gray-600 w-20">Roll No.</th>
                                  <th className="p-3 font-bold text-xs uppercase min-w-[180px] border border-gray-600">Student Name</th>
                                  {subjectsArr.map(sub => (
                                    <th key={sub} className="p-3 font-bold text-xs uppercase text-center border border-gray-600">
                                      {sub} {emptySubjects.has(sub) ? '(Empty)' : ''}
                                    </th>
                                  ))}
                                  <th className="p-3 font-bold text-xs uppercase text-center bg-[#374151] border border-gray-600 w-24">Total / {totalMaxMarks}</th>
                                  <th className="p-3 font-bold text-xs uppercase text-center bg-[#374151] border border-gray-600 w-20">%</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 bg-white">
                                {studentList.map((student: any, idx: number) => {
                                  const totalObtained = subjectsArr.reduce((sum, sub) => sum + (Number(student.marks[sub]) || 0), 0);
                                  const percentage = totalMaxMarks > 0 ? ((totalObtained / totalMaxMarks) * 100).toFixed(1) : '0.0';
                                  const hasAnyMark = subjectsArr.some(sub => student.marks[sub] !== undefined && student.marks[sub] !== '');

                                  return (
                                    <tr key={student.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                      <td className="p-3 font-bold text-gray-500 text-center border border-gray-300">{student.rollNumber || '—'}</td>
                                      <td className="p-3 border border-gray-300">
                                        <span className="font-semibold text-gray-800">{student.name}</span>
                                        {(adminDraftCombined || activeSection === 'All') && (
                                          <span className="ml-2 bg-blue-100 text-blue-700 text-[10px] font-black px-1.5 py-0.5 rounded uppercase">{student.sectionLabel}</span>
                                        )}
                                      </td>
                                      {subjectsArr.map(sub => (
                                        <td key={sub} className="p-3 text-center border border-gray-300">
                                          {student.marks[sub] !== undefined && student.marks[sub] !== '' ? (
                                            <span className={`font-bold ${student.marks[sub] === 0 ? 'text-red-500' : 'text-gray-900'}`}>{student.marks[sub]}</span>
                                          ) : (
                                            <span className="text-gray-300 text-xs italic">N/A</span>
                                          )}
                                        </td>
                                      ))}
                                      <td className="p-3 text-center bg-gray-50/50 border border-gray-300">
                                        {hasAnyMark ? (
                                          <span className="font-black text-[#A05C2B] text-base">{totalObtained}</span>
                                        ) : (
                                          <span className="text-gray-300 text-xs">—</span>
                                        )}
                                      </td>
                                      <td className="p-3 text-center bg-gray-50/50 border border-gray-300 font-bold">
                                        {hasAnyMark ? percentage + '%' : '—'}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center bg-white rounded-2xl border border-gray-200 shadow-sm">
                  <AlertTriangle className="w-12 h-12 text-amber-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Marks Entry is Locked</h3>
                  <p className="text-gray-500 font-medium">Unlock Marks Entry from the Overview tab to allow teachers to draft results.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'syllabus' && (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Syllabus Editor</h3>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {(selectedExam.classes || []).map(c => {
                  const classSyllabus = (selectedExam.syllabus || []).filter((s: any) => String(s.classId) === String(c) || s.className === c || s.className === `Class ${c}`);
                  const isExpanded = expandedSyllabusClass === c;
                  return (
                    <div key={c} className="border-b border-gray-100 last:border-0">
                      <button
                        onClick={() => setExpandedSyllabusClass(isExpanded ? null : c)}
                        className="w-full p-4 flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <h4 className="text-md font-bold text-[#A05C2B]">{c}</h4>
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                      </button>
                      {isExpanded && (
                        <div className="p-4 space-y-4 bg-white animate-in slide-in-from-top-2 fade-in duration-300 origin-top">
                          {classSyllabus.length > 0 ? (
                            classSyllabus.map((sItem: any) => (
                              <div key={sItem.id} className="p-4 border border-gray-100 rounded-xl bg-gray-50/50 relative group">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <h5 className="font-bold text-gray-900">{sItem.subject}</h5>
                                    <span className="text-xs font-semibold text-gray-500">Section: {sItem.sectionId || sItem.section || 'All'}</span>
                                  </div>
                                  <button onClick={() => { setEditingSyllabusId(sItem.id); setEditingTagsText((sItem.tags || []).join(', ')); }} className="text-blue-500 hover:text-blue-700">
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                </div>
                                {editingSyllabusId === sItem.id ? (
                                  <div className="mt-3 flex gap-2 items-center">
                                    <input
                                      type="text"
                                      value={editingTagsText}
                                      onChange={e => setEditingTagsText(e.target.value)}
                                      className="flex-1 p-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#A05C2B]/30"
                                      placeholder="Tags (comma separated)..."
                                    />
                                    <button onClick={() => saveSyllabusTags(sItem.id, c)} className="p-2 bg-[#1F2937] text-white rounded-lg hover:bg-gray-800 transition-colors"><Save className="w-4 h-4" /></button>
                                    <button onClick={() => setEditingSyllabusId(null)} className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"><X className="w-4 h-4" /></button>
                                  </div>
                                ) : (
                                  <ul className="list-disc list-inside mt-3 space-y-1">
                                    {(sItem.tags || []).map((t: string, idx: number) => (
                                      <li key={idx} className="text-sm text-gray-700 font-medium">
                                        {t}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500 italic">No syllabus published for this class yet.</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'criteria' && (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Evaluation Metrics</h3>
                {isMetricsLocked ? (
                  <button onClick={() => setIsMetricsLocked(false)} className="flex items-center gap-2 bg-[#A05C2B] text-white px-5 py-2.5 rounded-xl font-bold shadow-md hover:bg-[#8b4d24] transition-colors">
                    <Edit3 className="w-4 h-4" /> Edit Metrics
                  </button>
                ) : (
                  <button onClick={saveMetrics} className="flex items-center gap-2 bg-[#1F2937] text-white px-5 py-2.5 rounded-xl font-bold shadow-md hover:bg-gray-800 transition-colors">
                    <Save className="w-4 h-4" /> Save Metrics
                  </button>
                )}
              </div>

              <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200 shadow-sm">
                {!isMetricsLocked && (
                  <>
                    <p className="text-center text-lg font-bold text-gray-500 mb-8">How do you want to set the maximum and passing marks?</p>

                    <div className="flex flex-col sm:flex-row justify-center gap-4 mb-10">
                      <button
                        onClick={() => setMetricsType('same')}
                        className={`p-5 rounded-3xl border-4 transition-all flex-1 max-w-[280px] mx-auto sm:mx-0 text-center ${metricsType === 'same' ? 'border-[#A05C2B] bg-[#FDF7EE] shadow-lg scale-105' : 'border-gray-100 bg-white hover:border-gray-200 opacity-60'}`}
                      >
                        <h3 className={`text-xl font-black mb-1 ${metricsType === 'same' ? 'text-[#A05C2B]' : 'text-gray-500'}`}>Same for All</h3>
                        <p className="text-sm font-bold text-gray-400">One set of metrics</p>
                      </button>
                      <button
                        onClick={() => {
                          setMetricsType('different');
                          if (evalDrafts.length === 0) addEvalDraft();
                        }}
                        className={`p-5 rounded-3xl border-4 transition-all flex-1 max-w-[280px] mx-auto sm:mx-0 text-center ${metricsType === 'different' ? 'border-[#A05C2B] bg-[#FDF7EE] shadow-lg scale-105' : 'border-gray-100 bg-white hover:border-gray-200 opacity-60'}`}
                      >
                        <h3 className={`text-xl font-black mb-1 ${metricsType === 'different' ? 'text-[#A05C2B]' : 'text-gray-500'}`}>Different Groups</h3>
                        <p className="text-sm font-bold text-gray-400">Create evaluation drafts</p>
                      </button>
                    </div>
                  </>
                )}

                <div className="mb-4">
                  {isMetricsLocked ? (
                    <div className="space-y-6">
                      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-xl shadow-sm">
                        <p className="text-sm font-bold text-blue-800">Metrics are locked for this exam. Click Edit to unlock and make changes.</p>
                      </div>

                      {metricsType === 'same' ? (
                        <div className="flex justify-center gap-8 items-center bg-gray-50/50 p-8 rounded-2xl border border-gray-100">
                          <div className="text-center">
                            <p className="text-xl font-bold text-gray-400 mb-2">Max Marks</p>
                            <p className="text-5xl font-black text-gray-800">{sameMetrics.maxMarks}</p>
                          </div>
                          <div className="w-px h-24 bg-gray-200"></div>
                          <div className="text-center">
                            <p className="text-xl font-bold text-gray-400 mb-2">Pass %</p>
                            <p className="text-5xl font-black text-[#A05C2B]">{sameMetrics.passPercent}%</p>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {evalDrafts.map((draft, draftIdx) => (
                            <div key={draft.id} className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 shadow-sm">
                              <h4 className="text-lg font-black text-gray-800 mb-4">Group {draftIdx + 1}</h4>
                              <div className="flex flex-wrap gap-2 mb-4">
                                {draft.classes.map(c => <span key={c} className="bg-white border border-gray-200 px-3 py-1 rounded-full text-xs font-bold text-gray-600">{c}</span>)}
                              </div>
                              <div className="flex gap-4">
                                <div className="flex-1 text-center">
                                  <p className="text-xs font-bold text-gray-400 uppercase mb-1">Max Marks</p>
                                  <p className="text-2xl font-black text-gray-800">{draft.maxMarks}</p>
                                </div>
                                <div className="flex-1 text-center">
                                  <p className="text-xs font-bold text-[#A05C2B] uppercase mb-1">Pass %</p>
                                  <p className="text-2xl font-black text-[#A05C2B]">{draft.passPercent}%</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : metricsType === 'same' ? (
                    <div className="flex flex-col md:flex-row justify-center gap-8 items-center bg-gray-50/50 p-8 rounded-2xl border border-gray-100">
                      <div className="text-center">
                        <label className="block text-xl font-bold text-gray-400 mb-4">Max Marks</label>
                        <input type="number" value={sameMetrics.maxMarks} onChange={e => setSameMetrics({ ...sameMetrics, maxMarks: +e.target.value })}
                          className="w-48 text-5xl text-center bg-transparent border-b-4 border-gray-200 focus:border-[#A05C2B] outline-none py-2 font-black text-gray-800 transition-colors" />
                      </div>
                      <div className="hidden md:block w-px h-24 bg-gray-200"></div>
                      <div className="text-center">
                        <label className="block text-xl font-bold text-gray-400 mb-4">Pass %</label>
                        <input type="number" value={sameMetrics.passPercent} onChange={e => setSameMetrics({ ...sameMetrics, passPercent: +e.target.value })}
                          className="w-48 text-5xl text-center bg-transparent border-b-4 border-gray-200 focus:border-[#A05C2B] outline-none py-2 font-black text-gray-800 transition-colors" />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {evalDrafts.map((draft, draftIdx) => {
                        const assignedClasses = evalDrafts.flatMap(d => d.classes);
                        const unassignedEvalClasses = (selectedExam.classes || []).filter(c => !assignedClasses.includes(c));
                        const pool = [...new Set([...unassignedEvalClasses, ...draft.classes])].sort();

                        return (
                          <div key={draft.id} className="bg-white p-6 rounded-2xl border-2 border-gray-100 shadow-sm relative">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-lg font-black text-gray-800">Group {draftIdx + 1}</h4>
                              {evalDrafts.length > 1 && (
                                <button onClick={() => removeEvalDraft(draft.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-colors"><Trash2 className="w-5 h-5" /></button>
                              )}
                            </div>

                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Assign Classes</label>
                            <ClassPillSelector
                              selected={draft.classes}
                              onToggle={(cls) => toggleEvalDraftClass(draft.id, cls)}
                              pool={pool}
                            />

                            <div className="flex flex-col sm:flex-row gap-6 mt-6">
                              <div className="flex-1 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                                <label className="block text-sm font-bold text-gray-400 mb-2 text-center">Max Marks</label>
                                <input type="number" value={draft.maxMarks} onChange={e => updateEvalDraft(draft.id, { maxMarks: +e.target.value })}
                                  className="w-full text-4xl text-center bg-transparent border-b-2 border-gray-200 focus:border-[#A05C2B] outline-none py-2 font-black text-gray-800 transition-colors" />
                              </div>
                              <div className="flex-1 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                                <label className="block text-sm font-bold text-gray-400 mb-2 text-center">Pass %</label>
                                <input type="number" value={draft.passPercent} onChange={e => updateEvalDraft(draft.id, { passPercent: +e.target.value })}
                                  className="w-full text-4xl text-center bg-transparent border-b-2 border-gray-200 focus:border-[#A05C2B] outline-none py-2 font-black text-gray-800 transition-colors" />
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {evalDrafts.flatMap(d => d.classes).length < (selectedExam.classes || []).length && (
                        <button onClick={addEvalDraft}
                          className="w-full py-4 border-2 border-dashed border-[#A05C2B]/40 text-[#A05C2B] rounded-2xl font-bold text-lg hover:bg-[#FDF7EE] transition-colors flex items-center justify-center gap-2">
                          <Plus className="w-5 h-5" /> Add Another Evaluation Group
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'datesheet' && (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Datesheet</h3>
                <div className="flex gap-2">
                  <button onClick={() => setIsPostponeModalOpen(true)} className="px-4 py-2.5 bg-amber-50 text-amber-600 rounded-xl text-sm font-bold shadow-sm hover:bg-amber-100 transition-colors">Postpone Exam</button>
                  {isDatesheetLocked ? (
                    <button onClick={() => setIsDatesheetLocked(false)} className="flex items-center gap-2 bg-[#A05C2B] text-white px-5 py-2.5 rounded-xl font-bold shadow-md hover:bg-[#8b4d24] transition-colors">
                      <Edit3 className="w-4 h-4" /> Edit Datesheet
                    </button>
                  ) : (
                    <button onClick={saveDatesheet} className="flex items-center gap-2 bg-[#1F2937] text-white px-5 py-2.5 rounded-xl font-bold shadow-md hover:bg-gray-800 transition-colors">
                      <Save className="w-4 h-4" /> Save Datesheet
                    </button>
                  )}
                </div>
              </div>

              {(() => {
                const examDatesheets = datesheets.filter(d => d.examId === selectedExam.id);
                const allDates = examDatesheets.flatMap(d => (d.rows || (d as any).schedule || []).map((r: any) => new Date(r.date).getTime())).filter(Boolean);
                const firstDate = allDates.length > 0 ? Math.min(...allDates) : null;
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const autoUnlockEligible = firstDate ? (today.getTime() >= firstDate && !selectedExam.isMarksEntryOpen) : false;

                return autoUnlockEligible ? (
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-xl shadow-sm mb-4">
                    <p className="text-sm font-bold text-blue-800">Auto-Unlock Eligible: The exam date has reached. You can unlock marks entry from the Overview tab.</p>
                  </div>
                ) : null;
              })()}

              <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200 shadow-sm">
                {!isDatesheetLocked && (
                  <>
                    <p className="text-center text-lg font-bold text-gray-500 mb-8">How do you want to build the datesheet?</p>

                    <div className="flex flex-col sm:flex-row justify-center gap-4 mb-10">
                      <button
                        onClick={() => setDatesheetType('same')}
                        className={`px-6 py-3 rounded-full font-bold border-2 transition-all ${datesheetType === 'same' ? 'bg-[#A05C2B] border-[#A05C2B] text-white' : 'bg-white border-gray-200 text-gray-500'}`}
                      >
                        Same for all classes
                      </button>
                      <button
                        onClick={() => {
                          setDatesheetType('different');
                          if (datesheetDrafts.length === 0) addDatesheetDraft();
                        }}
                        className={`px-6 py-3 rounded-full font-bold border-2 transition-all ${datesheetType === 'different' ? 'bg-[#A05C2B] border-[#A05C2B] text-white' : 'bg-white border-gray-200 text-gray-500'}`}
                      >
                        Different Datesheet Drafts
                      </button>
                    </div>
                  </>
                )}

                <div className="mb-4">
                  {isDatesheetLocked ? (
                    <div className="space-y-6">
                      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-xl shadow-sm">
                        <p className="text-sm font-bold text-blue-800">Datesheet is locked for this exam. Click Edit to unlock and make changes.</p>
                      </div>

                      {datesheetType === 'same' ? (
                        <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 shadow-sm">
                          <p className="text-sm text-gray-500 mb-4 font-medium">This schedule applies to <strong>all {selectedExam.classes?.length || 0} classes</strong>.</p>
                          <ExamCustomCalendar monthString={selectedExam.month || 'October 2026'} holidayDates={[]} onSelect={() => { }} />
                          <ScheduleEditor
                            rows={sameDatesheet}
                            onSubjectChange={() => { }}
                            onRemoveRow={() => { }}
                          />
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {datesheetDrafts.map((draft, draftIdx) => (
                            <div key={draft.id} className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 shadow-sm">
                              <h4 className="text-lg font-black text-gray-800 mb-4">Datesheet Draft {draftIdx + 1}</h4>
                              <div className="flex flex-wrap gap-2 mb-4">
                                {draft.classes.map(c => <span key={c} className="bg-white border border-gray-200 px-3 py-1 rounded-full text-xs font-bold text-gray-600">{c}</span>)}
                              </div>
                              <ExamCustomCalendar monthString={selectedExam.month || 'October 2026'} holidayDates={[]} onSelect={() => { }} />
                              <ScheduleEditor
                                rows={draft.rows}
                                onSubjectChange={() => { }}
                                onRemoveRow={() => { }}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : datesheetType === 'same' ? (
                    <div className="bg-white p-6 rounded-3xl border-2 border-gray-100 shadow-sm mb-8">
                      <p className="text-sm text-gray-500 mb-4 font-medium">This schedule will apply to <strong>all {selectedExam.classes?.length || 0} classes</strong>.</p>
                      <ExamCustomCalendar monthString={selectedExam.month || 'October 2026'} holidayDates={[]} onSelect={(dateStr) => {
                        if (!sameDatesheet.some(r => r.date === dateStr)) {
                          setSameDatesheet([...sameDatesheet, { subject: '', date: dateStr }].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
                        }
                      }} />
                      <ScheduleEditor
                        rows={sameDatesheet}
                        onSubjectChange={(i, v) => { const nr = [...sameDatesheet]; nr[i] = { ...nr[i], subject: v }; setSameDatesheet(nr); }}
                        onRemoveRow={(i) => setSameDatesheet(sameDatesheet.filter((_, idx) => idx !== i))}
                      />
                    </div>
                  ) : (
                    <div className="space-y-6 pr-2 mb-8">
                      {datesheetDrafts.map((draft, draftIdx) => {
                        const assignedClasses = datesheetDrafts.flatMap(d => d.classes);
                        const unassignedDsClasses = (selectedExam.classes || []).filter(c => !assignedClasses.includes(c));
                        const pool = [...new Set([...unassignedDsClasses, ...draft.classes])].sort();
                        return (
                          <div key={draft.id} className="bg-white p-6 rounded-2xl border-2 border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-lg font-black text-gray-800">Datesheet Draft {draftIdx + 1}</h4>
                              {datesheetDrafts.length > 1 && (
                                <button onClick={() => removeDatesheetDraft(draft.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-colors"><Trash2 className="w-5 h-5" /></button>
                              )}
                            </div>

                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Assign Classes</label>
                            <ClassPillSelector
                              selected={draft.classes}
                              onToggle={(cls) => toggleDsDraftClass(draft.id, cls)}
                              pool={pool}
                            />

                            <div className="mt-5">
                              <ExamCustomCalendar monthString={selectedExam.month || 'October 2026'} holidayDates={[]} onSelect={(dateStr) => addDsDraftDate(draft.id, dateStr)} />
                            </div>

                            <ScheduleEditor
                              rows={draft.rows}
                              onSubjectChange={(i, v) => updateDsDraftSubject(draft.id, i, v)}
                              onRemoveRow={(i) => removeDsDraftRow(draft.id, i)}
                            />
                          </div>
                        );
                      })}

                      {datesheetDrafts.flatMap(d => d.classes).length < (selectedExam.classes || []).length && (
                        <button onClick={addDatesheetDraft}
                          className="w-full py-4 border-2 border-dashed border-gray-300 text-gray-500 rounded-2xl font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                          <Plus className="w-5 h-5" /> Add Another Datesheet Draft
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {isPostponeModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#1F2937]/40 backdrop-blur-sm animate-in fade-in">
            <GlassCard className="w-full max-w-sm bg-white p-6 border border-white/50 shadow-2xl relative">
              <button onClick={() => setIsPostponeModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-[#A05C2B]" /> Postpone Exam
              </h2>
              <p className="text-sm text-gray-500 mb-6">This will cancel the current datesheet and force you to create a new one.</p>

              <div className="flex justify-end gap-3 mt-6">
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
        <div className="absolute inset-0 z-50 bg-white p-4 overflow-y-auto">
          <ExamWizard onComplete={() => setIsCreating(false)} onCancel={() => setIsCreating(false)} />
        </div>
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
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${exam.isMarksEntryOpen ? 'text-amber-600' : 'text-gray-400'}`}>
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