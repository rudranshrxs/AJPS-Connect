const fs = require('fs');
let file = fs.readFileSync('src/components/notifications/NotificationDrawer.tsx', 'utf8');
file = file.replace(/const \{ notifications, markAsRead, markAllAsRead, getUnreadCount \} = useNotification\(\);/, 'const { notifications, unreadCount, markAsRead, markAllAsRead } = useLiveNotifications();');
file = file.replace(/import \{ useNotification \} from '\.\.\/\.\.\/context\/NotificationContext';/, "import { useLiveNotifications } from '../../hooks/useLiveNotifications';");
file = file.replace(/const unreadCount = getUnreadCount\(\);/, ''); // if there was any other usage
fs.writeFileSync('src/components/notifications/NotificationDrawer.tsx', file);
