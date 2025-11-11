"use client";

import { useEffect, useState } from "react";

type UserProfileModalProps = {
  userId: string;
  onClose: () => void;
  onMessage: () => void;
};

type UserProfile = {
  id: string;
  name: string | null;
  email: string;
  username: string;
  bio: string | null;
  createdAt: string;
  stats: {
    totalHabits: number;
    totalCompletions: number;
    currentStreak: number;
    longestStreak: number;
  };
  habits: Array<{
    id: string;
    title: string;
    frequency: "DAILY" | "WEEKLY" | "MONTHLY";
  }>;
};

export default function UserProfileModal({
  userId,
  onClose,
  onMessage,
}: UserProfileModalProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/users/${userId}/profile`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      } else {
        setError("Failed to load profile");
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const memberSince = profile
    ? new Date(profile.createdAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div className="p-12 text-center">
            <div className="text-gray-600 dark:text-gray-400">Loading profile...</div>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <div className="text-red-600 dark:text-red-400">{error}</div>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
            >
              Close
            </button>
          </div>
        ) : profile ? (
          <>
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-t-lg">
              <div className="flex justify-between items-start">
                <div>
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-3xl font-bold text-indigo-600 mb-3">
                    {(profile.name || profile.username)?.[0]?.toUpperCase()}
                  </div>
                  <h2 className="text-2xl font-bold text-white">
                    {profile.name || profile.username}
                  </h2>
                  <p className="text-indigo-100">@{profile.username}</p>
                </div>
                <button
                  onClick={onClose}
                  className="text-white hover:text-indigo-200 text-3xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Bio */}
              {profile.bio && (
                <div className="mb-6">
                  <p className="text-gray-700 dark:text-gray-300">{profile.bio}</p>
                </div>
              )}

              {/* Member Since */}
              <div className="mb-6 text-sm text-gray-600 dark:text-gray-400">
                📅 Member since {memberSince}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {profile.stats.totalHabits}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Habits
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {profile.stats.totalCompletions}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Completions
                  </div>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/30 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {profile.stats.currentStreak}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Current Streak
                  </div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {profile.stats.longestStreak}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Longest Streak
                  </div>
                </div>
              </div>

              {/* Current Habits */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Current Habits
                </h3>
                {profile.habits.length === 0 ? (
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    No habits yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {profile.habits.slice(0, 5).map((habit) => (
                      <div
                        key={habit.id}
                        className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-lg"
                      >
                        <span className="text-gray-900 dark:text-white">
                          {habit.title}
                        </span>
                        <span className="text-xs px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded">
                          {habit.frequency}
                        </span>
                      </div>
                    ))}
                    {profile.habits.length > 5 && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 text-center pt-2">
                        +{profile.habits.length - 5} more habits
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    onClose();
                    window.location.href = `/dashboard/messages?partnerId=${userId}`;
                  }}
                  className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition"
                >
                  💬 Send Message
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition"
                >
                  Close
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
