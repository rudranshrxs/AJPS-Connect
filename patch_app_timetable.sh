sed -i "s|import { NoticeBoard, Messages } from './pages/communication';|import { NoticeBoard, Messages } from './pages/communication';\nimport { Timetable } from './pages/timetable';|g" src/App.tsx
sed -i "s|<Route path=\"classes\" element={<Classes />} />|<Route path=\"classes\" element={<Classes />} />\n          <Route path=\"timetable\" element={<Timetable />} />|g" src/App.tsx
