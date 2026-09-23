const fs = require('fs');
let code = fs.readFileSync('src/hooks/useLiveNotifications.ts', 'utf8');

const target = `const updated = all.map(n => 
      (n.id === id && (n.recipientRole === currentUser?.role || n.recipientIds?.includes(currentUser?.id || '') || !n.recipientIds)) 
      ? { ...n, isRead: true } : n
    );`;

const replacement = `const updated = all.map(n => 
      (n.id === id && ((n as any).recipientId === currentUser?.id || n.recipientIds?.includes(currentUser?.id || '') || n.role === currentUser?.role || (!n.recipientIds && !n.role))) 
      ? { ...n, isRead: true } : n
    );`;

code = code.replace(target, replacement);
fs.writeFileSync('src/hooks/useLiveNotifications.ts', code);
