export type Role = 'Admin' | 'Teacher' | 'Driver' | 'Student';

export interface User {
  id: string;
  name: string;
  role: Role;
  avatarUrl: string;
  className?: string;
  classId?: string;
  section?: string;
  sectionId?: string;
  sectionName?: string;
  rollNumber?: string;
  assignedClasses?: string[];
  subjects?: string[];
  isClassTeacher?: boolean;
  classTeacherClass?: string; // className of the class they are CT for
  transportMode?: string;
  attendanceHistory?: { date: string; status: string; checkInTime?: string; checkOutTime?: string; }[];
  documents?: { id: string; name: string; url: string; date: string }[];
  personalDetails?: {
    dob: string;
    gender: string;
    bloodGroup: string;
    religion: string;
    phone: string;
    email: string;
    address: string;
  };
  guardianDetails?: {
    guardianName: string;
    guardianRelation: string;
    guardianPhone: string;
  };
  // --- Teacher Specific Fields ---
  contact?: string;
  emergencyContact?: string;
  dob?: string;
  gender?: string;
  fathersName?: string;
  experienceYears?: number;
  extraResponsibilities?: string[];
  faceIdStatus?: 'Pending' | 'Completed';
  proxyClassId?: string | null;
  profilePhotoUrl?: string;
  assignedClass?: string;
  classTeacherSection?: string;
  hasProxyAssigned?: boolean;
  feeDues?: number;
}

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';
export type PeriodKey = 'p1' | 'p2' | 'p3' | 'p4' | 'p5' | 'p6';

export type DailySchedule = {
  [key in PeriodKey]?: string; // teacherId
};

export interface Timetable {
  classId: string;
  sectionId: string;
  isLocked?: boolean;
  schedule: {
    [key in DayOfWeek]: DailySchedule;
  };
}

// ─── Notice Board Types ───────────────────────────────────────
export type AudienceRole = 'Student' | 'Teacher' | 'Both';

export type TemplateType =
  | 'custom'
  | 'change_timings' | 'holiday' | 'new_event' | 'urgent_alert'
  | 'fee_defaulter' | 'missing_document' | 'disciplinary_action' | 'exam_debarment'
  | 'staff_meeting' | 'deadline_alert' | 'substitution';

export interface Notice {
  id: string;
  audienceRole: AudienceRole;
  targetClasses?: string[];
  targetStudentIds?: string[];
  title: string;
  message: string;
  datePosted: string;
  targetDate?: string;
  author: string;
  authorRole: string;
  templateType: TemplateType;
  readBy?: string[];
  effectiveDate?: string;
  isHoliday?: boolean;
}

// ─── Transport Module Types ────────────────────────────────────
export interface Trip {
  id: string;
  busId: string;
  date: string;
  type: 'Morning' | 'Afternoon';
  trackedKms: number;
  status: 'Completed' | 'Pending' | 'In Transit';
}

export interface SlipCycle {
  cycleId: string;
  busId: string;
  startDate: string;
  endDate: string;
  startOdo: number;
  endOdo: number;
  totalFuelLiters: number;
  totalCost: number;
  avgMileage: number;
  receiptImages: string[];
}

export interface LocationPoint {
  lat: number;
  lng: number;
  timestamp: number;
  speed: number;
  isOfflineCached?: boolean;
}

export interface Alert {
  type: 'VehicleMismatch' | 'OdoMismatch' | 'GeofenceBreach';
  message: string;
  timestamp: string;
  severity: 'High';
}

