import React, { createContext, useContext, useState, ReactNode } from 'react';
import { XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SuccessContextType {
  triggerSuccess: (message?: string, isInstantTask?: boolean) => void;
  triggerError: (message: string) => void;
  triggerVictory: (message: string, subMessage?: string) => void;
}

const SuccessContext = createContext<SuccessContextType | undefined>(undefined);

const playErrorBeep = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.2);

    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.2);
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};

const CONFETTI_COLORS = ['#FBBF24', '#EF4444', '#3B82F6', '#10B981', '#8B5CF6'];
const CONFETTI_SHAPES = ['circle', 'square', 'triangle'];
const getConfettiPieces = () => Array.from({ length: 15 }).map((_, i) => ({
  id: i,
  color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
  shape: CONFETTI_SHAPES[Math.floor(Math.random() * CONFETTI_SHAPES.length)],
  angle: (i * 360) / 15 + (Math.random() * 20 - 10),
  velocity: 100 + Math.random() * 150,
  size: 8 + Math.random() * 8,
}));

const RANDOM_SOUNDS = ['success1.mp3', 'success2.mp3', 'success3.mp3', 'success4.mp3'];

export function SuccessProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [message, setMessage] = useState<string | undefined>();
  const [isError, setIsError] = useState(false);
  const [confetti, setConfetti] = useState(() => getConfettiPieces());

  // Victory state
  const [isVictory, setIsVictory] = useState(false);
  const [victoryMessage, setVictoryMessage] = useState('');
  const [victorySubMessage, setVictorySubMessage] = useState<string | undefined>();

  const triggerSuccess = (msg?: string, isInstantTask: boolean = true) => {
    let soundPath = '/sounds/success.mp3';
    if (isInstantTask) {
      const randomSound = RANDOM_SOUNDS[Math.floor(Math.random() * RANDOM_SOUNDS.length)];
      soundPath = `/sounds/${randomSound}`;
    }
    const audio = new Audio(soundPath);
    audio.play().catch(err => console.error('Success audio blocked:', err));

    setConfetti(getConfettiPieces());
    setMessage(msg);
    setIsError(false);
    setIsVictory(false);
    setIsActive(true);
    setTimeout(() => {
      setIsActive(false);
    }, 4000);
  };

  const triggerVictory = (msg: string, subMsg?: string) => {
    const audio = new Audio('/victory/victory.mp3');
    audio.play().catch(err => console.error('Victory audio blocked:', err));

    setVictoryMessage(msg);
    setVictorySubMessage(subMsg);
    setIsVictory(true);
    setIsError(false);
    setIsActive(true);

    setTimeout(() => {
      setIsActive(false);
      setIsVictory(false);
    }, 6500); // Auto close after ~6.5 seconds
  };

  const triggerError = (msg: string) => {
    playErrorBeep();
    setMessage(msg);
    setIsError(true);
    setIsActive(true);
    setTimeout(() => {
      setIsActive(false);
    }, 4000);
  };

  return (
    <SuccessContext.Provider value={{ triggerSuccess, triggerError, triggerVictory }}>
      {children}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/40 backdrop-blur-xl"
          >
            {isVictory ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                transition={{ duration: 0.5 }}
                className="relative w-full max-w-4xl aspect-video rounded-3xl overflow-hidden shadow-2xl mx-4"
              >
                <video
                  src="/victory/victory.mp4"
                  autoPlay
                  muted
                  playsInline
                  loop
                  className="w-full h-full object-cover absolute inset-0"
                />
                <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center p-8">
                  <motion.h2
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3, type: "spring", bounce: 0.5 }}
                    className="text-4xl md:text-6xl font-extrabold text-white text-center drop-shadow-2xl mb-4"
                  >
                    {victoryMessage}
                  </motion.h2>
                  {victorySubMessage && (
                    <motion.p
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.6, type: "spring" }}
                      className="text-xl md:text-3xl font-bold text-blue-200 text-center drop-shadow-lg"
                    >
                      {victorySubMessage}
                    </motion.p>
                  )}
                </div>
              </motion.div>
            ) : isError ? (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", bounce: 0.5 }}
              >
                <XCircle className="w-32 h-32 text-red-500" />
              </motion.div>
            ) : (
              <div className="relative flex items-center justify-center">
                {/* Confetti */}
                {confetti.map(piece => {
                  const rad = (piece.angle * Math.PI) / 180;
                  const x = Math.cos(rad) * piece.velocity;
                  const y = Math.sin(rad) * piece.velocity;
                  return (
                    <motion.div
                      key={piece.id}
                      initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
                      animate={{ x, y, scale: 1, opacity: 0, rotate: 360 + Math.random() * 360 }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                      className="absolute"
                      style={{
                        width: piece.size,
                        height: piece.size,
                        backgroundColor: piece.shape !== 'triangle' ? piece.color : 'transparent',
                        borderRadius: piece.shape === 'circle' ? '50%' : 0,
                        borderLeft: piece.shape === 'triangle' ? `${piece.size / 2}px solid transparent` : 'none',
                        borderRight: piece.shape === 'triangle' ? `${piece.size / 2}px solid transparent` : 'none',
                        borderBottom: piece.shape === 'triangle' ? `${piece.size}px solid ${piece.color}` : 'none',
                      }}
                    />
                  )
                })}

                {/* Green Circle */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 15, stiffness: 200 }}
                  className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center shadow-2xl relative z-10"
                >
                  {/* White Checkmark */}
                  <svg className="w-16 h-16 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                    <motion.path
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
                      d="M20 6L9 17l-5-5"
                    />
                  </svg>
                </motion.div>
              </div>
            )}

            {message && !isVictory && (
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="mt-8 text-3xl font-black text-gray-800 tracking-tight text-center px-4"
              >
                {message}
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </SuccessContext.Provider>
  );
}

export function useSuccess() {
  const context = useContext(SuccessContext);
  if (context === undefined) {
    throw new Error('useSuccess must be used within a SuccessProvider');
  }
  return context;
}
