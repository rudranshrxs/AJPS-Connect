import React, { useState } from 'react';
import { Calendar, FileText, Award, AlertTriangle, CheckCircle, X, Download, Lock, RefreshCw } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { useAuth } from '../../context/AuthContext';
import { useExams, Exam } from '../../hooks/useExams';
import { useLoader } from '../../context/LoaderContext';
import { useSuccess } from '../../context/SuccessContext';
import { IndividualReportCard, ReportStudentData } from '../../components/exams/ReportCardTemplate';
import { getExamStatusText } from '../../utils/examUtils';

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
    return results.find(r => {
      if (r.examId !== examId) return false;
      const key = r.classKey?.toLowerCase() || '';
      const cId = (studentClassId || '').toLowerCase();
      const cName = (currentUser?.className || '').toLowerCase();
      return key === `${examId.toLowerCase()}_${cId}` ||
             key === `${examId.toLowerCase()}_class ${cId}` ||
             key === `${examId.toLowerCase()}_${cName}` ||
             key === `${examId.toLowerCase()}_class ${cName}` ||
             key.endsWith(`_${cId}`) || 
             key.endsWith(`_${cName}`);
    });
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

  // ── VICTORY CINEMATIC: triggered when student clicks "View Report Card" ──
  const openReportCard = (exam: Exam) => {
    setSelectedExam(exam);
    
    const victoryKey = `victory_played_${currentUser?.id}_${exam.id}`;
    const hasPlayed = localStorage.getItem(victoryKey);

    // Wrap the mount in runWithLoader
    runWithLoader(() => {
      if (!hasPlayed) {
        localStorage.setItem(victoryKey, 'true');
        triggerVictory('Result Declared!', 'Check your marks below');
      }
      
      setTimeout(() => {
        setReportCardModalOpen(true);
      }, hasPlayed ? 10 : 500);
    });
  };

  // ── Report Card using proper template ──
  const ReportCardView = ({ student, exam }: { student: any, exam: Exam }) => {
    const marksData = getStudentMarks(exam.id);
    const subjects = Object.keys(marksData).filter(sub => {
       const val = marksData[sub] as any;
       return val !== undefined && val !== null && val !== 'N/A' && val !== '';
    });

    // Get max marks & passing percent from exam metrics
    let maxMarksPerSubject = 100;
    let passingPercent = 33;
    const studentClass = currentUser?.classId || currentUser?.className;
    if (exam.metrics) {
      if (exam.metrics.type === 'same' && exam.metrics.same) {
        maxMarksPerSubject = exam.metrics.same.maxMarks;
        passingPercent = exam.metrics.same.passPercent;
      } else if (exam.metrics.type === 'different' && exam.metrics.different && studentClass) {
        const diff = exam.metrics.different;
        const cKey1 = String(studentClass);
        const cKey2 = `Class ${studentClass}`;
        if (diff[cKey1]) { maxMarksPerSubject = diff[cKey1].maxMarks; passingPercent = diff[cKey1].passPercent; }
        else if (diff[cKey2]) { maxMarksPerSubject = diff[cKey2].maxMarks; passingPercent = diff[cKey2].passPercent; }
      }
    }

    // Compute all student totals for rank calculation
    const publishedResult = getPublishedResult(exam.id);
    const allStudentTotals: number[] = [];
    if (publishedResult && publishedResult.marks) {
      Object.values(publishedResult.marks).forEach((m: any) => {
        const total = subjects.reduce((sum, sub) => sum + (Number(m[sub]) || 0), 0);
        
        let validSubsCount = 0;
        subjects.forEach(sub => {
           const v = m[sub];
           if (v !== undefined && v !== null && v !== '' && (v as any) !== 'N/A' && Number(v) !== 0) {
             validSubsCount++;
           }
        });
        const totalMaxMarksLocal = validSubsCount * maxMarksPerSubject;
        const pct = totalMaxMarksLocal > 0 ? (total / totalMaxMarksLocal) * 100 : 0;
        
        allStudentTotals.push(pct);
      });
    }

    const reportStudent: ReportStudentData = {
      id: student.id,
      name: student.name,
      rollNumber: student.rollNumber,
      fatherName: student.fatherName,
      className: currentUser?.className || `Class ${studentClassId}`,
      section: studentSection,
      marks: marksData
    };

    return (
      <div className="w-full max-w-full">
        <style>{`
          @media print {
            body * { visibility: hidden; }
            html, body, #root, .main-content-responsive, main { overflow: visible !important; height: auto !important; position: static !important; }
            #student-report-card-print, #student-report-card-print * { visibility: visible; }
            #student-report-card-print { position: static !important; width: 100%; margin: 0; padding: 0; display: block !important; overflow: visible !important; height: auto !important; }
            .print\\:hidden { display: none !important; }
            @page { size: A4 portrait; margin: 15mm; }
          }
        `}</style>

        <div id="student-report-card-print">
          <IndividualReportCard
            student={reportStudent}
            examName={exam.name}
            session="2024 - 2025"
            subjects={subjects}
            maxMarksPerSubject={maxMarksPerSubject}
            passingPercent={passingPercent}
            allStudentTotals={allStudentTotals}
            printId="student-report-card-print-inner"
          />
        </div>

        <div className="mt-6 text-center print:hidden">
          <button 
             onClick={() => window.print()}
             className="bg-[#1a237e] text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-[#283593] transition-colors flex items-center gap-2 mx-auto"
          >
             <Download className="w-5 h-5" /> Download / Print Report Card
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8 max-w-full mx-auto space-y-8 min-h-[calc(100vh-4rem)] pb-24 md:pb-8 animate-in fade-in zoom-in-95 duration-300">
      
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
              const examDatesheets = datesheets.filter((d: any) => d.examId === exam.id);
              const allDatesStr = examDatesheets.flatMap((d: any) => (d.rows || d.schedule || []).map((r: any) => r.date)).filter(Boolean).sort();
              const published = isResultPublished(exam.id);
              const statusText = getExamStatusText(exam, allDatesStr, published);
              
              return (
                <GlassCard key={exam.id} className="p-6 bg-white/60 border-white shadow-sm hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group" onClick={() => { setSelectedExam(exam); setDetailTab(published ? 'result' : 'overview'); }}>
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-2.5 rounded-xl ${statusText === 'Result Declared' ? 'bg-green-100 text-green-700' : 'bg-[#FDF7EE] text-[#A05C2B]'}`}>
                        {statusText === 'Result Declared' ? <Award className="w-6 h-6" /> : <Calendar className="w-6 h-6" />}
                      </div>
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wide flex items-center gap-1 ${
                        statusText === 'Result Declared' ? 'bg-green-100 text-green-700' :
                        statusText === 'Commenced' ? 'bg-blue-100 text-blue-700' :
                        statusText === 'Ongoing' ? 'bg-purple-100 text-purple-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {statusText}
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
            
            <div className="px-6 md:px-8 py-4 border-b border-gray-100 bg-white">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Select View</label>
              <select 
                value={detailTab}
                onChange={(e) => setDetailTab(e.target.value as any)}
                className="w-full md:w-64 bg-gray-50 border border-gray-200 text-gray-800 text-sm font-bold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#A05C2B]/30 shadow-sm transition-all"
              >
                <option value="overview">Overview</option>
                <option value="datesheet">Datesheet</option>
                <option value="syllabus">Syllabus</option>
                {isResultPublished(selectedExam.id) && (
                  <option value="result">Result</option>
                )}
              </select>
            </div>
            
            <div className="p-4 md:p-8 bg-white/50 min-h-[40vh]">
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

                const examDatesheets = datesheets.filter((d: any) => d.examId === selectedExam.id);
                const allDatesStr = examDatesheets.flatMap((d: any) => (d.rows || d.schedule || []).map((r: any) => r.date)).filter(Boolean).sort();
                const firstDateStr = allDatesStr.length > 0 ? allDatesStr[0] : null;
                const published = isResultPublished(selectedExam.id);
                const examStatusText = getExamStatusText(selectedExam, allDatesStr, published);

                return (
                  <div className="max-w-2xl mx-auto space-y-4">
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div className="p-3 sm:p-4 bg-white border border-gray-100 rounded-xl shadow-sm flex flex-col justify-center">
                        <p className="text-xs sm:text-sm text-gray-500 font-bold uppercase mb-1">Term / Month</p>
                        <p className="text-base sm:text-lg font-black text-gray-900">{selectedExam.month}</p>
                      </div>
                      <div className="p-3 sm:p-4 bg-white border border-gray-100 rounded-xl shadow-sm flex flex-col justify-center">
                        <p className="text-xs sm:text-sm text-gray-500 font-bold uppercase mb-1">Status</p>
                        {examStatusText === 'Result Declared' ? (
                          <p className="text-base sm:text-lg font-black text-green-600 flex items-center gap-1 sm:gap-2"><CheckCircle className="w-4 h-4 sm:w-5 sm:h-5"/> Result Declared</p>
                        ) : examStatusText === 'Commenced' ? (
                          <p className="text-base sm:text-lg font-black text-blue-600 flex items-center gap-1 sm:gap-2"><RefreshCw className="w-4 h-4 sm:w-5 sm:h-5"/> Commenced</p>
                        ) : examStatusText === 'Ongoing' ? (
                          <p className="text-base sm:text-lg font-black text-purple-600 flex items-center gap-1 sm:gap-2"><RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin"/> Ongoing</p>
                        ) : (
                          <p className="text-base sm:text-lg font-black text-amber-600 flex items-center gap-1 sm:gap-2"><Lock className="w-4 h-4 sm:w-5 sm:h-5"/> Upcoming</p>
                        )}
                      </div>
                    </div>

                    <div className="p-4 sm:p-6 bg-white border border-gray-100 rounded-xl shadow-sm">
                      <h4 className="text-base sm:text-lg font-black text-gray-900 mb-3 sm:mb-4 tracking-tight">Evaluation Criteria</h4>
                      <div className="grid grid-cols-3 gap-2 sm:gap-4">
                        <div className="bg-gray-50 p-2 sm:p-4 rounded-xl text-center border border-gray-100">
                          <p className="text-[9px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Max Marks</p>
                          <p className="text-xl sm:text-3xl font-black text-gray-900">{sMetrics.maxMarks}</p>
                        </div>
                        <div className="bg-[#FDF7EE] p-2 sm:p-4 rounded-xl text-center border border-[#A05C2B]/20">
                          <p className="text-[9px] sm:text-[11px] font-bold text-[#A05C2B] uppercase tracking-wider mb-1">Pass %</p>
                          <p className="text-xl sm:text-3xl font-black text-[#A05C2B]">{sMetrics.passPercent}%</p>
                        </div>
                        <div className="bg-green-50 p-2 sm:p-4 rounded-xl text-center border border-green-200">
                          <p className="text-[9px] sm:text-[11px] font-bold text-green-700 uppercase tracking-wider mb-1">Pass Marks</p>
                          <p className="text-xl sm:text-3xl font-black text-green-700">{passMarks}</p>
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
                        <span className="font-bold text-gray-800 text-base md:text-lg">{entry.subject}</span>
                        <span className="text-xs md:text-sm font-black text-[#A05C2B] bg-[#FDF7EE] px-3 md:px-4 py-1.5 rounded-lg border border-[#A05C2B]/10">{new Date(entry.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
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
                const publishedResult = getPublishedResult(selectedExam.id);
                const allMarks = publishedResult?.marks || {};
                const myMarks = allMarks[currentUser?.id || ''] || {};

                const subjects = Object.keys(myMarks).filter(sub => {
                  const m = myMarks[sub];
                  return m !== undefined && m !== null && (m as any) !== '';
                });
                
                let maxMarksPerSubject = 100;
                const cKey1 = String(studentClassId);
                const cKey2 = `Class ${studentClassId}`;
                let diff = selectedExam.metrics?.different || {};
                if (selectedExam.metrics?.type === 'same') {
                   maxMarksPerSubject = selectedExam.metrics.same?.maxMarks || 100;
                } else if (diff[cKey1]) {
                   maxMarksPerSubject = diff[cKey1].maxMarks;
                } else if (diff[cKey2]) {
                   maxMarksPerSubject = diff[cKey2].maxMarks;
                }

                let myTotal = 0;
                let validCount = 0;
                subjects.forEach(sub => {
                  const m = myMarks[sub];
                  if (m !== undefined && m !== null && (m as any) !== '') {
                    myTotal += Number(m) || 0;
                    validCount++;
                  }
                });

                const maxPossible = validCount * maxMarksPerSubject;
                const myPct = maxPossible > 0 ? (myTotal / maxPossible) * 100 : 0;

                const totals = Object.values(allMarks).map((sm: any) => {
                  let stTotal = 0;
                  subjects.forEach(sub => {
                    const m = sm[sub];
                    if (m !== undefined && m !== null && (m as any) !== '') {
                      stTotal += Number(m) || 0;
                    }
                  });
                  return stTotal;
                }).sort((a, b) => b - a);

                let myRank = totals.indexOf(myTotal) + 1;

                return (
                  <div className="max-w-2xl mx-auto py-6 space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-green-50 border border-green-200 p-6 rounded-3xl shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center border border-green-200">
                          <CheckCircle className="w-7 h-7 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-gray-900">Result Declared</h3>
                          <p className="text-sm text-gray-600 font-medium">Your final marks are now available.</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => openReportCard(selectedExam)}
                        className="w-full md:w-auto bg-[#1F2937] hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                      >
                        <Award className="w-4 h-4" /> Generate Report
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-3 md:gap-4">
                      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Marks</p>
                        <p className="text-2xl font-black text-[#A05C2B]">{myTotal} <span className="text-sm text-gray-400">/ {maxPossible}</span></p>
                      </div>
                      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Percentage</p>
                        <p className="text-2xl font-black text-[#1F2937]">{myPct.toFixed(1)}%</p>
                      </div>
                      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Class Rank</p>
                        <p className="text-2xl font-black text-purple-600">#{myRank}</p>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-6">
                      <div className="bg-gray-50 p-4 border-b border-gray-100">
                        <h4 className="font-bold text-gray-900 flex items-center gap-2"><Award className="w-4 h-4 text-[#A05C2B]" /> Subject-wise Performance</h4>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {subjects.map(sub => {
                          const m = myMarks[sub];
                          const isValid = m !== undefined && m !== null && (m as any) !== '';
                          return (
                            <div key={sub} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                              <span className="font-bold text-gray-700">{sub}</span>
                              {isValid ? (
                                <span className="font-black text-lg text-gray-900">{m} <span className="text-xs text-gray-400 font-bold">/ {maxMarksPerSubject}</span></span>
                              ) : (
                                <span className="font-medium text-gray-400 italic">Not evaluated</span>
                              )}
                            </div>
                          );
                        })}
                        {subjects.length === 0 && (
                          <div className="p-8 text-center text-gray-500 italic font-medium">No subjects evaluated yet.</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </GlassCard>
        </>
      )}

      {reportCardModalOpen && selectedExam && currentUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm overflow-y-auto custom-scrollbar">
          <div className="bg-white w-full max-w-[850px] mx-auto my-8 rounded-3xl shadow-2xl relative border border-white overflow-hidden">
            <button 
              onClick={() => setReportCardModalOpen(false)}
              className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors z-10 print:hidden"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-4 md:p-6 overflow-y-auto max-h-[90vh]">
              <ReportCardView student={currentUser} exam={selectedExam} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
