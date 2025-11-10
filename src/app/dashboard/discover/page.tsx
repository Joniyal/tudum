"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

type User = {
  id: string;
  username: string;
  name: string | null;
  bio: string | null;
};

type ConnectionStatus = {
  status: "pending" | "connected" | "none";
};

export default function DiscoverPage() {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [connectionStatuses, setConnectionStatuses] = useState<
    Record<string, ConnectionStatus>
  >({});

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

  const searchUsers = async () => {
    setLoading(true);
    try {
      console.log("[DISCOVER] Searching for:", searchQuery);
      const res = await fetch(
        `/api/users/search?q=${encodeURIComponent(searchQuery)}`
      );
      console.log("[DISCOVER] Search response status:", res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log("[DISCOVER] Search results:", data);
        setSearchResults(data);
        
        // Fetch connection statuses for all results
        data.forEach((user: User) => {
          fetchConnectionStatus(user.id);
        });
      } else {
        const errorData = await res.json();
        console.error("[DISCOVER] Search error:", errorData);
      }
    } catch (error) {
      console.error("[DISCOVER] Error searching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConnectionStatus = async (userId: string) => {
    try {
      const res = await fetch(`/api/connections?userId=${userId}`);
      if (res.ok) {
        const connections = await res.json();
        const connection = connections.find(
          (c: any) =>
            (c.fromUserId === session?.user?.id && c.toUserId === userId) ||
            (c.toUserId === session?.user?.id && c.fromUserId === userId)
        );

        setConnectionStatuses((prev) => ({
          ...prev,
          [userId]: {
            status: connection
              ? connection.status === "ACCEPTED"
                ? "connected"
                : "pending"
              : "none",
          },
        }));
      }
    } catch (error) {
      console.error("Error fetching connection status:", error);
    }
  };

  const handleAddConnection = async (userId: string) => {
    try {
      console.log("[DISCOVER] Adding connection to user:", userId);
      const payload = { toUserId: userId };
      console.log("[DISCOVER] Payload:", JSON.stringify(payload));
      
      const res = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log("[DISCOVER] Response status:", res.status);
      const data = await res.json();
      console.log("[DISCOVER] Response data:", data);

      if (res.ok) {
        console.log("[DISCOVER] Connection created successfully");
        await fetchConnectionStatus(userId);
      } else {
        const errorMsg = data.error || data.message || "Failed to add connection";
        console.error("[DISCOVER] Error response:", errorMsg);
        alert(`Error: ${errorMsg}`);
      }
    } catch (error) {
      console.error("[DISCOVER] Error adding connection:", error);
      alert("Failed to add connection - check console for details");
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Discover Users
      </h1>

      {/* Debug info */}
      {session?.user && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-sm">
          <strong>Logged in as:</strong> @{session.user.name} ({session.user.email}) - ID: {session.user.id}
        </div>
      )}

      <div className="mb-8">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by username or name (min 2 characters)"
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
        />
        {searchQuery.length > 0 && searchQuery.length < 2 && (
          <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
            Type at least 2 characters to search
          </p>
        )}
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="text-gray-600 dark:text-gray-400">Searching...</div>
        </div>
      )}

      {searchResults.length === 0 && !loading && searchQuery.length >= 2 && (
        <div className="text-center py-8">
          <div className="text-gray-600 dark:text-gray-400">
            No users found
          </div>
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {searchResults.map((user) => {
            const status = connectionStatuses[user.id]?.status || "none";
            return (
              <div
                key={user.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col"
              >
                <div className="flex-1">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white break-words">
                      @{user.username}
                    </h3>
                    {user.name && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {user.name}
                      </p>
                    )}
                  </div>

                  {user.bio && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 break-words">
                      {user.bio}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => handleAddConnection(user.id)}
                  disabled={status !== "none"}
                  className={`w-full px-4 py-2 rounded-lg font-semibold transition ${
                    status === "none"
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                      : status === "pending"
                      ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 cursor-not-allowed"
                      : "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 cursor-not-allowed"
                  }`}
                >
                  {status === "none"
                    ? "🤝 Add Connection"
                    : status === "pending"
                    ? "⏳ Pending"
                    : "✓ Connected"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {searchQuery.length === 0 && (
        <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-lg p-8 text-center">
          <p className="text-gray-700 dark:text-gray-300">
            Start typing to search for users to connect with!
          </p>
        </div>
      )}
    </div>
  );
}
