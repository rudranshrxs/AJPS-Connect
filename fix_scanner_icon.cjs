const fs = require('fs');
let code = fs.readFileSync('src/components/attendance/SelfAttendanceScanner.tsx', 'utf8');
code = code.replace(/Scan,/g, 'ScanFace,');
code = code.replace(/<Scan /g, '<ScanFace ');
fs.writeFileSync('src/components/attendance/SelfAttendanceScanner.tsx', code);
