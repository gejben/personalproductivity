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

  // Reset timer when mode changes
  useEffect(() => {
    setMinutes(modes[mode].minutes);
    setSeconds(0);
    setIsActive(false);
    document.documentElement.style.setProperty('--timer-color', modes[mode].color);
  }, [mode, modes]);

  // Handle timer completion
  const handleTimerComplete = useCallback(() => {
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

    if (isActive) {
      interval = setInterval(() => {
        if (seconds === 0) {
          if (minutes === 0) {
            // Timer completed
            clearInterval(interval as NodeJS.Timeout);
            setIsActive(false);
            playAlarm();
            handleTimerComplete();
          } else {
            setMinutes(minutes - 1);
            setSeconds(59);
          }
        } else {
          setSeconds(seconds - 1);
        }
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, minutes, seconds, handleTimerComplete]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setMinutes(modes[mode].minutes);
    setSeconds(0);
  };

  const changeMode = (newMode: TimerMode) => {
    setMode(newMode);
  };

  const playAlarm = () => {
    // Play a sound when timer completes
    const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3');
    audio.play();
  };

  // Format time to display
  const formatTime = () => {
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;
    return `${formattedMinutes}:${formattedSeconds}`;
  };

  const getModeLabel = (modeType: TimerMode) => {
    return modes[modeType].label;
  };

  return (
    <PomodoroContext.Provider
      value={{
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
      }}
    >
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