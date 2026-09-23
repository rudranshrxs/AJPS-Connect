const fs = require('fs');
let code = fs.readFileSync('src/pages/exams/StudentExam.tsx', 'utf8');

const filterReplacement = `
                    {!(exam.syllabus?.some((s: any) => s.classId === currentUser?.classId || s.className === currentUser?.className)) ? (
                      <p className="text-xs text-gray-500 italic bg-gray-50 p-3 rounded-lg border border-gray-100">Syllabus not released yet.</p>
                    ) : (
                      <div className="bg-white border border-gray-100 p-3 rounded-lg shadow-sm space-y-3">
                        {(exam.syllabus || []).filter((s: any) => s.classId === currentUser?.classId || s.className === currentUser?.className).map((entry: any, i: number) => {
                          const tags = entry.tags || [];
                          return (
                            <div key={i}>
                              <p className="text-xs font-bold text-gray-700 mb-1">{entry.subject}</p>
                              {tags.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {tags.map((tag: string) => (
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
`;

code = code.replace(/\{\!\(exam\.syllabus\?\.some\(\(s: any\) => s\.classId === studentClass \|\| s\.classId === currentUser\?\.classId\)\) \? \([\s\S]*?<\/div>\s*\)\}\s*<\/div>\s*\)\}/, filterReplacement.trim());

fs.writeFileSync('src/pages/exams/StudentExam.tsx', code);
