"use client";

import { useState } from "react";
import { FolderIcon, StarIcon, TargetIcon, DumbbellIcon, BrainIcon, HeartIcon, FireIcon, SparklesIcon, PaletteIcon } from "./Icons";

type CreateCollectionModalProps = {
  selectedHabitIds: string[];
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    description: string;
    color: string;
    icon: string;
    dayOfWeek: string | null;
  }) => void;
};

const PRESET_COLORS = [
  "#6366f1", // Indigo
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#ef4444", // Red
  "#f59e0b", // Amber
  "#10b981", // Emerald
  "#3b82f6", // Blue
  "#06b6d4", // Cyan
  "#14b8a6", // Teal
  "#84cc16", // Lime
];

const PRESET_ICONS = [
  { id: "folder", icon: <FolderIcon className="w-5 h-5" /> },
  { id: "star", icon: <StarIcon className="w-5 h-5" /> },
  { id: "target", icon: <TargetIcon className="w-5 h-5" /> },
  { id: "health", icon: <DumbbellIcon className="w-5 h-5" /> },
  { id: "brain", icon: <BrainIcon className="w-5 h-5" /> },
  { id: "heart", icon: <HeartIcon className="w-5 h-5" /> },
  { id: "star-2", icon: <StarIcon className="w-5 h-5" /> },
  { id: "fire", icon: <FireIcon className="w-5 h-5" /> },
  { id: "sparkles", icon: <SparklesIcon className="w-5 h-5" /> },
  { id: "palette", icon: <PaletteIcon className="w-5 h-5" /> },
];

const DAYS = [
  "All Days",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function CreateCollectionModal({
  selectedHabitIds,
  onClose,
  onSubmit,
}: CreateCollectionModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: PRESET_COLORS[0],
    icon: PRESET_ICONS[0].id,
    dayOfWeek: null as string | null,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-black border-4 border-white max-w-md w-full max-h-[90vh] overflow-y-auto" style={{boxShadow: '8px 8px 0px rgba(255,255,255,0.3)'}}>
        <div className="bg-black border-b-4 border-white text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-wider">CREATE COLLECTION</h2>
              <p className="text-white text-sm mt-1 font-bold uppercase tracking-wide">
                GROUP {selectedHabitIds.length} HABIT{selectedHabitIds.length !== 1 ? "S" : ""}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:text-black transition p-2 font-black text-xl"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Collection Name */}
          <div>
            <label className="block text-sm font-black text-white mb-2 uppercase tracking-wide">
              COLLECTION NAME *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Morning Routine, Workout Days"
              className="w-full px-4 py-3 border-2 border-white bg-black text-white font-bold placeholder-gray-500 focus:outline-none"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-black text-white mb-2 uppercase tracking-wide">
              DESCRIPTION (OPTIONAL)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What's this collection about?"
              rows={3}
              className="w-full px-4 py-3 border-2 border-white bg-black text-white font-bold placeholder-gray-500 focus:outline-none resize-none"
            />
          </div>

          {/* Icon Picker */}
          <div>
            <label className="block text-sm font-black text-white mb-3 uppercase tracking-wide">
              CHOOSE ICON
            </label>
            <div className="grid grid-cols-10 gap-2">
              {PRESET_ICONS.map(({ id, icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon: id })}
                  className={`p-2 border-2 transition-all flex items-center justify-center ${
                    formData.icon === id
                      ? "border-white bg-white"
                      : "border-white hover:bg-white/10"
                  }`}
                >
                  <span className="text-sm text-[color:var(--text)]">{icon}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-black text-white mb-3 uppercase tracking-wide">
              CHOOSE COLOR
            </label>
            <div className="grid grid-cols-10 gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-10 h-10 transition-all border-2 ${
                    formData.color === color
                      ? "border-white scale-110"
                      : "border-white/50 hover:border-white"
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
          </div>

          {/* Day Selector */}
          <div>
            <label className="block text-sm font-black text-white mb-3 uppercase tracking-wide">
              ASSIGN TO DAY (OPTIONAL)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {DAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, dayOfWeek: day === "All Days" ? null : day })
                  }
                  className={`px-3 py-2 text-sm font-black uppercase tracking-wide transition-all border-2 ${
                    (day === "All Days" && formData.dayOfWeek === null) ||
                    formData.dayOfWeek === day
                      ? "bg-white text-black border-white"
                      : "bg-black text-white border-white hover:bg-white/10"
                  }`}
                >
                  {day === "All Days" ? "ALL" : day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="border-2 border-white bg-black p-4">
            <p className="text-xs text-white mb-2 font-bold uppercase">PREVIEW</p>
            <div
              className="border-2 border-white p-4 text-white"
              style={{ backgroundColor: formData.color, borderColor: 'white' }}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">
                  {PRESET_ICONS.find((p) => p.id === formData.icon)?.icon}
                </span>
                <div>
                  <h3 className="font-black text-lg uppercase tracking-wider">
                    {formData.name || "COLLECTION NAME"}
                  </h3>
                  {formData.dayOfWeek && (
                    <p className="text-sm font-bold uppercase">{formData.dayOfWeek}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-black border-2 border-white text-white font-black uppercase tracking-wide hover:bg-white hover:text-black transition"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={!formData.name.trim()}
              className="flex-1 px-6 py-3 bg-white text-black font-black uppercase tracking-wide border-2 border-white hover:bg-black hover:text-white hover:border-white transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              CREATE
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
