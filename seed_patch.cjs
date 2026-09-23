const fs = require('fs');
let code = fs.readFileSync('src/utils/seedData.ts', 'utf8');

// Replace SUBJECTS
code = code.replace(
  /const SUBJECTS = \['Maths', 'Science', 'English', 'Hindi', 'Social Science', 'Computer', 'Art', 'PE'\];/,
  `const SUBJECTS = ['Mathematics', 'Science', 'English', 'Hindi', 'Social Science', 'Physics', 'Chemistry', 'Biology', 'Computer'];`
);

// Add the check inside initializeDummyDatabase
const initFuncStart = "export function initializeDummyDatabase() {";
const checkLogic = `
  const existingUsersStr = localStorage.getItem('ajps_users');
  if (existingUsersStr) {
    let existingUsers = JSON.parse(existingUsersStr);
    let needsUpdate = false;
    existingUsers = existingUsers.map(u => {
      if (u.role === 'Teacher') {
        if (!u.subjects || u.subjects.length === 0 || !SUBJECTS.includes(u.subjects[0])) {
          needsUpdate = true;
          return { ...u, subjects: [SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)]] };
        }
      }
      return u;
    });
    if (needsUpdate) {
      localStorage.setItem('ajps_users', JSON.stringify(existingUsers));
    }
  }
`;

code = code.replace(initFuncStart, initFuncStart + checkLogic);
code = code.replace("if (localStorage.getItem('ajps_seed_version') === 'v4')", "if (localStorage.getItem('ajps_seed_version') === 'v5')");
code = code.replace("localStorage.setItem('ajps_seed_version', 'v4');", "localStorage.setItem('ajps_seed_version', 'v5');");

fs.writeFileSync('src/utils/seedData.ts', code);
