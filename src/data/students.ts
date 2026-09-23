import { generateRollNumber } from '../utils/studentUtils';

const RAW_STUDENTS = [
  { id: '1', name: 'Aarav Patel', className: 'Class 10', section: 'Section A' },
  { id: '2', name: 'Diya Sharma', className: 'Class 10', section: 'Section A' },
  { id: '3', name: 'Rohan Singh', className: 'Class 10', section: 'Section A' },
  { id: '4', name: 'Santosh Kumar', className: 'Class 10', section: 'Section A' },
  { id: '5', name: 'Aditi Verma', className: 'Class 10', section: 'Section B' },
  { id: '6', name: 'Karan Mehra', className: 'Class 10', section: 'Section B' },
  { id: '7', name: 'Ananya Gupta', className: 'Class 9', section: 'Section A' },
  { id: '8', name: 'Kabir Das', className: 'Class 9', section: 'Section A' },
  { id: '9', name: 'Priya Raj', className: 'Class 8', section: 'Section A' },
];

export const DIRECTORY_STUDENTS = (() => {
  // Group by class and section to assign alphabetical index correctly
  const grouped: Record<string, any[]> = {};
  
  RAW_STUDENTS.forEach(student => {
    const key = `${student.className}-${student.section}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(student);
  });

  const processed: any[] = [];
  
  Object.keys(grouped).forEach(key => {
    const sorted = grouped[key].sort((a, b) => a.name.localeCompare(b.name));
    sorted.forEach((student, index) => {
       processed.push({
         ...student,
         roll: generateRollNumber(student.className, index + 1)
       });
    });
  });

  return processed.sort((a, b) => parseInt(a.id) - parseInt(b.id));
})();
