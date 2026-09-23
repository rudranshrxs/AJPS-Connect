const fs = require('fs');
let code = fs.readFileSync('src/pages/attendance/AdminAttendance.tsx', 'utf8');

const target = `  classes.forEach(c => {
    c.sections?.forEach((s: string) => {
      classOptions.push({
        id: \`\${c.id}-\${s}\`,
        name: \`\${c.className} - Section \${s}\`
      });
    });
  });`;

const replacement = `  classes.forEach((c: any) => {
    c.sections?.forEach((s: any) => {
      const secName = typeof s === 'string' ? s : s.name;
      classOptions.push({
        id: \`\${c.id}-\${secName}\`,
        name: \`\${c.className} - Section \${secName}\`
      });
    });
  });`;

code = code.replace(target, replacement);
fs.writeFileSync('src/pages/attendance/AdminAttendance.tsx', code);
