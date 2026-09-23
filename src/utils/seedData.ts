import { User } from '../types';
import generatedData from './generatedStudents.json';

const SUBJECTS = ['Mathematics', 'Science', 'English', 'Hindi', 'Social Science', 'Physics', 'Chemistry', 'Biology', 'Computer'];

export async function initializeDummyDatabase(): Promise<void> {
  // Patch existing teachers with subjects if missing (non-destructive)
  const existingUsersStr = localStorage.getItem('ajps_users');
  if (existingUsersStr) {
    let existingUsers = JSON.parse(existingUsersStr);
    let needsUpdate = false;
    existingUsers = existingUsers.map((u: any) => {
      if (u.role === 'Teacher') {
        if (!u.subjects || u.subjects.length === 0 || !SUBJECTS.includes(u.subjects[0])) {
          needsUpdate = true;
          return { ...u, subjects: [SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)]] };
        }
      }
      return u;
    });
    if (needsUpdate) localStorage.setItem('ajps_users', JSON.stringify(existingUsers));
  }

  // Check if already seeded with v10
  if (localStorage.getItem('isSeeded_v10') === 'true') return;

  console.log('🚀 AJPS: Loading 1257 real students into database...');

  // Clear old seed flags and stale data
  localStorage.removeItem('isSeeded_v8');
  localStorage.removeItem('isSeeded_v9');
  localStorage.setItem('ajps_exams', '[]');
  localStorage.setItem('ajps_leaves', '[]');
  localStorage.setItem('ajps_notifications', '[]');
  localStorage.setItem('amar_jyoti_notifications', '[]');
  localStorage.setItem('ajps_attendance', '{}');
  localStorage.setItem('ajps_results', '[]');
  localStorage.setItem('ajps_datesheets', '[]');
  localStorage.setItem('ajps_fees', '[]');

  const users: User[] = [];

  // ─── Admin ──────────────────────────────────────────────────────────────────
  users.push({
    id: 'admin_1',
    name: 'Principal Verma',
    role: 'Admin',
    avatarUrl: 'https://i.pravatar.cc/150?u=admin_1'
  });

  // ─── Drivers ────────────────────────────────────────────────────────────────
  const driverData = [
    { id: 'driver_R1', name: 'Ramesh Singh' },
    { id: 'driver_R2', name: 'Suresh Yadav' },
    { id: 'driver_R3', name: 'Dinesh Gurjar' },
    { id: 'driver_R4', name: 'Mukesh Sharma' },
    { id: 'driver_R5', name: 'Rajesh Verma' },
  ];
  driverData.forEach(d => {
    users.push({ id: d.id, name: d.name, role: 'Driver', avatarUrl: `https://i.pravatar.cc/150?u=${d.id}` });
  });

  // ─── Teachers (from generated data) ─────────────────────────────────────────
  (generatedData.teachers as User[]).forEach(t => users.push(t));

  // ─── Students (from generated data — 1257 real students) ────────────────────
  (generatedData.students as User[]).forEach(s => users.push(s));

  // ─── Build timetable structure ───────────────────────────────────────────────
  const emptyDay = { p1: '', p2: '', p3: '', p4: '', p5: '', p6: '' };
  const newTimetables: any[] = [];
  for (const cls of generatedData.classes as any[]) {
    for (const sec of cls.sections) {
      newTimetables.push({
        classId: cls.id,
        className: cls.className,
        sectionId: sec.id,
        sectionName: sec.name,
        isLocked: false,
        schedule: {
          monday: { ...emptyDay },
          tuesday: { ...emptyDay },
          wednesday: { ...emptyDay },
          thursday: { ...emptyDay },
          friday: { ...emptyDay },
          saturday: { ...emptyDay }
        }
      });
    }
  }

  localStorage.setItem('ajps_users', JSON.stringify(users));
  localStorage.setItem('ajps_classes', JSON.stringify(generatedData.classes));
  localStorage.setItem('ajps_timetables', JSON.stringify(newTimetables));
  localStorage.setItem('isSeeded_v10', 'true');

  const totalStudents = users.filter(u => u.role === 'Student').length;
  console.log(`✅ Seeding complete! ${totalStudents} students | ${generatedData.classes.length} classes`);
}
