// Run this once: node generate_seed.js
// It reads poore_school_1257_students.json and writes generatedStudents.json

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure classes are exact strings (No "Class 1", just "1")
const CLASS_ORDER = [
  'Nursery', 'LKG', 'UKG',
  '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'
];

function classNameToId(cls) {
  // Try to match roman numerals from original JSON if needed
  const romanMap = {
    'I': '1', 'II': '2', 'III': '3', 'IV': '4', 'V': '5', 'VI': '6',
    'VII': '7', 'VIII': '8', 'IX': '9', 'X': '10', 'XI': '11', 'XII': '12'
  };
  return romanMap[cls] || cls;
}

const rawStudents = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'public', 'poore_school_1257_students.json'), 'utf8')
);

// Group by class
const byClass = {};
for (const s of rawStudents) {
  let cls = s.class && s.class.trim();
  if (!cls) continue;

  // Normalize original roman numeral classes to our new clean array
  cls = classNameToId(cls);

  if (!byClass[cls]) byClass[cls] = [];
  byClass[cls].push({
    name: (s.name || '').trim(),
    father_name: (s.father_name || '').trim(),
    section: (s.section || 'A').trim()
  });
}

const students = [];
const classesData = [];
let globalIdx = 1;

for (const cls of CLASS_ORDER) {
  const list = byClass[cls];
  if (!list || !list.length) continue;

  const classId = cls; // ID is now "Nursery", "1", "12" etc.
  const className = cls; // Name is exactly the same, no "Class " prefix

  // Sort alphabetically
  list.sort((a, b) => a.name.localeCompare(b.name));

  const uniqueSections = [...new Set(list.map(s => s.section))].sort();
  const classSections = uniqueSections.map(sec => ({
    id: `c${classId}-s${sec}`,
    name: sec
  }));

  list.forEach((student, idx) => {
    const position = idx + 1;
    const posPadded = position.toString().padStart(3, '0'); // e.g. 001, 045

    // NEW ROLL NUMBER LOGIC (With 132426 Prefix for classes 1-12)
    let rollNumber = '';
    if (cls === 'Nursery') {
      rollNumber = `N-${position.toString().padStart(2, '0')}`;
    } else if (cls === 'LKG') {
      rollNumber = `LKG${posPadded}`;
    } else if (cls === 'UKG') {
      rollNumber = `UKG${posPadded}`;
    } else {
      // Classes 1 to 12
      const classIdPadded = cls.padStart(2, '0'); // '1' becomes '01', '10' stays '10'
      rollNumber = `132426${classIdPadded}${posPadded}`; // e.g. 13242610001
    }

    const section = student.section || 'A';

    students.push({
      id: `student_${globalIdx}`,
      name: student.name,
      role: 'Student',
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=FDF3E7&color=A05C2B&bold=true&size=128`,
      className, // Just "Nursery" or "10"
      classId,
      section,
      sectionId: `c${classId}-s${section}`,
      sectionName: section,
      rollNumber,
      transportMode: 'Self/Walking',
      attendanceHistory: [],
      guardianDetails: {
        guardianName: student.father_name,
        guardianRelation: 'Father',
        guardianPhone: ''
      }
    });
    globalIdx++;
  });

  classesData.push({ id: classId, className, sections: classSections });
  console.log(`  ${className}: ${list.length} students, sections: [${uniqueSections.join(', ')}]`);
}

// Write seedData.ts
const teacherNames = [
  'Anita Sharma', 'Rajiv Kumar', 'Sunita Verma', 'Pramod Singh', 'Kavita Gupta',
  'Arun Mishra', 'Meena Yadav', 'Suresh Joshi', 'Priya Tiwari', 'Vikram Rao',
  'Rekha Patel', 'Sanjay Malhotra', 'Pooja Chauhan', 'Rajeev Saxena', 'Nidhi Agarwal',
  'Amit Pandey', 'Shilpa Bhatia', 'Manoj Trivedi', 'Deepa Kapoor', 'Naresh Dubey',
  'Vandana Srivastava', 'Harish Chandra', 'Usha Pathak', 'Girish Gautam', 'Lata Shukla',
  'Devendra Bajpai', 'Manju Dixit', 'Ramesh Awasthi', 'Sarla Mehta', 'Vinod Kesarwani',
  'Poonam Yadav', 'Dinesh Rawat', 'Archana Negi', 'Bharat Bhushan', 'Sarita Singh',
  'Hemant Jha', 'Sudha Ranjan', 'Kamal Kishore', 'Renu Saxena', 'Ajay Prakash'
];

const SUBJECTS = ['Mathematics', 'Science', 'English', 'Hindi', 'Social Science', 'Physics', 'Chemistry', 'Biology', 'Computer'];

const teachers = [];
for (let i = 1; i <= 40; i++) {
  const isClassTeacher = i <= 15;
  const ctClassId = isClassTeacher ? CLASS_ORDER[i - 1] : undefined;
  const ctClassName = isClassTeacher ? CLASS_ORDER[i - 1] : undefined;

  const assignedClasses = [];
  if (isClassTeacher && ctClassName) assignedClasses.push(ctClassName);
  for (let j = 0; j < 2; j++) {
    const extra = CLASS_ORDER[Math.floor(Math.random() * CLASS_ORDER.length)];
    if (!assignedClasses.includes(extra)) assignedClasses.push(extra);
  }

  const tSubs = i <= 5 ? ['Mathematics', 'Science'] : [SUBJECTS[i % SUBJECTS.length]];

  const t = {
    id: `teacher_${i}`,
    name: teacherNames[i - 1] || `Teacher ${i}`,
    role: 'Teacher',
    avatarUrl: `https://i.pravatar.cc/150?u=teacher_${i}`,
    assignedClasses,
    subjects: tSubs,
    ...(isClassTeacher ? {
      isClassTeacher: true,
      classId: ctClassId,
      className: ctClassName,
      classTeacherClass: ctClassName
    } : {})
  };
  teachers.push(t);
}

const allData = {
  students,
  classes: classesData,
  teachers
};

fs.writeFileSync(
  path.join(__dirname, 'src', 'utils', 'generatedStudents.json'),
  JSON.stringify(allData, null, 2)
);

console.log(`\n✅ Generated generatedStudents.json`);
console.log(`   Students: ${students.length}`);
console.log(`   Classes:  ${classesData.length}`);
console.log(`   Teachers: ${teachers.length}`);