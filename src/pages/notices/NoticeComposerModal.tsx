import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Users, User as UserIcon, Eye, Check, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useSuccess } from '../../context/SuccessContext';
import { useLoader } from '../../context/LoaderContext';
import { NotificationService } from '../../services/NotificationService';
import { useNoticeAccess } from '../../hooks/useNoticeAccess';
import { Role, User, Notice, AudienceRole, TemplateType } from '../../types';

interface TemplateField {
  key: string;
  label: string;
  type: 'text' | 'date' | 'time' | 'textarea' | 'number' | 'checkbox';
  placeholder: string;
  prefix?: string;
}

interface TemplateDef {
  type: TemplateType | 'fee_alert_automated' | 'attendance_alert_automated';
  emoji: string;
  label: string;
  roles: AudienceRole[];
  fields: TemplateField[];
  generator: (fields: Record<string, any>) => { title: string; message: string };
}

const TEMPLATES: TemplateDef[] = [
  {
    type: 'custom',
    emoji: '✍️',
    label: 'Write Custom Notice',
    roles: ['Student', 'Teacher', 'Both'],
    fields: [
      { key: 'title', label: 'Title', type: 'text', placeholder: 'Enter notice title...' },
      { key: 'message', label: 'Message', type: 'textarea', placeholder: 'Type your official announcement here...' },
    ],
    generator: (f) => ({ title: f.title || '', message: f.message || '' }),
  },
  {
    type: 'change_timings',
    emoji: '⏰',
    label: 'Change in Timings',
    roles: ['Both'],
    fields: [
      { key: 'newTime', label: 'New Time', type: 'time', placeholder: '' },
      { key: 'effectiveDate', label: 'Effective Date', type: 'date', placeholder: '' },
      { key: 'reason', label: 'Reason', type: 'text', placeholder: 'e.g., Summer schedule' },
    ],
    generator: (f) => ({
      title: '⏰ Change in School Timings',
      message: `Dear Members,\n\nThis is to inform you that the school timings have been revised to ${f.newTime || '___'}, effective from ${f.effectiveDate || '___'}.\n\nReason: ${f.reason || 'N/A'}\n\nKindly adjust your schedules accordingly.\n\nRegards,\nAmar Jyoti Public School`,
    }),
  },
  {
    type: 'holiday',
    emoji: '🌴',
    label: 'Holiday',
    roles: ['Both'],
    fields: [
      { key: 'date', label: 'Date', type: 'date', placeholder: '' },
      { key: 'occasion', label: 'Occasion', type: 'text', placeholder: 'e.g., Republic Day' },
    ],
    generator: (f) => ({
      title: `🌴 Holiday — ${f.occasion || 'Upcoming'}`,
      message: `Dear All,\n\nThe school will remain closed on ${f.date || '___'} on account of ${f.occasion || '___'}.\n\nEnjoy the holiday!\n\nRegards,\nAmar Jyoti Public School`,
    }),
  },
  {
    type: 'new_event',
    emoji: '🎉',
    label: 'New Event',
    roles: ['Both'],
    fields: [
      { key: 'eventName', label: 'Event Name', type: 'text', placeholder: 'e.g., Annual Sports Day' },
      { key: 'date', label: 'Date', type: 'date', placeholder: '' },
      { key: 'venue', label: 'Venue', type: 'text', placeholder: 'e.g., School Ground' },
      { key: 'isHoliday', label: 'Holiday that day?', type: 'checkbox', placeholder: '' }
    ],
    generator: (f) => ({
      title: `🎉 ${f.eventName || 'New Event'}`,
      message: `Dear Members,\n\nWe are excited to announce "${f.eventName || '___'}" scheduled on ${f.date || '___'} at ${f.venue || '___'}.\n\n${f.isHoliday ? 'Note: This day will be observed as a Holiday.\n\n' : ''}All are cordially invited to participate.\n\nRegards,\nAmar Jyoti Public School`,
    }),
  },
  {
    type: 'fee_alert_automated',
    emoji: '💸',
    label: 'Fee Alert (Automated)',
    roles: ['Student'],
    fields: [
      { key: 'minAmount', label: 'Minimum Expected Paid Amount', type: 'number', placeholder: 'e.g. 5000', prefix: '₹' },
    ],
    generator: (f) => ({
      title: '🛑 Fee Payment Reminder',
      message: `Dear Parent/Guardian,\n\nKindly submit minimum amount of ₹[Dynamic - Paid Amount].\n\nYour total outstanding due is high. Please clear it immediately.\n\nRegards,\nAmar Jyoti Public School`,
    }),
  },
  {
    type: 'attendance_alert_automated',
    emoji: '📅',
    label: 'Attendance Alert (Automated)',
    roles: ['Student'],
    fields: [
      { key: 'nDays', label: 'Days Absent', type: 'number', placeholder: 'e.g. 3' },
    ],
    generator: (f) => ({
      title: '⚠️ Attendance Warning',
      message: `Dear Parent/Guardian,\n\nYour ward has been absent for more than ${f.nDays || '___'} days. Regular attendance is mandatory.\n\nRegards,\nAmar Jyoti Public School`,
    }),
  },
  {
    type: 'urgent_alert',
    emoji: '🚨',
    label: 'Urgent Alert',
    roles: ['Both'],
    fields: [
      { key: 'title', label: 'Alert Title', type: 'text', placeholder: 'e.g., Water Supply Disruption' },
      { key: 'message', label: 'Details', type: 'textarea', placeholder: 'Describe the urgent alert...' },
    ],
    generator: (f) => ({
      title: `🚨 URGENT: ${f.title || 'Alert'}`,
      message: `⚠️ URGENT NOTICE\n\n${f.message || '___'}\n\nPlease take immediate note.\n\nRegards,\nAmar Jyoti Public School`,
    }),
  },
  {
    type: 'missing_document',
    emoji: '📑',
    label: 'Missing Document',
    roles: ['Student'],
    fields: [
      { key: 'docName', label: 'Document Name', type: 'text', placeholder: 'e.g., Transfer Certificate' },
      { key: 'deadline', label: 'Submission Deadline', type: 'date', placeholder: '' },
    ],
    generator: (f) => ({
      title: `📑 Missing Document: ${f.docName || 'Required'}`,
      message: `Dear Parent/Guardian,\n\nAs per our records, the following document is missing from the student's file:\n\n📄 ${f.docName || '___'}\n\nKindly submit it by ${f.deadline || '___'} to the school office.\n\nRegards,\nAmar Jyoti Public School`,
    }),
  },
  {
    type: 'disciplinary_action',
    emoji: '⚠️',
    label: 'Strict Disciplinary Action',
    roles: ['Student'],
    fields: [
      { key: 'offense', label: "Student's Offense", type: 'text', placeholder: 'e.g., Repeated misconduct' },
      { key: 'actionTaken', label: 'Action Taken', type: 'text', placeholder: 'e.g., 3-day suspension' },
    ],
    generator: (f) => ({
      title: '⚠️ Disciplinary Action Notice',
      message: `Dear Parent/Guardian,\n\nThis is to inform you that a disciplinary action has been taken against the student.\n\nOffense: ${f.offense || '___'}\nAction Taken: ${f.actionTaken || '___'}\n\nWe request your cooperation in ensuring better conduct.\n\nRegards,\nDisciplinary Committee\nAmar Jyoti Public School`,
    }),
  },
  {
    type: 'exam_debarment',
    emoji: '📉',
    label: 'Exam Debarment',
    roles: ['Student'],
    fields: [
      { key: 'examName', label: 'Exam Name', type: 'text', placeholder: 'e.g., Mid-Term Examination' },
      { key: 'reason', label: 'Reason', type: 'text', placeholder: 'e.g., Low attendance' },
    ],
    generator: (f) => ({
      title: `📉 Exam Debarment Notice`,
      message: `Dear Parent/Guardian,\n\nThis is to inform you that the student has been debarred from the ${f.examName || '___'} examination.\n\nReason: ${f.reason || '___'}\n\nPlease contact the school administration for further details.\n\nRegards,\nExamination Cell\nAmar Jyoti Public School`,
    }),
  },
  {
    type: 'staff_meeting',
    emoji: '🤝',
    label: 'Staff Meeting',
    roles: ['Teacher'],
    fields: [
      { key: 'date', label: 'Date', type: 'date', placeholder: '' },
      { key: 'time', label: 'Time', type: 'time', placeholder: '' },
      { key: 'agenda', label: 'Agenda', type: 'text', placeholder: 'e.g., Academic review for Q3' },
    ],
    generator: (f) => ({
      title: '🤝 Staff Meeting Notice',
      message: `Dear Faculty Members,\n\nA staff meeting has been scheduled as follows:\n\n📅 Date: ${f.date || '___'}\n🕐 Time: ${f.time || '___'}\n📋 Agenda: ${f.agenda || '___'}\n\nAttendance is mandatory. Kindly be punctual.\n\nRegards,\nAmar Jyoti Public School`,
    }),
  },
  {
    type: 'deadline_alert',
    emoji: '⏳',
    label: 'Deadline Alert',
    roles: ['Teacher'],
    fields: [
      { key: 'task', label: 'Task', type: 'text', placeholder: 'e.g., Submit marksheets' },
      { key: 'deadline', label: 'Deadline', type: 'date', placeholder: '' },
    ],
    generator: (f) => ({
      title: `⏳ Deadline: ${f.task || 'Pending Task'}`,
      message: `Dear Faculty,\n\nThis is a reminder that the following task is approaching its deadline:\n\n📌 Task: ${f.task || '___'}\n📅 Deadline: ${f.deadline || '___'}\n\nPlease ensure timely completion.\n\nRegards,\nAmar Jyoti Public School`,
    }),
  },
  {
    type: 'substitution',
    emoji: '🔄',
    label: 'Substitution',
    roles: ['Teacher'],
    fields: [
      { key: 'absentTeacher', label: 'Absent Teacher', type: 'text', placeholder: 'e.g., Mrs. Sharma' },
      { key: 'substituteTeacher', label: 'Substitute Teacher', type: 'text', placeholder: 'e.g., Mr. Verma' },
      { key: 'period', label: 'Period', type: 'text', placeholder: 'e.g., Period 3' },
      { key: 'date', label: 'Date', type: 'date', placeholder: '' },
    ],
    generator: (f) => ({
      title: '🔄 Substitution Arrangement',
      message: `Dear Faculty,\n\nKindly note the following substitution arrangement:\n\n❌ Absent: ${f.absentTeacher || '___'}\n✅ Substitute: ${f.substituteTeacher || '___'}\n🕐 Period: ${f.period || '___'}\n📅 Date: ${f.date || '___'}\n\nRegards,\nAmar Jyoti Public School`,
    }),
  },
];

