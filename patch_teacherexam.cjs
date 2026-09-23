const fs = require('fs');

let file = fs.readFileSync('src/pages/exams/TeacherExam.tsx', 'utf8');

const syllabusFetchRegex = /if \(view === 'syllabus' && selectedExam && selectedClass && selectedSubject\) \{[\s\S]*?\} else \{[\s\S]*?setSyllabusTags\(\[\]\);[\s\S]*?\}[\s\S]*?\}/;

// Wait, the prompt says "ensure it pushes to exam.syllabus correctly". This means Exam object now has `syllabus` array.
// But we need to save the exams back to localStorage!

const newSyllabusFetch = `    if (view === 'syllabus' && selectedExam && selectedClass && selectedSubject) {
      // Find syllabus from selectedExam directly
      const syllabusArray = selectedExam.syllabus || [];
      const exists = syllabusArray.find((s: any) => s.classId === selectedClass && s.subject === selectedSubject);

      if (exists && exists.tags && exists.tags.length > 0) {
        setSyllabusTags(exists.tags);
        setSyllabusExists(true);
        setIsEditingSyllabus(false);
      } else {
        setSyllabusTags([]);
        setSyllabusExists(false);
        setIsEditingSyllabus(true);
      }
    }`;

file = file.replace(/if \(view === 'syllabus' && selectedExam && selectedClass && selectedSubject\) \{[\s\S]*?\}\n    \}/, newSyllabusFetch);

const newSyllabusSave = `  const handlePostSyllabus = () => {
    if (!selectedExam) return;

    // We must update the exams array in localStorage
    const storedExams = JSON.parse(localStorage.getItem('ajps_exams') || '[]');
    const examIndex = storedExams.findIndex((e: any) => e.id === selectedExam.id);
    
    if (examIndex >= 0) {
      const currentExam = storedExams[examIndex];
      const syllabusArray = currentExam.syllabus || [];
      const idx = syllabusArray.findIndex((s: any) => s.classId === selectedClass && s.subject === selectedSubject);
      
      if (idx >= 0) {
        syllabusArray[idx].tags = syllabusTags;
      } else {
        syllabusArray.push({
          classId: selectedClass,
          subject: selectedSubject,
          tags: syllabusTags
        });
      }
      
      currentExam.syllabus = syllabusArray;
      storedExams[examIndex] = currentExam;
      localStorage.setItem('ajps_exams', JSON.stringify(storedExams));
      setExams(storedExams);
      window.dispatchEvent(new Event('ajps_exams_updated'));
      
      const users = JSON.parse(localStorage.getItem('ajps_users') || '[]');
      const targetedStudents = users.filter((u: any) => u.role === 'Student' && (u.classId === selectedClass || u.className === selectedClass)).map((u: any) => u.id);

      if (targetedStudents.length > 0) {
        NotificationService.sendNotification({
          recipientIds: targetedStudents,
          title: 'Syllabus Posted',
          message: \`\${selectedSubject} syllabus for \${selectedExam.name} has been posted.\`,
          type: 'info'
        });
        window.dispatchEvent(new Event('new-notification'));
      }

      triggerSuccess('Syllabus Saved Successfully!');
      setSyllabusExists(true);
      setIsEditingSyllabus(false);
    }
  };`;

file = file.replace(/const handlePostSyllabus = \(\) => \{[\s\S]*? setIsEditingSyllabus\(false\);\n    \}, 1000\);\n  \};/, newSyllabusSave);

const marksLockLogic = `  // Check marks lock status and datesheet
  useEffect(() => {
    if (view === 'marks' && selectedExam && selectedSubject) {
      if (selectedExam.isMarksEntryOpen === undefined) {
        setIsEntryOpen(false); // Default to locked if not explicitly open
      } else {
        setIsEntryOpen(selectedExam.isMarksEntryOpen);
      }
      
      const storedMarks = localStorage.getItem('ajps_marks_locked');
      const allLocked = storedMarks ? JSON.parse(storedMarks) : [];
      const isLocked = allLocked.find((m: any) => m.examId === selectedExam.id && m.classId === selectedClass && m.subject === selectedSubject)?.isLocked || false;
      setIsMarksLocked(isLocked);
    }
  }, [selectedExam, selectedClass, selectedSubject, view]);`;

file = file.replace(/\/\/ Check marks lock status and datesheet[\s\S]*?setIsMarksLocked\(isLocked\);\n    \}\n  \}, \[selectedExam, selectedClass, selectedSubject, view\]\);/, marksLockLogic);

fs.writeFileSync('src/pages/exams/TeacherExam.tsx', file);
