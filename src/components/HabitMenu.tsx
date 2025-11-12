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
        className="p-2 bg-black border-2 border-white text-white font-bold hover:bg-white hover:text-black transition"
        aria-label="Habit options"
      >
        ⋯
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-black border-2 border-white z-10">
          <div className="py-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
                onEdit();
              }}
              className="w-full px-4 py-3 text-left text-sm text-white font-bold uppercase hover:bg-white hover:text-black flex items-center space-x-2 border-b border-white"
            >
              ✏️
              <span>EDIT</span>
            </button>

            {onArchive && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  onArchive();
                }}
                className="w-full px-4 py-3 text-left text-sm text-white font-bold uppercase hover:bg-white hover:text-black flex items-center space-x-2 border-b border-white"
              >
                {isArchived ? (
                  <>
                    📂
                    <span>UNARCHIVE</span>
                  </>
                ) : (
                  <>
                    📦
                    <span>ARCHIVE</span>
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
              className="w-full px-4 py-3 text-left text-sm text-white font-bold uppercase hover:bg-white hover:text-black flex items-center space-x-2"
            >
              🗑️
              <span>DELETE</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
