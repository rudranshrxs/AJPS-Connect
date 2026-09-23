const fs = require('fs');

let file = fs.readFileSync('src/pages/exams/StudentExam.tsx', 'utf8');

const oldSyllabus = /\{\/\* Syllabus \*\/\}\n                  <div>\n                    <h4 className="text-sm font-bold text-\[#A05C2B\] uppercase tracking-wider mb-3 flex items-center gap-1\.5">\n                      <FileText className="w-4 h-4" \/> Syllabus\n                    <\/h4>\n                    \{\(exam\.datesheet \|\| \[\]\)\.length === 0 \? \([\s\S]*?\} \/\* Syllabus \*\//;

const oldSyllabusToReplaceRegex = /\{\/\* Syllabus \*\/\}[\s\S]*?\{\/\* Marks \& Result \*\/\}/;

const newSyllabusStr = `{/* Syllabus */}
                  <div>
                    <h4 className="text-sm font-bold text-[#A05C2B] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <FileText className="w-4 h-4" /> Syllabus
                    </h4>
                    {!(exam.syllabus || []).find((s: any) => s.classId === currentUser?.classId || s.classId === currentUser?.className) ? (
                      <p className="text-xs text-gray-500 italic bg-gray-50 p-3 rounded-lg border border-gray-100">Syllabus not released yet.</p>
                    ) : (
                      <div className="bg-white border border-gray-100 p-3 rounded-lg shadow-sm space-y-3">
                        {(exam.syllabus || []).filter((s: any) => s.classId === currentUser?.classId || s.classId === currentUser?.className).map((syllabusEntry: any, i: number) => (
                          <div key={i}>
                            <p className="text-xs font-bold text-gray-700 mb-1">{syllabusEntry.subject}</p>
                            {syllabusEntry.tags && syllabusEntry.tags.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {syllabusEntry.tags.map((tag: string, j: number) => (
                                  <span key={j} className="text-[10px] bg-[#FDF7EE] text-[#A05C2B] border border-[#A05C2B]/20 px-1.5 py-0.5 rounded font-semibold">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[10px] text-gray-400 italic">No topics specified.</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Marks & Result */}`;

file = file.replace(oldSyllabusToReplaceRegex, newSyllabusStr);

fs.writeFileSync('src/pages/exams/StudentExam.tsx', file);
