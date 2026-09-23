import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLoader } from '../../context/LoaderContext';
import { useSuccess } from '../../context/SuccessContext';
import { useNotification } from '../../context/NotificationContext';
import { 
  Phone, IndianRupee, Clock, QrCode, CalendarDays,
  Settings2, Save, Smartphone, 
  Upload, AlertCircle, ChevronRight, ArrowLeft,
  BookOpen
} from 'lucide-react';
import { NAV_ITEMS } from '../../components/layout/Sidebar';

type ViewState = 'menu' | 'contact' | 'financial' | 'timetable' | 'mobile_nav';

type TimetableRow = {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  type: 'class' | 'break';
};

export default function Settings() {
  const { currentUser } = useAuth();
  const { runWithLoader } = useLoader();
  const { triggerSuccess, triggerError } = useSuccess();
  const { addNotification } = useNotification();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeView, setActiveView] = useState<ViewState>('menu');

  // Global Settings State (Admin Only)
  const [globalSettings, setGlobalSettings] = useState({
    schoolPhone: '',
    schoolEmail: '',
    upiId: '',
    qrCodeBase64: '',
    lateFineAmount: '',
    receiptFooterNote: '',
    minAttendance: 75,
    startTime: '08:00',
    assemblyDuration: 20,
    periodDuration: 40,
    periodGap: 5,
    lunchDuration: 30,
    lunchAfterPeriod: 4,
    totalPeriods: 8,
    schoolLatitude: '',
    schoolLongitude: ''
  });

  const [globalTimetable, setGlobalTimetable] = useState<TimetableRow[]>([]);
  const [previousPeriodCount, setPreviousPeriodCount] = useState<number>(0);

  // Personal Settings State
  const [personalSettings, setPersonalSettings] = useState({
    bottomNavItems: [] as string[]
  });

  // Load Initial Data
  useEffect(() => {
    if (currentUser?.role === 'Admin') {
      const savedGlobal = localStorage.getItem('ajps_global_settings');
      if (savedGlobal) {
        setGlobalSettings(JSON.parse(savedGlobal));
      }
      
      const savedTimetable = localStorage.getItem('ajps_global_timetable');
      if (savedTimetable) {
        const parsed = JSON.parse(savedTimetable);
        setGlobalTimetable(parsed);
        const classPeriods = parsed.filter((p: TimetableRow) => p.type === 'class').length;
        setPreviousPeriodCount(classPeriods);
      }
    }

    if (currentUser?.id) {
      const savedPersonal = localStorage.getItem(`ajps_user_prefs_${currentUser.id}`);
      if (savedPersonal) {
        setPersonalSettings(JSON.parse(savedPersonal));
      } else {
        // Fallback default tabs
        let defaultTabs = ['Dashboard'];
        if (currentUser.role === 'Student') defaultTabs = ['Dashboard', 'Attendance', 'Exams', 'Fee & Payments'];
        if (currentUser.role === 'Teacher') defaultTabs = ['Dashboard', 'Attendance', 'Classes', 'Directory'];
        if (currentUser.role === 'Admin') defaultTabs = ['Dashboard', 'Attendance', 'Directory', 'Fee & Payments'];
        
        setPersonalSettings({ bottomNavItems: defaultTabs });
      }
    }
  }, [currentUser]);

  // Timetable Generator
  const handleGenerateTimetable = () => {
    let [h, m] = globalSettings.startTime.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) {
      triggerError("Invalid start time");
      return;
    }
    
    let time = h * 60 + m;
    const formatTime = (t: number) => `${Math.floor(t / 60).toString().padStart(2, '0')}:${(t % 60).toString().padStart(2, '0')}`;
    
    const schedule: TimetableRow[] = [];
    
    if (globalSettings.assemblyDuration > 0) {
      schedule.push({ 
        id: `assembly-${Date.now()}`,
        label: 'Assembly', 
        startTime: formatTime(time), 
        endTime: formatTime(time + Number(globalSettings.assemblyDuration)), 
        type: 'break' 
      });
      time += Number(globalSettings.assemblyDuration);
    }
  
    for (let i = 1; i <= globalSettings.totalPeriods; i++) {
      schedule.push({ 
        id: `period-${i}-${Date.now()}`,
        label: `Period ${i}`, 
        startTime: formatTime(time), 
        endTime: formatTime(time + Number(globalSettings.periodDuration)), 
        type: 'class' 
      });
      time += Number(globalSettings.periodDuration);
      
      if (i === Number(globalSettings.lunchAfterPeriod) && globalSettings.lunchDuration > 0) {
        schedule.push({ 
          id: `lunch-${Date.now()}`,
          label: 'Lunch Break', 
          startTime: formatTime(time), 
          endTime: formatTime(time + Number(globalSettings.lunchDuration)), 
          type: 'break' 
        });
        time += Number(globalSettings.lunchDuration);
      } else if (i < globalSettings.totalPeriods && globalSettings.periodGap > 0) {
        time += Number(globalSettings.periodGap);
      }
    }
    
    setGlobalTimetable(schedule);
  };

  const handleTimetableRowChange = (id: string, field: keyof TimetableRow, value: string) => {
    setGlobalTimetable(prev => prev.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  const handleGlobalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setGlobalSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleNavToggle = (itemName: string) => {
    setPersonalSettings(prev => {
      const isSelected = prev.bottomNavItems.includes(itemName);
      if (isSelected) {
        return { ...prev, bottomNavItems: prev.bottomNavItems.filter(i => i !== itemName) };
      } else {
        if (prev.bottomNavItems.length >= 5) {
          triggerError('You can only pin up to 5 items to the mobile navigation.');
          return prev;
        }
        return { ...prev, bottomNavItems: [...prev.bottomNavItems, itemName] };
      }
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setGlobalSettings(prev => ({ ...prev, qrCodeBase64: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const saveSettings = () => {
    if (activeView === 'mobile_nav' && personalSettings.bottomNavItems.length < 4) {
      triggerError('Please select at least 4 items for the Mobile Navigation.');
      return;
    }

    runWithLoader(() => {
      if (currentUser?.role === 'Admin') {
        localStorage.setItem('ajps_global_settings', JSON.stringify(globalSettings));
        
        if (activeView === 'timetable') {
          localStorage.setItem('ajps_global_timetable', JSON.stringify(globalTimetable));
          
          const newPeriodCount = globalTimetable.filter(p => p.type === 'class').length;
          if (newPeriodCount !== previousPeriodCount) {
             addNotification({
               title: 'School Timings Updated',
               message: `Your classes have been set to ${newPeriodCount} periods. View new time table.`,
               type: 'SYSTEM',
               recipientRole: 'Student'
             });
             setPreviousPeriodCount(newPeriodCount);
          }
        }
      }
      
      if (activeView === 'mobile_nav' || activeView === 'menu') {
        localStorage.setItem(`ajps_user_prefs_${currentUser?.id}`, JSON.stringify(personalSettings));
        window.dispatchEvent(new Event('ajps_settings_updated'));
      }
      
      triggerSuccess('Settings Saved Successfully!', false);
    });
  };

  const availableMobileNavItems = NAV_ITEMS.filter(i => i.allowedRoles.includes(currentUser?.role || 'Student'));

  // --- UI Renderers ---

  const renderHeader = (title: string, onBack?: () => void) => (
    <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
      <div className="flex items-center gap-3">
        {onBack ? (
          <button onClick={onBack} className="p-2 -ml-2 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : (
          <Settings2 className="w-6 h-6 text-gray-800" />
        )}
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
      </div>
      {onBack && (
        <button 
          onClick={saveSettings}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Save className="w-4 h-4" />
          Save
        </button>
      )}
    </div>
  );

  if (activeView === 'menu') {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        {renderHeader('Settings')}
        <div className="max-w-3xl mx-auto p-4 sm:p-6 mt-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {currentUser?.role === 'Admin' && (
              <>
                <button 
                  onClick={() => setActiveView('contact')}
                  className="w-full flex items-center justify-between px-6 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                      <Phone className="w-5 h-5" />
                    </div>
                    <span className="font-semibold text-gray-800">School Contact Info</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
                
                <button 
                  onClick={() => setActiveView('financial')}
                  className="w-full flex items-center justify-between px-6 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <IndianRupee className="w-5 h-5" />
                    </div>
                    <span className="font-semibold text-gray-800">Financial & Fees</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
                
                <button 
                  onClick={() => setActiveView('timetable')}
                  className="w-full flex items-center justify-between px-6 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                      <Clock className="w-5 h-5" />
                    </div>
                    <span className="font-semibold text-gray-800">Timetable Engine</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              </>
            )}

            <button 
              onClick={() => setActiveView('mobile_nav')}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                  <Smartphone className="w-5 h-5" />
                </div>
                <span className="font-semibold text-gray-800">Mobile App Customization</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {renderHeader(
        activeView === 'contact' ? 'Contact Info' : 
        activeView === 'financial' ? 'Financials & Fees' : 
        activeView === 'timetable' ? 'Timetable Engine' : 'Mobile Customization',
        () => setActiveView('menu')
      )}
      
      <div className="max-w-3xl mx-auto p-4 sm:p-6 mt-4">
        
        {/* Contact Info View */}
        {activeView === 'contact' && currentUser?.role === 'Admin' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">School Phone</label>
                <input 
                  type="text" name="schoolPhone" value={globalSettings.schoolPhone} onChange={handleGlobalChange}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">School Email</label>
                <input 
                  type="email" name="schoolEmail" value={globalSettings.schoolEmail} onChange={handleGlobalChange}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                />
              </div>
              
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-sm font-bold text-gray-800 mb-4">Location Settings (For Live Attendance)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                    <input 
                      type="number" step="any" name="schoolLatitude" value={globalSettings.schoolLatitude || ''} onChange={handleGlobalChange}
                      placeholder="e.g. 28.7041"
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                    <input 
                      type="number" step="any" name="schoolLongitude" value={globalSettings.schoolLongitude || ''} onChange={handleGlobalChange}
                      placeholder="e.g. 77.1025"
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Set the exact coordinates of the school. Teachers must be within 200m to mark attendance.</p>
              </div>
            </div>
          </div>
        )}

        {/* Financial View */}
        {activeView === 'financial' && currentUser?.role === 'Admin' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID (Optional)</label>
                <input 
                  type="text" name="upiId" value={globalSettings.upiId} onChange={handleGlobalChange}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Late Fine Amount (₹)</label>
                <input 
                  type="number" name="lateFineAmount" value={globalSettings.lateFineAmount} onChange={handleGlobalChange}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Footer Note</label>
                <input 
                  type="text" name="receiptFooterNote" value={globalSettings.receiptFooterNote} onChange={handleGlobalChange}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none" 
                />
              </div>
            </div>
          </div>
        )}

        {/* Timetable Engine View */}
        {activeView === 'timetable' && currentUser?.role === 'Admin' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 border-b pb-2">Generation Rules</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Start Time</label>
                    <input type="time" name="startTime" value={globalSettings.startTime} onChange={handleGlobalChange} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Total Periods</label>
                    <input type="number" name="totalPeriods" value={globalSettings.totalPeriods} onChange={handleGlobalChange} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Assembly (min)</label>
                    <input type="number" name="assemblyDuration" value={globalSettings.assemblyDuration} onChange={handleGlobalChange} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Period (min)</label>
                    <input type="number" name="periodDuration" value={globalSettings.periodDuration} onChange={handleGlobalChange} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Gap (min)</label>
                    <input type="number" name="periodGap" value={globalSettings.periodGap} onChange={handleGlobalChange} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Lunch After</label>
                    <input type="number" name="lunchAfterPeriod" value={globalSettings.lunchAfterPeriod} onChange={handleGlobalChange} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Lunch Duration</label>
                    <input type="number" name="lunchDuration" value={globalSettings.lunchDuration} onChange={handleGlobalChange} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500" />
                  </div>
                </div>
                
                <button 
                  onClick={handleGenerateTimetable}
                  className="w-full bg-gray-900 hover:bg-black text-white py-3 rounded-xl font-medium transition-colors"
                >
                  Generate Bell Schedule
                </button>
              </div>
            </div>

            {globalTimetable.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 flex justify-between items-center">
                    Editable Output
                    <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded">Total: {globalTimetable.length} Slots</span>
                  </h3>
                  
                  <div className="space-y-3">
                    {globalTimetable.map((row) => (
                      <div key={row.id} className={`flex items-center gap-2 p-3 rounded-xl border ${row.type === 'break' ? 'bg-orange-50/50 border-orange-100' : 'bg-gray-50 border-gray-200'}`}>
                        <input 
                          type="text" 
                          value={row.label}
                          onChange={(e) => handleTimetableRowChange(row.id, 'label', e.target.value)}
                          className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-medium outline-none focus:ring-1 focus:ring-blue-500" 
                        />
                        <input 
                          type="time" 
                          value={row.startTime}
                          onChange={(e) => handleTimetableRowChange(row.id, 'startTime', e.target.value)}
                          className="w-[110px] bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-blue-500" 
                        />
                        <span className="text-gray-400 font-medium">-</span>
                        <input 
                          type="time" 
                          value={row.endTime}
                          onChange={(e) => handleTimetableRowChange(row.id, 'endTime', e.target.value)}
                          className="w-[110px] bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-blue-500" 
                        />
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <p className="text-xs text-blue-800">
                      Saving this will update the global school bell schedule. If the number of periods changes, students will be notified automatically.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mobile App Customization View */}
        {activeView === 'mobile_nav' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6">
              <p className="text-sm text-gray-500 mb-6">
                Select 4 or 5 items to pin to your mobile bottom navigation bar.
              </p>
              
              <div className="space-y-3">
                {availableMobileNavItems.map(item => {
                  const isSelected = personalSettings.bottomNavItems.includes(item.name);
                  return (
                    <label key={item.name} className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${isSelected ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500' : 'border-gray-200 hover:bg-gray-50'}`}>
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => handleNavToggle(item.name)}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500" 
                      />
                      <item.icon className={`w-6 h-6 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
                      <span className={`text-base font-semibold ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>{item.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
