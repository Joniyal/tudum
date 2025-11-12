"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

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
  const { data: session } = useSession();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<string>("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      fetchPartners();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  const fetchPartners = async () => {
    try {
      const res = await fetch("/api/connections");
      if (res.ok) {
        const connections = await res.json();
        const acceptedPartners = connections
          .filter((c: any) => c.status === "ACCEPTED")
          .map((c: any) => {
            // Get the partner (not the current user)
            const currentUserId = session?.user?.id;
            return c.fromUser.id === currentUserId ? c.toUser : c.fromUser;
          })
          .filter((p: Partner) => p && p.id !== session?.user?.id); // Filter out nulls and current user
        
        // Remove duplicates based on ID
        const uniquePartners = Array.from(
          new Map(acceptedPartners.map((p: Partner) => [p.id, p])).values()
        ) as Partner[];
        
        setPartners(uniquePartners);
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
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-black border-4 border-white max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
        style={{boxShadow: '8px 8px 0px rgba(255,255,255,0.3)'}}
      >
        {/* Header */}
        <div className="p-6 border-b-4 border-white">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-wider">
                SHARE HABIT
              </h2>
              <p className="text-sm text-white mt-1 font-bold uppercase tracking-wide">
                {habitTitle}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:text-black text-2xl font-black p-2"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleShare} className="p-6 space-y-4">
          {loading ? (
            <div className="text-center py-8 text-white font-bold uppercase">
              LOADING PARTNERS...
            </div>
          ) : partners.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-white mb-4 font-bold uppercase">
                NO CONNECTED PARTNERS YET
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  window.location.href = "/dashboard/social";
                }}
                className="px-4 py-2 bg-white text-black border-2 border-white font-black uppercase hover:bg-black hover:text-white transition"
              >
                FIND PARTNERS
              </button>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-black text-white mb-2 uppercase tracking-wide">
                  SELECT PARTNER
                </label>
                <select
                  value={selectedPartner}
                  onChange={(e) => setSelectedPartner(e.target.value)}
                  required
                  className="w-full px-4 py-2 border-2 border-white bg-black text-white font-bold focus:outline-none"
                >
                  <option value="">CHOOSE A PARTNER...</option>
                  {partners.map((partner) => (
                    <option key={partner.id} value={partner.id}>
                      {partner.name || partner.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-black text-white mb-2 uppercase tracking-wide">
                  PERSONAL MESSAGE (OPTIONAL)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-white bg-black text-white font-bold placeholder-gray-500 focus:outline-none resize-none"
                  placeholder="Add a personal note to encourage your partner..."
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-white mt-1 font-bold">
                  {message.length}/500 CHARS
                </p>
              </div>

              {error && (
                <div className="bg-black border-2 border-white rounded-lg p-3">
                  <p className="text-sm text-white font-bold uppercase">{error}</p>
                </div>
              )}

              <div className="bg-black border-2 border-white rounded-lg p-3">
                <p className="text-sm text-white font-bold">
                  💡 YOUR PARTNER WILL RECEIVE AN INVITATION
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-black border-2 border-white text-white font-black uppercase hover:bg-white hover:text-black transition"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedPartner}
                  className="flex-1 px-4 py-2 bg-white text-black border-2 border-white font-black uppercase hover:bg-black hover:text-white hover:border-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "SENDING..." : "SEND"}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
