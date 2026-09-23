const fs = require('fs');
let code = fs.readFileSync('src/services/NotificationService.ts', 'utf8');

const target = `id: Date.now().toString() + Math.random().toString(36).substring(2),`;
const replacement = 'id: `notif-${Date.now()}-${payload.recipientIds?.[0] || "all"}-${Math.random().toString(36).substr(2, 9)}`,';

code = code.replace(target, replacement);
fs.writeFileSync('src/services/NotificationService.ts', code);
