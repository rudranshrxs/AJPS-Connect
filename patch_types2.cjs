const fs = require('fs');
let code = fs.readFileSync('src/types/index.ts', 'utf8');
code = code.replace(/transportMode\?: string;/, `transportMode?: string;\n  attendanceHistory?: { date: string; status: string; }[];`);
fs.writeFileSync('src/types/index.ts', code);
