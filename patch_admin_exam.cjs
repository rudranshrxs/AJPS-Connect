const fs = require('fs');
let file = fs.readFileSync('src/pages/exams/AdminExam.tsx', 'utf8');

const toggleLogic = `
  const handleToggleMarksEntry = (exam: Exam) => {
    const updated = exams.map(e => e.id === exam.id ? { ...e, isMarksEntryOpen: !e.isMarksEntryOpen } : e);
    setExams(updated);
    localStorage.setItem('ajps_exams', JSON.stringify(updated));
    triggerSuccess(\`Marks entry \${!exam.isMarksEntryOpen ? 'Unlocked' : 'Locked'} for \${exam.name}\`);
    window.dispatchEvent(new Event('exams_updated'));
  };
`;

file = file.replace(/const openDatesheetModal = \([\s\S]*?\}\n  \};/, toggleLogic.trim() + '\n\n  $&');

const buttonCode = `
                  <button 
                    onClick={() => handleToggleMarksEntry(exam)}
                    className={\`flex-1 text-white text-xs font-bold py-2 rounded-lg shadow-sm transition-colors \${exam.isMarksEntryOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-[#A05C2B] hover:bg-[#8B4E24]'}\`}
                  >
                    {exam.isMarksEntryOpen ? 'Lock Marks Entry' : 'Unlock Marks Entry'}
                  </button>
                  <button 
`;

file = file.replace(/<button \n                    onClick=\{\(\) => handlePublishResult\(exam\)\}/, buttonCode + '$&');

fs.writeFileSync('src/pages/exams/AdminExam.tsx', file);
