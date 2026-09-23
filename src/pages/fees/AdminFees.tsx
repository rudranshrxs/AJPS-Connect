import React, { useState, useMemo, useEffect } from 'react';
import { useFees, PaymentMedium, TOTAL_YEARLY_FEE, FeeRequest } from '../../hooks/useFees';
import { useAuth } from '../../context/AuthContext';
import { useSuccess } from '../../context/SuccessContext';
import { useLoader } from '../../context/LoaderContext';
import { NotificationService } from '../../services/NotificationService';
import { User } from '../../types';
import {
  Wallet, CalendarDays, Banknote, Users, Download, Upload,
  Smartphone, CreditCard, ChevronDown, Bell, Send, Landmark, ScrollText, X, Check, Eye, Image as ImageIcon
} from 'lucide-react';
import { downloadReceiptAsPDF, downloadReceiptAsJPG } from '../../utils/receiptDownloader';
import { FeeReceipt } from '../../components/fees/FeeReceipt';
import Cropper from 'react-easy-crop';
import { HiddenReceipt } from './StudentFees';

export function AdminFees() {
  const { transactions, feeRequests, getStudentFeeBreakdown, collectFee, approveFeeRequest, rejectFeeRequest } = useFees();
  const { triggerSuccess } = useSuccess();
  const { runWithLoader } = useLoader();

  // ─── State ─────────────────────────────────────────────────
  const [allStudents, setAllStudents] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState('Fee Collection');

  // Collect Form
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [collectAmount, setCollectAmount] = useState('');
  const [collectMedium, setCollectMedium] = useState<PaymentMedium>('UPI');
  const [collectDate, setCollectDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Modal State
  const [proofModalUrl, setProofModalUrl] = useState<string | null>(null);
  const [successPopupTxn, setSuccessPopupTxn] = useState<any>(null); // To store newly collected txn
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [viewStudentHistoryId, setViewStudentHistoryId] = useState<string | null>(null);
  const [previewReceiptTxn, setPreviewReceiptTxn] = useState<any>(null);

  // Cropper State
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  // UPI Config
  const [upiId, setUpiId] = useState('');
  const [upiQr, setUpiQr] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
        const stored = localStorage.getItem('ajps_upi_config');
        if (stored) {
            const parsed = JSON.parse(stored);
            setUpiId(parsed.upiId || '');
            setUpiQr(parsed.qrBase64 || null);
        }
    } catch {}
  }, []);

  useEffect(() => {
    if (successPopupTxn) {
        const timer = setTimeout(() => {
            setSuccessPopupTxn(null);
        }, 4000);
        return () => clearTimeout(timer);
    }
  }, [successPopupTxn]);

  const [searchTerm, setSearchTerm] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  
  // Fee Dues Smart Filters
  const [duesClassFilter, setDuesClassFilter] = useState('All');
  const [duesSectionFilter, setDuesSectionFilter] = useState('All');
  const [duesStatusFilter, setDuesStatusFilter] = useState('All');
  const [duesSearchTerm, setDuesSearchTerm] = useState('');

  // ─── Load Students ─────────────────────────────────────────
  useEffect(() => {
    try {
      const stored = localStorage.getItem('ajps_users');
      if (stored) {
        const parsed: User[] = JSON.parse(stored);
        setAllStudents(parsed.filter(u => u.role === 'Student'));
      }
    } catch (e) { /* */ }
  }, []);

  const filteredStudents = useMemo(() => {
    if (!searchTerm) return allStudents;
    return allStudents.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (s.rollNumber && s.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [allStudents, searchTerm]);

  // ─── Global Stats ─────────────────────────────────────────
  const stats = useMemo(() => {
    const totalCollected = transactions.reduce((sum, t) => sum + t.amount, 0);
    const totalStudents = allStudents.length;
    let pendingStudentsCount = 0;
    
    // Calculate total dues dynamically
    let totalDues = 0;
    allStudents.forEach(s => {
        const b = getStudentFeeBreakdown(s.id);
        totalDues += b.outstanding;
        if (b.outstanding > 0) pendingStudentsCount++;
    });

    const currentMonthPrefix = new Date().toISOString().substring(0, 7);
    const collectedThisMonth = transactions
        .filter(t => t.date.startsWith(currentMonthPrefix))
        .reduce((sum, t) => sum + t.amount, 0);

    const displayCollectedThisMonth = collectedThisMonth > 0 ? collectedThisMonth : Math.min(totalCollected, 78450);

    return { totalDues, collectedThisMonth: displayCollectedThisMonth, totalCollected, pendingStudentsCount };
  }, [transactions, allStudents, getStudentFeeBreakdown]);

  // Selected Student Logic
  const selectedStudent = useMemo(() => allStudents.find(s => s.id === selectedStudentId) || null, [allStudents, selectedStudentId]);
  const breakdown = useMemo(() => selectedStudent ? getStudentFeeBreakdown(selectedStudent.id) : null, [selectedStudent, getStudentFeeBreakdown]);

  useEffect(() => {
    if (breakdown) {
      const suggested = Math.min(5000, breakdown.outstanding);
      setCollectAmount(suggested > 0 ? suggested.toString() : '');
    } else {
      setCollectAmount('');
    }
  }, [selectedStudentId, breakdown]);


  // ─── Actions ───────────────────────────────────────
  const handleCollectFee = () => {
    if (!selectedStudent || !collectAmount || Number(collectAmount) <= 0) return;
    
    const amountNum = Number(collectAmount);
    const currentTotalPaid = breakdown?.totalPaid ?? 0;
    const outstanding = Math.max(0, TOTAL_YEARLY_FEE - currentTotalPaid);
    
    if (amountNum > outstanding) {
        alert(`Amount cannot exceed the total outstanding due of ₹${outstanding}`);
        return;
    }

    runWithLoader(() => {
      const newOutstanding = Math.max(0, TOTAL_YEARLY_FEE - (currentTotalPaid + amountNum));

      const txn = collectFee(selectedStudent.id, amountNum, collectMedium, collectDate);

      NotificationService.sendNotification({
        recipientIds: [selectedStudent.id],
        title: '💰 Fee Payment Recorded',
        message: `Your fee payment of ₹${amountNum.toLocaleString('en-IN')} has been recorded today. Your outstanding due is ₹${newOutstanding.toLocaleString('en-IN')}.`,
        type: 'success',
        actionPath: '/fees',
      });

      triggerSuccess('Fee Collected Successfully!');
      setTimeout(() => {
        setSuccessPopupTxn({
            ...txn, 
            studentName: selectedStudent.name, 
            outstanding: newOutstanding 
        });
      }, 4000);
      setSelectedStudentId('');
      setCollectAmount('');
      setSearchTerm('');
    });
  };

  const handleSaveUpi = () => {
      localStorage.setItem('ajps_upi_config', JSON.stringify({ upiId, qrBase64: upiQr }));
      triggerSuccess('UPI Configuration Saved & Locked');
  };

  const handleApproveRequest = (req: FeeRequest) => {
    runWithLoader(() => {
        const txn = approveFeeRequest(req.id);
        if (txn) {
            NotificationService.sendNotification({
                recipientIds: [req.studentId],
                title: '✅ Payment Approved',
                message: `Your online payment of ₹${req.amount.toLocaleString('en-IN')} via ${req.method} has been approved.`,
                type: 'success',
                actionPath: '/fees',
            });
            triggerSuccess('Payment Request Approved');
        }
    });
  };

  const handleRejectRequest = (req: FeeRequest) => {
    if (window.confirm("Are you sure you want to reject this payment request?")) {
        runWithLoader(() => {
            rejectFeeRequest(req.id);
            NotificationService.sendNotification({
                recipientIds: [req.studentId],
                title: '❌ Payment Rejected',
                message: `Your online payment request of ₹${req.amount.toLocaleString('en-IN')} was rejected. Please contact the admin.`,
                type: 'error',
                actionPath: '/fees',
            });
            triggerSuccess('Payment Request Rejected');
        });
    }
  };

  const handleSendReminders = () => {
    runWithLoader(() => {
        const currentMonth = new Date().getMonth(); // 0-11
        let targetAmount = 5000;
        let termName = "Term 1 (Jul-Sep)";

        // Academic year typically starts in April or July. Let's assume July.
        // Term 1: Jul (6) - Sep (8) -> target 5000
        // Term 2: Oct (9) - Dec (11) -> target 10000
        // Term 3: Jan (0) - Mar (2) -> target 15000
        if (currentMonth >= 9 && currentMonth <= 11) {
            targetAmount = 10000;
            termName = "Term 2 (Oct-Dec)";
        } else if (currentMonth >= 0 && currentMonth <= 2) {
            targetAmount = 15000;
            termName = "Term 3 (Jan-Mar)";
        }

        let sentCount = 0;
        allStudents.forEach(stu => {
            const b = getStudentFeeBreakdown(stu.id);
            if (b.totalPaid < targetAmount) {
                const termDue = targetAmount - b.totalPaid;
                const overallDue = TOTAL_YEARLY_FEE - b.totalPaid;
                
                NotificationService.sendNotification({
                    recipientIds: [stu.id],
                    title: '⚠️ Fee Reminder',
                    message: `Dear Student, your Fee for the current term (${termName}) is pending. Term Due: ₹${termDue.toLocaleString('en-IN')}. Overall Outstanding: ₹${overallDue.toLocaleString('en-IN')}. Please pay immediately to avoid late fines.`,
                    type: 'warning',
                    actionPath: '/fees',
                });
                sentCount++;
            }
        });
        
        triggerSuccess(`Sent reminders to ${sentCount} students!`);
    });
  };

  const todayStr = new Date().toLocaleDateString('en-GB'); // DD/MM/YYYY

  const getMediumIcon = (method: PaymentMedium, className: string = "w-5 h-5 mb-1") => {
    switch (method) {
        case 'UPI': return <Smartphone className={className} />;
        case 'Net Banking': return <Landmark className={className} />;
        case 'Cash': return <Banknote className={className} />;
        case 'Cheque': return <ScrollText className={className} />;
    }
  };

  const pendingRequests = useMemo(() => feeRequests.filter(r => r.status === 'Pending'), [feeRequests]);

  const reminders = [
    { text: 'Renew fee for July 2025', meta: '2 days left' },
    { text: `${stats.pendingStudentsCount} students have pending dues`, meta: 'View Dues' },
    { text: 'Send fee reminder to parents', meta: 'Send Now', action: true },
  ];

  // ═════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        
        {/* ── Header ─────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fees & Payments</h1>
          <p className="text-sm text-gray-500 mt-1">Home &gt; Fees & Payments</p>
        </div>

        {/* ── Top Stat Cards (4-Grid) ────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
            <div className="bg-red-50 text-red-500 w-12 h-12 rounded-full flex items-center justify-center shrink-0">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Dues</p>
              <p className="text-2xl font-bold text-gray-900 leading-tight">₹ {stats.totalDues.toLocaleString('en-IN')}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">All Students</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
            <div className="bg-green-50 text-green-600 w-12 h-12 rounded-full flex items-center justify-center shrink-0">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Collected This Month</p>
              <p className="text-2xl font-bold text-gray-900 leading-tight">₹ {stats.collectedThisMonth.toLocaleString('en-IN')}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">July 2025</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
            <div className="bg-blue-50 text-blue-600 w-12 h-12 rounded-full flex items-center justify-center shrink-0">
              <Banknote className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Collected</p>
              <p className="text-2xl font-bold text-gray-900 leading-tight">₹ {stats.totalCollected.toLocaleString('en-IN')}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">This Academic Year</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
            <div className="bg-orange-50 text-orange-500 w-12 h-12 rounded-full flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Pending Students</p>
              <p className="text-2xl font-bold text-gray-900 leading-tight">{stats.pendingStudentsCount}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Have Dues</p>
            </div>
          </div>

        </div>

        {/* ── Navigation Tabs ────────────────────────────────── */}
        <div className="flex flex-nowrap overflow-x-auto border-b border-gray-200 scrollbar-hide">
          {['Fee Collection', 'Pending Approvals', 'Fee Dues', 'Fee History', 'UPI Setup'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap px-6 py-3 text-sm transition-colors ${
                activeTab === tab
                  ? 'text-gray-900 font-semibold border-b-2 border-yellow-600'
                  : 'text-gray-500 font-medium hover:text-gray-700'
              }`}
            >
              {tab}
              {tab === 'Pending Approvals' && pendingRequests.length > 0 && (
                  <span className="ml-2 bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{pendingRequests.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── TAB CONTENT: Pending Approvals ──────────────────── */}
        {activeTab === 'Pending Approvals' && (
            <div className="space-y-6">
              {pendingRequests.length > 0 ? (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                      <h2 className="font-semibold text-lg text-gray-900 mb-4 flex items-center gap-2">
                          <Bell className="w-5 h-5 text-orange-500" />
                          Pending Online Requests
                      </h2>
                      <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                              <thead>
                                  <tr>
                                      <th className="text-xs text-gray-500 font-medium py-3 border-b border-gray-100">Student</th>
                                      <th className="text-xs text-gray-500 font-medium py-3 border-b border-gray-100">Date</th>
                                      <th className="text-xs text-gray-500 font-medium py-3 border-b border-gray-100">Method</th>
                                      <th className="text-xs text-gray-500 font-medium py-3 border-b border-gray-100">Amount</th>
                                      <th className="text-xs text-gray-500 font-medium py-3 border-b border-gray-100">Proof</th>
                                      <th className="text-xs text-gray-500 font-medium py-3 border-b border-gray-100 text-right">Action</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  {pendingRequests.map(req => {
                                      const stu = allStudents.find(s => s.id === req.studentId);
                                      return (
                                          <tr key={req.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                                              <td className="py-3 text-sm text-gray-800 font-medium">{stu?.name}</td>
                                              <td className="py-3 text-xs text-gray-500">{req.requestDate}</td>
                                              <td className="py-3 text-xs text-gray-600 flex items-center gap-1.5">
                                                  {getMediumIcon(req.method, "w-4 h-4")} {req.method}
                                              </td>
                                              <td className="py-3 text-sm text-gray-900 font-bold">₹{req.amount.toLocaleString('en-IN')}</td>
                                              <td className="py-3">
                                                  <button 
                                                    onClick={() => setProofModalUrl(req.proofImage)}
                                                    className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1.5 rounded-md"
                                                  >
                                                      <Eye className="w-3.5 h-3.5" /> View
                                                  </button>
                                              </td>
                                              <td className="py-3 text-right">
                                                  <div className="flex items-center justify-end gap-2">
                                                      <button 
                                                        onClick={() => handleRejectRequest(req)}
                                                        className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                                                        title="Reject"
                                                      >
                                                          <X className="w-4 h-4" />
                                                      </button>
                                                      <button 
                                                        onClick={() => handleApproveRequest(req)}
                                                        className="p-1.5 text-green-600 bg-green-50 hover:bg-green-100 rounded-md transition-colors"
                                                        title="Approve"
                                                      >
                                                          <Check className="w-4 h-4" />
                                                      </button>
                                                  </div>
                                              </td>
                                          </tr>
                                      );
                                  })}
                              </tbody>
                          </table>
                      </div>
                  </div>
              ) : (
                  <div className="text-center py-16 bg-white border border-gray-100 rounded-2xl shadow-sm">
                      <Check className="w-12 h-12 text-green-400 mx-auto mb-3 opacity-50" />
                      <p className="text-gray-500 font-medium">No pending fee approvals.</p>
                  </div>
              )}
            </div>
        )}

        {/* ── TAB CONTENT: Fee Collection ─────────────────────── */}
        {activeTab === 'Fee Collection' && (
          <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-4xl mx-auto">
                  <h2 className="font-semibold text-lg text-gray-900 mb-5">Manual Fee Collection</h2>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <label className="block text-xs text-gray-600 font-medium mb-1.5">Search & Select Student</label>
                        <input 
                          type="text" 
                          placeholder="Search student by name..." 
                          value={searchTerm} 
                          onChange={e => {
                            setSearchTerm(e.target.value);
                            setShowStudentDropdown(true);
                          }} 
                          onFocus={() => setShowStudentDropdown(true)}
                          onBlur={() => setTimeout(() => setShowStudentDropdown(false), 200)}
                          className="border border-gray-200 rounded-lg p-2.5 w-full text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" 
                        />
                        {showStudentDropdown && filteredStudents.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {filteredStudents.map(s => (
                              <div 
                                key={s.id} 
                                className={`p-3 cursor-pointer hover:bg-gray-50 text-sm border-b border-gray-100 last:border-0 ${selectedStudentId === s.id ? 'bg-blue-50' : ''}`}
                                onClick={() => { 
                                  setSelectedStudentId(s.id); 
                                  setSearchTerm(s.name); 
                                  setShowStudentDropdown(false); 
                                }}
                              >
                                <div className="font-medium text-gray-800">{s.name}</div>
                                <div className="text-xs text-gray-500">Roll No: {s.rollNumber || 'N/A'}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 font-medium mb-1.5">Payment Date</label>
                        <input
                          type="date"
                          value={collectDate}
                          onChange={e => setCollectDate(e.target.value)}
                          className="border border-gray-200 rounded-lg p-2.5 w-full text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 font-medium mb-1.5">Amount (₹) {breakdown && <span className="text-red-500 ml-1">(Max: ₹{breakdown.outstanding})</span>}</label>
                      <input
                        type="number"
                        placeholder="Enter amount"
                        value={collectAmount}
                        onChange={e => {
                            if (breakdown && Number(e.target.value) > breakdown.outstanding) {
                                setCollectAmount(breakdown.outstanding.toString());
                            } else {
                                setCollectAmount(e.target.value);
                            }
                        }}
                        className="border border-gray-200 rounded-lg p-2.5 w-full text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 font-medium mb-2">Payment Method</label>
                      <div className="grid grid-cols-4 gap-2">
                          {(['UPI', 'Net Banking', 'Cash', 'Cheque'] as PaymentMedium[]).map(m => {
                              const isActive = collectMedium === m;
                              return (
                                  <button
                                      key={m}
                                      type="button"
                                      onClick={() => setCollectMedium(m)}
                                      className={`border rounded-lg p-3 flex flex-col items-center justify-center text-[11px] font-medium transition-colors ${
                                          isActive
                                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                      }`}
                                  >
                                      {getMediumIcon(m, "w-5 h-5 mb-1")}
                                      <span>{m}</span>
                                  </button>
                              );
                          })}
                      </div>
                    </div>

                    <button
                      onClick={() => setShowConfirmModal(true)}
                      disabled={!selectedStudent || Number(collectAmount) <= 0}
                      className="w-full bg-[#0B1E40] text-white rounded-lg py-3 mt-4 flex items-center justify-center gap-2 hover:bg-blue-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                    >
                      <Wallet className="w-4 h-4" />
                      Collect Fee & Save
                    </button>
                  </div>
              </div>
          </div>
        )}

        {/* ── TAB CONTENT: UPI Setup ───────────────────────────── */}
        {activeTab === 'UPI Setup' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-2xl mx-auto text-center">
                <h2 className="font-semibold text-lg text-gray-900 mb-2">School UPI Configuration</h2>
                <p className="text-gray-500 text-sm mb-6">Configure the official UPI QR code and ID to enable online payments for students.</p>
                
                <div className="flex flex-col items-center justify-center gap-6">
                    <div className="w-48 h-48 bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center overflow-hidden relative group">
                        {upiQr ? (
                            <>
                                <img src={upiQr} alt="UPI QR" className="w-full h-full object-contain p-2" />
                                <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center">
                                    <button onClick={() => fileInputRef.current?.click()} className="text-white text-xs font-bold bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-sm">Change QR</button>
                                </div>
                            </>
                        ) : (
                            <div className="text-center">
                                <Smartphone className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                <button onClick={() => fileInputRef.current?.click()} className="text-blue-600 font-medium text-sm hover:underline">Upload QR Code</button>
                            </div>
                        )}
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                const reader = new FileReader();
                                reader.onload = () => setCropSrc(reader.result as string);
                                reader.readAsDataURL(file);
                            }
                        }} />
                    </div>

                    <div className="w-full">
                        <label className="block text-left text-xs font-bold text-gray-700 uppercase mb-2">Official UPI ID</label>
                        <input 
                            type="text" 
                            placeholder="e.g. school@upi"
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center font-medium"
                        />
                    </div>

                    <button 
                        onClick={handleSaveUpi}
                        disabled={!upiId || !upiQr}
                        className="w-full bg-[#0B1E40] text-white rounded-xl py-3.5 font-bold hover:bg-blue-900 transition-colors disabled:opacity-50"
                    >
                        Save & Lock Configuration
                    </button>
                </div>
            </div>
        )}

        {/* ── TAB CONTENT: Fee Dues ───────────────────────────── */}
        {activeTab === 'Fee Dues' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-4">
                  <div>
                    <h2 className="font-semibold text-lg text-gray-900">Student Dues List</h2>
                    <p className="text-sm text-gray-500 mt-1">Flat Yearly Fee: ₹{TOTAL_YEARLY_FEE.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <input 
                      type="text" 
                      placeholder="Search student..." 
                      value={duesSearchTerm}
                      onChange={e => setDuesSearchTerm(e.target.value)}
                      className="border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500 w-40 focus:ring-1 focus:ring-blue-500"
                    />
                    <select
                      value={duesClassFilter}
                      onChange={e => setDuesClassFilter(e.target.value)}
                      className="border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500 bg-white"
                    >
                      <option value="All">All Classes</option>
                      {Array.from(new Set(allStudents.map(s => s.className).filter(Boolean))).map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <select
                      value={duesStatusFilter}
                      onChange={e => setDuesStatusFilter(e.target.value)}
                      className="border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500 bg-white"
                    >
                      <option value="All">All Statuses</option>
                      <option value="0 Paid">0 Paid (No fees submitted)</option>
                      <option value="Fully Paid">Fully Paid (Zero dues)</option>
                      <option value="Paid this week">Paid this week</option>
                      <option value="Paid this month">Paid this month</option>
                    </select>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr>
                                <th className="text-xs text-gray-500 font-medium py-3 border-b border-gray-100">Student Name</th>
                                <th className="text-xs text-gray-500 font-medium py-3 border-b border-gray-100">Class & Roll</th>
                                <th className="text-xs text-gray-500 font-medium py-3 border-b border-gray-100">Total Paid</th>
                                <th className="text-xs text-gray-500 font-medium py-3 border-b border-gray-100">Outstanding Due</th>
                                <th className="text-xs text-gray-500 font-medium py-3 border-b border-gray-100 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allStudents.filter(stu => {
                                // Apply filters
                                if (duesSearchTerm && !stu.name.toLowerCase().includes(duesSearchTerm.toLowerCase()) && !stu.rollNumber?.toLowerCase().includes(duesSearchTerm.toLowerCase())) return false;
                                if (duesClassFilter !== 'All' && stu.className !== duesClassFilter) return false;
                                
                                const b = getStudentFeeBreakdown(stu.id);
                                if (duesStatusFilter === '0 Paid' && b.totalPaid > 0) return false;
                                if (duesStatusFilter === 'Fully Paid' && b.outstanding > 0) return false;
                                
                                if (duesStatusFilter === 'Paid this week' || duesStatusFilter === 'Paid this month') {
                                    const stuTxns = transactions.filter(t => t.studentId === stu.id);
                                    if (stuTxns.length === 0) return false;
                                    
                                    const now = new Date();
                                    const hasRecentTxn = stuTxns.some(t => {
                                        // txn.date is 'YYYY-MM-DD'
                                        const txnDate = new Date(t.date);
                                        const diffTime = Math.abs(now.getTime() - txnDate.getTime());
                                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                        
                                        if (duesStatusFilter === 'Paid this week') return diffDays <= 7;
                                        if (duesStatusFilter === 'Paid this month') return diffDays <= 30;
                                        return false;
                                    });
                                    if (!hasRecentTxn) return false;
                                }
                                
                                return true;
                            }).map(stu => {
                                const b = getStudentFeeBreakdown(stu.id);
                                return (
                                    <tr key={stu.id} className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer" onClick={() => setViewStudentHistoryId(stu.id)}>
                                        <td className="py-3 text-sm text-blue-600 font-semibold hover:underline">{stu.name}</td>
                                        <td className="py-3 text-xs text-gray-500">{stu.className} ({stu.rollNumber || 'N/A'})</td>
                                        <td className="py-3 text-sm text-green-700 font-medium">₹ {b.totalPaid.toLocaleString('en-IN')}</td>
                                        <td className="py-3 text-sm text-red-600 font-bold">₹ {b.outstanding.toLocaleString('en-IN')}</td>
                                        <td className="py-3 text-right">
                                            {b.outstanding > 0 ? (
                                                <button onClick={(e) => { e.stopPropagation(); setSelectedStudentId(stu.id); setActiveTab('Fee Collection'); }} className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-md hover:bg-blue-100 transition-colors">Collect</button>
                                            ) : (
                                                <span className="text-xs font-semibold text-green-600 px-3 py-1.5 bg-green-50 rounded-md">Cleared</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* ── TAB CONTENT: Receipts & History ─────────────────── */}
        {(activeTab === 'Fee History' || activeTab === 'Receipts') && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 gap-4">
                    <h2 className="font-semibold text-lg text-gray-900">Recent Collections & Receipts</h2>
                    <input 
                      type="text" 
                      placeholder="Search student by name..." 
                      value={historySearchTerm}
                      onChange={e => setHistorySearchTerm(e.target.value)}
                      className="border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500 w-full sm:w-64 focus:ring-1 focus:ring-blue-500"
                    />
                </div>

                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead>
                            <tr>
                                <th className="text-xs text-gray-500 font-medium py-3 border-b border-gray-100 w-1/4">Student Name</th>
                                <th className="text-xs text-gray-500 font-medium py-3 border-b border-gray-100 w-1/5">Batch</th>
                                <th className="text-xs text-gray-500 font-medium py-3 border-b border-gray-100 w-1/6">Amount</th>
                                <th className="text-xs text-gray-500 font-medium py-3 border-b border-gray-100 w-1/6">Method</th>
                                <th className="text-xs text-gray-500 font-medium py-3 border-b border-gray-100 w-1/6">Date</th>
                                <th className="text-xs text-gray-500 font-medium py-3 border-b border-gray-100 text-center">Receipt</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.filter(t => {
                                const stu = allStudents.find(s => s.id === t.studentId);
                                if (!historySearchTerm) return true;
                                return stu?.name.toLowerCase().includes(historySearchTerm.toLowerCase());
                            }).slice().reverse().map((txn, i) => {
                                const stu = allStudents.find(s => s.id === txn.studentId);
                                return (
                                    <tr key={txn.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => setViewStudentHistoryId(stu?.id || null)}>
                                        <td className="py-3 text-sm text-blue-600 font-medium hover:underline">{stu?.name || 'Unknown Student'}</td>
                                        <td className="py-3 text-xs text-gray-500">{stu?.className || '10th'} Morning</td>
                                        <td className="py-3 text-sm text-gray-800 font-medium">₹ {txn.amount.toLocaleString('en-IN')}</td>
                                        <td className="py-3 text-xs text-gray-600 flex items-center gap-1.5">
                                            {getMediumIcon(txn.medium, "w-3.5 h-3.5 text-blue-600")}
                                            {txn.medium}
                                        </td>
                                        <td className="py-3 text-xs text-gray-500">{txn.date}</td>
                                        <td className="py-3 text-center flex items-center justify-center gap-2">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setPreviewReceiptTxn(txn); }}
                                                className="bg-purple-50 text-purple-600 px-2.5 py-1.5 rounded-md hover:bg-purple-100 transition-colors inline-flex items-center gap-1 text-[11px] font-medium"
                                                title="Preview"
                                            >
                                                <Eye className="w-3.5 h-3.5" /> Preview
                                            </button>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); downloadReceiptAsPDF(`receipt-${txn.id}`, `Receipt_${txn.receiptNo}.pdf`); }}
                                                className="bg-orange-50 text-orange-600 px-2.5 py-1.5 rounded-md hover:bg-orange-100 transition-colors inline-flex items-center gap-1 text-[11px] font-medium"
                                                title="Download PDF"
                                            >
                                                <Download className="w-3.5 h-3.5" /> PDF
                                            </button>
                                            <button 
                                                onClick={() => downloadReceiptAsJPG(`receipt-${txn.id}`, `Receipt_${txn.receiptNo}.jpg`)}
                                                className="bg-blue-50 text-blue-600 px-2.5 py-1.5 rounded-md hover:bg-blue-100 transition-colors inline-flex items-center gap-1 text-[11px] font-medium"
                                                title="Download JPG"
                                            >
                                                <ImageIcon className="w-3.5 h-3.5" /> JPG
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {transactions.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="py-10 text-center text-sm text-gray-400">No collections recorded yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="mt-6 border-t border-gray-100 pt-4">
                    <button className="border border-gray-300 text-blue-600 font-medium rounded-lg px-4 py-2 text-sm hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 w-full md:w-auto">
                        <Download className="w-4 h-4" />
                        Download Full Fee Report
                    </button>
                </div>
            </div>
        )}

        {/* PROOF MODAL */}
        {proofModalUrl && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setProofModalUrl(null)}>
                <div className="bg-white rounded-2xl p-4 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-900">Payment Screenshot</h3>
                        <button onClick={() => setProofModalUrl(null)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <img src={proofModalUrl} alt="Payment Proof" className="w-full h-auto rounded-lg shadow-sm border border-gray-200" />
                </div>
            </div>
        )}

        {/* SUCCESS POPUP */}
        {successPopupTxn && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm" style={{ animation: 'fadeIn 0.2s ease-out' }}>
                <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center shadow-xl border border-gray-100">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="w-8 h-8" />
                    </div>
                    <h3 className="font-bold text-xl text-gray-900 mb-1">Payment Successful!</h3>
                    <p className="text-gray-500 text-sm mb-6">{successPopupTxn.studentName} paid ₹{successPopupTxn.amount.toLocaleString('en-IN')}</p>
                    
                    <div className="bg-orange-50 text-orange-700 rounded-lg p-3 text-sm font-medium mb-6">
                        Outstanding Due: ₹{successPopupTxn.outstanding.toLocaleString('en-IN')}
                    </div>

                    <div className="flex gap-3">
                        <button 
                            onClick={() => downloadReceiptAsPDF(`receipt-${successPopupTxn.id}`)}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors"
                        >
                            <Download className="w-4 h-4" /> Save
                        </button>
                        <button 
                            onClick={() => {
                                import('../../utils/receiptDownloader').then(m => m.printReceipt(`receipt-${successPopupTxn.id}`));
                            }}
                            className="flex-1 bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors"
                        >
                            Print
                        </button>
                        <button 
                            onClick={() => setSuccessPopupTxn(null)}
                            className="flex-1 bg-[#0B1E40] text-white hover:bg-blue-900 font-medium py-2.5 rounded-lg text-sm transition-colors"
                        >
                            Close
                        </button>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-4">Auto-closing in a few seconds...</p>
                </div>
            </div>
        )}

        {/* CONFIRMATION MODAL */}
        {showConfirmModal && selectedStudent && (
            <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center mb-5">
                        <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2"><Wallet className="w-5 h-5 text-blue-600"/> Confirm Payment Details</h3>
                        <button onClick={() => setShowConfirmModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="space-y-3 bg-gray-50 p-4 rounded-xl mb-6 text-sm">
                        <div className="flex justify-between"><span className="text-gray-500">Student Name:</span><span className="font-semibold text-gray-900">{selectedStudent.name}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Class & Sec:</span><span className="font-semibold text-gray-900">{selectedStudent.className} - {selectedStudent.section}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Roll No:</span><span className="font-semibold text-gray-900">{selectedStudent.rollNumber || 'N/A'}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Payment Date:</span><span className="font-semibold text-gray-900">{collectDate}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Via:</span><span className="font-semibold text-gray-900">{collectMedium}</span></div>
                        <div className="border-t border-gray-200 my-2 pt-2 flex justify-between font-bold text-lg"><span className="text-gray-900">Amount:</span><span className="text-blue-600">₹{Number(collectAmount).toLocaleString('en-IN')}</span></div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors">Cancel</button>
                        <button onClick={() => { setShowConfirmModal(false); handleCollectFee(); }} className="flex-1 py-2.5 rounded-lg bg-[#0B1E40] text-white font-medium hover:bg-blue-900 transition-colors flex items-center justify-center gap-2"><Check className="w-4 h-4"/> Confirm & Collect</button>
                    </div>
                </div>
            </div>
        )}

        {/* STUDENT TRANSACTION HISTORY MODAL */}
        {viewStudentHistoryId && (
            <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setViewStudentHistoryId(null)}>
                <div className="bg-white rounded-2xl p-6 w-full max-w-3xl shadow-xl border border-gray-100 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-5 border-b border-gray-100 pb-4">
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg">Transaction History</h3>
                            <p className="text-sm text-gray-500">{allStudents.find(s => s.id === viewStudentHistoryId)?.name}</p>
                        </div>
                        <button onClick={() => setViewStudentHistoryId(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                    </div>
                    {viewStudentHistoryId && (
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                                <p className="text-xs text-blue-600 font-bold uppercase mb-1">Total Fee</p>
                                <p className="text-xl font-black text-blue-900">₹ {TOTAL_YEARLY_FEE.toLocaleString('en-IN')}</p>
                            </div>
                            <div className="bg-green-50 border border-green-100 p-4 rounded-xl">
                                <p className="text-xs text-green-600 font-bold uppercase mb-1">Collected</p>
                                <p className="text-xl font-black text-green-900">₹ {getStudentFeeBreakdown(viewStudentHistoryId).totalPaid.toLocaleString('en-IN')}</p>
                            </div>
                            <div className="bg-red-50 border border-red-100 p-4 rounded-xl">
                                <p className="text-xs text-red-600 font-bold uppercase mb-1">Due</p>
                                <p className="text-xl font-black text-red-900">₹ {getStudentFeeBreakdown(viewStudentHistoryId).outstanding.toLocaleString('en-IN')}</p>
                            </div>
                        </div>
                    )}
                    <div className="overflow-y-auto flex-1">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="text-xs text-gray-500 font-bold uppercase py-3 px-4 rounded-tl-lg">Date</th>
                                    <th className="text-xs text-gray-500 font-bold uppercase py-3 px-4">Receipt No</th>
                                    <th className="text-xs text-gray-500 font-bold uppercase py-3 px-4">Method</th>
                                    <th className="text-xs text-gray-500 font-bold uppercase py-3 px-4">Amount</th>
                                    <th className="text-xs text-gray-500 font-bold uppercase py-3 px-4 text-center rounded-tr-lg">Receipt</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.filter(t => t.studentId === viewStudentHistoryId).map(t => (
                                    <tr key={t.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                                        <td className="py-3 px-4 text-sm font-medium text-gray-700">{t.date}</td>
                                        <td className="py-3 px-4 text-sm text-gray-500 font-mono">{t.receiptNo}</td>
                                        <td className="py-3 px-4 text-sm text-gray-600 flex items-center gap-1.5">{getMediumIcon(t.medium, "w-3.5 h-3.5")}{t.medium}</td>
                                        <td className="py-3 px-4 text-sm font-bold text-gray-900">₹{t.amount.toLocaleString('en-IN')}</td>
                                        <td className="py-3 px-4 text-center flex items-center justify-center gap-1.5">
                                            <button 
                                                onClick={() => { setViewStudentHistoryId(null); setPreviewReceiptTxn(t); }}
                                                className="bg-purple-50 text-purple-600 px-2 py-1 rounded hover:bg-purple-100 text-[10px] font-bold"
                                            >
                                                Preview
                                            </button>
                                            <button 
                                                onClick={() => downloadReceiptAsPDF(`receipt-${t.id}`, `Receipt_${t.receiptNo}.pdf`)}
                                                className="bg-orange-50 text-orange-600 px-2 py-1 rounded hover:bg-orange-100 text-[10px] font-bold"
                                            >
                                                PDF
                                            </button>
                                            <button 
                                                onClick={() => downloadReceiptAsJPG(`receipt-${t.id}`, `Receipt_${t.receiptNo}.jpg`)}
                                                className="bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 text-[10px] font-bold"
                                            >
                                                JPG
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {transactions.filter(t => t.studentId === viewStudentHistoryId).length === 0 && (
                                    <tr><td colSpan={4} className="py-8 text-center text-gray-400 text-sm">No transactions found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}

        {/* PREVIEW RECEIPT MODAL */}
        {previewReceiptTxn && (
            <div className="fixed inset-0 z-[110] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setPreviewReceiptTxn(null)}>
                <div className="bg-white rounded-2xl w-full max-w-4xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2"><Eye className="w-5 h-5 text-blue-600"/> Receipt Preview</h3>
                        <div className="flex items-center gap-3">
                            <button onClick={() => downloadReceiptAsPDF(`receipt-${previewReceiptTxn.id}`, `Receipt_${previewReceiptTxn.receiptNo}.pdf`)} className="bg-orange-50 text-orange-600 hover:bg-orange-100 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1"><Download className="w-4 h-4"/> PDF</button>
                            <button onClick={() => downloadReceiptAsJPG(`receipt-${previewReceiptTxn.id}`, `Receipt_${previewReceiptTxn.receiptNo}.jpg`)} className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1"><ImageIcon className="w-4 h-4"/> JPG</button>
                            <button onClick={() => setPreviewReceiptTxn(null)} className="p-1.5 text-gray-400 hover:text-gray-600 bg-white rounded-full ml-2"><X className="w-5 h-5" /></button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto bg-gray-200 flex justify-center items-start p-4 relative" style={{ minHeight: '60vh' }}>
                        <div className="scale-75 origin-top-left md:origin-top w-[800px]">
                            <HiddenReceipt
                                isPreview={true}
                                txn={previewReceiptTxn}
                                studentName={allStudents.find(s => s.id === previewReceiptTxn.studentId)?.name || 'Unknown'}
                                className={allStudents.find(s => s.id === previewReceiptTxn.studentId)?.className || ''}
                                section={allStudents.find(s => s.id === previewReceiptTxn.studentId)?.section || ''}
                                rollNumber={allStudents.find(s => s.id === previewReceiptTxn.studentId)?.rollNumber || ''}
                                fatherName={allStudents.find(s => s.id === previewReceiptTxn.studentId)?.fathersName || allStudents.find(s => s.id === previewReceiptTxn.studentId)?.guardianDetails?.guardianName || ''}
                                allTransactions={transactions.filter(t => t.studentId === previewReceiptTxn.studentId)}
                                outstandingDue={getStudentFeeBreakdown(previewReceiptTxn.studentId).outstanding}
                            />
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* CROPPER MODAL */}
        {cropSrc && (
            <div className="fixed inset-0 z-[110] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-bold text-gray-900">Crop QR Code</h3>
                        <button onClick={() => setCropSrc(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="relative w-full h-80 bg-gray-900">
                        <Cropper
                            image={cropSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            onCropChange={setCrop}
                            onZoomChange={setZoom}
                            onCropComplete={(croppedArea, croppedAreaPixels) => setCroppedAreaPixels(croppedAreaPixels as any)}
                        />
                    </div>
                    <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
                        <button onClick={() => setCropSrc(null)} className="flex-1 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700">Cancel</button>
                        <button onClick={() => {
                            if (!croppedAreaPixels || !cropSrc) return;
                            const image = new Image();
                            image.src = cropSrc;
                            image.onload = () => {
                                const canvas = document.createElement('canvas');
                                const ctx = canvas.getContext('2d');
                                if (!ctx) return;
                                canvas.width = croppedAreaPixels.width;
                                canvas.height = croppedAreaPixels.height;
                                ctx.drawImage(
                                    image,
                                    croppedAreaPixels.x, croppedAreaPixels.y, croppedAreaPixels.width, croppedAreaPixels.height,
                                    0, 0, croppedAreaPixels.width, croppedAreaPixels.height
                                );
                                setUpiQr(canvas.toDataURL('image/jpeg'));
                                setCropSrc(null);
                            };
                        }} className="flex-1 py-2.5 bg-[#0B1E40] text-white rounded-lg text-sm font-bold">Crop & Save</button>
                    </div>
                </div>
            </div>
        )}

      </div>
      {/* HIDDEN RECEIPT RENDERERS */}
      {transactions.filter(t => {
          const stu = allStudents.find(s => s.id === t.studentId);
          if (!historySearchTerm) return true;
          return stu?.name.toLowerCase().includes(historySearchTerm.toLowerCase());
      }).map(txn => {
          const stu = allStudents.find(s => s.id === txn.studentId);
          const breakdown = stu ? getStudentFeeBreakdown(stu.id) : { outstanding: 0 };
          const allTxnsForStudent = transactions.filter(t => t.studentId === txn.studentId);
          return (
            <HiddenReceipt
                key={txn.id}
                txn={txn}
                studentName={stu?.name || 'Unknown Student'}
                className={stu?.className || '10th'}
                section={stu?.section || 'A'}
                rollNumber={stu?.rollNumber || 'N/A'}
                fatherName={stu?.fathersName || 'N/A'}
                allTransactions={allTxnsForStudent}
                outstandingDue={breakdown.outstanding}
            />
          );
      })}

    </div>
  );
}
