const fs = require('fs');
let file = fs.readFileSync('src/pages/classes/AdminClassManager.tsx', 'utf8');
file = file.replace(/classObj\.sections\.length/g, '(classObj.sections?.length || 0)');
fs.writeFileSync('src/pages/classes/AdminClassManager.tsx', file);
