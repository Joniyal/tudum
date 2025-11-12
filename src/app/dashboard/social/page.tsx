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
    <div className="font-mono">
      <h1 className="text-3xl font-black text-white mb-6 uppercase tracking-wider">
        SOCIAL HUB
      </h1>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-8 border-b-2 border-white">
        <button
          onClick={() => setActiveTab("discover")}
          className={`px-6 py-3 font-black uppercase tracking-wider transition-all border-b-4 ${
            activeTab === "discover"
              ? "border-white bg-white text-black"
              : "border-transparent text-white hover:bg-white hover:text-black"
          }`}
        >
          DISCOVER
        </button>
        <button
          onClick={() => setActiveTab("requests")}
          className={`px-6 py-3 font-black uppercase tracking-wider transition-all border-b-4 relative ${
            activeTab === "requests"
              ? "border-white bg-white text-black"
              : "border-transparent text-white hover:bg-white hover:text-black"
          }`}
        >
          REQUESTS
          {(pendingConnections.length > 0 || pendingHabitShares.length > 0) && (
            <span className="absolute -top-1 -right-1 bg-white text-black text-xs font-black rounded-none h-5 w-5 flex items-center justify-center border-2 border-white">
              {pendingConnections.length + pendingHabitShares.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("partners")}
          className={`px-6 py-3 font-black uppercase tracking-wider transition-all border-b-4 ${
            activeTab === "partners"
              ? "border-white bg-white text-black"
              : "border-transparent text-white hover:bg-white hover:text-black"
          }`}
        >
          PARTNERS
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
              className="w-full px-4 py-3 border-2 border-white bg-black text-white font-bold placeholder-gray-500 focus:outline-none uppercase"
            />
            {searchQuery.length > 0 && searchQuery.length < 2 && (
              <p className="mt-2 text-sm text-white font-bold uppercase">
                TYPE AT LEAST 2 CHARACTERS TO SEARCH
              </p>
            )}
          </div>

          {searchLoading && (
            <div className="text-center py-8">
              <div className="text-white font-bold uppercase">SEARCHING...</div>
            </div>
          )}

          {searchResults.length === 0 && !searchLoading && searchQuery.length >= 2 && (
            <div className="text-center py-8">
              <div className="text-white font-bold uppercase">NO USERS FOUND</div>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map((user) => {
                const status = connectionStatuses[user.id] || "none";
                return (
                  <div
                    key={user.id}
                    className="bg-black border-2 border-white p-6 flex flex-col"
                    style={{boxShadow: '4px 4px 0px rgba(255,255,255,0.2)'}}
                  >
                    <div className="flex-1">
                      <div className="mb-4">
                        <button
                          onClick={() => handleUserClick(user)}
                          className="text-lg font-black text-white hover:underline break-words text-left uppercase tracking-wider"
                        >
                          @{user.username}
                        </button>
                        {user.name && (
                          <p className="text-sm text-white font-bold uppercase">
                            {user.name}
                          </p>
                        )}
                      </div>

                      {user.bio && (
                        <p className="text-sm text-white font-bold mb-4 break-words opacity-80">
                          {user.bio}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleAddConnection(user.id)}
                      disabled={status !== "none"}
                      className={`w-full px-4 py-2 font-black uppercase tracking-wider transition-all border-2 ${
                        status === "none"
                          ? "bg-white text-black border-white hover:bg-black hover:text-white"
                          : status === "pending"
                          ? "bg-black text-white border-white opacity-50 cursor-not-allowed"
                          : "bg-black text-white border-white opacity-50 cursor-not-allowed"
                      }`}
                    >
                      {status === "none"
                        ? "ADD CONNECTION"
                        : status === "pending"
                        ? "PENDING"
                        : "CONNECTED"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {searchQuery.length === 0 && (
            <div className="bg-black border-2 border-white p-8 text-center">
              <p className="text-white font-bold uppercase">
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
              <div className="text-white font-bold uppercase">LOADING...</div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Connection Requests */}
              <div>
                <h2 className="text-xl font-black text-white mb-4 uppercase tracking-wider">
                  CONNECTION REQUESTS
                </h2>
                {pendingConnections.length === 0 ? (
                  <div className="bg-black border-2 border-white p-8 text-center">
                    <p className="text-white font-bold uppercase">
                      NO PENDING CONNECTION REQUESTS
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingConnections.map((request) => (
                      <div
                        key={request.id}
                        className="bg-black border-2 border-white p-6 flex items-center justify-between"
                        style={{boxShadow: '4px 4px 0px rgba(255,255,255,0.2)'}}
                      >
                        <div className="flex-1">
                          <button
                            onClick={() => handleUserClick(request.fromUser)}
                            className="text-lg font-black text-white hover:underline text-left uppercase tracking-wider"
                          >
                            {request.fromUser.name || request.fromUser.email}
                          </button>
                          <p className="text-sm text-white font-bold uppercase">
                            {request.fromUser.email}
                          </p>
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={() => handleAcceptConnection(request.id)}
                            className="px-4 py-2 bg-white text-black font-black border-2 border-white hover:bg-black hover:text-white uppercase tracking-wider transition-all"
                          >
                            ACCEPT
                          </button>
                          <button
                            onClick={() => handleRejectConnection(request.id)}
                            className="px-4 py-2 bg-black text-white font-black border-2 border-white hover:bg-white hover:text-black uppercase tracking-wider transition-all"
                          >
                            REJECT
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Habit Share Invitations */}
              <div>
                <h2 className="text-xl font-black text-white mb-4 uppercase tracking-wider">
                  HABIT INVITATIONS
                </h2>
                {pendingHabitShares.length === 0 ? (
                  <div className="bg-black border-2 border-white p-8 text-center">
                    <p className="text-white font-bold uppercase">
                      NO PENDING HABIT INVITATIONS
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingHabitShares.map((share) => (
                      <div
                        key={share.id}
                        className="bg-black border-2 border-white p-6"
                        style={{boxShadow: '4px 4px 0px rgba(255,255,255,0.2)'}}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <button
                              onClick={() => handleUserClick(share.fromUser)}
                              className="text-sm text-white font-black hover:underline uppercase tracking-wider"
                            >
                              {share.fromUser.name || share.fromUser.email}
                            </button>
                            <p className="text-xs text-white font-bold uppercase">
                              WANTS TO SHARE A HABIT WITH YOU
                            </p>
                          </div>
                          <span className="px-2 py-1 text-xs font-black bg-white text-black border-2 border-white uppercase tracking-wider">
                            {share.habit.frequency}
                          </span>
                        </div>

                        <h3 className="text-lg font-black text-white mb-2 uppercase tracking-wider">
                          {share.habit.title}
                        </h3>
                        
                        {share.habit.description && (
                          <p className="text-sm text-white font-bold mb-3 opacity-80">
                            {share.habit.description}
                          </p>
                        )}

                        {share.message && (
                          <p className="text-sm italic text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-3 rounded mb-4">
                            &ldquo;{share.message}&rdquo;
                          </p>
                        )}

                        <div className="flex gap-3">
                          <button
                            onClick={() => handleAcceptHabitShare(share.id)}
                            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition"
                          >
                            ✓ Accept & Add to My Habits
                          </button>
                          <button
                            onClick={() => handleRejectHabitShare(share.id)}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition"
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
            <p className="text-gray-600 dark:text-gray-400">
              See how your accountability partners are doing
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchPartners()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition"
              >
                🔄 Refresh
              </button>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                />
                Auto-refresh
              </label>
            </div>
          </div>

          {partnersLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-600 dark:text-gray-400">Loading...</div>
            </div>
          ) : partners.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No partners yet. Connect with others in the Discover tab!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {partners.map((partnerData) => (
                <div
                  key={partnerData.partner.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer"
                  onClick={() => handleUserClick(partnerData.partner)}
                >
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-20 h-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                      {(partnerData.partner.name || "P")[0].toUpperCase()}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {partnerData.partner.name || "Partner"}
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-3">
                        <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                          {partnerData.habits.length}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Habits
                        </p>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3">
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {partnerData.habits.reduce((acc, h) => acc + h.completions.length, 0)}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Total
                        </p>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
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
