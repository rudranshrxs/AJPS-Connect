import React, { useState, useMemo, useCallback } from 'react';
import { ArrowLeft, Check, RotateCcw, Users, X } from 'lucide-react';
import { SchoolClass } from './ClassWindow';
import { User } from '../../types';
import { useSuccess } from '../../context/SuccessContext';

interface ReshuffleDraft {
  studentId: string;
  name: string;
  rollNumber: string;
  avatarUrl: string;
  currentSection: string;
  currentSectionName: string;
  assignedSection: string | null;
  assignedSectionName: string | null;
}

interface ReshuffleWizardProps {
  classObj: SchoolClass;
  onClose: () => void;
}

export function ReshuffleWizard({ classObj, onClose }: ReshuffleWizardProps) {
  const { triggerSuccess } = useSuccess();

  const allStudents: User[] = useMemo(() => {
    const users: User[] = JSON.parse(localStorage.getItem('ajps_users') || '[]');
    return users
      .filter(u => u.role === 'Student' && u.classId === classObj.id)
      .sort((a, b) => (a.rollNumber || '').localeCompare(b.rollNumber || ''));
  }, [classObj.id]);

  const [draft, setDraft] = useState<ReshuffleDraft[]>(() =>
    allStudents.map(st => ({
      studentId: st.id,
      name: st.name,
      rollNumber: st.rollNumber || '',
      avatarUrl: st.avatarUrl,
      currentSection: st.sectionId || '',
      currentSectionName: st.sectionName || st.section || '',
      assignedSection: null,
      assignedSectionName: null,
    }))
  );

  const [step, setStep] = useState<'SORT' | 'REVIEW'>('SORT');
  const [animatingOut, setAnimatingOut] = useState(false);

  const sections = classObj.sections || [];

  const currentStudent = useMemo(() => {
    return draft.find(s => s.assignedSection === null) || null;
  }, [draft]);

  const sortedCount = draft.filter(s => s.assignedSection !== null).length;
  const totalCount = draft.length;
  const progress = totalCount > 0 ? Math.round((sortedCount / totalCount) * 100) : 0;

  // Check if all assigned
  const allAssigned = draft.every(s => s.assignedSection !== null);

  const assignSection = useCallback((studentId: string, sectionId: string, sectionName: string) => {
    setAnimatingOut(true);
    setTimeout(() => {
      setDraft(prev => prev.map(s =>
        s.studentId === studentId
          ? { ...s, assignedSection: sectionId, assignedSectionName: sectionName }
          : s
      ));
      setAnimatingOut(false);
    }, 300);
  }, []);

  const resetAll = () => {
    setDraft(prev => prev.map(s => ({ ...s, assignedSection: null, assignedSectionName: null })));
    setStep('SORT');
  };

  const handleSave = () => {
    if (!window.confirm('Are you sure you want to save these reshuffled sections?')) return;
    const users: User[] = JSON.parse(localStorage.getItem('ajps_users') || '[]');
    const updatedUsers = users.map(u => {
      const match = draft.find(d => d.studentId === u.id);
      if (match && match.assignedSection) {
        const sec = sections.find(s => s.id === match.assignedSection);
        return {
          ...u,
          sectionId: match.assignedSection,
          sectionName: sec?.name || match.assignedSectionName || u.sectionName,
          section: sec?.name || match.assignedSectionName || u.section,
        };
      }
      return u;
    });
    localStorage.setItem('ajps_users', JSON.stringify(updatedUsers));
    window.dispatchEvent(new Event('ajps_users_updated'));
    triggerSuccess(`Section reshuffle for ${classObj.className} saved successfully!`);
    onClose();
  };

  // Group by assigned section for review
  const grouped = useMemo(() => {
    const map: Record<string, ReshuffleDraft[]> = {};
    sections.forEach(sec => { map[sec.id] = []; });
    draft.forEach(d => {
      if (d.assignedSection && map[d.assignedSection]) {
        map[d.assignedSection].push(d);
      }
    });
    return map;
  }, [draft, sections]);

  // ─── STEP: SORT (Tinder-style) ────────────────────────────────────────
  if (step === 'SORT') {
    return (
      <div className="fixed inset-0 z-[60] bg-[#FAF7F2] overflow-y-auto flex flex-col animate-in fade-in duration-300">
        {/* Header */}
        <header className="sticky top-0 z-10 px-4 md:px-8 py-4 bg-white/90 backdrop-blur-lg shadow-sm border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="text-[#8B5E2E] font-semibold flex items-center gap-1.5">
              <ArrowLeft className="w-5 h-5" /> Cancel
            </button>
            <div className="w-px h-6 bg-gray-200" />
            <h1 className="text-lg font-bold text-[#1F2937]">🔀 Reshuffle — {classObj.className}</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={resetAll} className="text-gray-500 hover:text-gray-700 text-sm font-bold flex items-center gap-1">
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
            {allAssigned && (
              <button
                onClick={() => setStep('REVIEW')}
                className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-sm hover:bg-emerald-700 transition-colors flex items-center gap-2"
              >
                <Check className="w-4 h-4" /> Review
              </button>
            )}
          </div>
        </header>

        {/* Progress */}
        <div className="px-4 md:px-8 pt-6 max-w-lg mx-auto w-full">
          <div className="flex justify-between text-xs font-bold text-gray-500 mb-2">
            <span>{sortedCount} of {totalCount} sorted</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#C5873A] to-[#A05C2B] rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Student Card */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
          {currentStudent ? (
            <>
              <div
                className={`rounded-2xl shadow-xl bg-white p-6 w-80 mx-auto border border-gray-100 transition-all duration-300 ${
                  animatingOut ? 'translate-x-[-100vw] opacity-0' : 'translate-x-0 opacity-100'
                }`}
              >
                <div className="flex items-center gap-4 mb-4">
                  <img src={currentStudent.avatarUrl} alt={currentStudent.name} className="w-14 h-14 rounded-xl border-2 border-white shadow-sm" />
                  <div>
                    <p className="text-2xl font-bold text-[#8B5E2E]">{currentStudent.name}</p>
                    <p className="text-sm text-gray-500">Current: Section {currentStudent.currentSectionName}</p>
                    <p className="text-xs text-gray-400">Roll No: {currentStudent.rollNumber}</p>
                  </div>
                </div>
              </div>

              {/* Section Buttons */}
              <div className="flex flex-wrap justify-center gap-3 mt-8 max-w-md">
                {sections.map(sec => (
                  <button
                    key={sec.id}
                    onClick={() => assignSection(currentStudent.studentId, sec.id, sec.name)}
                    disabled={animatingOut}
                    className="px-5 py-2.5 rounded-full bg-[#C5873A] text-white font-semibold shadow-md hover:bg-[#A05C2B] transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                  >
                    Move to Sec {sec.name}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-2">All Students Sorted!</h2>
              <p className="text-gray-500 font-medium mb-6">Review the section assignments before saving.</p>
              <button
                onClick={() => setStep('REVIEW')}
                className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold shadow-md hover:bg-emerald-700 transition-colors"
              >
                Review & Save
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── STEP: REVIEW ────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[60] bg-[#FAF7F2] overflow-y-auto flex flex-col animate-in fade-in duration-300">
      <header className="sticky top-0 z-10 px-4 md:px-8 py-4 bg-white/90 backdrop-blur-lg shadow-sm border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setStep('SORT')} className="text-[#8B5E2E] font-semibold flex items-center gap-1.5">
            <ArrowLeft className="w-5 h-5" /> Go Back & Edit
          </button>
          <div className="w-px h-6 bg-gray-200" />
          <h1 className="text-lg font-bold text-[#1F2937]">Review Assignments — {classObj.className}</h1>
        </div>
        <button
          onClick={handleSave}
          className="bg-[#A05C2B] text-white px-6 py-2.5 rounded-xl font-bold shadow-md hover:bg-[#8B4E24] transition-colors flex items-center gap-2"
        >
          <Check className="w-5 h-5" /> Confirm & Save
        </button>
      </header>

      <div className="p-4 md:p-8 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sections.map(sec => {
            const sectionDrafts = grouped[sec.id] || [];
            return (
              <div key={sec.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 bg-gradient-to-r from-[#FDF7EE] to-white border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#A05C2B]/10 flex items-center justify-center">
                      <span className="text-lg font-black text-[#A05C2B]">{sec.name}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Section {sec.name}</h3>
                      <p className="text-xs font-semibold text-gray-500">{sectionDrafts.length} students</p>
                    </div>
                  </div>
                  <Users className="w-5 h-5 text-gray-400" />
                </div>
                <div className="p-4 max-h-64 overflow-y-auto divide-y divide-gray-50">
                  {sectionDrafts.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4 font-medium">No students assigned.</p>
                  ) : (
                    sectionDrafts.map(d => (
                      <div key={d.studentId} className="flex items-center gap-3 py-2">
                        <img src={d.avatarUrl} alt={d.name} className="w-7 h-7 rounded-full border border-gray-200" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-800 truncate">{d.name}</p>
                          <p className="text-[10px] text-gray-400">Roll: {d.rollNumber} · was Sec {d.currentSectionName}</p>
                        </div>
                        {d.currentSection !== d.assignedSection && (
                          <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            Moved
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
