import React, { useEffect, useRef, useState } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { Camera, MapPin, ScanFace, CheckCircle, X } from 'lucide-react';

interface SelfAttendanceScannerProps {
  mode: 'checkIn' | 'checkOut';
  onSuccess: (timeString: string) => void;
  onClose: () => void;
}

export function SelfAttendanceScanner({ mode, onSuccess, onClose }: SelfAttendanceScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [step, setStep] = useState<'feed' | 'verifying' | 'gps' | 'success'>('feed');

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(s => {
        activeStream = s;
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      })
      .catch(err => {
        console.error("Camera access denied or unavailable", err);
      });

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    setStep('verifying');
    setTimeout(() => {
      setStep('gps');
      setTimeout(() => {
        setStep('success');
        setTimeout(() => {
          onSuccess(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
        }, 1000);
      }, 1500);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <GlassCard className="w-full max-w-md p-0 overflow-hidden bg-white/80 border-white shadow-2xl rounded-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        
        <div className="p-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 flex flex-col items-center">
          <h3 className="text-xl font-black text-gray-800 tracking-tight">
            Biometric {mode === 'checkIn' ? 'Check-In' : 'Check-Out'}
          </h3>
          <p className="text-sm font-semibold text-gray-500 mt-1">Please align your face within the frame</p>
        </div>

        <div className="relative aspect-square bg-gray-900 w-full overflow-hidden flex items-center justify-center">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className={`w-full h-full object-cover transition-opacity duration-500 ${step !== 'feed' ? 'opacity-30' : 'opacity-100'}`}
          />
          
          {step === 'feed' && (
            <div className="absolute inset-0 border-4 border-[#A05C2B]/40 border-dashed m-12 rounded-full animate-[spin_10s_linear_infinite]" />
          )}

          {step === 'verifying' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white animate-in zoom-in duration-300">
              <ScanFace className="w-16 h-16 text-[#A05C2B] mb-4 animate-pulse" />
              <p className="font-bold tracking-widest uppercase">Verifying Face...</p>
            </div>
          )}

          {step === 'gps' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white animate-in zoom-in duration-300">
              <MapPin className="w-16 h-16 text-[#A05C2B] mb-4 animate-bounce" />
              <p className="font-bold tracking-widest uppercase">Fetching GPS...</p>
            </div>
          )}

          {step === 'success' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white animate-in zoom-in duration-300">
              <CheckCircle className="w-20 h-20 text-emerald-400 mb-4" />
              <p className="font-bold tracking-widest uppercase text-emerald-400">Success</p>
            </div>
          )}
        </div>

        <div className="p-6 bg-white flex justify-center">
          <button 
            onClick={handleCapture}
            disabled={step !== 'feed' || !stream}
            className="w-full bg-[#A05C2B] text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-md hover:bg-[#8B4E24] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
          >
            <Camera className="w-5 h-5" /> Capture
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
