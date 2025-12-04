"use client";

import { useState, useEffect } from "react";
import { DumbbellIcon, BriefcaseIcon, LotusIcon, UsersIcon, PaletteIcon, BookIcon, ClockIcon } from "../components/Icons";

type TimeSlot = {
  id: string;
  time: string; // HH:MM format
  title: string;
  duration: number; // in minutes
  category?: string;
};

type TimetableBuilderProps = {
  onClose: () => void;
  onSave: (slots: TimeSlot[]) => void;
  existingSlots?: TimeSlot[];
};

const CATEGORIES = [
  { id: "health", label: "Health & Fitness", color: "retro-panel-flat", icon: <DumbbellIcon className="w-5 h-5" /> },
  { id: "work", label: "Work & Study", color: "retro-panel-flat", icon: <BriefcaseIcon className="w-5 h-5" /> },
  { id: "personal", label: "Personal Care", color: "retro-panel-flat", icon: <LotusIcon className="w-5 h-5" /> },
  { id: "social", label: "Social & Family", color: "retro-panel-flat", icon: <UsersIcon className="w-5 h-5" /> },
  { id: "creative", label: "Creative", color: "retro-panel-flat", icon: <PaletteIcon className="w-5 h-5" /> },
  { id: "learning", label: "Learning", color: "retro-panel-flat", icon: <BookIcon className="w-5 h-5" /> },
];

const PRESET_ROUTINES = [
  {
    name: "Early Bird",
    slots: [
      { time: "05:00", title: "Wake Up & Hydrate", duration: 15, category: "health" },
      { time: "05:15", title: "Morning Exercise", duration: 45, category: "health" },
      { time: "06:00", title: "Meditation", duration: 15, category: "personal" },
      { time: "06:15", title: "Shower & Breakfast", duration: 45, category: "personal" },
      { time: "07:00", title: "Plan Day", duration: 15, category: "work" },
    ],
  },
  {
    name: "Balanced Day",
    slots: [
      { time: "07:00", title: "Morning Routine", duration: 60, category: "personal" },
      { time: "09:00", title: "Focus Work Block", duration: 120, category: "work" },
      { time: "12:00", title: "Lunch Break", duration: 60, category: "personal" },
      { time: "15:00", title: "Afternoon Work", duration: 120, category: "work" },
      { time: "18:00", title: "Exercise", duration: 60, category: "health" },
      { time: "20:00", title: "Dinner & Family Time", duration: 90, category: "social" },
      { time: "22:00", title: "Wind Down", duration: 30, category: "personal" },
    ],
  },
  {
    name: "Night Owl",
    slots: [
      { time: "08:00", title: "Morning Routine", duration: 60, category: "personal" },
      { time: "10:00", title: "Creative Work", duration: 150, category: "creative" },
      { time: "14:00", title: "Lunch & Recharge", duration: 90, category: "personal" },
      { time: "16:00", title: "Focused Work", duration: 180, category: "work" },
      { time: "21:00", title: "Dinner", duration: 60, category: "personal" },
      { time: "23:00", title: "Learning Time", duration: 60, category: "learning" },
    ],
  },
];

