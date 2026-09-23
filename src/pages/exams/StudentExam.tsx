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
      <div className="p-8 bg-white" id="report-card-print">
        <style>{`
          @media print {
            body * { visibility: hidden; }
            #report-card-print, #report-card-print * { visibility: visible; }
            #report-card-print { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 20px; box-sizing: border-box; }
            .print\\:hidden { display: none !important; }
            @page { size: A4; margin: 20mm; }
          }
        `}</style>
        {/* Header */}
        <div className="text-center mb-8 border-b-2 border-[#A05C2B] pb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-[#A05C2B] to-[#D4A373] rounded-full flex items-center justify-center text-white mx-auto mb-4 shadow-lg">
            <span className="text-3xl font-black">AJPS</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-widest">Amar Jyoti Public School</h1>
          <p className="text-sm font-semibold text-gray-600 mt-1">Affiliated to CBSE, New Delhi</p>
          <div className="mt-4 inline-block bg-[#FDF7EE] text-[#A05C2B] px-6 py-2 rounded-full border border-[#E8DCC8] shadow-sm">
            <h2 className="text-lg font-bold tracking-wide">{exam.name} - {exam.month} Term</h2>
          </div>
        </div>

        {/* Student Details */}
        <div className="bg-[#FDFBF7] p-5 rounded-xl border border-gray-200 mb-8 flex flex-wrap gap-x-12 gap-y-4">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase">Student Name</p>
            <p className="font-bold text-gray-900 text-lg">{student.name}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase">Class & Section</p>
            <p className="font-bold text-gray-900 text-lg">{studentClassId} - {studentSection}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase">Roll Number</p>
            <p className="font-bold text-gray-900 text-lg">{student.rollNumber || 'N/A'}</p>
          </div>
          {student.fatherName && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Father's Name</p>
              <p className="font-bold text-gray-900 text-lg">{student.fatherName}</p>
            </div>
          )}
          {student.dob && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Date of Birth</p>
              <p className="font-bold text-gray-900 text-lg">{student.dob}</p>
            </div>
          )}
        </div>

        {/* Marks Table */}
        <div className="border border-gray-200 rounded-2xl overflow-hidden mb-8 shadow-sm w-full overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-[#1F2937] text-white">
              <tr>
                <th className="p-4 font-bold tracking-wide text-sm">Subject</th>
                <th className="p-4 font-bold tracking-wide text-sm text-center">Max Marks</th>
                <th className="p-4 font-bold tracking-wide text-sm text-center">Marks Obtained</th>
                <th className="p-4 font-bold tracking-wide text-sm text-center">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {subjects.map((sub, i) => {
                const mark = Number(marksData[sub]);
                return (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-bold text-gray-800">{sub}</td>
                    <td className="p-4 font-semibold text-gray-500 text-center">100</td>
                    <td className="p-4 font-bold text-gray-900 text-center">{mark}</td>
                    <td className="p-4 font-bold text-[#A05C2B] text-center">{getGrade(mark)}</td>
                  </tr>
                )
              })}
              {subjects.length === 0 && (
                <tr>
                   <td colSpan={4} className="p-8 text-center text-gray-500 font-medium">No marks recorded.</td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-[#FDF7EE] border-t-2 border-gray-200">
              <tr>
                <td className="p-4 font-black text-gray-900 text-right">TOTAL:</td>
                <td className="p-4 font-black text-gray-600 text-center">{totalMax}</td>
                <td className="p-4 font-black text-gray-900 text-center text-lg">{totalObtained}</td>
                <td className="p-4 font-bold text-[#A05C2B] text-center">{percentage.toFixed(1)}%</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="flex justify-between items-end pt-8 px-4">
          <div className="text-center">
            <div className="w-32 border-b-2 border-gray-400 mb-2"></div>
            <p className="text-xs font-bold text-gray-500 uppercase">Class Teacher Signature</p>
          </div>
          <div className="text-center relative">
            <img src="/school-seal.png" alt="School Seal" className="absolute bottom-6 -left-8 w-24 h-24 opacity-20 pointer-events-none mix-blend-multiply" />
            <div className="w-32 border-b-2 border-gray-400 mb-2 relative z-10"></div>
            <p className="text-xs font-bold text-gray-500 uppercase">Principal Signature</p>
          </div>
        </div>

        <div className="mt-8 text-center print:hidden">
          <button 
             onClick={() => window.print()}
             className="bg-[#A05C2B] text-white px-6 py-2.5 rounded-xl font-bold shadow-md hover:bg-[#8e5226] transition-colors flex items-center gap-2 mx-auto"
          >
             <Download className="w-4 h-4" /> Download Report
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 min-h-[calc(100vh-4rem)] pb-24 md:pb-8 animate-in fade-in zoom-in-95 duration-300">
      
      {!selectedExam ? (
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-6">
            <div>
              <h1 className="text-2xl font-black text-[#1F2937] tracking-tight">Examinations</h1>
              <p className="text-sm font-semibold text-gray-500 mt-1">View your datesheets, syllabus, and results.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-300">
            {applicableExams.length === 0 ? (
              <div className="col-span-full">
                <GlassCard className="p-12 text-center bg-white/40 border-white shadow-sm">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-gray-800">No Exams</h3>
                  <p className="text-sm text-gray-500 mt-2 font-medium">You have no scheduled exams at the moment.</p>
                </GlassCard>
              </div>
            ) : applicableExams.map(exam => {
              const published = isResultPublished(exam.id);
              return (
                <GlassCard key={exam.id} className="p-6 bg-white/60 border-white shadow-sm hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group" onClick={() => { setSelectedExam(exam); setDetailTab('overview'); }}>
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-2.5 rounded-xl ${published ? 'bg-green-100 text-green-700' : 'bg-[#FDF7EE] text-[#A05C2B]'}`}>
                        {published ? <Award className="w-6 h-6" /> : <Calendar className="w-6 h-6" />}
                      </div>
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wide flex items-center gap-1 ${published ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-800'}`}>
                        {published ? <><CheckCircle className="w-3 h-3" /> Result Declared</> : 'Active / Upcoming'}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#A05C2B] transition-colors">{exam.name}</h3>
                    <p className="text-sm text-gray-500 font-medium mt-1">{exam.month} Term</p>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <span className="text-sm font-bold text-[#A05C2B]">View Details &rarr;</span>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <button onClick={() => setSelectedExam(null)} className="text-sm font-bold text-gray-500 hover:text-gray-800 flex items-center gap-2 mb-4">
            &larr; Back to Exams
          </button>
          
          <GlassCard className="p-0 overflow-hidden bg-white/80 border-white shadow-md">
            <div className="p-6 md:p-8 border-b border-gray-100 bg-[#FDFBF7]">
              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-gray-900">{selectedExam.name}</h2>
                  <p className="text-sm font-bold text-[#A05C2B] bg-[#FDF7EE] inline-block px-3 py-1 rounded-full mt-2">{selectedExam.month}</p>
                </div>
                {isResultPublished(selectedExam.id) && (
                  <span className="bg-green-100 text-green-700 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wide flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> Result Declared
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex border-b border-gray-100 bg-white">
              <button 
                onClick={() => setDetailTab('overview')}
                className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${detailTab === 'overview' ? 'border-[#A05C2B] text-[#A05C2B]' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
              >
                <Calendar className="w-4 h-4" /> Overview
              </button>
              <button 
                onClick={() => setDetailTab('datesheet')}
                className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${detailTab === 'datesheet' ? 'border-[#A05C2B] text-[#A05C2B]' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
              >
                <Calendar className="w-4 h-4" /> Datesheet
              </button>
              <button 
                onClick={() => setDetailTab('syllabus')}
                className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${detailTab === 'syllabus' ? 'border-[#A05C2B] text-[#A05C2B]' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
              >
                <FileText className="w-4 h-4" /> Syllabus
              </button>
              {isResultPublished(selectedExam.id) && (
                <button 
                  onClick={() => setDetailTab('result')}
                  className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${detailTab === 'result' ? 'border-[#A05C2B] text-[#A05C2B]' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
                >
                  <Award className="w-4 h-4" /> Result
                </button>
              )}
            </div>
            
            <div className="p-6 md:p-8 bg-white/50 min-h-[40vh]">
              {detailTab === 'overview' && (() => {
                let sMetrics = { maxMarks: 100, passPercent: 33 };
                const studentClass = currentUser?.classId || currentUser?.className;
                if (selectedExam.metrics) {
                  if (selectedExam.metrics.type === 'same' && selectedExam.metrics.same) {
                    sMetrics = selectedExam.metrics.same;
                  } else if (selectedExam.metrics.type === 'different' && selectedExam.metrics.different && studentClass) {
                    const diff = selectedExam.metrics.different;
                    const cKey1 = String(studentClass);
                    const cKey2 = `Class ${studentClass}`;
                    if (diff[cKey1]) sMetrics = diff[cKey1];
                    else if (diff[cKey2]) sMetrics = diff[cKey2];
                  }
                }
                const passMarks = Math.round((sMetrics.maxMarks * sMetrics.passPercent) / 100);

                return (
                  <div className="max-w-2xl mx-auto space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
                        <p className="text-sm text-gray-500 font-bold uppercase mb-1">Term / Month</p>
                        <p className="text-lg font-black text-gray-900">{selectedExam.month}</p>
                      </div>
                      <div className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
                        <p className="text-sm text-gray-500 font-bold uppercase mb-1">Status</p>
                        {isResultPublished(selectedExam.id) ? (
                          <p className="text-lg font-black text-green-600 flex items-center gap-2"><CheckCircle className="w-5 h-5"/> Declared</p>
                        ) : (
                          <p className="text-lg font-black text-amber-600 flex items-center gap-2"><Lock className="w-5 h-5"/> Ongoing</p>
                        )}
                      </div>
                    </div>

                    <div className="p-6 bg-white border border-gray-100 rounded-xl shadow-sm">
                      <h4 className="text-lg font-black text-gray-900 mb-4 tracking-tight">Evaluation Criteria</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-gray-50 p-4 rounded-xl text-center border border-gray-100">
                          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Max Marks</p>
                          <p className="text-3xl font-black text-gray-900">{sMetrics.maxMarks}</p>
                        </div>
                        <div className="bg-[#FDF7EE] p-4 rounded-xl text-center border border-[#A05C2B]/20">
                          <p className="text-[11px] font-bold text-[#A05C2B] uppercase tracking-wider mb-1">Pass %</p>
                          <p className="text-3xl font-black text-[#A05C2B]">{sMetrics.passPercent}%</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-xl text-center border border-green-200">
                          <p className="text-[11px] font-bold text-green-700 uppercase tracking-wider mb-1">Pass Marks</p>
                          <p className="text-3xl font-black text-green-700">{passMarks}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {detailTab === 'datesheet' && (() => {
                const ds = datesheets.find(d => d.examId === selectedExam.id && (d.classes || []).some(c => 
                  c === studentClassId || 
                  c === classKey || 
                  c === `Class ${studentClassId}` || 
                  c === currentUser?.className ||
                  c?.toLowerCase() === currentUser?.className?.toLowerCase() ||
                  c?.toLowerCase() === `class ${studentClassId}`.toLowerCase() ||
                  c?.toLowerCase() === `class ${currentUser?.className}`.toLowerCase()
                ));
                const schedule = ds?.rows || [];
                return schedule.length === 0 ? (
                  <div className="text-center py-12">
                     <p className="text-gray-500 italic font-semibold">No datesheet released yet.</p>
                  </div>
                ) : (
                  <div className="max-w-xl mx-auto space-y-3">
                    {schedule.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((entry, i) => (
                      <div key={i} className="flex justify-between items-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                        <span className="font-bold text-gray-800 text-lg">{entry.subject}</span>
                        <span className="text-sm font-black text-[#A05C2B] bg-[#FDF7EE] px-4 py-1.5 rounded-lg border border-[#A05C2B]/10">{new Date(entry.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {detailTab === 'syllabus' && (() => {
                const syllabusForExam = selectedExam.syllabus?.filter((s: any) => 
                  s.classId === studentClassId || 
                  s.classId === currentUser?.classId || 
                  s.classId === currentUser?.className || 
                  s.classId === `Class ${studentClassId}` ||
                  s.classId === classKey ||
                  s.classId?.toLowerCase() === currentUser?.className?.toLowerCase() ||
                  s.classId?.toLowerCase() === `class ${currentUser?.className}`.toLowerCase()
                ) || [];
                return syllabusForExam.length === 0 ? (
                  <div className="text-center py-12">
                     <p className="text-gray-500 italic font-semibold">Syllabus not posted yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {syllabusForExam.map((s: any, i: number) => (
                      <GlassCard key={i} className="p-5 bg-white border border-gray-100 shadow-sm">
                        <h5 className="font-black text-gray-900 mb-3 text-lg">{s.subject}</h5>
                        <ul className="list-disc pl-5 space-y-1">
                          {s.tags?.map((tag: string, j: number) => (
                            <li key={j} className="text-sm font-medium text-gray-700">
                              {tag}
                            </li>
                          ))}
                        </ul>
                      </GlassCard>
                    ))}
                  </div>
                );
              })()}

              {detailTab === 'result' && (() => {
                const published = isResultPublished(selectedExam.id);
                if (!published) {
                  return (
                    <div className="max-w-md mx-auto text-center py-12 bg-gray-50 rounded-3xl border border-gray-200 shadow-sm mt-4">
                      <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                      <h4 className="text-xl font-black text-gray-900 mb-2">Results under evaluation</h4>
                      <p className="text-sm text-gray-500 font-medium px-6">Marks are currently being updated by your teachers. You will be notified once published.</p>
                    </div>
                  );
                }
                return (
                  <div className="max-w-md mx-auto text-center py-12">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-green-200">
                      <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 mb-2">Result Declared</h3>
                    <p className="text-sm text-gray-500 font-medium mb-8 px-4">Your result for {selectedExam.name} has been published by the administration.</p>
                    <button 
                      onClick={() => openReportCard(selectedExam)}
                      className="w-full bg-[#1F2937] hover:bg-gray-800 text-white font-bold py-4 rounded-2xl transition-all shadow-xl hover:shadow-2xl text-lg flex items-center justify-center gap-2"
                    >
                      <Award className="w-5 h-5" /> View Report Card
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
