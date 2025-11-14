"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

type UserProfile = {
  id: string;
  username: string;
  email: string;
  name: string | null;
  bio: string | null;
  createdAt: string;
};

export default function ProfilePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    username: "",
    name: "",
    bio: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setFormData({
          username: data.username,
          name: data.name || "",
          bio: data.bio || "",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const updated = await res.json();
        setProfile(updated);
        setIsEditing(false);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("Failed to update profile");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="retro-text-muted">LOADING...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="retro-heading text-2xl mb-8">
        👤 MY PROFILE
      </h1>

      {error && (
        <div className="mb-6 retro-panel p-4 border-2 border-[color:var(--text)]">
          <p className="retro-text-muted text-xs uppercase tracking-wide">{error}</p>
        </div>
      )}

      {profile && (
        <div className="retro-panel p-8 max-w-md hover-lift">
          {!isEditing ? (
            <>
              <div className="space-y-6">
                <div>
                  <label className="retro-subheading text-xs mb-2 block">
                    USERNAME
                  </label>
                  <p className="text-lg font-bold">
                    @{profile.username}
                  </p>
                </div>

                <div>
                  <label className="retro-subheading text-xs mb-2 block">
                    EMAIL
                  </label>
                  <p className="retro-text-muted text-sm">
                    {profile.email}
                  </p>
                </div>

                {profile.name && (
                  <div>
                    <label className="retro-subheading text-xs mb-2 block">
                      NAME
                    </label>
                    <p className="font-semibold">
                      {profile.name}
                    </p>
                  </div>
                )}

                {profile.bio && (
                  <div>
                    <label className="retro-subheading text-xs mb-2 block">
                      BIO
                    </label>
                    <p className="text-sm">
                      {profile.bio}
                    </p>
                  </div>
                )}

                <div className="retro-text-muted text-xs uppercase tracking-wider border-t-2 border-[color:var(--border)] pt-4">
                  Member since {new Date(profile.createdAt).toLocaleDateString()}
                </div>
              </div>

              <button
                onClick={() => setIsEditing(true)}
                className="mt-8 w-full retro-button hover-lift"
              >
                ✏️ EDIT PROFILE
              </button>
            </>
          ) : (
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div>
                <label className="retro-subheading text-xs mb-2 block">
                  USERNAME *
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  placeholder="e.g., john_doe"
                  className="retro-input w-full"
                  required
                />
                <p className="mt-2 retro-text-muted text-[0.65rem] uppercase tracking-wider">
                  Only letters, numbers, dash and underscore allowed
                </p>
              </div>

              <div>
                <label className="retro-subheading text-xs mb-2 block">
                  NAME
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Your full name"
                  maxLength={50}
                  className="retro-input w-full"
                />
              </div>

              <div>
                <label className="retro-subheading text-xs mb-2 block">
                  BIO
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  placeholder="Tell us about yourself"
                  maxLength={500}
                  rows={3}
                  className="retro-textarea w-full"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 retro-button hover-lift"
                >
                  ✓ SAVE
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 retro-button-outline hover-lift"
                >
                  ✕ CANCEL
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
