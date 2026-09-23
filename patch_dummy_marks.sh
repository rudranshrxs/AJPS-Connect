cat << 'INNER_EOF' > /tmp/dummy_marks.ts
  const getDummyMarks = () => {
    return [
      { subject: 'English', maxMarks: 100, obtained: 88, grade: 'A2', icon: FileText },
      { subject: 'Hindi', maxMarks: 100, obtained: 85, grade: 'A2', icon: FileText },
      { subject: 'Maths', maxMarks: 100, obtained: 95, grade: 'A1', icon: FileText },
      { subject: 'Science', maxMarks: 100, obtained: 92, grade: 'A1', icon: FileText },
      { subject: 'Social Science', maxMarks: 100, obtained: 88, grade: 'A2', icon: FileText }
    ];
  };
INNER_EOF
sed -i -e '/const getDummyMarks = () => {/,/  };/c\  const getDummyMarks = () => {\n    return [\n      { subject: "English", maxMarks: 100, obtained: 88, grade: "A2", icon: FileText },\n      { subject: "Hindi", maxMarks: 100, obtained: 85, grade: "A2", icon: FileText },\n      { subject: "Maths", maxMarks: 100, obtained: 95, grade: "A1", icon: FileText },\n      { subject: "Science", maxMarks: 100, obtained: 92, grade: "A1", icon: FileText },\n      { subject: "Social Science", maxMarks: 100, obtained: 88, grade: "A2", icon: FileText }\n    ];\n  };' src/pages/exams/StudentExam.tsx
