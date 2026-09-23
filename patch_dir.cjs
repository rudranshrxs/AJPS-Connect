const fs = require('fs');
let code = fs.readFileSync('src/pages/directory/StudentDirectory.tsx', 'utf8');

const importReplacement = `
import { GlassCard } from '../../components/ui/GlassCard';
import { useAuth } from '../../context/AuthContext';
import { Lock } from 'lucide-react';
`;
code = code.replace(/import \{ GlassCard \} from '\.\.\/\.\.\/components\/ui\/GlassCard';/, importReplacement.trim());

const hookReplacement = `
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedSection, setSelectedSection] = useState('All');
`;
code = code.replace(/const \[searchTerm, setSearchTerm\] = useState\(''\);\n  const \[selectedClass, setSelectedClass\] = useState\('All'\);\n  const \[selectedSection, setSelectedSection\] = useState\('All'\);/, hookReplacement.trim());

const effectReplacement = `
  useEffect(() => {
    const fetchUsers = () => {
      const allUsers = JSON.parse(localStorage.getItem('ajps_users') || '[]');
      let studentsOnly = allUsers.filter((u: any) => u.role === 'Student');

      if (currentUser?.role === 'Teacher') {
        const timetables = JSON.parse(localStorage.getItem('ajps_timetables') || '[]');
        const myTimetable = timetables.find((t: any) => t.schedule?.monday?.p1 === currentUser.id);
        
        if (myTimetable) {
           studentsOnly = studentsOnly.filter((s: any) => s.classId === myTimetable.classId && s.sectionId === myTimetable.sectionId);
           setIsClassTeacher(true);
        } else {
           setIsClassTeacher(false);
        }
      } else {
         setIsClassTeacher(true); // Admins and others can see
      }

      setStudents(studentsOnly);
    };

    fetchUsers();
    window.addEventListener('ajps_users_updated', fetchUsers);
    return () => window.removeEventListener('ajps_users_updated', fetchUsers);
  }, [currentUser]);
`;
// add state for isClassTeacher
code = code.replace(/const \[students, setStudents\] = useState<any\[\]>\(\[\]\);/, "const [students, setStudents] = useState<any[]>([]);\n  const [isClassTeacher, setIsClassTeacher] = useState(true);");

code = code.replace(/useEffect\(\(\) => \{[\s\S]*?\}, \[\]\);/, effectReplacement.trim());

const returnReplacement = `
  if (currentUser?.role === 'Teacher' && !isClassTeacher) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <GlassCard className="max-w-md w-full p-8 text-center bg-white/60 border-white backdrop-blur-xl shadow-2xl rounded-3xl">
          <div className="w-20 h-20 mx-auto bg-[#FDF7EE] border-2 border-[#A05C2B]/20 text-[#A05C2B] rounded-full flex items-center justify-center mb-6 shadow-sm">
            <Lock className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-[#1F2937] mb-3 tracking-tight">Access Restricted</h2>
          <p className="text-gray-600 font-semibold leading-relaxed">
            The Student Directory is only accessible to assigned Class Teachers.
          </p>
        </GlassCard>
      </div>
    );
  }

  return (
`;
code = code.replace(/return \(/, returnReplacement.trim());

fs.writeFileSync('src/pages/directory/StudentDirectory.tsx', code);
