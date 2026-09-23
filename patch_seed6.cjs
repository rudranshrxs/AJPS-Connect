const fs = require('fs');
let code = fs.readFileSync('src/utils/seedData.ts', 'utf8');

code = code.replace(/isSeeded_v5/g, 'isSeeded_v6');

const existingWipe = `  if (localStorage.getItem('isSeeded_v6') === 'true') {
    return;
  }
  
  // The Great Wipe
  localStorage.setItem('ajps_exams', '[]');
  localStorage.setItem('ajps_leaves', '[]');
  localStorage.setItem('ajps_notifications', '[]');
  localStorage.setItem('ajps_attendance', '{}');
`;

// It might currently just have the wipe or not
const wipeTarget = `  if (localStorage.getItem('isSeeded_v6') === 'true') {
    return;
  }`;

if (code.includes(wipeTarget) && !code.includes("The Great Wipe")) {
    code = code.replace(wipeTarget, existingWipe);
}

fs.writeFileSync('src/utils/seedData.ts', code);
