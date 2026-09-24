import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../../lib/firebase';

// Fix Leaflet marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface DriverLocation {
  id: string;
  driverName?: string;
  busNo?: string;
  lat: number;
  lng: number;
  speed?: number;
  last_updated: Date;
}

const LiveTrackingMap: React.FC = () => {
  const [locations, setLocations] = useState<DriverLocation[]>([]);

  useEffect(() => {
    // If Firebase is configured and Firestore is available, attach live listener
    if (isFirebaseConfigured && db) {
      try {
        const unsubscribe = onSnapshot(collection(db, 'driver_locations'), (snapshot) => {
          if (!snapshot.empty) {
            const liveLocations: DriverLocation[] = snapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                driverName: data.driverName || doc.id,
                busNo: data.busNo || 'School Bus',
                lat: data.latitude || data.lat || 28.7041,
                lng: data.longitude || data.lng || 77.1025,
                speed: data.speed || 0,
                last_updated: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date()
              };
            });
            setLocations(liveLocations);
          }
        }, (error) => {
          console.warn('Firestore live location listener error, falling back to local data:', error);
          loadFallbackData();
        });

        return () => unsubscribe();
      } catch (err) {
        console.error('Failed to subscribe to driver_locations:', err);
        loadFallbackData();
      }
    } else {
      loadFallbackData();
    }
  }, []);

  const loadFallbackData = () => {
    // Fallback data for offline/preview
    setLocations([
      { id: 'BUS_01', driverName: 'Ramesh Singh', busNo: 'MP30-A-1111', lat: 26.35, lng: 78.93, speed: 42, last_updated: new Date() },
      { id: 'BUS_02', driverName: 'Suresh Yadav', busNo: 'MP30-B-2222', lat: 26.36, lng: 78.91, speed: 30, last_updated: new Date() }
    ]);
  };

  const defaultCenter: [number, number] = locations.length > 0 
    ? [locations[0].lat, locations[0].lng] 
    : [26.35, 78.93];

  return (
    <div className="h-[400px] w-full rounded-xl overflow-hidden shadow-lg border border-gray-200">
      <MapContainer 
        center={defaultCenter} 
        zoom={13} 
        scrollWheelZoom={false} 
        style={{ height: '100%', width: '100%' }}
      >
        {/* SATELLITE VIEW LAYER (Esri World Imagery) */}
        <TileLayer
          attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />
        
        {locations.map((driver) => (
          <Marker key={driver.id} position={[driver.lat, driver.lng]}>
            <Popup>
              <div className="text-center p-1">
                <p className="font-bold text-sm text-gray-900">{driver.busNo}</p>
                <p className="text-xs text-gray-600">Driver: {driver.driverName}</p>
                {driver.speed !== undefined && (
                  <p className="text-xs font-semibold text-emerald-600 mt-0.5">Speed: {driver.speed} km/h</p>
                )}
                <p className="text-[11px] text-gray-400 mt-1">
                  Updated: {driver.last_updated.toLocaleTimeString()}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default LiveTrackingMap;
