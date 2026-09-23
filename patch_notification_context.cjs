const fs = require('fs');
let code = fs.readFileSync('src/context/NotificationContext.tsx', 'utf8');

const target = `const updated = allNotifications.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    );`;

const replacement = `const updated = allNotifications.map(n => 
      (n.id === id && ((n as any).recipientId === currentUser?.id || n.recipientIds?.includes(currentUser?.id || '') || n.recipientRole === currentUser?.role || (!n.recipientIds && !n.recipientRole))) 
      ? { ...n, isRead: true } : n
    );`;

code = code.replace(target, replacement);
fs.writeFileSync('src/context/NotificationContext.tsx', code);
