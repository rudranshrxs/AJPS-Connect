const fs = require('fs');
let code = fs.readFileSync('src/pages/attendance/TeacherAttendance.tsx', 'utf8');

const targetState = "const [isLocked, setIsLocked] = useState(false);";
const replacementState = `const [isLocked, setIsLocked] = useState(false);
  const [historyDateFilter, setHistoryDateFilter] = useState('');
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  
  const toggleDate = (date: string) => setExpandedDates(prev => ({ ...prev, [date]: !prev[date] }));`;

if(code.includes(targetState) && !code.includes("historyDateFilter")) {
    code = code.replace(targetState, replacementState);
    fs.writeFileSync('src/pages/attendance/TeacherAttendance.tsx', code);
}
