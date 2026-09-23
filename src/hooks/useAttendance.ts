import { useState, useEffect } from 'react';


export type AttendanceStatus = 'Present' | 'Absent' | 'Leave';
export type AttendanceRecord = Record<string, Record<string, AttendanceStatus>>;

export interface LeaveRequest {
  id: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export type LeaveRecord = Record<string, LeaveRequest[]>;
export type FinalizedRecord = Record<string, Record<string, boolean>>;

const STORAGE_KEY = 'ajps_attendance';
const LEAVES_KEY = 'ajps_leaves';
const FINALIZED_KEY = 'ajps_finalized';

export function useAttendance() {
  const [records, setRecords] = useState<AttendanceRecord>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) { const parsed = JSON.parse(stored); if (parsed) return parsed; }
    return {
      '4': {
        '2026-08-20': 'Present',
        '2026-08-21': 'Present',
        '2026-08-22': 'Leave',
        '2026-08-23': 'Absent',
      }
    };
  });

  const [leaves, setLeaves] = useState<LeaveRecord>(() => {
    const stored = localStorage.getItem(LEAVES_KEY);
    if (stored) { const parsed = JSON.parse(stored); if (parsed) return parsed; }
    return {
      '4': [
        { id: 'l1', fromDate: '2026-08-22', toDate: '2026-08-22', reason: 'Fever', status: 'Approved' }
      ]
    };
  });

  const [finalized, setFinalized] = useState<FinalizedRecord>(() => {
    const stored = localStorage.getItem(FINALIZED_KEY);
    if (stored) { const parsed = JSON.parse(stored); if (parsed) return parsed; }
    return {};
  });

  useEffect(() => {
    const handleSync = () => {
      const storedRecords = localStorage.getItem(STORAGE_KEY);
      const storedLeaves = localStorage.getItem(LEAVES_KEY);
      const storedFinalized = localStorage.getItem(FINALIZED_KEY);
      
      if (storedRecords) setRecords(JSON.parse(storedRecords) || {});
      if (storedLeaves) setLeaves(JSON.parse(storedLeaves) || {});
      if (storedFinalized) setFinalized(JSON.parse(storedFinalized) || {});
    };
    
    window.addEventListener('attendance_updated', handleSync);
    window.addEventListener('storage', handleSync);
    
    return () => {
      window.removeEventListener('attendance_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const markAttendance = (studentId: string, date: string, status: AttendanceStatus) => {
    const currentRecords = JSON.parse(localStorage.getItem(STORAGE_KEY) || JSON.stringify(records));
    const newRecords = { ...currentRecords };
    if (!newRecords[studentId]) newRecords[studentId] = {};
    newRecords[studentId][date] = status;
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecords));
    setRecords(newRecords);
    window.dispatchEvent(new Event('attendance_updated'));
  };

  const applyLeave = (studentId: string, leave: LeaveRequest) => {
    const currentLeaves = JSON.parse(localStorage.getItem(LEAVES_KEY) || JSON.stringify(leaves));
    const newLeaves = { ...currentLeaves };
    if (!newLeaves[studentId]) newLeaves[studentId] = [];
    newLeaves[studentId].push(leave);
    
    localStorage.setItem(LEAVES_KEY, JSON.stringify(newLeaves));
    setLeaves(newLeaves);
    window.dispatchEvent(new Event('attendance_updated'));
  };

  const finalizeAttendance = (classKey: string, date: string) => {
    const currentFinalized = JSON.parse(localStorage.getItem(FINALIZED_KEY) || JSON.stringify(finalized));
    const newFinalized = { ...currentFinalized };
    if (!newFinalized[classKey]) newFinalized[classKey] = {};
    newFinalized[classKey][date] = true;

    localStorage.setItem(FINALIZED_KEY, JSON.stringify(newFinalized));
    setFinalized(newFinalized);
    window.dispatchEvent(new Event('attendance_updated'));
  };

  const isStudentOnLeave = (studentId: string, date: string) => {
    const studentLeaves = leaves[studentId] || [];
    return studentLeaves.some(l => 
      l.status === 'Approved' && 
      new Date(date) >= new Date(l.fromDate) && 
      new Date(date) <= new Date(l.toDate)
    );
  };

  return { 
    records, 
    leaves, 
    finalized, 
    markAttendance, 
    applyLeave, 
    finalizeAttendance, 
    isStudentOnLeave 
  };
}

export const formatDDMMMYYYY = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const day = date.getDate().toString().padStart(2, '0');
  const month = date.toLocaleString('default', { month: 'short' });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};
