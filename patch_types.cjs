const fs = require('fs');
let code = fs.readFileSync('src/types/index.ts', 'utf8');
code = code.replace(/subjects\?: string\[\];/, `subjects?: string[];\n  transportMode?: string;`);
fs.writeFileSync('src/types/index.ts', code);
