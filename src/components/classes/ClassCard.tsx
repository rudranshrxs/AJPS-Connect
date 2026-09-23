import React, { useState } from 'react';
import { Plus, Users, AlertCircle, ShieldCheck } from 'lucide-react';
import { SchoolClass, Section } from '../../pages/classes/AdminClassManager';
import { AssignTeacherModal } from './AssignTeacherModal';

interface ClassCardProps {
  schoolClass: SchoolClass;
}

export const ClassCard: React.FC<ClassCardProps> = ({ schoolClass }) => {
  const [assignModalSection, setAssignModalSection] = useState<Section | null>(null);
  
  const handleAddSection = () => {
    // Generate next section name (e.g., Section A, Section B)
    const nextChar = String.fromCharCode(65 + (schoolClass.sections || []).length);
    const newSectionName = `Section ${nextChar}`;
    
    const newSection: Section = {
      id: Date.now().toString(),
      name: newSectionName
    };

    const stored = localStorage.getItem('ajps_classes');
    let classes: SchoolClass[] = stored ? (JSON.parse(stored) || []) : [];
    
    classes = classes.map(c => {
      if (c.id === schoolClass.id) {
        return {
          ...c,
          sections: [...c.sections, newSection]
        };
      }
      return c;
    });

    localStorage.setItem('ajps_classes', JSON.stringify(classes));
    window.dispatchEvent(new Event('classes_updated'));
  };

  return (
    <>
      <div className="bg-white/60 backdrop-blur-xl border border-white/80 rounded-3xl p-5 md:p-6 shadow-[0_4px_24px_-4px_rgba(160,92,43,0.1)] flex flex-col h-full hover:shadow-[0_8px_32px_-4px_rgba(160,92,43,0.15)] transition-all">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200/50">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-[#1F2937] tracking-tight">{schoolClass.className}</h2>
            <p className="text-xs font-semibold text-[#6B7280] mt-1">{(schoolClass.sections || []).length} Sections</p>
          </div>
          <button 
            onClick={handleAddSection}
            className="flex items-center gap-1.5 bg-[#FDF7EE] text-[#A05C2B] px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-[#A05C2B]/10 transition-colors border border-[#A05C2B]/20 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Add Section
          </button>
        </div>

        {/* Sections List */}
        <div className="flex flex-col gap-3 flex-1 overflow-y-auto custom-scrollbar pr-1 -mr-1">
          {(schoolClass.sections || []).length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4 opacity-50">
              <Users className="w-10 h-10 text-[#A05C2B] mb-2" />
              <p className="text-sm font-semibold text-[#1F2937]">No Sections Yet</p>
              <p className="text-xs text-[#6B7280]">Add a section to get started.</p>
            </div>
          ) : (
            (schoolClass.sections || []).map(section => (
              <div key={section.id} className="bg-white/70 border border-white p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm hover:border-[#A05C2B]/30 transition-colors">
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="text-sm font-bold text-[#1F2937]">{section.name}</h3>
                    <span className="inline-flex items-center text-[9px] font-bold uppercase tracking-wider text-[#6B7280] bg-gray-100 px-2 py-0.5 rounded-md">
                      <Users className="w-3 h-3 mr-1" /> 42 Students
                    </span>
                  </div>
                  
                  <div className="flex items-center mt-1">
                    {section.classTeacherName ? (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-lg border border-green-200">
                        <ShieldCheck className="w-3.5 h-3.5" /> {section.classTeacherName}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                        <AlertCircle className="w-3.5 h-3.5" /> No Teacher Assigned
                      </div>
                    )}
                  </div>
                </div>

                <button 
                  onClick={() => setAssignModalSection(section)}
                  className="w-full sm:w-auto text-xs font-bold bg-white text-[#1F2937] border border-gray-200 px-4 py-2.5 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm shrink-0 whitespace-nowrap"
                >
                  {section.classTeacherId ? 'Change Teacher' : 'Assign Teacher'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {assignModalSection && (
        <AssignTeacherModal 
          isOpen={!!assignModalSection} 
          onClose={() => setAssignModalSection(null)} 
          schoolClass={schoolClass} 
          section={assignModalSection} 
        />
      )}
    </>
  );
}
