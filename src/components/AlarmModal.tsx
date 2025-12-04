"use client";

import { useEffect, useState, useRef } from "react";
import { ClockIcon } from "./Icons";

type AlarmModalProps = {
  habit: {
    id: string;
    title: string;
    description: string | null;
    alarmDuration: number | null;
  };
  triggeredAt: Date;
  onDismiss: () => void;
  onSnooze: (minutes: number) => void;
  onComplete: () => void;
};

export default function AlarmModal({
  habit,
  triggeredAt,
  onDismiss,
  onSnooze,
  onComplete,
}: AlarmModalProps) {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate if alarm should auto-stop
  const alarmDurationMs = habit.alarmDuration && habit.alarmDuration > 0 
    ? habit.alarmDuration * 60 * 1000 
    : Infinity;
  
  const shouldAutoStop = timeElapsed >= alarmDurationMs && habit.alarmDuration !== -1;

  useEffect(() => {
    // Create a looping alarm sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Set alarm tone (beep pattern)
    oscillator.frequency.value = 800; // 800Hz tone
    oscillator.type = "sine";
    
    // Set volume
    gainNode.gain.value = 0.3;

    // Create beep pattern
    let isPlaying = true;
    const beepPattern = () => {
      if (!isPlaying) return;
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.3);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 0.5);
      gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.8);
      
      setTimeout(beepPattern, 2000); // Repeat every 2 seconds
    };

    oscillator.start();
    beepPattern();

    // Track elapsed time
    const startTime = triggeredAt.getTime();
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setTimeElapsed(elapsed);
      
      // Auto-stop if duration reached
      if (elapsed >= alarmDurationMs && habit.alarmDuration !== -1) {
        isPlaying = false;
        onDismiss();
      }
    }, 1000);

    // Cleanup
    return () => {
      isPlaying = false;
      oscillator.stop();
      audioContext.close();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [habit.alarmDuration, alarmDurationMs, onDismiss, triggeredAt]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleSnooze = (minutes: number) => {
    onSnooze(minutes);
  };

  return (
    <>
      <style>{`
        @keyframes subtle-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(255, 255, 255, 0.5), 8px 8px 0px rgba(255, 255, 255, 0.3); }
          50% { box-shadow: 0 0 30px rgba(255, 255, 255, 0.8), 8px 8px 0px rgba(255, 255, 255, 0.5); }
        }
        .alarm-modal {
          animation: subtle-glow 2s ease-in-out infinite;
        }
      `}</style>
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
        <div className="alarm-modal bg-black border-4 border-white max-w-md w-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white border-2 border-white rounded-full flex items-center justify-center">
                <ClockIcon className="w-6 h-6 text-black" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-wider">
                  {habit.title}
                </h2>
                <p className="text-sm text-white font-bold uppercase tracking-wide">
                  TIME TO COMPLETE!
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          {habit.description && (
            <div className="mb-4 p-3 bg-black border-2 border-white">
              <p className="text-sm text-white font-bold">
                {habit.description}
              </p>
            </div>
          )}

          {/* Timer */}
          <div className="mb-6 text-center">
            <div className="text-6xl font-mono font-black text-white mb-2 tracking-widest">
              {formatTime(timeElapsed)}
            </div>
            <p className="text-xs text-white font-bold uppercase tracking-wide">
              {habit.alarmDuration === -1 
                ? "ALARM PLAYS UNTIL COMPLETED"
                : `STOPS IN ${formatTime(alarmDurationMs - timeElapsed)}`
              }
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Mark Complete */}
            <button
              onClick={onComplete}
              className="w-full px-6 py-4 bg-white text-black font-black uppercase border-2 border-white hover:bg-black hover:text-white hover:border-white transition text-lg tracking-wider"
            >
              ✓ MARK COMPLETE
            </button>

            {/* Snooze Options */}
            <div className="flex gap-2">
              <button
                onClick={() => handleSnooze(1)}
                className="flex-1 px-4 py-3 bg-black border-2 border-white text-white font-black uppercase hover:bg-white hover:text-black transition tracking-wider"
              >
                SNOOZE 1M
              </button>
              <button
                onClick={() => handleSnooze(2)}
                className="flex-1 px-4 py-3 bg-black border-2 border-white text-white font-black uppercase hover:bg-white hover:text-black transition tracking-wider"
              >
                SNOOZE 2M
              </button>
              <button
                onClick={() => handleSnooze(5)}
                className="flex-1 px-4 py-3 bg-black border-2 border-white text-white font-black uppercase hover:bg-white hover:text-black transition tracking-wider"
              >
                SNOOZE 5M
              </button>
            </div>

            {/* Dismiss */}
            <button
              onClick={onDismiss}
              className="w-full px-6 py-3 bg-black border-2 border-white text-white font-black uppercase hover:bg-white hover:text-black transition tracking-wider"
            >
              DISMISS
            </button>
          </div>

          {/* Warning for "Until completed" */}
          {habit.alarmDuration === -1 && (
            <div className="mt-4 p-3 bg-black border-2 border-white">
              <p className="text-xs text-white text-center font-black uppercase tracking-wider">
                ⚠️ ALARM PLAYS UNTIL COMPLETED!
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
