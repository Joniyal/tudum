"use client";

import { useState } from "react";

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

const PRESET_ICONS = ["📁", "⭐", "🎯", "💪", "🧠", "❤️", "🌟", "🔥", "✨", "🎨"];

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
    icon: PRESET_ICONS[0],
    dayOfWeek: null as string | null,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-scale-in">
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Create Collection</h2>
              <p className="text-indigo-100 text-sm mt-1">
                Group {selectedHabitIds.length} habit{selectedHabitIds.length !== 1 ? "s" : ""}{" "}
                together
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition"
              aria-label="Close"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Collection Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Collection Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Morning Routine, Workout Days"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description (optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What's this collection about?"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
            />
          </div>

          {/* Icon Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Choose Icon
            </label>
            <div className="grid grid-cols-10 gap-2">
              {PRESET_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon })}
                  className={`text-2xl p-2 rounded-lg transition-all ${
                    formData.icon === icon
                      ? "bg-indigo-100 dark:bg-indigo-900 ring-2 ring-indigo-500 scale-110"
                      : "bg-gray-100 dark:bg-gray-700 hover:scale-105"
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Choose Color
            </label>
            <div className="grid grid-cols-10 gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-10 h-10 rounded-lg transition-all ${
                    formData.color === color
                      ? "ring-2 ring-offset-2 ring-gray-400 scale-110"
                      : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
          </div>

          {/* Day Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Assign to Day (optional)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {DAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, dayOfWeek: day === "All Days" ? null : day })
                  }
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    (day === "All Days" && formData.dayOfWeek === null) ||
                    formData.dayOfWeek === day
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {day === "All Days" ? "All" : day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-lg p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Preview</p>
            <div
              className="rounded-lg p-4 text-white"
              style={{ backgroundColor: formData.color }}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{formData.icon}</span>
                <div>
                  <h3 className="font-bold text-lg">
                    {formData.name || "Collection Name"}
                  </h3>
                  {formData.dayOfWeek && (
                    <p className="text-sm opacity-90">{formData.dayOfWeek}</p>
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
              className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formData.name.trim()}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Collection
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
