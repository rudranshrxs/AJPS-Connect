const fs = require('fs');

// Patch 1: src/components/classes/AssignTeacherModal.tsx
let assignCode = fs.readFileSync('src/components/classes/AssignTeacherModal.tsx', 'utf8');
assignCode = assignCode.replace(/section\.sectionId/g, 'section.id');
assignCode = assignCode.replace(/section\.sectionName/g, 'section.name');
assignCode = assignCode.replace(/s\.sectionId/g, 's.id');
fs.writeFileSync('src/components/classes/AssignTeacherModal.tsx', assignCode);

// Patch 2: src/components/classes/ClassCard.tsx
let cardCode = fs.readFileSync('src/components/classes/ClassCard.tsx', 'utf8');
cardCode = cardCode.replace(/sectionId:/g, 'id:');
cardCode = cardCode.replace(/sectionName:/g, 'name:');
cardCode = cardCode.replace(/section\.sectionId/g, 'section.id');
cardCode = cardCode.replace(/section\.sectionName/g, 'section.name');
fs.writeFileSync('src/components/classes/ClassCard.tsx', cardCode);

