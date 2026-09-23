import React, { useState, useEffect } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { Users, LayoutGrid, Wand2, ArrowLeft, Save, AlertTriangle, Info, MapPin } from 'lucide-react';
import { useSuccess } from '../../context/SuccessContext';
import { User } from '../../types';

interface SeatingPlanDesignerProps {
  classId: string;
  sectionId: string;
  className: string;
  sectionName: string;
  students: User[];
  onClose: () => void;
}

export function SeatingPlanDesigner({ classId, sectionId, className, sectionName, students, onClose }: SeatingPlanDesignerProps) {
  const { triggerSuccess, triggerError } = useSuccess();
  
  // Settings
  const [rows, setRows] = useState(6);
  const [cols, setCols] = useState(6);
  
  // State
  // grid represents [rowIndex][colIndex] = studentId | null
  const [grid, setGrid] = useState<(string | null)[][]>([]);
  const [unassigned, setUnassigned] = useState<User[]>([]);
  
  const [isProcessing, setIsProcessing] = useState(false);
  
  useEffect(() => {
    // Try to load existing plan
    const allPlans = JSON.parse(localStorage.getItem('ajps_seating_plans') || '{}');
    const existing = allPlans[`${classId}_${sectionId}`];
    
    if (existing && existing.rows === rows && existing.cols === cols) {
      setGrid(existing.grid);
      
      const assignedIds = new Set<string>();
      existing.grid.forEach((r: (string | null)[]) => r.forEach(c => {
        if (c) assignedIds.add(c);
      }));
      setUnassigned(students.filter(s => !assignedIds.has(s.id)));
    } else {
      // Initialize empty grid
      const newGrid = Array(rows).fill(null).map(() => Array(cols).fill(null));
      setGrid(newGrid);
      setUnassigned([...students]);
    }
  }, [classId, sectionId, rows, cols, students]);

  const handleSave = () => {
    const allPlans = JSON.parse(localStorage.getItem('ajps_seating_plans') || '{}');
    allPlans[`${classId}_${sectionId}`] = { rows, cols, grid };
    localStorage.setItem('ajps_seating_plans', JSON.stringify(allPlans));
    triggerSuccess('Seating Plan Saved');
    onClose();
  };

  const handleAutoArrange = async () => {
    setIsProcessing(true);
    
    // Using Gemini API for AI auto-arrangement
    // Normally we'd call the API here. Since we don't have the API key in this component,
    // we'll simulate the AI logic using a heuristic that scatters boys and girls
    // or calls a mock API.
    
    try {
      // Construct prompt for Gemini
      const prompt = `
        You are an expert teacher. Arrange these students into a ${rows}x${cols} grid.
        Rules: Mix boys and girls (don't group all boys or girls together).
        Students: ${JSON.stringify(students.map(s => ({ id: s.id, name: s.name, gender: s.gender || 'Unknown' })))}
        Return ONLY a JSON 2D array of student IDs (strings) or nulls. 
        Example: [["id1", "id2", null], [null, "id3", "id4"]]
      `;
      
      const geminiKey = localStorage.getItem('ajps_gemini_api_key');
      if (!geminiKey) {
        throw new Error("Gemini API key not configured in Settings.");
      }
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
          }
        })
      });

      if (!response.ok) {
         throw new Error("API call failed");
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (generatedText) {
        let cleanText = generatedText.replace(/```json/g, '').replace(/```/g, '').trim();
        const newGrid = JSON.parse(cleanText);
        setGrid(newGrid);
        
        const assignedIds = new Set<string>();
        newGrid.forEach((r: (string | null)[]) => r.forEach((c: string | null) => {
          if (c) assignedIds.add(c);
        }));
        setUnassigned(students.filter(s => !assignedIds.has(s.id)));
        triggerSuccess('AI generated optimal seating plan!');
      } else {
        throw new Error("Invalid response");
      }

    } catch (err: any) {
      console.error(err);
      triggerError(err.message || 'AI Auto-Map failed. Try manually mapping.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Drag and Drop State
  const [draggedStudent, setDraggedStudent] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, studentId: string) => {
    setDraggedStudent(studentId);
    e.dataTransfer.setData('text/plain', studentId);
  };

  const handleDrop = (e: React.DragEvent, rIndex: number, cIndex: number) => {
    e.preventDefault();
    if (!draggedStudent) return;

    const newGrid = [...grid.map(row => [...row])];
    
    // Find where the dragged student currently is
    let oldR = -1;
    let oldC = -1;
    newGrid.forEach((r, i) => r.forEach((c, j) => {
      if (c === draggedStudent) {
        oldR = i;
        oldC = j;
      }
    }));

    // Handle swap if target cell is occupied
    const targetStudent = newGrid[rIndex][cIndex];

    if (oldR !== -1 && oldC !== -1) {
      // Swapping within grid
      newGrid[oldR][oldC] = targetStudent;
      newGrid[rIndex][cIndex] = draggedStudent;
    } else {
      // Coming from unassigned list
      if (targetStudent) {
        setUnassigned(prev => [...prev, students.find(s => s.id === targetStudent)!]);
      }
      newGrid[rIndex][cIndex] = draggedStudent;
      setUnassigned(prev => prev.filter(s => s.id !== draggedStudent));
    }

    setGrid(newGrid);
    setDraggedStudent(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const removeStudentFromGrid = (rIndex: number, cIndex: number) => {
    const studentId = grid[rIndex][cIndex];
    if (!studentId) return;

    const newGrid = [...grid.map(row => [...row])];
    newGrid[rIndex][cIndex] = null;
    setGrid(newGrid);
    
    setUnassigned(prev => [...prev, students.find(s => s.id === studentId)!]);
  };

  return (
    <div className="fixed inset-0 bg-[#FAF7F2] z-50 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
      <header className="sticky top-0 z-10 flex items-center justify-between px-4 md:px-8 py-4 bg-white/90 backdrop-blur-lg shadow-sm border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 border border-gray-200 text-gray-500 hover:bg-gray-100 transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#1F2937]">Seating Plan Designer</h1>
            <p className="text-sm font-semibold text-gray-500">{className} — Section {sectionName}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleAutoArrange}
            disabled={isProcessing}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Wand2 className="w-4 h-4" /> 
            {isProcessing ? 'AI Generating...' : 'AI Auto-Map'}
          </button>
          <button 
            onClick={handleSave}
            className="bg-[#A05C2B] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-[#8B4E24] transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Save Plan
          </button>
        </div>
      </header>

      <div className="p-4 md:p-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Sidebar - Settings & Unassigned */}
        <div className="lg:col-span-1 space-y-6">
          <GlassCard className="p-5 bg-white shadow-sm border-gray-100">
            <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
              <LayoutGrid className="w-5 h-5 text-[#A05C2B]" /> Grid Settings
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Rows</label>
                <input 
                  type="number" min="1" max="15" 
                  value={rows} onChange={e => setRows(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded p-2 text-sm focus:outline-none focus:border-[#A05C2B]" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Columns</label>
                <input 
                  type="number" min="1" max="15" 
                  value={cols} onChange={e => setCols(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded p-2 text-sm focus:outline-none focus:border-[#A05C2B]" 
                />
              </div>
            </div>
            {unassigned.length > 0 && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs font-semibold text-amber-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                You have {unassigned.length} unassigned students.
              </div>
            )}
          </GlassCard>

          <GlassCard className="p-0 overflow-hidden bg-white shadow-sm border-gray-100 flex flex-col h-[600px]">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-500" /> Unassigned Students
              </h3>
            </div>
            <div className="p-2 overflow-y-auto flex-1 space-y-2">
              {unassigned.map(s => (
                <div 
                  key={s.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, s.id)}
                  className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm cursor-grab active:cursor-grabbing hover:border-[#A05C2B]/50 transition-colors flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                    {s.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800 truncate">{s.name}</p>
                    <p className="text-[10px] font-semibold text-gray-500">Roll: {s.rollNumber || 'N/A'}</p>
                  </div>
                </div>
              ))}
              {unassigned.length === 0 && (
                <div className="text-center p-8 text-gray-400 text-sm font-medium">
                  All students assigned.
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Right Area - Classroom Grid */}
        <div className="lg:col-span-3">
          <GlassCard className="p-8 bg-white shadow-sm border-gray-100 min-h-[700px] flex flex-col">
            <div className="w-full bg-gray-100 border border-gray-200 rounded-lg p-3 text-center mb-12 shadow-inner relative">
              <p className="font-black text-gray-400 uppercase tracking-[0.2em] text-sm">Teacher's Desk / Whiteboard</p>
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 border-b border-r border-gray-200 bg-gray-100" />
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div 
                className="grid gap-3 p-4" 
                style={{ 
                  gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` 
                }}
              >
                {grid.map((row, rIndex) => 
                  row.map((studentId, cIndex) => {
                    const student = studentId ? students.find(s => s.id === studentId) : null;
                    
                    return (
                      <div 
                        key={`${rIndex}-${cIndex}`}
                        onDrop={(e) => handleDrop(e, rIndex, cIndex)}
                        onDragOver={handleDragOver}
                        onClick={() => removeStudentFromGrid(rIndex, cIndex)}
                        className={`
                          relative w-[100px] h-[100px] md:w-[120px] md:h-[120px] rounded-xl border-2 flex flex-col items-center justify-center p-2 text-center transition-all cursor-pointer group
                          ${student 
                            ? 'bg-[#FDF7EE] border-[#A05C2B]/30 shadow-sm hover:border-[#A05C2B]' 
                            : 'bg-gray-50 border-dashed border-gray-300 hover:border-[#A05C2B]/50 hover:bg-white'}
                        `}
                      >
                        <span className="absolute top-1.5 left-2 text-[9px] font-bold text-gray-400">
                          {String.fromCharCode(65 + rIndex)}{cIndex + 1}
                        </span>
                        
                        {student ? (
                          <>
                            <div className="w-10 h-10 rounded-full bg-white border border-[#A05C2B]/20 mb-2 overflow-hidden flex items-center justify-center text-[#A05C2B] font-bold">
                              {student.avatarUrl ? (
                                <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" />
                              ) : (
                                student.name.charAt(0)
                              )}
                            </div>
                            <p className="text-[11px] font-bold text-gray-800 leading-tight line-clamp-2">{student.name}</p>
                            
                            <div className="absolute inset-0 bg-black/60 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <span className="text-white text-xs font-bold">Remove</span>
                            </div>
                          </>
                        ) : (
                          <div className="text-gray-300 flex flex-col items-center gap-1">
                            <MapPin className="w-5 h-5 opacity-50" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Empty</span>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
            
            <div className="mt-8 flex items-start gap-2 bg-blue-50 text-blue-800 p-3 rounded-lg text-xs font-medium">
              <Info className="w-4 h-4 shrink-0" />
              <p>Drag and drop students from the unassigned list to place them. Drag an assigned student to another seat to swap. Click on an assigned seat to remove the student.</p>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
