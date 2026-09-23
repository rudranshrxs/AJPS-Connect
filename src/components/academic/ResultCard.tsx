import React from 'react';

export interface Student {
  sNo: number;
  rollNo: number;
  name: string;
  english: number;
  hindi: number;
  mathematics: number;
  science: number;
  socialScience: number;
  computer: number;
}

export interface ResultCardProps {
  students: Student[];
  className: string;
  section: string;
  session: string;
  resultDate: string;
  examTitle: string;
  totalMarks: number;
  subjects: string[];
}

export const ResultCard: React.FC<ResultCardProps> = ({
  students,
  className,
  section,
  session,
  resultDate,
  examTitle,
  totalMarks,
  subjects,
}) => {
  // Compute student totals and percentages
  const studentsWithTotals = students.map((student) => {
    const total =
      student.english +
      student.hindi +
      student.mathematics +
      student.science +
      student.socialScience +
      student.computer;
    const percentage = Number(((total / totalMarks) * 100).toFixed(2));
    return { ...student, total, percentage };
  });

  // Compute summary stats
  let maxTotal = -1;
  let maxStudent = '';
  let minTotal = Infinity;
  let minStudent = '';
  let sumPercentage = 0;

  studentsWithTotals.forEach((student) => {
    if (student.total > maxTotal) {
      maxTotal = student.total;
      maxStudent = student.name;
    }
    if (student.total < minTotal) {
      minTotal = student.total;
      minStudent = student.name;
    }
    sumPercentage += student.percentage;
  });

  const avgPercentage =
    studentsWithTotals.length > 0
      ? (sumPercentage / studentsWithTotals.length).toFixed(2)
      : '0.00';

  return (
    <>
      <style>
        {`
          @media print {
            body * { visibility: hidden; }
            #result-card, #result-card * { visibility: visible; }
            #result-card { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 10px; }
            .no-print { display: none !important; }
          }
        `}
      </style>
      <div
        id="result-card"
        className="bg-white p-6 md:p-10 mx-auto border-[4px] border-[#1a237e] text-[#1a237e] relative shadow-2xl max-w-[1200px]"
        style={{ fontFamily: 'Times New Roman, Times, serif' }}
      >
        {/* HEADER */}
        <div className="grid grid-cols-[120px_1fr_250px] gap-4 mb-6 items-center">
          {/* LEFT: Logo */}
          <div className="flex justify-center items-center">
            <img src="/logo.png" alt="School Logo" className="w-[100px] h-[100px] object-contain" />
          </div>

          {/* CENTER: School Details */}
          <div className="text-center flex flex-col items-center">
            <h1 className="text-4xl md:text-5xl font-extrabold text-[#1a237e] tracking-wide mb-2" style={{ fontFamily: 'Georgia, serif' }}>
              AMAR JYOTI PUBLIC SCHOOL
            </h1>
            <div className="flex items-center gap-4 mb-1">
              <hr className="w-16 border-[#1a237e]" />
              <h2 className="text-lg md:text-xl font-semibold tracking-wider text-[#1a237e]">
                RAUN, BHIND (M.P.)
              </h2>
              <hr className="w-16 border-[#1a237e]" />
            </div>
            <p className="italic text-sm text-gray-600 mb-2">Truth is God</p>
            <div className="bg-[#1a237e] text-white font-bold px-8 py-1.5 inline-block mt-1 rounded-sm text-base tracking-widest uppercase">
              {examTitle}
            </div>
          </div>

          {/* RIGHT: Meta Details */}
          <div className="text-right text-sm text-[#1a237e] font-semibold pr-4">
            <div className="grid grid-cols-[auto_auto_auto] gap-x-2 text-left w-fit ml-auto">
              <div>Class</div><div>:</div><div>{className}</div>
              <div>Section</div><div>:</div><div>{section}</div>
              <div>Session</div><div>:</div><div>{session}</div>
              <div>Result Date</div><div>:</div><div>{resultDate}</div>
            </div>
          </div>
        </div>

        {/* MARKS TABLE */}
        <div className="mb-6 overflow-x-auto">
          <table className="w-full border-collapse border border-gray-800 text-[#1a237e]">
            <thead>
              <tr className="bg-white text-sm">
                <th className="border border-gray-800 p-2 font-bold text-center w-12" rowSpan={2}>S.No.</th>
                <th className="border border-gray-800 p-2 font-bold text-center w-20" rowSpan={2}>Roll No.</th>
                <th className="border border-gray-800 p-2 font-bold text-left min-w-[150px]" rowSpan={2}>Student Name</th>
                <th className="border border-gray-800 p-2 font-bold text-center" colSpan={6}>Subject Marks (Out of 100)</th>
                <th className="border border-gray-800 p-2 font-bold text-center w-24" rowSpan={2}>Total<br/><span className="text-xs font-normal">(Out of {totalMarks})</span></th>
                <th className="border border-gray-800 p-2 font-bold text-center w-24" rowSpan={2}>Percentage<br/><span className="text-xs font-normal">(%)</span></th>
              </tr>
              <tr className="bg-white text-sm">
                {subjects.map((subject) => (
                  <th key={subject} className="border border-gray-800 p-2 font-bold text-center w-16">{subject}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {studentsWithTotals.map((student, index) => (
                <tr key={student.rollNo} className={`text-sm ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="border border-gray-300 p-1.5 text-center">{student.sNo}</td>
                  <td className="border border-gray-300 p-1.5 text-center font-medium">{student.rollNo}</td>
                  <td className="border border-gray-300 p-1.5 pl-3 text-left font-medium">{student.name}</td>
                  <td className="border border-gray-300 p-1.5 text-center">{student.english}</td>
                  <td className="border border-gray-300 p-1.5 text-center">{student.hindi}</td>
                  <td className="border border-gray-300 p-1.5 text-center">{student.mathematics}</td>
                  <td className="border border-gray-300 p-1.5 text-center">{student.science}</td>
                  <td className="border border-gray-300 p-1.5 text-center">{student.socialScience}</td>
                  <td className="border border-gray-300 p-1.5 text-center">{student.computer}</td>
                  <td className="border border-gray-300 p-1.5 text-center font-bold text-[#1a237e]">{student.total}</td>
                  <td className="border border-gray-300 p-1.5 text-center font-bold text-[#1a237e]">{student.percentage.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FOOTER */}
        <div className="grid grid-cols-[300px_1fr_400px] gap-4 items-end mt-8">
          {/* LEFT: Class Summary */}
          <div>
            <table className="w-full border-collapse border border-gray-800 text-sm">
              <thead>
                <tr>
                  <th className="bg-gray-100 border border-gray-800 p-2 text-left font-bold" colSpan={2}>Class Summary</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-800 p-2 font-semibold">Total Students</td>
                  <td className="border border-gray-800 p-2">: {students.length}</td>
                </tr>
                <tr>
                  <td className="border border-gray-800 p-2 font-semibold">Highest Marks</td>
                  <td className="border border-gray-800 p-2">: {maxTotal} ({maxStudent})</td>
                </tr>
                <tr>
                  <td className="border border-gray-800 p-2 font-semibold">Lowest Marks</td>
                  <td className="border border-gray-800 p-2">: {minTotal} ({minStudent})</td>
                </tr>
                <tr>
                  <td className="border border-gray-800 p-2 font-semibold">Class Average</td>
                  <td className="border border-gray-800 p-2">: {avgPercentage}%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* CENTER: School Seal */}
          <div className="text-center flex flex-col items-center justify-end">
            <img src="/school-seal.png" alt="School Seal" className="w-28 h-28 object-contain mb-1" />
            <p className="text-xs text-gray-500">School Seal</p>
          </div>

          {/* RIGHT: Signatures */}
          <div className="flex justify-between items-end pb-4 pr-6 pl-8">
            <div className="text-center w-36">
              <div className="h-[40px] mb-2"></div> {/* Blank space for signature */}
              <hr className="border-gray-800 w-full mb-1" />
              <p className="text-sm font-semibold text-[#1a237e]">Class Teacher</p>
            </div>
            <div className="text-center w-36">
              <img src="/principal-signature.png" alt="Principal Signature" className="w-full h-[40px] object-contain mb-2" />
              <hr className="border-gray-800 w-full mb-1" />
              <p className="text-sm font-semibold text-[#1a237e]">Principal</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
