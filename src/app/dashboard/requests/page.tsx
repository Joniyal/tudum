"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";

type Connection = {
  id: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  fromUserId: string;
  toUserId: string;
  fromUser: {
    id: string;
    name: string | null;
    email: string;
  };
  toUser: {
    id: string;
    name: string | null;
    email: string;
  };
};

export default function RequestsPage() {
  const { data: session } = useSession();
  const [pendingRequests, setPendingRequests] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch("/api/connections");
      if (res.ok) {
        const connections = await res.json();
        // Filter to show only pending requests where current user is the receiver
        const pending = connections.filter(
          (c: Connection) =>
            c.status === "PENDING" && c.toUserId === session?.user?.id
        );
        setPendingRequests(pending);
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAcceptRequest = async (connectionId: string) => {
    try {
      const res = await fetch(`/api/connections/${connectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACCEPTED" }),
      });

      if (res.ok) {
        fetchRequests();
      }
    } catch (error) {
      console.error("Error accepting request:", error);
    }
  };

  const handleRejectRequest = async (connectionId: string) => {
    try {
      const res = await fetch(`/api/connections/${connectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REJECTED" }),
      });

      if (res.ok) {
        fetchRequests();
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
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
        📨 FRIEND REQUESTS
      </h1>

      {pendingRequests.length === 0 ? (
        <div className="retro-panel p-12 text-center">
          <p className="retro-text-muted uppercase tracking-wider">
            No pending friend requests
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingRequests.map((request) => (
            <div
              key={request.id}
              className="retro-panel p-6 flex items-center justify-between hover-lift"
            >
              <div className="flex-1">
                <h3 className="font-bold text-lg">
                  {request.fromUser.name || request.fromUser.email}
                </h3>
                <p className="retro-text-muted text-xs uppercase tracking-wider">
                  {request.fromUser.email}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleAcceptRequest(request.id)}
                  className="retro-button text-xs px-4 py-2 hover-lift"
                >
                  ✓ ACCEPT
                </button>
                <button
                  onClick={() => handleRejectRequest(request.id)}
                  className="retro-button-outline text-xs px-4 py-2 hover-lift"
                >
                  ✕ REJECT
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
