import React, { useState, useEffect, useRef } from 'react';
import { Save, CheckCircle, RefreshCw, Lock } from 'lucide-react';
import { useAcademic, MarksPayload } from '../../context/academicContext';
import { useMarksAccess } from '../../hooks/useMarksAccess';
import { useLoader } from '../../context/LoaderContext';
import { useSuccess } from '../../context/SuccessContext';
import { NotificationService } from '../../services/NotificationService';

interface MarksEntryProps {
  examId: string;
  examName: string;
  classId: string;
  className: string;
  sectionFilter: string;
  classKey: string;
  students: any[];
  subjectId: string;
  currentMaxMarks: number;
  existingMarks: Record<string, Record<string, number | string>>; // global state marks
  isPublished: boolean;
  isSubjectLocked: boolean;
}

export function MarksEntry({
  examId,
  examName,
  classId,
  className,
  sectionFilter,
  classKey,
  students,
  subjectId,
  currentMaxMarks,
  existingMarks,
  isPublished,
  isSubjectLocked
}: MarksEntryProps) {
  const { saveMarks, unlockMarks } = useAcademic();
  const { canView, canEdit } = useMarksAccess(className, subjectId);
  const { runWithLoader } = useLoader();
  const { triggerSuccess, triggerError } = useSuccess();
  
  // Local state for edits
  const [draftMarks, setDraftMarks] = useState<Record<string, number | string>>({});
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Initialize from global state on mount or when subject changes
  useEffect(() => {
    const initial: Record<string, number | string> = {};
    students.forEach(s => {
      if (existingMarks[s.id] && existingMarks[s.id][subjectId] !== undefined) {
        initial[s.id] = existingMarks[s.id][subjectId];
      }
    });
    setDraftMarks(initial);
  }, [existingMarks, students, subjectId]);

  if (!canView) {
    return (
      <div className="py-12 text-center bg-red-50 rounded-2xl border border-red-200 shadow-sm mt-6">
        <Lock className="w-12 h-12 text-red-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-red-800 mb-2">Access Denied</h3>
        <p className="text-red-500 font-medium">You do not have permission to view marks for this class and subject.</p>
      </div>
    );
  }

  const handleMarkChange = (studentId: string, value: string) => {
    if (!canEdit || isPublished || isSubjectLocked) return;
    
    if (value === '' || value.toUpperCase() === 'N/A') {
      setDraftMarks(prev => ({ ...prev, [studentId]: 'N/A' }));
      return;
    }

    const sanitized = value.replace(/[^0-9]/g, '');
    const numVal = Number(sanitized);
    
    if (sanitized !== '' && (isNaN(numVal) || numVal < 0 || numVal > currentMaxMarks)) return;

    setDraftMarks(prev => ({ ...prev, [studentId]: numVal }));
  };

  const handleMarkKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (['e', 'E', '+', '-'].includes(e.key)) {
      e.preventDefault();
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const next = inputRefs.current[index + 1];
      if (next) next.focus();
    }
  };

  const handleSaveAndLock = () => {
    if (!canEdit) return;
    
    runWithLoader(() => {
      // Map all students. If a mark is undefined/null, treat it as N/A.
      const payloads: MarksPayload[] = students
        .map(s => {
          let mark = draftMarks[s.id];
          if (mark === undefined || mark === null || mark === '') {
            mark = 'N/A';
          }
          return {
            studentId: s.id,
            subjectId,
            marksObtained: mark,
            totalMarks: currentMaxMarks,
            isLocked: true // explicitly lock on save
          };
        });

      if (payloads.length === 0) {
        triggerError("No marks entered. Please enter marks before saving.");
        return;
      }

      // Save to global state (merges via context)
      saveMarks(examId, classKey, payloads);

      // Notify P1 Teachers of this class (across any day and section)
      const allTimetables = JSON.parse(localStorage.getItem('ajps_timetables') || '[]');
      const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      
      const p1TeacherIds = new Set<string>();
      
      allTimetables.forEach((t: any) => {
        if (String(t.classId) === String(classId) || t.className === className) {
           daysOfWeek.forEach(day => {
              if (t.schedule?.[day]?.['p1']) {
                 p1TeacherIds.add(t.schedule[day]['p1']);
              }
           });
        }
      });
      
      if (p1TeacherIds.size > 0) {
        NotificationService.sendNotification({
          recipientIds: Array.from(p1TeacherIds),
          role: 'Teacher',
          title: 'Marks Submitted/Locked',
          message: `${subjectId} marks have been submitted for ${className} ${sectionFilter !== 'all' ? `Sec ${sectionFilter}` : ''}.`,
          type: 'info',
          actionPath: '/exams',
          actionLabel: 'View Exam'
        });
      }

      // Optimistically lock locally without clearing draftMarks
      setDraftMarks(prev => ({ ...prev })); // Keeps local edits intact

      triggerSuccess('Marks Locked Successfully');
    });
  };

  const handleRefillCorrections = () => {
    if (!canEdit) return;
    runWithLoader(() => {
      unlockMarks(examId, classKey, subjectId);
      triggerSuccess('Marks Unlocked for Corrections');
    });
  };

  const isFormDisabled = !canEdit || isPublished || isSubjectLocked;

  return (
    <div className="mt-6">
      {isPublished && (
        <div className="w-full bg-green-100 border-l-4 border-green-600 text-green-800 p-4 font-bold mb-4 rounded-r-xl shadow-sm">
          ✅ Results Published - View Only Mode
        </div>
      )}
      <div className="w-full overflow-x-auto overflow-y-hidden bg-white rounded-2xl border border-gray-200 shadow-sm mb-6 custom-scrollbar">
        <table className="w-full text-left text-sm" >
          <thead className="bg-[#FDFBF7] border-b border-gray-200">
            <tr>
              <th className="p-2 md:p-4 font-bold text-gray-600 text-xs md:text-sm">Roll No.</th>
              <th className="p-2 md:p-4 font-bold text-gray-600 text-xs md:text-sm">Student Name</th>
              {sectionFilter === 'all' && (
                <th className="p-2 md:p-4 font-bold text-gray-600 text-xs md:text-sm">Section</th>
              )}
              <th className="p-2 md:p-4 font-bold text-gray-600 text-right text-xs md:text-sm">Marks / {currentMaxMarks}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {students.map((student, i) => {
              const val = draftMarks[student.id];
              const displayVal = val !== undefined ? val : '';
              return (
                <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-2 md:p-4 font-bold text-gray-400 text-xs md:text-sm">{student.rollNumber || 'N/A'}</td>
                  <td className="p-2 md:p-4 font-semibold text-gray-800 text-xs md:text-sm">
                    <div className="flex items-center gap-2">
                      {student.name}
                      {isSubjectLocked && (
                        <span className="bg-green-100 text-green-700 text-[10px] font-black px-1.5 py-0.5 rounded uppercase flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Locked
                        </span>
                      )}
                    </div>
                  </td>
                  {sectionFilter === 'all' && (
                    <td className="p-2 md:p-4 font-bold text-gray-500 text-xs md:text-sm">
                      <span className="bg-gray-100 px-2 py-1 rounded text-xs">{student.section || student.sectionId}</span>
                    </td>
                  )}
                  <td className="p-2 md:p-4 text-right flex items-center justify-end gap-1 md:gap-2">
                    {isFormDisabled ? (
                      <input 
                        type="text" 
                        disabled 
                        value={displayVal} 
                        className="w-20 text-center bg-gray-100 text-gray-500 cursor-not-allowed font-bold border border-gray-200 rounded-lg px-2 py-1.5" 
                      />
                    ) : (
                      <input 
                        type="text" 
                        inputMode="numeric" 
                        pattern="[0-9]*" 
                        ref={el => { if (el) inputRefs.current[i] = el; }}
                        value={
                          draftMarks[student.id] === 'N/A' ? '' :
                          (draftMarks[student.id] !== undefined ? draftMarks[student.id] : '')
                        }
                        placeholder="N/A"
                        onChange={e => handleMarkChange(student.id, e.target.value)} 
                        onKeyDown={e => handleMarkKeyDown(e, i)}
                        className="w-20 text-center bg-white border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-[#A05C2B]/30 focus:border-[#A05C2B] font-bold text-gray-800 transition-colors" 
                      />
                    )}
                    <span className="font-bold text-gray-400">/</span>
                    <span className="w-16 text-center text-gray-500 font-bold">{currentMaxMarks}</span>
                  </td>
                </tr>
              );
            })}
            {students.length === 0 && (
              <tr><td colSpan={sectionFilter === 'all' ? 4 : 3} className="p-8 text-center font-medium text-gray-500">No students found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {canEdit && !isPublished && students.length > 0 && (
        <div className="flex flex-col md:flex-row gap-3 md:gap-4">
          {isSubjectLocked ? (
            <button onClick={handleRefillCorrections} className="w-full bg-white border-2 border-[#1F2937] text-[#1F2937] py-3 rounded-xl font-bold shadow-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5" /> Edit / Refill Corrections
            </button>
          ) : (
            <button onClick={handleSaveAndLock} className="w-full bg-[#1F2937] text-white py-3 rounded-xl font-bold shadow-md hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
              <Save className="w-5 h-5" /> Save & Lock Marks
            </button>
          )}
        </div>
      )}
    </div>
  );
}
