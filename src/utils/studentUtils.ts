export const generateRollNumber = (className: string, index: number) => {
  const match = className.match(/\d+/);
  const classNum = match ? match[0] : '0';
  const paddedIndex = index.toString().padStart(2, '0');
  return `132426${classNum}0${paddedIndex}`;
};

// Strip the static school prefix "132426" from roll numbers for compact display
export const formatRollNo = (roll: string | undefined): string => {
  if (!roll) return 'N/A';
  return roll.replace(/^132426/, '');
};

export const formatClassSectionDisplay = (className: string | undefined, section: string | undefined): string => {
  if (!className && !section) return 'N/A';
  
  const classMatch = (className || '').match(/\d+/);
  let formattedClass = className || '';
  if (classMatch) {
    const num = parseInt(classMatch[0], 10);
    if (num === 1) formattedClass = '1st';
    else if (num === 2) formattedClass = '2nd';
    else if (num === 3) formattedClass = '3rd';
    else formattedClass = `${num}th`;
  } else if (className?.toLowerCase().includes('lkg')) {
    formattedClass = 'LKG';
  } else if (className?.toLowerCase().includes('ukg')) {
    formattedClass = 'UKG';
  } else if (className?.toLowerCase().includes('nursery')) {
    formattedClass = 'Nursery';
  }

  let formattedSection = section || '';
  if (formattedSection.toLowerCase().includes('section ')) {
    formattedSection = formattedSection.replace(/section /i, '').trim();
  }
  
  if (formattedClass && formattedSection && formattedSection !== 'N/A' && formattedSection !== 'ALL') {
    return `${formattedClass} - ${formattedSection}`;
  } else if (formattedClass) {
    return formattedClass;
  }
  return formattedSection;
};

export interface StudentStats {
  attendancePercent: number;   // 0–100
  recentGrade: string;         // 'A+', 'A', 'B', etc.
  recentExamPercent: number;   // 0–100
  isFeeDue: boolean;
  feeStatus: string;
  transportMode: string;
}

export const getStudentStats = (studentId: string): StudentStats => {
  // 1. Attendance
  let attendancePercent = 85;
  try {
    const attData = JSON.parse(localStorage.getItem('ajps_attendance') || '{}');
    if (attData[studentId]) {
      const records = Object.values(attData[studentId]) as string[];
      const present = records.filter(r => r === 'Present').length;
      const total = records.length;
      if (total > 0) attendancePercent = Math.round((present / total) * 100);
    }
  } catch (_) {}

  // 2. Exam grade (most recent published result)
  let recentGrade = 'B+';
  let recentExamPercent = 70;
  try {
    const examData: any[] = JSON.parse(localStorage.getItem('ajps_results') || '[]');
    const published = examData.filter(r => r.isPublished);
    for (let i = published.length - 1; i >= 0; i--) {
      const marks = published[i].marks?.[studentId];
      if (marks) {
        const vals = Object.values(marks) as number[];
        const total = vals.reduce((s, v) => s + v, 0);
        const perc = vals.length > 0 ? (total / (vals.length * 100)) * 100 : 0;
        recentExamPercent = Math.round(perc);
        if (perc >= 90) recentGrade = 'A+';
        else if (perc >= 80) recentGrade = 'A';
        else if (perc >= 70) recentGrade = 'B+';
        else if (perc >= 60) recentGrade = 'B';
        else if (perc >= 50) recentGrade = 'C';
        else if (perc >= 33) recentGrade = 'D';
        else recentGrade = 'F';
        break;
      }
    }
  } catch (_) {}

  // 3. Fee status from ajps_fees transactions
  let isFeeDue = false;
  let feeStatus = 'Paid';
  try {
    const TOTAL_YEARLY_FEE = 35000;
    const feeData: any[] = JSON.parse(localStorage.getItem('ajps_fees') || '[]');
    const paid = feeData
      .filter(t => t.studentId === studentId && t.status === 'approved')
      .reduce((s, t) => s + (t.amount || 0), 0);
    const outstanding = Math.max(0, TOTAL_YEARLY_FEE - paid);
    isFeeDue = outstanding > 0;
    feeStatus = outstanding > 0 ? `Due ₹${outstanding.toLocaleString('en-IN')}` : 'Paid';
  } catch (_) {
    // Fallback: deterministic mock
    isFeeDue = parseInt(studentId.replace(/\D/g, '') || '0') % 3 === 0;
    feeStatus = isFeeDue ? 'Due ₹2,500' : 'Paid';
  }

  // 4. Transport from users
  let transportMode = 'Self/Walking';
  try {
    const users: any[] = JSON.parse(localStorage.getItem('ajps_users') || '[]');
    const u = users.find(u => u.id === studentId);
    if (u?.transportMode) transportMode = u.transportMode;
  } catch (_) {}

  return { attendancePercent, recentGrade, recentExamPercent, isFeeDue, feeStatus, transportMode };
};

// Legacy compatibility
export const getInterconnectedData = (studentId: string, _currentUser?: any) => {
  const s = getStudentStats(studentId);
  return {
    attendancePerc: `${s.attendancePercent}%`,
    recentGrade: s.recentGrade,
    feeStatus: s.feeStatus,
    isFeeDue: s.isFeeDue,
    transportMode: s.transportMode,
  };
};

