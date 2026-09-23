import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSuccess } from '../../context/SuccessContext';
import { NotificationService } from '../../services/NotificationService';
import imageCompression from 'browser-image-compression';
import { Camera, User, Phone, Mail, Droplet, MapPin, Upload, AlertTriangle, ShieldCheck, Edit, BookOpen, Clock, Briefcase, GraduationCap } from 'lucide-react';

import Cropper from 'react-easy-crop';
import getCroppedImg from '../../utils/cropImage';

export default function Profile() {
  const { currentUser } = useAuth();
  const { triggerSuccess, triggerError } = useSuccess();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<any>({});
  const [initialData, setInitialData] = useState<any>({});
  const [isUploading, setIsUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Crop states
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropping, setIsCropping] = useState(false);

  // Student computed stats
  const [studentStats, setStudentStats] = useState({ attendancePercent: 0, totalMarks: 0, totalMax: 0 });

  useEffect(() => {
    if (currentUser) {
      const currentData = {
        name: currentUser.name || '',
        contact: currentUser.contact || currentUser.personalDetails?.phone || '',
        guardianName: currentUser.guardianDetails?.guardianName || '',
        address: currentUser.personalDetails?.address || '',
        bloodGroup: currentUser.personalDetails?.bloodGroup || '',
        emergencyContact: currentUser.emergencyContact || '',
        dob: currentUser.dob || currentUser.personalDetails?.dob || '',
        profilePhotoUrl: currentUser.profilePhotoUrl || currentUser.avatarUrl || '',
      };
      setFormData(currentData);
      setInitialData(currentData);
      
      // Calculate student stats
      if (currentUser.role === 'Student') {
        let totalPresence = 0;
        let totalDays = 0;
        if (currentUser.attendanceHistory && currentUser.attendanceHistory.length > 0) {
          totalDays = currentUser.attendanceHistory.length;
          totalPresence = currentUser.attendanceHistory.filter(h => h.status === 'Present' || h.status === 'Late').length;
        }
        
        const results = JSON.parse(localStorage.getItem('ajps_exam_results') || '[]');
        let marks = 0;
        let max = 0;
        
        results.forEach((exam: any) => {
          if (exam.status === 'Published' && exam.marks && exam.marks[currentUser.id]) {
            const studentMarks = exam.marks[currentUser.id];
            Object.keys(studentMarks).forEach(sub => {
              marks += Number(studentMarks[sub]) || 0;
              max += 100; // assuming 100 per subject for simple stats display
            });
          }
        });
        
        setStudentStats({
          attendancePercent: totalDays > 0 ? Math.round((totalPresence / totalDays) * 100) : 0,
          totalMarks: marks,
          totalMax: max
        });
      }
    }
  }, [currentUser]);

  if (!currentUser) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isEditing) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setIsCropping(true);
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input
  };

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    
    try {
      setIsUploading(true);
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      
      const options = {
        maxSizeMB: 0.1,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      };
      
      const compressedFile = await imageCompression(croppedBlob as File, options);
      const reader = new FileReader();
      
      reader.onloadend = () => {
        setFormData({ ...formData, profilePhotoUrl: reader.result as string });
        setIsUploading(false);
        setIsCropping(false);
        setImageSrc(null);
      };
      
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error('Error cropping image:', error);
      triggerError('Failed to process image');
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    if (!currentUser) return;
    
    // DIFF CALCULATION
    const changedFields: string[] = [];
    if (formData.name !== initialData.name) changedFields.push(`Name to '${formData.name}'`);
    if (formData.contact !== initialData.contact) changedFields.push(`Contact to '${formData.contact}'`);
    if (formData.guardianName !== initialData.guardianName) changedFields.push(`Guardian Name to '${formData.guardianName}'`);
    if (formData.address !== initialData.address) changedFields.push(`Address to '${formData.address}'`);
    if (formData.bloodGroup !== initialData.bloodGroup) changedFields.push(`Blood Group to '${formData.bloodGroup}'`);
    if (formData.emergencyContact !== initialData.emergencyContact) changedFields.push(`Emergency Contact to '${formData.emergencyContact}'`);
    if (formData.dob !== initialData.dob) changedFields.push(`DOB to '${formData.dob}'`);
    if (formData.profilePhotoUrl !== initialData.profilePhotoUrl) changedFields.push(`Profile Photo`);

    if (changedFields.length === 0) {
      setIsEditing(false);
      return; // No changes made
    }

    // Update local storage ajps_users
    const users = JSON.parse(localStorage.getItem('ajps_users') || '[]');
    const userIndex = users.findIndex((u: any) => u.id === currentUser.id);
    
    if (userIndex !== -1) {
      const updatedUser = { ...users[userIndex] };
      updatedUser.name = formData.name;
      
      if (!updatedUser.personalDetails) updatedUser.personalDetails = {};
      updatedUser.personalDetails.bloodGroup = formData.bloodGroup;
      
      if (currentUser.role === 'Student') {
        updatedUser.personalDetails.address = formData.address;
        updatedUser.personalDetails.phone = formData.contact;
        if (!updatedUser.guardianDetails) updatedUser.guardianDetails = {};
        updatedUser.guardianDetails.guardianName = formData.guardianName;
        updatedUser.avatarUrl = formData.profilePhotoUrl;
      } 
      else if (currentUser.role === 'Teacher') {
        updatedUser.contact = formData.contact;
        updatedUser.emergencyContact = formData.emergencyContact;
        updatedUser.dob = formData.dob;
        updatedUser.profilePhotoUrl = formData.profilePhotoUrl;
        updatedUser.avatarUrl = formData.profilePhotoUrl;
      }
      else if (currentUser.role === 'Admin') {
        updatedUser.contact = formData.contact;
        updatedUser.avatarUrl = formData.profilePhotoUrl;
      }

      users[userIndex] = updatedUser;
      localStorage.setItem('ajps_users', JSON.stringify(users));
      
      // Implicit context update
      window.dispatchEvent(new Event('ajps_users_updated'));
      window.dispatchEvent(new Event('storage'));
      
      setInitialData({ ...formData });
      setIsEditing(false);
      triggerSuccess('Profile Updated Successfully');

      // Hierarchical Notification Workflow
      const alertMessage = `${updatedUser.name} updated their profile: ${changedFields.join(', ')}.`;
      
      if (currentUser.role === 'Student') {
        const classTeachers = users.filter((u: any) => 
          u.role === 'Teacher' && 
          u.isClassTeacher && 
          u.classTeacherClass === updatedUser.classId
        );
        
        if (classTeachers.length > 0) {
          NotificationService.sendNotification({
            recipientIds: classTeachers.map((t: any) => t.id),
            title: 'Student Profile Updated',
            message: alertMessage,
            type: 'info',
            actionPath: '/students',
            actionLabel: 'View'
          });
        }
      } else if (currentUser.role === 'Teacher') {
        NotificationService.sendNotification({
          role: 'Admin',
          title: 'Teacher Profile Updated',
          message: alertMessage,
          type: 'info',
          actionPath: '/teachers',
          actionLabel: 'View'
        });
      }
    }
  };

  const isTeacherMissingPhoto = currentUser.role === 'Teacher' && (!formData.profilePhotoUrl || formData.profilePhotoUrl === currentUser.avatarUrl && formData.profilePhotoUrl.includes('ui-avatars'));
  const isStudentMissingInfo = currentUser.role === 'Student' && (!formData.guardianName || !formData.address || !formData.bloodGroup || !formData.contact);

  return (
    <div className="bg-slate-50 min-h-screen pb-24 animate-in fade-in zoom-in-95 duration-300">
      <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your personal information</p>
          </div>
          {!isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium shadow-sm transition-all"
            >
              <Edit size={16} /> Edit Profile
            </button>
          )}
        </div>

        {isTeacherMissingPhoto && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-4 shadow-sm animate-in fade-in slide-in-from-top-2">
            <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-amber-800">Profile Photo Required</h3>
              <p className="text-sm text-amber-700 mt-1">
                You must upload a clear profile photo. This photo will be strictly used as your Face ID for daily Live Attendance check-ins. Click "Edit Profile" to upload.
              </p>
            </div>
          </div>
        )}

        {isStudentMissingInfo && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-4 shadow-sm animate-in fade-in slide-in-from-top-2">
            <ShieldCheck className="w-6 h-6 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-blue-800">Incomplete Profile</h3>
              <p className="text-sm text-blue-700 mt-1">
                Please complete your profile details (Guardian Name, Address, Blood Group, Contact) for school records. Click "Edit Profile" to update.
              </p>
            </div>
          </div>
        )}

        {/* Read Only Statistical Data Blocks */}
        {(currentUser.role === 'Student' || currentUser.role === 'Teacher') && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {currentUser.role === 'Student' && (
              <>
                <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center"><BookOpen size={24} /></div>
                  <div><p className="text-sm text-gray-500 font-medium">Class</p><p className="text-lg font-bold text-gray-900">{currentUser.className} - {currentUser.section}</p></div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center"><Clock size={24} /></div>
                  <div><p className="text-sm text-gray-500 font-medium">Attendance</p><p className="text-lg font-bold text-gray-900">{studentStats.attendancePercent}%</p></div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center"><GraduationCap size={24} /></div>
                  <div><p className="text-sm text-gray-500 font-medium">Total Marks</p><p className="text-lg font-bold text-gray-900">{studentStats.totalMarks} / {studentStats.totalMax || 0}</p></div>
                </div>
              </>
            )}

            {currentUser.role === 'Teacher' && (
              <>
                <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center"><Briefcase size={24} /></div>
                  <div><p className="text-sm text-gray-500 font-medium">Experience</p><p className="text-lg font-bold text-gray-900">{currentUser.experienceYears || 0} Years</p></div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center"><BookOpen size={24} /></div>
                  <div className="flex-1 overflow-hidden"><p className="text-sm text-gray-500 font-medium">Subjects</p><p className="text-sm font-bold text-gray-900 truncate">{currentUser.subjects?.join(', ') || 'None'}</p></div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center"><Clock size={24} /></div>
                  <div className="flex-1 overflow-hidden"><p className="text-sm text-gray-500 font-medium">Assigned Classes</p><p className="text-sm font-bold text-gray-900 truncate">{currentUser.assignedClasses?.join(', ') || 'None'}</p></div>
                </div>
              </>
            )}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Left Column: Photo */}
              <div className="flex flex-col items-center space-y-4 shrink-0">
                <div className="relative w-32 h-32 aspect-square rounded-full border-4 border-gray-50 shadow-md overflow-hidden bg-gray-100 group">
                  {formData.profilePhotoUrl ? (
                    <img src={formData.profilePhotoUrl} alt="Profile" className="w-full h-full aspect-square rounded-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <User size={48} />
                    </div>
                  )}
                  {isEditing && (
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Camera size={24} />
                      <span className="text-xs font-medium mt-1">Upload</span>
                    </button>
                  )}
                  {isUploading && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageSelect} 
                  accept="image/*" 
                  capture="user"
                  className="hidden" 
                  disabled={!isEditing}
                />
                {isEditing && (
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Upload size={16} /> Update Photo
                  </button>
                )}
                <p className="text-[10px] text-gray-400 text-center w-32">Use camera or gallery.<br/>Max size: 2MB.</p>
              </div>

              {/* Right Column: Form Fields */}
              <div className="flex-1 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input 
                      type="text" 
                      name="name" 
                      value={formData.name} 
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-800 disabled:bg-gray-50 disabled:text-gray-600" 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Primary Contact Number</label>
                    <input 
                      type="tel" 
                      name="contact" 
                      value={formData.contact} 
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-800 disabled:bg-gray-50 disabled:text-gray-600" 
                    />
                  </div>

                  {currentUser.role === 'Student' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Guardian Name {isEditing && <span className="text-red-500">*</span>}</label>
                        <input 
                          type="text" 
                          name="guardianName" 
                          value={formData.guardianName} 
                          onChange={handleChange}
                          disabled={!isEditing}
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-800 disabled:bg-gray-50 disabled:text-gray-600" 
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Home Address {isEditing && <span className="text-red-500">*</span>}</label>
                        <input 
                          type="text" 
                          name="address" 
                          value={formData.address} 
                          onChange={handleChange}
                          disabled={!isEditing}
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-800 disabled:bg-gray-50 disabled:text-gray-600" 
                        />
                      </div>
                    </>
                  )}

                  {currentUser.role === 'Teacher' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
                        <input 
                          type="tel" 
                          name="emergencyContact" 
                          value={formData.emergencyContact} 
                          onChange={handleChange}
                          disabled={!isEditing}
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-800 disabled:bg-gray-50 disabled:text-gray-600" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                        <input 
                          type="date" 
                          name="dob" 
                          value={formData.dob} 
                          onChange={handleChange}
                          disabled={!isEditing}
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-800 disabled:bg-gray-50 disabled:text-gray-600" 
                        />
                      </div>
                    </>
                  )}

                  {currentUser.role === 'Admin' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">System Role</label>
                      <input 
                        type="text" 
                        disabled 
                        value="System Administrator" 
                        className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-gray-500 cursor-not-allowed" 
                      />
                    </div>
                  )}

                  {(currentUser.role === 'Student' || currentUser.role === 'Teacher') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group {isEditing && <span className="text-red-500">*</span>}</label>
                      <select 
                        name="bloodGroup" 
                        value={formData.bloodGroup} 
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-800 bg-white disabled:bg-gray-50 disabled:text-gray-600"
                      >
                        <option value="">Select Blood Group</option>
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                          <option key={bg} value={bg}>{bg}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                
                {isEditing && (
                  <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
                    <button 
                      onClick={() => {
                        setFormData(initialData);
                        setIsEditing(false);
                      }}
                      className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-xl font-bold transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSave}
                      className="bg-[#8B5E2E] hover:bg-[#7A4F26] text-white px-8 py-3 rounded-xl font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
                    >
                      Save Changes
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Cropper Modal */}
      {isCropping && imageSrc && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-md h-[60vh] bg-black">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
          </div>
          <div className="w-full max-w-md mt-6 flex gap-4">
            <button 
              onClick={() => {
                setIsCropping(false);
                setImageSrc(null);
              }}
              className="flex-1 py-3 px-4 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleCropSave}
              className="flex-1 py-3 px-4 bg-[#8B5E2E] text-white rounded-xl font-bold hover:bg-[#7A4F26] transition-colors"
            >
              Save Crop
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
