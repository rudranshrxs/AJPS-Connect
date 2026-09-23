const fs = require('fs');
let code = fs.readFileSync('src/pages/attendance/TeacherAttendance.tsx', 'utf8');

// 1. Add checkIfOnLeave function
const checkIfOnLeaveCode = `
  const checkIfOnLeave = (studentId: string, currentDate: string) => {
    return leaves.some(l => 
      l.studentId === studentId && 
      l.status === 'Approved' && 
      currentDate >= l.fromDate && 
      currentDate <= l.toDate
    );
  };
`;

code = code.replace(/const handleMark = /g, checkIfOnLeaveCode.trim() + '\n\n  const handleMark = ');

// 2. Modify the mapping of students in the mark tab
const studentMapReplacement = `
            {classDetails.students.map((student) => {
              const onLeave = checkIfOnLeave(student.id, getSystemDate().toISOString().split('T')[0]);
              
              return (
              <div key={student.id} className="p-5 hover:bg-white/60 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <p className="font-bold text-[#1F2937] text-lg">{student.name}</p>
                  <p className="text-xs text-gray-500 font-bold mt-0.5">Roll No: {student.rollNumber}</p>
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  {onLeave ? (
                    <div className="px-5 py-2.5 rounded-xl text-xs font-black transition-all uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 shadow-sm flex items-center gap-2">
                      <Lock className="w-4 h-4" /> On Leave (Approved)
                    </div>
                  ) : (
                    ['Present', 'Absent', 'Leave'].map(status => (
                      <button
                        key={status}
                        disabled={isLocked}
                        onClick={() => handleMark(student.id, status)}
                        className={\`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-black transition-all uppercase tracking-wider \${
                          attendance[student.id] === status
                            ? status === 'Present' ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500 shadow-sm' :
                              status === 'Absent' ? 'bg-red-100 text-red-700 ring-2 ring-red-500 shadow-sm' :
                              'bg-amber-100 text-amber-700 ring-2 ring-amber-500 shadow-sm'
                            : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
                        } \${isLocked ? 'opacity-70 cursor-not-allowed' : ''}\`}
                      >
                        {status}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )})}
`;
code = code.replace(/\{classDetails\.students\.map\(\(student\) => \([\s\S]*?<\/div>\s*\)\)\}/, studentMapReplacement.trim());


// 3. Update the Leaves Tab rendering
const leaveTabReplacement = `
                  <p className="text-xs text-gray-500 font-medium">From: {new Date(leave.fromDate).toLocaleDateString()} To: {new Date(leave.toDate).toLocaleDateString()}</p>
`;
code = code.replace(/<p className="text-xs text-gray-500 font-medium">Leave Date: \{new Date\(leave\.date\)\.toLocaleDateString\(\)\}<\/p>/, leaveTabReplacement.trim());


fs.writeFileSync('src/pages/attendance/TeacherAttendance.tsx', code);
