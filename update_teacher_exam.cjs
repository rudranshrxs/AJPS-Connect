const fs = require('fs');
let code = fs.readFileSync('src/pages/exams/TeacherExam.tsx', 'utf8');

// 1. Strict filtering
code = code.replace(
`    // Merge with any assignedClasses property (fallback)
    const merged = new Set([...(currentUser.assignedClasses || []), ...classesSet]);
    return Array.from(merged);`,
`    // Strictly rely on Timetables for RBAC - NO FALLBACKS!
    return Array.from(classesSet);`
);

// 2. Lock Subject field and display appropriately
// Search for selectedSubject logic.
// Find: const assignedSubjects = currentUser?.subjects || [];
code = code.replace(
  /const assignedSubjects = currentUser\?\.subjects \|\| \[\];/,
  `const assignedSubjects = currentUser?.subjects || [];\n  const lockedSubject = assignedSubjects[0] || '';`
);

// We need to disable and lock the subject select dropdown
code = code.replace(
  /<select[\s\S]*?value=\{selectedSubject\} onChange=\{e => setSelectedSubject\(e\.target\.value\)\}[\s\S]*?>[\s\S]*?\{assignedSubjects\.map\(\(s: string\) => <option key=\{s\} value=\{s\}>\{s\}<\/option>\)\}[\s\S]*?<\/select>/g,
  `<select 
                value={lockedSubject} disabled
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-500 cursor-not-allowed opacity-80"
              >
                <option value={lockedSubject}>{lockedSubject}</option>
              </select>`
);

// Fix the state initialization for subject
code = code.replace(
  /if \(assignedSubjects\.length > 0 && !selectedSubject\) setSelectedSubject\(assignedSubjects\[0\]\);/,
  `if (lockedSubject && selectedSubject !== lockedSubject) setSelectedSubject(lockedSubject);`
);

// Replace empty state check in the render method.
code = code.replace(
  /upcomingExams\.length === 0 \? \([\s\S]*?\) : \(/,
  `assignedClasses.length === 0 ? (
          <GlassCard className="p-8 bg-white/60 border-white text-center animate-in fade-in zoom-in duration-300">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Access Restricted</h3>
            <p className="text-gray-500 font-medium">You are not assigned to teach any active classes. Please contact the administrator to update your timetable.</p>
          </GlassCard>
        ) : upcomingExams.length === 0 ? (
          <div className="bg-white/50 border border-white p-8 rounded-2xl text-center">
            <p className="text-gray-500 font-medium">No active exams assigned to your classes.</p>
          </div>
        ) : (`
);

fs.writeFileSync('src/pages/exams/TeacherExam.tsx', code);
