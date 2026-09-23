const fs = require('fs');
let code = fs.readFileSync('src/pages/attendance/TeacherAttendance.tsx', 'utf8');

// Replace states
code = code.replace("const [historyDateFilter, setHistoryDateFilter] = useState('');", "const [searchDate, setSearchDate] = useState('');");
code = code.replace("const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});", "const [expandedDate, setExpandedDate] = useState<string | null>(null);");

// Remove old toggleDate function if it exists
code = code.replace("const toggleDate = (date: string) => setExpandedDates(prev => ({ ...prev, [date]: !prev[date] }));", "");

// Replace usage in the JSX
// 1. input onChange
code = code.replace(/value=\{historyDateFilter\}/g, "value={searchDate}");
code = code.replace(/onChange=\{e => setHistoryDateFilter\(e\.target\.value\)\}/g, "onChange={(e) => setSearchDate(e.target.value)}");

// 2. map filter
code = code.replace(/!historyDateFilter \|\| date === historyDateFilter/g, "!searchDate || date === searchDate");

// 3. toggle logic and expandedDate check
code = code.replace(/const isExpanded = expandedDates\[date\];/g, "const isExpanded = expandedDate === date;");
code = code.replace(/onClick=\{\(\) => toggleDate\(date\)\}/g, "onClick={() => setExpandedDate(expandedDate === date ? null : date)}");

fs.writeFileSync('src/pages/attendance/TeacherAttendance.tsx', code);
