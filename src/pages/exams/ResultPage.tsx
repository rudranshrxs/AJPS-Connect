import React from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { ResultCard, Student } from '../../components/academic/ResultCard';
import { Printer, Download } from 'lucide-react';

export const ResultPage: React.FC = () => {
  const className = "10th";
  const section = "A";
  const session = "2025 - 26";
  const resultDate = "30-04-2026";
  const examTitle = "ANNUAL RESULT (2025-26)";
  const totalMarks = 600;
  const subjects = ["English", "Hindi", "Mathematics", "Science", "Social Science", "Computer"];

  const students: Student[] = [
    { sNo: 1, rollNo: 101, name: "Aditi Sharma", english: 92, hindi: 88, mathematics: 95, science: 90, socialScience: 85, computer: 93 },
    { sNo: 2, rollNo: 102, name: "Rohan Singh", english: 85, hindi: 80, mathematics: 88, science: 84, socialScience: 82, computer: 87 },
    { sNo: 3, rollNo: 103, name: "Priya Verma", english: 96, hindi: 94, mathematics: 92, science: 89, socialScience: 90, computer: 95 },
    { sNo: 4, rollNo: 104, name: "Aman Kumar", english: 78, hindi: 75, mathematics: 82, science: 80, socialScience: 77, computer: 81 },
    { sNo: 5, rollNo: 105, name: "Sneha Yadav", english: 88, hindi: 85, mathematics: 90, science: 87, socialScience: 83, computer: 89 },
    { sNo: 6, rollNo: 106, name: "Aditya Rajput", english: 82, hindi: 78, mathematics: 85, science: 83, socialScience: 80, computer: 84 },
    { sNo: 7, rollNo: 107, name: "Neha Gupta", english: 95, hindi: 92, mathematics: 96, science: 93, socialScience: 88, computer: 91 },
    { sNo: 8, rollNo: 108, name: "Harshita Tiwari", english: 86, hindi: 83, mathematics: 88, science: 84, socialScience: 81, computer: 86 },
    { sNo: 9, rollNo: 109, name: "Rahul Patel", english: 74, hindi: 70, mathematics: 76, science: 72, socialScience: 71, computer: 75 },
    { sNo: 10, rollNo: 110, name: "Pooja Mishra", english: 90, hindi: 87, mathematics: 93, science: 88, socialScience: 86, computer: 90 },
    { sNo: 11, rollNo: 111, name: "Karan Sahu", english: 81, hindi: 77, mathematics: 83, science: 80, socialScience: 78, computer: 82 },
    { sNo: 12, rollNo: 112, name: "Simran Khan", english: 93, hindi: 90, mathematics: 94, science: 91, socialScience: 87, computer: 92 },
    { sNo: 13, rollNo: 113, name: "Mohit Sharma", english: 76, hindi: 72, mathematics: 79, science: 75, socialScience: 73, computer: 78 },
    { sNo: 14, rollNo: 114, name: "Anjali Patel", english: 89, hindi: 86, mathematics: 91, science: 88, socialScience: 84, computer: 87 },
    { sNo: 15, rollNo: 115, name: "Deepak Kushwaha", english: 83, hindi: 79, mathematics: 86, science: 82, socialScience: 80, computer: 84 },
    { sNo: 16, rollNo: 116, name: "Riya Singh", english: 94, hindi: 91, mathematics: 95, science: 92, socialScience: 88, computer: 93 },
    { sNo: 17, rollNo: 117, name: "Saurabh Verma", english: 79, hindi: 74, mathematics: 82, science: 78, socialScience: 76, computer: 80 },
    { sNo: 18, rollNo: 118, name: "Ishita Sharma", english: 87, hindi: 84, mathematics: 89, science: 85, socialScience: 82, computer: 86 },
    { sNo: 19, rollNo: 119, name: "Vivek Yadav", english: 72, hindi: 68, mathematics: 75, science: 71, socialScience: 69, computer: 73 },
    { sNo: 20, rollNo: 120, name: "Tanya Jain", english: 91, hindi: 88, mathematics: 94, science: 90, socialScience: 86, computer: 90 },
  ];

  const downloadPDF = async () => {
    const card = document.getElementById('result-card');
    if (!card) return;
    
    try {
      const canvas = await html2canvas(card, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Result_Class${className}_Sec${section}.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. See console for details.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-[#FAF7F2] min-h-screen p-4 md:p-8 font-sans">
      <div className="max-w-[1200px] mx-auto mb-6 flex justify-between items-center no-print">
        <div>
          <h1 className="text-2xl font-bold text-[#8B5E2E]">Result Card Preview</h1>
          <p className="text-gray-600">Review and print/download the result card.</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-2.5 bg-white border border-[#8B5E2E] text-[#8B5E2E] font-bold rounded-lg shadow-sm hover:bg-[#FDF7EE] transition-colors"
          >
            <Printer className="w-5 h-5" /> Print
          </button>
          <button
            onClick={downloadPDF}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#8B5E2E] text-white font-bold rounded-lg shadow-md hover:bg-[#734A21] transition-colors"
          >
            <Download className="w-5 h-5" /> Download PDF
          </button>
        </div>
      </div>

      <div className="overflow-x-auto pb-10">
        <div className="min-w-[1000px]">
          <ResultCard
            students={students}
            className={className}
            section={section}
            session={session}
            resultDate={resultDate}
            examTitle={examTitle}
            totalMarks={totalMarks}
            subjects={subjects}
          />
        </div>
      </div>
    </div>
  );
};
