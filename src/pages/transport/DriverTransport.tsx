import React, { useState, useMemo } from 'react';
import { Bus, ShieldCheck, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTransportTracking } from '../../hooks/useTransportTracking';
import { TransportMap } from '../../components/transport/TransportMap';
import { DriverFuel } from './DriverFuel';
import { useTransport } from '../../context/TransportContext';

export function DriverTransport() {
  const { currentUser } = useAuth();
  const { fleet, isLoading } = useTransport();
  const [activeTab, setActiveTab] = useState<'Map' | 'Fuel'>('Map');
  const [isHolidayLocked, setIsHolidayLocked] = useState(false);
  
  // Find the route assigned to the currently logged-in driver
  const assignedRoute = useMemo(() => {
    if (fleet.length === 0) return null;
    return fleet.find(r => r.driverUserId === currentUser?.id) || fleet[0];
  }, [currentUser?.id, fleet]);
  
  const { isTracking, statusMsg, currentPos, schoolCoords } = useTransportTracking(assignedRoute?.id || 'R1');

  // Load the live route from local storage to display the polyline
  const liveRoute = JSON.parse(localStorage.getItem(`live_route_${assignedRoute?.id}`) || '[]');

  React.useEffect(() => {
    const notices = JSON.parse(localStorage.getItem('ajps_notices') || '[]');
    const todayStr = new Date().toISOString().split('T')[0];
    const isSunday = new Date().getDay() === 0;
    const holiday = notices.some((not: any) => (not.templateType === 'holiday' || not.isHoliday) && not.targetDate === todayStr);
    setIsHolidayLocked(isSunday || holiday);
  }, []);

  if (isLoading && fleet.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)] bg-[#FAF7F2] rounded-xl border border-[#EDE8DF]">
        <div className="w-10 h-10 border-4 border-[#8B5E2E] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-bold text-sm text-[#6B5E4E]">Loading Assigned Route...</p>
      </div>
    );
  }

  if (!assignedRoute) return null;

  if (isHolidayLocked) {
    return (
      <div className="relative w-full h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)] bg-[#FAF7F2] overflow-hidden flex flex-col rounded-xl border border-[#EDE8DF] items-center justify-center p-6 text-center">
        <Bus className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-[#1A1208] mb-2">Buses not running today.</h2>
        <p className="text-[#6B5E4E]">A holiday has been declared. Transport operations are locked.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)] bg-[#FAF7F2] overflow-hidden flex flex-col rounded-xl border border-[#EDE8DF]">
      
      {/* Top Tabs */}
      <div className="flex bg-white border-b border-[#EDE8DF] shrink-0 z-[500] relative">
        <button 
          onClick={() => setActiveTab('Map')}
          className={`flex-1 py-4 text-sm font-bold text-center border-b-2 transition-all duration-300 ${activeTab === 'Map' ? 'border-[#8B5E2E] text-[#8B5E2E]' : 'border-transparent text-[#6B5E4E]'}`}
        >
          Live Tracking
        </button>
        <button 
          onClick={() => setActiveTab('Fuel')}
          className={`flex-1 py-4 text-sm font-bold text-center flex justify-center items-center gap-2 border-b-2 transition-all duration-300 ${activeTab === 'Fuel' ? 'border-[#8B5E2E] text-[#8B5E2E]' : 'border-transparent text-[#6B5E4E]'}`}
        >
          <FileText className="w-4 h-4" /> Fuel Slips
        </button>
      </div>

      <div className="flex-1 relative overflow-hidden">
        {activeTab === 'Map' && (
          <div className="w-full h-full relative animate-in fade-in duration-300">
            <TransportMap 
              mode="Live" 
              schoolCoords={schoolCoords} 
              currentLocation={currentPos || undefined} 
              liveRoute={liveRoute}
              remainingKm={12.4} 
              currentSpeed={35} 
            />
            
            {/* Automated Glassmorphism Status Card (Top overlay) */}
            <div className="absolute top-4 left-4 right-4 z-[400] bg-white/90 border border-white/80 p-4 rounded-3xl backdrop-blur-xl shadow-lg max-w-md mx-auto">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 shrink-0">
                  <Bus className="w-6 h-6 text-[#8B5E2E]" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-[#1A1208] tracking-tight truncate">{assignedRoute.name}</h2>
                  <p className="text-xs font-medium text-[#6B5E4E] truncate">Vehicle: {assignedRoute.busNo} • {currentUser?.name}</p>
                </div>
              </div>

              <div className="flex items-center justify-between bg-[#FAF7F2] p-3 rounded-2xl border border-[#EDE8DF] shadow-inner">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-3 w-3">
                    {isTracking && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
                    <span className={`relative inline-flex rounded-full h-3 w-3 ${isTracking ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                  </div>
                  <span className="font-bold text-[#1A1208] text-xs">{statusMsg}</span>
                </div>
                {isTracking && (
                  <div className="flex items-center gap-1 text-[10px] font-bold text-[#8B5E2E] bg-[#FDF7EE] px-2 py-1 rounded-lg border border-[#8B5E2E]/20">
                    <ShieldCheck className="w-3 h-3" /> SECURE
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Fuel' && (
          <div className="animate-in slide-in-from-right duration-300">
            <DriverFuel />
          </div>
        )}
      </div>
    </div>
  );
}
