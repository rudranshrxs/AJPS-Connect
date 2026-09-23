import React, { useState, useEffect } from 'react';
import { Search, UserCircle, Shield, GraduationCap, Briefcase, X, RefreshCw, Truck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { User, Role } from '../../types';
import { getSystemDate } from '../../utils/dateUtils';

export function RoleSwitcher() {
  const { currentUser, loginAsUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    if (isOpen) {
      const storedUsers = localStorage.getItem('ajps_users');
      if (storedUsers) {
        setUsers(JSON.parse(storedUsers));
      }
    }
  }, [isOpen]);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.className && u.className.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.section && u.section.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.rollNumber && u.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  ).slice(0, 50); // limit to 50 for performance

  const getRoleIcon = (role: Role) => {
    switch (role) {
      case 'Admin': return <Shield className="w-4 h-4" />;
      case 'Teacher': return <Briefcase className="w-4 h-4" />;
      case 'Student': return <GraduationCap className="w-4 h-4" />;
      case 'Driver': return <Truck className="w-4 h-4" />;
      default: return <UserCircle className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: Role) => {
    switch (role) {
      case 'Admin': return 'text-purple-600 bg-purple-100 border-purple-200';
      case 'Teacher': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'Student': return 'text-green-600 bg-green-100 border-green-200';
      case 'Driver': return 'text-amber-700 bg-amber-100 border-amber-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const handleUserClick = (id: string) => {
    loginAsUser(id);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleResetToAdmin = () => {
    const admin = users.find(u => u.role === 'Admin');
    if (admin) {
      handleUserClick(admin.id);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-white/80 backdrop-blur-md border border-white shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] text-[#1F2937] px-4 py-3 rounded-2xl hover:scale-105 active:scale-95 transition-all"
      >
        <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-[#A05C2B]/30">
          <img src={currentUser?.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
        </div>
        <div className="text-left hidden md:block">
          <p className="text-xs font-black leading-none">{currentUser?.name}</p>
          <p className="text-[10px] font-bold text-[#A05C2B] uppercase tracking-wider">{currentUser?.role}</p>
        </div>
        <RefreshCw className="w-4 h-4 text-gray-400 ml-2" />
      </button>

      {/* Glassmorphism Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F2937]/40 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white overflow-hidden flex flex-col max-h-[85vh]">
            
            {/* Header */}
            <div className="p-6 border-b border-white/50 flex justify-between items-center bg-white/40">
              <div>
                <h2 className="text-xl font-black text-[#1F2937] tracking-tight">God-Mode Switcher</h2>
                <p className="text-xs font-bold text-[#A05C2B] uppercase tracking-wider">Explore as any user</p>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 bg-white/50 hover:bg-white text-gray-500 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Actions & Search */}
            <div className="p-6 bg-white/30 space-y-4">
              <button
                onClick={handleResetToAdmin}
                className="w-full flex items-center justify-center gap-2 bg-[#1F2937] hover:bg-gray-800 text-white py-2.5 rounded-xl text-sm font-bold shadow-md transition-colors"
              >
                <Shield className="w-4 h-4" /> Reset to Admin
              </button>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search 240+ students and 30+ teachers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/80 border border-white rounded-2xl pl-12 pr-4 py-3 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#A05C2B]/30 shadow-sm"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative">
                    <input
                      type="date"
                      title="Simulate System Date"
                      defaultValue={getSystemDate().toISOString().split('T')[0]}
                      onChange={(e) => {
                        localStorage.setItem('simulatedDate', e.target.value);
                        window.location.reload();
                      }}
                      className="w-full sm:w-auto bg-white/80 border border-white rounded-2xl px-4 py-3 text-sm font-bold text-[#A05C2B] focus:outline-none focus:ring-2 focus:ring-[#A05C2B]/30 shadow-sm cursor-pointer"
                    />
                  </div>
                  <div className="relative">
                    <input
                      type="time"
                      title="Simulate System Time"
                      defaultValue={localStorage.getItem('simulatedTime') || getSystemDate().toTimeString().substring(0, 5)}
                      onChange={(e) => {
                        localStorage.setItem('simulatedTime', e.target.value);
                        window.location.reload();
                      }}
                      className="w-full sm:w-auto bg-white/80 border border-white rounded-2xl px-4 py-3 text-sm font-bold text-[#A05C2B] focus:outline-none focus:ring-2 focus:ring-[#A05C2B]/30 shadow-sm cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* User List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredUsers.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-500 font-bold text-sm">No users found.</p>
                </div>
              ) : (
                filteredUsers.map(user => (
                  <button
                    key={user.id}
                    onClick={() => handleUserClick(user.id)}
                    className={`w-full flex items-center gap-4 p-3 rounded-2xl border transition-all ${
                      currentUser?.id === user.id 
                        ? 'bg-white border-[#A05C2B]/40 shadow-sm ring-1 ring-[#A05C2B]' 
                        : 'bg-white/40 border-white hover:bg-white/80 hover:shadow-sm'
                    }`}
                  >
                    <img src={user.avatarUrl} alt={user.name} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" />
                    
                    <div className="flex-1 text-left">
                      <h4 className="font-bold text-[#1F2937]">{user.name}{user.role === 'Student' ? ` - ${user.className} ${user.sectionName || user.section}` : ''}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${getRoleColor(user.role)}`}>
                          {getRoleIcon(user.role)} {user.role}
                        </span>
                        {user.role === 'Student' && (
                          <span className="text-xs font-semibold text-gray-500">
                            {user.className} {user.section} • Roll: {user.rollNumber}
                          </span>
                        )}
                        {user.role === 'Teacher' && (
                          <span className="text-xs font-semibold text-gray-500 truncate max-w-[200px]">
                            {(user.assignedClasses || []).join(', ')}
                          </span>
                        )}
                        {user.role === 'Driver' && (
                          <span className="text-xs font-semibold text-amber-700 truncate max-w-[200px]">
                            Fleet Driver
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
}
