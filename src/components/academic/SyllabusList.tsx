import React from 'react';
import { GlassCard } from '../ui/GlassCard';
import { SyllabusItem, groupSyllabusBySubject } from '../../utils/syllabusUtils';

interface SyllabusListProps {
  syllabus: SyllabusItem[];
  classId: string;
  sectionFilter: string;
  onDelete?: (id: string) => void;
}

export function SyllabusList({ syllabus, classId, sectionFilter, onDelete }: SyllabusListProps) {
  // Filter for current class and section
  // If a syllabus is for "ALL" sections, show it regardless of the sectionFilter
  const filteredSyllabus = syllabus.filter(s => {
    const sId = String(s.classId);
    const cId = String(classId);
    if (sId !== cId && s.className !== `Class ${cId}`) return false;
    if (s.sectionId === 'ALL' || s.section === 'ALL') return true;
    if (sectionFilter === 'all') return true; // Show everything if filter is 'all'
    return s.sectionId === sectionFilter;
  });

  // Group by subject to prevent duplicates if someone manually added multiple
  const groupedSyllabus = groupSyllabusBySubject(filteredSyllabus);

  if (groupedSyllabus.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 font-medium">
        No syllabus published for this view yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {groupedSyllabus.map(sItem => {
        const isAllSections = sItem.sectionId === 'ALL' || sItem.section === 'ALL';
        return (
          <GlassCard key={sItem.id} className="p-5 bg-white border border-gray-100 shadow-sm relative group hover:shadow-md transition-all">
            <h5 className="font-bold text-gray-900 mb-3">{sItem.subject}</h5>
            <span className="absolute top-4 right-4 bg-gray-100 text-gray-500 px-2 py-1 rounded flex items-center gap-2">
              {isAllSections ? <span className="text-sm font-semibold">Sections: All (A, B, C...)</span> : <span className="text-xs font-bold">Sec {sItem.sectionId}</span>}
              {onDelete && (
                <button onClick={() => onDelete(sItem.id)} className="text-red-400 hover:text-red-600 transition-colors" title="Delete/Edit Syllabus">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                </button>
              )}
            </span>
            <ul className="list-disc list-inside mt-3 space-y-1">
              {sItem.tags?.map((t: string, idx: number) => (
                <li key={idx} className="text-sm text-gray-700 font-medium">
                  {t}
                </li>
              ))}
            </ul>
          </GlassCard>
        );
      })}
    </div>
  );
}
