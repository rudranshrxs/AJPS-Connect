import React, { useState } from 'react';
import { X, CheckCircle, UserCheck } from 'lucide-react';
import { SchoolClass, Section } from '../../pages/classes/AdminClassManager';

interface AssignTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolClass: SchoolClass;
  section: Section;
}

const DUMMY_TEACHERS = [
  { id: 't1', name: 'Meera Reddy' },
  { id: 't2', name: 'Ravi Kumar' },
  { id: 't3', name: 'Sunita Sharma' },
  { id: 't4', name: 'Amit Singh' },
  { id: 't5', name: 'Priya Patel' },
];

export function AssignTeacherModal({ isOpen, onClose, schoolClass, section }: AssignTeacherModalProps) {
  const [selectedTeacher, setSelectedTeacher] = useState(section.classTeacherId || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher) return;

    const teacher = DUMMY_TEACHERS.find(t => t.id === selectedTeacher);
    if (!teacher) return;

    // Read current classes
    const stored = localStorage.getItem('ajps_classes');
    let classes: SchoolClass[] = stored ? (JSON.parse(stored) || []) : [];

    // Update the specific section
    classes = classes.map(c => {
      if (c.id === schoolClass.id) {
        return {
          ...c,
          sections: c.sections.map(s => {
            if (s.id === section.id) {
              return {
                ...s,
                classTeacherId: teacher.id,
                classTeacherName: teacher.name
              };
            }
            return s;
          })
        };
      }
      return c;
    });

    localStorage.setItem('ajps_classes', JSON.stringify(classes));
    window.dispatchEvent(new Event('classes_updated'));
    
    // Custom margin-window toast could be dispatched here if there was a global toast context,
    // but we can just close the modal for now, the real-time UI update serves as feedback.
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-[#1F2937]/30 backdrop-blur-sm p-0 md:p-4 animate-in fade-in duration-200">
      <div className="w-full md:max-w-md bg-white/90 backdrop-blur-xl border border-white rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#FDF7EE] flex items-center justify-center border border-[#A05C2B]/20">
              <UserCheck className="w-4 h-4 text-[#A05C2B]" />
            </div>
            <h2 className="text-lg font-bold text-[#1F2937]">Assign Teacher</h2>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-100/80 text-gray-500 rounded-full hover:bg-gray-200 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 flex-1 overflow-y-auto">
          <div className="mb-6">
            <p className="text-sm text-[#6B7280] font-medium mb-1">
              Assigning Class Teacher for
            </p>
            <p className="text-[#1F2937] font-bold text-lg">
              {schoolClass.className} - {section.name}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2">Select Teacher</label>
              <select 
                value={selectedTeacher}
                onChange={e => setSelectedTeacher(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#A05C2B]/30 focus:border-[#A05C2B] appearance-none"
                required
              >
                <option value="" disabled>Select a teacher...</option>
                {DUMMY_TEACHERS.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
          <button 
            type="submit"
            disabled={!selectedTeacher}
            className="w-full mt-8 bg-[#A05C2B] text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#8e5025] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            <CheckCircle className="w-4 h-4" /> Confirm Assignment
          </button>
        </form>
      </div>
    </div>
  );
}
