cat << 'INNER_EOF' > /tmp/AdminExam.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Calendar, BookOpen, Bell, CheckCircle, Clock } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { GlassCard } from '../../components/ui/GlassCard';
import { Toast } from '../../components/ui/Toast';

export interface Exam {
  id: string;
  name: string;
  month: string;
  session: string;
  classes: string[];
  isPublished: boolean;
  datesheet: { subject: string; date: string }[];
}

export function AdminExam() {
  const { addNotification } = useNotification();
  const [exams, setExams] = useState<Exam[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newExam, setNewExam] = useState({ name: '', month: '', classes: [] as string[] });
  
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [isDatesheetModalOpen, setIsDatesheetModalOpen] = useState(false);
  const [datesheet, setDatesheet] = useState<{ subject: string; date: string }[]>([{ subject: '', date: '' }]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const ALL_CLASSES = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'];
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  useEffect(() => {
    const stored = localStorage.getItem('ajps_exams');
    if (stored) {
      setExams(JSON.parse(stored) || []);
    }
  }, []);

  const saveExams = (updated: Exam[]) => {
    localStorage.setItem('ajps_exams', JSON.stringify(updated));
    setExams(updated);
    window.dispatchEvent(new Event('exams_updated'));
  };

  const handleCreateExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExam.name || !newExam.month || newExam.classes.length === 0) return;

    const exam: Exam = {
      id: Date.now().toString(),
      name: newExam.name,
      month: newExam.month,
      session: '2025-2026',
      classes: newExam.classes,
      isPublished: false,
      datesheet: []
    };

    saveExams([...exams, exam]);
    
    addNotification({
      title: 'New Exam Declared',
      message: `${exam.name} for ${exam.month} has been announced.`,
      type: 'SYSTEM',
      recipientRole: 'Student'
    });
    addNotification({
      title: 'New Exam Declared',
      message: `${exam.name} for ${exam.month} has been announced.`,
      type: 'SYSTEM',
      recipientRole: 'Teacher'
    });

    setToastMsg(`Exam "${exam.name}" created successfully!`);
    setTimeout(() => setToastMsg(null), 3000);

    setNewExam({ name: '', month: '', classes: [] });
    setIsCreating(false);
  };

  const toggleClassSelection = (cls: string) => {
    setNewExam(prev => ({
      ...prev,
      classes: prev.classes.includes(cls) ? prev.classes.filter(c => c !== cls) : [...prev.classes, cls]
    }));
  };

  const openDatesheetModal = (exam: Exam) => {
    setSelectedExam(exam);
    setDatesheet((exam.datesheet || []).length > 0 ? (exam.datesheet || []) : [{ subject: '', date: '' }]);
    setIsDatesheetModalOpen(true);
  };

  const handlePublishDatesheet = () => {
    if (!selectedExam) return;
    
    const validDatesheet = datesheet.filter(d => d.subject && d.date);
    const updated = exams.map(e => e.id === selectedExam.id ? { ...e, datesheet: validDatesheet } : e);
    saveExams(updated);
    
    addNotification({
      title: 'Datesheet Published',
      message: `Datesheet for ${selectedExam.name} is now available.`,
      type: 'GENERAL',
      recipientRole: 'Student'
    });

    setToastMsg(`Datesheet for ${selectedExam.name} published!`);
    setTimeout(() => setToastMsg(null), 3000);

    setIsDatesheetModalOpen(false);
  };

  const isExamInPast = (exam: Exam) => {
    if (!exam.datesheet || exam.datesheet.length === 0) return false;
    const latestDate = new Date(Math.max(...exam.datesheet.map(d => new Date(d.date).getTime())));
    return new Date() > latestDate;
  };

  const handlePublishResult = (exam: Exam) => {
    if (!isExamInPast(exam)) {
      setToastMsg('Cannot publish results before all exams are over.');
      setTimeout(() => setToastMsg(null), 3000);
      return;
    }

    const updated = exams.map(e => e.id === exam.id ? { ...e, isPublished: true } : e);
    saveExams(updated);
    
    addNotification({
      title: 'Results Published',
      message: `Results for ${exam.name} have been published. Check your report card!`,
      type: 'GENERAL',
      recipientRole: 'Student'
    });
    
    // Simulate rank 1 notification
    addNotification({
      title: 'Congratulations!',
      message: `You got 1st rank in ${exam.name}!`,
      type: 'SYSTEM',
      recipientRole: 'Student'
    });

    setToastMsg(`Results for ${exam.name} published successfully!`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const upcomingExams = exams.filter(e => !e.isPublished);
  const pastExams = exams.filter(e => e.isPublished);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 min-h-[calc(100vh-4rem)] pb-24 md:pb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1F2937] tracking-tight">Admin Exams Console</h1>
          <p className="text-sm font-semibold text-gray-500">Declare exams, publish datesheets, and release results.</p>
        </div>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          className="bg-[#1F2937] hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Declare New Exam
        </button>
      </div>

      {isCreating && (
        <GlassCard className="p-6 md:p-8 bg-white/60 border-white animate-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-[#1F2937]">Declare Exam</h2>
            <button onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-gray-600">
              <Plus className="w-6 h-6 rotate-45" />
            </button>
          </div>
          <form onSubmit={handleCreateExam}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Exam Name</label>
                <input 
                  type="text" 
                  value={newExam.name}
                  onChange={e => setNewExam({...newExam, name: e.target.value})}
                  className="w-full bg-white/60 border border-white rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#A05C2B]/30"
                  placeholder="e.g. Mid Term Exam"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Month</label>
                <select 
                  value={newExam.month}
                  onChange={e => setNewExam({...newExam, month: e.target.value})}
                  className="w-full bg-white/60 border border-white rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#A05C2B]/30"
                  required
                >
                  <option value="">Select Month</option>
                  {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Target Classes</label>
              <div className="flex flex-wrap gap-2">
                {ALL_CLASSES.map(cls => (
                  <button
                    type="button"
                    key={cls}
                    onClick={() => toggleClassSelection(cls)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                      newExam.classes.includes(cls) 
                        ? 'bg-[#A05C2B] text-white border-[#A05C2B]' 
                        : 'bg-white/50 text-gray-600 border-white hover:bg-white'
                    }`}
                  >
                    {cls}
                  </button>
                ))}
              </div>
            </div>

            <button 
              type="submit"
              className="mt-4 bg-[#1F2937] text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-gray-800 transition-colors"
            >
              Declare Exam
            </button>
          </form>
        </GlassCard>
      )}

      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-amber-600" /> Upcoming Exams</h3>
        {upcomingExams.length === 0 ? (
          <p className="text-sm text-gray-500">No upcoming exams declared.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingExams.map(exam => (
              <GlassCard key={exam.id} className="p-5 bg-white/40 border-white/50 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-gray-900 text-lg">{exam.name}</h4>
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wide">
                      {exam.month}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-medium line-clamp-1 mb-4">Classes: {(exam.classes || []).join(', ')}</p>
                </div>
                <div className="flex gap-2 mt-4">
                  <button 
                    onClick={() => openDatesheetModal(exam)}
                    className="flex-1 bg-white/60 hover:bg-white text-gray-800 text-xs font-bold py-2 rounded-lg border border-white transition-colors"
                  >
                    {(exam.datesheet || []).length > 0 ? 'Edit Datesheet' : 'Publish Datesheet'}
                  </button>
                  <button 
                    onClick={() => handlePublishResult(exam)}
                    disabled={!isExamInPast(exam)}
                    className={`flex-1 text-white text-xs font-bold py-2 rounded-lg shadow-sm transition-colors ${!isExamInPast(exam) ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#10B981] hover:bg-[#059669]'}`}
                  >
                    {isExamInPast(exam) ? 'Publish Results' : 'Exams Active'}
                  </button>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-600" /> Past Exams (Results Published)</h3>
        {pastExams.length === 0 ? (
          <p className="text-sm text-gray-500">No past exams.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pastExams.map(exam => (
              <GlassCard key={exam.id} className="p-4 bg-white/30 border-white/40 opacity-75">
                <h4 className="font-bold text-gray-900">{exam.name}</h4>
                <p className="text-xs text-gray-500 font-medium">Session {exam.session} • {exam.month}</p>
                <div className="mt-3 bg-green-100/50 text-green-800 text-[10px] font-bold px-2 py-1 rounded w-max">
                  Results Published
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {/* Datesheet Modal */}
      {isDatesheetModalOpen && selectedExam && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#1F2937]/40 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-[#FAF9F6] rounded-2xl shadow-2xl border border-white/50 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 bg-white/60 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800">Datesheet: {selectedExam.name}</h2>
              <button onClick={() => setIsDatesheetModalOpen(false)} className="text-gray-500 hover:bg-white/50 p-1 rounded-full"><Plus className="w-5 h-5 rotate-45" /></button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 space-y-3">
              {datesheet.map((entry, idx) => (
                <div key={idx} className="flex gap-3 items-center">
                  <div className="flex-1">
                    <input 
                      type="text" 
                      placeholder="Subject (e.g. Maths)" 
                      value={entry.subject}
                      onChange={(e) => {
                        const newD = [...datesheet];
                        newD[idx].subject = e.target.value;
                        setDatesheet(newD);
                      }}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#A05C2B]/30"
                    />
                  </div>
                  <div className="flex-1">
                    <input 
                      type="date" 
                      value={entry.date}
                      onChange={(e) => {
                        const newD = [...datesheet];
                        newD[idx].date = e.target.value;
                        setDatesheet(newD);
                      }}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#A05C2B]/30"
                    />
                  </div>
                  <button onClick={() => setDatesheet(datesheet.filter((_, i) => i !== idx))} className="text-red-500 p-2"><Plus className="w-4 h-4 rotate-45" /></button>
                </div>
              ))}
              <button 
                onClick={() => setDatesheet([...datesheet, { subject: '', date: '' }])}
                className="text-xs font-bold text-[#A05C2B] flex items-center gap-1 mt-2"
              >
                <Plus className="w-3 h-3" /> Add Subject
              </button>
            </div>
            <div className="p-5 border-t border-gray-200 bg-white/60">
              <button 
                onClick={handlePublishDatesheet}
                className="w-full bg-[#A05C2B] text-white py-2.5 rounded-xl font-bold shadow-md hover:bg-[#8e5025] transition-colors"
              >
                Publish Datesheet
              </button>
            </div>
          </div>
        </div>
      )}
      <Toast message={toastMsg} />
    </div>
  );
}
INNER_EOF
mv /tmp/AdminExam.tsx src/pages/exams/AdminExam.tsx
