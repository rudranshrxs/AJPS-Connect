import React, { useState, useMemo, useEffect } from 'react';
import { Search, User, MessageSquare, Bell } from 'lucide-react';
import { getInterconnectedData } from '../../utils/studentUtils';
import { StudentProfileModal } from '../../components/students/StudentProfileModal';
import { useAuth } from '../../context/AuthContext';

export function TeacherStudentDirectory() {
  const { currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [feeFilter, setFeeFilter] = useState('All');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  
  const [students, setStudents] = useState<any[]>([]);
  const [teacherClass, setTeacherClass] = useState('Unknown Class');
  const [teacherSection, setTeacherSection] = useState('');

  useEffect(() => {
    if (!currentUser) return;
    
    const users = JSON.parse(localStorage.getItem('ajps_users') || '[]');
    const timetables = JSON.parse(localStorage.getItem('ajps_timetables') || '[]');
    const classes = JSON.parse(localStorage.getItem('ajps_classes') || '[]');
    
    const freshUser = users.find((u: any) => u.id === currentUser.id) || currentUser;

    let targetClassId = freshUser.classId || freshUser.classTeacherClass;
    let targetSectionId = freshUser.sectionId || freshUser.classTeacherSection;
    
    if (!targetClassId && freshUser.assignedClass) {
       const parts = freshUser.assignedClass.split('-');
       if (parts.length === 2) {
           targetClassId = parts[0].replace('c', '');
           targetSectionId = parts[1].replace('s', '');
       }
    }

    if (!targetClassId) {
      const days = ['monday','tuesday','wednesday','thursday','friday','saturday'];
      const periods = ['p1'];
      const myClassTimetable = timetables.find((t: any) =>
        days.some(day =>
          periods.some(period => t.schedule?.[day]?.[period] === freshUser.id)
        )
      );
      targetClassId = myClassTimetable?.classId;
      targetSectionId = myClassTimetable?.sectionId;
    }

    if (targetClassId && targetSectionId) {
      const classObj = classes.find((c: any) => c.id === targetClassId);
      const sectionObj = classObj?.sections?.find((s: any) => s.id === targetSectionId || (typeof s === 'string' && s === targetSectionId));
      setTeacherClass(classObj ? classObj.className : `Class ${targetClassId}`);
      setTeacherSection(sectionObj ? `Section ${sectionObj.name || sectionObj}` : `Section ${targetSectionId}`);
      
      const classStudents = users.filter((u: any) => 
        u.role === 'Student' && 
        u.classId === targetClassId && 
        (u.sectionId === targetSectionId || u.sectionId === `c${targetClassId}-s${targetSectionId}` || u.section === targetSectionId)
      );
      
      setStudents(classStudents);
    }
  }, [currentUser]);

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      // Basic Search
      const searchLower = search.toLowerCase();
      const matchesSearch = student.name.toLowerCase().includes(searchLower) || 
                            (student.rollNumber && student.rollNumber.toLowerCase().includes(searchLower)) ||
                            (student.roll && String(student.roll).toLowerCase().includes(searchLower));
      if (!matchesSearch) return false;

      // Fee Filter
      if (feeFilter !== 'All') {
        const stats = getInterconnectedData(student.id);
        if (feeFilter === 'Paid' && stats.isFeeDue) return false;
        if (feeFilter === 'Due' && !stats.isFeeDue) return false;
      }

      return true;
    });
  }, [search, feeFilter, students]);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 font-sans tracking-tight">My Students</h1>
        <p className="text-sm text-gray-500 mt-1 font-medium">{teacherClass} - {teacherSection}</p>
      </div>

      {/* Header & Filters */}
      <div className="bg-white/40 p-5 rounded-3xl border border-white/50 backdrop-blur-md shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search students in your class..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-white/80 bg-white/60 focus:outline-none focus:ring-2 focus:ring-[#A05C2B]/30 font-sans text-gray-900 placeholder:text-gray-500 shadow-inner"
            />
          </div>
          <select 
            value={feeFilter} 
            onChange={e => setFeeFilter(e.target.value)}
            className="px-4 py-3 rounded-2xl border border-white/80 bg-white/60 text-gray-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#A05C2B]/30 shrink-0"
          >
            <option value="All">All Fee Status</option>
            <option value="Paid">Paid</option>
            <option value="Due">Due</option>
          </select>
        </div>
      </div>

      {/* Global List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-500 font-medium">No students found in your class.</div>
        ) : (
          filteredStudents.map(student => (
            <div 
              key={student.id} 
              onClick={() => setSelectedStudent(student)}
              className="bg-white/40 border border-white/60 rounded-3xl p-5 backdrop-blur-sm cursor-pointer hover:bg-white/70 hover:shadow-[0_8px_30px_-8px_rgba(160,92,43,0.2)] hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-4"
            >
              <div className="w-14 h-14 rounded-full bg-[#FDF7EE] flex items-center justify-center shrink-0 border border-[#A05C2B]/10">
                <User className="w-7 h-7 text-[#A05C2B]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 truncate">{student.name}</h3>
                <p className="text-xs text-gray-600 mt-0.5 truncate">{teacherClass} - {teacherSection}</p>
                <p className="text-[10px] font-bold text-[#A05C2B] bg-[#A05C2B]/10 px-2 py-0.5 rounded-md inline-block mt-1">
                  Roll: {student.rollNumber || student.roll || 'N/A'}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Profile Modal */}
      <StudentProfileModal 
        isOpen={!!selectedStudent} 
        onClose={() => setSelectedStudent(null)} 
        student={selectedStudent}
      >
        <button className="w-full bg-[#FDF7EE] text-[#A05C2B] border border-[#A05C2B]/20 py-3.5 rounded-xl font-bold text-sm hover:bg-[#A05C2B] hover:text-white transition-colors flex justify-center items-center gap-2">
           <MessageSquare className="w-4 h-4" /> Send Remark to Parent
        </button>
        <button className="w-full bg-[#FDF7EE] text-[#A05C2B] border border-[#A05C2B]/20 py-3.5 rounded-xl font-bold text-sm hover:bg-[#A05C2B] hover:text-white transition-colors flex justify-center items-center gap-2">
           <Bell className="w-4 h-4" /> Send Notice
        </button>
      </StudentProfileModal>
    </div>
  );
}
