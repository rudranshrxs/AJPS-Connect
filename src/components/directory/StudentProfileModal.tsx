import React, { useState } from 'react';
import { X, Calendar, FileText, Download, User as UserIcon, Banknote, Bus, Car } from 'lucide-react';
import { User } from '../../types';
import { useSuccess } from '../../context/SuccessContext';

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: User | null;
}

export function StudentProfileModal({ isOpen, onClose, student }: StudentProfileModalProps) {
  const { triggerSuccess } = useSuccess();
  const [showHistory, setShowHistory] = useState<'attendance' | 'fees' | 'transport' | null>(null);

  if (!isOpen || !student) return null;

  const handleGenerateReport = () => {
    triggerSuccess('Progress Report Generated!');
  };

  const getTransportIcon = (mode?: string) => {
    if (mode === 'School Bus') return <Bus className="w-5 h-5 text-blue-600" />;
    if (mode === 'Private Van') return <Car className="w-5 h-5 text-purple-600" />;
    return <UserIcon className="w-5 h-5 text-emerald-600" />; // Self/Walking
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1F2937]/30 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white/90 backdrop-blur-xl border border-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gradient-to-r from-white to-[#FDF7EE]">
          <div className="flex items-center gap-6">
            <img src={student.avatarUrl} alt={student.name} className="w-24 h-24 rounded-2xl border-4 border-white shadow-lg object-cover" />
            <div>
              <h2 className="text-3xl font-black text-[#1F2937] tracking-tight">{student.name}</h2>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-bold rounded-lg border border-gray-200">Roll No: {student.rollNumber}</span>
                <span className="px-3 py-1 bg-[#A05C2B]/10 text-[#A05C2B] text-sm font-black rounded-lg border border-[#A05C2B]/20">{student.className} - Section {student.sectionName || student.section}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-100/80 text-gray-500 rounded-full hover:bg-gray-200 transition-colors shadow-sm">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto space-y-8 bg-[#FDFBF7]">
          {/* Action Bar */}
          <div className="flex gap-4">
            <button 
              onClick={handleGenerateReport}
              className="flex-1 bg-[#A05C2B] text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#8B4E24] transition-all shadow-md active:scale-[0.98]"
            >
              <Download className="w-5 h-5" /> Generate Progress Report
            </button>
            <button className="flex-1 bg-white border border-[#A05C2B]/30 text-[#A05C2B] py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#FDF7EE] transition-colors shadow-sm">
              <FileText className="w-5 h-5" /> Edit Student Data
            </button>
          </div>

          {/* Overview Tiles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div 
              onClick={() => setShowHistory('attendance')}
              className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-sm flex items-center gap-4 ${showHistory === 'attendance' ? 'bg-[#FDF7EE] border-[#A05C2B]/30 shadow-md ring-1 ring-[#A05C2B]/20' : 'bg-white hover:bg-white/80 border-gray-100 hover:border-[#A05C2B]/20'}`}
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase">Overall Attendance</p>
                <p className="text-2xl font-black text-[#1F2937]">92%</p>
              </div>
            </div>

            <div 
              onClick={() => setShowHistory('fees')}
              className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-sm flex items-center gap-4 ${showHistory === 'fees' ? 'bg-[#FDF7EE] border-[#A05C2B]/30 shadow-md ring-1 ring-[#A05C2B]/20' : 'bg-white hover:bg-white/80 border-gray-100 hover:border-[#A05C2B]/20'}`}
            >
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <Banknote className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase">Current Fee Status</p>
                <p className="text-2xl font-black text-emerald-600">Paid</p>
              </div>
            </div>

            <div 
              onClick={() => setShowHistory('transport')}
              className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-sm flex items-center gap-4 ${showHistory === 'transport' ? 'bg-[#FDF7EE] border-[#A05C2B]/30 shadow-md ring-1 ring-[#A05C2B]/20' : 'bg-white hover:bg-white/80 border-gray-100 hover:border-[#A05C2B]/20'}`}
            >
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                {getTransportIcon(student.transportMode)}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase">Transport Mode</p>
                <p className="text-xl font-black text-[#1F2937] truncate">{student.transportMode || 'Self/Walking'}</p>
              </div>
            </div>
          </div>

          {/* History View (Bottom Half) */}
          {showHistory && (
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm animate-in slide-in-from-bottom-4 duration-300">
              <h3 className="text-lg font-black text-[#1F2937] mb-4 flex items-center gap-2">
                {showHistory === 'attendance' && <><Calendar className="w-5 h-5 text-[#A05C2B]" /> Attendance History</>}
                {showHistory === 'fees' && <><Banknote className="w-5 h-5 text-[#A05C2B]" /> Fee Receipts</>}
                {showHistory === 'transport' && <><Bus className="w-5 h-5 text-[#A05C2B]" /> Transport Details</>}
              </h3>
              
              {showHistory === 'attendance' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <span className="font-bold text-gray-700">August 2026</span>
                    <span className="text-emerald-600 font-black">22/24 Days Present</span>
                  </div>
                  <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <span className="font-bold text-gray-700">July 2026</span>
                    <span className="text-emerald-600 font-black">25/25 Days Present</span>
                  </div>
                </div>
              )}

              {showHistory === 'fees' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div>
                      <p className="font-bold text-gray-800">Term 1 Tuition Fee</p>
                      <p className="text-xs text-gray-500">Paid on 12 Apr 2026</p>
                    </div>
                    <span className="text-emerald-600 font-black">₹ 15,000</span>
                  </div>
                  <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div>
                      <p className="font-bold text-gray-800">Transport Fee (Q1)</p>
                      <p className="text-xs text-gray-500">Paid on 15 Apr 2026</p>
                    </div>
                    <span className="text-emerald-600 font-black">₹ 4,500</span>
                  </div>
                </div>
              )}

              {showHistory === 'transport' && (
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase">Route</p>
                        <p className="font-black text-gray-800">Route 4 - City Center</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase">Pickup Time</p>
                        <p className="font-black text-gray-800">07:15 AM</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase">Driver</p>
                        <p className="font-black text-gray-800">Ramesh Kumar</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase">Vehicle No.</p>
                        <p className="font-black text-gray-800">UP14 AB 1234</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
