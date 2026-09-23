import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, X, Plus, Trash2 } from 'lucide-react';
import { useExams, Exam, DatesheetRow } from '../../hooks/useExams';
import { NotificationService } from '../../services/NotificationService';
import { useSuccess } from '../../context/SuccessContext';
import { useLoader } from '../../context/LoaderContext';
import { ExamCustomCalendar } from '../../components/exams/ExamCustomCalendar';

// ── Extracted sub-components (outside render to prevent remount/focus-loss) ───

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

function ScheduleEditor({ rows, onSubjectChange, onRemoveRow }: { rows: DatesheetRow[], onSubjectChange: (i: number, v: string) => void, onRemoveRow: (i: number) => void }) {
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

// ── Types ──────────────────────────────────────────────────────────────────────
interface EvalDraft {
  id: string;
  classes: string[];
  maxMarks: number;
  passPercent: number;
}

interface DatesheetDraft {
  id: string;
  classes: string[];
  schedule: DatesheetRow[];
}

// ── Component ──────────────────────────────────────────────────────────────────
export function ExamWizard({ onComplete, onCancel }: { onComplete: () => void, onCancel: () => void }) {
  const { addExam, addDatesheet } = useExams();
  const { triggerSuccess, triggerVictory } = useSuccess();
  const { runWithLoader } = useLoader();

  const [step, setStep] = useState(1);
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const [holidayDates, setHolidayDates] = useState<string[]>([]);

  // ── Step 1: Identity ─────────────────────────────────────────────────────────
  const [examName, setExamName] = useState('');
  const [examMonth, setExamMonth] = useState('');
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);

  // ── Step 2: Participating Classes ────────────────────────────────────────────
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

  // ── Step 3: Evaluation Metrics ───────────────────────────────────────────────
  const [metricsType, setMetricsType] = useState<'same' | 'different'>('same');
  const [sameMetrics, setSameMetrics] = useState({ maxMarks: 100, passPercent: 33 });
  const [evalDrafts, setEvalDrafts] = useState<EvalDraft[]>([]);

  // ── Step 4: Datesheet ────────────────────────────────────────────────────────
  const [datesheetDecision, setDatesheetDecision] = useState<'later' | 'now' | null>(null);
  const [datesheetType, setDatesheetType] = useState<'same' | 'different'>('same');
  const [sameDatesheetRows, setSameDatesheetRows] = useState<DatesheetRow[]>([]);
  const [datesheetDrafts, setDatesheetDrafts] = useState<DatesheetDraft[]>([]);

  const [showSkipWarning, setShowSkipWarning] = useState(false);
  const [showEvalSkipWarning, setShowEvalSkipWarning] = useState(false);

  // ── Init ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const classes = JSON.parse(localStorage.getItem('ajps_classes') || '[]');
    setAvailableClasses(classes.map((c: any) => c.className || c.name || `Class ${c.id}`));

    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const current = new Date();
    const nextMonths = [];
    for (let i = 0; i < 3; i++) {
      const d = new Date(current.getFullYear(), current.getMonth() + i, 1);
      nextMonths.push(`${months[d.getMonth()]} ${d.getFullYear()}`);
    }
    setAvailableMonths(nextMonths);
    setExamMonth(nextMonths[0]);

    const notices = JSON.parse(localStorage.getItem('ajps_notices') || '[]');
    const hDates = notices
      .filter((n: any) => (n.templateType === 'holiday' || n.templateType === 'leave') && n.targetDate)
      .map((n: any) => n.targetDate);
    setHolidayDates(hDates);
  }, []);

  // ── Derived: which classes are already assigned in eval/datesheet drafts ─────
  const assignedEvalClasses = useMemo(() => evalDrafts.flatMap(d => d.classes), [evalDrafts]);
  const unassignedEvalClasses = useMemo(() => selectedClasses.filter(c => !assignedEvalClasses.includes(c)), [selectedClasses, assignedEvalClasses]);
  const assignedDsClasses = useMemo(() => datesheetDrafts.flatMap(d => d.classes), [datesheetDrafts]);
  const unassignedDsClasses = useMemo(() => selectedClasses.filter(c => !assignedDsClasses.includes(c)), [selectedClasses, assignedDsClasses]);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const slideVariants = {
    initial: { x: 50, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -50, opacity: 0 }
  };

  const handleNextStep4 = () => {
    if (datesheetDecision === 'later' || (!isStep4Valid && datesheetDecision === 'now')) {
      setShowSkipWarning(true);
    } else {
      setStep(5);
    }
  };

  const handleNextStep3 = () => {
    if (metricsType === 'different' && (evalDrafts.length === 0 || !evalDrafts.every(d => d.classes.length > 0))) {
      setShowEvalSkipWarning(true);
    } else {
      setStep(4);
    }
  };

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => Math.max(1, s - 1));
  const uid = () => `_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  // ── Eval Draft helpers ───────────────────────────────────────────────────────
  const addEvalDraft = () => {
    setEvalDrafts([...evalDrafts, { id: uid(), classes: [], maxMarks: 100, passPercent: 33 }]);
  };
  const removeEvalDraft = (id: string) => setEvalDrafts(evalDrafts.filter(d => d.id !== id));
  const updateEvalDraft = (id: string, patch: Partial<EvalDraft>) => {
    setEvalDrafts(evalDrafts.map(d => d.id === id ? { ...d, ...patch } : d));
  };
  const toggleEvalDraftClass = (draftId: string, cls: string) => {
    const draft = evalDrafts.find(d => d.id === draftId);
    if (!draft) return;
    const classes = draft.classes.includes(cls) ? draft.classes.filter(c => c !== cls) : [...draft.classes, cls];
    updateEvalDraft(draftId, { classes });
  };

  // ── Datesheet Draft helpers ──────────────────────────────────────────────────
  const addDatesheetDraft = () => {
    setDatesheetDrafts([...datesheetDrafts, { id: uid(), classes: [], schedule: [] }]);
  };
  const removeDatesheetDraft = (id: string) => setDatesheetDrafts(datesheetDrafts.filter(d => d.id !== id));
  const toggleDsDraftClass = (draftId: string, cls: string) => {
    const draft = datesheetDrafts.find(d => d.id === draftId);
    if (!draft) return;
    const classes = draft.classes.includes(cls) ? draft.classes.filter(c => c !== cls) : [...draft.classes, cls];
    setDatesheetDrafts(datesheetDrafts.map(d => d.id === draftId ? { ...d, classes } : d));
  };
  const addDsDraftDate = (draftId: string, dateStr: string) => {
    setDatesheetDrafts(datesheetDrafts.map(d => {
      if (d.id !== draftId) return d;
      if (d.schedule.some(r => r.date === dateStr)) return d;
      return { ...d, schedule: [...d.schedule, { subject: '', date: dateStr }].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) };
    }));
  };
  const updateDsDraftSubject = (draftId: string, rowIdx: number, subject: string) => {
    setDatesheetDrafts(datesheetDrafts.map(d => {
      if (d.id !== draftId) return d;
      const schedule = [...d.schedule];
      schedule[rowIdx] = { ...schedule[rowIdx], subject };
      return { ...d, schedule };
    }));
  };
  const removeDsDraftRow = (draftId: string, rowIdx: number) => {
    setDatesheetDrafts(datesheetDrafts.map(d => {
      if (d.id !== draftId) return d;
      return { ...d, schedule: d.schedule.filter((_, i) => i !== rowIdx) };
    }));
  };

  // ── Step 3 validation ───────────────────────────────────────────────────────
  const isStep3Valid = metricsType === 'same' || (evalDrafts.length > 0 && evalDrafts.every(d => d.classes.length > 0));

  // ── Step 4 validation ───────────────────────────────────────────────────────
  const isStep4Valid = (() => {
    if (!datesheetDecision) return false;
    if (datesheetDecision === 'later') return true;
    if (datesheetType === 'same') return sameDatesheetRows.length > 0 && sameDatesheetRows.every(r => r.subject.trim());
    return datesheetDrafts.length > 0 && datesheetDrafts.every(d => d.classes.length > 0 && d.schedule.length > 0 && d.schedule.every(r => r.subject.trim()));
  })();

  // ── Final Submission ─────────────────────────────────────────────────────────
  const handleSubmit = () => {
    runWithLoader(() => {
      const examId = `exam_${Date.now()}`;

      // Build metrics for Exam object
      const metricsPayload: Exam['metrics'] = metricsType === 'same'
        ? { type: 'same', same: sameMetrics }
        : {
          type: 'different',
          different: Object.fromEntries(
            evalDrafts.flatMap(d => d.classes.map(cls => [cls, { maxMarks: d.maxMarks, passPercent: d.passPercent }]))
          )
        };

      const newExam: Exam = {
        id: examId,
        name: examName,
        month: examMonth,
        startDate: sameDatesheetRows.length > 0 ? sameDatesheetRows[0].date : '',
        endDate: sameDatesheetRows.length > 0 ? sameDatesheetRows[sameDatesheetRows.length - 1].date : '',
        classes: selectedClasses,
        isMarksEntryOpen: false,
        metrics: metricsPayload
      };

      addExam(newExam);

      // Save datesheets
      if (datesheetDecision === 'now') {
        if (datesheetType === 'same') {
          selectedClasses.forEach(c => {
            addDatesheet(examId, [c], sameDatesheetRows);
          });
        } else {
          datesheetDrafts.forEach(ds => {
            ds.classes.forEach(c => {
              addDatesheet(examId, [c], ds.schedule);
            });
          });
        }
      }

      // Notify students and teachers
      const allUsers = JSON.parse(localStorage.getItem('ajps_users') || '[]');
      const targetUsers = allUsers.filter((u: any) => {
        if (u.role !== 'Student' && u.role !== 'Teacher') return false;
        return selectedClasses.some(sc => {
          const scName = sc.replace('Class ', '').trim();
          const uName = (u.className || String(u.classId || '')).replace('Class ', '').trim();
          return scName === uName ||
            (u.assignedClass && u.assignedClass.includes(`c${scName}`)) ||
            u.classTeacherClass === scName;
        });
      });

      NotificationService.sendNotification({
        recipientIds: targetUsers.map((u: any) => u.id),
        title: 'New Exam Declared',
        message: `${examName} for ${examMonth} has been declared and scheduled.`,
        type: 'success',
        actionPath: '/exams',
        actionLabel: 'View Details'
      });

      triggerSuccess('Exam Declared!');
      onComplete();
    });
  };

  const handlePublishLater = () => {
    runWithLoader(() => {
      const examId = `exam_${Date.now()}`;
      const metricsPayload: Exam['metrics'] = metricsType === 'same'
        ? { type: 'same', same: sameMetrics }
        : {
          type: 'different',
          different: Object.fromEntries(
            evalDrafts.flatMap(d => d.classes.map(cls => [cls, { maxMarks: d.maxMarks, passPercent: d.passPercent }]))
          )
        };

      addExam({
        id: examId,
        name: examName,
        month: examMonth,
        startDate: '',
        endDate: '',
        classes: selectedClasses,
        isMarksEntryOpen: false,
        metrics: metricsPayload
      });

      // Notify students and teachers even if datesheet is not published yet
      const allUsers = JSON.parse(localStorage.getItem('ajps_users') || '[]');
      const targetUsers = allUsers.filter((u: any) => {
        if (u.role !== 'Student' && u.role !== 'Teacher') return false;
        return selectedClasses.some(sc => {
          const scName = sc.replace('Class ', '').trim();
          const uName = (u.className || String(u.classId || '')).replace('Class ', '').trim();
          return scName === uName ||
            (u.assignedClass && u.assignedClass.includes(`c${scName}`)) ||
            u.classTeacherClass === scName;
        });
      });

      NotificationService.sendNotification({
        recipientIds: targetUsers.map((u: any) => u.id),
        title: 'New Exam Declared',
        message: `${examName} for ${examMonth} has been declared. The datesheet will be announced soon.`,
        type: 'info',
        actionPath: '/exams',
        actionLabel: 'View Updates'
      });

      triggerSuccess('Exam Draft Saved Successfully.');
      onComplete();
    });
  };

  // Sub-components are defined outside the component to prevent remount/focus-loss

  // ── Render Steps ─────────────────────────────────────────────────────────────
  const renderStep = () => {
    switch (step) {

      // ════════════════════════════════════════════════════════════════════════
      // STEP 1: Exam Identity (Name + Month)
      // ════════════════════════════════════════════════════════════════════════
      case 1:
        return (
          <motion.div key="step1" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="w-full max-w-2xl mx-auto py-12 px-6 relative">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-12 text-center tracking-tight">Name & Timeline</h2>

            <div className="relative mb-10">
              <label className="block text-center text-lg font-bold text-gray-400 mb-3">Exam Name</label>
              <input
                type="text"
                value={examName}
                onChange={e => setExamName(e.target.value)}
                className="w-full text-3xl md:text-5xl text-center bg-transparent border-b-4 border-gray-200 focus:border-[#A05C2B] outline-none py-4 text-gray-800 font-bold placeholder-gray-300 transition-colors"
                placeholder="e.g., Half Yearly"
                autoFocus
              />
            </div>

            <div className="relative mb-16">
              <label className="block text-center text-lg font-bold text-gray-400 mb-3">Target Month</label>
              <select
                value={examMonth}
                onChange={e => setExamMonth(e.target.value)}
                className="w-full md:w-3/4 mx-auto block text-3xl md:text-4xl text-center bg-transparent border-b-4 border-gray-200 focus:border-[#A05C2B] outline-none py-4 text-gray-800 font-bold appearance-none cursor-pointer"
              >
                {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <button
              onClick={handleNext}
              disabled={!examName.trim()}
              className="mx-auto flex items-center justify-center gap-3 bg-[#1F2937] text-white px-10 py-5 rounded-full text-xl font-bold shadow-xl hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              Next <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        );

      // ════════════════════════════════════════════════════════════════════════
      // STEP 2: Participating Classes
      // ════════════════════════════════════════════════════════════════════════
      case 2:
        return (
          <motion.div key="step2" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="w-full max-w-4xl mx-auto py-12 px-6 text-center relative">
            <button onClick={handleBack} className="absolute top-0 left-4 text-[#8B5E2E] font-bold hover:underline flex items-center gap-1">&lt; Back</button>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-12 tracking-tight">Which classes will take this exam?</h2>

            <button
              onClick={() => setSelectedClasses(selectedClasses.length === availableClasses.length ? [] : [...availableClasses])}
              className="mb-8 px-8 py-3 rounded-full text-lg font-bold border-2 transition-colors inline-block text-[#A05C2B] border-[#A05C2B] hover:bg-[#FDF7EE]"
            >
              {selectedClasses.length === availableClasses.length ? 'Deselect All' : 'Select All'}
            </button>

            <div className="flex flex-wrap justify-center gap-4 mb-16">
              {availableClasses.map(cls => {
                const isSelected = selectedClasses.includes(cls);
                return (
                  <button
                    key={cls}
                    onClick={() => {
                      if (isSelected) setSelectedClasses(selectedClasses.filter(c => c !== cls));
                      else setSelectedClasses([...selectedClasses, cls]);
                    }}
                    className={`px-8 py-4 rounded-full text-2xl font-black border-4 transition-all shadow-md transform hover:scale-105
                      ${isSelected ? 'bg-[#A05C2B] border-[#A05C2B] text-white' : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'}`}
                  >
                    {cls}
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleNext}
              disabled={selectedClasses.length === 0}
              className="mx-auto flex items-center justify-center gap-3 bg-[#1F2937] text-white px-10 py-5 rounded-full text-xl font-bold shadow-xl hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              Next <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        );

      // ════════════════════════════════════════════════════════════════════════
      // STEP 3: Evaluation Metrics (Same or Draft Groups)
      // ════════════════════════════════════════════════════════════════════════
      case 3:
        return (
          <motion.div key="step3" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="w-full max-w-4xl mx-auto py-12 px-6 relative">
            <button onClick={handleBack} className="absolute top-0 left-4 text-[#8B5E2E] font-bold hover:underline flex items-center gap-1">&lt; Back</button>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 text-center tracking-tight">Set the Evaluation Metrics</h2>
            <p className="text-center text-lg font-bold text-gray-400 mb-10">How do you want to set the maximum and passing marks?</p>

            {/* Toggle */}
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

            {/* Content */}
            <div className="mb-12 min-h-[180px]">
              {metricsType === 'same' ? (
                <div className="flex flex-col md:flex-row justify-center gap-8 items-center">
                  <div className="text-center">
                    <label className="block text-xl font-bold text-gray-400 mb-4">Max Marks</label>
                    <input type="number" value={sameMetrics.maxMarks} onChange={e => setSameMetrics({ ...sameMetrics, maxMarks: +e.target.value })}
                      className="w-48 text-5xl text-center bg-transparent border-b-4 border-gray-200 focus:border-[#A05C2B] outline-none py-2 font-black text-gray-800" />
                  </div>
                  <div className="hidden md:block w-px h-24 bg-gray-200"></div>
                  <div className="text-center">
                    <label className="block text-xl font-bold text-gray-400 mb-4">Pass %</label>
                    <input type="number" value={sameMetrics.passPercent} onChange={e => setSameMetrics({ ...sameMetrics, passPercent: +e.target.value })}
                      className="w-48 text-5xl text-center bg-transparent border-b-4 border-gray-200 focus:border-[#A05C2B] outline-none py-2 font-black text-gray-800" />
                  </div>
                </div>
              ) : (
                <div className="space-y-6 pr-2">
                  {evalDrafts.map((draft, draftIdx) => {
                    // Pool = unassigned + this draft's own classes
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

                        <div className="flex flex-col sm:flex-row gap-6 mt-5">
                          <div className="flex-1">
                            <label className="block text-sm font-bold text-gray-400 mb-1">Max Marks</label>
                            <input type="number" value={draft.maxMarks} onChange={e => updateEvalDraft(draft.id, { maxMarks: +e.target.value })}
                              className="w-full text-3xl text-center bg-transparent border-b-2 border-gray-200 focus:border-[#A05C2B] outline-none py-1 font-black text-gray-800" />
                          </div>
                          <div className="flex-1">
                            <label className="block text-sm font-bold text-gray-400 mb-1">Pass %</label>
                            <input type="number" value={draft.passPercent} onChange={e => updateEvalDraft(draft.id, { passPercent: +e.target.value })}
                              className="w-full text-3xl text-center bg-transparent border-b-2 border-gray-200 focus:border-[#A05C2B] outline-none py-1 font-black text-gray-800" />
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {unassignedEvalClasses.length > 0 && (
                    <button onClick={addEvalDraft}
                      className="w-full py-4 border-2 border-dashed border-[#A05C2B]/40 text-[#A05C2B] rounded-2xl font-bold text-lg hover:bg-[#FDF7EE] transition-colors flex items-center justify-center gap-2">
                      <Plus className="w-5 h-5" /> Add Another Evaluation Group
                    </button>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={handleNextStep3}
              className="mx-auto flex items-center justify-center gap-3 bg-[#1F2937] text-white px-10 py-5 rounded-full text-xl font-bold shadow-xl hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              Next <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        );

      // ════════════════════════════════════════════════════════════════════════
      // STEP 4: Datesheet Builder (Same or Draft Groups)
      // ════════════════════════════════════════════════════════════════════════
      case 4:
        return (
          <motion.div key="step4" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="w-full max-w-5xl mx-auto py-12 px-6 relative">
            <button onClick={handleBack} className="absolute top-0 left-4 text-[#8B5E2E] font-bold hover:underline flex items-center gap-1">&lt; Back</button>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-12 text-center tracking-tight">Publish the Datesheet?</h2>

            {/* Decision toggle */}
            <div className="flex flex-col sm:flex-row justify-center gap-6 mb-10">
              <button
                onClick={handlePublishLater}
                className={`p-6 rounded-3xl border-4 transition-all flex-1 max-w-[280px] mx-auto sm:mx-0 text-center ${datesheetDecision === 'later' ? 'border-[#A05C2B] bg-[#FDF7EE] shadow-lg scale-105' : 'border-gray-100 bg-white hover:border-gray-200'}`}
              >
                <h3 className={`text-2xl font-black mb-2 ${datesheetDecision === 'later' ? 'text-[#A05C2B]' : 'text-gray-500'}`}>Publish Later</h3>
                <p className="text-base font-bold text-gray-400">Just declare the exam for now</p>
              </button>
              <button
                onClick={() => setDatesheetDecision('now')}
                className={`p-6 rounded-3xl border-4 transition-all flex-1 max-w-[280px] mx-auto sm:mx-0 text-center ${datesheetDecision === 'now' ? 'border-[#A05C2B] bg-[#FDF7EE] shadow-lg scale-105' : 'border-gray-100 bg-white hover:border-gray-200'}`}
              >
                <h3 className={`text-2xl font-black mb-2 ${datesheetDecision === 'now' ? 'text-[#A05C2B]' : 'text-gray-500'}`}>Build Now</h3>
                <p className="text-base font-bold text-gray-400">Create the full schedule</p>
              </button>
            </div>

            {/* Build Now content */}
            {datesheetDecision === 'now' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                {/* Same vs Different toggle */}
                <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
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

                {datesheetType === 'same' ? (
                  /* ─── Same Datesheet ─── */
                  <div className="bg-white p-6 rounded-3xl border-2 border-gray-100 shadow-sm mb-8">
                    <p className="text-sm text-gray-500 mb-4 font-medium">This schedule will apply to <strong>all {selectedClasses.length} classes</strong>.</p>
                    <ExamCustomCalendar monthString={examMonth} holidayDates={holidayDates} onSelect={(dateStr) => {
                      if (!sameDatesheetRows.some(r => r.date === dateStr)) {
                        setSameDatesheetRows([...sameDatesheetRows, { subject: '', date: dateStr }].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
                      }
                    }} />
                    <ScheduleEditor
                      rows={sameDatesheetRows}
                      onSubjectChange={(i, v) => { const nr = [...sameDatesheetRows]; nr[i] = { ...nr[i], subject: v }; setSameDatesheetRows(nr); }}
                      onRemoveRow={(i) => setSameDatesheetRows(sameDatesheetRows.filter((_, idx) => idx !== i))}
                    />
                  </div>
                ) : (
                  /* ─── Different Datesheet Drafts ─── */
                  <div className="space-y-6 pr-2 mb-8">
                    {datesheetDrafts.map((draft, draftIdx) => {
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
                            <ExamCustomCalendar monthString={examMonth} holidayDates={holidayDates} onSelect={(dateStr) => addDsDraftDate(draft.id, dateStr)} />
                          </div>

                          <ScheduleEditor
                            rows={draft.schedule}
                            onSubjectChange={(i, v) => updateDsDraftSubject(draft.id, i, v)}
                            onRemoveRow={(i) => removeDsDraftRow(draft.id, i)}
                          />
                        </div>
                      );
                    })}

                    {unassignedDsClasses.length > 0 && (
                      <button onClick={addDatesheetDraft}
                        className="w-full py-4 border-2 border-dashed border-[#A05C2B]/40 text-[#A05C2B] rounded-2xl font-bold text-lg hover:bg-[#FDF7EE] transition-colors flex items-center justify-center gap-2">
                        <Plus className="w-5 h-5" /> Add Another Datesheet Draft
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* Next / Submit button */}
            {datesheetDecision && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={handleNextStep4}
                className="mx-auto flex items-center justify-center gap-3 bg-[#1F2937] text-white px-10 py-5 rounded-full text-xl font-bold shadow-xl hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                Next <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            )}
          </motion.div>
        );

      // ════════════════════════════════════════════════════════════════════════
      // STEP 5: Final Review & Submit
      // ════════════════════════════════════════════════════════════════════════
      case 5:
        return (
          <motion.div key="step5" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="w-full max-w-3xl mx-auto py-12 px-6 relative">
            <button onClick={handleBack} className="absolute top-0 left-4 text-[#8B5E2E] font-bold hover:underline flex items-center gap-1">&lt; Back</button>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-12 text-center tracking-tight">Review & Declare</h2>

            <div className="space-y-6 mb-12">
              {/* Name & Month */}
              <div className="bg-white p-6 rounded-2xl border-2 border-gray-100 shadow-sm relative group">
                <button onClick={() => setStep(1)} className="absolute top-4 right-4 text-[#8B5E2E] text-xs font-bold flex items-center gap-1 hover:underline opacity-0 group-hover:opacity-100 transition-opacity">Edit ✏️</button>
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Exam Name</p>
                    <p className="text-2xl font-black text-gray-900">{examName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Month</p>
                    <p className="text-2xl font-black text-[#A05C2B]">{examMonth}</p>
                  </div>
                </div>
              </div>

              {/* Classes */}
              <div className="bg-white p-6 rounded-2xl border-2 border-gray-100 shadow-sm relative group">
                <button onClick={() => setStep(2)} className="absolute top-4 right-4 text-[#8B5E2E] text-xs font-bold flex items-center gap-1 hover:underline opacity-0 group-hover:opacity-100 transition-opacity">Edit ✏️</button>
                <p className="text-xs font-bold text-gray-400 uppercase mb-3">Participating Classes</p>
                <div className="flex flex-wrap gap-2">
                  {selectedClasses.map(c => (
                    <span key={c} className="bg-[#FDF7EE] text-[#A05C2B] border border-[#A05C2B]/20 px-3 py-1.5 rounded-lg text-sm font-bold">{c}</span>
                  ))}
                </div>
              </div>

              {/* Evaluation */}
              <div className="bg-white p-6 rounded-2xl border-2 border-gray-100 shadow-sm relative group">
                <button onClick={() => setStep(3)} className="absolute top-4 right-4 text-[#8B5E2E] text-xs font-bold flex items-center gap-1 hover:underline opacity-0 group-hover:opacity-100 transition-opacity">Edit ✏️</button>
                <p className="text-xs font-bold text-gray-400 uppercase mb-3">Evaluation Metrics</p>
                {metricsType === 'same' ? (
                  <p className="text-lg font-bold text-gray-800">Max Marks: <span className="text-[#A05C2B]">{sameMetrics.maxMarks}</span> &nbsp;|&nbsp; Pass %: <span className="text-[#A05C2B]">{sameMetrics.passPercent}%</span></p>
                ) : (
                  <div className="space-y-2">
                    {evalDrafts.map((d, i) => (
                      <p key={d.id} className="text-base font-bold text-gray-700">
                        Group {i + 1}: Classes {d.classes.join(', ')} — Max: <span className="text-[#A05C2B]">{d.maxMarks}</span>, Pass: <span className="text-[#A05C2B]">{d.passPercent}%</span>
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* Datesheet */}
              <div className="bg-white p-6 rounded-2xl border-2 border-gray-100 shadow-sm relative group">
                <button onClick={() => setStep(4)} className="absolute top-4 right-4 text-[#8B5E2E] text-xs font-bold flex items-center gap-1 hover:underline opacity-0 group-hover:opacity-100 transition-opacity">Edit ✏️</button>
                <p className="text-xs font-bold text-gray-400 uppercase mb-3">Datesheet</p>
                {datesheetDecision === 'later' ? (
                  <p className="text-lg font-bold text-gray-500 italic">Will be published later</p>
                ) : datesheetType === 'same' ? (
                  <p className="text-lg font-bold text-gray-800">{sameDatesheetRows.length} exam dates — Same for all classes</p>
                ) : (
                  <div className="space-y-1">
                    {datesheetDrafts.map((d, i) => (
                      <p key={d.id} className="text-base font-bold text-gray-700">Draft {i + 1}: Classes {d.classes.join(', ')} — {d.schedule.length} dates</p>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={handleSubmit}
              className="mx-auto block w-full max-w-lg bg-[#A05C2B] text-white py-6 rounded-full text-2xl font-black shadow-2xl hover:bg-[#8e5226] transition-all transform hover:-translate-y-1"
            >
              Declare Exam & Notify Students
            </motion.button>
          </motion.div>
        );

      default:
        return null;
    }
  };

  // ── Shell ────────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[100] bg-[#FDFBF7] overflow-hidden flex flex-col">
      {/* Progress bar + Close */}
      <div className="p-6 md:p-8 flex justify-between items-center bg-transparent absolute top-0 left-0 right-0 z-10">
        <div className="flex gap-4 items-center">
          {step > 1 && (
            <button onClick={handleBack} className="text-[#8B5E2E] font-semibold underline cursor-pointer">
              &lt; Back
            </button>
          )}
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`h-2 rounded-full transition-all duration-500 ${step > i ? 'w-12 bg-[#A05C2B]' : step === i + 1 ? 'w-8 bg-[#A05C2B]/50' : 'w-4 bg-gray-200'}`} />
            ))}
          </div>
        </div>
        <button onClick={onCancel} className="p-3 bg-white hover:bg-gray-100 rounded-full text-gray-600 shadow-sm border border-gray-100 transition-all transform hover:scale-110">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Step content */}
      <div className="flex-1 flex items-center justify-center overflow-x-hidden pt-24 pb-12">
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>
      </div>

      {/* Skip Warning Modal */}
      <AnimatePresence>
        {showSkipWarning && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl border border-amber-200">
              <h3 className="text-2xl font-black text-gray-900 mb-2">⚠️ Incomplete Exam Setup</h3>
              <p className="text-gray-500 font-medium mb-8">Are you sure you want to proceed without building the Datesheet? You can configure this later.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowSkipWarning(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">Go Back & Build</button>
                <button onClick={() => { setShowSkipWarning(false); setStep(5); }} className="flex-1 py-3 bg-[#8B5E2E] text-white font-bold rounded-xl hover:bg-[#A05C2B] transition-colors">Proceed Anyway</button>
              </div>
            </motion.div>
          </motion.div>
        )}
        {showEvalSkipWarning && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl border border-amber-200">
              <h3 className="text-2xl font-black text-gray-900 mb-2">⚠️ Incomplete Exam Setup</h3>
              <p className="text-gray-500 font-medium mb-8">Are you sure you want to proceed without building the Evaluation Criteria? You can configure this later.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowEvalSkipWarning(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">Go Back & Build</button>
                <button onClick={() => { setShowEvalSkipWarning(false); setMetricsType('same'); setStep(4); }} className="flex-1 py-3 bg-[#8B5E2E] text-white font-bold rounded-xl hover:bg-[#A05C2B] transition-colors">Proceed Anyway</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}