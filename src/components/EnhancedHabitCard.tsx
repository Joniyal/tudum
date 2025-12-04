"use client";

import { useState } from "react";
import HabitMenu from "./HabitMenu";
import { ClockIcon, FireIcon, SparklesIcon } from "./Icons";

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

  return (
    <div
      data-habit-card="true"
      data-habit-card-id={habit.id}
      className="retro-panel group relative hover-lift animate-fade-in"
    >
      {/* Collection Badge */}
      {habit.collection && (
        <div
          className="absolute top-0 left-0 right-0 h-2 z-10 opacity-20"
          style={{
            background: `repeating-linear-gradient(90deg, var(--border), var(--border) 8px, transparent 8px, transparent 16px)`,
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
                  className="w-5 h-5 border-2 border-[color:var(--border)] cursor-pointer"
                />
              </div>
            )}

            <div className="flex-1 min-w-0">
              {/* Title */}
              <h3 className="retro-heading text-base mb-2">
                {habit.title}
              </h3>
              {habit.reminderTime && (
                <span className="retro-tag text-[0.65rem] inline-block flex items-center gap-2">
                    <ClockIcon className="w-4 h-4" /> {(() => {
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
          <p className="retro-text-muted text-xs mb-4 line-clamp-2 uppercase tracking-wide">
            {habit.description}
          </p>
        )}

        {/* Stats & Action */}
        <div className="flex items-center justify-between gap-4 mb-4 pb-4 border-b-2 border-[color:var(--border)]">
          {/* Streak */}
          <div className="flex items-center gap-3">
            <div className="text-sm">
              <span className="retro-text-muted font-bold uppercase tracking-wide">Streak: </span>
              <span className="font-black text-lg">
                {streak}
              </span>
              {streak > 0 && <span className="ml-2"><FireIcon className="w-4 h-4 inline" /></span>}
            </div>

            {/* Total Completions */}
            <div className="retro-text-muted text-xs font-bold uppercase border-l-2 border-[color:var(--border)] pl-3">
              {habit.completions.length} TOTAL
            </div>
          </div>
        </div>

        {/* Mark Complete Button */}
        {!selectionMode && (
          <button
            onClick={handleComplete}
            disabled={completedToday}
            className={`retro-button w-full text-xs ${
              completedToday
                ? "opacity-50 cursor-default"
                : ""
            }`}
          >
            {completedToday ? "✓ DONE TODAY" : "✓ MARK COMPLETE"}
          </button>
        )}
      </div>

      {/* Completion Celebration Overlay */}
        {isAnimating && (
        <div className="absolute inset-0 bg-[color:var(--surface-alt)] pointer-events-none flex items-center justify-center">
          <div className="text-6xl animate-ping-once">
            <SparklesIcon className="w-12 h-12" />
          </div>
        </div>
      )}
    </div>
  );
}
