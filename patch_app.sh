sed -i "14i import { RoleSwitcher } from './components/layout/RoleSwitcher';" src/App.tsx
sed -i "s|<AppContent />|<AppContent />\n        <RoleSwitcher />|g" src/App.tsx
