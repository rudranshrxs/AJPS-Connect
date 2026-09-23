const fs = require('fs');
let code = fs.readFileSync('src/utils/seedData.ts', 'utf8');

code = code.replace(/if \(localStorage.getItem\('isSeeded_v4'\) === 'true'\)/, "if (localStorage.getItem('isSeeded_v5') === 'true')");
code = code.replace(/localStorage.setItem\('isSeeded_v4', 'true'\);/, "localStorage.setItem('isSeeded_v5', 'true');");

const replacement = `
  for (let c = 1; c <= 12; c++) {
    const className = \`Class \${c}\`;
    const sections = ['A', 'B'];

    const classSections = [];
    
    // Generate 20 students for the class
    const classStudents = [];
    for (let s = 1; s <= 20; s++) {
      classStudents.push({
        name: getRandomName(),
        tMode: TRANSPORT_MODES[Math.floor(Math.random() * TRANSPORT_MODES.length)]
      });
    }
    
    // Sort alphabetically by name
    classStudents.sort((a, b) => a.name.localeCompare(b.name));
    
    // Assign Roll Numbers and Sections
    for (let i = 0; i < classStudents.length; i++) {
      const student = classStudents[i];
      const studentIndex = i + 1;
      const paddedIndex = studentIndex.toString().padStart(3, '0');
      const rollNumber = \`132426\${c}\${paddedIndex}\`;
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

    for (const section of sections) {
      classSections.push({ id: \`c\${c}-s\${section}\`, name: section });
    }

    classes.push({
      id: c.toString(),
      className,
      sections: classSections
    });
  }
`;

code = code.replace(/for \(let c = 1; c <= 12; c\+\+\) \{[\s\S]*?classes\.push\(\{[\s\S]*?id: c\.toString\(\),[\s\S]*?className,[\s\S]*?sections: classSections[\s\S]*?\}\);\n  \}/, replacement.trim());

fs.writeFileSync('src/utils/seedData.ts', code);
