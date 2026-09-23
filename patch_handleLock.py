import sys

with open('src/pages/exams/TeacherExam.tsx', 'r') as f:
    content = f.read()

target = """  const handleLockMarks = () => {
    if (!selectedExam) return;
    const storedMarks = localStorage.getItem('ajps_marks_locked');
    let allLocked: MarksRecord[] = storedMarks ? JSON.parse(storedMarks) : [];
    
    allLocked.push({
      examId: selectedExam.id,
      classId: selectedClass,
      subject: selectedSubject,
      isLocked: true
    });
    
    localStorage.setItem('ajps_marks_locked', JSON.stringify(allLocked));
    setIsMarksLocked(true);

    addNotification({
      title: 'Marks Locked',
      message: `${selectedSubject} marks for ${selectedClass} locked.`,
      type: 'SYSTEM',
      recipientRole: 'Teacher'
    });

    setToastMsg('Marks locked and saved!');
    setTimeout(() => {
      setToastMsg(null);
    }, 2000);
  };"""

replacement = """  const handleLockMarks = () => {
    if (!selectedExam) return;
    
    // Simulate network delay
    setTimeout(() => {
      const storedMarks = localStorage.getItem('ajps_marks_locked');
      let allLocked: MarksRecord[] = storedMarks ? JSON.parse(storedMarks) : [];
      
      allLocked.push({
        examId: selectedExam.id,
        classId: selectedClass,
        subject: selectedSubject,
        isLocked: true
      });
      
      localStorage.setItem('ajps_marks_locked', JSON.stringify(allLocked));
      setIsMarksLocked(true);

      // Notify the class teacher
      const classes = JSON.parse(localStorage.getItem('ajps_classes') || '[]');
      let classTeacherId = '';
      for (const c of classes) {
        if (c.className === selectedClass || c.id === selectedClass) {
          for (const s of c.sections) {
            if (s.classTeacherId) classTeacherId = s.classTeacherId;
          }
        }
      }

      if (classTeacherId) {
        NotificationService.sendNotification({
          recipientIds: [classTeacherId],
          title: 'Marks Locked',
          message: `${selectedSubject} marks for ${selectedClass} have been locked by the subject teacher.`,
          type: 'success'
        });
      }

      triggerSuccess('Marks Locked Successfully!');
    }, 1000);
  };"""

if target in content:
    content = content.replace(target, replacement)
    with open('src/pages/exams/TeacherExam.tsx', 'w') as f:
        f.write(content)
    print("Patched successfully")
else:
    print("Target not found")
