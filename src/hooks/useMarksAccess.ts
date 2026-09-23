import { useAuth } from '../context/AuthContext';
import { useAcademic } from '../context/academicContext';

export interface MarksAccess {
  canView: boolean;
  canEdit: boolean;
}

export function useMarksAccess(studentClassId: string, subjectId: string): MarksAccess {
  const { currentUser } = useAuth();
  const { exams } = useAcademic();

  // If there's no user, deny access
  if (!currentUser) {
    return { canView: false, canEdit: false };
  }

  // Admin gets full access globally
  if (currentUser.role === 'Admin') {
    // Check if the specific exam we are looking at is published globally
    // We don't have examId in the parameters here, so we will handle the global `isPublished` lock
    // inside the components that call this hook (or pass examId to this hook).
    // Let's assume Admin has base access. Global lock will be applied by the caller or by checking the exam directly.
    return { canView: true, canEdit: true };
  }

  // If the user is a Teacher
  if (currentUser.role === 'Teacher') {
    // Check if Class Teacher
    const isClassTeacher = currentUser.isClassTeacher && (currentUser.classId === studentClassId || currentUser.className === studentClassId || `Class ${currentUser.classId}` === studentClassId);
    
    // Check if Subject Teacher
    const isSubjectTeacher = currentUser.subjects?.includes(subjectId);
    
    // For Class Teachers: Can view and edit ALL subjects for their assigned class
    if (isClassTeacher) {
      return { canView: true, canEdit: true };
    }
    
    // For Subject Teachers: Can view and edit ONLY specific subjects
    // Note: To be fully strict, we should also check if they are assigned to this *specific* class for this subject.
    // Based on the prompt: "SUBJECT_TEACHER: Can view and edit marks ONLY for entries matching their assignedSubjects array (both subjectId AND classId must match)."
    // The current mock data for teachers has `subjects: string[]` but not an assignedSubjects array with classIds.
    // We will check if the user is assigned to the class in general (via localStorage timetables or classes) AND has the subject.
    
    const classes = JSON.parse(localStorage.getItem('ajps_classes') || '[]');
    const myClassIds = new Set<string>();
    
    const timetables = JSON.parse(localStorage.getItem('ajps_timetables') || '[]');
    timetables.forEach((tt: any) => {
      Object.values(tt.schedule).forEach((day: any) => {
        Object.values(day).forEach((slot) => {
           if (slot === currentUser.id) {
              myClassIds.add(tt.className || tt.classId);
           }
        });
      });
    });
    
    // Removed fallback that previously granted access to all classes if no periods were assigned

    const classNames = Array.from(myClassIds).map(id => {
      const found = classes.find((c: any) => c.id === id || c.className === id);
      return found ? found.className || found.id : id;
    });

    const isAssignedToClass = classNames.includes(studentClassId) || 
                              classNames.includes(`Class ${studentClassId}`) || 
                              classNames.some(ac => ac?.toLowerCase().trim() === studentClassId?.toLowerCase().trim());

    if (isSubjectTeacher && isAssignedToClass) {
      return { canView: true, canEdit: true };
    }
    
    return { canView: false, canEdit: false };
  }

  // Student or Parent
  return { canView: false, canEdit: false };
}
