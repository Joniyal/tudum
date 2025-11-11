"use client";

import { useRef, useState, useEffect } from "react";
import HabitMenu from "./HabitMenu";

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

type EnhancedHabitCardProps = {
  habit: Habit;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onComplete: (id: string) => void;
  onEdit: (habit: Habit) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  onShare: (id: string, title: string) => void;
  streak: number;
  completedToday: boolean;
  selectionMode: boolean;
  index: number;
  isLast: boolean;
  onShowNext: (index: number) => void;
};

export default function EnhancedHabitCard({
  habit,
  isSelected,
  onSelect,
  onComplete,
  onEdit,
  onDelete,
  onArchive,
  onShare,
  streak,
  completedToday,
  selectionMode,
  index,
  isLast,
  onShowNext,
}: EnhancedHabitCardProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const triggerNextHabit = () => {
    if (isLast) {
      hoverTimeoutRef.current = null;
      return;
    }
    hoverTimeoutRef.current = null;
    onShowNext(index);
  };

  const handleHoverStart = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    if (isLast) return;
    hoverTimeoutRef.current = setTimeout(triggerNextHabit, 150);
  };

  const handleHoverEnd = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  const handleComplete = async () => {
    if (completedToday) return;
    
    setIsAnimating(true);
    await onComplete(habit.id);
    
    setTimeout(() => {
      setIsAnimating(false);
    }, 1000);
  };

  const frequencyColors = {
    DAILY: "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300",
    WEEKLY: "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300",
    MONTHLY: "bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300",
  };

  return (
    <div
      data-habit-card="true"
      data-habit-card-id={habit.id}
      onMouseEnter={handleHoverStart}
      onMouseLeave={handleHoverEnd}
      className={`group relative bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 ease-in-out overflow-hidden border border-gray-100 dark:border-gray-700 ${
        isSelected ? "ring-4 ring-indigo-500 scale-105" : ""
      } ${isAnimating ? "animate-bounce-subtle" : ""} ${
        completedToday ? "opacity-90" : ""
      }`}
    >
      {/* Collection Badge */}
      {habit.collection && (
        <div
          className="absolute top-0 left-0 right-0 h-2 transition-all duration-300 z-10"
          style={{
            background: `linear-gradient(90deg, ${habit.collection.color} 0%, ${habit.collection.color}dd 100%)`,
          }}
        />
      )}

      <div className="relative z-10 p-6 pt-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 flex items-start gap-3">
            {/* Checkbox (in selection mode) */}
            {selectionMode && (
              <div className="flex-shrink-0 pt-1">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onSelect(habit.id)}
                  className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                />
              </div>
            )}

            {/* Collection Icon */}
            {habit.collection?.icon && (
              <span className="text-2xl flex-shrink-0">{habit.collection.icon}</span>
            )}

            <div className="flex-1 min-w-0">
              {/* Title */}
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors duration-300">
                  {habit.title}
                </h3>
                {habit.reminderTime && (
                  <span className="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-full font-medium">
                    ⏰{" "}
                    {(() => {
                      const [h, m] = habit.reminderTime.split(":").map(Number);
                      const hour = h % 12 || 12;
                      const period = h < 12 ? "AM" : "PM";
                      return `${hour}:${m.toString().padStart(2, "0")} ${period}`;
                    })()}
                  </span>
                )}
              </div>

              {/* Collection Name & Frequency */}
              <div className="flex items-center gap-2 flex-wrap">
                {habit.collection && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full"
                    style={{
                      backgroundColor: `${habit.collection.color}20`,
                      color: habit.collection.color,
                    }}
                  >
                    {habit.collection.name}
                  </span>
                )}
                <span
                  className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                    frequencyColors[habit.frequency]
                  }`}
                >
                  {habit.frequency}
                </span>
              </div>
            </div>
          </div>

          {/* Menu (hidden in selection mode) */}
          {!selectionMode && (
            <HabitMenu
              habitId={habit.id}
              onEdit={() => onEdit(habit)}
              onDelete={() => onDelete(habit.id)}
              onArchive={() => onArchive(habit.id)}
              isArchived={habit.archived}
            />
          )}
        </div>

        {/* Description */}
        {habit.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
            {habit.description}
          </p>
        )}

        {/* Stats & Action */}
        <div className="flex items-center justify-between gap-4">
          {/* Streak */}
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-gray-600 dark:text-gray-400">Streak: </span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                {streak} {streak === 1 ? "day" : "days"}
              </span>
              {streak > 0 && <span className="ml-1">🔥</span>}
            </div>

            {/* Total Completions */}
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {habit.completions.length} total
            </div>
          </div>

          {/* Complete Button */}
          {!selectionMode && (
            <button
              onClick={handleComplete}
              disabled={completedToday}
              className={`px-4 py-2 rounded-lg font-medium transition-all transform ${
                completedToday
                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 cursor-default"
                  : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white hover:scale-105 active:scale-95"
              }`}
            >
              {completedToday ? "✓ Done" : "Mark Complete"}
            </button>
          )}
        </div>

        {/* Share Button (visible on hover when not in selection mode) */}
        {!selectionMode && (
          <button
            onClick={() => onShare(habit.id, habit.title)}
            className="absolute top-4 right-14 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg text-sm font-medium"
            title="Share this habit"
          >
            📤
          </button>
        )}
      </div>

      {/* Completion Celebration Overlay */}
      {isAnimating && (
        <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-blue-400/20 pointer-events-none flex items-center justify-center">
          <div className="text-6xl animate-ping-once">✨</div>
        </div>
      )}
    </div>
  );
}
