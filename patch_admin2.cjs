const fs = require('fs');
let code = fs.readFileSync('src/pages/attendance/AdminAttendance.tsx', 'utf8');

code = code.replace(`  });
    });
  });`, `  });`);

fs.writeFileSync('src/pages/attendance/AdminAttendance.tsx', code);
