import React from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────
export interface ReportStudentData {
  id: string;
  name: string;
  rollNumber?: string;
  fatherName?: string;
  className?: string;
  section?: string;
  marks: Record<string, number>; // subject -> marks
}

interface IndividualReportCardProps {
  student: ReportStudentData;
  examName: string;
  session: string;
  subjects: string[];
  maxMarksPerSubject: number;
  passingPercent: number;
  allStudentTotals?: number[]; // for rank calculation
  teacherRemark?: string;
  printId?: string;
}

interface ClassReportProps {
  students: ReportStudentData[];
  examName: string;
  session: string;
  className: string;
  section?: string;
  subjects: string[];
  maxMarksPerSubject: number;
  printId?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const getGrade = (marks: number, max: number): string => {
  const pct = (marks / max) * 100;
  if (pct >= 91) return 'A1';
  if (pct >= 81) return 'A2';
  if (pct >= 71) return 'B1';
  if (pct >= 61) return 'B2';
  if (pct >= 51) return 'C1';
  if (pct >= 41) return 'C2';
  if (pct >= 33) return 'D';
  return 'E';
};

const getTeacherRemark = (pct: number): string => {
  if (pct >= 90) return 'Outstanding performance. A brilliant and self-motivated student who sets an example for others.';
  if (pct >= 75) return 'Excellent performance! The student is very good and needs to continue working hard.';
  if (pct >= 60) return 'Good performance. The student has shown dedication and can improve further with consistent effort.';
  if (pct >= 45) return 'Satisfactory performance. Needs to work harder and focus more on weak subjects.';
  if (pct >= 33) return 'Needs improvement. The student must pay more attention to studies and practice regularly.';
  return 'Unsatisfactory performance. Requires immediate attention and extra classes are recommended.';
};

// ── Shared Header ──────────────────────────────────────────────────────────────
export const formatClassSection = (c?: string, s?: string) => {
  let cls = (c || '').replace(/class/i, '').trim();
  // Extract number if it contains something like C10 or 10th
  const numMatch = cls.match(/(\d+)/);
  if (numMatch) {
    const num = numMatch[1];
    if (['1', '2', '3'].includes(num) && num !== '11' && num !== '12' && num !== '13') {
      if (num === '1') cls = '1st';
      else if (num === '2') cls = '2nd';
      else if (num === '3') cls = '3rd';
    } else {
      cls = num + 'th';
    }
  }
  return cls ? `${cls} ${s ? `- ${s}` : ''}`.trim() : '—';
};

function ReportHeader({ session, subtitle }: { session: string; subtitle?: string }) {
  const examName = subtitle ? subtitle.replace('Examination: ', '') : 'Term Exam';
  return (
    <div style={{ textAlign: 'center', marginBottom: '15px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
        <img src="/Logo.png" alt="School Logo" style={{ width: '100px', height: '100px', objectFit: 'contain' }} />
        <div style={{ paddingBottom: '10px' }}>
          <h1 style={{ fontSize: '38px', fontWeight: 900, color: '#1a237e', margin: '0 0 5px 0', fontFamily: 'Georgia, serif' }}>
            AMAR JYOTI PUBLIC SCHOOL
          </h1>
          <p style={{ fontSize: '18px', color: '#1a237e', fontWeight: 700, margin: 0 }}>
            Raun, Bhind, MP - 477335
          </p>
        </div>
      </div>
      
      {/* Lotus icon separator */}
      <div style={{ margin: '15px auto', width: '90%', borderBottom: '1px solid #d4af37', position: 'relative', display: 'flex', justifyContent: 'center', height: '1px' }}>
        <img src="/lotus.png" style={{ position: 'absolute', top: '-12px', height: '20px', backgroundColor: '#fff', padding: '0 15px' }} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<span style="position: absolute; top: -14px; background-color: #fff; padding: 0 15px; color: #d4af37; font-size: 20px;">❦</span>' }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', padding: '0 10px' }}>
        <div style={{ display: 'flex', border: '1px solid #64b5f6', overflow: 'hidden', borderRadius: '4px' }}>
          <div style={{ backgroundColor: '#1565c0', color: '#fff', padding: '4px 15px', fontWeight: 'bold', fontSize: '12px' }}>Session</div>
          <div style={{ backgroundColor: '#e3f2fd', color: '#1a237e', padding: '4px 15px', fontWeight: 'bold', fontSize: '12px' }}>{session}</div>
        </div>
        <div style={{ display: 'flex', border: '1px solid #64b5f6', overflow: 'hidden', borderRadius: '4px' }}>
          <div style={{ backgroundColor: '#1565c0', color: '#fff', padding: '4px 15px', fontWeight: 'bold', fontSize: '12px' }}>Examination</div>
          <div style={{ backgroundColor: '#e3f2fd', color: '#1a237e', padding: '4px 15px', fontWeight: 'bold', fontSize: '12px' }}>{examName}</div>
        </div>
      </div>
    </div>
  );
}

// ── Shared Footer ──────────────────────────────────────────────────────────────
function ReportFooter({ showSeal }: { showSeal?: boolean }) {
  const currentDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '20px', padding: '0 10px', position: 'relative' }}>
      <div style={{ textAlign: 'center' }}>
        <img src="/class-teacher-signature.png" alt="" style={{ width: '100px', height: '40px', objectFit: 'contain', marginBottom: '4px' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        <div style={{ width: '140px', borderBottom: '1px solid #1a237e', marginBottom: '4px' }} />
        <p style={{ fontSize: '12px', fontWeight: 600, color: '#1a237e', margin: 0 }}>Class Teacher's Signature</p>
      </div>

      {showSeal && (
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img
            src="/school-seal.png"
            alt="School Seal"
            style={{ width: '70px', height: '70px', objectFit: 'contain', marginBottom: '8px' }}
          />
          <p style={{ fontSize: '12px', fontWeight: 600, color: '#1a237e', margin: 0 }}>Date : {currentDate}</p>
        </div>
      )}

      <div style={{ textAlign: 'center' }}>
        <img
          src="/principal-signature.png"
          alt=""
          style={{ width: '100px', height: '40px', objectFit: 'contain', marginBottom: '4px' }}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <div style={{ width: '140px', borderBottom: '1px solid #1a237e', marginBottom: '4px' }} />
        <p style={{ fontSize: '12px', fontWeight: 600, color: '#1a237e', margin: 0 }}>Principal's Signature</p>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// INDIVIDUAL STUDENT REPORT CARD (matches reference image 1)
// ════════════════════════════════════════════════════════════════════════════════
export function IndividualReportCard({
  student, examName, session, subjects, maxMarksPerSubject, passingPercent,
  allStudentTotals = [], teacherRemark, printId
}: IndividualReportCardProps) {
  const validSubjects = subjects.filter(sub => {
    const v = student.marks[sub];
    return v !== undefined && v !== null && String(v) !== '' && (v as any) !== 'N/A' && Number(v) !== 0;
  });
  let totalObtained = 0;
  validSubjects.forEach(sub => { totalObtained += Number(student.marks[sub]) || 0; });
  const totalMax = validSubjects.length * maxMarksPerSubject;
  const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
  const passingMarks = Math.round(maxMarksPerSubject * passingPercent / 100);
  const isPass = percentage >= passingPercent;

  // Rank
  let rank = '—';
  if (allStudentTotals.length > 0 && totalObtained > 0) {
    // If allStudentTotals passed are percentages, sort by percentage
    const sorted = [...allStudentTotals].sort((a, b) => b - a);
    rank = String(sorted.indexOf(percentage) + 1);
  }

  const remark = teacherRemark || getTeacherRemark(percentage);

  return (
      <div
      id={printId || 'individual-report-card'}
      style={{
        fontFamily: "'Poppins', sans-serif",
        background: '#fff',
        border: '2px solid #d4af37', // Golden outer border
        outline: '4px solid #1a237e', // Blue inner border
        outlineOffset: '-8px',
        padding: '20px 25px',
        maxWidth: '750px',
        margin: '0 auto',
        color: '#1a237e',
        position: 'relative'
      }}
    >
      <ReportHeader session={session} subtitle={`Examination: ${examName}`} />

      {/* STUDENT RESULT REPORT CARD TITLE */}
      <div style={{ textAlign: 'center', margin: '15px 0' }}>
        <div style={{ 
          display: 'inline-block', backgroundColor: '#1565c0', color: '#fff', 
          padding: '6px 30px', fontSize: '16px', fontWeight: 'bold', letterSpacing: '1px',
          borderLeft: '4px solid #d4af37', borderRight: '4px solid #d4af37',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          STUDENT RESULT REPORT CARD
        </div>
      </div>

      {/* Student Details Grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        border: '1px solid #d4af37', borderRadius: '4px',
        padding: '10px 15px', margin: '15px 0',
        fontSize: '13px', fontWeight: 'bold', color: '#1a237e'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex' }}><span style={{ minWidth: '120px' }}>Student Name</span><span>: <span style={{ color: '#333' }}>{student.name}</span></span></div>
          <div style={{ display: 'flex' }}><span style={{ minWidth: '120px' }}>Father's Name</span><span>: <span style={{ color: '#333' }}>{student.fatherName || '—'}</span></span></div>
          <div style={{ display: 'flex' }}><span style={{ minWidth: '120px' }}>Class & Section</span><span>: <span style={{ color: '#333' }}>{formatClassSection(student.className, student.section)}</span></span></div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '1px solid #d4af37', paddingLeft: '25px' }}>
          <div style={{ display: 'flex' }}><span style={{ minWidth: '120px' }}>Roll No.</span><span>: <span style={{ color: '#333' }}>{student.rollNumber || 'N/A'}</span></span></div>
          <div style={{ display: 'flex' }}><span style={{ minWidth: '120px' }}>Class Teacher</span><span>: <span style={{ color: '#333' }}>—</span></span></div>
          <div style={{ display: 'flex' }}><span style={{ minWidth: '120px' }}>Date of Birth</span><span>: <span style={{ color: '#333' }}>15-06-2010</span></span></div>
        </div>
      </div>

      {/* Marks Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '15px', border: '1px solid #64b5f6', position: 'relative' }}>
        <img
          src="/school-seal.png"
          alt=""
          style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '250px', height: '250px', opacity: 0.05,
            pointerEvents: 'none', zIndex: 0
          }}
        />
        <thead style={{ position: 'relative', zIndex: 1 }}>
          <tr style={{ backgroundColor: '#1565c0', color: '#fff' }}>
            <th style={{ border: '1px solid #64b5f6', padding: '8px', textAlign: 'center', width: '50px' }}>S. No.</th>
            <th style={{ border: '1px solid #64b5f6', padding: '8px', textAlign: 'center' }}>Subject</th>
            <th style={{ border: '1px solid #64b5f6', padding: '8px', textAlign: 'center', width: '120px' }}>Maximum Marks</th>
            <th style={{ border: '1px solid #64b5f6', padding: '8px', textAlign: 'center', width: '120px' }}>Marks Obtained</th>
            <th style={{ border: '1px solid #64b5f6', padding: '8px', textAlign: 'center', width: '80px' }}>Grade</th>
          </tr>
        </thead>
        <tbody style={{ position: 'relative', zIndex: 1, color: '#1a237e' }}>
          {validSubjects.map((sub, i) => {
            const mark = Number(student.marks[sub]) || 0;
            return (
              <tr key={sub} style={{ backgroundColor: '#fff' }}>
                <td style={{ border: '1px solid #b3e5fc', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>{i + 1}.</td>
                <td style={{ border: '1px solid #b3e5fc', padding: '8px', fontWeight: 'bold', paddingLeft: '20px' }}>{sub}</td>
                <td style={{ border: '1px solid #b3e5fc', padding: '8px', textAlign: 'center' }}>{maxMarksPerSubject}</td>
                <td style={{ border: '1px solid #b3e5fc', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>{mark}</td>
                <td style={{ border: '1px solid #b3e5fc', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>{getGrade(mark, maxMarksPerSubject)}</td>
              </tr>
            );
          })}
          {validSubjects.length === 0 && (
            <tr>
              <td colSpan={5} style={{ padding: '15px', textAlign: 'center', color: '#999' }}>No marks recorded.</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Summary Row */}
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '30px',
        border: '1px solid #d4af37', borderRadius: '4px',
        padding: '12px 20px', margin: '15px 0', fontSize: '14px', fontWeight: 'bold'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#333', marginBottom: '4px' }}>Total Marks</div>
          <div style={{ fontSize: '18px', color: '#1a237e' }}>{totalObtained} / {totalMax}</div>
        </div>
        <div style={{ height: '35px', borderLeft: '1px solid #d4af37' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#333', marginBottom: '4px' }}>Percentage</div>
          <div style={{ fontSize: '18px', color: '#1a237e' }}>{percentage.toFixed(2)} %</div>
        </div>
        <div style={{ height: '35px', borderLeft: '1px solid #d4af37' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#333', marginBottom: '4px' }}>Rank</div>
          <div style={{ fontSize: '18px', color: '#1a237e' }}>{rank} {allStudentTotals.length > 0 && `/ ${allStudentTotals.length}`}</div>
        </div>
        <div style={{ height: '35px', borderLeft: '1px solid #d4af37' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#333', marginBottom: '4px' }}>Result</div>
          <div style={{ backgroundColor: '#1565c0', color: '#fff', padding: '4px 15px', borderRadius: '4px', display: 'inline-block', fontSize: '16px' }}>
            {isPass ? 'PASS' : 'FAIL'}
          </div>
        </div>
      </div>

      {/* Remarks */}
      <div style={{ display: 'flex', border: '1px solid #90caf9', backgroundColor: '#e3f2fd', borderRadius: '4px', overflow: 'hidden', marginTop: '15px' }}>
        <div style={{ backgroundColor: '#1565c0', color: '#fff', padding: '8px 15px', fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap' }}>
          Remarks:
        </div>
        <div style={{ padding: '8px 15px', fontSize: '14px', color: '#333', display: 'flex', alignItems: 'center' }}>
          {remark}
        </div>
      </div>

      <ReportFooter showSeal />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// CLASS REPORT (matches reference image 2)
// ════════════════════════════════════════════════════════════════════════════════
export function ClassReportCard({
  students, examName, session, className, section, subjects, maxMarksPerSubject, printId
}: ClassReportProps) {
  const totalMaxMarks = subjects.length * maxMarksPerSubject;

  // Compute totals for ranking
  const studentsWithTotals = students.map(st => {
    let total = 0;
    let validSubsCount = 0;
    subjects.forEach(sub => {
      const v = st.marks[sub];
      if (v !== undefined && v !== null && String(v) !== '' && (v as any) !== 'N/A' && Number(v) !== 0) {
        total += Number(v);
        validSubsCount++;
      }
    });
    const totalMaxMarksLocal = validSubsCount * maxMarksPerSubject;
    const pct = totalMaxMarksLocal > 0 ? (total / totalMaxMarksLocal) * 100 : 0;
    return { ...st, total, percentage: pct, validSubsCount };
  });

  const sorted = [...studentsWithTotals].sort((a, b) => b.percentage - a.percentage);

  // Summary stats
  let highestStudent = sorted[0]?.name || '—';
  let highestMarks = sorted[0]?.total || 0;
  let lowestStudent = sorted[sorted.length - 1]?.name || '—';
  let lowestMarks = sorted[sorted.length - 1]?.total || 0;
  const avgPct = studentsWithTotals.length > 0
    ? (studentsWithTotals.reduce((s, st) => s + st.percentage, 0) / studentsWithTotals.length).toFixed(1)
    : '0.0';

  return (
    <div
      id={printId || 'class-report-card'}
      style={{
        fontFamily: "'Poppins', sans-serif",
        background: '#fff',
        border: '3px solid #1a237e',
        padding: '24px 28px',
        color: '#1a237e',
        position: 'relative'
      }}
    >
      <ReportHeader session={session} subtitle={`Examination: ${examName}`} />
      
      <div style={{ textAlign: 'center', margin: '15px 0', fontSize: '18px', fontWeight: 'bold', color: '#1a237e' }}>
        CLASS RESULT SHEET — {formatClassSection(className, section)}
      </div>

      {/* Marks Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', margin: '14px 0 8px' }}>
        <thead style={{ display: 'table-header-group' }}>
          <tr style={{ backgroundColor: '#1a237e', color: '#fff' }}>
            <th style={{ border: '1px solid #333', padding: '7px', textAlign: 'center', width: '45px' }}>Sr.No.</th>
            <th style={{ border: '1px solid #333', padding: '7px', textAlign: 'left', minWidth: '120px' }}>Name</th>
            <th style={{ border: '1px solid #333', padding: '7px', textAlign: 'left', minWidth: '100px' }}>Father's Name</th>
            {subjects.map(sub => (
              <th key={sub} style={{ border: '1px solid #333', padding: '7px', textAlign: 'center', minWidth: '50px' }}>{sub.substring(0, 4)}</th>
            ))}
            <th style={{ border: '1px solid #333', padding: '7px', textAlign: 'center', width: '60px', backgroundColor: '#283593' }}>Total</th>
            <th style={{ border: '1px solid #333', padding: '7px', textAlign: 'center', width: '55px', backgroundColor: '#283593' }}>%</th>
          </tr>
        </thead>
        <tbody>
          {studentsWithTotals.map((st, i) => (
            <tr key={st.id} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#f8f8ff' }}>
              <td style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'center', fontWeight: 600 }}>{i + 1}</td>
              <td style={{ border: '1px solid #ccc', padding: '5px', fontWeight: 700 }}>{st.name}</td>
              <td style={{ border: '1px solid #ccc', padding: '5px' }}>{st.fatherName || '—'}</td>
              {subjects.map(sub => {
                const m = st.marks[sub];
                const isValid = m !== undefined && m !== null && (m as any) !== '' && (m as any) !== 'N/A' && Number(m) !== 0;
                return (
                  <td key={sub} style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'center', fontWeight: 600, color: isValid && m < Math.round(maxMarksPerSubject * 0.33) ? '#c62828' : '#1a237e' }}>
                    {isValid ? m : '—'}
                  </td>
                );
              })}
              <td style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'center', fontWeight: 800, color: '#1a237e' }}>{st.total}</td>
              <td style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'center', fontWeight: 700 }}>{st.percentage.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary & Footer */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '16px', marginTop: '16px' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr>
              <th colSpan={2} style={{ border: '1px solid #1a237e', padding: '6px', textAlign: 'left', fontWeight: 700, backgroundColor: '#e8eaf6' }}>Class Summary</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #ccc', padding: '5px', fontWeight: 600 }}>Total Students</td>
              <td style={{ border: '1px solid #ccc', padding: '5px' }}>: {students.length}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #ccc', padding: '5px', fontWeight: 600 }}>Highest Marks</td>
              <td style={{ border: '1px solid #ccc', padding: '5px' }}>: {highestMarks} ({highestStudent})</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #ccc', padding: '5px', fontWeight: 600 }}>Lowest Marks</td>
              <td style={{ border: '1px solid #ccc', padding: '5px' }}>: {lowestMarks} ({lowestStudent})</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #ccc', padding: '5px', fontWeight: 600 }}>Class Average</td>
              <td style={{ border: '1px solid #ccc', padding: '5px' }}>: {avgPct}%</td>
            </tr>
          </tbody>
        </table>
        <div />
      </div>

      <ReportFooter showSeal />
    </div>
  );
}
