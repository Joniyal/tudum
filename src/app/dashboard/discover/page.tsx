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
    <div className="font-mono">
      <h1 className="text-3xl font-black text-white mb-8 uppercase tracking-wider">
        DISCOVER USERS
      </h1>

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

      {loading && (
        <div className="text-center py-8">
          <div className="text-white font-bold uppercase">SEARCHING...</div>
        </div>
      )}

      {searchResults.length === 0 && !loading && searchQuery.length >= 2 && (
        <div className="text-center py-8">
          <div className="text-white font-bold uppercase">
            NO USERS FOUND
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
                className="bg-black border-2 border-white p-6 flex flex-col"
                style={{boxShadow: '4px 4px 0px rgba(255,255,255,0.2)'}}
              >
                <div className="flex-1">
                  <div className="mb-4">
                    <h3 className="text-lg font-black text-white break-words uppercase tracking-wider">
                      @{user.username}
                    </h3>
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
            Start typing to search for users to connect with!
          </p>
        </div>
      )}
    </div>
  );
}
