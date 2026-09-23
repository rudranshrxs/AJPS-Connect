const fs = require('fs');
let code = fs.readFileSync('src/pages/attendance/AdminAttendance.tsx', 'utf8');

const regex = /classes\.forEach\(c => \{[\s\S]*?\}\);/g;

const replacement = `classes.forEach(c => {
    c.sections?.forEach((s: any) => { 
      const secName = typeof s === 'string' ? s : s.name;
      classOptions.push({
        id: \`\${c.id}-\${secName}\`,
        name: \`\${c.className} - Section \${secName}\`
      });
    });
  });`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/pages/attendance/AdminAttendance.tsx', code);
