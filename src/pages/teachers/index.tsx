import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Search, UserCheck, Star, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { User } from '../../types';
import { TeacherProfileDrawer } from '../../components/directory/TeacherProfileDrawer';

export function Teachers() {
  const { currentUser } = useAuth();
  const [teachers, setTeachers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<User | null>(null);

  // Re-fetch when local storage changes
  const loadTeachers = () => {
    const users = JSON.parse(localStorage.getItem('ajps_users') || '[]');
    setTeachers(users.filter((u: User) => u.role === 'Teacher'));
  };

  useEffect(() => {
    loadTeachers();
    window.addEventListener('ajps_users_updated', loadTeachers);
    return () => window.removeEventListener('ajps_users_updated', loadTeachers);
  }, []);

  const calculateRating = (teacher: User) => {
    let score = 3.0; // Base score

    // Experience
    if (teacher.experienceYears && teacher.experienceYears > 5) {
      score += 0.5;
    }

    // Extra responsibilities
    if (teacher.extraResponsibilities && teacher.extraResponsibilities.length > 0) {
      score += Math.min(teacher.extraResponsibilities.length * 0.2, 0.5);
    }

    // Attendance
    if (teacher.attendanceHistory && teacher.attendanceHistory.length > 0) {
      const totalDays = teacher.attendanceHistory.length;
      const presentDays = teacher.attendanceHistory.filter(r => r.status === 'Present').length;
      const attendancePercentage = (presentDays / totalDays) * 100;

      if (attendancePercentage > 95) score += 1.0;
      else if (attendancePercentage > 85) score += 0.5;
    }

    return Math.min(score, 5.0).toFixed(1);
  };

  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (t.subjects && t.subjects.join(',').toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (currentUser?.role !== 'Admin') {
    return (
      <div className="p-4 sm:p-8 space-y-6">
        <GlassCard className="p-8 text-center bg-white/60">
          <h2 className="text-xl font-bold text-gray-800">Access Restricted</h2>
          <p className="text-gray-600 mt-2">Only administrators can view the Teacher Directory.</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 animate-in fade-in duration-300 pb-24 lg:pb-8">
      {/* Header */}
      <GlassCard className="p-6 bg-white/30 border-white/40 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-[#8B5E2E]" />
            Teacher Directory
          </h1>
          <p className="text-sm text-gray-600 mt-1">Manage teaching staff and profiles.</p>
        </div>
        
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search by name or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#8B5E2E]/30 outline-none transition-all shadow-sm"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
        </div>
      </GlassCard>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {filteredTeachers.map(teacher => {
          const rating = calculateRating(teacher);
          const isProxy = !!teacher.proxyClassId;
          
          return (
            <GlassCard 
              key={teacher.id} 
              className="p-5 bg-white hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-100 flex flex-col justify-between"
              onClick={() => setSelectedTeacher(teacher)}
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 shrink-0 border-2 border-white shadow-sm">
                  {teacher.profilePhotoUrl || teacher.avatarUrl ? (
                    <img src={teacher.profilePhotoUrl || teacher.avatarUrl} alt={teacher.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#8B5E2E] font-bold text-xl bg-[#FDF3E7]">
                      {teacher.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 truncate">{teacher.name}</h3>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{teacher.subjects?.join(', ') || 'General'}</p>
                  
                  <div className="flex items-center gap-1 mt-2">
                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs font-bold text-gray-700">{rating}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-gray-600">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Face ID: <strong className={teacher.faceIdStatus === 'Completed' ? 'text-emerald-600' : 'text-amber-600'}>{teacher.faceIdStatus || 'Pending'}</strong></span>
                </div>
                {isProxy && (
                  <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium text-[10px] border border-blue-100">
                    Proxy: {teacher.proxyClassId}
                  </span>
                )}
              </div>
            </GlassCard>
          );
        })}
      </div>

      {filteredTeachers.length === 0 && (
        <div className="py-12 text-center text-gray-500 bg-white/40 rounded-2xl border border-white">
          No teachers found matching your search.
        </div>
      )}

      {/* Profile Drawer */}
      {selectedTeacher && (
        <TeacherProfileDrawer 
          teacher={selectedTeacher} 
          isOpen={true} 
          onClose={() => setSelectedTeacher(null)} 
          onUpdate={(updatedTeacher) => {
            const users = JSON.parse(localStorage.getItem('ajps_users') || '[]');
            const newUsers = users.map((u: User) => u.id === updatedTeacher.id ? updatedTeacher : u);
            localStorage.setItem('ajps_users', JSON.stringify(newUsers));
            window.dispatchEvent(new Event('ajps_users_updated'));
            setSelectedTeacher(updatedTeacher);
          }}
          allTeachers={teachers}
        />
      )}
    </div>
  );
}
