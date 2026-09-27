import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Exam {
  id: string;
  name: string;
  month: string;
  session?: string;
  classes: string[];
  isPublished?: boolean;
  isMarksEntryOpen?: boolean;
  status?: 'declared' | 'marks_unlocked' | 'published';
  syllabus?: { classId: string, sectionId?: string, section?: string | 'ALL', subject: string, tags: string[] }[];
  metrics?: {
    type: 'same' | 'different';
    same?: { maxMarks: number; passPercent: number };
    different?: Record<string, { maxMarks: number; passPercent: number }>;
  };
  isMarksEntryUnlocked?: boolean;
  draftedResults?: Record<string, any>;
  lockedByTeachers?: Record<string, boolean>;
  criteria?: {
    passingMarks: number;
    totalMarks: number;
    includeCoScholastic?: boolean;
    weightage?: number;
  };
}

export interface DatesheetRow {
  subject: string;
  date: string;
}

export interface Datesheet {
  id: string;
  examId: string;
  classKey: string;
  schedule: DatesheetRow[];
}

export type MarksRecord = Record<string, Record<string, number | string>>;

export interface ExamResult {
  id: string;
  examId: string;
  classKey: string;
  marks: MarksRecord;
  isPublished: boolean;
  lockedSubjects?: string[];
}

export interface MarksPayload {
  studentId: string;
  subjectId: string;
  marksObtained: number | string;
  totalMarks: number;
  isLocked: boolean;
}

interface AcademicContextType {
  exams: Exam[];
  datesheets: Datesheet[];
  results: ExamResult[];
  addExam: (exam: Exam) => void;
  updateExam: (exam: Exam) => void;
  deleteExam: (examId: string) => void;
  toggleMarksEntry: (id: string) => void;
  postponeExam: (examId: string, days: number) => void;
  addDatesheet: (examId: string, classKeys: string[], schedule: DatesheetRow[]) => void;
  deleteDatesheetsForExam: (examId: string) => void;
  saveMarks: (examId: string, classKey: string, payload: MarksPayload[]) => void;
  publishResult: (examId: string, classKey: string) => void;
  publishExamResult: (examId: string) => void;
  unlockMarks: (examId: string, classKey: string, subject: string) => void;
}

const AcademicContext = createContext<AcademicContextType | undefined>(undefined);

const EXAMS_KEY = 'ajps_exams';
const DATESHEETS_KEY = 'ajps_datesheets';
const RESULTS_KEY = 'ajps_results';

