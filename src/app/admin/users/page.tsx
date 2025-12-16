"use client";

import { useEffect, useState } from "react";
import { UsersIcon, RefreshIcon } from "@/components/Icons";

interface User {
  id: string;
  email: string;
  username: string;
  name: string | null;
  isAdmin: boolean;
  createdAt: string;
  _count: {
    habits: number;
    completions: number;
    connectionsFrom: number;
    connectionsTo: number;
  };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const toggleAdmin = async (userId: string, isAdmin: boolean) => {
    if (!confirm(`Are you sure you want to ${isAdmin ? "remove admin from" : "make admin"} this user?`)) {
      return;
    }

    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAdmin: !isAdmin }),
      });
      
      if (!res.ok) throw new Error("Failed to update user");
      
      setUsers(users.map(u => 
        u.id === userId ? { ...u, isAdmin: !isAdmin } : u
      ));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setActionLoading(null);
    }
  };

  const deleteUser = async (userId: string, username: string) => {
    const confirmation = prompt(`Type "${username}" to confirm deletion:`);
    if (confirmation !== username) {
      alert("Confirmation failed");
      return;
    }

    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      
      if (!res.ok) throw new Error("Failed to delete user");
      
      setUsers(users.filter(u => u.id !== userId));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase()) ||
    (user.name?.toLowerCase() || "").includes(search.toLowerCase())
  );

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
          onClick={fetchUsers}
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
            <UsersIcon className="w-6 h-6" />
            User Management
          </h1>
          <p style={{ color: 'var(--muted)' }}>
            {users.length} total users
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="p-2 rounded-lg border transition-colors"
          style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
        >
          <RefreshIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search users..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
        style={{ 
          borderColor: 'var(--border)', 
          background: 'var(--surface)', 
          color: 'var(--text)',
        }}
      />

      {/* Users Table */}
      <div 
        className="rounded-lg border overflow-hidden"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ background: 'var(--surface)' }}>
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium" style={{ color: 'var(--muted)' }}>
                  User
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium" style={{ color: 'var(--muted)' }}>
                  Stats
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium" style={{ color: 'var(--muted)' }}>
                  Joined
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium" style={{ color: 'var(--muted)' }}>
                  Role
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium" style={{ color: 'var(--muted)' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr 
                  key={user.id}
                  className="border-t"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium" style={{ color: 'var(--text)' }}>
                        @{user.username}
                      </p>
                      <p className="text-sm" style={{ color: 'var(--muted)' }}>
                        {user.email}
                      </p>
                      {user.name && (
                        <p className="text-sm" style={{ color: 'var(--muted)' }}>
                          {user.name}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm" style={{ color: 'var(--muted)' }}>
                      <p>{user._count.habits} habits</p>
                      <p>{user._count.completions} completions</p>
                      <p>{user._count.connectionsFrom + user._count.connectionsTo} connections</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm" style={{ color: 'var(--muted)' }}>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4">
                    <span 
                      className="px-2 py-1 rounded text-xs font-medium"
                      style={{ 
                        background: user.isAdmin ? 'var(--text)' : 'var(--surface)',
                        color: user.isAdmin ? 'var(--background)' : 'var(--muted)',
                        border: user.isAdmin ? 'none' : '1px solid var(--border)'
                      }}
                    >
                      {user.isAdmin ? "Admin" : "User"}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => toggleAdmin(user.id, user.isAdmin)}
                        disabled={actionLoading === user.id}
                        className="px-3 py-1.5 text-sm rounded-lg border transition-colors disabled:opacity-50"
                        style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                      >
                        {user.isAdmin ? "Remove Admin" : "Make Admin"}
                      </button>
                      <button
                        onClick={() => deleteUser(user.id, user.username)}
                        disabled={actionLoading === user.id}
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
        
        {filteredUsers.length === 0 && (
          <div className="p-8 text-center" style={{ color: 'var(--muted)' }}>
            No users found
          </div>
        )}
      </div>
    </div>
  );
}
