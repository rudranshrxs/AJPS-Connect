import React, { useState } from 'react';
import { Calendar, FileText, Award, AlertTriangle, CheckCircle, X, Download, Lock } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { useAuth } from '../../context/AuthContext';
import { useExams, Exam } from '../../hooks/useExams';
import { useLoader } from '../../context/LoaderContext';
import { useSuccess } from '../../context/SuccessContext';

export function StudentExam() {
  const { currentUser } = useAuth();
  const { exams, datesheets, results } = useExams();
  const { runWithLoader } = useLoader();
  const { triggerVictory } = useSuccess();

  const [detailTab, setDetailTab] = useState<'overview' | 'datesheet' | 'syllabus' | 'result'>('overview');
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [reportCardModalOpen, setReportCardModalOpen] = useState(false);

  // Fallbacks
  const studentClassId = currentUser?.classId || '10';
  const studentSection = currentUser?.sectionId || currentUser?.section || 'A';
  const classKey = `${studentClassId}-${studentSection}`;

  const getPublishedResult = (examId: string) => {
    const targetClassKey = `${examId}_${studentClassId}`;
    const targetClassKeyWithClass = `${examId}_Class ${studentClassId}`;
    const targetClassKeyWithClassName = `${examId}_${currentUser?.className}`;

    return results.find(r => 
      r.examId === examId && 
      (r.classKey === targetClassKey || 
       r.classKey === targetClassKeyWithClass ||
       r.classKey === targetClassKeyWithClassName)
    );
  };

  // Check if result is published for this exam and class
  const isResultPublished = (examId: string) => {
    const result = getPublishedResult(examId);
    return result?.isPublished === true;
  };

  const getStudentMarks = (examId: string) => { 
     const result = getPublishedResult(examId); 
     if (!result || !currentUser?.id) return {}; 
     return result.marks?.[currentUser.id] || {}; 
  };

  // Filter exams assigned to this student's class
  const applicableExams = exams.filter(e =>
    (e.classes || []).some(c =>
      c === studentClassId ||
      c === currentUser?.className ||
      c === `Class ${studentClassId}` ||
      c?.toLowerCase().trim() === `class ${studentClassId}`.toLowerCase()
    )
  );

  const upcomingExams = applicableExams.filter(e => !isResultPublished(e.id));
  const pastExams = applicableExams.filter(e => isResultPublished(e.id));

  // ── VICTORY CINEMATIC: triggered when student clicks "View Report Card" ──
  const openReportCard = (exam: Exam) => {
    setSelectedExam(exam);
    
    // Wrap the mount in runWithLoader → then triggerVictory
    runWithLoader(() => {
      // After the 4-second loader finishes, trigger the victory overlay
      triggerVictory('Result Declared!', 'Check your marks below');
      
      // Open the report card modal after a short delay to let victory play
      setTimeout(() => {
        setReportCardModalOpen(true);
      }, 500);
    });
  };

  const ReportCard = ({ student, exam }: { student: any, exam: Exam }) => {
    const marksData = getStudentMarks(exam.id);
    const subjects = Object.keys(marksData).filter(sub => {
       const val = marksData[sub] as any;
       return val !== undefined && val !== null && val !== 'N/A' && val !== '';
    });
    
    let totalObtained = 0;
    const totalMax = subjects.length * 100;
    
    subjects.forEach(sub => {
       totalObtained += Number(marksData[sub]) || 0;
    });
    
    const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
    
    const getGrade = (mark: number) => {
      if (mark >= 90) return 'A1';
      if (mark >= 80) return 'A2';
      if (mark >= 70) return 'B1';
      if (mark >= 60) return 'B2';
      if (mark >= 50) return 'C1';
      if (mark >= 40) return 'C2';
      if (mark >= 33) return 'D';
      return 'E (Failed)';
    };

    
                return (
                  <div className="max-w-2xl mx-auto py-8">
                    <div className="mb-8 p-6 bg-white rounded-2xl border border-green-200 shadow-sm text-center">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-green-200">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                      </div>
                      <h3 className="text-2xl font-black text-gray-900 mb-2">Result Declared</h3>
                      <p className="text-sm text-gray-500 font-medium">Your result for {selectedExam.name} has been published.</p>
                    </div>

                    {/* Marks Overview */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-[#1F2937] text-white">
                          <tr>
                            <th className="p-4 font-bold tracking-wide">Subject</th>
                            <th className="p-4 font-bold tracking-wide text-center">Marks Obtained</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {(() => {
                            const marksData = getStudentMarks(selectedExam.id);
                            const subjects = Object.keys(marksData).filter(sub => marksData[sub] !== undefined && marksData[sub] !== null && marksData[sub] !== '' && marksData[sub] !== 'N/A');
                            let totalObtained = 0;
                            subjects.forEach(sub => totalObtained += Number(marksData[sub]) || 0);
                            const totalMax = subjects.length * 100;
                            const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;

                            return (
                              <>
                                {subjects.map((sub, i) => (
                                  <tr key={i} className="hover:bg-gray-50">
                                    <td className="p-4 font-bold text-gray-800">{sub}</td>
                                    <td className="p-4 font-black text-[#A05C2B] text-center">{marksData[sub]} <span className="text-xs text-gray-400 font-medium">/ 100</span></td>
                                  </tr>
                                ))}
                                {subjects.length === 0 && (
                                  <tr><td colSpan={2} className="p-6 text-center text-gray-500 font-medium">No marks recorded.</td></tr>
                                )}
                                <tr className="bg-[#FDF7EE]">
                                  <td className="p-4 font-black text-gray-900 text-right">TOTAL</td>
                                  <td className="p-4 font-black text-[#A05C2B] text-center">{totalObtained} <span className="text-xs text-gray-400 font-medium">/ {totalMax}</span></td>
                                </tr>
                                <tr className="bg-[#FDFBF7]">
                                  <td className="p-4 font-black text-gray-900 text-right">PERCENTAGE</td>
                                  <td className="p-4 font-black text-green-600 text-center text-lg">{percentage.toFixed(1)}%</td>
                                </tr>
                              </>
                            );
                          })()}
                        </tbody>
                      </table>
                    </div>

                    <button 
                      onClick={() => openReportCard(selectedExam)}
                      className="w-full bg-[#1F2937] hover:bg-gray-800 text-white font-bold py-4 rounded-2xl transition-all shadow-xl hover:shadow-2xl text-lg flex items-center justify-center gap-2"
                    >
                      <Award className="w-5 h-5" /> Generate Report Card
                    </button>
                  </div>
                );
    
              })()}
            </div>
          </GlassCard>
        </>
      )}

      {reportCardModalOpen && selectedExam && currentUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm overflow-y-auto custom-scrollbar">
          <div className="bg-[#FDFBF7] w-full max-w-3xl my-8 rounded-3xl shadow-2xl relative border border-white">
            <button 
              onClick={() => setReportCardModalOpen(false)}
              className="absolute top-6 right-6 p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors z-10 print:hidden"
            >
              <X className="w-5 h-5" />
            </button>
            <ReportCard student={currentUser} exam={selectedExam} />
          </div>
        </div>
      )}
    </div>
  );
}
