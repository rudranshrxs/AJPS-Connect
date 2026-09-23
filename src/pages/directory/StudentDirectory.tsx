import React, { useState, useEffect, useMemo } from 'react';
import { Search, LayoutGrid, List, Filter, Download, Lock, SlidersHorizontal, UserPlus } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { User } from '../../types';
import { StudentProfileWindow } from '../../components/directory/StudentProfileWindow';
import { ExcelImportModal } from '../../components/directory/ExcelImportModal';
import { useAuth } from '../../context/AuthContext';
import { getStudentStats, formatRollNo } from '../../utils/studentUtils';
import { formatClassString } from '../../utils/classUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { useSchoolContext } from '../../context/SchoolContext';
import { useSuccess } from '../../context/SuccessContext';

export function StudentDirectory() {
  const { currentUser } = useAuth();
  const { triggerSuccess } = useSuccess();
  const { students: globalStudents } = useSchoolContext();
  const [students, setStudents] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const selectedStudent = useMemo(() => globalStudents.find(s => s.id === selectedStudentId) || null, [globalStudents, selectedStudentId]);
  const [isClassTeacher, setIsClassTeacher] = useState(true);

  // New states for import & filtering
  const [showImportModal, setShowImportModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    classId: '',
    transport: '',
    feeStatus: '',
    lowAttendance: false,
    failedLastTest: false
  });

  useEffect(() => {
    let onlyStudents = [...globalStudents];

    if (currentUser?.role === 'Teacher') {
      const timetables = JSON.parse(localStorage.getItem('ajps_timetables') || '[]');
      const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      
      const myP1Classes: { classId: string, sectionId: string }[] = [];
      
      timetables.forEach((t: any) => {
        const hasP1 = daysOfWeek.some(day => t.schedule?.[day]?.['p1'] === currentUser.id);
        if (hasP1) {
           myP1Classes.push({ classId: t.classId || t.className, sectionId: t.sectionId });
        }
      });
      
      if (myP1Classes.length > 0) {
         onlyStudents = onlyStudents.filter(s => 
           myP1Classes.some(p1 => 
             String(s.classId) === String(p1.classId) && 
             (String(s.sectionId) === String(p1.sectionId) || s.section === p1.sectionId || s.sectionId === `c${p1.classId}-s${p1.sectionId}`)
           )
         );
         setIsClassTeacher(true);
      } else {
         setIsClassTeacher(false);
      }
    } else {
       setIsClassTeacher(true);
    }

    onlyStudents.sort((a, b) => {
      if (!a.rollNumber) return 1;
      if (!b.rollNumber) return -1;
      return a.rollNumber.localeCompare(b.rollNumber);
    });

    setStudents(onlyStudents);
  }, [currentUser, globalStudents]);

  const uniqueClasses = useMemo(() => Array.from(new Set(students.map(s => s.className).filter(Boolean))), [students]);

  const filteredStudents = useMemo(() => {
    return students.filter(st => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || (
        st.name.toLowerCase().includes(q) ||
        (st.rollNumber && st.rollNumber.toLowerCase().includes(q)) ||
        (st.className && st.className.toLowerCase().includes(q)) ||
        (st.section && st.section.toLowerCase().includes(q)) ||
        (st.sectionName && st.sectionName.toLowerCase().includes(q))
      );
      if (!matchesSearch) return false;

      // Complex Multi-Criteria Filtering
      if (filters.classId && st.className !== filters.classId) return false;

      if (filters.transport || filters.feeStatus || filters.lowAttendance || filters.failedLastTest) {
        const stats = getStudentStats(st.id);
        
        if (filters.transport === 'Vehicle' && !stats.transportMode.includes('Bus') && !stats.transportMode.includes('Van')) return false;
        if (filters.transport === 'Pedestrian' && !stats.transportMode.includes('Walk') && !stats.transportMode.includes('Self')) return false;
        
        if (filters.feeStatus === 'Paid' && stats.isFeeDue) return false;
        if (filters.feeStatus === 'Due' && !stats.isFeeDue) return false;

        if (filters.lowAttendance && stats.attendancePercent >= 75) return false;
        
        // Failed last test (< 33%)
        if (filters.failedLastTest && stats.recentExamPercent >= 33) return false;
      }

      return true;
    });
  }, [searchQuery, students, filters]);

  if (currentUser?.role === 'Teacher' && !isClassTeacher) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <GlassCard className="max-w-md w-full p-8 text-center bg-white/60 border-white backdrop-blur-xl shadow-2xl rounded-3xl">
          <div className="w-20 h-20 mx-auto bg-[#FDF7EE] border-2 border-[#A05C2B]/20 text-[#A05C2B] rounded-full flex items-center justify-center mb-6 shadow-sm">
            <Lock className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-[#1F2937] mb-3 tracking-tight">Access Restricted</h2>
          <p className="text-gray-600 font-semibold leading-relaxed">
            The Student Directory is only accessible to assigned Class Teachers.
          </p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 pb-28 min-h-screen">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-[#1F2937] tracking-tight">Student Directory</h1>
          <p className="text-sm font-semibold text-gray-500 mt-1">Total {students.length} students enrolled.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by name, roll no..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/60 border border-white rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#A05C2B]/30 shadow-sm"
            />
          </div>
          
          <div className="flex bg-white/60 border border-white rounded-xl p-1 shadow-sm">
            <button 
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-[#FDF7EE] text-[#A05C2B] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-[#FDF7EE] text-[#A05C2B] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
          
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`border px-4 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm flex items-center gap-2 ${showFilters ? 'bg-[#A05C2B] text-white border-[#A05C2B]' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
          >
            <SlidersHorizontal className="w-4 h-4" /> Filter
          </button>

          {currentUser?.role === 'Admin' && (
            <button 
              onClick={() => setShowImportModal(true)}
              className="bg-[#A05C2B] text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-[#8A4F25] transition-colors shadow-sm flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" /> Add Student(s)
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters Drawer/Accordion */}
      <AnimatePresence>
        {showFilters && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white/60 border border-white p-5 rounded-2xl shadow-sm backdrop-blur-md mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Class</label>
                <select 
                  value={filters.classId}
                  onChange={e => setFilters({...filters, classId: e.target.value})}
                  className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#A05C2B]"
                >
                  <option value="">All Classes</option>
                  {uniqueClasses.map(c => <option key={c as string} value={c as string}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Transport</label>
                <select 
                  value={filters.transport}
                  onChange={e => setFilters({...filters, transport: e.target.value})}
                  className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#A05C2B]"
                >
                  <option value="">All Types</option>
                  <option value="Vehicle">Vehicle (Bus/Van)</option>
                  <option value="Pedestrian">Pedestrian / Self</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Fee Status</label>
                <select 
                  value={filters.feeStatus}
                  onChange={e => setFilters({...filters, feeStatus: e.target.value})}
                  className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#A05C2B]"
                >
                  <option value="">All</option>
                  <option value="Paid">Fully Paid</option>
                  <option value="Due">Defaulter (Due)</option>
                </select>
              </div>
              <div className="flex flex-col gap-2 justify-center">
                <label className="flex items-center gap-2 cursor-pointer mt-1">
                  <input 
                    type="checkbox" 
                    checked={filters.lowAttendance}
                    onChange={e => setFilters({...filters, lowAttendance: e.target.checked})}
                    className="w-4 h-4 text-[#A05C2B] rounded focus:ring-[#A05C2B]"
                  />
                  <span className="text-sm font-bold text-gray-700">Low Attendance (&lt; 75%)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={filters.failedLastTest}
                    onChange={e => setFilters({...filters, failedLastTest: e.target.checked})}
                    className="w-4 h-4 text-[#A05C2B] rounded focus:ring-[#A05C2B]"
                  />
                  <span className="text-sm font-bold text-gray-700">Failed Last Test (&lt; 33%)</span>
                </label>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Directory Content */}
      <GlassCard className="p-0 overflow-hidden border border-white shadow-sm">
        {filteredStudents.length === 0 && searchQuery ? (
          <div className="p-12 text-center">
            <p className="text-center text-gray-400 mt-2 font-medium">
              No results for "{searchQuery}". Try a different name or roll number.
            </p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 font-bold">No students match your criteria.</p>
          </div>
        ) : viewMode === 'table' ? (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-white text-gray-600 uppercase text-xs border-b border-gray-100">
                  <th className="p-4 font-black tracking-wider whitespace-nowrap">Roll No</th>
                  <th className="p-4 font-black tracking-wider whitespace-nowrap">Student Name</th>
                  <th className="p-4 font-black tracking-wider whitespace-nowrap">Class</th>
                  <th className="p-4 font-black tracking-wider hidden md:table-cell">Transport</th>
                  <th className="p-4 font-black tracking-wider hidden md:table-cell">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudents.map((st) => (
                  <tr 
                    key={st.id} 
                    onClick={() => setSelectedStudentId(st.id)}
                    className="hover:bg-[#FDF7EE]/50 transition-colors cursor-pointer group"
                  >
                    <td className="p-4 font-bold text-gray-600 whitespace-nowrap">
                      {formatRollNo(st.rollNumber)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img src={st.avatarUrl} alt={st.name} className="w-8 h-8 rounded-full border border-gray-200 shadow-sm group-hover:border-[#A05C2B]/30 transition-colors shrink-0" />
                        <span className="font-bold text-[#1F2937] truncate max-w-[150px] sm:max-w-xs">{st.name}</span>
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-gray-700 whitespace-nowrap">
                      <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md text-xs border border-gray-200">
                        {formatClassString(st.className, st.sectionName || st.section, 'shorter')}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-gray-500 truncate max-w-[120px] hidden md:table-cell">
                      {st.transportMode || 'Self'}
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <button className="text-[#A05C2B] font-bold text-xs hover:underline">View Profile</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 bg-gray-50/50">
            {filteredStudents.map((st) => (
              <div 
                key={st.id}
                onClick={() => setSelectedStudentId(st.id)}
                className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-[#A05C2B]/30 transition-all cursor-pointer group flex flex-col items-center text-center"
              >
                <img src={st.avatarUrl} alt={st.name} className="w-16 h-16 rounded-full border-2 border-white shadow-sm mb-3 group-hover:scale-105 transition-transform" />
                <h3 className="font-black text-[#1F2937] mb-1">{st.name}</h3>
                <p className="text-xs font-bold text-gray-500 mb-2">Roll: {formatRollNo(st.rollNumber)}</p>
                <span className="bg-[#FDF7EE] text-[#A05C2B] px-3 py-1 rounded-full text-xs font-black tracking-wide border border-[#A05C2B]/20">
                  {formatClassString(st.className, st.sectionName || st.section, 'shorter')}
                </span>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      <AnimatePresence>
        {selectedStudent && (
          <StudentProfileWindow 
            student={selectedStudent}
            onClose={() => setSelectedStudentId(null)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showImportModal && (
          <ExcelImportModal 
            onClose={() => setShowImportModal(false)}
            onImportComplete={(count) => {
              setStudents(JSON.parse(localStorage.getItem('ajps_users') || '[]').filter((u: any) => u.role === 'Student'));
              triggerSuccess(`Successfully imported ${count} students!`);
              setShowImportModal(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
