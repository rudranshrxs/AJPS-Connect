import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, Plus, Users, Shuffle, Clock, AlertTriangle, 
  Users2, Banknote, User as UserIcon, Merge, X, Search, LayoutGrid
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { MergeSectionModal } from './MergeSectionModal';
import { ReshuffleWizard } from './ReshuffleWizard';
import { useSuccess } from '../../context/SuccessContext';
import { User, Timetable, DayOfWeek, PeriodKey } from '../../types';

// Re-export types so AdminClassManager can still import them
export interface Section {
  id: string;
  name: string;
  classTeacherId?: string;
  classTeacherName?: string;
}

export interface SchoolClass {
  id: string;
  className: string;
  sections: Section[];
}

type ViewState = 'LIST' | 'CLASS_DETAIL' | 'SECTION_DETAIL';

const DAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const PERIODS: PeriodKey[] = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];

interface ClassWindowProps {
  onAddClass: () => void;
}

export function ClassWindow({ onAddClass }: ClassWindowProps) {
  const { triggerSuccess } = useSuccess();
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [timetables, setTimetables] = useState<Timetable[]>([]);

  const [view, setView] = useState<ViewState>('LIST');
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [isReshuffleOpen, setIsReshuffleOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = () => {
    setClasses(JSON.parse(localStorage.getItem('ajps_classes') || '[]'));
    setUsers(JSON.parse(localStorage.getItem('ajps_users') || '[]'));
    setTimetables(JSON.parse(localStorage.getItem('ajps_timetables') || '[]'));
  };

  useEffect(() => {
    loadData();
    const handler = () => loadData();
    window.addEventListener('new-notification', handler);
    window.addEventListener('ajps_users_updated', handler);
    return () => {
      window.removeEventListener('new-notification', handler);
      window.removeEventListener('ajps_users_updated', handler);
    };
  }, []);

  const selectedClass = useMemo(() => classes.find(c => c.id === selectedClassId) || null, [classes, selectedClassId]);
  const selectedSection = useMemo(() => selectedClass?.sections?.find(s => s.id === selectedSectionId) || null, [selectedClass, selectedSectionId]);

  const getTeacherName = (tId?: string) => {
    if (!tId) return 'Unassigned';
    const t = users.find(u => u.id === tId);
    return t ? t.name : 'Unassigned';
  };

  const handleAddSection = (classObj: SchoolClass) => {
    if (!window.confirm(`Are you sure you want to add a new section to ${classObj.className}?`)) return;
    
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nextLetter = letters[(classObj.sections?.length || 0)];
    if (!nextLetter) return;

    const updatedClasses = classes.map(c => {
      if (c.id === classObj.id) {
        return {
          ...c,
          sections: [...(c.sections || []), { id: `${c.id}-s${nextLetter}`, name: nextLetter }]
        };
      }
      return c;
    });

    localStorage.setItem('ajps_classes', JSON.stringify(updatedClasses));
    setClasses(updatedClasses);
    triggerSuccess(`Section ${nextLetter} created successfully.`);
  };

  const sectionStudents = useMemo(() => {
    if (!selectedClass || !selectedSection) return [];
    return users.filter(u => u.role === 'Student' && u.classId === selectedClass.id && u.sectionId === selectedSection.id);
  }, [users, selectedClass, selectedSection]);

  const classStudentCount = (classId: string) => {
    return users.filter(u => u.role === 'Student' && u.classId === classId).length;
  };

  const sectionStudentCount = (classId: string, sectionId: string) => {
    return users.filter(u => u.role === 'Student' && u.classId === classId && u.sectionId === sectionId).length;
  };

  // ─── VIEW: CLASS LIST ───────────────────────────────────────────────────
  if (view === 'LIST') {
    return (
      <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 pb-24 min-h-screen animate-in fade-in duration-300">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-[#1F2937] tracking-tight">Classes Command Center</h1>
            <p className="text-sm font-semibold text-gray-500 mt-1">Manage classes, sections, and structural metrics.</p>
          </div>
          <button 
            onClick={onAddClass}
            className="w-full sm:w-auto bg-[#A05C2B] text-white px-5 py-2.5 rounded-xl font-bold shadow-md hover:bg-[#8B4E24] transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" /> Add New Class
          </button>
        </div>

        {classes.length === 0 ? (
          <div className="text-center p-12 bg-white/40 border border-white rounded-2xl">
            <p className="text-gray-500 font-bold">No classes available.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((cls) => {
              const studentCount = classStudentCount(cls.id);
              return (
                <GlassCard
                  key={cls.id}
                  className="p-5 bg-white border-gray-100 shadow-sm hover:shadow-lg hover:border-[#A05C2B]/30 transition-all cursor-pointer group"
                  onClick={() => {
                    setSelectedClassId(cls.id);
                    setView('CLASS_DETAIL');
                  }}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#FDF7EE] to-[#F5E6D0] border border-[#A05C2B]/20 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                      <span className="text-2xl font-black text-[#A05C2B]">{cls.className.replace('Class ', '')}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#A05C2B] transition-colors">{cls.className}</h3>
                      <p className="text-xs font-semibold text-gray-500">{(cls.sections?.length || 0)} Sections · {studentCount} Students</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {cls.sections?.map((sec) => (
                      <span key={sec.id} className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2.5 py-1 rounded-md border border-gray-200">
                        Sec {sec.name}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-50 flex justify-end">
                    <span className="text-xs font-bold text-[#A05C2B] opacity-0 group-hover:opacity-100 transition-opacity">
                      Open →
                    </span>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ─── VIEW: CLASS DETAIL (Full-Screen Overlay) ────────────────────────────
  if (view === 'CLASS_DETAIL' && selectedClass) {
    return (
      <div className="fixed inset-0 bg-[#FAF7F2] z-50 overflow-y-auto animate-in fade-in slide-in-from-bottom duration-300">
        {/* Sticky Header */}
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 md:px-8 py-4 bg-white/90 backdrop-blur-lg shadow-sm border-b border-gray-100">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setView('LIST')}
              className="text-[#8B5E2E] font-semibold flex items-center gap-1.5 hover:text-[#A05C2B] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" /> Back
            </button>
            <div className="w-px h-6 bg-gray-200" />
            <div className="w-10 h-10 rounded-lg bg-[#FDF7EE] border border-[#A05C2B]/20 flex items-center justify-center">
              <span className="text-lg font-black text-[#A05C2B]">{selectedClass.className.replace('Class ', '')}</span>
            </div>
            <h1 className="text-xl font-bold text-[#1F2937]">{selectedClass.className}</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={() => setIsReshuffleOpen(true)}
              className="bg-[#C5873A] text-white px-3 sm:px-4 py-2 rounded-xl font-bold text-sm shadow-sm hover:bg-[#A05C2B] transition-colors flex items-center gap-2"
            >
              <Shuffle className="w-4 h-4" /> <span className="hidden sm:inline">Reshuffle Sections</span>
            </button>
            <button
              onClick={() => handleAddSection(selectedClass)}
              className="bg-white border border-[#A05C2B]/30 text-[#A05C2B] px-3 sm:px-4 py-2 rounded-xl font-bold text-sm shadow-sm hover:bg-[#FDF7EE] transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Add Section</span>
            </button>
          </div>
        </header>

        {/* Section Cards Grid */}
        <div className="p-4 md:p-8 max-w-6xl mx-auto">
          {!selectedClass.sections || selectedClass.sections.length === 0 ? (
            <div className="bg-white/40 border border-white p-12 rounded-2xl text-center shadow-sm mt-8">
              <p className="text-gray-500 font-bold">No sections found. Add a section to continue.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
              {selectedClass.sections?.map((sec) => {
                const count = sectionStudentCount(selectedClass.id, sec.id);
                const tt = timetables.find(t => t.classId === selectedClass.id && t.sectionId === sec.id);
                const classTeacherId = tt?.schedule?.monday?.p1;
                const classTeacherName = getTeacherName(classTeacherId);

                return (
                  <GlassCard
                    key={sec.id}
                    className="p-6 bg-white border-gray-100 shadow-sm hover:shadow-lg hover:border-[#A05C2B]/30 transition-all cursor-pointer group"
                    onClick={() => {
                      setSelectedSectionId(sec.id);
                      setView('SECTION_DETAIL');
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FDF7EE] to-[#F5E6D0] border border-[#A05C2B]/20 flex items-center justify-center">
                          <span className="text-xl font-black text-[#A05C2B]">{sec.name}</span>
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg group-hover:text-[#A05C2B] transition-colors">Section {sec.name}</h3>
                          <p className="text-xs font-semibold text-gray-500">{count} Students</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <UserIcon className="w-4 h-4 text-emerald-500" />
                        <span className="text-gray-600 font-medium">Class Teacher:</span>
                        <span className="font-bold text-gray-800 truncate">{classTeacherName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-blue-500" />
                        <span className="text-gray-600 font-medium">Boys / Girls:</span>
                        <span className="font-bold text-gray-800">{Math.ceil(count * 0.55)} / {count - Math.ceil(count * 0.55)}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-50 flex justify-between items-center">
                      {!tt && (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> No Timetable
                        </span>
                      )}
                      {tt && <span />}
                      <span className="text-xs font-bold text-[#A05C2B] opacity-0 group-hover:opacity-100 transition-opacity">
                        View Details →
                      </span>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          )}
        </div>

        {/* Reshuffle Wizard */}
        {isReshuffleOpen && (
          <ReshuffleWizard
            classObj={selectedClass}
            onClose={() => { setIsReshuffleOpen(false); loadData(); }}
          />
        )}
      </div>
    );
  }

  // ─── VIEW: SECTION DETAIL (Full-Screen Overlay) ──────────────────────────
  if (view === 'SECTION_DETAIL' && selectedClass && selectedSection) {
    const tt = timetables.find(t => t.classId === selectedClass.id && t.sectionId === selectedSection.id);
    const classTeacherId = tt?.schedule?.monday?.p1;
    const classTeacherName = getTeacherName(classTeacherId);
    const totalStudents = sectionStudents.length;
    const boysCount = Math.ceil(totalStudents * 0.55);
    const girlsCount = totalStudents - boysCount;
    const pendingFees = totalStudents * 1500;

    const filteredStudents = sectionStudents.filter(st => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        st.name.toLowerCase().includes(q) ||
        st.rollNumber?.toLowerCase().includes(q)
      );
    });

    return (
      <div className="fixed inset-0 bg-[#FAF7F2] z-50 overflow-y-auto animate-in fade-in slide-in-from-right duration-300">
        {/* Sticky Header */}
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 md:px-8 py-4 bg-white/90 backdrop-blur-lg shadow-sm border-b border-gray-100">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setView('CLASS_DETAIL'); setSearchQuery(''); }}
              className="text-[#8B5E2E] font-semibold flex items-center gap-1.5 hover:text-[#A05C2B] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" /> Back to {selectedClass.className}
            </button>
            <div className="w-px h-6 bg-gray-200" />
            <h1 className="text-xl font-bold text-[#1F2937]">{selectedClass.className} — Section {selectedSection.name}</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={() => setIsMergeModalOpen(true)}
              className="bg-gray-800 text-white px-3 sm:px-4 py-2 rounded-xl font-bold text-sm shadow-sm hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <Merge className="w-4 h-4" /> <span className="hidden sm:inline">Merge Section</span>
            </button>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/60 border border-white p-4 rounded-xl shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase">Total Students</p>
                <p className="text-xl font-black text-gray-800">{totalStudents}</p>
              </div>
            </div>
            <div className="bg-white/60 border border-white p-4 rounded-xl shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
                <Users2 className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase">Boys & Girls</p>
                <p className="text-lg font-black text-gray-800">{boysCount} B / {girlsCount} G</p>
              </div>
            </div>
            <div className="bg-white/60 border border-white p-4 rounded-xl shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Banknote className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase">Pending Fees</p>
                <p className="text-lg font-black text-gray-800">₹{pendingFees.toLocaleString()}</p>
              </div>
            </div>
            <div className="bg-white/60 border border-white p-4 rounded-xl shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase">Class Teacher</p>
                <p className="text-sm font-black text-gray-800 line-clamp-1">{classTeacherName}</p>
              </div>
            </div>
          </div>

          {/* Student Grid */}
          <GlassCard className="p-0 overflow-hidden border border-white shadow-sm">
            <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#A05C2B]" /> Students
              </h3>
              <div className="relative sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or roll no..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/60 border border-white rounded-xl pl-10 pr-4 py-2 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#A05C2B]/30 shadow-sm"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-white text-gray-600 uppercase text-xs border-b border-gray-100">
                    <th className="p-4 font-black tracking-wider">Roll No</th>
                    <th className="p-4 font-black tracking-wider">Student Name</th>
                    <th className="p-4 font-black tracking-wider">Transport</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredStudents?.map((st) => (
                    <tr 
                      key={st.id} 
                      className="hover:bg-[#FDF7EE]/50 transition-colors cursor-pointer"
                      onClick={() => window.dispatchEvent(new CustomEvent('ajps_open_student_profile', { detail: st }))}
                    >
                      <td className="p-4 font-bold text-gray-600">{st.rollNumber}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img src={st.avatarUrl} alt={st.name} className="w-8 h-8 rounded-full border border-gray-200 shadow-sm" />
                          <span className="font-bold text-[#1F2937] group-hover:text-[#A05C2B]">{st.name}</span>
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-gray-500 truncate max-w-[120px]">
                        {st.transportMode || 'Self/Walking'}
                      </td>
                    </tr>
                  ))}
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-gray-400 font-medium">
                        {searchQuery ? `No results for "${searchQuery}".` : 'No students found in this section.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>

          {/* Timetable */}
          <div className="bg-white/80 border border-white rounded-xl p-5 shadow-sm">
            <h4 className="text-md font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#A05C2B]" /> Weekly Timetable
            </h4>
            {!tt ? (
              <div className="bg-amber-50 text-amber-800 p-4 rounded-lg text-sm font-semibold flex items-center gap-2 border border-amber-200">
                <AlertTriangle className="w-5 h-5" /> No timetable set. The Class Teacher is unassigned.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-gray-100 text-gray-600 uppercase">
                      <th className="p-2 font-bold rounded-tl-lg">Day</th>
                      {PERIODS.map(p => <th key={p} className="p-2 font-bold">{p.toUpperCase()}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {DAYS.map(day => (
                      <tr key={day} className="hover:bg-gray-50">
                        <td className="p-2 font-bold text-gray-700 capitalize">{day.substring(0, 3)}</td>
                        {PERIODS.map(period => (
                          <td key={period} className="p-2 text-gray-600">
                            {getTeacherName(tt.schedule[day]?.[period])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Merge Modal */}
        {isMergeModalOpen && (
          <MergeSectionModal
            sourceClass={selectedClass.className}
            sourceSection={selectedSection.id}
            onClose={() => setIsMergeModalOpen(false)}
            onSuccess={() => {
              setIsMergeModalOpen(false);
              loadData();
              setView('CLASS_DETAIL');
            }}
          />
        )}

      </div>
    );
  }

  // Fallback
  return null;
}
