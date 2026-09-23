const fs = require('fs');

let file = fs.readFileSync('src/pages/attendance/TeacherAttendance.tsx', 'utf8');

const saveLogic = `
  const syncAttendanceToUsers = (records) => {
    const today = new Date().toISOString().split('T')[0];
    const users = JSON.parse(localStorage.getItem('ajps_users') || '[]');
    let updated = false;

    const newUsers = users.map((u) => {
      if (records[u.id]) {
        updated = true;
        const history = u.attendanceHistory || [];
        const existingIdx = history.findIndex((h) => h.date.startsWith(today));
        if (existingIdx >= 0) {
          history[existingIdx].status = records[u.id];
        } else {
          history.push({ date: new Date().toISOString(), status: records[u.id] });
        }
        return { ...u, attendanceHistory: history };
      }
      return u;
    });

    if (updated) {
      localStorage.setItem('ajps_users', JSON.stringify(newUsers));
      window.dispatchEvent(new Event('ajps_users_updated'));
    }
  };

  const handleSave = () => {
    const today = new Date().toISOString().split('T')[0];
    const allRecords = JSON.parse(localStorage.getItem('ajps_attendance') || '{}');
    
    if (!allRecords[classDetails.id]) {
      allRecords[classDetails.id] = {};
    }
    allRecords[classDetails.id][today] = {
      records: attendance,
      isLocked: isLocked
    };
    localStorage.setItem('ajps_attendance', JSON.stringify(allRecords));
    syncAttendanceToUsers(attendance);
    notifyAbsentees();
    triggerSuccess('Attendance saved successfully');
  };

  const handleLock = () => {
    setIsLocked(true);
    const today = new Date().toISOString().split('T')[0];
    const allRecords = JSON.parse(localStorage.getItem('ajps_attendance') || '{}');
    
    if (!allRecords[classDetails.id]) {
      allRecords[classDetails.id] = {};
    }
    allRecords[classDetails.id][today] = {
      records: attendance,
      isLocked: true
    };
    localStorage.setItem('ajps_attendance', JSON.stringify(allRecords));
    syncAttendanceToUsers(attendance);
    notifyAbsentees();
    triggerSuccess('Attendance finalized and locked');
  };
`;

file = file.replace(/const handleSave = \(\) => \{[\s\S]*?triggerSuccess\('Attendance finalized and locked'\);\n  \};/, saveLogic.trim());

// We also need window.dispatchEvent(new Event('new-notification')) in notifyAbsentees
const notifyAbsLogic = `  const notifyAbsentees = () => {
    const absentees = classDetails.students.filter(s => attendance[s.id] === 'Absent');
    if (absentees.length > 0) {
      NotificationService.sendNotification({
        recipientIds: absentees.map(a => a.id),
        title: 'Absence Alert',
        message: \`Your child was marked absent today in \${classDetails.name}.\`,
        type: 'warning'
      });
      window.dispatchEvent(new Event('new-notification'));
    }
  };`;
  
file = file.replace(/const notifyAbsentees = \(\) => \{[\s\S]*?\}\n  \};/, notifyAbsLogic.trim());

fs.writeFileSync('src/pages/attendance/TeacherAttendance.tsx', file);
