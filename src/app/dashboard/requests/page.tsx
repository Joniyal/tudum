"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
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
  };

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
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Friend Requests
      </h1>

      {pendingRequests.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            No pending friend requests
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingRequests.map((request) => (
            <div
              key={request.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex items-center justify-between"
            >
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {request.fromUser.name || request.fromUser.email}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {request.fromUser.email}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleAcceptRequest(request.id)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition"
                >
                  ✓ Accept
                </button>
                <button
                  onClick={() => handleRejectRequest(request.id)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition"
                >
                  ✕ Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
