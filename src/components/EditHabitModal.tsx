"use client";

import { useState, useEffect } from "react";

type Habit = {
  id: string;
  title: string;
  description: string | null;
  frequency: "DAILY" | "WEEKLY" | "MONTHLY";
  reminderEnabled: boolean;
  reminderTime: string | null;
  alarmDuration: number | null;
};

type EditHabitModalProps = {
  habit: Habit;
  onClose: () => void;
  onSave: (updatedHabit: Partial<Habit>) => Promise<void>;
};

export default function EditHabitModal({ habit, onClose, onSave }: EditHabitModalProps) {
  const [formData, setFormData] = useState({
    title: habit.title,
    description: habit.description || "",
    frequency: habit.frequency,
    reminderEnabled: habit.reminderEnabled,
    reminderTime: habit.reminderTime || "",
    alarmDuration: habit.alarmDuration || 5,
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error("Error saving habit:", error);
      alert("Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-black border-4 border-white max-w-md w-full p-6" style={{boxShadow: '8px 8px 0px rgba(255,255,255,0.3)'}}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-white uppercase tracking-wider">EDIT HABIT</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:text-black rounded transition font-black text-xl"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-black text-white mb-2 uppercase tracking-wide">
              HABIT NAME *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full px-4 py-2 border-2 border-white bg-black text-white font-bold placeholder-gray-500 focus:outline-none"
              placeholder="e.g., Morning Exercise"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-black text-white mb-2 uppercase tracking-wide">
              DESCRIPTION
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border-2 border-white bg-black text-white font-bold placeholder-gray-500 focus:outline-none resize-none"
              placeholder="What does this habit involve?"
            />
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-sm font-black text-white mb-2 uppercase tracking-wide">
              FREQUENCY *
            </label>
            <select
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value as "DAILY" | "WEEKLY" | "MONTHLY" })}
              className="w-full px-4 py-2 border-2 border-white bg-black text-white font-bold focus:outline-none"
            >
              <option value="DAILY">DAILY</option>
              <option value="WEEKLY">WEEKLY</option>
              <option value="MONTHLY">MONTHLY</option>
            </select>
          </div>

          {/* Reminder Toggle */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="reminderEnabled"
              checked={formData.reminderEnabled}
              onChange={(e) => setFormData({ ...formData, reminderEnabled: e.target.checked })}
              className="w-4 h-4 bg-black border-2 border-white accent-white"
            />
            <label htmlFor="reminderEnabled" className="text-sm font-black text-white uppercase tracking-wide">
              ENABLE REMINDER ALARM
            </label>
          </div>

          {/* Reminder Time */}
          {formData.reminderEnabled && (
            <>
              <div>
                <label className="block text-sm font-black text-white mb-2 uppercase tracking-wide">
                  REMINDER TIME
                </label>
                <input
                  type="time"
                  value={formData.reminderTime}
                  onChange={(e) => setFormData({ ...formData, reminderTime: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-white bg-black text-white font-bold focus:outline-none"
                />
              </div>

              {/* Alarm Duration */}
              <div>
                <label className="block text-sm font-black text-white mb-2 uppercase tracking-wide">
                  ALARM DURATION
                </label>
                <select
                  value={formData.alarmDuration}
                  onChange={(e) => setFormData({ ...formData, alarmDuration: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border-2 border-white bg-black text-white font-bold focus:outline-none"
                >
                  <option value="1">1 MINUTE</option>
                  <option value="2">2 MINUTES</option>
                  <option value="5">5 MINUTES</option>
                  <option value="10">10 MINUTES</option>
                  <option value="15">15 MINUTES</option>
                  <option value="30">30 MINUTES</option>
                  <option value="60">1 HOUR</option>
                  <option value="-1">UNTIL COMPLETED</option>
                </select>
              </div>
            </>
          )}

          {/* Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-black border-2 border-white text-white font-black uppercase tracking-wide hover:bg-white hover:text-black transition"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-4 py-3 bg-white text-black font-black uppercase tracking-wide border-2 border-white hover:bg-black hover:text-white hover:border-white transition disabled:opacity-50"
            >
              {isSaving ? "SAVING..." : "SAVE"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
