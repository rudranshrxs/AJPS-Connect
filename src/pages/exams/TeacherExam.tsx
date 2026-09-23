import React, { useState, useEffect, useRef, useMemo } from 'react';
import { BookOpen, Save, AlertTriangle, CheckCircle, ArrowLeft, Lock, FileText, Layers, RefreshCw, ShieldAlert } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { useAuth } from '../../context/AuthContext';
import { useExams, Exam } from '../../hooks/useExams';
import { NotificationService } from '../../services/NotificationService';
import { useSuccess } from '../../context/SuccessContext';
import { useLoader } from '../../context/LoaderContext';
import { getSystemDate } from '../../utils/dateUtils';
import { useAcademic } from '../../context/academicContext';
import { MarksEntry } from '../../components/academic/MarksEntry';
import { SyllabusList } from '../../components/academic/SyllabusList';
import { ExamCard } from '../../components/exams/ExamCard';
import { hasDuplicateSyllabus, filterAvailableSubjects } from '../../utils/syllabusUtils';

export function TeacherExam() {
  const { currentUser } = useAuth();
  const { exams, datesheets, results, saveMarks, updateExam, unlockMarks } = useExams();
  const { triggerSuccess, triggerError } = useSuccess();
  const { runWithLoader } = useLoader();
  
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [lockedSubject, setLockedSubject] = useState('');
  const [assignedClasses, setAssignedClasses] = useState<string[]>([]);
  const [activeClass, setActiveClass] = useState<any>(null);
  
  const [selectedClassId, setSelectedClassId] = useState('');
  const [sectionFilter, setSectionFilter] = useState<string>('all');
  
  const [activeTab, setActiveTab] = useState<'marks' | 'syllabus' | 'datesheet' | 'result_draft'>('marks');

  // Result Draft state (for Class Teachers)
  const [draftSectionFilter, setDraftSectionFilter] = useState('');
  const [isCombinedView, setIsCombinedView] = useState(false);
  const [subject, setSubject] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  
  const [students, setStudents] = useState<any[]>([]);
  const [existingMarks, setExistingMarks] = useState<Record<string, Record<string, number>>>({});
  
  const [isPublished, setIsPublished] = useState(false);
  const [isSubjectLocked, setIsSubjectLocked] = useState(false);
  const [isEntryOpen, setIsEntryOpen] = useState(true);
  
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (currentUser?.role === 'Teacher') {
      const classes = JSON.parse(localStorage.getItem('ajps_classes') || '[]');
      const myClassIds = new Set<string>();
      
      const timetables = JSON.parse(localStorage.getItem('ajps_timetables') || '[]');
      timetables.forEach((tt: any) => {
        Object.values(tt.schedule || {}).forEach((day: any) => {
          Object.values(day || {}).forEach((slot) => {
             if (slot === currentUser.id) {
                myClassIds.add(tt.className || tt.classId);
             }
          });
        });
      });
      
      if (currentUser.isClassTeacher) {
        const clsId = currentUser.classId || currentUser.classTeacherClass?.replace('Class ', '');
        if (clsId) myClassIds.add(clsId);
        if (currentUser.className) myClassIds.add(currentUser.className);
      }

      const classNames = Array.from(myClassIds).map(id => {
        const found = classes.find((c: any) => c.id === id || c.className === id);
        return found ? found.className || found.id : id;
      });
      
      setAssignedClasses(Array.from(new Set(classNames as string[])));
      
      if (currentUser.subjects && currentUser.subjects.length === 1) {
        setLockedSubject(currentUser.subjects[0]);
      } else {
        setLockedSubject('');
      }
    }
  }, [currentUser]);

  const upcomingExams = exams.filter(e => {
    return (e.classes || []).some(c => 
      assignedClasses.includes(c) || 
      assignedClasses.includes(`Class ${c}`) ||
      assignedClasses.some(ac => ac?.toLowerCase().trim() === c?.toLowerCase().trim())
    );
  });

  useEffect(() => {
    if (selectedExam && selectedClassId) {
      if (activeTab === 'marks') {
        const users = JSON.parse(localStorage.getItem('ajps_users') || '[]');
        const classes = JSON.parse(localStorage.getItem('ajps_classes') || '[]');
        
        const cls = classes.find((c: any) => c.className === selectedClassId || c.id === selectedClassId);
        if (cls) {
          setActiveClass(cls);
          const activeExamClassId = cls.id;
          
          let targetStudents = users.filter((u: any) => u.role === "Student" && u.classId === activeExamClassId);
          
          if (sectionFilter !== 'all') {
            const secMatch = cls.sections.find((s: any) => (typeof s === 'string' ? s : s.id) === sectionFilter);
            const secMatchId = typeof secMatch === 'string' ? secMatch : (secMatch?.id || sectionFilter);
            const secMatchName = typeof secMatch === 'string' ? secMatch : (secMatch?.name || sectionFilter);
            
            targetStudents = targetStudents.filter((u: any) => 
              u.sectionId === secMatchId || 
              u.section === secMatchName || 
              u.sectionId === `c${activeExamClassId}-s${secMatchId}`
            );
          }
          
          targetStudents = targetStudents.sort((a: any, b: any) => {
            const secCompare = (a.section || a.sectionId || '').localeCompare(b.section || b.sectionId || '');
            if (secCompare !== 0) return secCompare;
            return (a.rollNumber || "").localeCompare(b.rollNumber || "");
          });
          
          let anyPublished = false;
          let anyLocked = false;
          const initialMarks: Record<string, Record<string, number>> = {};
          
          const sectionsToLoad = sectionFilter === 'all' ? (cls.sections || []) : [cls.sections.find((s: any) => (typeof s === 'string' ? s : s.id) === sectionFilter) || sectionFilter];
          
          const globalClassKey = `${selectedExam.id}_${cls.className || cls.id}`;
          const myResult = results.find(r => r.examId === selectedExam.id && r.classKey === globalClassKey);
          
          if (myResult?.isPublished) anyPublished = true;
          if (myResult?.lockedSubjects?.includes(lockedSubject)) anyLocked = true;
          const marksMap = myResult?.marks || {};

          sectionsToLoad.forEach((sec: any) => {
            const secId = typeof sec === 'string' ? sec : sec.id;
            const secName = typeof sec === 'string' ? sec : sec.name || secId;
            
            targetStudents.forEach((s: any) => {
              if (s.sectionId === secId || s.section === secId || s.section === secName) {
                const stData = marksMap[s.id] || {};
                if (stData[lockedSubject] !== undefined) {
                  if (!initialMarks[s.id]) initialMarks[s.id] = {};
                  initialMarks[s.id][lockedSubject] = Number(stData[lockedSubject]);
                }
              }
            });
          });
          
          // Also check global exam isPublished
          if (selectedExam.isPublished) anyPublished = true;
          
          const examDatesheets = datesheets.filter((d: any) => d.examId === selectedExam.id);
          const allDates = examDatesheets.flatMap((d: any) => (d.rows || d.schedule || []).map((r: any) => new Date(r.date).getTime())).filter(Boolean);
          const firstDate = allDates.length > 0 ? Math.min(...allDates) : null;
          const today = getSystemDate();
          today.setHours(0,0,0,0);
          const isAutoUnlocked = firstDate ? today.getTime() >= firstDate : false;
          
          setIsPublished(anyPublished);
          setIsSubjectLocked(anyLocked);
          setIsEntryOpen(selectedExam.isMarksEntryOpen === true || isAutoUnlocked);
          setExistingMarks(initialMarks);
          setStudents(targetStudents);
        }
      }
    }
  }, [selectedExam, selectedClassId, sectionFilter, activeTab, results, lockedSubject, datesheets]);

  const getMaxMarksForClass = (classId: string): number => {
    if (!selectedExam?.metrics) return 100;
    if (selectedExam.metrics.type === 'same') return selectedExam.metrics.same?.maxMarks || 100;
    if (selectedExam.metrics.type === 'different' && selectedExam.metrics.different) {
      return selectedExam.metrics.different[classId]?.maxMarks || 100;
    }
    return 100;
  };
  const currentMaxMarks = getMaxMarksForClass(selectedClassId);



  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (t: string) => setTags(tags.filter(tag => tag !== t));

  const handleSaveSyllabus = () => {
    if (!selectedExam || !activeClass) {
      triggerError("Select a class first.");
      return;
    }
    if (!subject.trim() || tags.length === 0) {
      triggerError("Please enter subject and at least one tag.");
      return;
    }
    
    // Check for duplicates before saving
    const currentSectionId = sectionFilter === 'all' ? 'ALL' : sectionFilter;
    if (hasDuplicateSyllabus(selectedExam.syllabus, subject, activeClass.id, currentSectionId)) {
      triggerError("Syllabus for this subject already exists in this section. Use Edit instead.");
      return;
    }
    
    runWithLoader(() => {
      let updatedExam = { ...selectedExam };
      
      if (sectionFilter === 'all') {
         // Save exactly ONE card for 'ALL' sections
         const newSyllabusItem = { 
           id: Date.now().toString() + 'ALL', 
           classId: activeClass.id, 
           sectionId: 'ALL',
           section: 'ALL',
           subject: subject.trim(), 
           tags 
         };
         const currentSyllabus = updatedExam.syllabus || [];
         updatedExam = { ...updatedExam, syllabus: [...currentSyllabus, newSyllabusItem] };
         
         const allUsers = JSON.parse(localStorage.getItem('ajps_users') || '[]');
         const targetStudents = allUsers.filter((u: any) => 
           u.role === 'Student' && u.classId === activeClass.id
         );
         
         NotificationService.sendNotification({
            recipientIds: targetStudents.map((s: any) => s.id),
            title: 'Syllabus Published',
            message: `Syllabus for ${subject} in ${selectedExam.name} has been updated for all sections.`,
            type: 'info',
            actionPath: '/exams',
            actionLabel: 'View Syllabus'
         });
      } else {
         const targetSections = [activeClass.sections.find((s: any) => (typeof s === 'string' ? s : s.id) === sectionFilter) || sectionFilter];
         targetSections.forEach((sec: any) => {
           const secId = typeof sec === 'string' ? sec : sec.id;
           const secName = typeof sec === 'string' ? sec : sec.name || secId;
           
           const newSyllabusItem = { 
             id: Date.now().toString() + secId, 
             classId: activeClass.id, 
             sectionId: secId, 
             subject: subject.trim(), 
             tags 
           };
           
           const currentSyllabus = updatedExam.syllabus || [];
           updatedExam = { ...updatedExam, syllabus: [...currentSyllabus, newSyllabusItem] };
           
           const allUsers = JSON.parse(localStorage.getItem('ajps_users') || '[]');
           const targetStudents = allUsers.filter((u: any) => 
             u.role === 'Student' && 
             u.classId === activeClass.id &&
             (u.sectionId === secId || u.section === secName || u.sectionId === `c${activeClass.id}-s${secId}`)
           );
           
           NotificationService.sendNotification({
              recipientIds: targetStudents.map((s: any) => s.id),
              title: 'Syllabus Published',
              message: `Syllabus for ${subject} in ${selectedExam.name} has been updated.`,
              type: 'info',
              actionPath: '/exams',
              actionLabel: 'View Syllabus'
           });
         });
      }
      
      updateExam(updatedExam);
      setSelectedExam(updatedExam);
      
      setSubject('');
      setTags([]);
      triggerSuccess('Syllabus Published Successfully!');
    });
  };

  const handleDeleteSyllabus = (id: string) => {
    const examDatesheets = datesheets.filter(d => d.examId === selectedExam?.id);
    const allDates = examDatesheets.flatMap(d => (d.rows || []).map(r => r.date)).filter(Boolean);
    let isSyllabusLocked = false;
    if (allDates.length > 0) {
      const earliestDate = allDates.sort()[0];
      isSyllabusLocked = getSystemDate() >= new Date(earliestDate + 'T00:00:00');
    }

    if (!selectedExam || isSyllabusLocked) {
      if (isSyllabusLocked) triggerError("Syllabus is locked as exam has started.");
      return;
    }
    
    // Find the item to populate inputs for editing
    const item = (selectedExam.syllabus || []).find((s: any) => s.id === id);
    if (item) {
      setSubject(item.subject);
      setTags(item.tags || []);
    }
    
    const updatedSyllabus = (selectedExam.syllabus || []).filter((s: any) => s.id !== id);
    const updatedExam = { ...selectedExam, syllabus: updatedSyllabus };
    
    updateExam(updatedExam);
    setSelectedExam(updatedExam);
    triggerSuccess('Syllabus removed. You can now edit and re-save it.');
  };

  // ── RESULT DRAFT BROADSHEET (for Class Teachers) ────────────────────────
  const classTeacherClassIds = useMemo(() => {
    if (currentUser?.role !== 'Teacher') return [];
    const timetables = JSON.parse(localStorage.getItem('ajps_timetables') || '[]');
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const p1Classes = new Set<string>();
    
    timetables.forEach((t: any) => {
      const hasP1 = daysOfWeek.some(day => t.schedule?.[day]?.['p1'] === currentUser.id);
      if (hasP1) {
         p1Classes.add(t.classId || t.className);
      }
    });
    return Array.from(p1Classes);
  }, [currentUser]);

  const draftAvailableSections = useMemo(() => {
    const isP1Teacher = classTeacherClassIds.includes(selectedClassId) || classTeacherClassIds.includes(selectedClassId.replace('Class ', ''));
    if (!isP1Teacher) return [];
    
    const classes = JSON.parse(localStorage.getItem('ajps_classes') || '[]');
    const cls = classes.find((c: any) => c.id === selectedClassId || c.className === `Class ${selectedClassId}` || c.className === selectedClassId);
    if (!cls || !cls.sections) return [];
    
    return cls.sections
      .map((s: any) => ({
        id: typeof s === 'string' ? s : s.id,
        name: typeof s === 'string' ? s : s.name || s.id
      }));
  }, [classTeacherClassIds, selectedClassId]);

  const draftBroadsheetData = useMemo(() => {
    const isP1Teacher = classTeacherClassIds.includes(selectedClassId) || classTeacherClassIds.includes(selectedClassId.replace('Class ', ''));
    if (!selectedExam || !isP1Teacher) return { students: [], subjects: [] };

    const allUsers = JSON.parse(localStorage.getItem('ajps_users') || '[]');
    const classes = JSON.parse(localStorage.getItem('ajps_classes') || '[]');
    const cls = classes.find((c: any) => c.id === selectedClassId || c.className === `Class ${selectedClassId}` || c.className === selectedClassId);
    if (!cls) return { students: [], subjects: [] };

    const sections = cls.sections || [];
    let targetSections: any[] = [];
    if (isCombinedView) {
      targetSections = sections;
    } else if (draftSectionFilter) {
      const sec = sections.find((s: any) =>
        (typeof s === 'string' ? s : s.id) === draftSectionFilter ||
        (typeof s === 'string' ? s : s.name) === draftSectionFilter
      );
      if (sec) targetSections = [sec];
    } else {
      targetSections = sections.length > 0 ? [sections[0]] : [];
    }

    let studentList: any[] = [];
    const allSubjects = new Set<string>();

    targetSections.forEach((sec: any) => {
      const secId = typeof sec === 'string' ? sec : sec.id;
      const secName = typeof sec === 'string' ? sec : sec.name;
      const classKey = `${selectedExam.id}_${cls.className || cls.id}`;
      const result = results.find(r => r.examId === selectedExam.id && r.classKey === classKey);
      const sectionStudents = allUsers.filter((u: any) =>
        u.role === 'Student' &&
        u.classId === cls.id &&
        (u.sectionId === secId || u.section === secName || u.sectionId === `c${cls.id}-s${secId}`)
      );
      sectionStudents.forEach((s: any) => {
        const marks = result?.marks?.[s.id] || {};
        Object.keys(marks).forEach(sub => allSubjects.add(sub));
        studentList.push({ ...s, sectionLabel: secName || secId, marks, classKey });
      });
    });

    studentList.sort((a, b) => (a.rollNumber || '').localeCompare(b.rollNumber || '', undefined, { numeric: true }));
    return { students: studentList, subjects: Array.from(allSubjects).sort() };
  }, [selectedExam, classTeacherClassIds, draftSectionFilter, isCombinedView, results]);

  if (selectedExam) {
    const applicableClasses = assignedClasses.filter(c => 
      (selectedExam.classes || []).some(ec => 
        ec === c || 
        ec === c.replace('Class ', '') ||
        ec?.toLowerCase().trim() === c?.toLowerCase().trim()
      )
    );

    const examDatesheets = datesheets.filter(d => d.examId === selectedExam.id);
    const allDates = examDatesheets.flatMap(d => (d.rows || []).map(r => r.date)).filter(Boolean);
    let isExamOver = false;
    let isSyllabusLocked = false;
    if (allDates.length > 0) {
      const latestDate = allDates.sort().reverse()[0];
      const earliestDate = allDates.sort()[0];
      isExamOver = getSystemDate() > new Date(latestDate + 'T00:00:00');
      isSyllabusLocked = getSystemDate() >= new Date(earliestDate + 'T00:00:00');
    }
    
    // Also lock syllabus if marks entry is explicitly unlocked by Admin
    if (selectedExam.isMarksEntryOpen) {
      isSyllabusLocked = true;
    }

    // ── RBAC GUARD: Unauthorized class access ──────────────────────────────
    if (selectedClassId && !applicableClasses.some(ac => ac?.toLowerCase().trim() === selectedClassId?.toLowerCase().trim())) {
      return (
        <div className="p-3 md:p-8 max-w-5xl mx-auto space-y-4 min-h-[calc(100vh-4rem)] pb-24 animate-in fade-in zoom-in-95 duration-300">
          <button onClick={() => { setSelectedExam(null); setSelectedClassId(''); }} className="text-sm font-bold text-gray-500 hover:text-gray-800 flex items-center gap-2">
            <ArrowLeft className="w-4 h-4"/> Back to Exams
          </button>
          <GlassCard className="p-12 bg-red-50 border-red-200 text-center shadow-sm">
            <ShieldAlert className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-red-800 mb-2">🚫 Unauthorized</h3>
            <p className="text-red-600 font-medium">You are not assigned to teach this class/subject. Please select one of your assigned classes.</p>
          </GlassCard>
        </div>
      );
    }

    return (
      <div className="p-3 md:p-8 max-w-5xl mx-auto space-y-4 md:space-y-6 min-h-[calc(100vh-4rem)] pb-24 animate-in fade-in zoom-in-95 duration-300">
        <button onClick={() => setSelectedExam(null)} className="text-sm font-bold text-gray-500 hover:text-gray-800 flex items-center gap-2">
          <ArrowLeft className="w-4 h-4"/> Back to Exams
        </button>
        
        {selectedExam.isPublished && (
          <div className="w-full bg-green-100 border-l-4 border-green-600 text-green-800 p-4">✅ Results have been officially published. The assessment is now in View-Only mode.</div>
        )}
        
        <GlassCard className="p-0 overflow-hidden bg-white border border-gray-200 shadow-md md:shadow-xl">
          <div className="p-3 md:p-8 border-b border-gray-100">
            <div className="flex flex-col md:flex-row justify-between items-start gap-3">
              <div>
                <h2 className="text-2xl font-black text-[#1F2937]">{selectedExam.name}</h2>
                <div className="flex items-center gap-3 mt-2">
                  <span className="bg-amber-100 text-amber-800 text-xs font-black px-3 py-1 rounded-md uppercase tracking-wide">
                    {selectedExam.month}
                  </span>
                  {isExamOver && (
                    <span className="bg-gray-100 text-gray-600 text-xs font-black px-3 py-1 rounded-md uppercase tracking-wide">
                      Exam Concluded
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-500 mb-2">Select Class to Manage</p>
                <select 
                  value={selectedClassId} 
                  onChange={e => { setSelectedClassId(e.target.value); setSectionFilter('all'); }}
                  className="bg-[#FDFBF7] border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-[#A05C2B]/30"
                >
                  <option value="">-- Choose Class --</option>
                  {applicableClasses.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex border-b border-gray-200 mt-6 -mb-8">
              <button
                onClick={() => setActiveTab('marks')}
                className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${activeTab === 'marks' ? 'border-[#A05C2B] text-[#A05C2B]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
              >
                Marks Entry
              </button>
              {!isExamOver && (
                <button
                  onClick={() => setActiveTab('syllabus')}
                  className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${activeTab === 'syllabus' ? 'border-[#A05C2B] text-[#A05C2B]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                >
                  Syllabus
                </button>
              )}
              <button
                onClick={() => setActiveTab('datesheet')}
                className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${activeTab === 'datesheet' ? 'border-[#A05C2B] text-[#A05C2B]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
              >
                Datesheet
              </button>
              {currentUser?.role === 'Teacher' && (classTeacherClassIds.includes(selectedClassId) || classTeacherClassIds.includes(selectedClassId.replace('Class ', ''))) && (
                <button
                  onClick={() => setActiveTab('result_draft')}
                  className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${activeTab === 'result_draft' ? 'border-[#A05C2B] text-[#A05C2B]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                >
                  Result Draft
                </button>
              )}
            </div>
          </div>

          <div className="p-6 md:p-8 bg-gray-50/50 min-h-[400px]">
            {selectedClassId ? (
              <div className="animate-in fade-in slide-in-from-bottom-4">
                {activeTab === 'marks' ? (
                  !isEntryOpen ? (
                    <div className="py-16 text-center bg-white rounded-2xl border border-gray-200 shadow-sm">
                       <Lock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                       <h3 className="text-xl font-bold text-gray-800 mb-2">Marks Entry Locked</h3>
                       <p className="text-gray-500 font-medium">The administrator has locked marks entry for this examination.</p>
                    </div>
                  ) : (
                    <>
                      {currentUser?.subjects && currentUser.subjects.length > 1 && (
                        <div className="mb-6 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Select Your Subject</label>
                          <select 
                            value={lockedSubject} 
                            onChange={e => setLockedSubject(e.target.value)}
                            className="w-full md:w-1/2 bg-[#FDFBF7] border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-[#A05C2B]/30"
                          >
                            <option value="">-- Choose Subject --</option>
                            {currentUser.subjects.map((sub: string) => (
                              <option key={sub} value={sub}>{sub}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {!lockedSubject ? (
                        <div className="py-12 text-center bg-white rounded-2xl border border-gray-200 shadow-sm">
                          <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                          <h3 className="text-lg font-bold text-gray-800">Subject Required</h3>
                          <p className="text-gray-500 font-medium mt-1">Please select a subject above to view the student list and enter marks.</p>
                        </div>
                      ) : (
                        <>
                          {isPublished && (
                            <div className="sticky top-0 z-50 w-full bg-green-600 text-white font-black text-center py-3 px-4 shadow-md rounded-t-xl mb-6">
                               ✅ Result Published — View Only Mode
                            </div>
                          )}
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
                              <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-1">Enter Marks: {lockedSubject}</h3>
                                <p className="text-sm text-gray-500 font-medium">Press Enter to move to next student.</p>
                              </div>
                              <div className="flex flex-wrap items-center gap-3">
                                <div className="bg-white p-1 rounded-xl border border-gray-200 shadow-sm flex flex-wrap">
                                   <button 
                                     onClick={() => setSectionFilter('all')}
                                     className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors ${sectionFilter === 'all' ? 'bg-[#1F2937] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                                   >
                                     Whole Class
                                   </button>
                                   {activeClass?.sections?.map((sec: any) => {
                                     const secId = typeof sec === 'string' ? sec : sec.id;
                                     const secName = typeof sec === 'string' ? sec : sec.name || secId;
                                     return (
                                       <button 
                                         key={secId}
                                         onClick={() => setSectionFilter(secId)}
                                         className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors ${sectionFilter === secId ? 'bg-[#1F2937] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                                       >
                                         Section {secName}
                                       </button>
                                     );
                                   })}
                                </div>
                              </div>
                          </div>
                          
                          <MarksEntry
                            examId={selectedExam.id}
                            examName={selectedExam.name}
                            classId={activeClass?.id}
                            className={activeClass?.className || activeClass?.id}
                            sectionFilter={sectionFilter}
                            classKey={`${selectedExam.id}_${activeClass?.className || activeClass?.id}`}
                            students={students}
                            subjectId={lockedSubject}
                            currentMaxMarks={currentMaxMarks}
                            existingMarks={existingMarks}
                            isPublished={isPublished}
                            isSubjectLocked={isSubjectLocked}
                          />

                          {/* Result Draft moved to own tab */}
                        </>
                      )}
                    </>
                  )
                ) : activeTab === 'result_draft' ? (
                  <div className="animate-in fade-in slide-in-from-bottom-4">
                    {/* ── CLASS TEACHER RESULT DRAFT PANEL ───────────────────────────────────── */}
                    {currentUser?.role === 'Teacher' && (classTeacherClassIds.includes(selectedClassId) || classTeacherClassIds.includes(selectedClassId.replace('Class ', ''))) && (
                      <div className="space-y-4">
                        <GlassCard className="p-4 md:p-6 bg-white border border-gray-200 shadow-md">
                          <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                            <Layers className="w-5 h-5 text-[#A05C2B]" /> Result Draft — {selectedClassId}
                          </h3>
                          <p className="text-sm text-gray-500 font-medium mb-4">View compiled marks for your class. Only Admin can publish results.</p>
                          
                          <div className="flex flex-wrap gap-4 items-end">
                            {!isCombinedView && (
                              <div className="flex-1 min-w-[180px]">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Select Section</label>
                                <select 
                                  value={draftSectionFilter} 
                                  onChange={e => setDraftSectionFilter(e.target.value)}
                                  className="w-full bg-[#FDFBF7] border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-[#A05C2B]/30"
                                >
                                  <option value="">-- All Sections --</option>
                                  {draftAvailableSections.map((s: any) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                            {draftAvailableSections.length > 1 && (
                              <button
                                onClick={() => { setIsCombinedView(!isCombinedView); setDraftSectionFilter(''); }}
                                className={`px-5 py-2.5 rounded-xl text-sm font-bold border-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                                  isCombinedView 
                                    ? 'bg-[#A05C2B] border-[#A05C2B] text-white shadow-md' 
                                    : 'bg-white border-gray-200 text-gray-600 hover:border-[#A05C2B]/40'
                                }`}
                              >
                                <Layers className="w-4 h-4" />
                                {isCombinedView ? '✓ Combined View' : 'View Combined'}
                              </button>
                            )}
                          </div>
                        </GlassCard>

                        {draftBroadsheetData.students.length > 0 ? (
                          <GlassCard className="p-0 overflow-hidden bg-white border border-gray-200 shadow-lg">
                            <div className="w-full overflow-x-auto custom-scrollbar">
                              <table className="w-full text-left text-sm" style={{ minWidth: `${500 + draftBroadsheetData.subjects.length * 100}px` }}>
                                <thead className="bg-[#1F2937] text-white sticky top-0 z-10">
                                  <tr>
                                    <th className="p-3 md:p-4 font-bold text-xs uppercase tracking-wider w-20 text-center border-r border-gray-600">Roll No.</th>
                                    <th className="p-3 md:p-4 font-bold text-xs uppercase tracking-wider min-w-[180px] border-r border-gray-600">
                                      Student Name {isCombinedView && <span className="text-amber-300 ml-1">(Section)</span>}
                                    </th>
                                    {draftBroadsheetData.subjects.map(sub => (
                                      <th key={sub} className="p-3 md:p-4 font-bold text-xs uppercase tracking-wider text-center min-w-[90px] border-r border-gray-600">{sub}</th>
                                    ))}
                                    <th className="p-3 md:p-4 font-bold text-xs uppercase tracking-wider text-center min-w-[80px] bg-[#374151]">Total</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {draftBroadsheetData.students.map((student: any, idx: number) => {
                                    const totalMarks = draftBroadsheetData.subjects.reduce((sum, sub) => sum + (Number(student.marks[sub]) || 0), 0);
                                    const hasAnyMark = draftBroadsheetData.subjects.some(sub => student.marks[sub] !== undefined);
                                    return (
                                      <tr key={student.id} className={`hover:bg-[#FDF7EE]/50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                                        <td className="p-3 md:p-4 font-bold text-gray-500 text-center border-r border-gray-100">{student.rollNumber || '—'}</td>
                                        <td className="p-3 md:p-4 border-r border-gray-100">
                                          <span className="font-semibold text-gray-800">{student.name}</span>
                                          {isCombinedView && (
                                            <span className="ml-2 bg-blue-100 text-blue-700 text-[10px] font-black px-1.5 py-0.5 rounded uppercase">{student.sectionLabel}</span>
                                          )}
                                        </td>
                                        {draftBroadsheetData.subjects.map(sub => (
                                          <td key={sub} className="p-3 md:p-4 text-center border-r border-gray-100">
                                            {student.marks[sub] !== undefined ? (
                                              <span className="font-bold text-gray-900">{student.marks[sub]}</span>
                                            ) : (
                                              <span className="text-gray-300 text-xs font-medium italic">No Draft</span>
                                            )}
                                          </td>
                                        ))}
                                        <td className="p-3 md:p-4 text-center bg-gray-50/50">
                                          {hasAnyMark ? (
                                            <span className="font-black text-[#A05C2B] text-base">{totalMarks}</span>
                                          ) : (
                                            <span className="text-gray-300 text-xs">—</span>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                            <div className="p-3 bg-gray-50 border-t border-gray-200 text-xs font-bold text-gray-500 flex justify-between">
                              <span>Total Students: {draftBroadsheetData.students.length}</span>
                              <span>Subjects: {draftBroadsheetData.subjects.length}</span>
                            </div>
                          </GlassCard>
                        ) : (
                          <GlassCard className="p-12 text-center bg-white border border-gray-200 shadow-sm">
                            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-gray-800">No Drafted Marks Found</h3>
                            <p className="text-sm text-gray-500 mt-2 font-medium">Teachers have not submitted any marks for your class yet.</p>
                          </GlassCard>
                        )}
                      </div>
                    )}
                  </div>
                ) : activeTab === 'syllabus' ? (
                                  <div>
                    {/* Syllabus Lockdown Banner */}
                    {isSyllabusLocked && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-center gap-3 animate-in fade-in duration-300">
                        <Lock className="w-5 h-5 text-yellow-700 flex-shrink-0" />
                        <p className="text-sm font-bold text-yellow-800">🔒 Syllabus editing is restricted because the exam has commenced or marks entry is unlocked.</p>
                      </div>
                    )}

                    <div className="mb-6 flex justify-between items-end">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">Define Syllabus</h3>
                        <p className="text-sm text-gray-500 font-medium">Build syllabus tags for Class {selectedClassId}.</p>
                      </div>
                      <div className="bg-white p-1 rounded-xl border border-gray-200 shadow-sm flex">
                         <button 
                           onClick={() => setSectionFilter('all')}
                           className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors ${sectionFilter === 'all' ? 'bg-[#1F2937] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                         >
                           Whole Class
                         </button>
                         {activeClass?.sections?.map((sec: any) => {
                           const secId = typeof sec === 'string' ? sec : sec.id;
                           const secName = typeof sec === 'string' ? sec : sec.name || secId;
                           return (
                             <button 
                               key={secId}
                               onClick={() => setSectionFilter(secId)}
                               className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors ${sectionFilter === secId ? 'bg-[#1F2937] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                             >
                               Section {secName}
                             </button>
                           );
                         })}
                      </div>
                    </div>
                    
                    <div className={`bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mb-8 ${isSyllabusLocked ? 'opacity-60 pointer-events-none' : ''}`}>
                      <div className="mb-4">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Subject</label>
                        {(() => {
                           const availableSubjects = filterAvailableSubjects(
                             currentUser?.subjects || [],
                             selectedExam?.syllabus,
                             activeClass?.id,
                             sectionFilter === 'all' ? 'ALL' : sectionFilter
                           );
                           
                           const isEditing = subject && !availableSubjects.includes(subject) && (currentUser?.subjects || []).includes(subject);

                           return (
                             <>
                               <select 
                                 value={subject} onChange={e => setSubject(e.target.value)}
                                 disabled={isSyllabusLocked}
                                 className="w-full bg-[#FDFBF7] border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#A05C2B]/30 font-medium disabled:cursor-not-allowed"
                               >
                                 <option value="">-- Select Subject --</option>
                                 {(currentUser?.subjects || []).map((subj: string) => (
                                   <option key={subj} value={subj} disabled={!availableSubjects.includes(subj)}>{subj} {!availableSubjects.includes(subj) ? '(Added)' : ''}</option>
                                 ))}
                               </select>
                               {isEditing && (
                                 <p className="text-amber-600 text-xs font-bold mt-2">Syllabus for this subject already exists. Use Edit instead.</p>
                               )}
                             </>
                           );
                        })()}
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Topics / Tags (Press Enter)</label>
                        <input 
                          type="text" 
                          value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={handleAddTag}
                          placeholder="e.g. Algebra"
                          disabled={isSyllabusLocked}
                          className="w-full bg-[#FDFBF7] border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#A05C2B]/30 font-medium disabled:cursor-not-allowed"
                        />
                      </div>
                      
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {tags.map(t => (
                            <span key={t} className="bg-blue-100 text-blue-700 rounded-full px-2 py-1 text-xs font-bold flex items-center gap-1">
                              {t}
                              <button onClick={() => removeTag(t)} className="text-blue-500 hover:text-blue-800 ml-1">×</button>
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <button 
                        onClick={handleSaveSyllabus}
                        disabled={isSyllabusLocked || (subject ? hasDuplicateSyllabus(selectedExam?.syllabus, subject, activeClass?.id, sectionFilter === 'all' ? 'ALL' : sectionFilter) : true)}
                        title={isSyllabusLocked ? 'Syllabus is locked — exam has started' : undefined}
                        className="w-full bg-[#1F2937] text-white py-3 rounded-xl font-bold shadow-md hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Save className="w-5 h-5" /> {isSyllabusLocked ? 'Syllabus Locked' : 'Save Syllabus'}
                      </button>
                    </div>

                    <div className="mt-8">
                      <h4 className="text-sm font-bold text-gray-500 uppercase mb-4">Saved Syllabus</h4>
                      <SyllabusList 
                        syllabus={selectedExam?.syllabus || []} 
                        classId={activeClass?.id} 
                        sectionFilter={sectionFilter} 
                        onDelete={!isSyllabusLocked ? handleDeleteSyllabus : undefined}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            ) : activeTab === 'datesheet' ? null : (
              <div className="py-12 text-center bg-gray-50 rounded-xl border border-gray-100">
                  <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">Please select a class to view and manage.</p>
              </div>
            )}

            {activeTab === 'datesheet' && (
              <div className="animate-in fade-in slide-in-from-bottom-4">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Datesheet</h3>
                  <p className="text-sm text-gray-500 font-medium">Read-only school schedule for {selectedExam.name}.</p>
                </div>
                {examDatesheets.length > 0 ? (
                  <div className="space-y-6">
                    {examDatesheets.map((draft: any, draftIdx: number) => (
                      <div key={draft.id} className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <h4 className="text-lg font-black text-gray-800 mb-4">Datesheet Draft {draftIdx + 1}</h4>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {(draft.classes || []).map((c: string) => <span key={c} className="bg-white border border-gray-200 px-3 py-1 rounded-full text-xs font-bold text-gray-600">Class {c}</span>)}
                        </div>
                        <div className="w-full overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
                           <table className="w-full text-left text-sm min-w-max">
                             <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold">
                               <tr>
                                 <th className="px-6 py-4">Subject</th>
                                 <th className="px-6 py-4">Date</th>
                                 <th className="px-6 py-4 text-right">Time</th>
                               </tr>
                             </thead>
                             <tbody className="divide-y divide-gray-100">
                               {(draft.rows || []).sort((a: any,b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((row: any, i: number) => (
                                 <tr key={i} className="hover:bg-gray-50/50">
                                   <td className="px-6 py-4 font-bold text-gray-800">{row.subject}</td>
                                   <td className="px-6 py-4 text-gray-600 font-medium">{new Date(row.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric'})}</td>
                                   <td className="px-6 py-4 text-gray-500 text-right">{row.time || '--'}</td>
                                 </tr>
                               ))}
                             </tbody>
                           </table>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-gray-500 font-medium">No datesheet available for this exam.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 min-h-[calc(100vh-4rem)] pb-24 md:pb-8 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-2xl font-black text-[#1F2937] tracking-tight">Teacher Exam Dashboard</h1>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-sm font-semibold text-gray-500">
              Welcome, <span className="text-[#A05C2B]">{currentUser?.name}</span>
            </p>
            {currentUser?.subjects && currentUser.subjects.length > 0 && (
              <span className="bg-white border border-gray-200 text-[#A05C2B] text-xs font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                Subjects: {currentUser.subjects.join(', ')}
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="transition-all duration-300">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#A05C2B]" /> 
          Active Exams
        </h3>
        
        {assignedClasses.length === 0 ? (
          <GlassCard className="p-8 bg-white border-gray-200 shadow-sm text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Access Restricted</h3>
            <p className="text-gray-500 font-medium">You are not assigned to teach any active classes. Please contact the administrator.</p>
          </GlassCard>
        ) : upcomingExams.length === 0 ? (
          <div className="bg-white border border-gray-200 p-8 rounded-2xl text-center shadow-sm">
            <p className="text-gray-500 font-medium">No active exams assigned to your classes.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingExams.map(exam => {
              const examDatesheets = datesheets.filter(d => d.examId === exam.id);
              const allDates = examDatesheets.flatMap(d => (d.rows || []).map(r => r.date)).filter(Boolean);
              let over = false;
              if (allDates.length > 0) {
                const latestDate = allDates.sort().reverse()[0];
                over = getSystemDate() > new Date(latestDate + 'T00:00:00');
              }
              
              const subtitle = (
                <p className="text-xs text-gray-500 font-medium mb-4">
                  Classes you teach: {(exam.classes || []).filter(c => assignedClasses.some(ac => ac?.toLowerCase().trim() === c?.toLowerCase().trim())).join(', ')}
                </p>
              );

              return (
                <ExamCard 
                   key={exam.id} 
                   exam={exam}
                   isConcluded={over}
                   subtitle={subtitle}
                   actionLabel="Manage"
                   onClick={() => { setSelectedExam(exam); setActiveTab('marks'); }}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
