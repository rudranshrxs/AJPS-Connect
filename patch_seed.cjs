const fs = require('fs');
let code = fs.readFileSync('src/utils/seedData.ts', 'utf8');

code = code.replace(/isSeeded_v4/g, 'isSeeded_v5');

const existingReturn = `  if (localStorage.getItem('isSeeded_v5') === 'true') {
    return;
  }`;

const wipeCode = `  if (localStorage.getItem('isSeeded_v5') === 'true') {
    return;
  }
  
  // The Great Wipe
  localStorage.setItem('ajps_exams', '[]');
  localStorage.setItem('ajps_leaves', '[]');
  localStorage.setItem('ajps_notifications', '[]');
  localStorage.setItem('ajps_attendance', '{}');
`;

code = code.replace(existingReturn, wipeCode);

const studentGen = `        gender: Math.random() > 0.5 ? 'Male' : 'Female',
        dob: '2010-05-14',
        bloodGroup: 'O+',
        phone: '9876543210',
        email: \`student\${studentIdCounter}@ajps.edu.in\`,
        transportMode: TRANSPORT_MODES[Math.floor(Math.random() * TRANSPORT_MODES.length)],
        attendanceHistory: []
      });`;
      
code = code.replace(/gender: Math\.random\(\) > 0\.5 \? 'Male' : 'Female',[\s\S]*?transportMode: TRANSPORT_MODES\[Math\.floor\(Math\.random\(\) \* TRANSPORT_MODES\.length\)\],?\n\s*\w*\s*\}\);/, studentGen);

fs.writeFileSync('src/utils/seedData.ts', code);
