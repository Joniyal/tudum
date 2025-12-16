"use client";

import { useEffect, useState } from "react";
import { HeartIcon, RefreshIcon } from "@/components/Icons";

interface Connection {
  id: string;
  status: string;
  createdAt: string;
  fromUser: {
    id: string;
    username: string;
    email: string;
  };
  toUser: {
    id: string;
    username: string;
    email: string;
  };
}

export default function AdminConnectionsPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "ACCEPTED" | "PENDING">("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/connections");
      if (!res.ok) throw new Error("Failed to fetch connections");
      const data = await res.json();
      setConnections(data.connections);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const deleteConnection = async (connectionId: string) => {
    if (!confirm("Are you sure you want to delete this connection?")) {
      return;
    }

    setActionLoading(connectionId);
    try {
      const res = await fetch(`/api/admin/connections/${connectionId}`, {
        method: "DELETE",
      });
      
      if (!res.ok) throw new Error("Failed to delete connection");
      
      setConnections(connections.filter(c => c.id !== connectionId));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setActionLoading(null);
    }
  };

  const updateStatus = async (connectionId: string, status: string) => {
    setActionLoading(connectionId);
    try {
      const res = await fetch(`/api/admin/connections/${connectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      
      if (!res.ok) throw new Error("Failed to update connection");
      
      setConnections(connections.map(c => 
        c.id === connectionId ? { ...c, status } : c
      ));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredConnections = connections.filter(connection => {
    const matchesSearch = 
      connection.fromUser.username.toLowerCase().includes(search.toLowerCase()) ||
      connection.toUser.username.toLowerCase().includes(search.toLowerCase());
    
    const matchesFilter = 
      filter === "all" || connection.status === filter;
    
    return matchesSearch && matchesFilter;
  });

  const acceptedCount = connections.filter(c => c.status === "ACCEPTED").length;
  const pendingCount = connections.filter(c => c.status === "PENDING").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div 
          className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: 'var(--border)', borderTopColor: 'var(--text)' }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="p-4 rounded-lg border text-center"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
      >
        <p style={{ color: 'var(--muted)' }}>{error}</p>
        <button 
          onClick={fetchConnections}
          className="mt-4 px-4 py-2 rounded-lg border transition-colors"
          style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <HeartIcon className="w-6 h-6" />
            Connection Management
          </h1>
          <p style={{ color: 'var(--muted)' }}>
            {acceptedCount} accepted · {pendingCount} pending
          </p>
        </div>
        <button
          onClick={fetchConnections}
          className="p-2 rounded-lg border transition-colors"
          style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
        >
          <RefreshIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
          style={{ 
            borderColor: 'var(--border)', 
            background: 'var(--surface)', 
            color: 'var(--text)',
          }}
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
          className="px-4 py-2 rounded-lg border focus:outline-none"
          style={{ 
            borderColor: 'var(--border)', 
            background: 'var(--surface)', 
            color: 'var(--text)',
          }}
        >
          <option value="all">All Connections</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="PENDING">Pending</option>
        </select>
      </div>

      {/* Connections Table */}
      <div 
        className="rounded-lg border overflow-hidden"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ background: 'var(--surface)' }}>
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium" style={{ color: 'var(--muted)' }}>
                  From
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium" style={{ color: 'var(--muted)' }}>
                  To
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium" style={{ color: 'var(--muted)' }}>
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium" style={{ color: 'var(--muted)' }}>
                  Created
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium" style={{ color: 'var(--muted)' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredConnections.map((connection) => (
                <tr 
                  key={connection.id}
                  className="border-t"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium" style={{ color: 'var(--text)' }}>
                        @{connection.fromUser.username}
                      </p>
                      <p className="text-sm" style={{ color: 'var(--muted)' }}>
                        {connection.fromUser.email}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium" style={{ color: 'var(--text)' }}>
                        @{connection.toUser.username}
                      </p>
                      <p className="text-sm" style={{ color: 'var(--muted)' }}>
                        {connection.toUser.email}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span 
                      className="px-2 py-1 rounded text-xs font-medium"
                      style={{ 
                        background: connection.status === "ACCEPTED" ? 'var(--text)' : 'var(--surface)',
                        color: connection.status === "ACCEPTED" ? 'var(--background)' : 'var(--muted)',
                        border: connection.status === "ACCEPTED" ? 'none' : '1px solid var(--border)'
                      }}
                    >
                      {connection.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm" style={{ color: 'var(--muted)' }}>
                    {new Date(connection.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {connection.status === "PENDING" && (
                        <button
                          onClick={() => updateStatus(connection.id, "ACCEPTED")}
                          disabled={actionLoading === connection.id}
                          className="px-3 py-1.5 text-sm rounded-lg border transition-colors disabled:opacity-50"
                          style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                        >
                          Accept
                        </button>
                      )}
                      <button
                        onClick={() => deleteConnection(connection.id)}
                        disabled={actionLoading === connection.id}
                        className="px-3 py-1.5 text-sm rounded-lg border transition-colors disabled:opacity-50"
                        style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredConnections.length === 0 && (
          <div className="p-8 text-center" style={{ color: 'var(--muted)' }}>
            No connections found
          </div>
        )}
      </div>
    </div>
  );
}
