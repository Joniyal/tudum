"use client";

import { useEffect, useState } from "react";

type Connection = {
  id: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  fromUser: { id: string; name: string | null; email: string };
  toUser: { id: string; name: string | null; email: string };
  createdAt: string;
};

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      const res = await fetch("/api/connections");
      if (res.ok) {
        const data = await res.json();
        setConnections(data);
      }
    } catch (error) {
      console.error("Error fetching connections:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send request");
      }

      setSuccess("Connection request sent!");
      setEmail("");
      fetchConnections();
    } catch (err: any) {
      setError(err.message);
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
        fetchConnections();
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
        fetchConnections();
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
    }
  };

  const handleDeleteConnection = async (connectionId: string) => {
    if (!confirm("Are you sure you want to remove this connection?")) return;

    try {
      const res = await fetch(`/api/connections/${connectionId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchConnections();
      }
    } catch (error) {
      console.error("Error deleting connection:", error);
    }
  };

  const pendingRequests = connections.filter((c) => c.status === "PENDING");
  const acceptedConnections = connections.filter((c) => c.status === "ACCEPTED");

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
        Connections
      </h1>

      {/* Send Connection Request */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Add Accountability Partner
        </h2>
        <form onSubmit={handleSendRequest} className="space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded">
              {success}
            </div>
          )}

          <div className="flex gap-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter partner's email"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition"
            >
              Send Request
            </button>
          </div>
        </form>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Pending Requests
          </h2>
          <div className="space-y-3">
            {pendingRequests.map((connection) => {
              const isReceived = connection.toUser.id !== connection.fromUser.id;
              const otherUser = isReceived ? connection.fromUser : connection.toUser;

              return (
                <div
                  key={connection.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {otherUser.name || otherUser.email}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {otherUser.email}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {isReceived ? "Received" : "Sent"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {isReceived ? (
                      <>
                        <button
                          onClick={() => handleAcceptRequest(connection.id)}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRejectRequest(connection.id)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition"
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleDeleteConnection(connection.id)}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-semibold rounded-lg transition"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Accepted Connections */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          My Partners ({acceptedConnections.length})
        </h2>
        {acceptedConnections.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              No active connections yet. Send a request to add your first accountability partner!
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {acceptedConnections.map((connection) => {
              const otherUser =
                connection.fromUser.id === connection.toUser.id
                  ? connection.toUser
                  : connection.fromUser.id
                  ? connection.toUser
                  : connection.fromUser;

              return (
                <div
                  key={connection.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {otherUser.name || "Partner"}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {otherUser.email}
                      </p>
                    </div>
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded">
                      Connected
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteConnection(connection.id)}
                    className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition"
                  >
                    Remove Connection
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
