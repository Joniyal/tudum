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
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="retro-panel max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-expand"
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div className="p-12 text-center">
            <div className="retro-text-muted uppercase tracking-widest animate-pulse">Loading Profile...</div>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <div className="mb-4">{error}</div>
            <button
              onClick={onClose}
              className="retro-button px-4 py-2 text-xs"
            >
              Close
            </button>
          </div>
        ) : profile ? (
          <>
            {/* Header */}
            <div className="bg-[color:var(--surface-alt)] border-b-4 border-[color:var(--border)] p-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="retro-avatar w-20 h-20 text-3xl mb-3">
                    {(profile.name || profile.username)?.[0]?.toUpperCase()}
                  </div>
                  <h2 className="retro-heading text-xl">
                    {profile.name || profile.username}
                  </h2>
                  <p className="retro-text-muted text-xs uppercase tracking-wider mt-1">@{profile.username}</p>
                </div>
                <button
                  onClick={onClose}
                  className="hover:bg-[color:var(--surface-alt)] text-2xl font-black p-2"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Bio */}
              {profile.bio && (
                <div className="mb-6">
                  <p className="text-sm leading-relaxed">{profile.bio}</p>
                </div>
              )}

              {/* Member Since */}
              <div className="mb-6 retro-text-muted text-xs uppercase tracking-wider">
                📅 Member Since {memberSince}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="retro-panel-flat p-4 text-center">
                  <div className="text-2xl font-black">
                    {profile.stats.totalHabits}
                  </div>
                  <div className="retro-text-muted text-xs uppercase tracking-wider mt-1">
                    Habits
                  </div>
                </div>
                <div className="retro-panel-flat p-4 text-center">
                  <div className="text-2xl font-black">
                    {profile.stats.totalCompletions}
                  </div>
                  <div className="retro-text-muted text-xs uppercase tracking-wider mt-1">
                    Completions
                  </div>
                </div>
                <div className="retro-panel-flat p-4 text-center">
                  <div className="text-2xl font-black">
                    {profile.stats.currentStreak}
                  </div>
                  <div className="retro-text-muted text-xs uppercase tracking-wider mt-1">
                    Current
                  </div>
                </div>
                <div className="retro-panel-flat p-4 text-center">
                  <div className="text-2xl font-black">
                    {profile.stats.longestStreak}
                  </div>
                  <div className="retro-text-muted text-xs uppercase tracking-wider mt-1">
                    Longest
                  </div>
                </div>
              </div>

              {/* Current Habits */}
              <div className="mb-6">
                <h3 className="retro-subheading text-base mb-3">
                  Current Habits
                </h3>
                {profile.habits.length === 0 ? (
                  <p className="retro-text-muted text-xs uppercase tracking-wider">
                    No habits yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {profile.habits.slice(0, 5).map((habit) => (
                      <div
                        key={habit.id}
                        className="flex items-center justify-between retro-panel-flat p-3"
                      >
                        <span className="font-bold text-sm">
                          {habit.title}
                        </span>
                        <span className="retro-tag text-[0.65rem]">
                          {habit.frequency}
                        </span>
                      </div>
                    ))}
                    {profile.habits.length > 5 && (
                      <p className="retro-text-muted text-xs text-center pt-2 uppercase tracking-wider">
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
                  className="retro-button flex-1 text-xs"
                >
                  💬 Message
                </button>
                <button
                  onClick={onClose}
                  className="retro-button-outline px-4 py-2 text-xs"
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
