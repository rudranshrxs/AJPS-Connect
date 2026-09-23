import { Role } from './index';

export type NotificationType = 'LEAVE_REQUEST' | 'FEE_ALERT' | 'GENERAL' | 'SYSTEM';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  readBy?: string[];
  createdAt: string;
  recipientRole: Role;
  recipientIds?: string[];
  actionData?: any;
  actionPath?: string;
  actionLabel?: string;
}
