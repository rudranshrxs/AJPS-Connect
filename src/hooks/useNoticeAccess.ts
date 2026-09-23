import { useAuth } from '../context/AuthContext';

interface NoticeAccessResult {
  canCreate: boolean;
  audienceLocked: boolean;
  lockedAudienceClassId: string | null;
  lockedMessage: string | null;
}

export function useNoticeAccess(): NoticeAccessResult {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return { canCreate: false, audienceLocked: false, lockedAudienceClassId: null, lockedMessage: null };
  }

  // Admin / Principal → full access
  if (currentUser.role === 'Admin') {
    return { canCreate: true, audienceLocked: false, lockedAudienceClassId: null, lockedMessage: null };
  }

  // Teacher → can create but audience is locked to their assigned class
  if (currentUser.role === 'Teacher') {
    if (currentUser.isClassTeacher) {
      return {
        canCreate: true,
        audienceLocked: true,
        lockedAudienceClassId: currentUser.classId || currentUser.classTeacherClass?.replace('Class ', '') || null,
        lockedMessage: 'As a Class Teacher, you can only notify your class.',
      };
    }

    // Non-class-teacher → cannot create
    return {
      canCreate: false,
      audienceLocked: true,
      lockedAudienceClassId: null,
      lockedMessage: 'Only Admins and Class Teachers can compose notices.',
    };
  }

  // Students / Drivers → cannot create
  return { canCreate: false, audienceLocked: false, lockedAudienceClassId: null, lockedMessage: null };
}
