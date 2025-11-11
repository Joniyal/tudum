"use client";

import { useState, useEffect } from "react";

type ShareHabitModalProps = {
  habitId: string;
  habitTitle: string;
  onClose: () => void;
  onSuccess: () => void;
};

type Partner = {
  id: string;
  name: string | null;
  email: string;
};

export default function ShareHabitModal({
  habitId,
  habitTitle,
  onClose,
  onSuccess,
}: ShareHabitModalProps) {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<string>("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      const res = await fetch("/api/connections");
      if (res.ok) {
        const connections = await res.json();
        const acceptedPartners = connections
          .filter((c: any) => c.status === "ACCEPTED")
          .map((c: any) => {
            // Get the partner (not the current user)
            return c.fromUser || c.toUser;
          })
          .filter((p: Partner) => p); // Filter out nulls
        
        setPartners(acceptedPartners);
      }
    } catch (err) {
      console.error("Error fetching partners:", err);
      setError("Failed to load partners");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPartner) {
      setError("Please select a partner");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/habit-shares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          habitId,
          toUserId: selectedPartner,
          message: message.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Habit invitation sent successfully! 🎉");
        onSuccess();
        onClose();
      } else {
        setError(data.error || "Failed to share habit");
      }
    } catch (err) {
      console.error("Error sharing habit:", err);
      setError("Failed to share habit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Share Habit
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {habitTitle}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleShare} className="p-6 space-y-4">
          {loading ? (
            <div className="text-center py-8 text-gray-600 dark:text-gray-400">
              Loading partners...
            </div>
          ) : partners.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                You don&apos;t have any connected partners yet.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  window.location.href = "/dashboard/social";
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
              >
                Find Partners
              </button>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Partner
                </label>
                <select
                  value={selectedPartner}
                  onChange={(e) => setSelectedPartner(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Choose a partner...</option>
                  {partners.map((partner) => (
                    <option key={partner.id} value={partner.id}>
                      {partner.name || partner.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Personal Message (Optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  placeholder="Add a personal note to encourage your partner..."
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {message.length}/500 characters
                </p>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-lg p-3">
                <p className="text-sm text-indigo-700 dark:text-indigo-300">
                  💡 Your partner will receive an invitation to add this habit to their list.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedPartner}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Sending..." : "Send Invitation"}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
