const fs = require('fs');
let code = fs.readFileSync('src/services/NotificationService.ts', 'utf8');

const importReplacement = `
export interface NotificationPayload {
  recipientIds?: string[];
  role?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'badge' | 'SYSTEM' | 'LEAVE_REQUEST' | 'FEE_ALERT';
  metadata?: any;
  actionPath?: string;
  actionLabel?: string;
}

export interface StoredNotification extends NotificationPayload {
  id: string;
  timestamp: string;
  isRead: boolean;
  createdAt?: string;
  recipientRole?: string;
}
`;
code = code.replace(/export interface NotificationPayload \{[\s\S]*?recipientRole\?: string;\n\}/, importReplacement.trim());

fs.writeFileSync('src/services/NotificationService.ts', code);
