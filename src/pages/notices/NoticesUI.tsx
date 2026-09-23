import React, { useState, useMemo } from 'react';
import { 
  Plus, Search, Filter, Megaphone, AlertTriangle, 
  IndianRupee, Calendar, Bell, Palmtree, ChevronRight 
} from 'lucide-react';
import { Notice } from '../../types';
import { NoticeCard } from '../../components/notices/NoticeCard';
import { motion } from 'motion/react';

interface NoticesUIProps {
  notices: Notice[];
  readNotices: string[];
  canCreate: boolean;
  onCreateClick?: () => void;
  onMarkRead: (id: string) => void;
  roleType: 'Admin' | 'Teacher' | 'Student';
}

const CATEGORIES = ["All Notices", "General", "Important", "Exams", "Fee Related", "Holidays", "Events", "Others"];

const getCategoryDetails = (templateType: string) => {
  switch (templateType) {
    case 'fee_defaulter':
      return { category: 'Fee Related', icon: IndianRupee, bg: 'bg-green-50', text: 'text-green-600' };
    case 'exam_debarment':
      return { category: 'Exams', icon: AlertTriangle, bg: 'bg-orange-50', text: 'text-orange-500' };
    case 'holiday':
      return { category: 'Holidays', icon: Palmtree, bg: 'bg-cyan-50', text: 'text-cyan-500' };
    case 'new_event':
      return { category: 'Events', icon: Calendar, bg: 'bg-purple-50', text: 'text-purple-600' };
    case 'urgent_alert':
    case 'disciplinary_action':
    case 'deadline_alert':
    case 'missing_document':
      return { category: 'Important', icon: Bell, bg: 'bg-red-50', text: 'text-red-500' };
    case 'custom':
    case 'change_timings':
    case 'staff_meeting':
    case 'substitution':
      return { category: 'General', icon: Megaphone, bg: 'bg-blue-50', text: 'text-blue-600' };
    default:
      return { category: 'Others', icon: Megaphone, bg: 'bg-gray-50', text: 'text-gray-600' };
  }
};

export function NoticesUI({ notices, readNotices, canCreate, onCreateClick, onMarkRead, roleType }: NoticesUIProps) {
  const [activeTab, setActiveTab] = useState("All Notices");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  // Single chronological feed sorted by datePosted descending
  const sortedNotices = useMemo(() => {
    return [...notices].sort((a, b) => new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime());
  }, [notices]);

  const filteredNotices = useMemo(() => {
    return sortedNotices.filter(n => {
      const { category } = getCategoryDetails(n.templateType);
      const matchesCategory = activeTab === "All Notices" || category === activeTab;
      const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            n.message.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [sortedNotices, activeTab, searchQuery]);

  const unreadCount = filteredNotices.filter(n => !readNotices.includes(n.id)).length;

  const handleSelectNotice = (notice: Notice) => {
    setSelectedNotice(notice);
    onMarkRead(notice.id);
  };

  return (
    <div className="bg-[#F8F9FA] min-h-screen pb-24 animate-in fade-in slide-in-from-bottom duration-300">
      <div className="max-w-5xl mx-auto p-4 md:p-6 lg:p-8">
        
        {/* Header */}
        <div className="flex flex-row justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notices</h1>
            <p className="text-sm text-gray-500 mt-1">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'} · {filteredNotices.length} total
            </p>
          </div>
          {canCreate && (
            <>
              <button 
                onClick={onCreateClick}
                className="hidden md:flex bg-[#0B1E40] text-white px-5 py-2.5 rounded-lg font-medium items-center gap-2 hover:bg-blue-900 transition-colors"
              >
                <Plus className="w-5 h-5" /> Create Notice
              </button>
              <button 
                onClick={onCreateClick}
                className="md:hidden fixed bottom-6 right-6 z-50 bg-[#0B1E40] text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-900 transition-colors"
              >
                <Plus className="w-6 h-6" />
              </button>
            </>
          )}
        </div>

        {/* Category Filter Tabs */}
        <div className="overflow-x-auto no-scrollbar flex gap-3 py-2 mb-4">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                activeTab === cat
                  ? 'bg-orange-50 border border-orange-100 text-orange-800 font-semibold'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Single Feed (No "Important Notices" sidebar) */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col relative h-[calc(100vh-200px)] min-h-[500px]">
          {selectedNotice ? (
            <div className="flex-1 overflow-y-auto animate-in slide-in-from-right fade-in duration-300 flex flex-col">
              <div className="p-5 border-b border-gray-100 flex items-center gap-4 shrink-0 bg-white sticky top-0 z-10">
                <button 
                  onClick={() => setSelectedNotice(null)}
                  className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-all duration-300 ease-in-out font-medium text-sm p-2 -ml-2 rounded-lg hover:bg-gray-50 active:scale-95"
                >
                  <ChevronRight className="w-5 h-5 rotate-180" /> Back to Notices
                </button>
              </div>
              <div className="p-6 md:p-8">
                {(() => {
                  const details = getCategoryDetails(selectedNotice.templateType);
                  const Icon = details.icon;
                  const date = new Date(selectedNotice.datePosted);
                  return (
                    <>
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-6">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${details.bg} ${details.text}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <h2 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight mb-3">{selectedNotice.title}</h2>
                          <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm text-gray-500">
                            <span className={`px-2.5 py-1 rounded-md font-medium ${details.bg} ${details.text}`}>
                              {details.category}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" /> {date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                            <span>by {selectedNotice.author}</span>
                          </div>
                        </div>
                      </div>
                      <div className="prose max-w-none text-gray-700 leading-relaxed text-sm md:text-base whitespace-pre-wrap">
                        {selectedNotice.message}
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-left duration-300 h-full">
              {/* List Header */}
              <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 shrink-0">
                <h2 className="font-semibold text-gray-800">All Notices</h2>
                <div className="flex items-center gap-3">
                  <div className="relative w-full sm:w-auto">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      placeholder="Search notices..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-3 py-1.5 text-sm w-full sm:w-48 focus:outline-none focus:ring-1 focus:ring-[#0B1E40] transition-all duration-300"
                    />
                  </div>
                </div>
              </div>

              {/* Notice List */}
              <div className="flex-1 overflow-y-auto">
                {filteredNotices.length === 0 ? (
                  <div className="p-10 text-center text-gray-500 text-sm">
                    {searchQuery ? `No results for "${searchQuery}". Try a different keyword.` : 'No notices found.'}
                  </div>
                ) : (
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{
                      hidden: { opacity: 0 },
                      visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
                    }}
                  >
                    {filteredNotices.map((notice) => (
                      <NoticeCard
                        key={notice.id}
                        notice={notice}
                        isRead={readNotices.includes(notice.id)}
                        onClick={() => handleSelectNotice(notice)}
                      />
                    ))}
                  </motion.div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