export function NoticeComposerModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
  const { currentUser } = useAuth();
  const { addNotification } = useNotification();
  const { triggerSuccess } = useSuccess();
  const { runWithLoader } = useLoader();

  const { canCreate, audienceLocked, lockedAudienceClassId, lockedMessage } = useNoticeAccess();

  const [audienceRole, setAudienceRole] = useState<AudienceRole>('Both');
  const [targetMode, setTargetMode] = useState<'class' | 'student'>('class');
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType | 'fee_alert_automated' | 'attendance_alert_automated'>('custom');
  const [templateFields, setTemplateFields] = useState<Record<string, any>>({});
  
  const [studentSearch, setStudentSearch] = useState('');

  const [allClasses, setAllClasses] = useState<{ id: string; className: string }[]>([]);
  const [allStudents, setAllStudents] = useState<User[]>([]);
  
  const isTeacher = currentUser?.role === 'Teacher';

  // Apply constraints on mount
  useEffect(() => {
    if (isTeacher) {
      setAudienceRole('Student');
      setTargetMode('class');
      // If the teacher has assignedClasses, pre-select them
      if (currentUser?.assignedClasses?.length) {
        setSelectedClasses(currentUser.assignedClasses);
      }
    } else if (audienceLocked) {
      if (lockedAudienceClassId) {
        setAudienceRole('Student');
        setTargetMode('class');
        setSelectedClasses([lockedAudienceClassId]);
      } else {
        setAudienceRole('Both');
      }
    }
  }, [audienceLocked, lockedAudienceClassId, isTeacher, currentUser]);

  useEffect(() => {
    if (!isOpen) return;
    try {
      const cls = localStorage.getItem('ajps_classes');
      if (cls) setAllClasses(JSON.parse(cls));
    } catch (e) { /* */ }
    try {
      const usrs = localStorage.getItem('ajps_users');
      if (usrs) {
        const parsed: User[] = JSON.parse(usrs);
        setAllStudents(parsed.filter(u => u.role === 'Student'));
      }
    } catch (e) { /* */ }
  }, [isOpen]);

  const availableTemplates = useMemo(() => {
    return TEMPLATES.filter(t => t.type === 'custom' || t.roles.includes(audienceRole));
  }, [audienceRole]);

  useEffect(() => {
    const valid = availableTemplates.find(t => t.type === selectedTemplate);
    if (!valid) {
      setSelectedTemplate('custom');
      setTemplateFields({});
    }
  }, [audienceRole, availableTemplates, selectedTemplate]);

  const currentTemplate = TEMPLATES.find(t => t.type === selectedTemplate)!;

  const preview = useMemo(() => {
    if (!currentTemplate) return { title: '', message: '' };
    return currentTemplate.generator(templateFields);
  }, [currentTemplate, templateFields]);

  const updateField = (key: string, value: any) => {
    setTemplateFields(prev => ({ ...prev, [key]: value }));
  };

  const handlePublish = () => {
    if (!preview.title.trim() || !preview.message.trim()) return;

    runWithLoader(() => {
      let finalTargetStudents = selectedStudentIds;
      let finalTargetClasses = selectedClasses;
      let finalMessage = preview.message;
      let isPersonalized = false;
      let personalizedMessages: Record<string, string> = {};

      // Handle Automation
      if (selectedTemplate === 'fee_alert_automated') {
        const minAmount = parseFloat(templateFields.minAmount || '0');
        const feesStr = localStorage.getItem('ajps_student_fees') || '{}';
        const feesData = JSON.parse(feesStr);
        finalTargetStudents = allStudents.filter(s => {
          const paid = feesData[s.id]?.amountPaid || 0;
          return paid < minAmount;
        }).map(s => s.id);
        
        finalTargetClasses = [];
        
        // Personalize messages
        finalTargetStudents.forEach(sid => {
          const paid = feesData[sid]?.amountPaid || 0;
          const due = (feesData[sid]?.totalFees || 0) - paid;
          personalizedMessages[sid] = `Dear Parent/Guardian,\n\nKindly submit minimum amount of ₹${Math.max(0, minAmount - paid)}.\n\nYour total outstanding due is ₹${due}. Please clear it immediately.\n\nRegards,\nAmar Jyoti Public School`;
        });
        isPersonalized = true;
      }
      else if (selectedTemplate === 'attendance_alert_automated') {
        const nDays = parseInt(templateFields.nDays || '0', 10);
        const attStr = localStorage.getItem('ajps_attendance') || '{}';
        const attData = JSON.parse(attStr);
        
        finalTargetStudents = allStudents.filter(s => {
          if (!s.classId) return false;
          let absentCount = 0;
          const classAtt = attData[s.classId] || {};
          Object.values(classAtt).forEach((day: any) => {
             if (day.records && day.records[s.id] === 'Absent') absentCount++;
          });
          return absentCount > nDays;
        }).map(s => s.id);
        finalTargetClasses = [];
      }

      // Create base notice
      const newNotice: Notice = {
        id: `notice_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        audienceRole,
        targetClasses: audienceRole === 'Student' && targetMode === 'class' && finalTargetClasses.length > 0
          ? finalTargetClasses : undefined,
        targetStudentIds: audienceRole === 'Student' && finalTargetStudents.length > 0
          ? finalTargetStudents : undefined,
        title: preview.title,
        message: finalMessage,
        datePosted: new Date().toISOString(),
        author: currentUser?.name || 'Unknown',
        authorRole: currentUser?.role || 'Admin',
        templateType: selectedTemplate as any, // Cast to any since we injected virtual ones
        targetDate: (selectedTemplate === 'holiday' || templateFields.isHoliday) ? templateFields.date : undefined,
        effectiveDate: selectedTemplate === 'change_timings' ? templateFields.effectiveDate : undefined,
        isHoliday: templateFields.isHoliday,
        readBy: []
      };

      const stored = localStorage.getItem('ajps_notices');
      const notices = stored ? JSON.parse(stored) : [];
      
      // If personalized, we actually have to create individual notices, OR for this system we'll just store one notice and modify the UI, but it's simpler to just store one notice with the generic text, and rely on students just seeing the generic one, OR better: create individual notices for each student.
      if (isPersonalized) {
         const individualNotices = finalTargetStudents.map((sid, i) => ({
            ...newNotice,
            id: `notice_${Date.now()}_${i}`,
            targetStudentIds: [sid],
            message: personalizedMessages[sid]
         }));
         const updated = [...individualNotices, ...notices];
         localStorage.setItem('ajps_notices', JSON.stringify(updated));
      } else {
        const updated = [newNotice, ...notices];
        localStorage.setItem('ajps_notices', JSON.stringify(updated));
      }
      
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('ajps_notices_updated'));

      // Notifications
      if (audienceRole === 'Both') {
        (['Student', 'Teacher', 'Admin'] as Role[]).forEach(role => {
          addNotification({
            title: `📢 ${preview.title}`,
            message: preview.message.substring(0, 120) + '...',
            type: 'info' as any,
            recipientRole: role,
          });
        });
      } else if (audienceRole === 'Teacher') {
        addNotification({
          title: `📢 ${preview.title}`,
          message: preview.message.substring(0, 120) + '...',
          type: 'info' as any,
          recipientRole: 'Teacher',
        });
      } else {
        if (finalTargetStudents.length > 0) {
          NotificationService.sendNotification({
            recipientIds: finalTargetStudents,
            title: `📢 ${preview.title}`,
            message: preview.message.substring(0, 120) + '...',
            type: 'info',
          });
        } else if (finalTargetClasses.length > 0) {
          const targetStudents = allStudents.filter(s => s.classId && finalTargetClasses.includes(s.classId));
          if (targetStudents.length > 0) {
            NotificationService.sendNotification({
              recipientIds: targetStudents.map(s => s.id),
              title: `📢 ${preview.title}`,
              message: preview.message.substring(0, 120) + '...',
              type: 'info',
            });
          }
        } else {
          addNotification({
            title: `📢 ${preview.title}`,
            message: preview.message.substring(0, 120) + '...',
            type: 'info' as any,
            recipientRole: 'Student',
          });
        }
      }

      triggerSuccess('Notice Published!');
      onSuccess();
      onClose();
    });
  };

  const filteredStudents = useMemo(() => {
    return allStudents.filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase()) || (s.className && s.className.toLowerCase().includes(studentSearch.toLowerCase())));
  }, [allStudents, studentSearch]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col"
      >
        <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Create Notice</h2>
            <p className="text-xs text-gray-500 mt-1">Configure and publish a new notice</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-8 flex-1">
          {/* Step 1: Audience Role */}
          {!isTeacher && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                1. Select Audience 
                {audienceLocked && <span className="ml-2 text-xs font-normal text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">{lockedMessage}</span>}
              </label>
              <div className="flex flex-wrap gap-3">
                {(['Both', 'Teacher', 'Student'] as AudienceRole[]).map(role => {
                  const isLockedOut = audienceLocked && audienceRole !== role;
                  return (
                    <button
                      key={role}
                      disabled={isLockedOut}
                      onClick={() => {
                        if (audienceLocked) return;
                        setAudienceRole(role);
                        setSelectedClasses([]);
                        setSelectedStudentIds([]);
                      }}
                      className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all border ${
                        audienceRole === role
                          ? 'bg-[#0B1E40] text-white border-[#0B1E40] shadow-md'
                          : isLockedOut 
                            ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed opacity-50'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-[#0B1E40]/30 hover:bg-gray-50'
                      }`}
                    >
                      {role === 'Student' && '🎓 '}
                      {role === 'Teacher' && '👨‍🏫 '}
                      {role === 'Both' && '📢 '}
                      {role === 'Both' ? 'Everyone' : role + 's'}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Granular Targeting (Student only) */}
          <AnimatePresence>
            {audienceRole === 'Student' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    {isTeacher ? '1.' : '2.'} Target Recipients
                  </label>
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => { setTargetMode('class'); setSelectedStudentIds([]); }}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all border flex items-center justify-center gap-2 ${
                        targetMode === 'class'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <Users className="w-4 h-4" /> Entire Class(es)
                    </button>
                    <button
                      onClick={() => { setTargetMode('student'); setSelectedClasses([]); }}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all border flex items-center justify-center gap-2 ${
                        targetMode === 'student'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <UserIcon className="w-4 h-4" /> Specific Student(s)
                    </button>
                  </div>

                  {targetMode === 'class' && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {allClasses.map(cls => {
                        const isSel = selectedClasses.includes(cls.id);
                        const isLockedClass = (audienceLocked && lockedAudienceClassId && cls.id !== lockedAudienceClassId) || (isTeacher && !currentUser?.assignedClasses?.includes(cls.id));
                        return (
                          <button
                            key={cls.id}
                            disabled={!!isLockedClass}
                            onClick={() => {
                              if (isLockedClass) return;
                              setSelectedClasses(prev =>
                                isSel ? prev.filter(c => c !== cls.id) : [...prev, cls.id]
                              );
                            }}
                            className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                              isSel
                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                : isLockedClass 
                                  ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed opacity-50'
                                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-200 hover:bg-blue-50'
                            }`}
                          >
                            {cls.className.replace('Class ', '')}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {targetMode === 'student' && (
                    <div>
                      <div className="relative mb-3">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input 
                          type="text" 
                          placeholder="Search student by name or class..." 
                          value={studentSearch}
                          onChange={(e) => setStudentSearch(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-[#0B1E40] focus:border-transparent"
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl bg-gray-50 p-2">
                        {filteredStudents.map(s => {
                           // Teacher check
                           if (audienceLocked && lockedAudienceClassId && s.classId !== lockedAudienceClassId) return null;
                           if (isTeacher && !currentUser?.assignedClasses?.includes(s.classId || '')) return null;
                           const isChecked = selectedStudentIds.includes(s.id);
                           return (
                             <div 
                               key={s.id} 
                               onClick={() => {
                                 setSelectedStudentIds(prev => isChecked ? prev.filter(id => id !== s.id) : [...prev, s.id])
                               }}
                               className={`flex items-center gap-3 px-3 py-2 cursor-pointer rounded-lg transition-colors ${isChecked ? 'bg-blue-100' : 'hover:bg-gray-200'}`}
                             >
                               <div className={`w-4 h-4 rounded border flex items-center justify-center ${isChecked ? 'bg-blue-600 border-blue-600' : 'border-gray-400'}`}>
                                 {isChecked && <Check className="w-3 h-3 text-white" />}
                               </div>
                               <span className="text-sm">{s.name} ({s.className || 'N/A'})</span>
                             </div>
                           );
                        })}
                        {filteredStudents.length === 0 && (
                          <div className="p-4 text-center text-sm text-gray-500">No students found.</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step 3: Template Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              {isTeacher ? (audienceRole === 'Student' ? '2.' : '1.') : (audienceRole === 'Student' ? '3.' : '2.')} Choose Template
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availableTemplates.map(t => (
                <button
                  key={t.type}
                  onClick={() => {
                    setSelectedTemplate(t.type);
                    setTemplateFields({});
                  }}
                  className={`py-3 px-4 rounded-xl text-sm font-semibold text-left transition-all border flex items-center gap-3 ${
                    selectedTemplate === t.type
                      ? 'bg-orange-50 text-orange-900 border-orange-200 ring-1 ring-orange-500'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300 hover:bg-orange-50/50'
                  }`}
                >
                  <span className="text-xl bg-white w-8 h-8 flex items-center justify-center rounded-lg shadow-sm border border-gray-100">{t.emoji}</span>
                  <span className="truncate">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 4: Dynamic Inputs */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              {isTeacher ? (audienceRole === 'Student' ? '3.' : '2.') : (audienceRole === 'Student' ? '4.' : '3.')} Details
            </label>
            <div className="space-y-4">
              {currentTemplate.fields.map(field => (
                <div key={field.key}>
                  {field.type !== 'checkbox' && <label className="block text-xs font-semibold text-gray-600 mb-1.5">{field.label}</label>}
                  <div className="relative">
                    {field.prefix && (
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-500">
                        {field.prefix}
                      </span>
                    )}
                    {field.type === 'textarea' ? (
                      <textarea
                        value={templateFields[field.key] || ''}
                        onChange={e => updateField(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1E40] focus:border-transparent min-h-[120px] resize-none"
                      />
                    ) : field.type === 'checkbox' ? (
                      <label className="flex items-center gap-2 text-sm font-bold text-gray-700 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={!!templateFields[field.key]}
                          onChange={e => updateField(field.key, e.target.checked)}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-[#0B1E40]"
                        />
                        {field.label}
                      </label>
                    ) : (
                      <input
                        type={field.type}
                        value={templateFields[field.key] || ''}
                        onChange={e => updateField(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        className={`w-full bg-gray-50 border border-gray-200 rounded-xl py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1E40] focus:border-transparent ${field.prefix ? 'pl-9 pr-4' : 'px-4'}`}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Preview */}
          {(preview.title || preview.message) && (
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                <Eye className="w-4 h-4 text-gray-400" /> Preview
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                {preview.title && (
                  <p className="font-bold text-gray-900 text-base mb-2">{preview.title}</p>
                )}
                {preview.message && (
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{preview.message}</p>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white p-6 border-t border-gray-100 flex justify-end gap-3 rounded-b-2xl">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handlePublish}
            disabled={!preview.title.trim() || !preview.message.trim()}
            className="px-6 py-2.5 rounded-lg text-sm font-medium text-white bg-[#0B1E40] hover:bg-blue-900 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" /> Publish Notice
          </button>
        </div>
      </motion.div>
    </div>
  );
}
