import { useState, useEffect, useRef } from 'react';
import { LocationPoint } from '../types';

// School coordinates (Exact Admin-defined Center - Amar Jyoti Public School)
const SCHOOL_COORDS = { lat: 26.34234319025205, lng: 78.94191526267173 };

// Haversine formula to calculate distance in meters
function getDistanceFromLatLonInM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Radius of the earth in m
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Distance in m
  return d;
}

export function useTransportTracking(busId: string | undefined) {
  const [isTracking, setIsTracking] = useState(false);
  const isTrackingRef = useRef(false);
  const [statusMsg, setStatusMsg] = useState('Initializing...');
  const [currentPos, setCurrentPos] = useState<{lat: number, lng: number} | null>(null);
  
  const [isTimeWindowActive, setIsTimeWindowActive] = useState(false);

  useEffect(() => {
    if (!busId) return;

    // 1. Time & Leave Check
    const checkTimeWindow = () => {
      const now = new Date();
      if (now.getDay() === 0) {
        setStatusMsg('Disabled: Holiday');
        setIsTimeWindowActive(false);
        return false;
      }

      // Time Window: assemblyTime (08:00 AM) and dispersalTime (14:00/02:00 PM)
      // Active ONLY between (08:00 - 2 = 06:00 AM) and (14:00 + 3 = 17:00/05:00 PM)
      const currentHour = now.getHours();
      if (currentHour >= 6 && currentHour <= 17) {
        setIsTimeWindowActive(true);
        return true;
      } else {
        setStatusMsg('Disabled: Outside Time Window');
        setIsTimeWindowActive(false);
        return false;
      }
    };

    const active = checkTimeWindow();
    
    // Check every minute if window state changes
    const timeInterval = setInterval(checkTimeWindow, 60000);

    return () => clearInterval(timeInterval);
  }, [busId]);

  useEffect(() => {
    if (!isTimeWindowActive || !busId) {
      setIsTracking(false);
      isTrackingRef.current = false;
      return;
    }

    let watchId: number;

    const handlePositionUpdate = (position: GeolocationPosition) => {
      const { latitude, longitude, speed } = position.coords;
      const timestamp = position.timestamp;
      
      setCurrentPos({ lat: latitude, lng: longitude });

      // 2. The Geofence Trigger
      const distance = getDistanceFromLatLonInM(SCHOOL_COORDS.lat, SCHOOL_COORDS.lng, latitude, longitude);
      
      if (distance > 100) {
        if (!isTrackingRef.current) {
          setIsTracking(true);
          isTrackingRef.current = true;
          setStatusMsg('Live Tracking Active');
        }

        const point: LocationPoint = {
          lat: latitude,
          lng: longitude,
          timestamp,
          speed: speed || 0,
          isOfflineCached: !navigator.onLine
        };

        // Network Resilience (Offline Caching)
        if (!navigator.onLine) {
          try {
            const cached = JSON.parse(localStorage.getItem(`offline_route_${busId}`) || '[]');
            // Protect against QuotaExceededError by keeping max 500 points
            if (cached.length > 500) cached.shift(); 
            cached.push(point);
            localStorage.setItem(`offline_route_${busId}`, JSON.stringify(cached));
            setStatusMsg('Offline - Caching Route');
          } catch (e) {
             console.error('Offline caching failed', e);
          }
        } else {
          // Send to active route
          try {
            const liveRoute = JSON.parse(localStorage.getItem(`live_route_${busId}`) || '[]');
            liveRoute.push(point);
            localStorage.setItem(`live_route_${busId}`, JSON.stringify(liveRoute));
            setStatusMsg('Live Tracking Active');
          } catch (e) {
            console.error('Live tracking saving failed', e);
          }
        }
      } else {
        setIsTracking(false);
        isTrackingRef.current = false;
        setStatusMsg('Idle at Campus');
      }
    };

    const handleError = (error: GeolocationPositionError) => {
      setStatusMsg(`Location Error: ${error.message}`);
      setIsTracking(false);
      isTrackingRef.current = false;
    };

    // Start watching position
    if ('geolocation' in navigator) {
      setStatusMsg('Acquiring GPS Signal...');
      watchId = navigator.geolocation.watchPosition(handlePositionUpdate, handleError, {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000
      });
    } else {
      setStatusMsg('Geolocation not supported');
    }

    // Network Event Listeners
    const handleOnline = () => {
      setStatusMsg('Back Online - Syncing...');
      const cached = JSON.parse(localStorage.getItem(`offline_route_${busId}`) || '[]');
      if (cached.length > 0) {
        const liveRoute = JSON.parse(localStorage.getItem(`live_route_${busId}`) || '[]');
        const updatedRoute = [...liveRoute, ...cached];
        localStorage.setItem(`live_route_${busId}`, JSON.stringify(updatedRoute));
        localStorage.removeItem(`offline_route_${busId}`);
      }
      if (isTrackingRef.current) setStatusMsg('Live Tracking Active');
    };

    const handleOffline = () => {
      if (isTrackingRef.current) setStatusMsg('Offline - Caching Route');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isTimeWindowActive, busId]); // Removed isTracking from dependencies

  return { isTracking, statusMsg, currentPos, schoolCoords: SCHOOL_COORDS };
}
