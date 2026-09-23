import React, { useState, useMemo, useEffect } from 'react';
import { useFees, PaymentMedium, TOTAL_YEARLY_FEE, FeeRequest } from '../../hooks/useFees';
import { useAuth } from '../../context/AuthContext';
import { useSuccess } from '../../context/SuccessContext';
import { useLoader } from '../../context/LoaderContext';
import { NotificationService } from '../../services/NotificationService';
import { User } from '../../types';
import {
  Wallet, CalendarDays, Banknote, Users, Download, Upload,
  Smartphone, CreditCard, ChevronDown, Bell, Send, Landmark, ScrollText, X, Check, Eye
} from 'lucide-react';

export function TeacherFees() {
  const { transactions, feeRequests, getStudentFeeBreakdown, collectFee, approveFeeRequest, rejectFeeRequest } = useFees();
  const { triggerSuccess } = useSuccess();
  const { runWithLoader } = useLoader();

  const { currentUser } = useAuth();

  // Teacher-specific scope from auth
  const assignedClassStr = currentUser?.assignedClasses?.[0] || 'Class 10 - Section A';
  const [TEACHER_CLASS, TEACHER_SECTION] = assignedClassStr.includes(' - Section ') 
    ? assignedClassStr.split(' - Section ')
    : ['Class 10', 'A'];

  // ─── State ─────────────────────────────────────────────────
  const [allStudents, setAllStudents] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState('Fee Collection');

  // Collect Form
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [collectAmount, setCollectAmount] = useState('');
  const [collectMedium, setCollectMedium] = useState<PaymentMedium>('UPI');
  const [collectBatch, setCollectBatch] = useState('Class 10th - Morning Batch');
  const [collectMonth, setCollectMonth] = useState('July 2025');
  
  // Modal State
  const [proofModalUrl, setProofModalUrl] = useState<string | null>(null);

  // ─── Load Students ─────────────────────────────────────────
  useEffect(() => {
    try {
      const stored = localStorage.getItem('ajps_users');
      if (stored) {
        const parsed: User[] = JSON.parse(stored);
        setAllStudents(parsed.filter(u => 
            u.role === 'Student' && u.className === TEACHER_CLASS && u.section === TEACHER_SECTION
        ));
      }
    } catch (e) { /* */ }
  }, []);

  // ─── Global Stats ─────────────────────────────────────────
  const stats = useMemo(() => {
    let totalDues = 0;
    let pendingStudentsCount = 0;
    let totalCollected = 0;
    let collectedThisMonth = 0;
    
    const currentMonthPrefix = new Date().toISOString().substring(0, 7);

    allStudents.forEach(s => {
        const b = getStudentFeeBreakdown(s.id);
        totalDues += b.outstanding;
        if (b.outstanding > 0) pendingStudentsCount++;
        
        // Sum transactions for this student
        const studentTxns = transactions.filter(t => t.studentId === s.id);
        totalCollected += studentTxns.reduce((sum, t) => sum + t.amount, 0);
        collectedThisMonth += studentTxns
            .filter(t => t.date.startsWith(currentMonthPrefix))
            .reduce((sum, t) => sum + t.amount, 0);
    });

    const displayCollectedThisMonth = collectedThisMonth > 0 ? collectedThisMonth : Math.min(totalCollected, 42000);

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

    runWithLoader(() => {
      const amountNum = Number(collectAmount);
      const currentTotalPaid = breakdown?.totalPaid ?? 0;
      const newOutstanding = Math.max(0, TOTAL_YEARLY_FEE - (currentTotalPaid + amountNum));

      collectFee(selectedStudent.id, amountNum, collectMedium);

      NotificationService.sendNotification({
        recipientIds: [selectedStudent.id],
        title: '💰 Fee Payment Recorded',
        message: `Your fee payment of ₹${amountNum.toLocaleString('en-IN')} has been recorded today. Your outstanding due is ₹${newOutstanding.toLocaleString('en-IN')}.`,
        type: 'success',
        actionPath: '/fees',
      });

      triggerSuccess('Fee Collected Successfully!');
      setSelectedStudentId('');
      setCollectAmount('');
    });
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
                message: `Your online payment request of ₹${req.amount.toLocaleString('en-IN')} was rejected. Please contact your class teacher.`,
                type: 'error',
                actionPath: '/fees',
            });
            triggerSuccess('Payment Request Rejected');
        });
    }
  };

  const todayStr = new Date().toLocaleDateString('en-GB');

  const getMediumIcon = (method: PaymentMedium, className: string = "w-5 h-5 mb-1") => {
    switch (method) {
        case 'UPI': return <Smartphone className={className} />;
        case 'Net Banking': return <Landmark className={className} />;
        case 'Cash': return <Banknote className={className} />;
        case 'Cheque': return <ScrollText className={className} />;
    }
  };

  // Only show requests for students in this teacher's class
  const pendingRequests = useMemo(() => 
    feeRequests.filter(r => r.status === 'Pending' && allStudents.some(s => s.id === r.studentId)), 
  [feeRequests, allStudents]);

  const reminders = [
    { text: `${TEACHER_CLASS} - ${TEACHER_SECTION} pending dues`, meta: `${stats.pendingStudentsCount} students` },
    { text: 'Send class-wide fee reminder', meta: 'Send Now', action: true },
  ];

  // ═════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        
        {/* ── Header ─────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Class Fees & Payments</h1>
          <p className="text-sm text-gray-500 mt-1">Home &gt; {TEACHER_CLASS} - {TEACHER_SECTION} &gt; Fees</p>
        </div>

        {/* ── Top Stat Cards (4-Grid) ────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
            <div className="bg-red-50 text-red-500 w-12 h-12 rounded-full flex items-center justify-center shrink-0">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Class Dues</p>
              <p className="text-2xl font-bold text-gray-900 leading-tight">₹ {stats.totalDues.toLocaleString('en-IN')}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{TEACHER_CLASS} - {TEACHER_SECTION}</p>
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
          {['Fee Collection', 'Class Dues', 'Fee History', 'Receipts', 'Concessions'].map(tab => (
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
            </button>
          ))}
        </div>

        {/* ── TAB CONTENT: Fee Collection ─────────────────────── */}
        {activeTab === 'Fee Collection' && (
          <div className="space-y-6">
              {/* Pending Requests Section */}
              {pendingRequests.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                      <h2 className="font-semibold text-lg text-gray-900 mb-4 flex items-center gap-2">
                          <Bell className="w-5 h-5 text-orange-500" />
                          Pending Class Requests ({pendingRequests.length})
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
              )}

              {/* Main Content Split: Form & Widgets */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left: Collect Fee Form */}
                <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h2 className="font-semibold text-lg text-gray-900 mb-5">Manual Fee Collection</h2>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 font-medium mb-1.5">Select Student</label>
                        <div className="relative">
                          <select
                            value={selectedStudentId}
                            onChange={e => setSelectedStudentId(e.target.value)}
                            className="border border-gray-200 rounded-lg p-2.5 w-full text-sm text-gray-800 appearance-none bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">Select Student</option>
                            {allStudents.map(s => (
                              <option key={s.id} value={s.id}>{s.name} ({s.rollNumber || 'N/A'})</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 font-medium mb-1.5">Select Batch</label>
                        <div className="relative">
                          <select
                            value={collectBatch}
                            onChange={e => setCollectBatch(e.target.value)}
                            className="border border-gray-200 rounded-lg p-2.5 w-full text-sm text-gray-800 appearance-none bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="Class 10th - Morning Batch">Class 10th - Morning Batch</option>
                            <option value="Class 10th - Evening Batch">Class 10th - Evening Batch</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 font-medium mb-1.5">Month</label>
                        <div className="relative">
                          <select
                            value={collectMonth}
                            onChange={e => setCollectMonth(e.target.value)}
                            className="border border-gray-200 rounded-lg p-2.5 w-full text-sm text-gray-800 appearance-none bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="July 2025">July 2025</option>
                            <option value="August 2025">August 2025</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 font-medium mb-1.5">Amount (₹)</label>
                        <input
                          type="number"
                          placeholder="Enter amount"
                          value={collectAmount}
                          onChange={e => setCollectAmount(e.target.value)}
                          className="border border-gray-200 rounded-lg p-2.5 w-full text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium"
                        />
                      </div>
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

                    <div>
                      <label className="block text-xs text-gray-600 font-medium mb-1.5">Payment Date</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={todayStr}
                          readOnly
                          className="border border-gray-200 rounded-lg p-2.5 w-full text-sm text-gray-700 bg-gray-50 focus:outline-none"
                        />
                        <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      </div>
                    </div>

                    <button
                      onClick={handleCollectFee}
                      disabled={!selectedStudent || Number(collectAmount) <= 0}
                      className="w-full bg-[#0B1E40] text-white rounded-lg py-3 mt-4 flex items-center justify-center gap-2 hover:bg-blue-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                    >
                      <Wallet className="w-4 h-4" />
                      Collect Fee & Save
                    </button>
                  </div>
                </div>

                {/* Right: Widgets */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Dues Overview */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                      <h2 className="font-semibold text-lg text-gray-900 mb-6">Class Dues Overview</h2>
                      <div className="flex flex-col md:flex-row items-center gap-8">
                          <div className="relative w-32 h-32 rounded-full border-[12px] border-orange-500 flex flex-col items-center justify-center shrink-0" style={{ borderRightColor: '#E5E7EB', borderBottomColor: '#3B82F6', borderLeftColor: '#10B981' }}>
                              <p className="text-[9px] font-medium text-gray-500">Total Dues</p>
                              <p className="text-sm font-bold text-gray-900 leading-tight mt-0.5">₹ {stats.totalDues > 0 ? stats.totalDues.toLocaleString('en-IN') : '0'}</p>
                          </div>
                          
                          <div className="flex-1 w-full space-y-3">
                              <div className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                      <span className="text-gray-600">0 - 1 Month</span>
                                  </div>
                                  <span className="font-medium text-gray-900">₹ {Math.floor(stats.totalDues * 0.4).toLocaleString('en-IN')}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                      <span className="text-gray-600">1 - 2 Months</span>
                                  </div>
                                  <span className="font-medium text-gray-900">₹ {Math.floor(stats.totalDues * 0.3).toLocaleString('en-IN')}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                      <span className="text-gray-600">2 - 3 Months</span>
                                  </div>
                                  <span className="font-medium text-gray-900">₹ {Math.floor(stats.totalDues * 0.2).toLocaleString('en-IN')}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                      <span className="text-gray-600">3+ Months</span>
                                  </div>
                                  <span className="font-medium text-gray-900">₹ {Math.floor(stats.totalDues * 0.1).toLocaleString('en-IN')}</span>
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* Important Reminders */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                      <h2 className="font-semibold text-lg text-gray-900 mb-6">Important Reminders</h2>
                      <div className="space-y-4">
                          {reminders.map((r, i) => (
                              <div key={i} className="flex items-center justify-between pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                                  <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                                          {i === 0 && <Users className="w-5 h-5" />}
                                          {i === 1 && <Send className="w-5 h-5" />}
                                      </div>
                                      <p className="text-sm font-medium text-gray-700">{r.text}</p>
                                  </div>
                                  {r.action ? (
                                      <button className="text-sm font-semibold text-blue-600 hover:text-blue-700">{r.meta}</button>
                                  ) : (
                                      <span className={`text-xs font-medium text-orange-500`}>{r.meta}</span>
                                  )}
                              </div>
                          ))}
                      </div>
                  </div>
                </div>
              </div>
          </div>
        )}

        {/* ── TAB CONTENT: Class Dues ───────────────────────────── */}
        {activeTab === 'Class Dues' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="font-semibold text-lg text-gray-900 mb-5">Class Dues List</h2>
                <p className="text-sm text-gray-500 mb-6">Flat Yearly Fee: ₹{TOTAL_YEARLY_FEE.toLocaleString('en-IN')}</p>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr>
                                <th className="text-xs text-gray-500 font-medium py-3 border-b border-gray-100">Student Name</th>
                                <th className="text-xs text-gray-500 font-medium py-3 border-b border-gray-100">Roll Number</th>
                                <th className="text-xs text-gray-500 font-medium py-3 border-b border-gray-100">Total Paid</th>
                                <th className="text-xs text-gray-500 font-medium py-3 border-b border-gray-100">Outstanding Due</th>
                                <th className="text-xs text-gray-500 font-medium py-3 border-b border-gray-100 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allStudents.map(stu => {
                                const b = getStudentFeeBreakdown(stu.id);
                                return (
                                    <tr key={stu.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                                        <td className="py-3 text-sm text-gray-800 font-semibold">{stu.name}</td>
                                        <td className="py-3 text-xs text-gray-500">{stu.rollNumber || 'N/A'}</td>
                                        <td className="py-3 text-sm text-green-700 font-medium">₹ {b.totalPaid.toLocaleString('en-IN')}</td>
                                        <td className="py-3 text-sm text-red-600 font-bold">₹ {b.outstanding.toLocaleString('en-IN')}</td>
                                        <td className="py-3 text-right">
                                            {b.outstanding > 0 ? (
                                                <button onClick={() => { setSelectedStudentId(stu.id); setActiveTab('Fee Collection'); }} className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-md hover:bg-blue-100 transition-colors">Collect</button>
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
                <div className="flex items-center justify-between mb-5">
                    <h2 className="font-semibold text-lg text-gray-900">Class Collections & Receipts</h2>
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
                            {transactions.filter(t => allStudents.some(s => s.id === t.studentId)).reverse().map((txn, i) => {
                                const stu = allStudents.find(s => s.id === txn.studentId);
                                return (
                                    <tr key={txn.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                        <td className="py-3 text-sm text-gray-800 font-medium">{stu?.name || 'Unknown Student'}</td>
                                        <td className="py-3 text-xs text-gray-500">{stu?.className || '10th'} Morning</td>
                                        <td className="py-3 text-sm text-gray-800 font-medium">₹ {txn.amount.toLocaleString('en-IN')}</td>
                                        <td className="py-3 text-xs text-gray-600 flex items-center gap-1.5">
                                            {getMediumIcon(txn.medium, "w-3.5 h-3.5 text-blue-600")}
                                            {txn.medium}
                                        </td>
                                        <td className="py-3 text-xs text-gray-500">{txn.date}</td>
                                        <td className="py-3 text-center">
                                            <button className="bg-orange-50 text-orange-600 p-1.5 rounded-md hover:bg-orange-100 transition-colors inline-flex" title="Print PDF disabled in admin view">
                                                <Download className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {transactions.filter(t => allStudents.some(s => s.id === t.studentId)).length === 0 && (
                                <tr>
                                    <td colSpan={6} className="py-10 text-center text-sm text-gray-400">No collections recorded yet for this class.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="mt-6 border-t border-gray-100 pt-4">
                    <button className="border border-gray-300 text-blue-600 font-medium rounded-lg px-4 py-2 text-sm hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 w-full md:w-auto">
                        <Download className="w-4 h-4" />
                        Download Class Report
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

      </div>
    </div>
  );
}
