"use client";

import { useState } from "react";
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
}: EnhancedHabitCardProps) {
  const [isAnimating, setIsAnimating] = useState(false);

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
      className="retro-card group relative bg-black border-2 border-white"
    >
      {/* Collection Badge */}
      {habit.collection && (
        <div
          className="absolute top-0 left-0 right-0 h-2 z-10"
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
                  className="w-5 h-5 bg-black border-2 border-white cursor-pointer"
                  style={{accentColor: '#ffffff'}}
                />
              </div>
            )}

            <div className="flex-1 min-w-0">
              {/* Title */}
              <h3 className="text-lg font-black text-white uppercase tracking-wide mb-1">
                {habit.title}
              </h3>
              {habit.reminderTime && (
                <span className="text-xs bg-white text-black px-2 py-1 font-bold uppercase inline-block">
                  ⏰ {(() => {
                    const [h, m] = habit.reminderTime.split(":").map(Number);
                    const hour = h % 12 || 12;
                    const period = h < 12 ? "AM" : "PM";
                    return `${hour}:${m.toString().padStart(2, "0")} ${period}`;
                  })()}
                </span>
              )}
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
          <p className="text-sm text-white mb-4 line-clamp-2 uppercase font-bold tracking-wide">
            {habit.description}
          </p>
        )}

        {/* Stats & Action */}
        <div className="flex items-center justify-between gap-4 mb-4">
          {/* Streak */}
          <div className="flex items-center gap-3">
            <div className="text-sm">
              <span className="text-white font-bold uppercase">Streak: </span>
              <span className="font-black text-white text-lg">
                {streak}
              </span>
              {streak > 0 && <span className="ml-2">🔥</span>}
            </div>

            {/* Total Completions */}
            <div className="text-xs text-white font-bold uppercase border-l-2 border-white pl-3">
              {habit.completions.length} TOTAL
            </div>
          </div>
        </div>

        {/* Mark Complete Button */}
        {!selectionMode && (
          <button
            onClick={handleComplete}
            disabled={completedToday}
            className={`w-full py-3 px-4 font-black uppercase tracking-wider border-2 transition-colors ${
              completedToday
                ? "bg-black border-white text-white opacity-50 cursor-default"
                : "bg-black border-white text-white hover:bg-white hover:text-black"
            }`}
          >
            {completedToday ? "✓ DONE TODAY" : "✓ MARK COMPLETE"}
          </button>
        )}
      </div>

      {/* Completion Celebration Overlay */}
      {isAnimating && (
        <div className="absolute inset-0 bg-white/10 pointer-events-none flex items-center justify-center">
          <div className="text-6xl animate-ping-once">✨</div>
        </div>
      )}
    </div>
  );
}
