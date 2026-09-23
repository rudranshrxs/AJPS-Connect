import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
// Note: You need to set up Firebase in your PWA to use these imports
// import { collection, onSnapshot } from 'firebase/firestore';
// import { db } from '../../lib/firebase';

// Fix Leaflet marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface DriverLocation {
  id: string;
  lat: number;
  lng: number;
  last_updated: Date;
}

const LiveTrackingMap: React.FC = () => {
  const [locations, setLocations] = useState<DriverLocation[]>([]);

  useEffect(() => {
    // TODO: Yahan Firebase Listener aayega jo real-time data layega
    // const unsubscribe = onSnapshot(collection(db, 'driver_data'), (snapshot) => {
    //   const newLocations = snapshot.docs.map(doc => ({
    //     id: doc.id,
    //     lat: doc.data().location?.lat || 0,
    //     lng: doc.data().location?.lng || 0,
    //     last_updated: doc.data().location?.last_updated?.toDate() || new Date()
    //   }));
    //   setLocations(newLocations);
    // });
    // return () => unsubscribe();

    // Dummy data for now
    setLocations([
      { id: 'DRIVER_123', lat: 28.7041, lng: 77.1025, last_updated: new Date() }
    ]);
  }, []);

  return (
    <div className="h-[400px] w-full rounded-xl overflow-hidden shadow-lg border border-gray-200">
      <MapContainer 
        center={[28.7041, 77.1025]} 
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
              <div className="text-center">
                <p className="font-bold text-sm">Driver: {driver.id}</p>
                <p className="text-xs text-gray-500">
                  Last Updated: {driver.last_updated.toLocaleTimeString()}
                </p>
                <p className="text-xs text-blue-600 font-semibold mt-1">Status: Active</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default LiveTrackingMap;
