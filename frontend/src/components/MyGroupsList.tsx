import React, { useEffect, useState } from "react";
import { Button } from "~/ui/Button";

function resolveApiBase(): string {
  // 1. Prefer explicit env variable if it exists
  const envBase = (import.meta as any).env?.VITE_API_BASE as
    | string
    | undefined;

  if (envBase && envBase.trim().length > 0) {
    return envBase.trim();
  }

  // 2. Fall back to same host, port 5050 (works on any machine
  //    as long as backend is running on 5050)
  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:5050`;
  }

  // 3. Last resort fallback
  return "http://localhost:5050";
}

const API_BASE = resolveApiBase();

interface Group {
  _id: string;
  name: string;
  description?: string;
  createdBy: string | { _id: string };
  members?: unknown[];
}

interface MyGroupsListProps {
  onSelectGroup?: (groupId: string) => void;
}

function getAuthInfo() {
  try {
    const raw = localStorage.getItem("auth");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function MyGroupsList({ onSelectGroup }: MyGroupsListProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const auth = getAuthInfo();
  const token: string | null = auth?.token ?? null;
  const currentUserId: string | null = auth?.user?.id ?? null;

  useEffect(() => {
    async function fetchGroups() {
      setError(null);
      if (!token) {
        // Not logged in → no groups section at all
        return;
      }

      try {
        setLoading(true);
        const resp = await fetch(`${API_BASE}/api/groups/mine`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await resp.json();

        // Be defensive in case someone’s backend is slightly different
        if (data && typeof data === "object") {
          if (data.ok === false) {
            setError(
              typeof data.error === "string"
                ? data.error
                : "Failed to load groups."
            );
            return;
          }

          // If backend returns `{ ok: true, data: [...] }`
          if (data.ok === true && Array.isArray(data.data)) {
            setGroups(data.data);
            return;
          }

          // If backend returns plain `[ ... ]`
          if (Array.isArray(data)) {
            setGroups(data);
            return;
          }
        }

        setError("Failed to load groups.");
      } catch (err) {
        console.error(err);
        setError("Failed to load groups.");
      } finally {
        setLoading(false);
      }
    }

    fetchGroups();
  }, [token]);

  async function handleDelete(groupId: string) {
    if (!token) return;
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this group for everyone?"
    );
    if (!confirmDelete) return;

    try {
      const resp = await fetch(`${API_BASE}/api/groups/${groupId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await resp.json();

      if (data && typeof data === "object" && data.ok === false) {
        alert(
          typeof data.error === "string"
            ? data.error
            : "Failed to delete group."
        );
        return;
      }

      setGroups((prev) => prev.filter((g) => g._id !== groupId));
    } catch (err) {
      console.error(err);
      alert("Failed to delete group.");
    }
  }

  if (!token) {
    // If not logged in, just don’t render anything;
    // this avoids weird errors on other machines.
    return null;
  }

  if (loading && groups.length === 0) {
    return (
      <div className="mt-6 text-sm text-stone-300">
        Loading your groups...
      </div>
    );
  }

  if (error && groups.length === 0) {
    return (
      <div className="mt-6 border border-red-500 bg-red-900/40 text-sm p-3 rounded">
        Failed to load groups: {error}
      </div>
    );
  }

  if (groups.length === 0) {
    return null; // no groups yet, keep UI clean
  }

  return (
    <section className="mt-6 space-y-2">
      <h2 className="text-lg font-semibold mb-1">Your groups</h2>
      <ul className="space-y-2">
        {groups.map((g) => {
          const createdById =
            typeof g.createdBy === "string"
              ? g.createdBy
              : (g.createdBy as any)?._id;
          const isCreator =
            currentUserId && createdById === currentUserId;

          return (
            <li
              key={g._id}
              className="border border-fuchsia-500/40 rounded px-4 py-3 flex items-center justify-between hover:bg-stone-800/40 transition-colors"
            >
              <button
                type="button"
                className="text-left flex-1"
                onClick={() => onSelectGroup?.(g._id)}
              >
                <div className="font-semibold">{g.name}</div>
                {g.description && (
                  <div className="text-sm opacity-70">
                    {g.description}
                  </div>
                )}
              </button>

              {isCreator && (
                <Button
                  variant="secondary"
                  className="ml-4"
                  onPress={() => handleDelete(g._id)}
                >
                  Delete Group
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
