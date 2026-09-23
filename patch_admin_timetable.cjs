const fs = require('fs');
let code = fs.readFileSync('src/pages/timetable/AdminTimetable.tsx', 'utf8');

// 1. Add isEditing state
code = code.replace(
  /const \[isProcessing, setIsProcessing\] = useState\(false\);/,
  `const [isProcessing, setIsProcessing] = useState(false);\n  const [isEditing, setIsEditing] = useState(false);`
);

// 2. Reset isEditing
code = code.replace(
  /setWarnings\(\{\}\);\n    \}/,
  `setWarnings({});\n      setIsEditing(false);\n    }`
);

// 3. Helper to get teacher name
const helpers = `
  const getTeacherName = (tId: string) => {
    const t = teachers.find(x => x.id === tId);
    return t ? t.name : 'Unassigned';
  };
`;
code = code.replace(/const checkConflict/, helpers + '\n  const checkConflict');

// 4. Update the buttons logic
const oldButtons = `<div className="ml-auto flex gap-3">
              <button 
                onClick={handleSave}
                disabled={!selectedClass || !selectedSection || currentTimetable.isLocked || isProcessing}
                className="bg-white/60 text-gray-800 px-6 py-2 rounded-lg font-bold hover:bg-white/80 disabled:opacity-50 transition-colors shadow-sm flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Save Draft
              </button>
              <button 
                onClick={handleLock}
                disabled={!selectedClass || !selectedSection || currentTimetable.isLocked || isProcessing}
                className="bg-[#A05C2B] text-white px-6 py-2 rounded-lg font-bold hover:bg-[#8B4E24] disabled:opacity-50 transition-colors shadow-sm flex items-center gap-2"
              >
                <Lock className="w-4 h-4" /> 
                {currentTimetable.isLocked ? 'Locked' : 'Lock & Publish'}
              </button>
            </div>`;

const newButtons = `<div className="ml-auto flex gap-3">
              {currentTimetable.isLocked && !isEditing ? (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="bg-[#1F2937] text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-800 transition-colors shadow-sm flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4" /> Unlock & Edit Timetable
                </button>
              ) : (
                <>
                  <button 
                    onClick={handleSave}
                    disabled={!selectedClass || !selectedSection || isProcessing}
                    className="bg-white/60 text-gray-800 px-6 py-2 rounded-lg font-bold hover:bg-white/80 disabled:opacity-50 transition-colors shadow-sm flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" /> Save Draft
                  </button>
                  <button 
                    onClick={() => {
                      handleLock();
                      setIsEditing(false);
                    }}
                    disabled={!selectedClass || !selectedSection || isProcessing}
                    className="bg-[#A05C2B] text-white px-6 py-2 rounded-lg font-bold hover:bg-[#8B4E24] disabled:opacity-50 transition-colors shadow-sm flex items-center gap-2"
                  >
                    <Lock className="w-4 h-4" /> 
                    {currentTimetable.isLocked ? 'Save & Lock Updates' : 'Lock & Publish'}
                  </button>
                </>
              )}
            </div>`;

code = code.replace(oldButtons, newButtons);
code = code.replace(/import { Lock, Save } from 'lucide-react';/, `import { Lock, Save, Edit3 } from 'lucide-react';`);

// 5. Update how the table cells are rendered
const oldCellRender = `return (
                          <td key={cellKey} className="p-3 align-top min-w-[160px]">
                            <select
                              value={tId}
                              onChange={e => handleAssign(day, period, e.target.value)}
                              disabled={currentTimetable.isLocked}
                              className={\`w-full text-xs p-2 rounded border focus:outline-none focus:ring-1 focus:ring-[#A05C2B] \${currentTimetable.isLocked ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed' : 'bg-white/60 border-gray-200'}\`}
                            >
                              <option value="">-- Select Teacher --</option>
                              {teachers.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                              ))}
                            </select>
                            {warnings[cellKey] && (
                              <p className="text-[10px] text-yellow-600 mt-1 font-bold leading-tight">
                                {warnings[cellKey]}
                              </p>
                            )}
                          </td>
                        );`;

const newCellRender = `return (
                          <td key={cellKey} className="p-3 align-top min-w-[160px]">
                            {currentTimetable.isLocked && !isEditing ? (
                              <div className="w-full text-xs p-2 rounded border border-transparent font-bold text-gray-700 bg-white/40">
                                {getTeacherName(tId)}
                              </div>
                            ) : (
                              <>
                                <select
                                  value={tId}
                                  onChange={e => handleAssign(day, period, e.target.value)}
                                  className="w-full text-xs p-2 rounded border focus:outline-none focus:ring-1 focus:ring-[#A05C2B] bg-white/60 border-gray-200"
                                >
                                  <option value="">-- Select Teacher --</option>
                                  {teachers.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                  ))}
                                </select>
                                {warnings[cellKey] && (
                                  <p className="text-[10px] text-yellow-600 mt-1 font-bold leading-tight">
                                    {warnings[cellKey]}
                                  </p>
                                )}
                              </>
                            )}
                          </td>
                        );`;
                        
code = code.replace(oldCellRender, newCellRender);

// 6. Update the 'Set for whole week' logic
const oldSetWholeWeek = `                        {currentTimetable.schedule.monday[period] && !currentTimetable.isLocked && (
                          <div className="mt-2">
                            <button 
                              onClick={() => copyToWholeWeek(period)}
                              className="text-[10px] bg-white border border-gray-300 px-2 py-1 rounded text-gray-600 hover:bg-gray-50"
                              title="Copy Monday's teacher to the whole week"
                            >
                              Set for whole week
                            </button>
                          </div>
                        )}`;

const newSetWholeWeek = `                        {currentTimetable.schedule.monday[period] && (!currentTimetable.isLocked || isEditing) && (
                          <div className="mt-2">
                            <button 
                              onClick={() => copyToWholeWeek(period)}
                              className="text-[10px] bg-white border border-gray-300 px-2 py-1 rounded text-gray-600 hover:bg-gray-50"
                              title="Copy Monday's teacher to the whole week"
                            >
                              Set for whole week
                            </button>
                          </div>
                        )}`;
code = code.replace(oldSetWholeWeek, newSetWholeWeek);

fs.writeFileSync('src/pages/timetable/AdminTimetable.tsx', code);
