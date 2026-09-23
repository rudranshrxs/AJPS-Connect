import React, { useEffect, useRef } from 'react';
import { X, Calendar, Banknote, Bus, Car, User as UserIcon } from 'lucide-react';
import { User } from '../../types';

interface StudentDrawerProps {
  student: User | null;
  onClose: () => void;
}

export function StudentDrawer({ student, onClose }: StudentDrawerProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const getTransportIcon = (mode?: string) => {
    if (mode === 'School Bus') return <Bus className="w-5 h-5 text-blue-600" />;
    if (mode === 'Private Van') return <Car className="w-5 h-5 text-purple-600" />;
    return <UserIcon className="w-5 h-5 text-emerald-600" />;
  };

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        onClick={handleOverlayClick}
        className={`fixed inset-0 z-50 bg-black/20 backdrop-blur-[2px] transition-opacity duration-300 ${
          student ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 z-50 flex flex-col ${
          student ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {student && (
          <>
            {/* Header */}
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-white to-[#FDF7EE]">
              <div className="flex justify-between items-start mb-4">
                <button
                  onClick={onClose}
                  className="p-2 bg-gray-100/80 text-gray-500 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center gap-5">
                <img
                  src={student.avatarUrl}
                  alt={student.name}
                  className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg object-cover"
                />
                <div>
                  <h2 className="text-2xl font-black text-[#1F2937] tracking-tight">{student.name}</h2>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg border border-gray-200">
                      Roll No: {student.rollNumber}
                    </span>
                    <span className="px-3 py-1 bg-[#A05C2B]/10 text-[#A05C2B] text-xs font-black rounded-lg border border-[#A05C2B]/20">
                      {student.className} - {student.sectionName || student.section}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#FDFBF7]">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase">Attendance</p>
                    <p className="text-lg font-black text-gray-800">92%</p>
                  </div>
                </div>
                <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <Banknote className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase">Fee Status</p>
                    <p className="text-lg font-black text-emerald-700">Paid</p>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
                <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">Student Details</h3>
                <div className="space-y-3">
                  <DetailRow label="Full Name" value={student.name} />
                  <DetailRow label="Roll Number" value={student.rollNumber || 'N/A'} />
                  <DetailRow label="Class" value={student.className || 'N/A'} />
                  <DetailRow label="Section" value={student.sectionName || student.section || 'N/A'} />
                </div>
              </div>

              {/* Transport Info */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
                <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">Transport</h3>
                <div className="flex items-center gap-3">
                  {getTransportIcon(student.transportMode)}
                  <span className="font-bold text-gray-800">{student.transportMode || 'Self/Walking'}</span>
                </div>
              </div>

              {/* Parent Info (placeholder fields) */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
                <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">Parent Info</h3>
                <div className="space-y-3">
                  <DetailRow label="Father's Name" value="—" />
                  <DetailRow label="Mother's Name" value="—" />
                  <DetailRow label="Contact No." value="—" />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-500 font-medium">{label}</span>
      <span className="font-bold text-gray-800">{value}</span>
    </div>
  );
}
