const fs = require('fs');
let file = fs.readFileSync('src/components/layout/MainLayout.tsx', 'utf8');
file = file.replace(/const \[forceRender, setForceRender\] = useState\(0\);[\s\S]*?const unreadCount = getUnreadCount\(\);/, 'const { unreadCount } = useLiveNotifications();');
file = file.replace(/import \{ NotificationDrawer \}/, "import { useLiveNotifications } from '../../hooks/useLiveNotifications';\nimport { NotificationDrawer }");
fs.writeFileSync('src/components/layout/MainLayout.tsx', file);
