import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { User, Timetable, DayOfWeek, PeriodKey } from '../../types';
import { NotificationService } from '../../services/NotificationService';
import { useSuccess } from '../../context/SuccessContext';
import { Lock, Save, Edit3, ChevronDown, Search, AlertTriangle, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SearchableSelect = ({ options, value, onChange, placeholder, className = "" }: any) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: any) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((o: any) => o.label.toLowerCase().includes(search.toLowerCase()));
  const selectedOption = options.find((o: any) => o.value === value);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div 
        className={`w-full flex justify-between items-center cursor-pointer ${className}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown className="w-3 h-3 text-gray-400 shrink-0 ml-2" />
      </div>
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded shadow-xl max-h-48 overflow-y-auto">
          <div className="p-2 sticky top-0 bg-white border-b border-gray-100 z-10">
            <div className="relative">
              <Search className="w-3 h-3 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                className="w-full text-xs p-1.5 pl-6 border border-gray-200 rounded outline-none focus:border-blue-300" 
                placeholder="Search..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                onClick={e => e.stopPropagation()}
                autoFocus
              />
            </div>
          </div>
          <div 
            className="p-2 text-xs hover:bg-gray-50 cursor-pointer text-gray-500 border-b border-gray-50"
            onClick={() => { onChange(''); setIsOpen(false); }}
          >
            -- Clear Selection --
          </div>
          {filteredOptions.map((o: any) => (
            <div 
              key={o.value} 
              className={`p-2 text-xs hover:bg-blue-50 cursor-pointer truncate ${value === o.value ? 'bg-blue-50 font-bold text-blue-700' : 'text-gray-700'}`}
              onClick={() => { onChange(o.value); setIsOpen(false); }}
            >
              {o.label}
            </div>
          ))}
          {filteredOptions.length === 0 && <div className="p-2 text-xs text-gray-400 text-center">No results found</div>}
        </div>
      )}
    </div>
  );
};

const DAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export function AdminTimetable() {
  const { triggerSuccess } = useSuccess();
  const [teachers, setTeachers] = useState<User[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  
  const [totalPeriods, setTotalPeriods] = useState(6);
  const PERIODS: PeriodKey[] = Array.from({ length: totalPeriods }, (_, i) => `p${i + 1}` as PeriodKey);
  
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [activeTab, setActiveTab] = useState<'build' | 'teacher'>('build');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');

  const [currentTimetable, setCurrentTimetable] = useState<Timetable>({
    classId: '',
    sectionId: '',
    isLocked: false,
    schedule: { monday: {}, tuesday: {}, wednesday: {}, thursday: {}, friday: {}, saturday: {} }
  });
  const [warnings, setWarnings] = useState<{ [key: string]: string }>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [clashModal, setClashModal] = useState<{isOpen: boolean, day: DayOfWeek | null, period: PeriodKey | null, teacherId: string | null, conflictData: any}>({isOpen: false, day: null, period: null, teacherId: null, conflictData: null});

  const formatClassName = (cId: string, sId: string) => {
    const cls = classes.find(c => c.id === cId);
    if (!cls) return `Class ${cId} - ${sId}`;
    const sec = cls.sections?.find((s:any) => s.id === sId || s.name === sId);
    return `${cls.className} - ${sec ? sec.name : sId}`;
  };

  useEffect(() => {
    const users = JSON.parse(localStorage.getItem('ajps_users') || '[]');
    setTeachers(users.filter((u: User) => u.role === 'Teacher'));
    setClasses(JSON.parse(localStorage.getItem('ajps_classes') || '[]'));
    setTimetables(JSON.parse(localStorage.getItem('ajps_timetables') || '[]'));
    
    const settings = JSON.parse(localStorage.getItem('ajps_global_settings') || '{}');
    if (settings.totalPeriods) setTotalPeriods(settings.totalPeriods);
  }, []);

  useEffect(() => {
    if (selectedClass && selectedSection) {
      const existing = timetables.find(t => t.classId === selectedClass && t.sectionId === selectedSection);
      if (existing) {
        setCurrentTimetable(JSON.parse(JSON.stringify(existing)));
      } else {
        setCurrentTimetable({
          classId: selectedClass,
          sectionId: selectedSection,
          isLocked: false,
          schedule: { monday: {}, tuesday: {}, wednesday: {}, thursday: {}, friday: {}, saturday: {} }
        });
      }
      setWarnings({});
      setIsEditing(false);
    }
  }, [selectedClass, selectedSection, timetables]);

  
  const getTeacherName = (tId: string) => {
    const t = teachers.find(x => x.id === tId);
    return t ? t.name : 'Unassigned';
  };

  const checkConflictData = (day: DayOfWeek, period: PeriodKey, teacherId: string) => {
    if (!teacherId) return null;
    for (const tt of timetables) {
      if (tt.classId === selectedClass && tt.sectionId === selectedSection) continue;
      if (tt.schedule[day] && tt.schedule[day][period] === teacherId) {
        return { classId: tt.classId, sectionId: tt.sectionId };
      }
    }
    return null;
  };

  const handleAssign = (day: DayOfWeek, period: PeriodKey, teacherId: string) => {
    if (currentTimetable.isLocked) return;
    
    // Clear the assignment if an empty string is provided
    if (!teacherId) {
      setCurrentTimetable(prev => {
        const next = { ...prev };
        next.schedule = { ...next.schedule };
        next.schedule[day] = { ...next.schedule[day] };
        delete next.schedule[day][period];
        return next;
      });
      return;
    }

    const conflict = checkConflictData(day, period, teacherId);
    if (conflict) {
      setClashModal({ isOpen: true, day, period, teacherId, conflictData: conflict });
    } else {
      executeAssign(day, period, teacherId);
    }
  };

  const executeAssign = (day: DayOfWeek, period: PeriodKey, teacherId: string, removeOld: boolean = false, oldConflictData: any = null) => {
    setCurrentTimetable(prev => {
      const next = { ...prev };
      next.schedule = { ...next.schedule };
      next.schedule[day] = { ...next.schedule[day], [period]: teacherId };
      
      const updated = timetables.filter(t => !(t.classId === next.classId && t.sectionId === next.sectionId));
      updated.push(next);
      localStorage.setItem('ajps_timetables', JSON.stringify(updated));
      setTimetables(updated);
      updateClassesWithClassTeacher(next);

      return next;
    });

    if (removeOld && oldConflictData) {
      const updatedTimetables = timetables.map(tt => {
        if (tt.classId === oldConflictData.classId && tt.sectionId === oldConflictData.sectionId) {
          const newSchedule = { ...tt.schedule };
          if (newSchedule[day]) {
            newSchedule[day] = { ...newSchedule[day] };
            delete newSchedule[day][period];
          }
          return { ...tt, schedule: newSchedule };
        }
        return tt;
      });
      setTimetables(updatedTimetables);
      localStorage.setItem('ajps_timetables', JSON.stringify(updatedTimetables));
      
      NotificationService.sendNotification({
        recipientIds: ['admin'],
        title: 'Timetable Adjusted',
        message: `Teacher ${getTeacherName(teacherId)} was shifted. ${formatClassName(oldConflictData.classId, oldConflictData.sectionId)} is now free for Period ${period.toUpperCase()} on ${day}.`,
        type: 'warning'
      });
    }
    
    setClashModal({ isOpen: false, day: null, period: null, teacherId: null, conflictData: null });
  };

  const copyToWholeWeek = (period: PeriodKey) => {
    if (currentTimetable.isLocked) return;
    const teacherId = currentTimetable.schedule.monday[period];
    if (!teacherId) return;

    setCurrentTimetable(prev => {
      const next = { ...prev };
      next.schedule = { ...next.schedule };
      DAYS.forEach(day => {
        next.schedule[day] = { ...next.schedule[day], [period]: teacherId };
      });

      const updated = timetables.filter(t => !(t.classId === next.classId && t.sectionId === next.sectionId));
      updated.push(next);
      localStorage.setItem('ajps_timetables', JSON.stringify(updated));
      setTimetables(updated);
      updateClassesWithClassTeacher(next);

      return next;
    });

    const newWarnings = { ...warnings };
    setWarnings(newWarnings);
  };

  const updateClassesWithClassTeacher = (tt: Timetable) => {
    const classTeacherId = tt.schedule?.monday?.p1;
    
    if (classTeacherId) {
      const updatedClasses = classes.map(c => {
        if (c.id === tt.classId) {
          const updatedSections = c.sections.map((s: any) => {
            if (s.name === tt.sectionId || s.id === tt.sectionId) {
              return { ...s, classTeacherId };
            }
            return s;
          });
          return { ...c, sections: updatedSections };
        }
        return c;
      });
      localStorage.setItem('ajps_classes', JSON.stringify(updatedClasses));
      setClasses(updatedClasses);
    }

    const users = JSON.parse(localStorage.getItem('ajps_users') || '[]');
    let usersUpdated = false;
    const nextUsers = users.map((u: any) => {
       if (u.role === 'Teacher') {
          if (u.id !== classTeacherId && u.classTeacherClass === tt.classId && u.classTeacherSection === tt.sectionId) {
             usersUpdated = true;
             return { ...u, classTeacherClass: null, classTeacherSection: null, assignedClass: null };
          }
          if (u.id === classTeacherId) {
             usersUpdated = true;
             return { ...u, classTeacherClass: tt.classId, classTeacherSection: tt.sectionId, assignedClass: `c${tt.classId}-s${tt.sectionId}` };
          }
       }
       return u;
    });
    
    if (usersUpdated) {
        localStorage.setItem('ajps_users', JSON.stringify(nextUsers));
        window.dispatchEvent(new Event('ajps_users_updated'));
        window.dispatchEvent(new Event('storage')); // Trigger AuthContext update
    }

    return classTeacherId || null;
  };

  const saveTimetableLocally = (isLocked: boolean = false) => {
    const nextTT = { ...currentTimetable, isLocked };
    const existing = timetables.find(t => t.classId === nextTT.classId && t.sectionId === nextTT.sectionId);
    
    // Bi-Directional Sync Notifications
    if (existing) {
      DAYS.forEach(day => {
        PERIODS.forEach(p => {
          const oldTeacher = existing.schedule[day]?.[p];
          const newTeacher = nextTT.schedule[day]?.[p];
          if (oldTeacher && newTeacher && oldTeacher !== newTeacher) {
            NotificationService.sendNotification({
              recipientIds: [oldTeacher],
              title: 'Timetable Update',
              message: `🚨 Your Period ${p.replace('p', '')} on ${day.charAt(0).toUpperCase() + day.slice(1)} for ${formatClassName(nextTT.classId, nextTT.sectionId)} has been reassigned.`,
              type: 'warning'
            });
            NotificationService.sendNotification({
              recipientIds: [newTeacher],
              title: 'New Class Assigned',
              message: `You have been assigned Period ${p.replace('p', '')} on ${day.charAt(0).toUpperCase() + day.slice(1)} for ${formatClassName(nextTT.classId, nextTT.sectionId)}.`,
              type: 'info'
            });
          }
        });
      });
    }

    const updated = timetables.filter(t => !(t.classId === nextTT.classId && t.sectionId === nextTT.sectionId));
    updated.push(nextTT);
    localStorage.setItem('ajps_timetables', JSON.stringify(updated));
    setTimetables(updated);
    
    // Auto assign class teacher on save or lock
    return updateClassesWithClassTeacher(nextTT);
  };

  const handleSave = () => {
    saveTimetableLocally(false);
    triggerSuccess('Timetable saved successfully');
  };

  const handleLock = () => {
    setIsProcessing(true);
    
    // Simulate network delay
    setTimeout(() => {
      const classTeacherId = saveTimetableLocally(true);
      
      // Collect all assigned teachers to notify
      const assignedTeacherIds = new Set<string>();
      DAYS.forEach(day => {
        PERIODS.forEach(p => {
          if (currentTimetable.schedule[day]?.[p]) {
            assignedTeacherIds.add(currentTimetable.schedule[day][p]!);
          }
        });
      });

      NotificationService.sendNotification({
        recipientIds: Array.from(assignedTeacherIds),
        title: 'Timetable Assigned',
        message: `You have been assigned classes in the new timetable for ${formatClassName(selectedClass, selectedSection)}.`,
        type: 'info'
      });

      if (classTeacherId) {
        NotificationService.sendNotification({
          recipientIds: [classTeacherId],
          title: 'Class Teacher Assignment',
          message: `You have been assigned as Class Teacher for ${formatClassName(selectedClass, selectedSection)}.`,
          type: 'success'
        });
      }

      setIsProcessing(false);
      triggerSuccess('Timetable Locked & Published');
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b border-gray-200">
        <button 
          className={`font-bold px-4 py-2 ${activeTab === 'build' ? 'text-[#A05C2B] border-b-2 border-[#A05C2B]' : 'text-gray-500'}`}
          onClick={() => setActiveTab('build')}
        >
          Build Class Timetable
        </button>
        <button 
          className={`font-bold px-4 py-2 ${activeTab === 'teacher' ? 'text-[#A05C2B] border-b-2 border-[#A05C2B]' : 'text-gray-500'}`}
          onClick={() => setActiveTab('teacher')}
        >
          View Teacher Timetable
        </button>
      </div>

      {activeTab === 'build' && (
        <GlassCard className="p-6">
          <div className="flex flex-wrap gap-4 mb-6">
            <select 
              className="bg-white/50 border border-gray-300 rounded-lg px-4 py-2 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#A05C2B]/50"
              value={selectedClass} 
              onChange={e => setSelectedClass(e.target.value)}
            >
              <option value="">Select Class</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.className}</option>)}
            </select>
            
            <select 
              className="bg-white/50 border border-gray-300 rounded-lg px-4 py-2 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#A05C2B]/50"
              value={selectedSection} 
              onChange={e => setSelectedSection(e.target.value)}
              disabled={!selectedClass}
            >
              <option value="">Select Section</option>
              {classes.find(c => c.id === selectedClass)?.sections?.map((s: any) => (
                <option key={s.id} value={s.id}>Section {s.name}</option>
              ))}
            </select>
            
            <div className="ml-auto flex gap-3">
              {currentTimetable.isLocked && !isEditing ? (
                <button 
                  onClick={() => {
                    setCurrentTimetable(prev => ({ ...prev, isLocked: false }));
                    setIsEditing(true);
                  }}
                  className="bg-[#1F2937] text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-800 transition-colors shadow-sm flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4" /> Unlock & Edit Timetable
                </button>
              ) : (
                <>
                  <button 
                    onClick={handleSave}
                    disabled={!selectedClass || !selectedSection || isProcessing}
                    className="bg-white/60 text-gray-800 px-6 py-2 rounded-lg font-bold hover:bg-white/80 disabled:opacity-50 transition-colors shadow-sm flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" /> Save Draft
                  </button>
                  <button 
                    onClick={() => {
                      handleLock();
                      setIsEditing(false);
                    }}
                    disabled={!selectedClass || !selectedSection || isProcessing}
                    className="bg-[#A05C2B] text-white px-6 py-2 rounded-lg font-bold hover:bg-[#8B4E24] disabled:opacity-50 transition-colors shadow-sm flex items-center gap-2"
                  >
                    <Lock className="w-4 h-4" /> 
                    {currentTimetable.isLocked ? 'Save & Lock Updates' : 'Lock & Publish'}
                  </button>
                </>
              )}
            </div>
          </div>

          {selectedClass && selectedSection ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="p-3 border-b-2 border-gray-200 text-sm font-bold text-gray-700">Period</th>
                    {DAYS.map(day => (
                      <th key={day} className="p-3 border-b-2 border-gray-200 text-sm font-bold text-gray-700 capitalize">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PERIODS.map(period => (
                    <tr key={period} className="border-b border-gray-100 hover:bg-white/30 transition-colors">
                      <td className="p-3 font-bold text-gray-800 align-top">
                        {period.toUpperCase()}
                        {currentTimetable.schedule.monday[period] && (!currentTimetable.isLocked || isEditing) && (
                          <div className="mt-2">
                            <button 
                              onClick={() => copyToWholeWeek(period)}
                              className="text-[10px] bg-white border border-gray-300 px-2 py-1 rounded text-gray-600 hover:bg-gray-50"
                              title="Copy Monday's teacher to the whole week"
                            >
                              Set for whole week
                            </button>
                          </div>
                        )}
                      </td>
                      {DAYS.map(day => {
                        const cellKey = `${day}-${period}`;
                        const tId = currentTimetable.schedule[day][period] || '';
                        return (
                          <td key={cellKey} className="p-3 align-top min-w-[160px]">
                            {currentTimetable.isLocked && !isEditing ? (
                              <div className="w-full text-xs p-2 rounded border border-transparent font-bold text-gray-700 bg-white/40">
                                {getTeacherName(tId)}
                              </div>
                            ) : (
                              <>
                                <SearchableSelect
                                  options={teachers.map(t => ({ value: t.id, label: t.name }))}
                                  value={tId}
                                  onChange={(val: string) => handleAssign(day, period, val)}
                                  placeholder="-- Select Teacher --"
                                  className="text-xs p-2 rounded border focus:outline-none focus:ring-1 focus:ring-[#A05C2B] bg-white/60 border-gray-200"
                                />
                              </>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 p-4 bg-[#FDF7EE] rounded-xl border border-[#A05C2B]/20">
                <p className="text-xs text-[#A05C2B] font-semibold">
                  <span className="font-bold uppercase tracking-wider">Note:</span> The teacher assigned to Monday - P1 will automatically be designated as the Class Teacher for this section.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center p-12 text-gray-400 font-bold">
              Select a class and section to build the timetable.
            </div>
          )}
        </GlassCard>
      )}

      {activeTab === 'teacher' && (
        <GlassCard className="p-6">
          <div className="mb-6">
            <SearchableSelect
              options={teachers.map(t => ({ value: t.id, label: t.name }))}
              value={selectedTeacherId}
              onChange={(val: string) => setSelectedTeacherId(val)}
              placeholder="Search and select a Teacher..."
              className="bg-white/50 border border-gray-300 rounded-lg px-4 py-2 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#A05C2B]/50 max-w-md"
            />
          </div>
          
          {selectedTeacherId ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="p-3 border-b-2 border-gray-200 text-sm font-bold text-gray-700">Period</th>
                    {DAYS.map(day => (
                      <th key={day} className="p-3 border-b-2 border-gray-200 text-sm font-bold text-gray-700 capitalize">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PERIODS.map(period => (
                    <tr key={period} className="border-b border-gray-100 hover:bg-white/30 transition-colors">
                      <td className="p-3 font-bold text-gray-800">{period.toUpperCase()}</td>
                      {DAYS.map(day => {
                        let assignedClass = '';
                        for (const tt of timetables) {
                          if (tt.schedule[day] && tt.schedule[day][period] === selectedTeacherId) {
                            assignedClass = formatClassName(tt.classId, tt.sectionId);
                            break;
                          }
                        }
                        return (
                          <td key={`${day}-${period}`} className="p-3 text-sm">
                            {assignedClass ? (
                              <span className="bg-[#A05C2B]/10 text-[#A05C2B] px-2 py-1 rounded font-bold">{assignedClass}</span>
                            ) : (
                              <span className="text-gray-400 italic">Free</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center p-12 text-gray-400 font-bold">
              Select a teacher to view their compiled timetable.
            </div>
          )}
        </GlassCard>
      )}

      {/* Clash Resolution Modal */}
      <AnimatePresence>
        {clashModal.isOpen && clashModal.conflictData && clashModal.teacherId && clashModal.day && clashModal.period && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="bg-amber-50 p-6 border-b border-amber-100 flex items-start gap-4">
                <div className="p-3 bg-amber-100 rounded-full text-amber-600 shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-amber-900 mb-1">Teacher Already Assigned</h3>
                  <p className="text-sm text-amber-800 font-medium">
                    <span className="font-bold">{getTeacherName(clashModal.teacherId)}</span> is already booked for <span className="font-bold">{formatClassName(clashModal.conflictData.classId, clashModal.conflictData.sectionId)}</span> during <span className="font-bold capitalize">{clashModal.day} Period {clashModal.period.toUpperCase()}</span>.
                  </p>
                </div>
              </div>
              
              <div className="p-6">
                <p className="text-gray-600 text-sm mb-6">
                  If you move them to this class, the original class ({formatClassName(clashModal.conflictData.classId, clashModal.conflictData.sectionId)}) will be left <span className="font-bold text-red-500">without a teacher</span> for this period.
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setClashModal({ isOpen: false, day: null, period: null, teacherId: null, conflictData: null })}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors flex justify-center items-center gap-2"
                  >
                    <X className="w-4 h-4" /> Cancel
                  </button>
                  <button 
                    onClick={() => executeAssign(clashModal.day!, clashModal.period!, clashModal.teacherId!, true, clashModal.conflictData)}
                    className="flex-1 px-4 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-colors flex justify-center items-center gap-2"
                  >
                    <Check className="w-4 h-4" /> Move Teacher
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
