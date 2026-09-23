import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useFees, FeeTransaction, TOTAL_YEARLY_FEE, PaymentMedium, FeeRequest } from '../../hooks/useFees';
import { useAuth } from '../../context/AuthContext';
import { useSuccess } from '../../context/SuccessContext';
import { useLoader } from '../../context/LoaderContext';
import { downloadReceiptAsPDF, downloadReceiptAsJPG } from '../../utils/receiptDownloader';
import { NotificationService } from '../../services/NotificationService';
import {
  Wallet, CalendarDays, Banknote, Download, Image as ImageIcon,
  Smartphone, Landmark, Upload, AlertCircle, Clock, CheckCircle2, XCircle, CreditCard
} from 'lucide-react';

// ─── Hidden Receipt Component (for html2canvas capture) ──────

export function HiddenReceipt({ txn, studentName, className, section, rollNumber, fatherName, allTransactions, outstandingDue, isPreview = false }: {
  key?: React.Key;
  txn: FeeTransaction;
  studentName: string;
  className: string;
  section: string;
  rollNumber: string;
  fatherName: string;
  allTransactions: FeeTransaction[];
  outstandingDue: number;
  isPreview?: boolean;
}) {
  return (
    <div
      id={`receipt-${txn.id}`}
      style={{
        position: isPreview ? 'relative' : 'absolute', 
        left: isPreview ? '0' : '-9999px', 
        top: 0, width: '800px',
        fontFamily: "'Segoe UI', 'Inter', sans-serif", backgroundColor: '#FFFFFF', color: '#1F2937', padding: '40px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', borderBottom: '2px solid #E5E7EB', paddingBottom: '24px', marginBottom: '24px' }}>
        <img src="/Logo.png" alt="Logo" style={{ width: '80px', height: '80px', borderRadius: '16px', objectFit: 'cover' }} crossOrigin="anonymous" />
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 900, color: '#1F2937', margin: 0, letterSpacing: '-0.5px' }}>AMAR JYOTI PUBLIC SCHOOL</h1>
          <p style={{ fontSize: '13px', color: '#6B7280', margin: '4px 0 0', fontWeight: 500 }}>Jaitpura Rd., Raun, Bhind, (M.P.), 477335.</p>
          <p style={{ fontSize: '13px', color: '#6B7280', margin: '2px 0 0', fontWeight: 500 }}>Mob.: 9977542243, 8269955732, 8839096026</p>
        </div>
      </div>

      {/* Receipt Title */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0B1E40', margin: 0, letterSpacing: '2px', textTransform: 'uppercase' }}>Fee Receipt</h2>
        <p style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 600, marginTop: '4px' }}>Session 2026-27</p>
      </div>

      {/* Details Grid */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', gap: '20px' }}>
        <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '16px', flex: 1 }}>
          <p style={{ fontSize: '10px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', margin: '0 0 4px', lineHeight: '1.2' }}>Receipt No.</p>
          <p style={{ fontSize: '16px', fontWeight: 800, color: '#1F2937', margin: 0, lineHeight: '1.2' }}>{txn.receiptNo}</p>
        </div>
        <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '16px', flex: 1 }}>
          <p style={{ fontSize: '10px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', margin: '0 0 4px', lineHeight: '1.2' }}>Date</p>
          <p style={{ fontSize: '16px', fontWeight: 800, color: '#1F2937', margin: 0, lineHeight: '1.2' }}>{txn.date}</p>
        </div>
      </div>

      {/* Student Info */}
      <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          <div style={{ width: '50%', marginBottom: '16px' }}>
            <p style={{ fontSize: '10px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', margin: '0 0 4px', lineHeight: '1.2' }}>Student Name</p>
            <p style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', margin: 0, lineHeight: '1.2' }}>{studentName}</p>
          </div>
          <div style={{ width: '50%', marginBottom: '16px' }}>
            <p style={{ fontSize: '10px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', margin: '0 0 4px', lineHeight: '1.2' }}>Class & Section</p>
            <p style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', margin: 0, lineHeight: '1.2' }}>{className} - {section}</p>
          </div>
          <div style={{ width: '50%' }}>
            <p style={{ fontSize: '10px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', margin: '0 0 4px', lineHeight: '1.2' }}>Father/Guardian</p>
            <p style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', margin: 0, lineHeight: '1.2' }}>Mr. {fatherName}</p>
          </div>
          <div style={{ width: '50%' }}>
            <p style={{ fontSize: '10px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', margin: '0 0 4px', lineHeight: '1.2' }}>Roll Number</p>
            <p style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', margin: 0, lineHeight: '1.2' }}>{rollNumber}</p>
          </div>
        </div>
      </div>

      {/* Current Payment Details */}
      <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#1F2937', margin: '0 0 12px 0', textTransform: 'uppercase' }}>Current Payment Details</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
                <p style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', margin: '0 0 4px', lineHeight: '1.2' }}>DATE & MEDIUM</p>
                <p style={{ fontSize: '15px', fontWeight: 700, color: '#1F2937', margin: 0, lineHeight: '1.2' }}>{txn.date} via {txn.medium}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', margin: '0 0 4px', lineHeight: '1.2' }}>AMOUNT PAID</p>
                <p style={{ fontSize: '24px', fontWeight: 900, color: '#1F2937', margin: 0, lineHeight: '1.2' }}>₹{txn.amount.toLocaleString('en-IN')}</p>
            </div>
        </div>
      </div>

      {/* Overall Account Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', marginBottom: '32px' }}>
          <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', padding: '16px', flex: 1 }}>
              <p style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', margin: '0 0 4px', lineHeight: '1.2' }}>Total Yearly Fee</p>
              <p style={{ fontSize: '18px', fontWeight: 800, color: '#1F2937', margin: 0, lineHeight: '1.2' }}>₹{TOTAL_YEARLY_FEE.toLocaleString('en-IN')}</p>
          </div>
          <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', padding: '16px', flex: 1 }}>
              <p style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', margin: '0 0 4px', lineHeight: '1.2' }}>Current Outstanding Due</p>
              <p style={{ fontSize: '18px', fontWeight: 800, color: '#1F2937', margin: 0, lineHeight: '1.2' }}>₹{outstandingDue.toLocaleString('en-IN')}</p>
          </div>
      </div>

      {/* Full Transaction History Table */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#374151', margin: '0 0 12px 0', textTransform: 'uppercase', borderBottom: '2px solid #E5E7EB', paddingBottom: '8px' }}>Full Transaction History</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '12px' }}>
            <thead>
            <tr style={{ background: '#F3F4F6' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '10px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', borderBottom: '1px solid #E5E7EB' }}>Date</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '10px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', borderBottom: '1px solid #E5E7EB' }}>Receipt No</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '10px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', borderBottom: '1px solid #E5E7EB' }}>Medium</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: '10px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', borderBottom: '1px solid #E5E7EB' }}>Amount</th>
            </tr>
            </thead>
            <tbody>
            {allTransactions.map(t => (
                <tr key={t.id} style={{ background: t.id === txn.id ? '#F0FDF4' : 'transparent' }}>
                    <td style={{ padding: '8px 12px', fontSize: '12px', fontWeight: 500, borderBottom: '1px solid #F3F4F6' }}>
                        {t.date} {t.id === txn.id && <span style={{ color: '#166534', fontWeight: 700, fontSize: '10px', marginLeft: '4px' }}>(This Receipt)</span>}
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: '12px', fontWeight: 600, borderBottom: '1px solid #F3F4F6' }}>{t.receiptNo}</td>
                    <td style={{ padding: '8px 12px', fontSize: '12px', fontWeight: 600, borderBottom: '1px solid #F3F4F6' }}>{t.medium}</td>
                    <td style={{ padding: '8px 12px', fontSize: '12px', fontWeight: 700, textAlign: 'right', borderBottom: '1px solid #F3F4F6' }}>₹{t.amount.toLocaleString('en-IN')}</td>
                </tr>
            ))}
            </tbody>
            <tfoot>
            <tr>
                <td colSpan={3} style={{ padding: '10px 12px', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: '#1F2937', borderTop: '2px solid #E5E7EB' }}>Total Amount Paid</td>
                <td style={{ padding: '10px 12px', fontSize: '14px', fontWeight: 900, textAlign: 'right', color: '#1F2937', borderTop: '2px solid #E5E7EB' }}>
                    ₹{allTransactions.reduce((sum, t) => sum + t.amount, 0).toLocaleString('en-IN')}
                </td>
            </tr>
            </tfoot>
        </table>
      </div>

      {/* Signatures */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 40px', marginTop: '60px', marginBottom: '16px', position: 'relative' }}>
        <img src="/school-seal.png" alt="Seal" crossOrigin="anonymous" style={{ position: 'absolute', left: '40px', bottom: '0px', width: '100px', opacity: 0.8 }} />
        <div style={{ textAlign: 'center', zIndex: 10, visibility: 'hidden' }}>
          <div style={{ width: '140px', borderBottom: '1px solid #9CA3AF', marginBottom: '8px' }}></div>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', margin: 0 }}>Class Teacher</p>
        </div>
        <div style={{ textAlign: 'center', zIndex: 10, visibility: 'hidden' }}>
          <p style={{ fontSize: '10px', color: '#9CA3AF', fontStyle: 'italic', margin: 0 }}>* This is a computer-generated receipt</p>
        </div>
        <div style={{ textAlign: 'center', zIndex: 10 }}>
          <img src="/principal-signature.png" alt="Signature" crossOrigin="anonymous" style={{ width: '170px', height: '55px', objectFit: 'contain', marginBottom: '-2px', mixBlendMode: 'multiply' }} />
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', margin: 0 }}>Principal</p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ███  STUDENT FEES — FLAT ENTERPRISE DASHBOARD
// ═══════════════════════════════════════════════════════════════════

export function StudentFees() {
  const { currentUser } = useAuth();
  const { getStudentFeeBreakdown, getStudentTransactions, getStudentFeeRequests, submitFeeRequest } = useFees();
  const { triggerSuccess } = useSuccess();
  const { runWithLoader } = useLoader();
  
  const [activeTab, setActiveTab] = useState('Fee Structure');

  // Request Form State
  const [requestAmount, setRequestAmount] = useState('');
  const [requestMethod, setRequestMethod] = useState<PaymentMedium>('UPI');
  const [proofImage, setProofImage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!currentUser) return null;

  const breakdown = getStudentFeeBreakdown(currentUser.id);
  const myTransactions = getStudentTransactions(currentUser.id);
  const myRequests = getStudentFeeRequests(currentUser.id);

  const [upiConfig, setUpiConfig] = useState<{ upiId: string, qrBase64: string | null } | null>(null);
  const [paymentTimer, setPaymentTimer] = useState(300); // 5 mins
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    try {
        const stored = localStorage.getItem('ajps_upi_config');
        if (stored) setUpiConfig(JSON.parse(stored));
    } catch {}
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);

  useEffect(() => {
      let interval: NodeJS.Timeout;
      if (activeTab === 'Pay Online' && requestMethod === 'UPI' && paymentTimer > 0) {
          interval = setInterval(() => {
              setPaymentTimer(prev => prev - 1);
          }, 1000);
      } else if (activeTab !== 'Pay Online' || requestMethod !== 'UPI') {
          setPaymentTimer(300); // Reset timer
      }
      return () => clearInterval(interval);
  }, [activeTab, requestMethod, paymentTimer]);

  const formatTimer = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getMediumIcon = (method: PaymentMedium, className: string = "w-5 h-5 mb-1") => {
    switch (method) {
        case 'UPI': return <Smartphone className={className} />;
        case 'Net Banking': return <Landmark className={className} />;
        default: return <Wallet className={className} />;
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side compression using canvas to save localStorage space
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800;
            const scaleSize = MAX_WIDTH / img.width;
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scaleSize;
            
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            // Compress to JPEG with 0.7 quality
            const base64Str = canvas.toDataURL('image/jpeg', 0.7);
            setProofImage(base64Str);
        };
        img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitRequest = () => {
    if (!requestAmount || Number(requestAmount) <= 0 || !proofImage) return;

    runWithLoader(() => {
        submitFeeRequest(currentUser.id, Number(requestAmount), requestMethod, proofImage);
        
        NotificationService.sendNotification({
            recipientIds: ['admin'], // Simulated admin ID
            title: '🆕 New Payment Request',
            message: `${currentUser.name} has submitted a payment of ₹${Number(requestAmount).toLocaleString('en-IN')}.`,
            type: 'info',
            actionPath: '/fees',
        });

        triggerSuccess('Payment request submitted successfully! Pending admin approval.');
        setRequestAmount('');
        setProofImage(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    });
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        
        {/* ── Header ─────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fees & Payments</h1>
          <p className="text-sm text-gray-500 mt-1">Home &gt; Fees & Payments</p>
        </div>

        {/* ── Navigation Tabs ────────────────────────────────── */}
        <div className="flex flex-nowrap overflow-x-auto border-b border-gray-200 scrollbar-hide">
          {['Pay Online', 'Fee Structure', 'Receipts'].map(tab => {
            const isDisabled = tab === 'Pay Online' && !upiConfig?.upiId;
            return (
              <button
                key={tab}
                onClick={() => !isDisabled && setActiveTab(tab)}
                disabled={isDisabled}
                className={`whitespace-nowrap px-6 py-3 text-sm transition-colors ${
                  activeTab === tab
                    ? 'text-gray-900 font-semibold border-b-2 border-yellow-600'
                    : 'text-gray-500 font-medium hover:text-gray-700'
                } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={isDisabled ? 'Online payments are currently disabled by Admin' : ''}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* ── TAB CONTENT: Pay Online ────────────────────────── */}
        {activeTab === 'Pay Online' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left: Request Form */}
              <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h2 className="font-semibold text-lg text-gray-900 mb-5">Submit Payment Details</h2>
                  
                  <div className="space-y-5">
                      <div>
                          <label className="block text-xs text-gray-600 font-medium mb-1.5">Amount Paid (₹)</label>
                          <input
                            type="number"
                            placeholder="Enter amount"
                            value={requestAmount}
                            onChange={e => setRequestAmount(e.target.value)}
                            className="border border-gray-200 rounded-lg p-2.5 w-full text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium"
                          />
                      </div>

                      <div>
                          <label className="block text-xs text-gray-600 font-medium mb-2">Payment Method</label>
                          <div className="grid grid-cols-2 gap-3">
                              {(['UPI', 'Net Banking'] as PaymentMedium[]).map(m => {
                                  const isActive = requestMethod === m;
                                  return (
                                      <button
                                          key={m}
                                          type="button"
                                          onClick={() => setRequestMethod(m)}
                                          className={`border rounded-lg p-3 flex flex-col items-center justify-center text-sm font-medium transition-colors ${
                                              isActive
                                              ? 'border-blue-600 bg-blue-50 text-blue-700'
                                              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                          }`}
                                      >
                                          {getMediumIcon(m, "w-6 h-6 mb-2")}
                                          <span>{m}</span>
                                      </button>
                                  );
                              })}
                          </div>
                      </div>

                      {requestMethod === 'UPI' && upiConfig && (
                          <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-sm">
                              {isMobile ? (
                                  <div className="w-full flex flex-col items-center">
                                      <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-3">
                                          <Smartphone className="w-8 h-8" />
                                      </div>
                                      <h3 className="text-lg font-bold text-gray-900 mb-1">Pay with UPI App</h3>
                                      <p className="text-sm text-gray-500 mb-5">Open any UPI app on your phone to complete the payment.</p>
                                      
                                      <a 
                                          href={`upi://pay?pa=${upiConfig.upiId}&pn=School%20Fee&am=${requestAmount || 0}&cu=INR`}
                                          className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 block text-center"
                                      >
                                          Open UPI App
                                      </a>
                                  </div>
                              ) : (
                                  <div className="w-full flex flex-col items-center relative overflow-hidden">
                                      {/* Flipkart-style header */}
                                      <div className="flex items-center justify-between w-full bg-blue-50 px-4 py-3 rounded-xl mb-6">
                                          <div className="flex items-center gap-2">
                                              <Smartphone className="w-5 h-5 text-blue-600" />
                                              <span className="font-semibold text-blue-900 text-sm">Scan to Pay</span>
                                          </div>
                                          <div className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-full shadow-sm">
                                              <div className={`w-2 h-2 rounded-full ${paymentTimer < 60 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                                              <span className={`font-mono font-bold text-sm ${paymentTimer < 60 ? 'text-red-600' : 'text-gray-800'}`}>
                                                  {formatTimer(paymentTimer)}
                                              </span>
                                          </div>
                                      </div>

                                      {/* QR Section */}
                                      {paymentTimer > 0 ? (
                                          <div className="bg-white p-3 border-2 border-gray-200 rounded-2xl shadow-sm mb-4 relative">
                                              <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-blue-500 rounded-tl-lg -translate-x-1 -translate-y-1"></div>
                                              <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-blue-500 rounded-tr-lg translate-x-1 -translate-y-1"></div>
                                              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-blue-500 rounded-bl-lg -translate-x-1 translate-y-1"></div>
                                              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-blue-500 rounded-br-lg translate-x-1 translate-y-1"></div>
                                              
                                              {upiConfig.qrBase64 ? (
                                                  <img src={upiConfig.qrBase64} alt="UPI QR" className="w-40 h-40 object-contain" />
                                              ) : (
                                                  <div className="w-40 h-40 bg-gray-50 flex items-center justify-center text-gray-400 text-sm">No QR</div>
                                              )}
                                          </div>
                                      ) : (
                                          <div className="w-40 h-40 bg-gray-50 flex flex-col items-center justify-center rounded-2xl border border-gray-200 mb-4">
                                              <AlertCircle className="w-8 h-8 text-red-400 mb-2" />
                                              <p className="text-xs font-medium text-red-600">Session Expired</p>
                                              <button onClick={() => setPaymentTimer(300)} className="text-[10px] bg-white border border-gray-200 px-2 py-1 rounded mt-2 hover:bg-gray-50">Refresh</button>
                                          </div>
                                      )}

                                      <p className="text-xs font-mono bg-gray-100 text-gray-700 px-4 py-1.5 rounded-full mt-2 border border-gray-200">
                                          {upiConfig.upiId}
                                      </p>
                                      
                                      <p className="text-[10px] text-gray-400 mt-4 max-w-[200px]">Keep your UPI app ready and scan the QR code to complete the payment.</p>
                                  </div>
                              )}
                          </div>
                      )}

                      <div>
                          <label className="block text-xs text-gray-600 font-medium mb-1.5">Upload Payment Screenshot <span className="text-red-500">*</span></label>
                          
                          <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              ref={fileInputRef}
                              onChange={handleImageUpload}
                          />

                          {proofImage ? (
                              <div className="relative border border-gray-200 rounded-lg p-2 flex flex-col items-center justify-center bg-gray-50">
                                  <img src={proofImage} alt="Proof Preview" className="h-32 object-contain rounded mb-2" />
                                  <button 
                                      onClick={() => { setProofImage(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                                      className="absolute top-2 right-2 p-1 bg-white rounded-full text-gray-500 shadow hover:text-red-500 transition-colors"
                                  >
                                      <XCircle className="w-5 h-5" />
                                  </button>
                              </div>
                          ) : (
                              <div 
                                  onClick={() => fileInputRef.current?.click()}
                                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 transition-colors"
                              >
                                  <Upload className="w-6 h-6 text-gray-400 mb-2" />
                                  <p className="text-sm text-gray-700 font-medium mb-1">Click to Upload Screenshot</p>
                                  <p className="text-xs text-gray-400">JPG or PNG (max 5MB)</p>
                              </div>
                          )}
                      </div>

                      <div className="bg-blue-50 text-blue-800 p-3 rounded-lg flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <p className="text-xs leading-relaxed">By submitting this form, you request admin approval for your payment. Fake or duplicate receipts will result in strict action.</p>
                      </div>

                      <button
                        onClick={handleSubmitRequest}
                        disabled={!requestAmount || Number(requestAmount) <= 0 || !proofImage}
                        className="w-full bg-[#0B1E40] text-white rounded-lg py-3 mt-2 flex items-center justify-center gap-2 hover:bg-blue-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                      >
                        <Wallet className="w-4 h-4" />
                        Submit Payment Request
                      </button>
                  </div>
              </div>

              {/* Right: Pending/Recent Requests */}
              <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
                  <h2 className="font-semibold text-lg text-gray-900 mb-5">My Online Requests</h2>
                  
                  <div className="overflow-y-auto flex-1 max-h-[500px]">
                      {myRequests.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full text-gray-400 py-10">
                              <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                              <p className="text-sm">No online payment requests found.</p>
                          </div>
                      ) : (
                          <div className="space-y-3">
                              {myRequests.slice().reverse().map(req => (
                                  <div key={req.id} className="border border-gray-100 rounded-xl p-4 flex items-center justify-between">
                                      <div className="flex items-center gap-4">
                                          <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100">
                                              {getMediumIcon(req.method, "w-6 h-6 text-gray-600")}
                                          </div>
                                          <div>
                                              <p className="text-sm font-bold text-gray-900">₹ {req.amount.toLocaleString('en-IN')}</p>
                                              <p className="text-xs text-gray-500 mt-0.5">{req.requestDate} via {req.method}</p>
                                          </div>
                                      </div>
                                      <div className="flex flex-col items-end">
                                          {req.status === 'Pending' && (
                                              <span className="flex items-center gap-1 text-xs font-medium text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full">
                                                  <Clock className="w-3.5 h-3.5" /> Pending
                                              </span>
                                          )}
                                          {req.status === 'Approved' && (
                                              <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                                                  <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                                              </span>
                                          )}
                                          {req.status === 'Rejected' && (
                                              <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2.5 py-1 rounded-full">
                                                  <XCircle className="w-3.5 h-3.5" /> Rejected
                                              </span>
                                          )}
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              </div>
          </div>
        )}

        {/* ── TAB CONTENT: Fee Structure ─────────────────────── */}
        {activeTab === 'Fee Structure' && (
          <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
                  <div className="bg-blue-50 text-blue-600 w-12 h-12 rounded-full flex items-center justify-center shrink-0">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Total Yearly Fee</p>
                    <p className="text-2xl font-bold text-gray-900 leading-tight">₹ {TOTAL_YEARLY_FEE.toLocaleString('en-IN')}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Session 2026-27</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
                  <div className="bg-green-50 text-green-600 w-12 h-12 rounded-full flex items-center justify-center shrink-0">
                    <Banknote className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Total Paid</p>
                    <p className="text-2xl font-bold text-gray-900 leading-tight">₹ {breakdown.totalPaid.toLocaleString('en-IN')}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">As of Today</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
                  <div className="bg-red-50 text-red-500 w-12 h-12 rounded-full flex items-center justify-center shrink-0">
                    <CalendarDays className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Outstanding Dues</p>
                    <p className="text-2xl font-bold text-gray-900 leading-tight">₹ {breakdown.outstanding.toLocaleString('en-IN')}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Pending Amount</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#0B1E40] text-white rounded-2xl shadow-sm p-6 relative overflow-hidden">
                    <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500 rounded-full opacity-20 blur-2xl"></div>
                    <h2 className="font-semibold text-lg mb-2 relative z-10">Pay Outstanding Dues</h2>
                    <p className="text-sm text-blue-200 mb-6 relative z-10">You have ₹{breakdown.outstanding.toLocaleString('en-IN')} pending for this academic year.</p>
                    <button 
                        onClick={() => setActiveTab('Pay Online')}
                        disabled={breakdown.outstanding <= 0}
                        className="w-full bg-white text-[#0B1E40] rounded-lg py-3 font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative z-10"
                    >
                        {breakdown.outstanding > 0 ? 'Pay Now Online' : 'All Dues Cleared!'}
                    </button>
                </div>
              </div>
          </div>
        )}

        {/* ── TAB CONTENT: Receipts (History) ────────────────── */}
        {activeTab === 'Receipts' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="font-semibold text-lg text-gray-900">Approved Payments</h2>
                    <button className="text-sm font-medium text-blue-600 hover:text-blue-700">View All</button>
                </div>

                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse min-w-[500px]">
                        <thead>
                            <tr>
                                <th className="text-xs text-gray-500 font-medium py-3 border-b border-gray-100">Date</th>
                                <th className="text-xs text-gray-500 font-medium py-3 border-b border-gray-100">Amount</th>
                                <th className="text-xs text-gray-500 font-medium py-3 border-b border-gray-100">Method</th>
                                <th className="text-xs text-gray-500 font-medium py-3 border-b border-gray-100">Receipt No</th>
                                <th className="text-xs text-gray-500 font-medium py-3 border-b border-gray-100 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {myTransactions.slice().reverse().map(txn => (
                                <tr key={txn.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                    <td className="py-3 text-xs text-gray-500">{txn.date}</td>
                                    <td className="py-3 text-sm text-gray-800 font-medium">₹ {txn.amount.toLocaleString('en-IN')}</td>
                                    <td className="py-3 text-xs text-gray-600 flex items-center gap-1.5 mt-1">
                                        {txn.medium === 'UPI' && <Smartphone className="w-3.5 h-3.5 text-blue-600" />}
                                        {txn.medium === 'Cash' && <Banknote className="w-3.5 h-3.5 text-green-600" />}
                                        {txn.medium === 'Cheque' && <CreditCard className="w-3.5 h-3.5 text-gray-500" />}
                                        {txn.medium === 'Net Banking' && <Landmark className="w-3.5 h-3.5 text-blue-700" />}
                                        {txn.medium}
                                    </td>
                                    <td className="py-3 text-xs text-gray-500 font-mono">{txn.receiptNo}</td>
                                    <td className="py-3 text-center flex items-center justify-center gap-2">
                                        <button 
                                            onClick={() => downloadReceiptAsPDF(`receipt-${txn.id}`, `Receipt_${txn.receiptNo}.pdf`)}
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
                            ))}
                            {myTransactions.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-10 text-center text-sm text-gray-400">No approved payments yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

      </div>

      {/* HIDDEN RECEIPT RENDERERS */}
      {myTransactions.map(txn => (
        <HiddenReceipt
          key={txn.id}
          txn={txn}
          studentName={currentUser.name}
          className={currentUser.className || 'N/A'}
          section={currentUser.section || 'N/A'}
          rollNumber={currentUser.rollNumber || 'N/A'}
          fatherName={currentUser.fathersName || currentUser.guardianDetails?.guardianName || 'N/A'}
          allTransactions={myTransactions}
          outstandingDue={breakdown.outstanding}
        />
      ))}
    </div>
  );
}
