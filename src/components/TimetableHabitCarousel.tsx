"use client";

import { useState, useEffect } from "react";

type Habit = {
  id: string;
  title: string;
  description: string | null;
  frequency: "DAILY" | "WEEKLY" | "MONTHLY";
  reminderTime: string | null;
  reminderEnabled: boolean;
  alarmDuration: number | null;
  collectionId: string | null;
  sortOrder: number;
  archived: boolean;
  completions: Array<{
    id: string;
    completedAt: string;
    userId: string;
  }>;
  collection: {
    id: string;
    name: string;
    color: string;
    icon: string | null;
  } | null;
};

type TimetableHabitCarouselProps = {
  habits: Habit[];
  onComplete: (habitId: string) => void;
  onEdit: (habit: Habit) => void;
  onDelete: (habitId: string) => void;
};

export default function TimetableHabitCarousel({
  habits,
  onComplete,
  onEdit,
  onDelete,
}: TimetableHabitCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  // Filter habits with reminder times and sort by time
  const timetableHabits = habits
    .filter((h) => h.reminderTime)
    .sort((a, b) => {
      const timeA = a.reminderTime || "00:00";
      const timeB = b.reminderTime || "00:00";
      return timeA.localeCompare(timeB);
    });

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Update current time every second
  useEffect(() => {
    if (!mounted) return;
    
    const updateTime = () => {
      const now = new Date();
      const hour = now.getHours() % 12 || 12;
      const period = now.getHours() < 12 ? "AM" : "PM";
      setCurrentTime(`${hour}:${now.getMinutes().toString().padStart(2, "0")} ${period}`);
    };
    
    updateTime(); // Initial update
    const timeInterval = setInterval(updateTime, 1000);
    
    return () => clearInterval(timeInterval);
  }, [mounted]);

  // Reset index if it's out of bounds (e.g., after deleting a habit)
  useEffect(() => {
    if (currentIndex >= timetableHabits.length && timetableHabits.length > 0) {
      setCurrentIndex(0);
    }
  }, [currentIndex, timetableHabits.length]);

  // Auto-advance to next habit every 5 seconds
  useEffect(() => {
    if (timetableHabits.length <= 1) return;

    const interval = setInterval(() => {
      setTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % timetableHabits.length);
        setTransitioning(false);
      }, 300);
    }, 5000);

    return () => clearInterval(interval);
  }, [timetableHabits.length]);

  const goToNext = () => {
    if (timetableHabits.length <= 1) return;
    setTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % timetableHabits.length);
      setTransitioning(false);
    }, 300);
  };

  const goToPrev = () => {
    if (timetableHabits.length <= 1) return;
    setTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + timetableHabits.length) % timetableHabits.length);
      setTransitioning(false);
    }, 300);
  };

  if (timetableHabits.length === 0) {
    return null;
  }

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="text-2xl">📅</span>
            Today&apos;s Schedule
          </h2>
          <div className="text-sm text-gray-600 dark:text-gray-400 font-mono">
            --:-- --
          </div>
        </div>
        <div className="relative bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-2xl p-8 animate-pulse">
          <div className="h-32 bg-white/10 rounded"></div>
        </div>
      </div>
    );
  }

  const currentHabit = timetableHabits[currentIndex];
  const nextHabit = timetableHabits[(currentIndex + 1) % timetableHabits.length];
  
  // Safety check - if habit is undefined, don't render
  if (!currentHabit) {
    return null;
  }
  
  const isCompletedToday = currentHabit?.completions?.some(
    (c) => new Date(c.completedAt).toDateString() === new Date().toDateString()
  ) || false;

  const formatTime = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    const hour = h % 12 || 12;
    const period = h < 12 ? "AM" : "PM";
    return `${hour}:${m.toString().padStart(2, "0")} ${period}`;
  };

  const getTimeUntil = (time: string) => {
    const now = new Date();
    const [h, m] = time.split(":").map(Number);
    const target = new Date();
    target.setHours(h, m, 0, 0);

    if (target < now) {
      target.setDate(target.getDate() + 1);
    }

    const diff = target.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `in ${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `in ${minutes}m`;
    } else {
      return "now";
    }
  };

  const isHabitTimeWindowActive = (habit: Habit) => {
    if (!habit.reminderTime || !habit.alarmDuration) return true;
    
    const now = new Date();
    const [h, m] = habit.reminderTime.split(":").map(Number);
    const startTime = new Date();
    startTime.setHours(h, m, 0, 0);
    
    // Calculate end time based on duration
    const endTime = new Date(startTime);
    if (habit.alarmDuration === -1) {
      // "Until completed" means available all day after start time
      endTime.setHours(23, 59, 59, 999);
    } else {
      endTime.setMinutes(endTime.getMinutes() + habit.alarmDuration);
    }
    
    // Check if current time is within the window
    return now >= startTime && now <= endTime;
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span className="text-2xl">📅</span>
          Today&apos;s Schedule
        </h2>
        <div className="text-sm text-gray-600 dark:text-gray-400 font-mono">
          {currentTime || "--:-- --"}
        </div>
      </div>

      <div
        className="relative"
        onMouseEnter={() => setShowUpcoming(true)}
        onMouseLeave={() => setShowUpcoming(false)}
      >
        {/* Main Habit Card */}
        <div
          className={`relative bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-2xl p-8 ${
            transitioning ? "opacity-0 scale-95" : "opacity-100 scale-100"
          }`}
        >
          {/* Time Badge */}
          <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md rounded-full px-4 py-2 border border-white/30">
            <div className="text-white font-bold text-lg">
              {formatTime(currentHabit.reminderTime!)}
            </div>
            <div className="text-white/80 text-xs text-center">
              {getTimeUntil(currentHabit.reminderTime!)}
            </div>
          </div>

          {/* Habit Info */}
          <div className="mb-6">
            <div className="text-white/70 text-sm mb-2 uppercase tracking-wide">
              Current Habit
            </div>
            <h3 className="text-3xl font-bold text-white mb-2">
              {currentHabit.title}
            </h3>
            {currentHabit.description && (
              <p className="text-white/80 text-sm">
                {currentHabit.description}
              </p>
            )}
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 bg-white/20 rounded-full h-2">
              <div
                className="bg-white rounded-full h-2 transition-all duration-500"
                style={{
                  width: `${((currentIndex + 1) / timetableHabits.length) * 100}%`,
                }}
              />
            </div>
            <div className="text-white/80 text-sm font-medium">
              {currentIndex + 1} / {timetableHabits.length}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            {!isCompletedToday ? (
              <>
                {isHabitTimeWindowActive(currentHabit) ? (
                  <button
                    onClick={() => onComplete(currentHabit.id)}
                    className="w-full bg-white text-indigo-600 font-semibold py-3 px-6 rounded-xl"
                  >
                    ✓ Mark Complete
                  </button>
                ) : (
                  <div className="w-full bg-gray-500/20 border-2 border-gray-400/50 text-gray-100 font-semibold py-3 px-6 rounded-xl text-center">
                    ⏰ Time window has passed
                  </div>
                )}
                {currentHabit.alarmDuration && (
                  <div className="text-white/60 text-xs text-center">
                    Available: {formatTime(currentHabit.reminderTime!)} - {
                      (() => {
                        const [h, m] = currentHabit.reminderTime!.split(":").map(Number);
                        const endTime = new Date();
                        endTime.setHours(h, m, 0, 0);
                        if (currentHabit.alarmDuration === -1) {
                          return "Until completed";
                        } else {
                          endTime.setMinutes(endTime.getMinutes() + currentHabit.alarmDuration);
                          return formatTime(`${endTime.getHours()}:${endTime.getMinutes().toString().padStart(2, "0")}`);
                        }
                      })()
                    }
                  </div>
                )}
              </>
            ) : (
              <div className="w-full bg-green-500/20 border-2 border-green-400/50 text-green-100 font-semibold py-3 px-6 rounded-xl text-center">
                ✓ Completed
              </div>
            )}
          </div>

          {/* Navigation Arrows */}
          {timetableHabits.length > 1 && (
            <>
              <button
                onClick={goToPrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-md rounded-full p-3 border border-white/30"
              >
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-md rounded-full p-3 border border-white/30"
              >
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Upcoming Habit Preview (on hover) */}
        {showUpcoming && timetableHabits.length > 1 && (
          <div className="absolute -bottom-20 left-0 right-0 z-10 animate-slide-up">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border-2 border-indigo-200 dark:border-indigo-700">
              <div className="flex items-center gap-4">
                <div className="bg-indigo-100 dark:bg-indigo-900 rounded-lg px-3 py-2">
                  <div className="text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                    {formatTime(nextHabit.reminderTime!)}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">
                    Up Next
                  </div>
                  <div className="text-gray-900 dark:text-white font-semibold">
                    {nextHabit.title}
                  </div>
                </div>
                <div className="text-gray-400 dark:text-gray-500 text-xs">
                  {getTimeUntil(nextHabit.reminderTime!)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
