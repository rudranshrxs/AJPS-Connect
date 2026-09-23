import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Loader2, CheckCircle, AlertCircle, MapPin } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import imageCompression from 'browser-image-compression';

interface TeacherLiveAttendanceProps {
  mode: 'checkIn' | 'checkOut';
  referenceImageBase64?: string;
  schoolLatitude?: number;
  schoolLongitude?: number;
  onSuccess: (timeString: string) => void;
  onClose: () => void;
}

// Haversine formula to calculate distance in meters
function getDistanceFromLatLonInM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Radius of the earth in m
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  const d = R * c; 
  return d;
}

export function TeacherLiveAttendance({ mode, referenceImageBase64, schoolLatitude, schoolLongitude, onSuccess, onClose }: TeacherLiveAttendanceProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'locating' | 'verifying' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Open camera immediately when component mounts
    if (cameraInputRef.current && status === 'idle') {
      if (!referenceImageBase64) {
        setStatus('error');
        setErrorMsg('Face ID is not set up. Please update your profile first.');
        return;
      }
      cameraInputRef.current.click();
    }
  }, [status, referenceImageBase64]);

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      onClose();
      return;
    }

    try {
      setIsProcessing(true);
      
      // Step 1: Location Verification
      if (schoolLatitude && schoolLongitude) {
        setStatus('locating');
        
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { 
            enableHighAccuracy: true, timeout: 10000, maximumAge: 0 
          });
        }).catch(() => null);

        if (!position) {
          throw new Error('Failed to get your location. Please ensure location services are enabled.');
        }

        const distance = getDistanceFromLatLonInM(
          position.coords.latitude, position.coords.longitude,
          schoolLatitude, schoolLongitude
        );

        if (distance > 200) {
          throw new Error(`You are too far from the school. (${Math.round(distance)}m away)`);
        }
      }

      setStatus('verifying');
      
      // Step 2: Image Compression
      const options = {
        maxSizeMB: 0.1,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);
      
      // Step 3: Base64 Conversion
      const reader = new FileReader();
      reader.onload = async () => {
        const base64data = reader.result as string;
        await verifyFaceWithGemini(base64data.split(',')[1], compressedFile.type);
      };
      reader.readAsDataURL(compressedFile);

    } catch (err: any) {
      console.error('Error processing camera capture', err);
      setStatus('error');
      setErrorMsg(err.message || 'Failed to process image.');
      setIsProcessing(false);
    }
  };

  const verifyFaceWithGemini = async (liveBase64: string, mimeType: string) => {
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Gemini API key is not configured.');
      }
      
      if (!referenceImageBase64) {
        throw new Error('No reference Face ID found for user.');
      }
      
      const refBase64 = referenceImageBase64.includes(',') ? referenceImageBase64.split(',')[1] : referenceImageBase64;
      const refMime = referenceImageBase64.includes(',') ? referenceImageBase64.split(';')[0].split(':')[1] : 'image/jpeg';

      const prompt = `You are a Face Verification AI. Compare these two faces. Are they the exact same person? Return STRICTLY raw JSON: { "match": boolean, "confidence": number }.`;
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              role: 'user',
              parts: [
                { inlineData: { mimeType: refMime, data: refBase64 } },
                { inlineData: { mimeType, data: liveBase64 } },
                { text: prompt }
              ]
            }],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: 'application/json'
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to reach AI verification service');
      }

      const data = await response.json();
      const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!textOutput) throw new Error('Invalid response from AI');

      let cleanJson = textOutput.trim();
      if (cleanJson.startsWith('```json')) {
        cleanJson = cleanJson.replace(/```json/g, '').replace(/```/g, '').trim();
      } else if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/```/g, '').trim();
      }

      const result = JSON.parse(cleanJson);
      
      if (result.match === true) {
        setStatus('success');
        setTimeout(() => {
          const now = new Date();
          const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
          onSuccess(timeString);
        }, 1500);
      } else {
        setStatus('error');
        setErrorMsg('Face Verification Failed.');
      }

    } catch (err: any) {
      console.error('AI Verification Error:', err);
      setStatus('error');
      setErrorMsg(err.message || 'Verification failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={handleCapture}
      />
      
      <GlassCard className="w-full max-w-sm max-h-[90vh] overflow-y-auto p-6 bg-white flex flex-col items-center justify-center text-center relative shadow-2xl rounded-2xl">
        <button 
          onClick={onClose}
          disabled={isProcessing}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-4 mt-2">
          {status === 'idle' && (
            <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Camera className="w-8 h-8" />
            </div>
          )}
          
          {status === 'locating' && (
            <div className="w-16 h-16 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 animate-bounce" />
            </div>
          )}

          {status === 'verifying' && (
            <div className="w-16 h-16 rounded-full bg-[#FDF3E7] text-[#C5873A] flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          )}
          
          {status === 'success' && (
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-4 scale-in">
              <CheckCircle className="w-8 h-8" />
            </div>
          )}
          
          {status === 'error' && (
            <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4 shake">
              <AlertCircle className="w-8 h-8" />
            </div>
          )}
        </div>

        <h3 className="text-lg font-bold text-gray-900 mb-1">
          {status === 'idle' ? 'Ready to Capture' : 
           status === 'locating' ? 'Verifying Location...' :
           status === 'verifying' ? 'Verifying Face ID...' : 
           status === 'success' ? 'Verification Successful' : 'Verification Failed'}
        </h3>
        
        <p className="text-sm text-gray-500 mb-6">
          {status === 'idle' ? 'Please take a clear photo of your face.' : 
           status === 'locating' ? 'Checking distance from school...' :
           status === 'verifying' ? 'AI is analyzing your face...' : 
           status === 'success' ? `Marking ${mode === 'checkIn' ? 'Check-in' : 'Check-out'}...` : errorMsg}
        </p>

        {status === 'error' && (
           <button 
             onClick={() => { setStatus('idle'); setErrorMsg(''); cameraInputRef.current?.click(); }}
             className="w-full bg-[#8B5E2E] hover:bg-[#7A4F26] text-white py-3 rounded-xl font-bold transition-colors shadow-md"
           >
             Try Again
           </button>
        )}
      </GlassCard>
    </div>
  );
}
