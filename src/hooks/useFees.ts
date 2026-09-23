import { useState, useEffect, useCallback } from 'react';
import { NotificationService } from '../services/NotificationService';

// ─── Types ───────────────────────────────────────────────────────

export type PaymentMedium = 'Cash' | 'UPI' | 'Cheque' | 'Net Banking';

export interface FeeTransaction {
  id: string;
  studentId: string;
  amount: number;
  date: string;
  medium: PaymentMedium;
  receiptNo: string;
  key?: string;
}

export interface FeeRequest {
  id: string;
  studentId: string;
  amount: number;
  method: PaymentMedium;
  proofImage: string; // base64 string
  requestDate: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface StudentFeeBreakdown {
  totalFee: number;
  totalPaid: number;
  outstanding: number;
}

// ─── Constants ───────────────────────────────────────────────────

export const TOTAL_YEARLY_FEE = 15000;

const FEES_KEY = 'ajps_fee_transactions';
const REQUESTS_KEY = 'ajps_fee_requests';

// ─── Hook ────────────────────────────────────────────────────────

export function useFees() {
  const [transactions, setTransactions] = useState<FeeTransaction[]>(() => {
    try {
      const stored = localStorage.getItem(FEES_KEY);
      if (stored) return JSON.parse(stored) || [];
    } catch (e) { /* */ }
    return [];
  });

  const [feeRequests, setFeeRequests] = useState<FeeRequest[]>(() => {
    try {
      const stored = localStorage.getItem(REQUESTS_KEY);
      if (stored) return JSON.parse(stored) || [];
    } catch (e) { /* */ }
    return [];
  });

  useEffect(() => {
    const handleSync = () => {
      try {
        const storedTxns = localStorage.getItem(FEES_KEY);
        if (storedTxns) setTransactions(JSON.parse(storedTxns) || []);
        
        const storedReqs = localStorage.getItem(REQUESTS_KEY);
        if (storedReqs) setFeeRequests(JSON.parse(storedReqs) || []);
      } catch (e) { /* */ }
    };
    window.addEventListener('fees_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('fees_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const saveAndBroadcastTxns = useCallback((updated: FeeTransaction[]) => {
    localStorage.setItem(FEES_KEY, JSON.stringify(updated));
    setTransactions(updated);
    window.dispatchEvent(new Event('fees_updated'));
  }, []);

  const saveAndBroadcastReqs = useCallback((updated: FeeRequest[]) => {
    localStorage.setItem(REQUESTS_KEY, JSON.stringify(updated));
    setFeeRequests(updated);
    window.dispatchEvent(new Event('fees_updated'));
  }, []);

  const getStudentTransactions = useCallback((studentId: string): FeeTransaction[] => {
    return transactions.filter(t => t.studentId === studentId);
  }, [transactions]);

  const getStudentFeeRequests = useCallback((studentId: string): FeeRequest[] => {
    return feeRequests.filter(r => r.studentId === studentId);
  }, [feeRequests]);

  const getStudentFeeBreakdown = useCallback((studentId: string): StudentFeeBreakdown => {
    const studentTxns = transactions.filter(t => t.studentId === studentId);
    const totalPaid = studentTxns.reduce((sum, t) => sum + t.amount, 0);
    return {
      totalFee: TOTAL_YEARLY_FEE,
      totalPaid,
      outstanding: Math.max(0, TOTAL_YEARLY_FEE - totalPaid),
    };
  }, [transactions]);

  const collectFee = useCallback((
    studentId: string,
    amount: number,
    medium: PaymentMedium,
    specificDate?: string
  ): FeeTransaction => {
    // Generate formatted date (DDMMYYYY)
    const d = new Date(specificDate || new Date());
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const dateStrFormatted = `${day}${month}${year}`;

    // Get RollNo
    let rollNo = 'N/A';
    try {
      const users = JSON.parse(localStorage.getItem('ajps_users') || '[]');
      const student = users.find((u: any) => u.id === studentId);
      if (student && student.rollNumber) {
        rollNo = student.rollNumber;
      }
    } catch { /* */ }

    // Deduplicate receipt number by appending a random suffix if needed, but normally {RollNo}-{DDMMYYYY} is fine.
    // However, if multiple payments happen on same day, we append a suffix. We will just use the base format and let random suffix handle collisions if we want, but user requested strict format.
    // If strict format is exactly `{RollNo}-{DDMMYYYY}`, we will use it. If there's a duplicate, we can append `-1`, `-2`.
    const baseReceipt = `${rollNo}-${dateStrFormatted}`;
    
    const current = (() => {
      try {
        const s = localStorage.getItem(FEES_KEY);
        return s ? JSON.parse(s) : [];
      } catch { return []; }
    })();

    // Check existing receipts for this student on this day
    const existingCount = current.filter((t: FeeTransaction) => t.receiptNo.startsWith(baseReceipt)).length;
    const finalReceiptNo = existingCount > 0 ? `${baseReceipt}-${existingCount + 1}` : baseReceipt;

    const newTxn: FeeTransaction = {
      id: `fee_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      studentId,
      amount,
      date: specificDate || new Date().toISOString().split('T')[0],
      medium,
      receiptNo: finalReceiptNo,
    };

    const updated = [...current, newTxn];
    saveAndBroadcastTxns(updated);
    return newTxn;
  }, [saveAndBroadcastTxns]);

  const submitFeeRequest = useCallback((
    studentId: string,
    amount: number,
    method: PaymentMedium,
    proofImage: string
  ): FeeRequest => {
    const newReq: FeeRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      studentId,
      amount,
      method,
      proofImage,
      requestDate: new Date().toISOString().split('T')[0],
      status: 'Pending'
    };

    const updated = [...feeRequests, newReq];
    saveAndBroadcastReqs(updated);

    NotificationService.sendNotification({
      role: 'admin',
      title: 'Fee Payment Approval Request',
      message: `A new fee payment request of ₹${amount} has been submitted via ${method} and is pending your approval.`,
      type: 'FEE_ALERT'
    });

    return newReq;
  }, [feeRequests, saveAndBroadcastReqs]);

  const approveFeeRequest = useCallback((requestId: string): FeeTransaction | null => {
    const req = feeRequests.find(r => r.id === requestId);
    if (!req || req.status !== 'Pending') return null;

    // Create transaction with the request's original date
    const txn = collectFee(req.studentId, req.amount, req.method, req.requestDate);

    // Update request status
    const updatedReqs = feeRequests.map(r => 
        r.id === requestId ? { ...r, status: 'Approved' as const } : r
    );
    saveAndBroadcastReqs(updatedReqs);
    return txn;
  }, [feeRequests, collectFee, saveAndBroadcastReqs]);

  const rejectFeeRequest = useCallback((requestId: string) => {
    const updatedReqs = feeRequests.map(r => 
        r.id === requestId ? { ...r, status: 'Rejected' as const } : r
    );
    saveAndBroadcastReqs(updatedReqs);
  }, [feeRequests, saveAndBroadcastReqs]);

  return {
    transactions,
    feeRequests,
    getStudentTransactions,
    getStudentFeeRequests,
    getStudentFeeBreakdown,
    collectFee,
    submitFeeRequest,
    approveFeeRequest,
    rejectFeeRequest
  };
}
