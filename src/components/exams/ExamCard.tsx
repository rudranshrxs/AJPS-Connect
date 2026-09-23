import React from 'react';
import { GlassCard } from '../ui/GlassCard';
import { Exam } from '../../hooks/useExams';

interface ExamCardProps {
  key?: React.Key;
  exam: Exam;
  onClick: () => void;
  isConcluded?: boolean;
  subtitle?: React.ReactNode;
  actionLabel?: string;
}

export function ExamCard({ exam, onClick, isConcluded, subtitle, actionLabel = 'View Details' }: ExamCardProps) {
  return (
    <GlassCard 
      className={`p-5 bg-white border-gray-100 shadow-sm flex flex-col justify-between cursor-pointer hover:shadow-md transition-shadow group relative ${isConcluded ? 'opacity-80' : ''}`}
      onClick={onClick}
    >
      <div>
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-bold text-gray-900 text-lg group-hover:text-[#A05C2B] transition-colors">{exam.name}</h4>
          <div className="flex flex-col items-end gap-1">
            <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wide">
              {exam.month}
            </span>
            {isConcluded && (
              <span className="bg-gray-100 text-gray-600 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wide">
                Concluded
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-1 mb-2">
          {subtitle || (
            <p className="text-xs text-gray-500 font-semibold line-clamp-1">
              <span className="text-gray-400 font-medium">Classes:</span> {(exam.classes || []).join(', ')}
            </p>
          )}
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
          <span className={`text-[10px] font-bold uppercase tracking-wider ${
            exam.isPublished || exam.status === 'published' 
              ? 'text-green-600' 
              : exam.isMarksEntryOpen 
                ? 'text-amber-600' 
                : 'text-gray-400'
          }`}>
            {exam.isPublished || exam.status === 'published' 
              ? '✅ Published' 
              : exam.isMarksEntryOpen 
                ? '🔓 Marks Unlocked' 
                : '🔒 Marks Locked'}
          </span>
          <span className="text-xs font-bold text-[#A05C2B] opacity-0 group-hover:opacity-100 transition-opacity">
              {actionLabel} &rarr;
          </span>
      </div>
    </GlassCard>
  );
}