export default function TimetableBuilder({ onClose, onSave, existingSlots = [] }: TimetableBuilderProps) {
  const [slots, setSlots] = useState<TimeSlot[]>(existingSlots);
  const [newSlot, setNewSlot] = useState({ time: "09:00", title: "", duration: 30, category: "work" });
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const addSlot = () => {
    if (!newSlot.title) {
      alert("Please enter a title");
      return;
    }

    const slot: TimeSlot = {
      id: Date.now().toString(),
      ...newSlot,
    };

    setSlots([...slots, slot].sort((a, b) => a.time.localeCompare(b.time)));
    setNewSlot({ time: "09:00", title: "", duration: 30, category: "work" });
  };

  const removeSlot = (id: string) => {
    setSlots(slots.filter(s => s.id !== id));
  };

  const loadPreset = (presetName: string) => {
    const preset = PRESET_ROUTINES.find(p => p.name === presetName);
    if (preset) {
      const presetSlots = preset.slots.map(s => ({
        ...s,
        id: Date.now().toString() + Math.random(),
      }));
      setSlots(presetSlots);
      setSelectedPreset(presetName);
    }
  };

  const getCategoryInfo = (categoryId?: string) => {
    return CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[0];
  };

  const formatTime = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    const hour = h % 12 || 12;
    const period = h < 12 ? 'AM' : 'PM';
    return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
  };

  return (
    <div 
      className="fixed inset-0 bg-[color:var(--background)]/90 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="retro-panel max-w-5xl w-full my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixed */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b-2 border-[color:var(--border)] bg-[color:var(--surface)]">
          <div>
            <h2 className="retro-heading text-xl flex items-center gap-2"><ClockIcon className="w-5 h-5" />TIMETABLE BUILDER</h2>
            <p className="retro-text-muted text-xs uppercase tracking-wider mt-1">Create your perfect daily routine</p>
          </div>
          <button
            onClick={onClose}
            className="retro-button-outline p-2 hover-lift"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 max-h-[calc(90vh-8rem)] overflow-y-auto">
          {/* Preset Templates */}
          <div className="mb-6">
            <h3 className="retro-subheading text-sm mb-3">QUICK START TEMPLATES</h3>
            <div className="grid grid-cols-3 gap-3">
              {PRESET_ROUTINES.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => loadPreset(preset.name)}
                  className={`retro-panel-flat p-4 border-2 transition hover-lift ${
                    selectedPreset === preset.name
                      ? "border-[color:var(--text)]"
                      : "border-[color:var(--border)]"
                  }`}
                >
                  <div className="font-bold">{preset.name}</div>
                  <div className="retro-text-muted text-[0.65rem] uppercase tracking-wider mt-1">{preset.slots.length} ACTIVITIES</div>
                </button>
              ))}
            </div>
          </div>

          {/* Add New Slot */}
          <div className="mb-6 retro-panel-flat p-4">
            <h3 className="retro-subheading text-sm mb-3">ADD ACTIVITY</h3>
            <div className="grid grid-cols-12 gap-3">
              <input
                type="time"
                value={newSlot.time}
                onChange={(e) => setNewSlot({ ...newSlot, time: e.target.value })}
                className="col-span-2 retro-input text-xs"
              />
              <input
                type="text"
                placeholder="Activity name"
                value={newSlot.title}
                onChange={(e) => setNewSlot({ ...newSlot, title: e.target.value })}
                className="col-span-4 retro-input text-xs"
              />
              <select
                value={newSlot.duration}
                onChange={(e) => setNewSlot({ ...newSlot, duration: parseInt(e.target.value) })}
                className="col-span-2 retro-input text-xs"
              >
                <option value="15">15 min</option>
                <option value="30">30 min</option>
                <option value="45">45 min</option>
                <option value="60">1 hour</option>
                <option value="90">1.5 hours</option>
                <option value="120">2 hours</option>
                <option value="180">3 hours</option>
              </select>
              <select
                value={newSlot.category}
                onChange={(e) => setNewSlot({ ...newSlot, category: e.target.value })}
                className="col-span-3 retro-input text-xs"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.icon} {cat.label}</option>
                ))}
              </select>
              <button
                onClick={addSlot}
                className="col-span-1 retro-button text-xs hover-lift"
              >
                +
              </button>
            </div>
          </div>

          {/* Timeline View */}
          <div className="mb-6">
            <h3 className="retro-subheading text-sm mb-3">YOUR SCHEDULE <span className="retro-badge text-xs">{slots.length}</span></h3>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
              {slots.length === 0 ? (
                <div className="text-center py-12 retro-text-muted">
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="uppercase tracking-wider text-xs">No activities yet. Add some or try a template!</p>
                </div>
              ) : (
                slots.map((slot, index) => {
                  const category = getCategoryInfo(slot.category);
                  return (
                    <div
                      key={slot.id}
                      className="flex items-center space-x-3 p-3 retro-panel-flat border-2 border-[color:var(--border)] hover-lift"
                    >
                      <div className="w-12 h-12 retro-panel-flat border-2 border-[color:var(--border)] flex items-center justify-center text-2xl">
                        {category.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-mono font-bold">
                            {formatTime(slot.time)}
                          </span>
                          <span className="retro-text-muted">→</span>
                          <span className="text-xs font-mono font-bold">
                            {(() => {
                              const [h, m] = slot.time.split(":").map(Number);
                              const endTime = new Date();
                              endTime.setHours(h, m, 0, 0);
                              endTime.setMinutes(endTime.getMinutes() + slot.duration);
                              const endHour = endTime.getHours();
                              const endMin = endTime.getMinutes();
                              return formatTime(`${endHour.toString().padStart(2, "0")}:${endMin.toString().padStart(2, "0")}`);
                            })()}
                          </span>
                          <span className="retro-tag text-[0.65rem]">{slot.duration} MIN</span>
                        </div>
                        <div className="font-bold">{slot.title}</div>
                        <div className="retro-text-muted text-[0.65rem] uppercase tracking-wider">{category.label}</div>
                      </div>
                      <button
                        onClick={() => removeSlot(slot.id)}
                        className="retro-button-outline p-2 hover-lift"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Actions - Sticky Footer */}
          <div className="sticky bottom-0 flex space-x-3 pt-4 border-t-2 border-[color:var(--border)] bg-[color:var(--surface)] -mx-6 px-6 -mb-6 pb-6">
            <button
              onClick={onClose}
              className="flex-1 retro-button-outline text-xs hover-lift"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (slots.length === 0) {
                  alert("Please add at least one activity");
                  return;
                }
                onSave(slots);
                onClose();
              }}
              disabled={slots.length === 0}
              className="flex-1 retro-button text-xs hover-lift disabled:opacity-50"
            >
              Create {slots.length} Habits
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
