"use client";

import { useEffect, useState, useRef } from "react";

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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-pulse">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border-4 border-red-500 animate-bounce">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center animate-ping">
              <span className="text-2xl">⏰</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {habit.title}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Time to complete your habit!
              </p>
            </div>
          </div>
        </div>

        {/* Description */}
        {habit.description && (
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {habit.description}
            </p>
          </div>
        )}

        {/* Timer */}
        <div className="mb-6 text-center">
          <div className="text-4xl font-mono font-bold text-red-600 dark:text-red-400 mb-2">
            {formatTime(timeElapsed)}
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {habit.alarmDuration === -1 
              ? "Alarm will play until completed"
              : `Stops in ${formatTime(alarmDurationMs - timeElapsed)}`
            }
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Mark Complete */}
          <button
            onClick={onComplete}
            className="w-full px-6 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            ✓ Mark Complete
          </button>

          {/* Snooze Options */}
          <div className="flex gap-2">
            <button
              onClick={() => handleSnooze(1)}
              className="flex-1 px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition shadow-md hover:shadow-lg"
            >
              Snooze 1m
            </button>
            <button
              onClick={() => handleSnooze(2)}
              className="flex-1 px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition shadow-md hover:shadow-lg"
            >
              Snooze 2m
            </button>
            <button
              onClick={() => handleSnooze(5)}
              className="flex-1 px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition shadow-md hover:shadow-lg"
            >
              Snooze 5m
            </button>
          </div>

          {/* Dismiss */}
          <button
            onClick={onDismiss}
            className="w-full px-6 py-3 bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition"
          >
            Dismiss
          </button>
        </div>

        {/* Warning for "Until completed" */}
        {habit.alarmDuration === -1 && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-xs text-red-700 dark:text-red-300 text-center font-medium">
              ⚠️ This alarm will keep playing until you mark it complete!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
