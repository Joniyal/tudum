"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

type Connection = {
  id: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  fromUser: { id: string; name: string | null; email: string };
  toUser: { id: string; name: string | null; email: string };
  createdAt: string;
};

export default function ConnectionsPage() {
  const { data: session } = useSession();
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
        <div className="retro-text-muted">LOADING...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="retro-heading text-2xl mb-8">
        🤝 CONNECTIONS
      </h1>

      {/* Send Connection Request */}
      <div className="retro-panel p-6 mb-8 hover-lift">
        <h2 className="retro-subheading text-lg mb-4">
          ADD ACCOUNTABILITY PARTNER
        </h2>
        <form onSubmit={handleSendRequest} className="space-y-4">
          {error && (
            <div className="retro-panel-flat p-4 border-2 border-[color:var(--text)]">
              <p className="retro-text-muted text-xs uppercase tracking-wide">{error}</p>
            </div>
          )}
          {success && (
            <div className="retro-panel-flat p-4 border-2 border-[color:var(--text)]">
              <p className="text-xs uppercase tracking-wide font-bold">✓ {success}</p>
            </div>
          )}

          <div className="flex gap-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 retro-input"
              placeholder="partner@email.com"
            />
            <button
              type="submit"
              className="retro-button hover-lift"
            >
              ➤ SEND
            </button>
          </div>
        </form>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="mb-8">
          <h2 className="retro-subheading text-lg mb-4">
            ⏳ PENDING REQUESTS
          </h2>
          <div className="space-y-3">
            {pendingRequests.map((connection) => {
              // Determine if you are the receiver (toUser)
              const currentUserId = session?.user?.id;
              const isReceived = connection.toUser.id === currentUserId;
              // The other user is the one who is NOT you
              const otherUser = connection.fromUser.id === currentUserId 
                ? connection.toUser 
                : connection.fromUser;

              return (
                <div
                  key={connection.id}
                  className="retro-panel p-4 flex items-center justify-between hover-lift"
                >
                  <div>
                    <p className="font-bold">
                      {otherUser.name || otherUser.email}
                    </p>
                    <p className="retro-text-muted text-xs uppercase tracking-wider">
                      {otherUser.email}
                    </p>
                    <p className="retro-tag text-[0.6rem] mt-2">
                      {isReceived ? "← RECEIVED" : "→ SENT"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {isReceived ? (
                      <>
                        <button
                          onClick={() => handleAcceptRequest(connection.id)}
                          className="retro-button text-xs px-3 py-2 hover-lift"
                        >
                          ✓ ACCEPT
                        </button>
                        <button
                          onClick={() => handleRejectRequest(connection.id)}
                          className="retro-button-outline text-xs px-3 py-2 hover-lift"
                        >
                          ✕ REJECT
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleDeleteConnection(connection.id)}
                        className="retro-button-outline text-xs px-3 py-2 hover-lift"
                      >
                        ✕ CANCEL
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
        <h2 className="retro-subheading text-lg mb-4">
          👥 MY PARTNERS <span className="retro-badge text-xs ml-2">{acceptedConnections.length}</span>
        </h2>
        {acceptedConnections.length === 0 ? (
          <div className="retro-panel p-12 text-center">
            <p className="retro-text-muted uppercase tracking-wider text-sm">
              No active connections yet. Send a request to add your first accountability partner!
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {acceptedConnections.map((connection) => {
              const currentUserId = session?.user?.id;
              const otherUser = connection.fromUser.id === currentUserId
                ? connection.toUser
                : connection.fromUser;

              return (
                <div
                  key={connection.id}
                  className="retro-panel p-6 hover-lift"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold">
                        {otherUser.name || "Partner"}
                      </h3>
                      <p className="retro-text-muted text-xs uppercase tracking-wider">
                        {otherUser.email}
                      </p>
                    </div>
                    <span className="retro-tag text-[0.65rem]">
                      ✓ ACTIVE
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteConnection(connection.id)}
                    className="w-full retro-button-outline text-xs hover-lift"
                  >
                    ✕ REMOVE
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
