import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, MoreVertical, Calendar, Banknote, Bus, User as UserIcon, 
  MapPin, Phone, Upload, GraduationCap, FileText, CheckCircle2,
  AlertCircle, ChevronLeft, Eye, Download
} from 'lucide-react';
import { User } from '../../types';
import { getStudentStats, formatRollNo } from '../../utils/studentUtils';
import { formatClassString } from '../../utils/classUtils';
import { useSchoolContext } from '../../context/SchoolContext';
import { useSuccess } from '../../context/SuccessContext';
import { PaymentMedium } from '../../hooks/useFees';
import { SchoolClass, Section } from '../../pages/classes/AdminClassManager';
import { AttendanceCalendar } from '../attendance/AttendanceCalendar';

interface StudentProfileWindowProps {
  student: User | null;
  onClose: () => void;
}

type TabType = 'Personal' | 'Guardians' | 'Academics' | 'Attendance' | 'Finance' | 'Documents';

export function StudentProfileWindow({ student, onClose }: StudentProfileWindowProps) {
  const { updateStudent, uploadDocument, changeSection, attendanceRecords, feeRecords, students, collectFee } = useSchoolContext();
  const { triggerSuccess, triggerError } = useSuccess();
  const currentStudent = useMemo(() => students.find(s => s.id === student?.id) || student, [students, student]);
  
  const [activeTab, setActiveTab] = useState<TabType>('Personal');
  const [showActionMenu, setShowActionMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Modals state
  const [activeModal, setActiveModal] = useState<'UpdateInfo' | 'ReviewDiff' | 'UploadDoc' | 'ChangeSection' | 'FeePayment' | 'Transport' | 'PreviewDoc' | null>(null);

  // New states for UX validation
  const [draftState, setDraftState] = useState<any>(null);
  const [diffs, setDiffs] = useState<Array<{field: string, old: string, new: string}>>([]);
  
  const [docNameType, setDocNameType] = useState<string>('Aadhar Card');
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);

  // Fetch available sections for the specific class
  const availableSections = useMemo(() => {
    try {
      const classes: SchoolClass[] = JSON.parse(localStorage.getItem('ajps_classes') || '[]');
      const targetClass = classes.find(c => c.className === currentStudent?.className);
      return targetClass?.sections || [];
    } catch {
      return [];
    }
  }, [currentStudent]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeModal === 'PreviewDoc') { setActiveModal(null); setPreviewDocUrl(null); }
        else if (activeModal) setActiveModal(null);
        else onClose();
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose, activeModal]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowActionMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentStudent) return null;

  const stats = getStudentStats(currentStudent.id);
  const studentFees = feeRecords.filter(f => f.studentId === currentStudent.id);

  // Extract student attendance from the global records which are stored by classId -> date -> records
  const studentAttendance: Record<string, string> = {};
  Object.keys(attendanceRecords).forEach((classKey) => {
    const dates = attendanceRecords[classKey as keyof typeof attendanceRecords] as any;
    Object.keys(dates).forEach((dateStr) => {
      const dateData = dates[dateStr];
      if (dateData?.records && dateData.records[currentStudent.id]) {
        studentAttendance[dateStr] = dateData.records[currentStudent.id];
      }
    });
  });

  // Real attendance calculation
  const totalLoggedDays = Object.keys(studentAttendance).length;
  const presentDays = Object.values(studentAttendance).filter(s => s === 'Present').length;
  const realAttendancePercent = totalLoggedDays > 0 ? Math.round((presentDays / totalLoggedDays) * 100) : 0;

  const tabs: TabType[] = ['Personal', 'Guardians', 'Academics', 'Attendance', 'Finance', 'Documents'];

  const handlePhoneInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Tab' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
      e.preventDefault();
    }
  };

  const prepareDiff = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    
    const draft = {
      personalDetails: {
        dob: fd.get('dob') as string,
        gender: fd.get('gender') as string,
        bloodGroup: fd.get('bloodGroup') as string,
        religion: fd.get('religion') as string,
        phone: fd.get('phone') as string,
        email: fd.get('email') as string,
        address: fd.get('address') as string,
      },
      guardianDetails: {
        guardianName: fd.get('guardianName') as string,
        guardianRelation: fd.get('guardianRelation') as string,
        guardianPhone: fd.get('guardianPhone') as string,
      }
    };

    const newDiffs: Array<{field: string, old: string, new: string}> = [];
    
    const checkDiff = (label: string, oldVal: string = '-', newVal: string = '') => {
      if (oldVal !== newVal && newVal.trim() !== '') {
        newDiffs.push({ field: label, old: oldVal, new: newVal });
      }
    };

    checkDiff('DOB', currentStudent.personalDetails?.dob, draft.personalDetails.dob);
    checkDiff('Gender', currentStudent.personalDetails?.gender, draft.personalDetails.gender);
    checkDiff('Blood Group', currentStudent.personalDetails?.bloodGroup, draft.personalDetails.bloodGroup);
    checkDiff('Religion', currentStudent.personalDetails?.religion, draft.personalDetails.religion);
    checkDiff('Phone', currentStudent.personalDetails?.phone, draft.personalDetails.phone);
    checkDiff('Email', currentStudent.personalDetails?.email, draft.personalDetails.email);
    checkDiff('Address', currentStudent.personalDetails?.address, draft.personalDetails.address);
    checkDiff('Guardian Name', currentStudent.guardianDetails?.guardianName, draft.guardianDetails.guardianName);
    checkDiff('Guardian Relation', currentStudent.guardianDetails?.guardianRelation, draft.guardianDetails.guardianRelation);
    checkDiff('Guardian Phone', currentStudent.guardianDetails?.guardianPhone, draft.guardianDetails.guardianPhone);

    setDraftState(draft);
    setDiffs(newDiffs);
    setActiveModal('ReviewDiff');
  };

  const confirmUpdates = () => {
    if (draftState) {
      updateStudent(currentStudent.id, draftState);
      triggerSuccess('Student information updated successfully. (Edit Alert Triggered)');
    }
    setActiveModal(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#FAF7F2] overflow-y-auto pb-24">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-[#8B5E2E] text-white p-4 flex items-center shadow-md justify-between">
        <button onClick={onClose} className="flex items-center gap-2 hover:bg-white/10 px-3 py-2 rounded-xl transition-colors font-semibold">
          <ChevronLeft className="w-5 h-5" /> Back
        </button>
        <span className="font-bold hidden sm:block">{currentStudent.name}'s Profile</span>
        <div className="w-20"></div> {/* Spacer for centering */}
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 mt-2">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col"
        >
          {/* Header Area */}
          <div className="relative bg-gradient-to-br from-[#A05C2B]/10 to-[#FDF7EE] p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start sm:items-center border-b border-[#A05C2B]/20">
            <img 
              src={currentStudent.avatarUrl} 
              alt={currentStudent.name} 
              className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl border-4 border-white shadow-lg object-cover bg-white shrink-0"
            />
            
            <div className="flex-1 w-full">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-3xl font-black text-[#1F2937] tracking-tight">{currentStudent.name}</h2>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="px-3 py-1 bg-white text-[#A05C2B] font-bold text-sm rounded-lg border border-[#A05C2B]/20 shadow-sm">
                      {formatClassString(currentStudent.className, currentStudent.sectionName || currentStudent.section, 'shorter')}
                    </span>
                    <span className="px-3 py-1 bg-white text-gray-700 font-bold text-sm rounded-lg border border-gray-200 shadow-sm">
                      Roll: {formatRollNo(currentStudent.rollNumber)}
                    </span>
                  </div>
                </div>

                {/* Action Menu */}
                <div className="relative" ref={menuRef}>
                  <button 
                    onClick={() => setShowActionMenu(!showActionMenu)}
                    className="p-2 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  
                  <AnimatePresence>
                    {showActionMenu && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-xl z-50 py-2 overflow-hidden"
                      >
                        <button onClick={() => { setActiveModal('UpdateInfo'); setShowActionMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                          <UserIcon className="w-4 h-4" /> Update Information
                        </button>
                        <button onClick={() => { setActiveModal('UploadDoc'); setShowActionMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                          <Upload className="w-4 h-4" /> Upload Document
                        </button>
                        <button onClick={() => { setActiveModal('ChangeSection'); setShowActionMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                          <UserIcon className="w-4 h-4" /> Change Section
                        </button>
                        <button onClick={() => { setActiveModal('FeePayment'); setShowActionMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                          <Banknote className="w-4 h-4" /> Fee Structure & Payments
                        </button>
                        <button onClick={() => { setActiveModal('Transport'); setShowActionMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                          <Bus className="w-4 h-4" /> Transport Details
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex overflow-x-auto border-b border-gray-100 hide-scrollbar bg-gray-50/50">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 font-bold text-sm whitespace-nowrap transition-colors relative ${
                  activeTab === tab ? 'text-[#A05C2B]' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div 
                    layoutId="activeProfileTab" 
                    className="absolute bottom-0 left-0 right-0 h-1 bg-[#A05C2B] rounded-t-full" 
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6 bg-[#FDFBF7]">
            {activeTab === 'Personal' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoCard icon={<UserIcon />} title="Basic Details">
                  <DetailRow label="Date of Birth" value={currentStudent.personalDetails?.dob || '-'} />
                  <DetailRow label="Gender" value={currentStudent.personalDetails?.gender || '-'} />
                  <DetailRow label="Blood Group" value={currentStudent.personalDetails?.bloodGroup || '-'} />
                  <DetailRow label="Religion" value={currentStudent.personalDetails?.religion || '-'} />
                </InfoCard>
                <InfoCard icon={<MapPin />} title="Contact & Address">
                  <DetailRow label="Phone" value={currentStudent.personalDetails?.phone ? `+91 ${currentStudent.personalDetails.phone}` : '-'} />
                  <DetailRow label="Email" value={currentStudent.personalDetails?.email || '-'} />
                  <DetailRow label="Address" value={currentStudent.personalDetails?.address || '-'} />
                </InfoCard>
              </div>
            )}

            {activeTab === 'Guardians' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoCard icon={<UserIcon />} title="Guardian Details">
                  <DetailRow label="Name" value={currentStudent.guardianDetails?.guardianName || '-'} />
                  <DetailRow label="Relation" value={currentStudent.guardianDetails?.guardianRelation || '-'} />
                  <DetailRow label="Phone" value={currentStudent.guardianDetails?.guardianPhone ? `+91 ${currentStudent.guardianDetails.guardianPhone}` : '-'} />
                </InfoCard>
              </div>
            )}

            {activeTab === 'Academics' && (() => {
              const results = JSON.parse(localStorage.getItem('ajps_exam_results') || '[]');
              const studentExams = results.filter((exam: any) => exam.status === 'Published' && exam.marks && exam.marks[currentStudent.id]);

              return (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-gray-500 uppercase">Recent Performance</h3>
                        <p className="text-3xl font-black text-[#A05C2B] mt-1">{stats.recentGrade} <span className="text-lg text-gray-400">({stats.recentExamPercent}%)</span></p>
                      </div>
                      <div className="w-16 h-16 bg-[#FDF7EE] rounded-full flex items-center justify-center">
                        <GraduationCap className="w-8 h-8 text-[#A05C2B]" />
                      </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-6">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                      <h3 className="font-bold text-gray-800">Exam History</h3>
                    </div>
                    {studentExams.length === 0 ? (
                      <div className="p-8 text-center text-gray-500 font-medium">No published exam records found.</div>
                    ) : (
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-gray-100 text-xs uppercase text-gray-500">
                            <th className="p-4">Exam Name</th>
                            <th className="p-4">Subject</th>
                            <th className="p-4 text-right">Score</th>
                          </tr>
                        </thead>
                          <tbody className="divide-y divide-gray-100">
                            {studentExams.map((exam: any, idx: number) => {
                              const marks = exam.marks[currentStudent.id];
                              return Object.entries(marks).map(([subject, data]: [string, any]) => (
                                <tr key={`${idx}-${subject}`} className="hover:bg-gray-50">
                                  <td className="p-4 font-medium text-gray-800">{exam.examName}</td>
                                  <td className="p-4 text-gray-600 font-medium">{subject}</td>
                                  <td className="p-4 text-right font-bold text-[#A05C2B]">
                                    {data.score} / {data.total}
                                  </td>
                                </tr>
                              ));
                            })}
                          </tbody>
                      </table>
                    )}
                  </div>
                </div>
              );
            })()}

            {activeTab === 'Attendance' && (
              <div className="space-y-6">
                <div className="flex flex-col items-center py-6">
                  <div className="relative w-48 h-48">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="#f3f4f6" strokeWidth="10" />
                      <circle 
                        cx="50" cy="50" r="45" 
                        fill="none" 
                        stroke={realAttendancePercent >= 75 ? "#10b981" : "#ef4444"} 
                        strokeWidth="10" 
                        strokeDasharray={`${realAttendancePercent * 2.83} 283`}
                        strokeLinecap="round" 
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-black text-gray-800">{realAttendancePercent}%</span>
                      <span className="text-xs font-bold text-gray-500 uppercase mt-1">Attendance</span>
                    </div>
                  </div>
                  <p className="mt-4 font-semibold text-gray-600">Present: {presentDays} / {totalLoggedDays} Logged Days</p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-6">
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800">Attendance Calendar</h3>
                  </div>
                  <div className="p-4">
                    <AttendanceCalendar attendanceRecords={Object.entries(studentAttendance).map(([date, status]) => ({ date, status: status as string }))} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Finance' && (
              <div className="space-y-6">
                <div className={`p-6 rounded-2xl border flex items-center justify-between ${stats.isFeeDue ? 'bg-red-50/50 border-red-100' : 'bg-emerald-50/50 border-emerald-100'}`}>
                  <div>
                    <h3 className="text-sm font-bold text-gray-500 uppercase">Current Status</h3>
                    <p className={`text-2xl font-black mt-1 ${stats.isFeeDue ? 'text-red-700' : 'text-emerald-700'}`}>
                      {stats.feeStatus}
                    </p>
                  </div>
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center ${stats.isFeeDue ? 'bg-red-100' : 'bg-emerald-100'}`}>
                    {stats.isFeeDue ? <AlertCircle className={`w-7 h-7 text-red-600`} /> : <CheckCircle2 className={`w-7 h-7 text-emerald-600`} />}
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">Payment History</h3>
                    <div className="text-sm font-bold text-gray-600">Total Paid: ₹{studentFees.reduce((a,b) => a+b.amount, 0)}</div>
                  </div>
                  {studentFees.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 font-medium">No payment records found.</div>
                  ) : (
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-gray-100 text-xs uppercase text-gray-500">
                          <th className="p-4">Date</th>
                          <th className="p-4">Receipt No.</th>
                          <th className="p-4">Mode</th>
                          <th className="p-4 text-right">Amount</th>
                        </tr>
                      </thead>
                        <tbody className="divide-y divide-gray-100">
                          {studentFees.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((fee) => (
                            <tr key={fee.id} className="hover:bg-gray-50">
                              <td className="p-4 font-medium text-gray-800">{fee.date}</td>
                              <td className="p-4 text-gray-600 font-mono text-sm">{fee.receiptNo}</td>
                              <td className="p-4 text-gray-600">{fee.medium}</td>
                              <td className="p-4 text-right font-bold text-[#A05C2B]">₹{fee.amount}</td>
                            </tr>
                          ))}
                        </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'Documents' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-gray-800">Uploaded Documents</h3>
                  <button 
                    onClick={() => setActiveModal('UploadDoc')}
                    className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" /> Upload New
                  </button>
                </div>
                
                {!currentStudent.documents || currentStudent.documents.length === 0 ? (
                  <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No documents uploaded yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {currentStudent.documents.map((doc, idx) => (
                      <div key={idx} className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm flex flex-col justify-between hover:border-[#A05C2B]/30 transition-colors group">
                        <div className="flex items-start gap-3 mb-4">
                          <div className="p-3 bg-[#FDF7EE] rounded-lg text-[#A05C2B]">
                            <FileText className="w-6 h-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-800 truncate text-sm" title={doc.name}>{doc.name}</p>
                            <p className="text-xs text-gray-400 mt-1">{doc.date}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => { setPreviewDocUrl(doc.url); setActiveModal('PreviewDoc'); }}
                            className="flex-1 py-1.5 flex justify-center items-center gap-2 bg-gray-50 hover:bg-gray-100 text-sm font-semibold text-gray-700 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" /> View
                          </button>
                          <a 
                            href={doc.url} 
                            download={doc.name}
                            className="flex-1 py-1.5 flex justify-center items-center gap-2 bg-gray-50 hover:bg-gray-100 text-sm font-semibold text-gray-700 rounded-lg transition-colors"
                          >
                            <Download className="w-4 h-4" /> Save
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Action Modals */}
      <AnimatePresence>
        {activeModal === 'UpdateInfo' && (
          <ModalWrapper title="Update Information" onClose={() => setActiveModal(null)} maxWidth="max-w-2xl">
            <form onSubmit={prepareDiff} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Date of Birth</label>
                  <input name="dob" type="date" defaultValue={currentStudent.personalDetails?.dob} className="border p-2 rounded-lg w-full" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Gender</label>
                  <select name="gender" defaultValue={currentStudent.personalDetails?.gender || ''} className="border p-2 rounded-lg w-full" required>
                    <option value="" disabled>Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Blood Group</label>
                  <input name="bloodGroup" defaultValue={currentStudent.personalDetails?.bloodGroup} placeholder="e.g. O+" className="border p-2 rounded-lg w-full" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Religion</label>
                  <input name="religion" defaultValue={currentStudent.personalDetails?.religion} placeholder="Religion" className="border p-2 rounded-lg w-full" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-lg font-bold">+91</span>
                    <input name="phone" maxLength={10} minLength={10} onKeyDown={handlePhoneInput} defaultValue={currentStudent.personalDetails?.phone} placeholder="10-digit number" className="border p-2 rounded-none rounded-r-lg w-full" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                  <input name="email" type="email" defaultValue={currentStudent.personalDetails?.email} placeholder="Email address" className="border p-2 rounded-lg w-full" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
                <input name="address" defaultValue={currentStudent.personalDetails?.address} placeholder="Full Address" className="border p-2 rounded-lg w-full" required />
              </div>
              
              <h3 className="font-bold text-gray-800 pt-4 border-t mt-6">Guardian Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Guardian Name</label>
                  <input name="guardianName" defaultValue={currentStudent.guardianDetails?.guardianName} placeholder="Name" className="border p-2 rounded-lg w-full" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Relation</label>
                  <select name="guardianRelation" defaultValue={currentStudent.guardianDetails?.guardianRelation || ''} className="border p-2 rounded-lg w-full" required>
                    <option value="" disabled>Select Relation</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Grandparent">Grandparent</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Guardian Phone Number</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-lg font-bold">+91</span>
                    <input name="guardianPhone" maxLength={10} minLength={10} onKeyDown={handlePhoneInput} defaultValue={currentStudent.guardianDetails?.guardianPhone} placeholder="10-digit number" className="border p-2 rounded-none rounded-r-lg w-full" required />
                  </div>
                </div>
              </div>
              <button type="submit" className="w-full bg-[#A05C2B] text-white p-3 rounded-lg font-bold mt-6">Save Updates</button>
            </form>
          </ModalWrapper>
        )}

        {activeModal === 'ReviewDiff' && (
          <ModalWrapper title="Review Changes" onClose={() => setActiveModal('UpdateInfo')} maxWidth="max-w-md">
            {diffs.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <p className="font-bold text-gray-800">No changes detected.</p>
                <button onClick={() => setActiveModal('UpdateInfo')} className="mt-4 text-[#A05C2B] font-bold">Back to Form</button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-500 mb-4">Please verify the following changes before saving:</p>
                <div className="max-h-64 overflow-y-auto space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                  {diffs.map((diff, i) => (
                    <div key={i} className="text-sm">
                      <p className="font-bold text-gray-700">{diff.field}</p>
                      <p className="text-red-500 line-through text-xs font-mono">{diff.old}</p>
                      <p className="text-emerald-600 font-bold text-xs font-mono">{diff.new}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 pt-4 border-t">
                  <button onClick={() => setActiveModal('UpdateInfo')} className="flex-1 py-2.5 font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                  <button onClick={confirmUpdates} className="flex-1 py-2.5 font-bold text-white bg-[#A05C2B] rounded-lg shadow-md hover:bg-[#8B5E2E]">Confirm & Save</button>
                </div>
              </div>
            )}
          </ModalWrapper>
        )}

        {activeModal === 'UploadDoc' && (
          <ModalWrapper title="Upload Document" onClose={() => setActiveModal(null)}>
            <form onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const file = fd.get('file') as File;
              
              if (file.size === 0) return;
              
              const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
              if (!validTypes.includes(file.type)) {
                triggerError("Invalid file type. Only JPG, PNG, and PDF are allowed.");
                return;
              }

              const docName = docNameType === 'Other' ? (fd.get('customDocName') as string) : docNameType;
              if (!docName) return;

              // Mock real file to URL conversion
              const mockUrl = URL.createObjectURL(file);
              uploadDocument(currentStudent.id, docName, mockUrl);
              setActiveModal(null);
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Document Type</label>
                <select 
                  value={docNameType} 
                  onChange={(e) => setDocNameType(e.target.value)}
                  className="w-full border p-3 rounded-lg" 
                  required
                >
                  <option value="Aadhar Card">Aadhar Card</option>
                  <option value="Birth Certificate">Birth Certificate</option>
                  <option value="APAAR ID">APAAR ID</option>
                  <option value="Samagra ID">Samagra ID</option>
                  <option value="Family ID">Family ID</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              {docNameType === 'Other' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Specify Document Name</label>
                  <input name="customDocName" type="text" placeholder="e.g. Medical Certificate" className="w-full border p-3 rounded-lg" required />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">File (JPG, PNG, PDF)</label>
                <input name="file" type="file" accept=".jpg, .jpeg, .png, .pdf" className="w-full border p-3 rounded-lg bg-gray-50" required />
              </div>
              <button type="submit" className="w-full bg-[#A05C2B] text-white p-3 rounded-lg font-bold mt-2">Upload</button>
            </form>
          </ModalWrapper>
        )}

        {activeModal === 'PreviewDoc' && previewDocUrl && (
          <div className="fixed inset-0 z-[9999] w-screen h-screen bg-black/90 flex flex-col items-center justify-center p-4 overflow-hidden">
            <button onClick={() => { setActiveModal(null); setPreviewDocUrl(null); }} className="fixed top-4 right-4 z-[10000] p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-sm">
              <X className="w-6 h-6" />
            </button>
            <div className="w-full h-full flex flex-col items-center justify-center">
               {previewDocUrl.startsWith('blob:') || previewDocUrl.endsWith('.pdf') ? (
                  <iframe src={previewDocUrl} className="w-full h-[90vh] bg-white rounded-lg shadow-2xl" title="Document Preview" />
               ) : (
                  <img src={previewDocUrl} alt="Document" className="max-w-[95vw] max-h-[90vh] object-contain rounded-lg shadow-2xl" />
               )}
            </div>
            <div className="absolute bottom-6 flex justify-center z-[10000]">
               <a href={previewDocUrl} download="Document" className="px-8 py-3 bg-[#A05C2B] hover:bg-[#8B5E2E] text-white font-bold rounded-xl shadow-lg flex items-center gap-2 transition-all">
                 <Download className="w-5 h-5" /> Download File
               </a>
            </div>
          </div>
        )}

        {activeModal === 'ChangeSection' && (
          <ModalWrapper title="Change Section" onClose={() => setActiveModal(null)}>
            <form onSubmit={(e) => {
              e.preventDefault();
              const selectEl = e.currentTarget.elements.namedItem('section') as HTMLSelectElement;
              const newSectionId = selectEl.value;
              const newSectionName = selectEl.options[selectEl.selectedIndex].text;
              changeSection(currentStudent.id, newSectionId, newSectionName);
              setActiveModal(null);
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Current Class: {currentStudent.className}-{currentStudent.sectionName || currentStudent.section}</label>
                <select name="section" className="w-full border p-3 rounded-lg" required>
                  <option value="">Select New Section</option>
                  {availableSections.length > 0 ? availableSections.filter((s: Section) => s.name !== currentStudent.section).map((s: Section) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  )) : (
                    <option value="" disabled>No other sections available</option>
                  )}
                </select>
              </div>
              <button type="submit" className="w-full bg-[#A05C2B] text-white p-3 rounded-lg font-bold">Change Section</button>
            </form>
          </ModalWrapper>
        )}

        {activeModal === 'FeePayment' && (
          <ModalWrapper title="Log Fee Payment" onClose={() => setActiveModal(null)}>
            <form onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              collectFee(
                currentStudent.id, 
                parseFloat(fd.get('amount') as string), 
                fd.get('medium') as PaymentMedium, 
                fd.get('date') as string
              );
              setActiveModal(null);
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Amount (₹)</label>
                <input name="amount" type="number" placeholder="Enter Amount" className="w-full border p-3 rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Payment Date</label>
                <input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full border p-3 rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Payment Medium</label>
                <select name="medium" className="w-full border p-3 rounded-lg" required>
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Net Banking">Net Banking</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-[#A05C2B] text-white p-3 rounded-lg font-bold mt-2">Log Payment</button>
            </form>
          </ModalWrapper>
        )}

        {activeModal === 'Transport' && (
          <ModalWrapper title="Transport Details" onClose={() => setActiveModal(null)}>
            <form onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              updateStudent(currentStudent.id, { transportMode: fd.get('mode') as string });
              setActiveModal(null);
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Transport Mode</label>
                <select name="mode" defaultValue={currentStudent.transportMode || 'Self'} className="w-full border p-3 rounded-lg" required>
                  <option value="Self">Self / Pedestrian</option>
                  <option value="Bus">School Bus</option>
                  <option value="Van">Private Van</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-[#A05C2B] text-white p-3 rounded-lg font-bold mt-2">Save</button>
            </form>
          </ModalWrapper>
        )}
      </AnimatePresence>
    </div>
  );
}

function ModalWrapper({ title, children, onClose, maxWidth = 'max-w-md' }: { title: string, children: React.ReactNode, onClose: () => void, maxWidth?: string }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className={`w-full ${maxWidth} bg-white rounded-2xl shadow-xl overflow-hidden max-h-[95vh] flex flex-col`}>
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50 shrink-0">
          <h3 className="font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </motion.div>
    </div>
  );
}

function InfoCard({ title, icon, children, className = '' }: { title: string, icon: React.ReactNode, children: React.ReactNode, className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-5 pb-3 border-b border-gray-100">
        <div className="p-2 bg-gray-50 rounded-lg text-gray-500">{icon}</div>
        <h3 className="font-bold text-gray-800 uppercase tracking-wide text-sm">{title}</h3>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="font-semibold text-gray-800">{value}</p>
    </div>
  );
}