export const AcademicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
      
      if (storedExams) {
        const currentSession = localStorage.getItem('ajps_session') || '2025-26';
        const parsedExams = (JSON.parse(storedExams) || []).map((e: any) => {
          if (e.session && e.session !== currentSession) {
            return { ...e, isPublished: true, status: 'published' };
          }
          return e;
        });
        setExams(parsedExams);
      }
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

  const triggerUpdate = () => {
    window.dispatchEvent(new Event('exams_updated'));
  };

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
    triggerUpdate();
  };

  const updateExam = (exam: Exam) => {
    const newExams = exams.map(e => e.id === exam.id ? exam : e);
    localStorage.setItem(EXAMS_KEY, JSON.stringify(newExams));
    setExams(newExams);
    triggerUpdate();
  };

  const deleteExam = (examId: string) => {
    const newExams = exams.filter(e => e.id !== examId);
    localStorage.setItem(EXAMS_KEY, JSON.stringify(newExams));
    setExams(newExams);
    triggerUpdate();
  };

  const toggleMarksEntry = (id: string) => {
    const updated = exams.map(e => e.id === id ? { ...e, isMarksEntryOpen: !e.isMarksEntryOpen } : e);
    localStorage.setItem(EXAMS_KEY, JSON.stringify(updated));
    setExams(updated);
    triggerUpdate();
  };

  const postponeExam = (examId: string, days: number) => {
    const updated = datesheets.map(ds => {
      if (ds.examId === examId) {
        const newSchedule = ds.schedule?.map(row => {
          let d = new Date(row.date + 'T00:00:00');
          let added = 0;
          while (added < days) {
            d.setDate(d.getDate() + 1);
            if (d.getDay() !== 0) added++; // Skip Sunday
          }
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return { ...row, date: `${year}-${month}-${day}` };
        });
        return { ...ds, schedule: newSchedule || [] };
      }
      return ds;
    });
    localStorage.setItem(DATESHEETS_KEY, JSON.stringify(updated));
    setDatesheets(updated);
    triggerUpdate();
  };

  const addDatesheet = (examId: string, classKeys: string[], schedule: DatesheetRow[]) => {
    let newDatesheets = datesheets.filter(d => !(d.examId === examId && classKeys.includes(d.classKey)));
    classKeys.forEach(classKey => {
      newDatesheets.push({
        id: `ds_${Date.now()}_${classKey}`,
        examId,
        classKey,
        schedule
      });
    });
    localStorage.setItem(DATESHEETS_KEY, JSON.stringify(newDatesheets));
    setDatesheets(newDatesheets);
    triggerUpdate();
  };

  const deleteDatesheetsForExam = (examId: string) => {
    const newDatesheets = datesheets.filter(d => d.examId !== examId);
    localStorage.setItem(DATESHEETS_KEY, JSON.stringify(newDatesheets));
    setDatesheets(newDatesheets);
    triggerUpdate();
  };

  // CORRECT MERGE PATTERN
  const saveMarks = (examId: string, classKey: string, payloads: MarksPayload[]) => {
    let newResults = [...results];
    const existingIndex = newResults.findIndex(r => r.examId === examId && r.classKey === classKey);
    
    if (existingIndex >= 0) {
      const existingResult = newResults[existingIndex];
      const updatedMarks = { ...existingResult.marks };
      let newlyLockedSubjects = new Set(existingResult.lockedSubjects || []);
      
      payloads.forEach(payload => {
        if (payload.marksObtained !== undefined && payload.marksObtained !== null) {
          updatedMarks[payload.studentId] = {
            ...updatedMarks[payload.studentId],
            [payload.subjectId]: payload.marksObtained
          };
        }
        if (payload.isLocked) {
          newlyLockedSubjects.add(payload.subjectId);
        }
      });
      
      newResults[existingIndex] = {
        ...existingResult,
        marks: updatedMarks,
        lockedSubjects: Array.from(newlyLockedSubjects)
      };
    } else {
      const updatedMarks: MarksRecord = {};
      let newlyLockedSubjects = new Set<string>();
      
      payloads.forEach(payload => {
        if (payload.marksObtained !== undefined && payload.marksObtained !== null) {
          updatedMarks[payload.studentId] = {
            ...updatedMarks[payload.studentId],
            [payload.subjectId]: payload.marksObtained
          };
        }
        if (payload.isLocked) {
          newlyLockedSubjects.add(payload.subjectId);
        }
      });
      
      newResults.push({
        id: `${examId}_${classKey}`,
        examId,
        classKey,
        marks: updatedMarks,
        isPublished: false,
        lockedSubjects: Array.from(newlyLockedSubjects)
      });
    }
    
    localStorage.setItem(RESULTS_KEY, JSON.stringify(newResults));
    setResults(newResults);
    triggerUpdate();
  };

  const unlockMarks = (examId: string, classKey: string, subject: string) => {
    let newResults = [...results];
    const existingIndex = newResults.findIndex(r => r.examId === examId && r.classKey === classKey);
    
    if (existingIndex >= 0) {
      const currentLocks = newResults[existingIndex].lockedSubjects || [];
      newResults[existingIndex].lockedSubjects = currentLocks.filter(s => s !== subject);
      localStorage.setItem(RESULTS_KEY, JSON.stringify(newResults));
      setResults(newResults);
      triggerUpdate();
    }
  };

  const publishResult = (examId: string, classKey: string) => {
    const newResults = results.map(r => 
      (r.examId === examId && r.classKey === classKey) ? { ...r, isPublished: true } : r
    );
    localStorage.setItem(RESULTS_KEY, JSON.stringify(newResults));
    setResults(newResults);
    triggerUpdate();
  };

  const publishExamResult = (examId: string) => {
    // Bulk publish all results for this exam
    const newResults = results.map(r => 
      r.examId === examId ? { ...r, isPublished: true } : r
    );
    localStorage.setItem(RESULTS_KEY, JSON.stringify(newResults));
    setResults(newResults);
    
    // Also update the exam status (Global isPublished flag)
    const newExams = exams.map(e => 
      e.id === examId ? { ...e, isPublished: true, status: 'published' as const } : e
    );
    localStorage.setItem(EXAMS_KEY, JSON.stringify(newExams));
    setExams(newExams);
    triggerUpdate();
  };

  return (
    <AcademicContext.Provider value={{
      exams, datesheets, results,
      addExam, updateExam, deleteExam, toggleMarksEntry, postponeExam,
      addDatesheet, deleteDatesheetsForExam,
      saveMarks, publishResult, publishExamResult, unlockMarks
    }}>
      {children}
    </AcademicContext.Provider>
  );
};

export const useAcademic = () => {
  const context = useContext(AcademicContext);
  if (context === undefined) {
    throw new Error('useAcademic must be used within an AcademicProvider');
  }
  return context;
};
