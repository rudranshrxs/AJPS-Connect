const fs = require('fs');

// Patch 1: src/utils/seedData.ts
let seedCode = fs.readFileSync('src/utils/seedData.ts', 'utf8');

// Change seed condition
seedCode = seedCode.replace(
  /if \(localStorage.getItem\('ajps_seed_version'\) === 'v5'\) \{[\s\S]*?return;\n  \}/,
  `if (localStorage.getItem('isSeeded_v2') === 'true') {\n    return;\n  }`
);

// Update classSections generation
seedCode = seedCode.replace(
  /classSections\.push\(\{ id: \`\$\{c\}_\$\{section\}\`, name: section, classTeacherId: '' \}\);/g,
  `classSections.push({ id: \`c\${c}-s\${section}\`, name: section });`
);

seedCode = seedCode.replace(
  /localStorage\.setItem\('ajps_seed_version', 'v5'\);/,
  `localStorage.setItem('isSeeded_v2', 'true');`
);

fs.writeFileSync('src/utils/seedData.ts', seedCode);


// Patch 2: src/pages/classes/AdminClassManager.tsx
let adminCode = fs.readFileSync('src/pages/classes/AdminClassManager.tsx', 'utf8');

adminCode = adminCode.replace(
  /export interface Section \{\n  sectionId: string;\n  sectionName: string;\n\}/g,
  `export interface Section {\n  id: string;\n  name: string;\n}`
);

// Replace sectionId with id, sectionName with name
adminCode = adminCode.replace(/sectionId/g, 'id');
adminCode = adminCode.replace(/sectionName/g, 'name');

// In handleAddSection
adminCode = adminCode.replace(
  /sections: \[\.\.\.c\.sections, \{ id: nextLetter, name: nextLetter \}\]/g,
  `sections: [...(c.sections || []), { id: \`\${c.id}-s\${nextLetter}\`, name: nextLetter }]`
);

// Add empty state for sections
// Right after <div className="p-6 bg-[#FDFBF7] border-t border-gray-100">
adminCode = adminCode.replace(
  /<div className="flex items-center justify-between border-b border-gray-200 pb-4">/,
  `{!cls.sections || cls.sections.length === 0 ? (
                      <div className="bg-white/40 border border-white p-8 rounded-xl text-center shadow-sm">
                        <p className="text-gray-500 font-bold">No sections found. Add a section to continue.</p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between border-b border-gray-200 pb-4">`
);

// Close the ternary for the empty state
adminCode = adminCode.replace(
  /\{\/\* Active Section Content \*\/\}/,
  `)}
                    {/* Active Section Content */}`
);

// Add safe mapping ? for sections
adminCode = adminCode.replace(/cls\.sections\.map/g, 'cls.sections?.map');
adminCode = adminCode.replace(/cls\.sections\.length/g, '(cls.sections?.length || 0)');
adminCode = adminCode.replace(/cls\.sections\[0\]\?/g, 'cls.sections?.[0]?');
adminCode = adminCode.replace(/cls\.sections\.find/g, 'cls.sections?.find');

fs.writeFileSync('src/pages/classes/AdminClassManager.tsx', adminCode);

// Patch 3: src/components/classes/MergeSectionModal.tsx
let mergeCode = fs.readFileSync('src/components/classes/MergeSectionModal.tsx', 'utf8');

mergeCode = mergeCode.replace(/sectionId/g, 'id');
mergeCode = mergeCode.replace(/sectionName/g, 'name');

fs.writeFileSync('src/components/classes/MergeSectionModal.tsx', mergeCode);

