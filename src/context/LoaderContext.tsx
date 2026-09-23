import React, { createContext, useContext, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface LoaderContextType {
  runWithLoader: (action: () => void) => void;
}
const LoaderContext = createContext<LoaderContextType | undefined>(undefined);

export const LoaderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);

  const runWithLoader = (action: () => void) => {
    setIsLoading(true);
    const drumAudio = new Audio('/drum.mp3');
    drumAudio.loop = true;
    drumAudio.play().catch(e => console.error("Audio blocked:", e));

    setTimeout(() => {
      setIsLoading(false);
      drumAudio.pause();
      drumAudio.currentTime = 0;
      action(); // Execute the actual database/state update here
    }, 4000); // EXACTLY 4 SECONDS
  };

  return (
    <LoaderContext.Provider value={{ runWithLoader }}>
      {children}
      <AnimatePresence>
        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-blue-900/60 backdrop-blur-md">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }} className="relative w-20 h-20 mb-6">
              <motion.div className="absolute w-10 h-10 bg-blue-500 rounded-full top-0 left-0 shadow-lg" />
              <motion.div className="absolute w-10 h-10 bg-green-500 rounded-full bottom-0 right-0 shadow-lg" />
            </motion.div>
            <p className="text-white font-bold tracking-widest uppercase animate-pulse">Syncing Database...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </LoaderContext.Provider>
  );
};
export const useLoader = () => {
  const context = useContext(LoaderContext);
  if (!context) throw new Error('useLoader missing provider');
  return context;
};
