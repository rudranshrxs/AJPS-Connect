const fs = require('fs');
let content = fs.readFileSync('src/pages/exams/TeacherExam.tsx', 'utf-8');

// Update useEffect logic
content = content.replace(
  /const formattedStudents = targetStudents\.map\(\(s: any\) => \{[\s\S]*?\}\);\s*setStudents\(formattedStudents\);/,
  `const initialMarks: Record<string, number> = {};
        targetStudents.forEach((s: any) => {
          const stData = marksMap[s.id] || {};
          if (stData[lockedSubject] !== undefined) {
             initialMarks[s.id] = Number(stData[lockedSubject]);
          }
        });
        setMarksData(initialMarks);
        setStudents(targetStudents);`
);

// Update handleMarkChange
content = content.replace(
  /const handleMarkChange = \(index: number, field: 'marksObtained' \| 'totalMarks', value: string\) => \{[\s\S]*?setStudents\(newStudents\);\s*\};/,
  `const handleMarkChange = (studentId: string, value: string) => {
    setMarksData(prev => ({
      ...prev,
      [studentId]: Number(value)
    }));
  };`
);

// Update saveMarksData loop
content = content.replace(
  /marksMap\[s\.id\]\[lockedSubject\] = Number\(s\.marksObtained\) \|\| 0;/g,
  `marksMap[s.id][lockedSubject] = marksData[s.id] || 0;`
);

// Update table rows
content = content.replace(
  /<td className="p-4 font-bold text-gray-400">\{student\.roll \|\| 'N\/A'\}<\/td>/g,
  `<td className="p-4 font-bold text-gray-400">{student.rollNumber || 'N/A'}</td>`
);

content = content.replace(
  /value=\{student\.marksObtained\} onChange=\{e => handleMarkChange\(i, 'marksObtained', e\.target\.value\)\} /g,
  `value={marksData[student.id] !== undefined ? marksData[student.id] : ''} onChange={e => handleMarkChange(student.id, e.target.value)} `
);

content = content.replace(
  /type="number" disabled=\{isMarksLocked\} value=\{student\.totalMarks\} onChange=\{e => handleMarkChange\(i, 'totalMarks', e\.target\.value\)\}/g,
  `type="number" disabled value={100}`
);

fs.writeFileSync('src/pages/exams/TeacherExam.tsx', content);
