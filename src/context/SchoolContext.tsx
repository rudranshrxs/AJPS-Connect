import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { useAttendance, AttendanceRecord } from '../hooks/useAttendance';
import { useFees, FeeTransaction } from '../hooks/useFees';

interface SchoolContextType {
  students: User[];
  attendanceRecords: AttendanceRecord;
  feeRecords: FeeTransaction[];
  updateStudent: (id: string, updates: Partial<User>) => void;
  uploadDocument: (id: string, name: string, fileDataUrl: string) => void;
  changeSection: (id: string, newSection: string, newSectionName?: string) => void;
  collectFee: (studentId: string, amount: number, medium: string, specificDate?: string) => void;
  refreshStudents: () => void;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

export const SchoolProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [students, setStudents] = useState<User[]>([]);
  const { records: attendanceRecords } = useAttendance();
  const { transactions: feeRecords, collectFee } = useFees();

  const loadStudents = useCallback(() => {
    try {
      const storedUsers = localStorage.getItem('ajps_users');
      if (storedUsers) {
        const users: User[] = JSON.parse(storedUsers);
        const onlyStudents = users.filter(u => u.role === 'Student');
        setStudents(onlyStudents);
      }
    } catch (e) {
      console.error('Failed to load students', e);
    }
  }, []);

  useEffect(() => {
    loadStudents();
    window.addEventListener('ajps_users_updated', loadStudents);
    return () => window.removeEventListener('ajps_users_updated', loadStudents);
  }, [loadStudents]);

  const updateStudent = useCallback((id: string, updates: Partial<User>) => {
    try {
      const storedUsers = localStorage.getItem('ajps_users');
      const users: User[] = storedUsers ? JSON.parse(storedUsers) : [];
      const updatedUsers = users.map(u => 
        u.id === id ? { ...u, ...updates } : u
      );
      localStorage.setItem('ajps_users', JSON.stringify(updatedUsers));
      
      // Update local state and broadcast
      setStudents(updatedUsers.filter(u => u.role === 'Student'));
      window.dispatchEvent(new Event('ajps_users_updated'));
    } catch (e) {
      console.error('Failed to update student', e);
    }
  }, []);

  const uploadDocument = useCallback((id: string, name: string, fileDataUrl: string) => {
    try {
      const storedUsers = localStorage.getItem('ajps_users');
      const users: User[] = storedUsers ? JSON.parse(storedUsers) : [];
      
      const newDoc = {
        id: Date.now().toString(),
        name,
        url: fileDataUrl,
        date: new Date().toISOString().split('T')[0]
      };

      const updatedUsers = users.map(u => {
        if (u.id === id) {
          const docs = u.documents || [];
          return { ...u, documents: [...docs, newDoc] };
        }
        return u;
      });

      localStorage.setItem('ajps_users', JSON.stringify(updatedUsers));
      setStudents(updatedUsers.filter(u => u.role === 'Student'));
      window.dispatchEvent(new Event('ajps_users_updated'));
    } catch (e) {
      console.error('Failed to upload document', e);
    }
  }, []);

  const changeSection = useCallback((id: string, newSection: string, newSectionName?: string) => {
    updateStudent(id, { section: newSection, sectionId: newSection, sectionName: newSectionName || newSection });
  }, [updateStudent]);

  return (
    <SchoolContext.Provider value={{
      students,
      attendanceRecords,
      feeRecords,
      updateStudent,
      uploadDocument,
      changeSection,
      collectFee,
      refreshStudents: loadStudents
    }}>
      {children}
    </SchoolContext.Provider>
  );
};

export const useSchoolContext = () => {
  const context = useContext(SchoolContext);
  if (context === undefined) {
    throw new Error('useSchoolContext must be used within a SchoolProvider');
  }
  return context;
};
