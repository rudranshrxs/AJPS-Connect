import React from 'react';
import { 
  Printer, 
  Book, 
  BookOpen, 
  Calculator, 
  Atom, 
  Globe, 
  Trophy, 
  Award,
  Download
} from 'lucide-react';

interface SubjectMark {
  subject: string;
  maxMarks: number;
  obtained: number;
  grade: string;
  icon: React.ElementType;
}

interface ReportCardProps {
  student: {
    name: string;
    fatherName: string;
    motherName: string;
    className: string;
    rollNo: string;
    section: string;
    avatarUrl: string;
  };
  examInfo: {
    examName: string;
    session: string;
    date: string;
  };
  marks: SubjectMark[];
  summary: {
    totalMarks: number;
    maxTotal: number;
    percentage: number;
    overallGrade: string;
    rank: number;
  };
  remarks: string;
}

export function ReportCard({ student, examInfo, marks, summary, remarks }: ReportCardProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="relative w-full max-w-[210mm] mx-auto">
      {/* Action Bar (Hidden in Print) */}
      <div className="flex justify-end mb-4 print:hidden gap-2">
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 bg-[#A05C2B] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-[#8e5025] transition-colors"
        >
          <Printer className="w-4 h-4" /> Print / Download
        </button>
      </div>

      {/* A4 Report Card Container */}
      <div className="bg-[#FAF9F6] w-full min-h-[297mm] p-8 md:p-12 shadow-2xl rounded-none md:rounded-2xl border border-gray-200 print:shadow-none print:border-none print:p-0 print:m-0 text-[#1F2937]">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-8 relative">
          <div className="absolute left-0 top-0">
            <div className="w-20 h-20 bg-[#A05C2B] rounded-full flex items-center justify-center text-white shadow-lg">
              <span className="text-3xl font-black">AJ</span>
            </div>
          </div>
          <h1 className="text-3xl font-black text-[#1E3A8A] tracking-wider text-center mt-2">
            AMAR JYOTI PUBLIC SCHOOL
          </h1>
          <p className="text-sm font-semibold text-gray-500 mt-1">
            Affiliated to CBSE, New Delhi
          </p>
          <div className="mt-6 bg-[#1E3A8A] text-white px-8 py-2 rounded-full shadow-md border-2 border-white/50">
            <h2 className="text-lg font-bold tracking-widest uppercase">Report Card</h2>
          </div>
        </div>

        {/* Top Info Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm text-center">
            <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Examination</p>
            <p className="text-sm font-bold text-[#A05C2B]">{examInfo.examName}</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm text-center">
            <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Session</p>
            <p className="text-sm font-bold text-[#A05C2B]">{examInfo.session}</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm text-center">
            <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Date of Issue</p>
            <p className="text-sm font-bold text-[#A05C2B]">{examInfo.date}</p>
          </div>
        </div>

        {/* Student Info Grid */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8 flex items-center gap-8">
          <div className="w-24 h-24 rounded-full border-4 border-[#FDF7EE] shadow-sm overflow-hidden shrink-0">
            <img src={student.avatarUrl || "https://ui-avatars.com/api/?name=Student&background=A05C2B&color=fff"} alt={student.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 grid grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400">Student Name</p>
              <p className="text-base font-bold text-[#1F2937] border-b border-gray-100 pb-1">{student.name}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400">Class & Section</p>
              <p className="text-base font-bold text-[#1F2937] border-b border-gray-100 pb-1">{student.className} - {student.section}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400">Father's Name</p>
              <p className="text-sm font-semibold text-gray-600 border-b border-gray-100 pb-1">{student.fatherName}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400">Roll No.</p>
              <p className="text-sm font-semibold text-gray-600 border-b border-gray-100 pb-1">{student.rollNo}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400">Mother's Name</p>
              <p className="text-sm font-semibold text-gray-600 border-b border-gray-100 pb-1">{student.motherName}</p>
            </div>
          </div>
        </div>

        {/* Marks Table */}
        <div className="mb-8">
          <div className="flex px-4 py-3 bg-[#FDF7EE] rounded-t-xl border-b-2 border-[#A05C2B]/20">
            <div className="flex-[2] text-xs font-bold text-[#A05C2B] uppercase tracking-wider">Subject</div>
            <div className="flex-1 text-center text-xs font-bold text-[#A05C2B] uppercase tracking-wider">Max Marks</div>
            <div className="flex-1 text-center text-xs font-bold text-[#A05C2B] uppercase tracking-wider">Marks Obtained</div>
            <div className="flex-1 text-center text-xs font-bold text-[#A05C2B] uppercase tracking-wider">Grade</div>
          </div>
          <div className="bg-white rounded-b-xl border border-t-0 border-gray-200 shadow-sm divide-y divide-gray-100">
            {marks.map((mark, i) => {
              const SubjectIcon = mark.icon;
              return (
                <div key={i} className="flex px-4 py-4 items-center">
                  <div className="flex-[2] flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100 text-[#1E3A8A]">
                      <SubjectIcon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold text-gray-800">{mark.subject}</span>
                  </div>
                  <div className="flex-1 text-center font-semibold text-gray-500">{mark.maxMarks}</div>
                  <div className="flex-1 text-center font-bold text-gray-900">{mark.obtained}</div>
                  <div className="flex-1 flex justify-center">
                    <span className="bg-green-100 text-green-700 text-xs font-black px-3 py-1 rounded-md shadow-sm border border-green-200">
                      {mark.grade}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary Area */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex flex-col items-center justify-center shadow-sm">
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">Total Marks</p>
            <p className="text-xl font-black text-blue-900">{summary.totalMarks} <span className="text-sm font-semibold text-blue-400">/ {summary.maxTotal}</span></p>
          </div>
          <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl flex flex-col items-center justify-center shadow-sm">
            <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mb-1">Percentage</p>
            <p className="text-xl font-black text-purple-900">{summary.percentage.toFixed(1)}%</p>
          </div>
          <div className="bg-green-50 border border-green-100 p-4 rounded-xl flex flex-col items-center justify-center shadow-sm">
            <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider mb-1">Overall Grade</p>
            <p className="text-xl font-black text-green-900 flex items-center gap-1">
              <Award className="w-5 h-5 text-green-600" /> {summary.overallGrade}
            </p>
          </div>
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex flex-col items-center justify-center shadow-sm relative overflow-hidden">
            <Trophy className="w-16 h-16 text-amber-200 absolute -right-2 -bottom-2 opacity-50" />
            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1 relative z-10">Class Rank</p>
            <p className="text-2xl font-black text-amber-900 relative z-10">#{summary.rank}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 border border-gray-200 bg-white rounded-xl p-6 shadow-sm">
          <div className="mb-16">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Class Teacher's Remarks</p>
            <p className="text-sm font-medium text-gray-700 italic border-b border-dashed border-gray-300 pb-2">
              "{remarks}"
            </p>
          </div>
          <div className="flex justify-between items-end px-8">
            <div className="text-center">
              <div className="w-32 border-b-2 border-gray-800 mb-2"></div>
              <p className="text-xs font-bold text-gray-500 uppercase">Class Teacher</p>
            </div>
            <div className="text-center">
              <div className="w-32 border-b-2 border-gray-800 mb-2"></div>
              <p className="text-xs font-bold text-gray-500 uppercase">Principal</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
