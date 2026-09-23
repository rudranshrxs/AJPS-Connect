import React, { useEffect } from 'react';
import { motion } from 'motion/react';

export function TaskLoader() {
  useEffect(() => {
    const audio = new Audio('/drum.mp3');
    audio.loop = true;
    audio.play().catch(err => console.error("Audio playback failed:", err));

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-blue-900/40 backdrop-blur-md">
      <div className="relative w-24 h-24">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {/* Blue circle */}
          <div className="absolute top-0 w-8 h-8 bg-[#3B82F6] rounded-full shadow-lg" />
          {/* Green circle */}
          <div className="absolute bottom-0 w-8 h-8 bg-[#10B981] rounded-full shadow-lg" />
        </motion.div>
      </div>
    </div>
  );
}
