import React, { useState, useRef } from 'react';
import { X, Phone, MessageCircle, Upload, CheckCircle, Clock, ShieldAlert, Tag, Calendar, UserCheck } from 'lucide-react';
import { User } from '../../types';
import imageCompression from 'browser-image-compression';
import { useSuccess } from '../../context/SuccessContext';

interface TeacherProfileDrawerProps {
  teacher: User;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedTeacher: User) => void;
  allTeachers: User[]; // For proxy assignment
}

export function TeacherProfileDrawer({ teacher, isOpen, onClose, onUpdate, allTeachers }: TeacherProfileDrawerProps) {
  const { triggerSuccess, triggerError } = useSuccess();
  type TabType = 'Personal' | 'Timetable' | 'Attendance' | 'Documents';
  const [activeTab, setActiveTab] = useState<TabType>('Personal');
  const [newTag, setNewTag] = useState('');
  const [selectedProxy, setSelectedProxy] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddTag = () => {
    if (newTag.trim()) {
      const updatedTags = [...(teacher.extraResponsibilities || []), newTag.trim()];
      onUpdate({ ...teacher, extraResponsibilities: updatedTags });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = (teacher.extraResponsibilities || []).filter(t => t !== tagToRemove);
    onUpdate({ ...teacher, extraResponsibilities: updatedTags });
  };

  const handleAssignProxy = () => {
    if (selectedProxy) {
      // Find the proxy teacher
      const proxyTeacher = allTeachers.find(t => t.id === selectedProxy);
      if (proxyTeacher) {
        // Find the class that the current (absent) teacher teaches
        const settings = JSON.parse(localStorage.getItem('ajps_global_settings') || '{}');
        const periods = Array.from({ length: settings.totalPeriods || 6 }, (_, i) => `p${i + 1}`);
        const timetables = JSON.parse(localStorage.getItem('ajps_timetables') || '[]');
        const myClassTimetable = timetables.find((t: any) =>
          ['monday','tuesday','wednesday','thursday','friday','saturday'].some(day =>
            periods.some(period => t.schedule?.[day]?.[period] === teacher.id)
          )
        );

        if (teacher.assignedClass || teacher.isClassTeacher) {
          const classToProxy = teacher.assignedClass || `c${teacher.classTeacherClass}-s${teacher.classTeacherSection}`;
          proxyTeacher.proxyClassId = classToProxy;
          onUpdate(proxyTeacher); // This will update proxyTeacher in users
          onUpdate({ ...teacher, hasProxyAssigned: true }); // update current teacher
          triggerSuccess(`Proxy successfully assigned to ${proxyTeacher.name}`);
        } else {
          triggerError('This teacher has no class assigned to proxy.');
        }
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const options = {
        maxSizeMB: 0.1,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);
      
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        onUpdate({ ...teacher, profilePhotoUrl: dataUrl, faceIdStatus: 'Completed' });
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error('Error compressing image:', error);
      triggerError('Failed to process image');
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      )}
      <div 
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-[#FAF7F2] shadow-2xl z-50 transform transition-transform duration-300 overflow-y-auto ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-[#7A4F26] to-[#A0642E] px-6 py-4 flex items-center justify-between shadow-md text-white">
          <h2 className="text-lg font-bold">Teacher Profile</h2>
          <button onClick={onClose} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Top Profile Info */}
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-4 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-xl bg-white">
                {teacher.profilePhotoUrl || teacher.avatarUrl ? (
                  <img src={teacher.profilePhotoUrl || teacher.avatarUrl} alt={teacher.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#FDF3E7] text-[#8B5E2E] text-4xl font-bold">
                    {teacher.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Upload className="w-8 h-8 text-white" />
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{teacher.name}</h3>
            <p className="text-gray-500 font-medium">{teacher.subjects?.join(', ')} • {teacher.experienceYears || 0} Years Exp</p>

            <div className="flex gap-4 mt-6">
              {teacher.contact && (
                <>
                  <a href={`tel:${teacher.contact}`} className="flex flex-col items-center gap-1 group">
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                      <Phone className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-medium text-gray-600">Call</span>
                  </a>
                  <a href={`https://wa.me/91${teacher.contact}`} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1 group">
                    <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center group-hover:bg-green-600 group-hover:text-white transition-all shadow-sm">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-medium text-gray-600">WhatsApp</span>
                  </a>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-gray-100 hide-scrollbar bg-gray-50/50 mt-4">
          {(['Personal', 'Timetable', 'Attendance', 'Documents'] as TabType[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 font-bold text-sm whitespace-nowrap transition-colors relative ${
                activeTab === tab ? 'text-[#8B5E2E]' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#8B5E2E] rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-8">
          {activeTab === 'Personal' && (
            <>
              {/* Details Section */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#8B5E2E]" />
              Personal Details
            </h4>
            <div className="grid grid-cols-2 gap-y-4 gap-x-4">
              <div>
                <p className="text-xs text-gray-400">Gender</p>
                <p className="text-sm font-semibold text-gray-800">{teacher.gender || 'Not Specified'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Date of Birth</p>
                <p className="text-sm font-semibold text-gray-800">{teacher.dob || 'Not Specified'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Father's Name</p>
                <p className="text-sm font-semibold text-gray-800">{teacher.fathersName || 'Not Specified'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Emergency Contact</p>
                <p className="text-sm font-semibold text-gray-800">{teacher.emergencyContact || 'Not Specified'}</p>
              </div>
            </div>
          </div>

          {/* Face ID Status */}
          <div className={`rounded-2xl p-5 border ${teacher.faceIdStatus === 'Completed' ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${teacher.faceIdStatus === 'Completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                    {teacher.faceIdStatus === 'Completed' ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className={`font-bold text-sm ${teacher.faceIdStatus === 'Completed' ? 'text-emerald-800' : 'text-amber-800'}`}>Face ID Status</h4>
                    <p className={`text-xs ${teacher.faceIdStatus === 'Completed' ? 'text-emerald-600' : 'text-amber-600'}`}>{teacher.faceIdStatus === 'Completed' ? 'AI Encoding Completed' : 'Pending Upload'}</p>
                  </div>
                </div>
                <button onClick={() => fileInputRef.current?.click()} className="text-xs font-bold underline text-gray-600 hover:text-gray-900">
                  Update Photo
                </button>
             </div>
          </div>

          {/* Extra Responsibilities */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#8B5E2E]" />
              Extra Responsibilities
            </h4>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {(teacher.extraResponsibilities || []).map(tag => (
                <span key={tag} className="flex items-center gap-1 bg-[#FDF3E7] text-[#8B5E2E] px-3 py-1.5 rounded-full text-xs font-semibold border border-[#EDE8DF]">
                  {tag}
                  <button onClick={() => handleRemoveTag(tag)} className="ml-1 hover:text-red-500 bg-white rounded-full p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {(!teacher.extraResponsibilities || teacher.extraResponsibilities.length === 0) && (
                <span className="text-sm text-gray-400 italic">No extra responsibilities added.</span>
              )}
            </div>

            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="E.g., Sports In-charge" 
                value={newTag} 
                onChange={e => setNewTag(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddTag()}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#C5873A]"
              />
              <button onClick={handleAddTag} className="bg-[#8B5E2E] text-white px-4 rounded-lg text-sm font-semibold hover:bg-[#7A4F26]">
                Add
              </button>
            </div>
          </div>
          </>
          )}

          {activeTab === 'Timetable' && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-center text-gray-500 py-10">
              Timetable data will appear here.
            </div>
          )}

          {activeTab === 'Attendance' && (
            <>
              {/* Proxy Assignment Engine */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-red-100 bg-gradient-to-br from-white to-red-50">
            <h4 className="text-sm font-bold text-red-700 mb-1 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              Absent Today? Proxy Assignment
            </h4>
            <p className="text-xs text-gray-500 mb-4">Assign another teacher to manage attendance for this teacher's class.</p>
            
            <div className="flex flex-col gap-3">
              <select 
                value={selectedProxy} 
                onChange={(e) => setSelectedProxy(e.target.value)}
                className="w-full bg-white border border-red-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-red-400"
              >
                <option value="">Select a Proxy Teacher...</option>
                {allTeachers.filter(t => t.id !== teacher.id).map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <button 
                onClick={handleAssignProxy}
                disabled={!selectedProxy}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:text-gray-500 text-white font-bold py-2.5 rounded-lg text-sm transition-colors"
              >
                Assign Proxy
              </button>
            </div>
            </div>
          </>
          )}

          {activeTab === 'Documents' && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-center text-gray-500 py-10">
              No documents uploaded yet.
            </div>
          )}

          <div className="pb-8"></div>
        </div>
      </div>
    </>
  );
}
