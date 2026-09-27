import React, { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Sidebar, NAV_ITEMS } from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useLiveNotifications } from '../../hooks/useLiveNotifications';
import { NotificationDrawer } from '../notifications/NotificationDrawer';
import { Bell, Menu } from 'lucide-react';
import { SahayakChat, SahayakFAB } from '../chat/SahayakChat';

export function MainLayout() {
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSahayakOpen, setIsSahayakOpen] = useState(false);
  const { currentUser } = useAuth();
  const { unreadCount } = useLiveNotifications();

  useEffect(() => {
    const handleOpenNotifications = () => setNotificationOpen(true);
    window.addEventListener('open-notifications', handleOpenNotifications);
    return () => window.removeEventListener('open-notifications', handleOpenNotifications);
  }, []);

  if (!currentUser) return null;

  const filteredNav = NAV_ITEMS.filter(item => item.allowedRoles.includes(currentUser.role));

  return (
    <div className="w-screen h-screen flex overflow-hidden bg-[#FAF7F2] text-[#111827] font-sans relative">
        <Sidebar isMobileOpen={isMobileSidebarOpen} onClose={() => setIsMobileSidebarOpen(false)} onOpenSahayak={() => setIsSahayakOpen(true)} />
        {isMobileSidebarOpen && (
          <div 
            className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] print:hidden" 
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}
        <div className="flex-1 flex flex-col relative z-10 main-content-responsive">
          <header className="lg:hidden sticky top-0 z-50 mobile-header p-3 bg-[#FAF7F2] w-full border-b border-[#EDE8DF] shrink-0 flex items-center justify-between print:hidden">
            <div className="flex items-center gap-2">
              <img src="/Logo.png" alt="Logo" className="mobile-header-logo object-contain shrink-0" />
              <div className="flex flex-col">
                <span className="mobile-header-title font-[700] text-[#8B5E2E] leading-tight tracking-[0.03em] truncate">Amar Jyoti</span>
                <span className="mobile-header-subtitle font-[700] text-[#8B5E2E] leading-tight tracking-[0.03em] truncate">Public School</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setNotificationOpen(true)}
                className="relative top-btn-responsive bg-[#FFFFFF] flex items-center justify-center text-[#8B5E2E] shadow-sm border border-[#EDE8DF]"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-[#FF8C00] rounded-full animate-pulse" />
                )}
              </button>
              <div className="top-btn-responsive bg-[#FFFFFF] flex items-center justify-center shadow-sm overflow-hidden border border-[#EDE8DF]">
                <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto overflow-x-hidden w-full relative min-h-0 pb-24 lg:pb-0 flex flex-col">
            <div className="flex-1">
              <Outlet />
            </div>
            <footer className="text-xs text-gray-400 py-4 text-center mt-auto shrink-0 border-t border-gray-100 print:hidden">
              © Rudransh Codes | App related Query - rudranshcodes@gmail.com
            </footer>
          </main>
        </div>

      <div className="lg:hidden fixed bottom-4 left-4 right-4 z-50 flex justify-center pointer-events-none print:hidden">
        <div className="bg-white/90 backdrop-blur-lg border border-white/40 shadow-lg flex flex-nowrap justify-around items-center p-2 w-full max-w-md rounded-2xl pointer-events-auto">
          {filteredNav.slice(0, 4).map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl transition-all duration-300 ${
                    isActive ? 'bg-[#FDF3E7] text-[#8B5E2E] flex-grow' : 'text-gray-500'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={20} className="shrink-0" />
                    {isActive && <span className="text-xs font-bold whitespace-nowrap overflow-hidden animate-in slide-in-from-right-2 fade-in duration-300">{item.name}</span>}
                  </>
                )}
              </NavLink>
            );
          })}
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl transition-all duration-300 text-gray-500 hover:bg-[#FDF3E7] hover:text-[#8B5E2E]"
          >
            <Menu size={20} className="shrink-0" />
          </button>
        </div>
      </div>

      <NotificationDrawer 
        isOpen={notificationOpen} 
        onClose={() => setNotificationOpen(false)} 
      />
      <SahayakChat isOpen={isSahayakOpen} onClose={() => setIsSahayakOpen(false)} />
      <SahayakFAB onClick={() => setIsSahayakOpen(!isSahayakOpen)} isOpen={isSahayakOpen} botName={currentUser?.personalDetails?.gender?.toLowerCase() === 'male' ? 'Shahayika' : 'Sahayak'} />
    </div>
  );
}