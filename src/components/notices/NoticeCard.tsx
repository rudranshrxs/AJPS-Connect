import React from 'react';
import { Calendar, Megaphone, AlertTriangle, IndianRupee, Palmtree, Bell, ChevronRight } from 'lucide-react';
import { Notice } from '../../types';
import { motion } from 'motion/react';

interface NoticeCardProps {
  key?: React.Key;
  notice: Notice;
  isRead: boolean;
  onClick: () => void;
}

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

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 350, damping: 25 } }
} as any;

export function NoticeCard({ notice, isRead, onClick }: NoticeCardProps) {
  const details = getCategoryDetails(notice.templateType);
  const Icon = details.icon;
  const date = new Date(notice.datePosted);

  return (
    <motion.div
      variants={itemVariants}
      onClick={onClick}
      className={`flex items-center p-5 border-b cursor-pointer transition-all duration-300 ease-in-out ${
        isRead
          ? 'bg-gray-50 border-l-4 border-l-transparent border-b-gray-50 hover:bg-gray-100'
          : 'bg-white border-l-4 border-l-[#C5873A] border-b-gray-50 shadow-sm hover:bg-[#FDF7EE]/30'
      }`}
    >
      {/* Icon */}
      <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 mr-4 ${details.bg} ${details.text} transition-transform duration-300`}>
        <Icon className="w-5 h-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-4">
        <h3 className={`text-sm mb-1 truncate ${isRead ? 'font-medium text-gray-600' : 'font-bold text-gray-900'}`}>
          {notice.title}
        </h3>
        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{notice.message}</p>
      </div>

      {/* Meta */}
      <div className="shrink-0 flex items-center gap-4 text-right">
        <span className={`hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-medium ${details.bg} ${details.text}`}>
          {details.category}
        </span>
        <div className="flex flex-col items-end">
          <span className="text-[11px] text-gray-500 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
          </span>
          <span className="text-[10px] text-gray-400 mt-0.5">by {notice.author}</span>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400 ml-2" />
      </div>
    </motion.div>
  );
}
