import React, { useState } from 'react';
import { User, BookOpen, GraduationCap, Bus, IndianRupee, Phone, Mail, Globe, ZoomIn, ZoomOut } from 'lucide-react';

interface FeeReceiptProps {
  receiptData: any;
}

export function FeeReceipt({ receiptData }: FeeReceiptProps) {
  const [zoomLevel, setZoomLevel] = useState(1);
  
  // Safe fallbacks
  const { 
    student = {}, 
    transaction = {}, 
    date = new Date().toISOString().split('T')[0]
  } = receiptData;

  const particulars = transaction.particulars || [
    { name: 'Tuition Fee', amount: 1500 },
    { name: 'Examination Fee', amount: 500 },
    { name: 'Transportation Fee', amount: 500 },
  ];
  
  const totalFees = particulars.reduce((acc: number, p: any) => acc + p.amount, 0);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 1.5));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.1, 0.4));

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Zoom Controls (Hidden in Print) */}
      <div className="absolute top-2 right-2 z-50 flex gap-2 print:hidden bg-white/80 p-1.5 rounded-full shadow-lg backdrop-blur-md border border-gray-200">
        <button 
          onClick={handleZoomOut} 
          className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-700"
          title="Zoom Out"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <button 
          onClick={handleZoomIn} 
          className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-700"
          title="Zoom In"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar flex items-start justify-center p-4 print:p-0">
        <div 
          className="bg-[#FAF9F6] border border-gray-200 shadow-sm font-sans text-gray-800 print:shadow-none print:border-none p-6 md:p-10 text-sm origin-top-left md:origin-top"
          style={{ 
            minWidth: '800px',
            transform: `scale(${zoomLevel})`, 
            transition: 'transform 0.2s ease-out',
            marginBottom: `${Math.max(0, (zoomLevel - 1) * 800)}px`
          }}
        >
          {/* Header */}
          <div className="flex justify-between items-start border-b border-gray-300 pb-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-[#A05C2B] rounded-full flex items-center justify-center text-white shrink-0 shadow-sm">
                <span className="text-3xl font-black">AJ</span>
              </div>
              <div>
                <h1 className="text-2xl font-black text-[#1F2937] tracking-tight">AMAR JYOTI PUBLIC SCHOOL</h1>
                <p className="text-gray-600 mt-1 font-medium">Jaitpura Rd., Raun, Bhind, (M.P.), 477335.</p>
                <p className="text-gray-600 font-medium">Mob.: 9977542243, 8269955732, 8839096026</p>
              </div>
            </div>
            <div className="border border-gray-300 rounded-xl p-4 bg-white min-w-[180px] text-right">
              <h2 className="text-[#A05C2B] font-bold text-lg mb-2">FEE RECEIPT</h2>
              <p className="text-xs text-gray-500 font-semibold uppercase">Receipt No</p>
              <p className="font-bold text-gray-900 mb-2">{transaction.receiptNo || 'REC/--/---'}</p>
              <p className="text-xs text-gray-500 font-semibold uppercase">Date</p>
              <p className="font-bold text-gray-900">{date}</p>
            </div>
          </div>

          {/* Student Info */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 flex gap-6">
            <div className="w-24 h-24 rounded-xl bg-gray-100 flex items-center justify-center border border-gray-200 shrink-0">
              <User className="w-10 h-10 text-gray-400" />
            </div>
            <div className="grid grid-cols-2 flex-1 gap-x-8 gap-y-3">
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase">Student Name</p>
                <p className="font-bold text-gray-900">{student.name || 'Student Name'}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase">Session</p>
                <p className="font-bold text-gray-900">2026-2027</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase">Class & Section</p>
                <p className="font-bold text-gray-900">{student.className || 'Class'} - {student.section || 'Sec'}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase">Father/Guardian</p>
                <p className="font-bold text-gray-900">Mr. {student.fathersName || student.guardianDetails?.guardianName || 'Father/Guardian Name'}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase">Roll No.</p>
                <p className="font-bold text-gray-900">{student.roll || student.rollNumber || '---'}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase">Mother's Name</p>
                <p className="font-bold text-gray-900">Mrs. {student.motherName || 'Mother Name'}</p>
              </div>
            </div>
          </div>

          {/* Total Fees Overview Cards */}
          <div className="mb-8">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Total Fees Overview</h3>
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                <BookOpen className="w-5 h-5 text-blue-500 mb-1" />
                <p className="text-[10px] text-gray-500 font-bold uppercase">Tuition Fee</p>
                <p className="font-bold text-gray-900">₹{particulars.find((p:any) => p.name === 'Tuition Fee')?.amount || 0}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                <GraduationCap className="w-5 h-5 text-purple-500 mb-1" />
                <p className="text-[10px] text-gray-500 font-bold uppercase">Exam Fee</p>
                <p className="font-bold text-gray-900">₹{particulars.find((p:any) => p.name === 'Examination Fee')?.amount || 0}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                <Bus className="w-5 h-5 text-green-500 mb-1" />
                <p className="text-[10px] text-gray-500 font-bold uppercase">Transport</p>
                <p className="font-bold text-gray-900">₹{particulars.find((p:any) => p.name === 'Transportation Fee')?.amount || 0}</p>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-sm">
                <IndianRupee className="w-5 h-5 text-orange-600 mb-1" />
                <p className="text-[10px] text-orange-600 font-bold uppercase">Total Fees</p>
                <p className="font-bold text-orange-700 text-lg">₹{totalFees}</p>
              </div>
            </div>
          </div>

          {/* Transaction History Table */}
          <div className="mb-8 bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="py-3 px-4 text-[10px] font-bold text-gray-500 uppercase">S.No</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-gray-500 uppercase">Date</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-gray-500 uppercase">Particulars</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-gray-500 uppercase">Payment Mode</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-gray-500 uppercase text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {particulars.map((item: any, idx: number) => (
                  <tr key={idx} className="border-b border-gray-100 last:border-0">
                    <td className="py-3 px-4 text-sm font-medium text-gray-500">{idx + 1}</td>
                    <td className="py-3 px-4 text-sm font-bold text-gray-900">{transaction.date || date}</td>
                    <td className="py-3 px-4 text-sm font-bold text-gray-900">{item.name}</td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-600">{transaction.paymentMode || 'Online'}</td>
                    <td className="py-3 px-4 text-sm font-bold text-gray-900 text-right">₹{item.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Payment Summary Cards */}
          <div className="grid grid-cols-3 gap-4 mb-12">
            <div className="bg-green-50 border border-green-200 p-4 rounded-xl">
               <p className="text-[10px] text-green-700 font-bold uppercase mb-1">Total Amount Paid</p>
               <p className="text-xl font-black text-green-800">₹{totalFees}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
               <p className="text-[10px] text-blue-700 font-bold uppercase mb-1">Total Fees</p>
               <p className="text-xl font-black text-blue-800">₹{totalFees}</p>
            </div>
            <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl">
               <p className="text-[10px] text-orange-700 font-bold uppercase mb-1">Total Dues</p>
               <p className="text-xl font-black text-orange-800">₹0</p>
            </div>
          </div>

          {/* Footer Signatures */}
          <div className="flex justify-between items-end px-8 mb-8 mt-12 relative">
             <img src="/school-seal.png" alt="Seal" crossOrigin="anonymous" className="absolute left-8 bottom-0 w-24 opacity-80" />
             <div className="text-center w-32 invisible">
                 {/* Empty space to balance flex */}
             </div>
             <div className="text-center invisible">
                 {/* Empty space */}
             </div>
             <div className="text-center z-10 bg-white/50 px-4 pb-2 pt-1 rounded-lg">
                <img src="/principal-signature.png" alt="Signature" crossOrigin="anonymous" className="w-32 h-12 object-contain mb-1 mix-blend-multiply" />
                <p className="text-xs font-bold text-gray-500 uppercase mt-1">Principal</p>
             </div>
          </div>

          {/* Footer Strip */}
          <div className="bg-gray-100 p-3 rounded-xl flex justify-center gap-8 border border-gray-200">
            <div className="flex items-center gap-2 text-gray-600">
              <Phone className="w-3.5 h-3.5" />
              <span className="text-xs font-bold">+91 98765 43210</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Mail className="w-3.5 h-3.5" />
              <span className="text-xs font-bold">info@amarjyoti.edu</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Globe className="w-3.5 h-3.5" />
              <span className="text-xs font-bold">www.amarjyoti.edu</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
