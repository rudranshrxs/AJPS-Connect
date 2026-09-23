const fs = require('fs');

function fixFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/{\\` /g, '{`'); // not quite right
  content = content.replace(/{\\`/g, '{`');
  content = content.replace(/\\`}/g, '`}');
  content = content.replace(/\\\${/g, '${');
  fs.writeFileSync(file, content);
}

fixFile('src/components/attendance/SelfAttendanceScanner.tsx');
