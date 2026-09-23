import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocationPoint } from '../../types';
import { Navigation, Clock } from 'lucide-react';

// Custom Bus Icon using Leaflet divIcon
const createBusIcon = () => {
  return L.divIcon({
    className: 'bg-transparent border-0',
    html: `<div class="bg-[#A05C2B] text-white p-2 rounded-full shadow-lg border-[3px] border-white flex items-center justify-center" style="width: 40px; height: 40px;">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bus"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg>
           </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });
};

const createSchoolIcon = () => {
  return L.divIcon({
    className: 'bg-transparent border-0',
    html: `<div class="bg-blue-600 text-white p-2 rounded-full shadow-lg border-[3px] border-white flex items-center justify-center text-xl" style="width: 40px; height: 40px;">
             🏫
           </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });
};

interface TransportMapProps {
  mode: 'Admin' | 'Live';
  schoolCoords: { lat: number, lng: number };
  liveRoute?: LocationPoint[];
  currentLocation?: { lat: number, lng: number };
  remainingKm?: number;
  currentSpeed?: number;
}

export function TransportMap({ mode, schoolCoords, liveRoute = [], currentLocation, remainingKm = 0, currentSpeed = 0 }: TransportMapProps) {
  const busIcon = useMemo(() => createBusIcon(), []);
  const schoolIcon = useMemo(() => createSchoolIcon(), []);

  // Compute polyline positions
  const routePositions: [number, number][] = liveRoute.map(point => [point.lat, point.lng]);
  
  // ETA Calculation: Distance (km) / Speed (km/h) * 60 = mins
  const etaMins = currentSpeed > 0 ? Math.round((remainingKm / currentSpeed) * 60) : '--';

  if (mode === 'Admin') {
    return (
      <div className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden border border-[#EDE8DF] z-0">
        <MapContainer 
          center={[schoolCoords.lat, schoolCoords.lng]} 
          zoom={16} 
          zoomControl={false} 
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <TileLayer 
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" 
            attribution="Tiles &copy; Esri"
          />
          
          <Marker position={[schoolCoords.lat, schoolCoords.lng]} icon={schoolIcon} />

          <Circle 
            center={[schoolCoords.lat, schoolCoords.lng]} 
            pathOptions={{ color: '#8B5E2E', fillColor: '#C5873A', fillOpacity: 0.2 }} 
            radius={100} 
          />
        </MapContainer>
        <div className="absolute top-4 left-4 z-[400] bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#EDE8DF] text-xs font-bold text-[#1A1208] shadow-sm">
          School Campus (100m Radius)
        </div>
      </div>
    );
  }

  // Live Tracking Mode (Parent/Driver view overlaying)
  return (
    <div className="relative w-full h-full flex flex-col">
      <div className="flex-1 min-h-[50%] z-0">
        <MapContainer 
          center={currentLocation ? [currentLocation.lat, currentLocation.lng] : [schoolCoords.lat, schoolCoords.lng]} 
          zoom={15} 
          zoomControl={false} 
          className="h-full w-full"
        >
          <TileLayer 
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" 
            attribution="Tiles &copy; Esri"
          />
          
          <Marker position={[schoolCoords.lat, schoolCoords.lng]} icon={schoolIcon} />
          
          <Circle 
            center={[schoolCoords.lat, schoolCoords.lng]} 
            pathOptions={{ color: '#8B5E2E', fillColor: '#C5873A', fillOpacity: 0.3 }} 
            radius={50} 
          />

          {routePositions.length > 0 && (
            <Polyline 
              positions={routePositions} 
              pathOptions={{ color: '#8B5E2E', weight: 4 }} 
            />
          )}

          {currentLocation && (
            <Marker position={[currentLocation.lat, currentLocation.lng]} icon={busIcon} />
          )}
        </MapContainer>
      </div>

      {/* Info Card Overlaying the bottom 40% */}
      <div className="absolute bottom-0 left-0 w-full z-[400] p-4 animate-in slide-in-from-bottom duration-300">
        <div className="bg-white/90 backdrop-blur-md border border-[#EDE8DF] rounded-3xl p-5 shadow-lg">
          <h3 className="font-bold text-[#1A1208] mb-4 flex items-center gap-2">
            <Navigation className="w-5 h-5 text-[#C5873A]" /> Live Status
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#FAF7F2] p-3 rounded-2xl flex flex-col">
              <span className="text-[10px] font-bold text-[#6B5E4E] uppercase">Rem. Dist</span>
              <span className="text-lg font-black text-[#1A1208]">{remainingKm.toFixed(1)} <span className="text-xs font-medium text-gray-500">km</span></span>
            </div>
            <div className="bg-[#FAF7F2] p-3 rounded-2xl flex flex-col">
              <span className="text-[10px] font-bold text-[#6B5E4E] uppercase">Speed</span>
              <span className="text-lg font-black text-[#1A1208]">{currentSpeed.toFixed(0)} <span className="text-xs font-medium text-gray-500">km/h</span></span>
            </div>
            <div className="bg-[#8B5E2E] text-white p-3 rounded-2xl flex flex-col border border-[#C5873A]">
              <span className="text-[10px] font-bold uppercase flex items-center gap-1 opacity-80">
                <Clock className="w-3 h-3" /> ETA
              </span>
              <span className="text-lg font-black">{etaMins} <span className="text-xs font-medium opacity-80">min</span></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
