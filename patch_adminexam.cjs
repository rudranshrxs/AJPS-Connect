const fs = require('fs');

let file = fs.readFileSync('src/pages/exams/AdminExam.tsx', 'utf8');

file = file.replace(/export interface Exam \{/g, `export interface Exam {\n  isMarksEntryOpen?: boolean;\n  syllabus?: any[];`);

// Add toggle logic in AdminExam
const toggleLogic = `
  const toggleMarksEntry = (exam) => {
    const updated = exams.map(e => e.id === exam.id ? { ...e, isMarksEntryOpen: !e.isMarksEntryOpen } : e);
    setExams(updated);
    localStorage.setItem('ajps_exams', JSON.stringify(updated));
    triggerSuccess(\`Marks entry \${exam.isMarksEntryOpen ? 'Locked' : 'Unlocked'} for \${exam.name}\`);
  };
`;

file = file.replace(/const handlePublish = \(id: string\) => \{/, toggleLogic + '\n  const handlePublish = (id: string) => {');

// Find where to add the button. Probably around "handlePublish" button.
const publishButtonRegex = /<button[\s\S]*?onClick=\{\(\) => handlePublish\(selectedExam\.id\)\}[\s\S]*?<\/button>/;

file = file.replace(publishButtonRegex, (match) => {
  return match + `
                <button
                  onClick={() => toggleMarksEntry(selectedExam)}
                  className={\`px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all flex items-center gap-2 \${
                    selectedExam.isMarksEntryOpen 
                      ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-300' 
                      : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-300'
                  }\`}
                >
                  {selectedExam.isMarksEntryOpen ? <Lock className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                  {selectedExam.isMarksEntryOpen ? 'Lock Marks Entry' : 'Unlock Marks Entry'}
                </button>
  `;
});

fs.writeFileSync('src/pages/exams/AdminExam.tsx', file);
