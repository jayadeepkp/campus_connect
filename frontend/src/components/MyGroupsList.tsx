// src/components/MyGroupsList.tsx
import React, { useEffect, useState } from "react";

const API_BASE =
  ((import.meta as any).env?.VITE_API_BASE as string | undefined) ??
  "http://localhost:5050";

interface Group {
  _id: string;
  name: string;
  description?: string;
  isPublic: boolean;
}

export function MyGroupsList() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGroups() {
      try {
        const auth = localStorage.getItem("auth");
        const token = auth ? JSON.parse(auth).token : null;
        if (!token) {
          setError("You must be logged in to see your groups.");
          setLoading(false);
          return;
        }

        // Use /mine endpoint
        const resp = await fetch(`${API_BASE}/api/groups/mine`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await resp.json();
        console.log("My groups response:", data);

        if (!resp.ok || !data.ok) {
          setError(data.error || "Failed to load groups.");
          setLoading(false);
          return;
        }

        setGroups(data.data || []);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Something went wrong while loading groups.");
        setLoading(false);
      }
    }

    fetchGroups();
  }, []);

  async function handleDelete(id: string) {
    const auth = localStorage.getItem("auth");
    const token = auth ? JSON.parse(auth).token : null;
    if (!token) return;

    const sure = window.confirm("Are you sure you want to delete this group?");
    if (!sure) return;

    try {
      const resp = await fetch(`${API_BASE}/api/groups/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await resp.json();
      if (!resp.ok || !data.ok) {
        console.error(data.error || "Failed to delete group.");
        return;
      }

      // Remove deleted group from UI
      setGroups((prev) => prev.filter((g) => g._id !== id));
    } catch (err) {
      console.error("Delete error:", err);
    }
  }

  if (loading) {
    return <p className="mt-8">Loading your groups…</p>;
  }

  if (error) {
    return <p className="mt-8 text-red-400">{error}</p>;
  }

  if (groups.length === 0) {
    return <p className="mt-8">You haven’t created any groups yet.</p>;
  }

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-2">Your groups</h3>
      <ul className="space-y-2">
        {groups.map((g) => (
          <li
            key={g._id}
            className="border border-fuchsia-500/40 rounded px-3 py-2 flex justify-between items-start"
          >
            <div>
              <div className="font-medium">{g.name}</div>
              {g.description && (
                <div className="text-sm opacity-70">{g.description}</div>
              )}
            </div>

            <button
              onClick={() => handleDelete(g._id)}
              className="text-red-400 hover:text-red-600 text-sm"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
