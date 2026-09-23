import React, { useState } from 'react';
import { GlassModal } from '../ui/GlassModal';
import { NotificationService } from '../../services/NotificationService';
import { Award, Star, ShieldAlert, Send } from 'lucide-react';

interface AwardBadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
}

type BadgeType = 'Star' | 'Trophy' | 'Disciplined';

export function AwardBadgeModal({ isOpen, onClose, studentId, studentName }: AwardBadgeModalProps) {
  const [selectedBadge, setSelectedBadge] = useState<BadgeType>('Star');
  const [remark, setRemark] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAward = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // B.17 Trigger Notification
    NotificationService.sendNotification({
      recipientIds: [studentId],
      title: `You earned a ${selectedBadge} Badge! 🏅`,
      message: remark || `Congratulations! You have been awarded the ${selectedBadge} badge by your teacher.`,
      type: 'badge',
      metadata: { badgeType: selectedBadge }
    });

    setTimeout(() => {
      setIsSubmitting(false);
      onClose();
      setRemark('');
      setSelectedBadge('Star');
    }, 600);
  };

  const getBadgeIcon = (type: BadgeType) => {
    switch (type) {
      case 'Star': return <Star className="w-6 h-6 text-yellow-500" />;
      case 'Trophy': return <Award className="w-6 h-6 text-[#A05C2B]" />;
      case 'Disciplined': return <ShieldAlert className="w-6 h-6 text-blue-500" />;
    }
  };

  return (
    <GlassModal isOpen={isOpen} onClose={onClose} title="Award Badge">
      <form onSubmit={handleAward} className="space-y-6 pt-4">
        <div className="text-center">
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Awarding to</p>
          <h3 className="text-xl font-black text-gray-800">{studentName}</h3>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {(['Star', 'Trophy', 'Disciplined'] as BadgeType[]).map(badge => (
            <button
              key={badge}
              type="button"
              onClick={() => setSelectedBadge(badge)}
              className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
                selectedBadge === badge 
                  ? 'bg-white/80 border-[#A05C2B] shadow-md ring-1 ring-[#A05C2B]' 
                  : 'bg-white/30 border-white/50 hover:bg-white/60'
              }`}
            >
              <div className="mb-2">{getBadgeIcon(badge)}</div>
              <span className="text-xs font-bold text-gray-800">{badge}</span>
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Personal Remark (Optional)</label>
          <textarea
            rows={3}
            value={remark}
            onChange={e => setRemark(e.target.value)}
            placeholder="Add a congratulatory note..."
            className="w-full bg-white/50 backdrop-blur-md border border-white/60 text-gray-800 text-sm font-medium rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#A05C2B]/50 shadow-sm resize-none"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-[#A05C2B] text-white px-6 py-3.5 rounded-xl text-sm font-bold shadow-lg hover:bg-[#8e5226] transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isSubmitting ? (
              <span className="animate-pulse">Awarding...</span>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Award Badge
              </>
            )}
          </button>
        </div>
      </form>
    </GlassModal>
  );
}
