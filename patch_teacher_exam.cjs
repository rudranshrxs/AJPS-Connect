const fs = require('fs');
let code = fs.readFileSync('src/pages/exams/TeacherExam.tsx', 'utf8');

const syllabusSaveReplacement = `
    const storedExams = JSON.parse(localStorage.getItem('ajps_exams') || '[]');
    const examIndex = storedExams.findIndex((e: any) => e.id === selectedExam.id);
    
    if (examIndex >= 0) {
      const currentExam = storedExams[examIndex];
      const syllabusArray = currentExam.syllabus || [];
      const idx = syllabusArray.findIndex((s: any) => s.classId === selectedClass && s.subject === selectedSubject);
      
      const allClasses = JSON.parse(localStorage.getItem('ajps_classes') || '[]');
      const activeClass = allClasses.find((c: any) => c.id === selectedClass || c.className === selectedClass) || { id: selectedClass, className: selectedClass };
      const teacherSubject = currentUser?.subjects?.[0] || selectedSubject;

      if (idx >= 0) {
        syllabusArray[idx] = { ...syllabusArray[idx], classId: activeClass.id, className: activeClass.className, subject: teacherSubject, tags: syllabusTags };
      } else {
        syllabusArray.push({
          classId: activeClass.id,
          className: activeClass.className,
          subject: teacherSubject,
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
          title: 'New Syllabus Posted',
          message: \`\${currentUser?.name} posted the \${teacherSubject} syllabus for \${selectedExam.name}.\`,
          type: 'info',
          actionPath: '/exams',
          actionLabel: 'View Syllabus'
        });
        window.dispatchEvent(new Event('new-notification'));
      }
      triggerSuccess('Syllabus Saved Successfully!');
      setSyllabusExists(true);
      setIsEditingSyllabus(false);
    }
`;

code = code.replace(/const storedExams = JSON\.parse\(localStorage\.getItem\('ajps_exams'\) \|\| '\[\]'\);[\s\S]*?setIsEditingSyllabus\(false\);\n    \}/, syllabusSaveReplacement.trim());

fs.writeFileSync('src/pages/exams/TeacherExam.tsx', code);
