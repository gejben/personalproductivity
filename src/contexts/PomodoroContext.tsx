import React, { createContext, useState, useContext, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { useUser } from './UserContext';

type TimerMode = 'work' | 'shortBreak' | 'longBreak';

interface PomodoroContextType {
  minutes: number;
  seconds: number;
  isActive: boolean;
  mode: TimerMode;
  cycles: number;
  toggleTimer: () => void;
  resetTimer: () => void;
  changeMode: (mode: TimerMode) => void;
  formatTime: () => string;
  getModeLabel: (mode: TimerMode) => string;
}

const PomodoroContext = createContext<PomodoroContextType | undefined>(undefined);

interface PomodoroProviderProps {
  children: ReactNode;
}

export const PomodoroProvider: React.FC<PomodoroProviderProps> = ({ children }) => {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<TimerMode>('work');
  const [cycles, setCycles] = useState(0);
  const { getUserStorageKey } = useUser();

  // Use useMemo to prevent the modes object from being recreated on every render
  const modes = useMemo(() => ({
    work: { label: 'Work', minutes: 25, color: '#f44336' },
    shortBreak: { label: 'Short Break', minutes: 5, color: '#4caf50' },
    longBreak: { label: 'Long Break', minutes: 15, color: '#2196f3' },
  }), []);

  // Load pomodoro state from localStorage
  useEffect(() => {
    const savedCycles = localStorage.getItem(getUserStorageKey('pomodoro_cycles'));
    if (savedCycles) {
      setCycles(parseInt(savedCycles, 10));
    }
  }, [getUserStorageKey]);

  // Save cycles to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(getUserStorageKey('pomodoro_cycles'), cycles.toString());
  }, [cycles, getUserStorageKey]);

  const resetTimerToMode = useCallback((newMode: TimerMode) => {
    setMinutes(modes[newMode].minutes);
    setSeconds(0);
    setIsActive(false);
    document.documentElement.style.setProperty('--timer-color', modes[newMode].color);
  }, [modes]);

  // Reset timer when mode changes
  useEffect(() => {
    resetTimerToMode(mode);
  }, [mode, resetTimerToMode]);

  // Handle timer completion
  const handleTimerComplete = useCallback(() => {
    const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3');
    audio.play();

    if (mode === 'work') {
      const newCycles = cycles + 1;
      setCycles(newCycles);
      
      // After 4 work cycles, take a long break
      if (newCycles % 4 === 0) {
        setMode('longBreak');
      } else {
        setMode('shortBreak');
      }
    } else {
      setMode('work');
    }
  }, [cycles, mode]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && (minutes > 0 || seconds > 0)) {
      interval = setInterval(() => {
        if (seconds === 0) {
          if (minutes === 0) {
            // Timer completed
            clearInterval(interval as NodeJS.Timeout);
            setIsActive(false);
            handleTimerComplete();
          } else {
            setMinutes(prev => prev - 1);
            setSeconds(59);
          }
        } else {
          setSeconds(prev => prev - 1);
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, minutes, seconds, handleTimerComplete]);

  const toggleTimer = useCallback(() => {
    setIsActive(prev => !prev);
  }, []);

  const resetTimer = useCallback(() => {
    setIsActive(false);
    resetTimerToMode(mode);
  }, [mode, resetTimerToMode]);

  const changeMode = useCallback((newMode: TimerMode) => {
    setMode(newMode);
  }, []);

  const formatTime = useCallback(() => {
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;
    return `${formattedMinutes}:${formattedSeconds}`;
  }, [minutes, seconds]);

  const getModeLabel = useCallback((modeType: TimerMode) => {
    return modes[modeType].label;
  }, [modes]);

  const value = useMemo(() => ({
    minutes,
    seconds,
    isActive,
    mode,
    cycles,
    toggleTimer,
    resetTimer,
    changeMode,
    formatTime,
    getModeLabel,
  }), [
    minutes,
    seconds,
    isActive,
    mode,
    cycles,
    toggleTimer,
    resetTimer,
    changeMode,
    formatTime,
    getModeLabel,
  ]);

  return (
    <PomodoroContext.Provider value={value}>
      {children}
    </PomodoroContext.Provider>
  );
};

// Custom hook to use the pomodoro context
export const usePomodoro = (): PomodoroContextType => {
  const context = useContext(PomodoroContext);
  if (context === undefined) {
    throw new Error('usePomodoro must be used within a PomodoroProvider');
  }
  return context;
};

export default PomodoroContext; 