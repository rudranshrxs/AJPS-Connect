const fs = require('fs');
let code = fs.readFileSync('src/utils/seedData.ts', 'utf8');

code = code.replace(/isSeeded_v5/g, 'isSeeded_v4');

const replacement = `
    // Assign Roll Numbers and Sections
    for (let i = 0; i < classStudents.length; i++) {
      const student = classStudents[i];
      const rollNumber = \`132426\${c}00\${i + 1}\`;
      const section = i < 10 ? 'A' : 'B';
      
      users.push({
        id: \`student_\${studentGlobalIndex}\`,
        name: student.name,
        role: 'Student',
        avatarUrl: \`https://i.pravatar.cc/150?u=student_\${studentGlobalIndex}\`,
        className: className,
        classId: c.toString(),
        section: section,
        sectionId: \`c\${c}-s\${section}\`,
        sectionName: section,
        rollNumber: rollNumber,
        transportMode: student.tMode
      });
      studentGlobalIndex++;
    }
`;

code = code.replace(/\/\/ Assign Roll Numbers and Sections[\s\S]*?studentGlobalIndex\+\+;\n    \}/, replacement.trim());

fs.writeFileSync('src/utils/seedData.ts', code);
