cat << 'INNER_EOF' > /tmp/StudentExam.tsx
import React, { useState, useEffect } from 'react';
import { Calendar, FileText, Award, CheckCircle, X } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { ReportCard } from '../../components/exams/ReportCard';
import { useAuth } from '../../context/AuthContext';
import { Exam } from './AdminExam';

interface SyllabusRecord {
  examId: string;
  classId: string;
  subject: string;
  tags: string[];
}

export function StudentExam() {
  const { currentUser } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [allSyllabus, setAllSyllabus] = useState<SyllabusRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [reportCardModalOpen, setReportCardModalOpen] = useState(false);

  // In a real app, this comes from the student's profile
  const studentClass = 'Class 10';

  useEffect(() => {
    const loadExams = () => {
      const stored = localStorage.getItem('ajps_exams');
      if (stored) {
        setExams(JSON.parse(stored) || []);
      }
      const storedSyllabus = localStorage.getItem('ajps_syllabus');
      if (storedSyllabus) {
        setAllSyllabus(JSON.parse(storedSyllabus) || []);
      }
    };
    loadExams();
    window.addEventListener('exams_updated', loadExams);
    window.addEventListener('syllabus_updated', loadExams);
    return () => {
      window.removeEventListener('exams_updated', loadExams);
      window.removeEventListener('syllabus_updated', loadExams);
    }
  }, []);

  const studentExams = exams.filter(e => (e.classes || []).includes(studentClass));
  const upcomingExams = studentExams.filter(e => !e.isPublished);
  const pastExams = studentExams.filter(e => e.isPublished);

  const openReportCard = (exam: Exam) => {
    setSelectedExam(exam);
    setReportCardModalOpen(true);
  };

  // Mock marks generator for report card
  const getDummyMarks = () => {
    return [
      { subject: 'English', marks: 88, grade: 'A2' },
      { subject: 'Hindi', marks: 85, grade: 'A2' },
      { subject: 'Maths', marks: 95, grade: 'A1' },
      { subject: 'Science', marks: 92, grade: 'A1' },
      { subject: 'Social Science', marks: 88, grade: 'A2' }
    ];
  };

  const getSyllabusForSubject = (examId: string, subject: string) => {
    return allSyllabus.find(s => s.examId === examId && s.classId === studentClass && s.subject === subject)?.tags || [];
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 min-h-[calc(100vh-4rem)] pb-24 md:pb-8">
      <div>
        <h1 className="text-2xl font-black text-[#1F2937] tracking-tight">My Examinations</h1>
        <p className="text-sm font-semibold text-gray-500">View datesheets, syllabus, and report cards.</p>
      </div>

      <div className="flex gap-2 bg-white/40 p-1.5 rounded-xl border border-white/60 backdrop-blur-md w-max shadow-sm">
        <button 
          onClick={() => setActiveTab('upcoming')}
          className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'upcoming' ? 'bg-white text-[#A05C2B] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Upcoming Exams
        </button>
        <button 
          onClick={() => setActiveTab('past')}
          className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'past' ? 'bg-white text-[#A05C2B] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Past Exams
        </button>
      </div>

      {activeTab === 'upcoming' && (
        <div className="space-y-4">
          {upcomingExams.length === 0 ? (
            <div className="p-8 text-center bg-white/30 rounded-2xl border border-white/50">
              <p className="text-gray-500 font-medium">No upcoming exams.</p>
            </div>
          ) : (
            upcomingExams.map(exam => (
              <GlassCard key={exam.id} className="p-0 bg-white/60 border-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="p-5 border-b border-white/40 bg-white/40 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-[#1F2937]">{exam.name}</h3>
                    <p className="text-xs font-semibold text-gray-500">{exam.month} • {exam.session}</p>
                  </div>
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wide">
                    Upcoming
                  </span>
                </div>
                
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Datesheet */}
                  <div>
                    <h4 className="text-sm font-bold text-[#A05C2B] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" /> Datesheet
                    </h4>
                    {(exam.datesheet || []).length === 0 ? (
                      <p className="text-xs text-gray-500 italic bg-gray-50 p-3 rounded-lg border border-gray-100">No datesheet released yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {(exam.datesheet || []).map((entry, i) => (
                          <div key={i} className="flex justify-between items-center bg-white border border-gray-100 p-2.5 rounded-lg shadow-sm">
                            <span className="text-sm font-bold text-gray-800">{entry.subject}</span>
                            <span className="text-xs font-semibold text-gray-500 bg-gray-50 px-2 py-1 rounded">{entry.date}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Syllabus */}
                  <div>
                    <h4 className="text-sm font-bold text-[#A05C2B] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <FileText className="w-4 h-4" /> Syllabus
                    </h4>
                    {(exam.datesheet || []).length === 0 ? (
                      <p className="text-xs text-gray-500 italic bg-gray-50 p-3 rounded-lg border border-gray-100">Datesheet not declared yet.</p>
                    ) : (
                      <div className="bg-white border border-gray-100 p-3 rounded-lg shadow-sm space-y-3">
                        {(exam.datesheet || []).map((entry, i) => {
                          const tags = getSyllabusForSubject(exam.id, entry.subject);
                          return (
                            <div key={i}>
                              <p className="text-xs font-bold text-gray-700 mb-1">{entry.subject}</p>
                              {tags.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {tags.map(tag => (
                                    <span key={tag} className="bg-[#FDF7EE] text-[#A05C2B] text-[10px] font-bold px-2 py-1 rounded border border-[#A05C2B]/20">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-[10px] text-gray-400 italic">Not released yet</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </GlassCard>
            ))
          )}
        </div>
      )}

      {activeTab === 'past' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pastExams.length === 0 ? (
             <div className="col-span-full p-8 text-center bg-white/30 rounded-2xl border border-white/50">
               <p className="text-gray-500 font-medium">No past exams available.</p>
             </div>
          ) : (
            pastExams.map(exam => (
              <GlassCard 
                key={exam.id} 
                onClick={() => openReportCard(exam)}
                className="p-5 bg-white/60 border-white cursor-pointer hover:shadow-lg transition-all active:scale-95 group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600 border border-green-200">
                    <Award className="w-6 h-6" />
                  </div>
                  <span className="bg-green-100 text-green-800 text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wide flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Published
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[#1F2937] group-hover:text-[#A05C2B] transition-colors">{exam.name}</h3>
                <p className="text-xs font-semibold text-gray-500 mt-1">{exam.month} • {exam.session}</p>
                
                <div className="mt-4 flex items-center text-xs font-bold text-[#A05C2B]">
                  View Report Card <span className="ml-1 group-hover:translate-x-1 transition-transform">&rarr;</span>
                </div>
              </GlassCard>
            ))
          )}
        </div>
      )}

      {/* Report Card Modal */}
      {reportCardModalOpen && selectedExam && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1F2937]/60 backdrop-blur-md animate-in fade-in p-0 md:p-8 overflow-y-auto">
          <div className="w-full max-w-[210mm] min-h-screen md:min-h-0 bg-transparent flex flex-col relative print:bg-white print:p-0">
            {/* Close button - hidden in print */}
            <button 
              onClick={() => setReportCardModalOpen(false)} 
              className="absolute top-4 right-4 z-50 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full backdrop-blur-md transition-colors print:hidden"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="flex-1 my-auto print:my-0">
              <ReportCard 
                student={{
                  name: currentUser?.name || 'Student Name',
                  fatherName: 'Mr. John Doe',
                  motherName: 'Mrs. Jane Doe',
                  className: studentClass,
                  rollNo: '27',
                  section: 'A',
                  avatarUrl: currentUser?.avatarUrl || ''
                }}
                examInfo={{
                  examName: selectedExam.name,
                  session: selectedExam.session,
                  date: new Date().toLocaleDateString()
                }}
                marks={getDummyMarks()}
                summary={{
                  totalMarks: 448,
                  maxTotal: 500,
                  percentage: 89.6,
                  overallGrade: 'A2',
                  rank: 2
                }}
                remarks="Excellent performance. Needs slight improvement in Science."
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
INNER_EOF
mv /tmp/StudentExam.tsx src/pages/exams/StudentExam.tsx
