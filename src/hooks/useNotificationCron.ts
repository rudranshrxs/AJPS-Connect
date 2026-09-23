import { useEffect } from 'react';
import { NotificationService } from '../services/NotificationService';
import { User } from '../types';

export function useNotificationCron() {
  useEffect(() => {
    const runCron = () => {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const tomorrow = new Date(now.getTime() + 86400000);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      const currentHour = now.getHours();
      
      const cronLog = JSON.parse(localStorage.getItem('ajps_cron_log') || '{}');
      const users: User[] = JSON.parse(localStorage.getItem('ajps_users') || '[]');
      const students = users.filter(u => u.role === 'Student');

      const hasRun = (key: string) => !!cronLog[key];
      const markRun = (key: string) => { cronLog[key] = true; };

      // B.18 Exam Reminder (8:00 PM the night before an exam -> Specific Students)
      if (currentHour >= 20) {
        const exams = JSON.parse(localStorage.getItem('ajps_exams') || '[]');
        exams.forEach((exam: any) => {
          if (exam.date === tomorrowStr) {
            const key = `exam_rem_${exam.id}_${todayStr}`;
            if (!hasRun(key)) {
              // Find students in the targeted class
              const targetStudents = students.filter(s => s.className === exam.classId);
              if (targetStudents.length > 0) {
                NotificationService.sendNotification({
                  recipientIds: targetStudents.map(s => s.id),
                  title: 'Exam Reminder',
                  message: `Reminder: You have an exam for ${exam.subject} tomorrow!`,
                  type: 'warning'
                });
                markRun(key);
              }
            }
          }
        });
      }

      // Strict Exam Reminder for Admin (3 days prior if missing datesheet/criteria)
      const exams = JSON.parse(localStorage.getItem('ajps_exams') || '[]');
      exams.forEach((exam: any) => {
         if (!exam.startDate) return;
         const start = new Date(exam.startDate);
         const diffTime = start.getTime() - now.getTime();
         const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
         if (diffDays <= 3 && diffDays > 0) {
             const datesheets = JSON.parse(localStorage.getItem('ajps_datesheets') || '[]');
             const hasDatesheet = datesheets.some((d: any) => d.examId === exam.id && d.schedule && d.schedule.length > 0);
             const hasCriteria = exam.criteria && exam.criteria.totalMarks > 0;
             if (!hasDatesheet || !hasCriteria) {
                 const key = `exam_strict_rem_${exam.id}_${todayStr}`;
                 if (!hasRun(key)) {
                    NotificationService.sendNotification({
                      role: 'Admin',
                      title: 'STRICT ACTION REQUIRED',
                      message: `Exam ${exam.name} starts in ${diffDays} days but is missing datesheet or criteria!`,
                      type: 'warning',
                      actionPath: '/admin/exams',
                      actionLabel: 'Resolve Now'
                    });
                    markRun(key);
                 }
             }
         }
      });

      // B.19 Low Attendance (< 75% -> Specific Student & Class Teacher)
      // Runs on the 1st of every month to check previous month's attendance
      if (now.getDate() === 1) {
        const monthKey = `${now.getFullYear()}-${now.getMonth()}`;
        if (!hasRun(`low_att_${monthKey}`)) {
          // (Simulated logic: in reality, parse ajps_attendance and calculate specific percentages)
          // We'll just set the log key so it only runs once per month.
          markRun(`low_att_${monthKey}`);
        }
      }

      // B.20 Birthday Wish (12:00 AM on birthday -> Specific Student & Class Teacher)
      // Since seed data lacks exact DOB, we check if DOB exists and matches MM-DD
      const mmdd = todayStr.substring(5);
      students.forEach(student => {
        const dob = (student as any).dob;
        if (dob && dob.substring(5) === mmdd) {
          const key = `bday_${student.id}_${todayStr}`;
          if (!hasRun(key)) {
            NotificationService.sendNotification({
              recipientIds: [student.id],
              title: 'Happy Birthday! 🎉',
              message: `Wishing you a fantastic birthday, ${student.name}!`,
              type: 'info'
            });
            markRun(key);
          }
        }
      });

      // B.21 Performance Drop (>20% drop from last exam -> Specific Student/Parent)
      // Assumes results logic runs during publishing, but cron can double-check historical averages.
      
      // B.22 100% Streak (Last day of the month -> Specific Student)
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      if (now.getDate() === lastDayOfMonth.getDate()) {
        const monthKey = `streak_100_${now.getFullYear()}_${now.getMonth()}`;
        if (!hasRun(monthKey)) {
          // (Simulated logic: would check attendance matrix for full present records)
          markRun(monthKey);
        }
      }

      // B.23 PTM Reminder (Day before PTM date -> All Parents)
      const notices = JSON.parse(localStorage.getItem('ajps_notices') || '[]');
      notices.forEach((notice: any) => {
        // If notice title contains "PTM" and it's scheduled for tomorrow
        if (notice.title?.toLowerCase().includes('ptm') && notice.date === tomorrowStr) {
          const key = `ptm_rem_${notice.id}_${todayStr}`;
          if (!hasRun(key)) {
            NotificationService.sendNotification({
              role: 'Student', // Parents view via Student login in this PWA
              title: 'PTM Reminder',
              message: `Don't forget: ${notice.title} is scheduled for tomorrow.`,
              type: 'info'
            });
            markRun(key);
          }
        }
      });

      localStorage.setItem('ajps_cron_log', JSON.stringify(cronLog));
    };

    // Run once on mount and then every minute
    runCron();
    const intervalId = setInterval(runCron, 60000);

    return () => clearInterval(intervalId);
  }, []);
}
