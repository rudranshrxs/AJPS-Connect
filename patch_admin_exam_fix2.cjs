const fs = require('fs');
let file = fs.readFileSync('src/pages/exams/AdminExam.tsx', 'utf8');

file = file.replace(/<button \n<button /g, '<button ');

if (!file.includes('const handleToggleMarksEntry')) {
  file = file.replace(/const openDatesheetModal = /, `const handleToggleMarksEntry = (exam: Exam) => {
    const updated = exams.map(e => e.id === exam.id ? { ...e, isMarksEntryOpen: !e.isMarksEntryOpen } : e);
    setExams(updated);
    localStorage.setItem('ajps_exams', JSON.stringify(updated));
    triggerSuccess(\`Marks entry \${!exam.isMarksEntryOpen ? 'Unlocked' : 'Locked'} for \${exam.name}\`);
    window.dispatchEvent(new Event('exams_updated'));
  };\n\n  const openDatesheetModal = `);
}

fs.writeFileSync('src/pages/exams/AdminExam.tsx', file);
