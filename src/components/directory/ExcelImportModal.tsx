import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, UserPlus, Settings2, Image as ImageIcon, AlertTriangle } from 'lucide-react';
import { User } from '../../types';
import { scanDocumentWithSahayak, markDuplicates } from '../../utils/sahayakScanner';
import { recalculateClassRollNumbers } from '../../utils/rollNumberEngine';
import { SchoolClass, Section } from '../../pages/classes/AdminClassManager';
import { useSuccess } from '../../context/SuccessContext';

interface ExcelImportModalProps {
  onClose: () => void;
  onImportComplete: (count: number) => void;
}

export function ExcelImportModal({ onClose, onImportComplete }: ExcelImportModalProps) {
  const { triggerSuccess, triggerError } = useSuccess();
  const [activeTab, setActiveTab] = useState<'Manual' | 'Scanner'>('Manual');
  
  // Manual Tab States
  const [phoneInput, setPhoneInput] = useState('');
  const [guardianPhoneInput, setGuardianPhoneInput] = useState('');

  const globalClasses: SchoolClass[] = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('ajps_classes') || '[]'); } catch { return []; }
  }, []);
  const [manualClassId, setManualClassId] = useState('');
  const manualSections = useMemo(() => globalClasses.find(c => c.id === manualClassId)?.sections || [], [manualClassId, globalClasses]);

  // Scanner Tab States
  const [file, setFile] = useState<File | null>(null);
  const [scannedData, setScannedData] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [step, setStep] = useState<'upload' | 'review'>('upload');
  const [error, setError] = useState<string | null>(null);
  const [rollStrategy, setRollStrategy] = useState<'alphabetical' | 'append'>('alphabetical');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhoneInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Tab' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
      e.preventDefault();
    }
  };

  const handleManualSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    
    try {
      const storedUsers: User[] = JSON.parse(localStorage.getItem('ajps_users') || '[]');
      const maxId = storedUsers.reduce((max, u) => Math.max(max, parseInt(u.id.replace(/\D/g, '') || '0')), 1000) + 1;

      const cls = globalClasses.find(c => c.id === manualClassId);
      const secId = fd.get('sectionId') as string;
      const sec = cls?.sections.find(s => s.id === secId);

      const newUser: User = {
        id: `USR${maxId}`,
        name: fd.get('name') as string,
        role: 'Student',
        avatarUrl: `https://api.dicebear.com/7.x/notionists/svg?seed=USR${maxId}`,
        className: cls?.className || '',
        classId: cls?.id || '',
        section: sec?.name || '',
        sectionName: sec?.name || '',
        sectionId: sec?.id || '',
        rollNumber: '', // Will be assigned by the roll number engine below
        transportMode: 'Self',
        personalDetails: {
          dob: fd.get('dob') as string,
          gender: fd.get('gender') as string,
          bloodGroup: '',
          religion: '',
          phone: fd.get('phone') as string,
          email: '',
          address: ''
        },
        guardianDetails: {
          guardianName: fd.get('guardianName') as string,
          guardianRelation: fd.get('guardianRelation') as string,
          guardianPhone: fd.get('guardianPhone') as string
        }
      };

      const withNewStudent = [...storedUsers, newUser];
      // Recalculate roll numbers for this class globally (using default strategy 'alphabetical' for manual adds unless we want it global, let's just use alphabetical as default)
      const recalculated = recalculateClassRollNumbers(withNewStudent, newUser.classId, 'alphabetical');
      localStorage.setItem('ajps_users', JSON.stringify(recalculated));
      window.dispatchEvent(new Event('ajps_users_updated'));
      onImportComplete(1);
    } catch (err) {
      console.error(err);
      triggerError("Failed to add student manually.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setError(null);
    setIsScanning(true);
    setStep('review');

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const base64Data = evt.target?.result as string;
      if (!base64Data) {
        setError("Failed to read file.");
        setIsScanning(false);
        setStep('upload');
        return;
      }
      
      try {
        const data = await scanDocumentWithSahayak(base64Data, uploadedFile.type);
        const storedUsers = JSON.parse(localStorage.getItem('ajps_users') || '[]');
        const withDuplicates = markDuplicates(data, storedUsers);
        setScannedData(withDuplicates);
      } catch (err: any) {
        setError(err.message || "Failed to scan document.");
        setStep('upload');
      } finally {
        setIsScanning(false);
      }
    };
    reader.onerror = () => {
       setError("Failed to read file.");
       setIsScanning(false);
       setStep('upload');
    };
    reader.readAsDataURL(uploadedFile);
  };

  const executeFinalImport = () => {
    try {
      const storedUsers: User[] = JSON.parse(localStorage.getItem('ajps_users') || '[]');
      let maxId = storedUsers.reduce((max, u) => Math.max(max, parseInt(u.id.replace(/\D/g, '') || '0')), 1000);

      const newStudents: User[] = [];
      let updatedUsers = [...storedUsers];

      scannedData.forEach((row: any) => {
        if (row.isDuplicate && row.action === 'Update Existing' && row.matchedUserId) {
          // Update existing user
          updatedUsers = updatedUsers.map(u => {
            if (u.id === row.matchedUserId) {
              return {
                ...u,
                guardianDetails: {
                  ...u.guardianDetails,
                  guardianName: row.guardian_name || u.guardianDetails?.guardianName || ''
                }
                // Add any other fields to update
              };
            }
            return u;
          });
        } else {
          // Add as new
          maxId++;
          
          let parsedClass = row.academic_grade || 'Unknown';
          let parsedSec = row.academic_section || 'A';
          let classObj = globalClasses.find(c => c.className === parsedClass || c.id === `cls-${parsedClass}`);
          let secObj = classObj?.sections.find(s => s.name === parsedSec || s.id === `sec-${parsedSec}`);

          newStudents.push({
            id: `USR${maxId}`,
            name: row.student_name || 'Unknown Student',
            role: 'Student',
            avatarUrl: `https://api.dicebear.com/7.x/notionists/svg?seed=USR${maxId}`,
            className: classObj ? classObj.className : parsedClass,
            classId: classObj ? classObj.id : `cls-${parsedClass}`,
            section: secObj ? secObj.name : parsedSec,
            sectionName: secObj ? secObj.name : parsedSec,
            sectionId: secObj ? secObj.id : `sec-${parsedSec}`,
            rollNumber: '', // Will be assigned by the roll number engine below
            transportMode: 'Self',
            personalDetails: { dob: '', gender: '', bloodGroup: '', religion: '', phone: row.phone_number || '', email: '', address: '' },
            guardianDetails: { guardianName: row.guardian_name || '', guardianRelation: 'Parent', guardianPhone: '' }
          });
        }
      });

      let combined = [...updatedUsers, ...newStudents];

      // Recalculate roll numbers for every unique class that was affected
      const affectedClasses = Array.from(
        new Set(newStudents.map(s => s.classId))
      );
      for (const clsId of affectedClasses) {
        combined = recalculateClassRollNumbers(combined, clsId, rollStrategy);
      }

      localStorage.setItem('ajps_users', JSON.stringify(combined));
      window.dispatchEvent(new Event('ajps_users_updated'));
      onImportComplete(newStudents.length);
      
    } catch (err) {
      setError('Failed to save students. Database error.');
    }
  };

  const handleFinalizeImport = () => {
    if (scannedData.length === 0) return;

    // STRICT SECTION VALIDATION (THE BLOCKER)
    // Filter down to new records
    const newRecords = scannedData.filter(row => !row.isDuplicate || row.action === 'Add as New');
    
    if (newRecords.length > 0) {
      const incomingGrade = newRecords[0]?.academic_grade;
      const incomingSections = [...new Set(newRecords.map(s => s.academic_section))];
      
      let existingClass = globalClasses.find(c => c.id === incomingGrade || c.id === `cls-${incomingGrade}` || c.className === incomingGrade);

      if (!existingClass && incomingGrade) {
        if (window.confirm(`Class "${incomingGrade}" does not exist. Do you want to create it automatically?`)) {
          existingClass = {
            id: `cls-${incomingGrade}`,
            className: incomingGrade,
            sections: []
          };
          globalClasses.push(existingClass);
        } else {
          return;
        }
      }

      if (existingClass) {
        const existingSections = existingClass.sections.map(sec => sec.name || sec);
        const invalidSections = incomingSections.filter(sec => typeof sec === 'string' && !existingSections.includes(sec));

        if (invalidSections.length > 0) {
          if (window.confirm(`Section(s) ${invalidSections.join(', ')} do not exist in Class ${incomingGrade}. Create them automatically?`)) {
             invalidSections.forEach(sec => {
               existingClass!.sections.push({
                 id: `sec-${sec}`,
                 name: sec as string,
                 classTeacherId: ''
               });
             });
             localStorage.setItem('ajps_classes', JSON.stringify(globalClasses));
             window.dispatchEvent(new Event('ajps_classes_updated'));
          } else {
            return;
          }
        } else {
            // Save potential newly created class
            localStorage.setItem('ajps_classes', JSON.stringify(globalClasses));
            window.dispatchEvent(new Event('ajps_classes_updated'));
        }
      }
    }

    executeFinalImport();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white shrink-0">
          <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-[#A05C2B]" />
            Add Student
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 bg-gray-50 shrink-0">
          <button 
            onClick={() => setActiveTab('Manual')}
            className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === 'Manual' ? 'text-[#A05C2B] border-b-2 border-[#A05C2B] bg-white' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            Add Manually
          </button>
          <button 
            onClick={() => setActiveTab('Scanner')}
            className={`flex-1 py-4 text-sm font-bold transition-colors flex items-center justify-center gap-2 ${activeTab === 'Scanner' ? 'text-[#A05C2B] border-b-2 border-[#A05C2B] bg-white' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <ImageIcon className="w-4 h-4" /> Sahayak Scanner
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto">
          {activeTab === 'Manual' && (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                  <input name="name" placeholder="Student Name" className="w-full border p-3 rounded-lg focus:ring-[#A05C2B] outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Date of Birth</label>
                  <input name="dob" type="date" className="w-full border p-3 rounded-lg focus:ring-[#A05C2B] outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Gender</label>
                  <select name="gender" className="w-full border p-3 rounded-lg focus:ring-[#A05C2B] outline-none" required>
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Class</label>
                  <select 
                    name="classId" 
                    value={manualClassId}
                    onChange={(e) => setManualClassId(e.target.value)}
                    className="w-full border p-3 rounded-lg focus:ring-[#A05C2B] outline-none" 
                    required
                  >
                    <option value="">Select Class</option>
                    {globalClasses.map(c => <option key={c.id} value={c.id}>{c.className}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Section</label>
                  <select name="sectionId" className="w-full border p-3 rounded-lg focus:ring-[#A05C2B] outline-none" required disabled={!manualClassId}>
                    <option value="">Select Section</option>
                    {manualSections.map((s: Section) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Student Phone Number</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-lg font-bold">+91</span>
                    <input name="phone" maxLength={10} minLength={10} onKeyDown={handlePhoneInput} placeholder="10-digit number" className="border p-3 rounded-none rounded-r-lg w-full focus:ring-[#A05C2B] outline-none" />
                  </div>
                </div>
              </div>
              
              <h3 className="font-bold text-gray-800 pt-4 border-t mt-4">Guardian Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Guardian Name</label>
                  <input name="guardianName" placeholder="Name" className="w-full border p-3 rounded-lg focus:ring-[#A05C2B] outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Relation</label>
                  <select name="guardianRelation" className="w-full border p-3 rounded-lg focus:ring-[#A05C2B] outline-none" required>
                    <option value="">Select Relation</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Grandparent">Grandparent</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Guardian Phone Number</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-lg font-bold">+91</span>
                    <input name="guardianPhone" maxLength={10} minLength={10} onKeyDown={handlePhoneInput} placeholder="10-digit number" className="border p-3 rounded-none rounded-r-lg w-full focus:ring-[#A05C2B] outline-none" required />
                  </div>
                </div>
              </div>
              
              <div className="pt-4 flex justify-end gap-3 mt-4">
                <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2.5 rounded-xl font-bold bg-[#A05C2B] text-white hover:bg-[#8A4F25] transition-colors shadow-md">Add Student</button>
              </div>
            </form>
          )}

          {activeTab === 'Scanner' && (
            <div className="space-y-6">
              {step === 'upload' && (
                <>
                  <div className="bg-amber-50 border border-amber-100 text-amber-800 p-4 rounded-xl text-sm font-medium flex gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p>Sahayak Scanner allows you to seamlessly extract student records from any format.</p>
                  </div>

                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors border-gray-300 hover:border-[#A05C2B] bg-gray-50 group"
                  >
                    <input 
                      type="file" 
                      accept="image/*, .pdf, .csv, .xlsx, .doc, .docx" 
                      className="hidden" 
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                    />
                    <Upload className="w-12 h-12 text-gray-400 mb-3 mx-auto group-hover:text-[#A05C2B] transition-colors" />
                    <p className="font-bold text-gray-700 text-lg">Upload Excel, Word, PDF, or Photo of Register</p>
                    <p className="text-sm text-gray-500 mt-1">Sahayak will automatically read the contents</p>
                  </div>
                  {error && <p className="text-red-500 text-sm font-bold text-center">{error}</p>}
                </>
              )}

              {step === 'review' && isScanning && (
                <div className="py-16 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 border-4 border-[#FDF7EE] border-t-[#A05C2B] rounded-full animate-spin mb-6"></div>
                  <h3 className="text-xl font-black text-gray-800 mb-2">Sahayak Scanner is scanning your document...</h3>
                  <p className="text-gray-500 font-semibold">Please wait while the records are being extracted.</p>
                </div>
              )}

              {step === 'review' && !isScanning && scannedData.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><CheckCircle2 className="w-6 h-6" /></div>
                    <div>
                      <h3 className="font-black text-gray-800">Review Extracted Records</h3>
                      <p className="text-sm text-gray-500 font-semibold">Sahayak found {scannedData.length} records. {scannedData.some(r => r.isDuplicate) && <span className="text-amber-600">Duplicates found!</span>} Verify them before saving.</p>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-xl overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-max">
                      <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
                        <tr>
                          <th className="p-3 font-bold">Status</th>
                          <th className="p-3 font-bold">Action</th>
                          <th className="p-3 font-bold">Student Name</th>
                          <th className="p-3 font-bold">Guardian Name</th>
                          <th className="p-3 font-bold">Phone</th>
                          <th className="p-3 font-bold">Class</th>
                          <th className="p-3 font-bold">Section</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {scannedData.map((row, idx) => (
                          <tr key={idx} className={`hover:bg-gray-50 ${row.isDuplicate ? 'bg-amber-50' : ''}`}>
                            <td className="p-3 font-semibold">
                              {row.isDuplicate ? (
                                <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-100 px-2 py-1 rounded-md text-xs">
                                  <AlertTriangle className="w-3 h-3" /> Duplicate
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100 px-2 py-1 rounded-md text-xs">
                                  <CheckCircle2 className="w-3 h-3" /> New
                                </span>
                              )}
                            </td>
                            <td className="p-3">
                              {row.isDuplicate ? (
                                <select 
                                  value={row.action}
                                  onChange={(e) => {
                                    const newData = [...scannedData];
                                    newData[idx].action = e.target.value;
                                    setScannedData(newData);
                                  }}
                                  className="border border-amber-300 bg-white rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                                >
                                  <option value="Update Existing">Update Existing</option>
                                  <option value="Add as New">Add as New</option>
                                </select>
                              ) : (
                                <span className="text-gray-400 text-xs">Add</span>
                              )}
                            </td>
                            <td className="p-3 font-semibold text-gray-800">{row.student_name || '-'}</td>
                            <td className="p-3 text-gray-600">{row.guardian_name || '-'}</td>
                            <td className="p-3 font-medium text-gray-800">{row.phone_number || '-'}</td>
                            <td className="p-3 font-bold text-emerald-600">{row.academic_grade || '-'}</td>
                            <td className="p-3 font-bold text-emerald-600">{row.academic_section || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="pt-4 flex flex-col md:flex-row justify-between items-center gap-4 mt-4 border-t border-gray-100">
                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <label className="text-sm font-bold text-gray-700 whitespace-nowrap">Roll Number Strategy:</label>
                      <select 
                        value={rollStrategy}
                        onChange={(e) => setRollStrategy(e.target.value as 'alphabetical' | 'append')}
                        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-[#A05C2B] bg-white w-full md:w-auto"
                      >
                        <option value="alphabetical">Alphabetical (Reshuffle All)</option>
                        <option value="append">Append (Keep Existing)</option>
                      </select>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto justify-end">
                      <button onClick={() => { setStep('upload'); setFile(null); }} className="px-6 py-2.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">Discard</button>
                      <button onClick={handleFinalizeImport} className="px-6 py-2.5 rounded-xl font-bold bg-[#A05C2B] text-white hover:bg-[#8A4F25] transition-colors shadow-md">Save Students</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
