sed -i "s|import { Exam } from './AdminExam';|import { Exam } from './AdminExam';\nimport { useAuth } from '../../context/AuthContext';|g" src/pages/exams/TeacherExam.tsx
sed -i "s|export function TeacherExam() {|export function TeacherExam() {\n  const { currentUser } = useAuth();|g" src/pages/exams/TeacherExam.tsx
sed -i "s|const assignedClasses = \\['Class 10'\\];|const assignedClasses = currentUser?.assignedClasses \|\| \\['Class 10'\\];|g" src/pages/exams/TeacherExam.tsx
sed -i "s|const assignedSubjects = \\['Maths', 'Science'\\];|const assignedSubjects = currentUser?.subjects \|\| \\['Maths', 'Science'\\];|g" src/pages/exams/TeacherExam.tsx
