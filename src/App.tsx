/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { MainLayout } from './components/layout/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { Attendance } from './pages/Attendance';
import { Exams } from './pages/exams';
import { RoleSwitcher } from './components/layout/RoleSwitcher';
import { Students } from './pages/students';
import { Teachers } from './pages/teachers';
import { Fees } from './pages/fees';
import { Transport } from './pages/transport';
import { Messages } from './pages/communication';
import { Notices } from './pages/Notices';
import { Timetable } from './pages/timetable';
import { Classes } from './pages/classes';
import Settings from './pages/settings/Settings';
import Profile from './pages/profile/Profile';

import { useNotificationCron } from './hooks/useNotificationCron';
import { LoaderProvider } from './context/LoaderContext';
import { SuccessProvider } from './context/SuccessContext';
import { TransportProvider } from './context/TransportContext';
import { AcademicProvider } from './context/academicContext';

import { GamesProvider } from './context/GamesContext';
import { Games } from './pages/games';
import { TicTacToe } from './pages/games/TicTacToe';
import { SlidingPuzzle } from './pages/games/SlidingPuzzle';

function AppContent() {
  // Activate Automated Cron Notifications
  useNotificationCron();

  // Enforce PWA rules globally
  useEffect(() => {
    // Prevent pinch-to-zoom
    const preventZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };
    document.addEventListener('touchstart', preventZoom, { passive: false });
    
    // Disable text selection and swipe-to-refresh
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
    document.body.style.overscrollBehavior = 'none';

    return () => {
      document.removeEventListener('touchstart', preventZoom);
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
      document.body.style.overscrollBehavior = '';
    };
  }, []);

  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="exams" element={<Exams />} />
        <Route path="students" element={<Students />} />
        <Route path="teachers" element={<Teachers />} />
        <Route path="fees" element={<Fees />} />
        <Route path="transport" element={<Transport />} />
        <Route path="classes" element={<Classes />} />
        <Route path="timetable" element={<Timetable />} />
        <Route path="notices" element={<Notices />} />
        <Route path="messages" element={<Messages />} />
        <Route path="settings" element={<Settings />} />
        <Route path="profile" element={<Profile />} />
        <Route path="games" element={<Games />} />
        <Route path="games/tictactoe" element={<TicTacToe />} />
        <Route path="games/slidingpuzzle" element={<SlidingPuzzle />} />
      </Route>
    </Routes>
  );
}

function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-[#FAF7F2] flex flex-col items-center justify-center gap-6 z-[9999]">
      <img src="/Logo.png" alt="AJPS Logo" className="w-20 h-20 object-contain animate-pulse" />
      <div className="text-center">
        <h2 className="text-xl font-black text-[#8B5E2E] tracking-tight">Amar Jyoti Public School</h2>
        <p className="text-sm text-gray-500 mt-1">Loading student database...</p>
      </div>
      <div className="flex gap-1.5">
        {[0,1,2].map(i => (
          <div key={i} className="w-2 h-2 rounded-full bg-[#A05C2B]" style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
        ))}
      </div>
      <style>{`@keyframes bounce { 0%,80%,100% { transform: scale(0); } 40% { transform: scale(1); } }`}</style>
    </div>
  );
}

function AppWithLoading() {
  const { isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  return (
    <>
      <AppContent />
      <RoleSwitcher />
    </>
  );
}

import { SchoolProvider } from './context/SchoolContext';

export default function App() {
  return (
    <BrowserRouter>
      <LoaderProvider>
        <SuccessProvider>
          <AuthProvider>
            <SchoolProvider>
              <AcademicProvider>
                <TransportProvider>
                  <NotificationProvider>
                    <GamesProvider>
                      <AppWithLoading />
                    </GamesProvider>
                  </NotificationProvider>
                </TransportProvider>
              </AcademicProvider>
            </SchoolProvider>
          </AuthProvider>
        </SuccessProvider>
      </LoaderProvider>
    </BrowserRouter>
  );
}

