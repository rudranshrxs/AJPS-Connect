const fs = require('fs');
let code = fs.readFileSync('src/utils/seedData.ts', 'utf8');

const oldStudentGen = `      users.push({
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
      });`;

const newStudentGen = `      users.push({
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
        transportMode: student.tMode,
        attendanceHistory: []
      });`;

code = code.replace(oldStudentGen, newStudentGen);

// Also wipe ajps_attendance just in case
fs.writeFileSync('src/utils/seedData.ts', code);
