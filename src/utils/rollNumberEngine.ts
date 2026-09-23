import { User } from '../types';
import { NotificationService } from '../services/NotificationService';

/**
 * Recalculates roll numbers for all students in a given class (globally across all sections)
 * by sorting them alphabetically by name (1, 2, 3...).
 *
 * Base prefix: "132426"
 * Sequence Number: 3-digit padded number.
 * Example Class 8: 1324268001, 1324268002, etc.
 * 
 * Any student whose roll number *changes* due to the insertion of a new student
 * receives a notification: "System Update: Your Roll Number has been updated to
 * [New Roll No] due to class reshuffling."
 *
 * @param allUsers - The full list of all users from localStorage.
 * @param classId - The ID of the class to recalculate. (e.g. '8' or 'cls-8')
 * @returns The full updated users array with recalculated roll numbers.
 */
export function recalculateClassRollNumbers(
  allUsers: User[],
  classId: string,
  strategy: 'alphabetical' | 'append' = 'alphabetical'
): User[] {
  const numericClassId = classId.replace('cls-', '');
  
  const unaffected = allUsers.filter(
    u => u.role !== 'Student' || u.classId !== classId
  );

  let classStudents = allUsers.filter(
    u => u.role === 'Student' && u.classId === classId
  );

  let updatedStudents: User[] = [];

  if (strategy === 'alphabetical') {
    const sorted = [...classStudents].sort((a, b) =>
      a.name.localeCompare(b.name, 'en', { sensitivity: 'base' })
    );

    updatedStudents = sorted.map((student, index) => {
      const sequenceNumber = (index + 1).toString().padStart(3, '0');
      const newRollNumber = `132426${numericClassId}${sequenceNumber}`;
      const oldRollNumber = student.rollNumber;

      if (oldRollNumber && oldRollNumber !== newRollNumber) {
        NotificationService.sendNotification({
          recipientIds: [student.id],
          title: 'Roll Number Updated',
          message: `System Update: Your Roll Number has been updated to ${newRollNumber} due to global class reshuffling.`,
          type: 'SYSTEM',
          actionPath: '/students',
          actionLabel: 'View Directory',
        });
      }

      return { ...student, rollNumber: newRollNumber };
    });
  } else {
    // Append strategy
    const existingWithRoll = classStudents.filter(s => s.rollNumber && s.rollNumber.startsWith(`132426${numericClassId}`));
    const withoutRoll = classStudents.filter(s => !s.rollNumber || !s.rollNumber.startsWith(`132426${numericClassId}`));

    // Find the maximum sequence number among existing
    let maxSeq = 0;
    existingWithRoll.forEach(s => {
      const seqStr = s.rollNumber.slice(-3);
      const seq = parseInt(seqStr, 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    });

    // Sort new ones alphabetically before appending
    const sortedWithoutRoll = [...withoutRoll].sort((a, b) =>
      a.name.localeCompare(b.name, 'en', { sensitivity: 'base' })
    );

    const newlyAssigned = sortedWithoutRoll.map((student, index) => {
      const sequenceNumber = (maxSeq + index + 1).toString().padStart(3, '0');
      const newRollNumber = `132426${numericClassId}${sequenceNumber}`;
      return { ...student, rollNumber: newRollNumber };
    });

    updatedStudents = [...existingWithRoll, ...newlyAssigned];
  }

  return [...unaffected, ...updatedStudents];
}
