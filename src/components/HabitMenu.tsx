"use client";

import { useState, useRef, useEffect } from "react";

type HabitMenuProps = {
  habitId: string;
  onEdit: () => void;
  onDelete: () => void;
  onArchive?: () => void;
  isArchived?: boolean;
};

export default function HabitMenu({ habitId, onEdit, onDelete, onArchive, isArchived }: HabitMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      {/* 3-dot button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-2 hover:bg-[color:var(--surface-alt)] transition-all"
        aria-label="Habit options"
      >
        <span className="text-xl font-black">⋯</span>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 retro-panel z-10 animate-slide-down">
          <div className="py-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
                onEdit();
              }}
              className="w-full px-4 py-3 text-left text-xs font-bold uppercase hover:bg-[color:var(--text)] hover:text-[color:var(--background)] flex items-center gap-2 border-b-2 border-[color:var(--border)]"
            >
              <span>✏️</span>
              <span>Edit</span>
            </button>

            {onArchive && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  onArchive();
                }}
                className="w-full px-4 py-3 text-left text-xs font-bold uppercase hover:bg-[color:var(--text)] hover:text-[color:var(--background)] flex items-center gap-2 border-b-2 border-[color:var(--border)]"
              >
                {isArchived ? (
                  <>
                    <span>📂</span>
                    <span>Unarchive</span>
                  </>
                ) : (
                  <>
                    <span>📦</span>
                    <span>Archive</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
                onDelete();
              }}
              className="w-full px-4 py-3 text-left text-xs font-bold uppercase hover:bg-[color:var(--text)] hover:text-[color:var(--background)] flex items-center gap-2"
            >
              <span>🗑️</span>
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
