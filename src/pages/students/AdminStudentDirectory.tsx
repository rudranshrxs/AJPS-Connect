import React, { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, User, Edit, Settings } from 'lucide-react';

import { getInterconnectedData, formatClassSectionDisplay } from '../../utils/studentUtils';
import { StudentProfileModal } from '../../components/students/StudentProfileModal';

export function AdminStudentDirectory() {
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('All');
  const [sectionFilter, setSectionFilter] = useState('All');
  const [transportFilter, setTransportFilter] = useState('All');
  const [feeFilter, setFeeFilter] = useState('All');
  const [performanceFilter, setPerformanceFilter] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [allStudents, setAllStudents] = useState<any[]>([]);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('ajps_users');
      if (stored) {
        const parsed = JSON.parse(stored);
        setAllStudents(parsed.filter((u: any) => u.role === 'Student').map((u: any) => ({
          ...u,
          roll: u.rollNumber || 'N/A' // Map rollNumber to roll for existing UI compatibility
        })));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const handleUpdateStudent = (updatedStudent: any) => {
    // 1. Update localStorage
    try {
      const stored = localStorage.getItem('ajps_users');
      if (stored) {
        const parsed = JSON.parse(stored);
        const updatedUsers = parsed.map((u: any) => u.id === updatedStudent.id ? updatedStudent : u);
        localStorage.setItem('ajps_users', JSON.stringify(updatedUsers));
      }
    } catch (e) {}
    
    // 2. Update local state
    setAllStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
    setSelectedStudent(updatedStudent);
    
    // Dispatch a custom event to notify other components if necessary
    window.dispatchEvent(new Event('ajps_users_updated'));
  };

  const filteredStudents = useMemo(() => {
    return allStudents.filter(student => {
      // Basic Search
      const matchesSearch = student.name.toLowerCase().includes(search.toLowerCase()) || 
                            student.roll.includes(search);
      
      if (!matchesSearch) return false;

      // Class Filter
      if (classFilter !== 'All' && student.className !== classFilter) return false;
      
      // Section Filter
      if (classFilter !== 'All' && sectionFilter !== 'All' && student.section !== sectionFilter && student.sectionId !== sectionFilter) return false;

      // Expensive derived filters (simulated for directory view)
      if (transportFilter !== 'All' || feeFilter !== 'All' || performanceFilter !== 'All') {
        const stats = getInterconnectedData(student.id);
        
        if (transportFilter === 'Vehicle' && !stats.transportMode.includes('Bus')) return false;
        if (transportFilter === 'Pedestrian' && stats.transportMode !== 'Pedestrian') return false;
        
        if (feeFilter === 'Paid' && stats.isFeeDue) return false;
        if (feeFilter === 'Due' && !stats.isFeeDue) return false;

        if (performanceFilter === 'A+' && stats.recentGrade !== 'A+') return false;
      }

      return true;
    });
  }, [search, classFilter, sectionFilter, transportFilter, feeFilter, performanceFilter, allStudents]);

  const uniqueClasses = Array.from(new Set(allStudents.map(s => s.className)));
  
  const uniqueSections = useMemo(() => {
    if (classFilter === 'All') return [];
    const studentsInClass = allStudents.filter(s => s.className === classFilter);
    return Array.from(new Set(studentsInClass.map(s => s.section || s.sectionId))).filter(Boolean);
  }, [classFilter, allStudents]);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Dynamic Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/60 p-4 rounded-2xl border border-white/50 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-xl shrink-0"><User className="text-blue-600 w-5 h-5"/></div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-gray-500 uppercase truncate">Students</p>
            <p className="text-lg font-black text-gray-800">{filteredStudents.length}</p>
          </div>
        </div>
        <div className="bg-white/60 p-4 rounded-2xl border border-white/50 shadow-sm flex items-center gap-3">
           <div className="p-3 bg-purple-100 rounded-xl shrink-0"><User className="text-purple-600 w-5 h-5"/></div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-gray-500 uppercase truncate">Classes</p>
            <p className="text-lg font-black text-gray-800">{new Set(filteredStudents.map(s => s.className)).size}</p>
          </div>
        </div>
        <div className="bg-white/60 p-4 rounded-2xl border border-white/50 shadow-sm flex items-center gap-3">
           <div className="p-3 bg-amber-100 rounded-xl shrink-0"><User className="text-amber-600 w-5 h-5"/></div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-gray-500 uppercase truncate">On Bus</p>
            <p className="text-lg font-black text-gray-800">{filteredStudents.filter(s => getInterconnectedData(s.id).transportMode.includes('Bus')).length}</p>
          </div>
        </div>
        <div className="bg-white/60 p-4 rounded-2xl border border-white/50 shadow-sm flex items-center gap-3">
           <div className="p-3 bg-red-100 rounded-xl shrink-0"><User className="text-red-600 w-5 h-5"/></div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-gray-500 uppercase truncate">Fee Due</p>
            <p className="text-lg font-black text-gray-800">{filteredStudents.filter(s => getInterconnectedData(s.id).isFeeDue).length}</p>
          </div>
        </div>
      </div>

      {/* Header & Filters */}
      <div className="bg-white/40 p-5 rounded-3xl border border-white/50 backdrop-blur-md shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search students by name or roll number..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-white/80 bg-white/60 focus:outline-none focus:ring-2 focus:ring-[#A05C2B]/30 font-sans text-gray-900 placeholder:text-gray-500 shadow-inner"
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="px-6 py-3 bg-[#A05C2B] text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#8A4F25] transition-colors shadow-[0_8px_16px_-4px_rgba(160,92,43,0.3)] shrink-0"
          >
            <SlidersHorizontal className="w-5 h-5" />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-white/40">
            <select 
              value={classFilter} 
              onChange={e => { setClassFilter(e.target.value); setSectionFilter('All'); }}
              className="px-4 py-2.5 rounded-xl border border-white/80 bg-white/60 text-gray-700 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#A05C2B]"
            >
              <option value="All">All Classes</option>
              {uniqueClasses.map(c => <option key={c as string} value={c as string}>{c as string}</option>)}
            </select>
            <select 
              value={sectionFilter} 
              onChange={e => setSectionFilter(e.target.value)}
              disabled={classFilter === 'All'}
              className="px-4 py-2.5 rounded-xl border border-white/80 bg-white/60 text-gray-700 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#A05C2B] disabled:opacity-50"
            >
              <option value="All">All Sections</option>
              {uniqueSections.map(s => <option key={s as string} value={s as string}>Section {s as string}</option>)}
            </select>
            <select 
              value={transportFilter} 
              onChange={e => setTransportFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-white/80 bg-white/60 text-gray-700 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#A05C2B]"
            >
              <option value="All">All Transport</option>
              <option value="Vehicle">Vehicle (Bus)</option>
              <option value="Pedestrian">Pedestrian</option>
            </select>
            <select 
              value={feeFilter} 
              onChange={e => setFeeFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-white/80 bg-white/60 text-gray-700 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#A05C2B]"
            >
              <option value="All">All Fee Status</option>
              <option value="Paid">Paid</option>
              <option value="Due">Due</option>
            </select>
            <select 
              value={performanceFilter} 
              onChange={e => setPerformanceFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-white/80 bg-white/60 text-gray-700 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#A05C2B]"
            >
              <option value="All">All Performance</option>
              <option value="A+">A+ Grade Only</option>
            </select>
          </div>
        )}
      </div>

      {/* Global List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-500 font-medium">No students match your criteria.</div>
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
                <p className="text-xs text-gray-600 mt-0.5 truncate">{formatClassSectionDisplay(student.className, student.section)}</p>
                <p className="text-[10px] font-bold text-[#A05C2B] bg-[#A05C2B]/10 px-2 py-0.5 rounded-md inline-block mt-1">
                  Roll: {student.roll}
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
        onStudentUpdate={handleUpdateStudent}
      >
        <button className="w-full bg-[#FDF7EE] text-[#A05C2B] border border-[#A05C2B]/20 py-3.5 rounded-xl font-bold text-sm hover:bg-[#A05C2B] hover:text-white transition-colors flex justify-center items-center gap-2">
           <User className="w-4 h-4" /> Edit Profile
        </button>
        <button className="w-full bg-[#FDF7EE] text-[#A05C2B] border border-[#A05C2B]/20 py-3.5 rounded-xl font-bold text-sm hover:bg-[#A05C2B] hover:text-white transition-colors flex justify-center items-center gap-2">
           <Settings className="w-4 h-4" /> Adjust Seating/Bench
        </button>
      </StudentProfileModal>
    </div>
  );
}
