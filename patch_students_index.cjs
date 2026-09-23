const fs = require('fs');

let file = fs.readFileSync('src/pages/students/index.tsx', 'utf8');

file = file.replace(/import \{ AdminStudentDirectory \} from '\.\/AdminStudentDirectory';/, 
  `import { StudentDirectory } from '../directory/StudentDirectory';`);

file = file.replace(/<AdminStudentDirectory \/>/g, '<StudentDirectory />');
file = file.replace(/<TeacherStudentDirectory \/>/g, '<StudentDirectory />'); // Teacher also sees global directory? The prompt says "Students do not have access to the global directory." So Admin & Teacher can use the same StudentDirectory component.

fs.writeFileSync('src/pages/students/index.tsx', file);
