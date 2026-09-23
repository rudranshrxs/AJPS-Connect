import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';
import { 
  LayoutDashboard, 
  CalendarDays, 
  GraduationCap, 
  Clock, 
  CreditCard, 
  Users,
  Bus,
  Megaphone,
  MessageSquare,
  LayoutGrid,
  Settings,
  Gamepad2,
  BotMessageSquare,
  Briefcase,
  UserCircle
} from 'lucide-react';

export interface NavItem {
  name: string;
  icon: React.ElementType;
  path: string;
  allowedRoles: Role[];
}

export const NAV_ITEMS: NavItem[] = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/', allowedRoles: ['Admin', 'Teacher', 'Student', 'Driver'] },
  { name: 'My Profile', icon: UserCircle, path: '/profile', allowedRoles: ['Admin', 'Teacher', 'Student', 'Driver'] },
  { name: 'Attendance', icon: CalendarDays, path: '/attendance', allowedRoles: ['Admin', 'Teacher', 'Student'] },
  { name: 'Exams', icon: GraduationCap, path: '/exams', allowedRoles: ['Admin', 'Teacher', 'Student'] },
  { name: 'Games', icon: Gamepad2, path: '/games', allowedRoles: ['Student'] },
  { name: 'Time Table', icon: Clock, path: '/timetable', allowedRoles: ['Admin', 'Teacher', 'Student'] },
  { name: 'Classes', icon: LayoutGrid, path: '/classes', allowedRoles: ['Admin'] },
  { name: 'Transport', icon: Bus, path: '/transport', allowedRoles: ['Admin', 'Teacher', 'Student', 'Driver'] },
  { name: 'Notices', icon: Megaphone, path: '/notices', allowedRoles: ['Admin', 'Teacher', 'Student', 'Driver'] },
  { name: 'Fee & Payments', icon: CreditCard, path: '/fees', allowedRoles: ['Admin', 'Teacher', 'Student'] },
  { name: 'Directory', icon: Users, path: '/students', allowedRoles: ['Admin', 'Teacher'] },
  { name: 'Teachers', icon: Briefcase, path: '/teachers', allowedRoles: ['Admin'] },
  { name: 'Settings', icon: Settings, path: '/settings', allowedRoles: ['Admin', 'Teacher', 'Student', 'Driver'] },
];

export function Sidebar({ onOpenSahayak, isMobileOpen, onClose }: { onOpenSahayak?: () => void; isMobileOpen?: boolean; onClose?: () => void }) {
  const { currentUser } = useAuth();

  if (!currentUser) return null;

  const filteredNav = NAV_ITEMS.filter(item => item.allowedRoles.includes(currentUser.role));

  return (
    <aside className={`sidebar-responsive h-full overflow-y-auto bg-[#FAF7F2] border-r border-[#EDE8DF] flex flex-col shrink-0 transition-all duration-300 lg:flex ${isMobileOpen ? '!flex fixed inset-y-0 left-0 z-[100] w-[260px] shadow-2xl' : 'hidden'}`}>
      <div className="pb-6 pt-[2px] flex flex-col items-center relative">
        {isMobileOpen && (
          <button onClick={onClose} className="lg:hidden absolute top-4 right-4 text-gray-500 hover:text-gray-900">
            <UserCircle size={0} className="hidden" /> {/* just to avoid unused import if any */}
            <span className="text-2xl">&times;</span>
          </button>
        )}
        <div className="flex items-center justify-center mb-3">
          <img src="/Logo.png" alt="Amar Jyoti Public School" className="sidebar-logo object-contain" />
        </div>
        <div className="text-center flex flex-col items-center">
          <div className="font-serif font-[700] tracking-[0.5px] text-[#202020] text-xl">Amar Jyoti</div>
          <div className="font-serif font-[400] tracking-[0.3px] text-[#303030] text-sm mt-0.5">Public School</div>
        </div>
      </div>


      <nav className="flex-1 flex flex-col justify-between space-y-1 overflow-y-auto scrollbar-hide pb-6">
        {filteredNav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => 
                `sidebar-nav-item flex items-center transition-all duration-300 ${
                  isActive 
                    ? 'bg-[#FDF3E7] border-l-[3px] border-[#C5873A] text-[#8B5E2E] font-[700] shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)]' 
                    : 'bg-transparent border-l-[3px] border-transparent text-[#6B5E4E] font-[500] hover:bg-[#FDF3E7]/50'
                }`
              }
            >
              <Icon size={15} />
              <span className="text-[14px]">{item.name}</span>
            </NavLink>
          );
        })}

        {/* Sahayak AI Button */}
        {onOpenSahayak && (
          <button
            onClick={onOpenSahayak}
            className="sidebar-nav-item flex items-center transition-all duration-300 bg-transparent border-l-[3px] border-transparent text-[#6B5E4E] font-[400] hover:bg-black/5 w-full"
          >
            <BotMessageSquare size={15} />
            <span className="text-[14px]">Ask Sahayak</span>
          </button>
        )}
      </nav>
    </aside>
  );
}
