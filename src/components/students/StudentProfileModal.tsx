import React, { useEffect, useState } from 'react';
import { X, User, Activity, IndianRupee, MapPin, Award, Edit, Check, AlertTriangle } from 'lucide-react';
import { getInterconnectedData, formatClassSectionDisplay } from '../../utils/studentUtils';
import { AttendanceCalendar } from '../attendance/AttendanceCalendar';

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: any;
  onStudentUpdate?: (updatedStudent: any) => void;
  children?: React.ReactNode;
}

export function StudentProfileModal({ isOpen, onClose, student, onStudentUpdate, children }: StudentProfileModalProps) {
  const [stats, setStats] = useState<any>(null);
  
  const [isEditingSection, setIsEditingSection] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [availableClasses, setAvailableClasses] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && student) {
      setStats(getInterconnectedData(student.id));
      setIsEditingSection(false);
      
      try {
        const classes = JSON.parse(localStorage.getItem('ajps_classes') || '[]');
        setAvailableClasses(classes);
        // Pre-select current
        const currClass = classes.find((c: any) => c.className === student.className || c.id === student.classId);
        if (currClass) {
          setSelectedClassId(currClass.id);
          const currSec = currClass.sections.find((s: any) => (typeof s === 'string' ? s : s.id) === student.sectionId || (typeof s === 'string' ? s : s.name) === student.section);
          if (currSec) {
            setSelectedSectionId(typeof currSec === 'string' ? currSec : currSec.id);
          }
        }
      } catch (e) {}
    }
  }, [isOpen, student]);

  const handleSaveSection = () => {
    if (!selectedClassId || !selectedSectionId) return;
    
    try {
      const cls = availableClasses.find(c => c.id === selectedClassId);
      const secObj = cls?.sections?.find((s: any) => (typeof s === 'string' ? s : s.id) === selectedSectionId);
      const secName = typeof secObj === 'string' ? secObj : (secObj?.name || selectedSectionId);
      
      const updatedStudent = {
        ...student,
        classId: selectedClassId,
        className: cls?.className || `Class ${selectedClassId}`,
        sectionId: selectedSectionId,
        section: secName
      };

      if (onStudentUpdate) {
        onStudentUpdate(updatedStudent);
      }
      setIsEditingSection(false);
    } catch (e) {
      console.error('Error updating section', e);
    }
  };

  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end md:justify-end sm:justify-end overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Slide-over / Bottom Sheet */}
      <div className="relative w-full md:w-[450px] bg-[#FDFBF7] h-[85vh] md:h-full mt-auto md:mt-0 rounded-t-3xl md:rounded-none shadow-[0_0_40px_rgba(160,92,43,0.15)] flex flex-col transform transition-transform duration-500 ease-out translate-y-0 md:translate-x-0 overflow-y-auto border-t md:border-t-0 md:border-l border-[#A05C2B]/10">
        
        {/* Header */}
        <div className="p-6 md:p-8 flex items-start justify-between relative bg-white border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#FDF7EE] border border-[#A05C2B]/20 flex items-center justify-center shrink-0">
               {student.avatar ? (
                 <img src={student.avatar} alt={student.name} className="w-full h-full rounded-2xl object-cover" />
               ) : (
                 <User className="w-8 h-8 text-[#A05C2B]" />
               )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 font-sans">{student.name}</h2>
              <p className="text-sm font-black text-[#A05C2B] mt-0.5 tracking-wide">
                {formatClassSectionDisplay(student.className, student.section)}
              </p>
              <p className="text-xs font-semibold text-gray-500 mt-1">Roll No: {student.roll}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors absolute top-6 right-6"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 md:p-8 flex-1">
          {/* Section Edit Mode */}
          {isEditingSection && (
            <div className="mb-6 p-4 bg-white border-2 border-blue-100 rounded-2xl shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
              <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Edit className="w-4 h-4 text-blue-500" /> Reassign Class & Section
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Class</label>
                  <select 
                    value={selectedClassId}
                    onChange={(e) => { setSelectedClassId(e.target.value); setSelectedSectionId(''); }}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500/30"
                  >
                    <option value="">Select Class</option>
                    {availableClasses.map(c => <option key={c.id} value={c.id}>{c.className}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Section</label>
                  <select 
                    value={selectedSectionId}
                    onChange={(e) => setSelectedSectionId(e.target.value)}
                    disabled={!selectedClassId}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500/30 disabled:opacity-50"
                  >
                    <option value="">Select Section</option>
                    {availableClasses.find(c => c.id === selectedClassId)?.sections?.map((s: any) => {
                      const sId = typeof s === 'string' ? s : s.id;
                      const sName = typeof s === 'string' ? s : s.name || s.id;
                      return <option key={sId} value={sId}>{sName}</option>;
                    })}
                  </select>
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={handleSaveSection} disabled={!selectedClassId || !selectedSectionId} className="flex-1 bg-blue-600 text-white font-bold py-2 rounded-xl text-sm shadow-md hover:bg-blue-700 disabled:opacity-50 transition-colors">
                    Save Changes
                  </button>
                  <button onClick={() => setIsEditingSection(false)} className="px-4 py-2 bg-gray-100 text-gray-600 font-bold rounded-xl text-sm hover:bg-gray-200 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Interconnected Overview</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(240,230,210,0.4)] flex flex-col gap-2">
               <div className="flex items-center gap-2 text-gray-600">
                 <Activity className="w-4 h-4 text-green-600" />
                 <span className="text-xs font-semibold">Attendance</span>
               </div>
               <span className="text-2xl font-bold text-gray-900">{stats?.attendancePerc}</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(240,230,210,0.4)] flex flex-col gap-2">
               <div className="flex items-center gap-2 text-gray-600">
                 <IndianRupee className={`w-4 h-4 ${stats?.isFeeDue ? 'text-red-500' : 'text-green-600'}`} />
                 <span className="text-xs font-semibold">Fee Status</span>
               </div>
               <span className={`text-lg font-bold ${stats?.isFeeDue ? 'text-red-600' : 'text-green-700'}`}>{stats?.feeStatus}</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(240,230,210,0.4)] flex flex-col gap-2">
               <div className="flex items-center gap-2 text-gray-600">
                 <MapPin className="w-4 h-4 text-[#A05C2B]" />
                 <span className="text-xs font-semibold">Transport</span>
               </div>
               <span className="text-sm font-bold text-gray-900 leading-tight">{stats?.transportMode}</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(240,230,210,0.4)] flex flex-col gap-2">
               <div className="flex items-center gap-2 text-gray-600">
                 <Award className="w-4 h-4 text-purple-600" />
                 <span className="text-xs font-semibold">Recent Exam</span>
               </div>
               <span className="text-2xl font-bold text-gray-900">{stats?.recentGrade}</span>
            </div>
          </div>

          <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Attendance Calendar</h3>
          <div className="mb-8 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm p-4">
             <AttendanceCalendar attendanceRecords={student.attendanceHistory || []} />
          </div>

          <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Actions</h3>
          <div className="space-y-3">
            {!isEditingSection && (
              <button onClick={() => setIsEditingSection(true)} className="w-full bg-[#FDF7EE] text-[#A05C2B] border border-[#A05C2B]/20 py-3.5 rounded-xl font-bold text-sm hover:bg-[#A05C2B] hover:text-white transition-colors flex justify-center items-center gap-2">
                <Edit className="w-4 h-4" /> Change Section
              </button>
            )}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
