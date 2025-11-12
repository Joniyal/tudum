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
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-black border-4 border-white max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{boxShadow: '8px 8px 0px rgba(255,255,255,0.3)'}}
      >
        {loading ? (
          <div className="p-12 text-center">
            <div className="text-white font-bold uppercase tracking-wide">LOADING PROFILE...</div>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <div className="text-white font-bold">{error}</div>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-black border-2 border-white text-white font-black uppercase hover:bg-white hover:text-black transition"
            >
              CLOSE
            </button>
          </div>
        ) : profile ? (
          <>
            {/* Header */}
            <div className="bg-black border-b-4 border-white p-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="w-20 h-20 bg-white border-2 border-white flex items-center justify-center text-3xl font-black text-black mb-3">
                    {(profile.name || profile.username)?.[0]?.toUpperCase()}
                  </div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-wider">
                    {profile.name || profile.username}
                  </h2>
                  <p className="text-white font-bold uppercase tracking-wide">@{profile.username}</p>
                </div>
                <button
                  onClick={onClose}
                  className="text-white hover:bg-white hover:text-black text-3xl font-black p-2"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Bio */}
              {profile.bio && (
                <div className="mb-6">
                  <p className="text-white font-bold">{profile.bio}</p>
                </div>
              )}

              {/* Member Since */}
              <div className="mb-6 text-sm text-white font-bold uppercase tracking-wide">
                📅 MEMBER SINCE {memberSince.toUpperCase()}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-black border-2 border-white p-4 text-center">
                  <div className="text-2xl font-black text-white">
                    {profile.stats.totalHabits}
                  </div>
                  <div className="text-sm text-white font-bold uppercase">
                    HABITS
                  </div>
                </div>
                <div className="bg-black border-2 border-white p-4 text-center">
                  <div className="text-2xl font-black text-white">
                    {profile.stats.totalCompletions}
                  </div>
                  <div className="text-sm text-white font-bold uppercase">
                    COMPLETIONS
                  </div>
                </div>
                <div className="bg-black border-2 border-white p-4 text-center">
                  <div className="text-2xl font-black text-white">
                    {profile.stats.currentStreak}
                  </div>
                  <div className="text-sm text-white font-bold uppercase">
                    CURRENT
                  </div>
                </div>
                <div className="bg-black border-2 border-white p-4 text-center">
                  <div className="text-2xl font-black text-white">
                    {profile.stats.longestStreak}
                  </div>
                  <div className="text-sm text-white font-bold uppercase">
                    LONGEST
                  </div>
                </div>
              </div>

              {/* Current Habits */}
              <div className="mb-6">
                <h3 className="text-lg font-black text-white mb-3 uppercase tracking-wider">
                  CURRENT HABITS
                </h3>
                {profile.habits.length === 0 ? (
                  <p className="text-white text-sm font-bold">
                    NO HABITS YET
                  </p>
                ) : (
                  <div className="space-y-2">
                    {profile.habits.slice(0, 5).map((habit) => (
                      <div
                        key={habit.id}
                        className="flex items-center justify-between bg-black border-2 border-white p-3"
                      >
                        <span className="text-white font-bold">
                          {habit.title}
                        </span>
                        <span className="text-xs px-2 py-1 bg-white text-black border-2 border-white font-black uppercase">
                          {habit.frequency}
                        </span>
                      </div>
                    ))}
                    {profile.habits.length > 5 && (
                      <p className="text-sm text-white text-center pt-2 font-bold">
                        +{profile.habits.length - 5} MORE HABITS
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
                  className="flex-1 px-4 py-3 bg-white text-black font-black uppercase border-2 border-white hover:bg-black hover:text-white hover:border-white transition tracking-wider"
                >
                  💬 MESSAGE
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-3 bg-black border-2 border-white text-white font-black uppercase hover:bg-white hover:text-black transition tracking-wider"
                >
                  CLOSE
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
