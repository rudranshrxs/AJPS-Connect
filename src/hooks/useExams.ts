import { useState, useEffect } from 'react';

export interface CriteriaGroup {
  id: string;
  name: string;
  classes: string[];
  subjects: { name: string; maxMarks: number; passingMarks: number; includeInTotal: boolean }[];
  passingPercentage: number;
}

export interface Exam {
  id: string;
  name: string;
  month: string;
  startDate: string;
  endDate: string;
  classes: string[];
  isMarksEntryOpen?: boolean;
  isPublished?: boolean;
  status?: 'declared' | 'marks_unlocked' | 'published';
  metrics?: {
    type: 'same' | 'different';
    same?: { maxMarks: number; passPercent: number };
    different?: Record<string, { maxMarks: number; passPercent: number }>;
  };
  isMarksEntryUnlocked?: boolean; // Replaces or complements isMarksEntryOpen
  draftedResults?: Record<string, any>;
  lockedByTeachers?: Record<string, boolean>; // subjectKey -> true
  criteriaGroups?: CriteriaGroup[];
  syllabus?: Array<{
    id: string;
    classId: string;
    className?: string;
    subject: string;
    tags: string[];
    sectionId?: string;
    section?: string;
  }>;
}

export interface DatesheetRow {
  subject: string;
  date: string;
  time?: string;
}

export interface Datesheet {
  id: string;
  examId: string;
  classes: string[];
  rows: DatesheetRow[];
}

export type MarksRecord = Record<string, Record<string, number>>; // studentId -> { subject: marks }

export interface ExamResult {
  id: string;
  examId: string;
  classKey: string;
  marks: MarksRecord;
  isPublished: boolean;
  lockedSubjects?: string[];
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
        const newRows = (ds.rows || (ds as any).schedule || []).map(row => {
          const newDate = new Date(row.date);
          newDate.setDate(newDate.getDate() + daysToShift);
          // Sunday check
          if (newDate.getDay() === 0) {
            newDate.setDate(newDate.getDate() + 1);
          }
          return { ...row, date: newDate.toISOString().split('T')[0] };
        });
        return { ...ds, rows: newRows };
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

  const addDatesheet = (examId: string, classes: string[], rows: DatesheetRow[]) => {
    let newDatesheets = [...datesheets];
    newDatesheets.push({
      id: `ds_${Date.now()}`,
      examId,
      classes,
      rows
    });
    localStorage.setItem(DATESHEETS_KEY, JSON.stringify(newDatesheets));
    setDatesheets(newDatesheets);
    window.dispatchEvent(new Event('exams_updated'));
  };

  const deleteDatesheetsForExam = (examId: string) => {
    const newDatesheets = datesheets.filter(d => d.examId !== examId);
    localStorage.setItem(DATESHEETS_KEY, JSON.stringify(newDatesheets));
    setDatesheets(newDatesheets);
    window.dispatchEvent(new Event('exams_updated'));
  };

  const saveMarks = (examId: string, classId: string, marks: MarksRecord) => {
    const storedClasses = localStorage.getItem('ajps_classes');
    const ajps_classes = storedClasses ? JSON.parse(storedClasses) : [];
    const cls = ajps_classes.find((c: any) => c.id === classId);
    const className = cls ? cls.name : classId;

    let newResults = [...results];
    const classKey = `${examId}_${className}`;
    const existingIndex = newResults.findIndex(r => r.examId === examId && r.classKey === classKey);
    
    if (existingIndex >= 0) {
      newResults[existingIndex].marks = marks;
    } else {
      newResults.push({
        id: `${examId}_${classKey}`,
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

  const updateExam = (exam: Exam) => {
    const newExams = exams.map(e => e.id === exam.id ? exam : e);
    localStorage.setItem(EXAMS_KEY, JSON.stringify(newExams));
    setExams(newExams);
    window.dispatchEvent(new Event('exams_updated'));
  };

  const unlockMarks = (examId: string, className: string, subject: string) => {
    const classKey = `${examId}_${className}`;
    const newResults = results.map(r => {
      if (r.examId === examId && r.classKey === classKey) {
        return { ...r, lockedSubjects: (r as any).lockedSubjects?.filter((s: string) => s !== subject) ?? [] };
      }
      return r;
    });
    localStorage.setItem(RESULTS_KEY, JSON.stringify(newResults));
    setResults(newResults);
    window.dispatchEvent(new Event('exams_updated'));
  };

  const publishResult = (examId: string, classId: string, forcePublish: boolean = false) => {
    const storedClasses = localStorage.getItem('ajps_classes');
    const ajps_classes = storedClasses ? JSON.parse(storedClasses) : [];
    const cls = ajps_classes.find((c: any) => c.id === classId);
    const className = cls ? cls.name : classId;
    const classKey = `${examId}_${className}`;
    
    const result = results.find(r => r.examId === examId && r.classKey === classKey);
    if (!result) return;
    
    // Validation check for 0 marks
    const hasZeroMarks = Object.values(result.marks).some(studentMarks => 
      Object.values(studentMarks).some(m => m === 0)
    );
    
    if (hasZeroMarks && !forcePublish) {
      throw new Error("Cannot publish results: Some marks are entered as 0.");
    }

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
    updateExam,
    deleteExam,
    toggleMarksEntry,
    postponeExam,
    deleteDatesheetsForExam,
    addDatesheet,
    saveMarks,
    publishResult,
    unlockMarks
  };
}
