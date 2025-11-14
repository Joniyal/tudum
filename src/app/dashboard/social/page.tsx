"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import UserProfileModal from "@/components/UserProfileModal";

type Tab = "discover" | "requests" | "partners";

type User = {
  id: string;
  username: string;
  name: string | null;
  bio: string | null;
  email: string;
};

type Connection = {
  id: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  fromUserId: string;
  toUserId: string;
  fromUser: {
    id: string;
    name: string | null;
    email: string;
    username?: string;
  };
  toUser: {
    id: string;
    name: string | null;
    email: string;
    username?: string;
  };
};

type HabitShare = {
  id: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  message: string | null;
  createdAt: string;
  habit: {
    id: string;
    title: string;
    description: string | null;
    frequency: "DAILY" | "WEEKLY" | "MONTHLY";
  };
  fromUser: {
    id: string;
    name: string | null;
    email: string;
  };
};

type Partner = {
  partner: {
    id: string;
    name: string | null;
    email: string;
    username?: string;
  };
  habits: Array<{
    id: string;
    title: string;
    description: string | null;
    frequency: "DAILY" | "WEEKLY" | "MONTHLY";
    completions: Array<{
      id: string;
      completedAt: string;
    }>;
  }>;
};

export default function UnifiedPartnersPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<Tab>("discover");
  
  // Discover tab state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [connectionStatuses, setConnectionStatuses] = useState<Record<string, string>>({});

  // Requests tab state
  const [pendingConnections, setPendingConnections] = useState<Connection[]>([]);
  const [pendingHabitShares, setPendingHabitShares] = useState<HabitShare[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);

  // Partners tab state
  const [partners, setPartners] = useState<Partner[]>([]);
  const [partnersLoading, setPartnersLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);

  // Selected user for profile/message modal
  const [selectedUser, setSelectedUser] = useState<User | Partner["partner"] | null>(null);

  // Search users (Discover tab)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        searchUsers();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Fetch data when tab changes
  useEffect(() => {
    if (activeTab === "requests") {
      fetchRequests();
    } else if (activeTab === "partners") {
      fetchPartners();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Auto-refresh partners
  useEffect(() => {
    if (activeTab === "partners" && autoRefresh) {
      const interval = setInterval(() => {
        fetchPartners();
      }, 30000);

      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, autoRefresh]);

  const searchUsers = async () => {
    setSearchLoading(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
        data.forEach((user: User) => {
          fetchConnectionStatus(user.id);
        });
      }
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setSearchLoading(false);
    }
  };

  const fetchConnectionStatus = async (userId: string) => {
    try {
      const res = await fetch(`/api/connections?userId=${userId}`);
      if (res.ok) {
        const connections = await res.json();
        const connection = connections.find(
          (c: Connection) =>
            (c.fromUserId === session?.user?.id && c.toUserId === userId) ||
            (c.toUserId === session?.user?.id && c.fromUserId === userId)
        );

        setConnectionStatuses((prev) => ({
          ...prev,
          [userId]: connection
            ? connection.status === "ACCEPTED"
              ? "connected"
              : "pending"
            : "none",
        }));
      }
    } catch (error) {
      console.error("Error fetching connection status:", error);
    }
  };

  const handleAddConnection = async (userId: string) => {
    try {
      const res = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toUserId: userId }),
      });

      if (res.ok) {
        await fetchConnectionStatus(userId);
      } else {
        const data = await res.json();
        alert(`Error: ${data.error || "Failed to add connection"}`);
      }
    } catch (error) {
      console.error("Error adding connection:", error);
      alert("Failed to add connection");
    }
  };

  const fetchRequests = async () => {
    setRequestsLoading(true);
    try {
      // Fetch pending connection requests
      const connectionsRes = await fetch("/api/connections");
      if (connectionsRes.ok) {
        const connections = await connectionsRes.json();
        const pending = connections.filter(
          (c: Connection) =>
            c.status === "PENDING" && c.toUserId === session?.user?.id
        );
        setPendingConnections(pending);
      }

      // Fetch pending habit share invitations
      const sharesRes = await fetch("/api/habit-shares?type=received");
      if (sharesRes.ok) {
        const shares = await sharesRes.json();
        setPendingHabitShares(shares);
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleAcceptConnection = async (connectionId: string) => {
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
      console.error("Error accepting connection:", error);
    }
  };

  const handleRejectConnection = async (connectionId: string) => {
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
      console.error("Error rejecting connection:", error);
    }
  };

  const handleAcceptHabitShare = async (shareId: string) => {
    try {
      const res = await fetch(`/api/habit-shares/${shareId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACCEPTED" }),
      });

      if (res.ok) {
        alert("Habit added to your list!");
        fetchRequests();
      }
    } catch (error) {
      console.error("Error accepting habit share:", error);
      alert("Failed to accept habit");
    }
  };

  const handleRejectHabitShare = async (shareId: string) => {
    try {
      const res = await fetch(`/api/habit-shares/${shareId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REJECTED" }),
      });

      if (res.ok) {
        fetchRequests();
      }
    } catch (error) {
      console.error("Error rejecting habit share:", error);
    }
  };

  const fetchPartners = async () => {
    setPartnersLoading(true);
    try {
      const res = await fetch("/api/partners");
      if (res.ok) {
        const data = await res.json();
        setPartners(data);
      }
    } catch (error) {
      console.error("Error fetching partners:", error);
    } finally {
      setPartnersLoading(false);
    }
  };

  const isCompletedToday = (completions: Array<{ completedAt: string }>) => {
    const today = new Date().toDateString();
    return completions.some(
      (c) => new Date(c.completedAt).toDateString() === today
    );
  };

  const getStreak = (completions: Array<{ completedAt: string }>) => {
    if (completions.length === 0) return 0;

    const dates = completions
      .map((c) => new Date(c.completedAt).toDateString())
      .filter((date, index, self) => self.indexOf(date) === index)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    let streak = 0;
    let currentDate = new Date();

    for (const date of dates) {
      const completionDate = new Date(date);
      const diffDays = Math.floor(
        (currentDate.getTime() - completionDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === streak) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  const handleSendReminder = async (partnerId: string, habitTitle: string) => {
    setSendingReminder(partnerId);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toUserId: partnerId,
          content: `🔔 Reminder: Don't forget to complete "${habitTitle}" today!`,
        }),
      });

      if (res.ok) {
        alert("Reminder sent successfully!");
      }
    } catch (error) {
      console.error("Error sending reminder:", error);
      alert("Failed to send reminder");
    } finally {
      setSendingReminder(null);
    }
  };

  const handleUserClick = (user: User | Partner["partner"]) => {
    setSelectedUser(user);
  };

  return (
    <div>
      <h1 className="retro-heading text-2xl mb-6">
        Social Hub
      </h1>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-8 border-b-2 border-[color:var(--border)]">
        <button
          onClick={() => setActiveTab("discover")}
          className={`px-6 py-3 retro-subheading text-xs transition-all border-b-4 ${
            activeTab === "discover"
              ? "border-[color:var(--border)] bg-[color:var(--text)] text-[color:var(--background)]"
              : "border-transparent hover:bg-[color:var(--surface-alt)]"
          }`}
        >
          Discover
        </button>
        <button
          onClick={() => setActiveTab("requests")}
          className={`px-6 py-3 retro-subheading text-xs transition-all border-b-4 relative ${
            activeTab === "requests"
              ? "border-[color:var(--border)] bg-[color:var(--text)] text-[color:var(--background)]"
              : "border-transparent hover:bg-[color:var(--surface-alt)]"
          }`}
        >
          Requests
          {(pendingConnections.length > 0 || pendingHabitShares.length > 0) && (
            <span className="absolute -top-1 -right-1 retro-badge">
              {pendingConnections.length + pendingHabitShares.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("partners")}
          className={`px-6 py-3 retro-subheading text-xs transition-all border-b-4 ${
            activeTab === "partners"
              ? "border-[color:var(--border)] bg-[color:var(--text)] text-[color:var(--background)]"
              : "border-transparent hover:bg-[color:var(--surface-alt)]"
          }`}
        >
          Partners
        </button>
      </div>

      {/* Discover Tab */}
      {activeTab === "discover" && (
        <div>
          <div className="mb-8">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH BY USERNAME OR NAME"
              className="retro-input text-xs"
            />
            {searchQuery.length > 0 && searchQuery.length < 2 && (
              <p className="mt-2 retro-text-muted text-xs uppercase tracking-wider">
                TYPE AT LEAST 2 CHARACTERS TO SEARCH
              </p>
            )}
          </div>

          {searchLoading && (
            <div className="text-center py-8">
              <div className="retro-text-muted uppercase tracking-widest animate-pulse">SEARCHING...</div>
            </div>
          )}

          {searchResults.length === 0 && !searchLoading && searchQuery.length >= 2 && (
            <div className="text-center py-8">
              <div className="retro-text-muted uppercase tracking-widest">NO USERS FOUND</div>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map((user) => {
                const status = connectionStatuses[user.id] || "none";
                return (
                  <div
                    key={user.id}
                    className="retro-panel p-6 flex flex-col hover-lift"
                  >
                    <div className="flex-1">
                      <div className="mb-4">
                        <button
                          onClick={() => handleUserClick(user)}
                          className="retro-heading text-base hover:underline break-words text-left"
                        >
                          @{user.username}
                        </button>
                        {user.name && (
                          <p className="retro-text-muted text-xs uppercase tracking-wide mt-1">
                            {user.name}
                          </p>
                        )}
                      </div>

                      {user.bio && (
                        <p className="text-sm mb-4 break-words leading-relaxed">
                          {user.bio}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleAddConnection(user.id)}
                      disabled={status !== "none"}
                      className={`retro-button w-full text-xs ${
                        status !== "none" ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      {status === "none"
                        ? "Add Connection"
                        : status === "pending"
                        ? "Pending"
                        : "Connected"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {searchQuery.length === 0 && (
            <div className="retro-panel p-8 text-center">
              <p className="retro-text-muted uppercase tracking-wider">
                START TYPING TO SEARCH FOR USERS TO CONNECT WITH!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Requests Tab */}
      {activeTab === "requests" && (
        <div>
          {requestsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="retro-text-muted uppercase tracking-widest animate-pulse">LOADING...</div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Connection Requests */}
              <div>
                <h2 className="retro-subheading text-base mb-4">
                  Connection Requests
                </h2>
                {pendingConnections.length === 0 ? (
                  <div className="retro-panel p-8 text-center">
                    <p className="retro-text-muted uppercase tracking-wider">
                      NO PENDING CONNECTION REQUESTS
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingConnections.map((request) => (
                      <div
                        key={request.id}
                        className="retro-panel p-6 flex items-center justify-between hover-lift"
                      >
                        <div className="flex-1">
                          <button
                            onClick={() => handleUserClick(request.fromUser)}
                            className="retro-heading text-base hover:underline text-left"
                          >
                            {request.fromUser.name || request.fromUser.email}
                          </button>
                          <p className="retro-text-muted text-xs uppercase tracking-wide mt-1">
                            {request.fromUser.email}
                          </p>
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={() => handleAcceptConnection(request.id)}
                            className="retro-button px-4 py-2 text-xs"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRejectConnection(request.id)}
                            className="retro-button-outline px-4 py-2 text-xs"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Habit Share Invitations */}
              <div>
                <h2 className="retro-subheading text-base mb-4">
                  Habit Invitations
                </h2>
                {pendingHabitShares.length === 0 ? (
                  <div className="retro-panel p-8 text-center">
                    <p className="retro-text-muted uppercase tracking-wider">
                      NO PENDING HABIT INVITATIONS
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingHabitShares.map((share) => (
                      <div
                        key={share.id}
                        className="retro-panel p-6 hover-lift"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <button
                              onClick={() => handleUserClick(share.fromUser)}
                              className="retro-subheading text-sm hover:underline"
                            >
                              {share.fromUser.name || share.fromUser.email}
                            </button>
                            <p className="retro-text-muted text-[0.65rem] uppercase tracking-wider mt-1">
                              WANTS TO SHARE A HABIT WITH YOU
                            </p>
                          </div>
                          <span className="retro-tag text-[0.65rem]">
                            {share.habit.frequency}
                          </span>
                        </div>

                        <h3 className="retro-heading text-base mb-2">
                          {share.habit.title}
                        </h3>
                        
                        {share.habit.description && (
                          <p className="text-sm mb-3 leading-relaxed">
                            {share.habit.description}
                          </p>
                        )}

                        {share.message && (
                          <p className="text-xs retro-text-muted italic border-l-4 border-[color:var(--border)] pl-3 py-2 mb-4">
                            &ldquo;{share.message}&rdquo;
                          </p>
                        )}

                        <div className="flex gap-3">
                          <button
                            onClick={() => handleAcceptHabitShare(share.id)}
                            className="retro-button flex-1 text-xs"
                          >
                            ✓ Accept & Add to My Habits
                          </button>
                          <button
                            onClick={() => handleRejectHabitShare(share.id)}
                            className="retro-button-outline px-4 py-2 text-xs"
                          >
                            ✕ Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Partners Tab */}
      {activeTab === "partners" && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <p className="retro-text-muted text-xs uppercase tracking-wider">
              See how your accountability partners are doing
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchPartners()}
                className="retro-button-outline px-4 py-2 text-xs"
              >
                🔄 Refresh
              </button>
              <label className="flex items-center gap-2 text-xs uppercase tracking-wide font-bold">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="border-2 border-[color:var(--border)]"
                />
                Auto-refresh
              </label>
            </div>
          </div>

          {partnersLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="retro-text-muted uppercase tracking-widest animate-pulse">Loading...</div>
            </div>
          ) : partners.length === 0 ? (
            <div className="retro-panel p-12 text-center">
              <p className="retro-text-muted uppercase tracking-wider mb-4">
                No partners yet. Connect with others in the Discover tab!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {partners.map((partnerData) => (
                <div
                  key={partnerData.partner.id}
                  className="retro-panel p-6 hover-lift cursor-pointer"
                  onClick={() => handleUserClick(partnerData.partner)}
                >
                  <div className="flex items-center justify-center mb-4">
                    <div className="retro-avatar w-20 h-20 text-3xl">
                      {(partnerData.partner.name || "P")[0].toUpperCase()}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <h3 className="retro-heading text-lg mb-4">
                      {partnerData.partner.name || "Partner"}
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="retro-panel-flat p-3">
                        <p className="text-2xl font-black">
                          {partnerData.habits.length}
                        </p>
                        <p className="retro-text-muted text-[0.65rem] uppercase tracking-wider mt-1">
                          Habits
                        </p>
                      </div>
                      <div className="retro-panel-flat p-3">
                        <p className="text-2xl font-black">
                          {partnerData.habits.reduce((acc, h) => acc + h.completions.length, 0)}
                        </p>
                        <p className="retro-text-muted text-[0.65rem] uppercase tracking-wider mt-1">
                          Total
                        </p>
                      </div>
                    </div>
                    
                    <p className="retro-text-muted text-xs uppercase tracking-wider mt-4">
                      Click to view profile
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* User Profile Modal */}
      {selectedUser && (
        <UserProfileModal
          userId={selectedUser.id}
          onClose={() => setSelectedUser(null)}
          onMessage={() => {
            // Navigation is now handled in the modal itself
          }}
        />
      )}
    </div>
  );
}
