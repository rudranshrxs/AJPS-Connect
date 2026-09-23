import React, { useState, useEffect } from 'react';
import { MapPin, Bus, Clock } from 'lucide-react';

export function StudentTransport() {
  const [livePos, setLivePos] = useState({ x: 50, y: 50 });
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    // Read the automated simulated data from local storage
    const interval = setInterval(() => {
      const stored = localStorage.getItem('ajps_live_bus_route_2');
      if (stored) {
        setLivePos(JSON.parse(stored) || null);
        setIsLive(true);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)] bg-[#FDFBF7] overflow-hidden flex flex-col justify-end border border-white/50 rounded-xl">
      {/* Minimal Simulated Map Background Grid */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#A05C2B 2px, transparent 2px)', backgroundSize: '30px 30px' }}></div>

      {/* Map Central Pin (School) */}
      <div className="absolute left-1/2 top-1/2 w-16 h-16 -ml-8 -mt-16 z-0 flex flex-col items-center">
         <div className="bg-[#1F2937] text-white p-2.5 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.2)] border-2 border-white">
           <MapPin className="w-6 h-6" />
         </div>
         <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-md text-[10px] font-bold mt-1 shadow-sm border border-gray-200 text-[#1F2937]">
           School Campus
         </div>
      </div>

      {/* Live Vehicle Marker */}
      {isLive && (
        <div
          className="absolute w-12 h-12 -ml-6 -mt-6 transition-all duration-1000 ease-linear z-10 flex items-center justify-center"
          style={{ left: `${livePos.x}%`, top: `${livePos.y}%` }}
        >
           <div className="absolute inset-0 bg-[#A05C2B]/20 rounded-full animate-ping"></div>
           <div className="relative bg-[#A05C2B] text-white p-2.5 rounded-full shadow-[0_4px_16px_rgba(160,92,43,0.4)] border-2 border-white">
             <Bus className="w-5 h-5" />
           </div>
        </div>
      )}

      {/* Minimal Floating Card for Student/Parent (Strictly NO KM data) */}
      <div className="relative z-20 m-4 md:m-8 bg-white/70 border border-white/80 p-5 md:p-6 rounded-[2rem] backdrop-blur-xl shadow-[0_8px_32px_-4px_rgba(160,92,43,0.15)] max-w-md mx-auto w-full">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 shrink-0">
            <Bus className="w-7 h-7 text-[#A05C2B]" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-[#1F2937] tracking-tight mb-1">Assigned Bus: Route 2</h2>
            <div className="flex items-center gap-2">
               <div className="relative flex h-2.5 w-2.5">
                 {isLive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
                 <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isLive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
               </div>
               <span className="text-sm font-bold text-[#6B7280]">{isLive ? 'Arriving...' : 'Waiting for departure'}</span>
            </div>
          </div>
          {isLive && (
            <div className="w-12 h-12 bg-[#FDF7EE] rounded-full flex items-center justify-center shrink-0 border border-[#A05C2B]/20 shadow-inner">
              <Clock className="w-5 h-5 text-[#A05C2B] animate-pulse" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
