const fs = require('fs');
let code = fs.readFileSync('src/utils/seedData.ts', 'utf8');
code = code.replace("if (localStorage.getItem('ajps_seed_version') === 'v3')", "if (localStorage.getItem('ajps_seed_version') === 'v4')");
code = code.replace("localStorage.setItem('ajps_seed_version', 'v3');", "localStorage.setItem('ajps_seed_version', 'v4');");

const oldLogic = `// Pick 1-2 random subjects
    const tSubs = Array.from(new Set([
      SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)],
      SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)]
    ]));`;

const newLogic = `// GUARANTEE exactly one primary subject
    const tSubs = [SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)]];`;
    
code = code.replace(oldLogic, newLogic);
fs.writeFileSync('src/utils/seedData.ts', code);
