const fs = require('fs');

let file = fs.readFileSync('src/utils/seedData.ts', 'utf8');

file = file.replace(/localStorage\.setItem\('ajps_classes', JSON\.stringify\(classes\)\);/g, 
  `localStorage.setItem('ajps_classes', JSON.stringify(classes));\n  localStorage.setItem('ajps_timetables', '[]');`);

fs.writeFileSync('src/utils/seedData.ts', file);
