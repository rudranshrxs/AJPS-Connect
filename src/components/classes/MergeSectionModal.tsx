import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useSuccess } from '../../context/SuccessContext';
import { SchoolClass, Section } from '../../pages/classes/AdminClassManager';

interface Props {
  sourceClass: string;
  sourceSection: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function MergeSectionModal({ sourceClass, sourceSection, onClose, onSuccess }: Props) {
  const { triggerSuccess } = useSuccess();
  const [targetSection, setTargetSection] = useState('');
  const [availableSections, setAvailableSections] = useState<Section[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const classes: SchoolClass[] = JSON.parse(localStorage.getItem('ajps_classes') || '[]');
    const cls = classes.find(c => c.className === sourceClass);
    if (cls) {
      setAvailableSections(cls.sections.filter(s => s.id !== sourceSection));
    }
  }, [sourceClass, sourceSection]);

  const handleMerge = () => {
    if (!targetSection) return;
    if (!window.confirm('Are you sure you want to merge this section? This action is destructive and cannot be undone.')) return;
    setIsProcessing(true);

    setTimeout(() => {
      // 1. Move students
      const users = JSON.parse(localStorage.getItem('ajps_users') || '[]');
      const updatedUsers = users.map((u: any) => {
        if (u.role === 'Student' && u.className === sourceClass && u.section === sourceSection) {
          return { ...u, section: targetSection };
        }
        return u;
      });
      localStorage.setItem('ajps_users', JSON.stringify(updatedUsers));

      // 2. Delete timetable
      const timetables = JSON.parse(localStorage.getItem('ajps_timetables') || '[]');
      const updatedTimetables = timetables.filter((t: any) => !(t.classId === sourceClass && t.id === sourceSection));
      localStorage.setItem('ajps_timetables', JSON.stringify(updatedTimetables));

      // 3. Remove section from classes
      const classes: SchoolClass[] = JSON.parse(localStorage.getItem('ajps_classes') || '[]');
      const updatedClasses = classes.map(c => {
        if (c.className === sourceClass) {
          return {
            ...c,
            sections: c.sections.filter(s => s.id !== sourceSection)
          };
        }
        return c;
      });
      localStorage.setItem('ajps_classes', JSON.stringify(updatedClasses));

      // 4. Trigger Success & Event
      triggerSuccess(`Section ${sourceSection} successfully merged into Section ${targetSection}`);
      window.dispatchEvent(new Event('new-notification')); // To re-render UI
      onSuccess();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-[#FDFBF7]">
          <h2 className="text-lg font-black text-gray-900">Merge Section</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <p className="font-bold mb-1">Destructive Action</p>
              <p>Merging will move all students from <strong>{sourceClass} Section {sourceSection}</strong> to the selected target section. The original section and its timetable will be permanently deleted.</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Select Target Section</label>
            {availableSections.length === 0 ? (
              <p className="text-sm text-red-500 font-bold bg-red-50 p-3 rounded-lg border border-red-100">No other sections available to merge into.</p>
            ) : (
              <select 
                value={targetSection}
                onChange={e => setTargetSection(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 focus:ring-2 focus:ring-[#A05C2B]/30"
              >
                <option value="">-- Select Section --</option>
                {availableSections.map(s => (
                  <option key={s.id} value={s.id}>Section {s.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="p-5 border-t border-gray-100 bg-gray-50 flex gap-3 justify-end">
          <button 
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-gray-600 font-bold hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleMerge}
            disabled={!targetSection || isProcessing}
            className="bg-red-600 text-white px-5 py-2 rounded-xl font-bold shadow-md hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center min-w-[120px]"
          >
            {isProcessing ? 'Merging...' : 'Confirm Merge'}
          </button>
        </div>
      </div>
    </div>
  );
}
