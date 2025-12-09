import React, { useEffect, useState, FormEvent } from "react";

function resolveApiBase(): string {
  const envBase = (import.meta as any).env?.VITE_API_BASE as
    | string
    | undefined;

  if (envBase && envBase.trim().length > 0) {
    return envBase.trim();
  }

  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:5050`;
  }

  return "http://localhost:5050";
}

const API_BASE = resolveApiBase();

interface GroupDetailPanelProps {
  groupId: string | null;
  onClose: () => void;
}

interface Group {
  _id: string;
  name: string;
  description?: string;
  createdBy?: { _id: string; name?: string; email?: string } | string;
  members?: { _id: string; name?: string; email?: string }[];
}

interface GroupMessage {
  _id: string;
  text: string;
  createdAt: string;
  sender?: { _id: string; name?: string; email?: string };
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

export function GroupDetailPanel({ groupId, onClose }: GroupDetailPanelProps) {
  const [group, setGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msgError, setMsgError] = useState<string | null>(null);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMessage, setNewMessage] = useState("");

  const auth = getAuthInfo();
  const token: string | null = auth?.token ?? null;
  const currentUserId: string | null = auth?.user?.id ?? null;

  useEffect(() => {
    if (!groupId || !token) {
      setGroup(null);
      setMessages([]);
      return;
    }

    async function fetchGroup() {
      setError(null);
      try {
        setLoading(true);
        const resp = await fetch(`${API_BASE}/api/groups/${groupId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const raw = await resp.json();

        if (raw && typeof raw === "object") {
          if (raw.ok === false) {
            setError(
              typeof raw.error === "string"
                ? raw.error
                : "Failed to load group details."
            );
            return;
          }
          if (raw.ok === true && raw.data) {
            setGroup(raw.data);
            return;
          }
        }

        setError("Failed to load group details.");
      } catch (err) {
        console.error(err);
        setError("Failed to load group details.");
      } finally {
        setLoading(false);
      }
    }

    async function fetchMessages() {
      setMsgError(null);
      try {
        setLoadingMessages(true);
        const resp = await fetch(
          `${API_BASE}/api/groups/${groupId}/messages`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const raw = await resp.json();

        if (raw && typeof raw === "object") {
          if (raw.ok === false) {
            setMsgError(
              typeof raw.error === "string"
                ? raw.error
                : "Failed to load messages."
            );
            return;
          }
          if (raw.ok === true && Array.isArray(raw.data)) {
            setMessages(raw.data);
            return;
          }
          if (Array.isArray(raw)) {
            setMessages(raw);
            return;
          }
        }

        setMsgError("Failed to load messages.");
      } catch (err) {
        console.error(err);
        setMsgError("Failed to load messages.");
      } finally {
        setLoadingMessages(false);
      }
    }

    fetchGroup();
    fetchMessages();
  }, [groupId, token]);

  if (!groupId || !token) {
    return null;
  }

  const createdById =
    group && group.createdBy
      ? typeof group.createdBy === "string"
        ? group.createdBy
        : (group.createdBy as any)._id
      : null;

  const isCreator = currentUserId && createdById === currentUserId;

  async function handleAddMember(e: FormEvent) {
    e.preventDefault();
    if (!newMemberEmail.trim() || !groupId || !token) return;

    try {
      setError(null);
      const resp = await fetch(
        `${API_BASE}/api/groups/${groupId}/members`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ email: newMemberEmail.trim() }),
        }
      );
      const raw = await resp.json();

      if (raw && typeof raw === "object") {
        if (raw.ok === false) {
          setError(
            typeof raw.error === "string"
              ? raw.error
              : "Failed to add member."
          );
          return;
        }
        if (raw.ok === true && raw.data) {
          setGroup(raw.data);
          setNewMemberEmail("");
          return;
        }
      }

      setError("Failed to add member.");
    } catch (err) {
      console.error(err);
      setError("Failed to add member.");
    }
  }

  async function handleSendMessage(e: FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !groupId || !token) return;

    try {
      setMsgError(null);
      const resp = await fetch(
        `${API_BASE}/api/groups/${groupId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text: newMessage.trim() }),
        }
      );
      const raw = await resp.json();

      if (raw && typeof raw === "object") {
        if (raw.ok === false) {
          setMsgError(
            typeof raw.error === "string"
              ? raw.error
              : "Failed to send message."
          );
          return;
        }
        if (raw.ok === true && raw.data) {
          setMessages((prev) => [...prev, raw.data]);
          setNewMessage("");
          return;
        }
      }

      setMsgError("Failed to send message.");
    } catch (err) {
      console.error(err);
      setMsgError("Failed to send message.");
    }
  }

  return (
    <section className="mt-6 border border-fuchsia-500/40 rounded p-4 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">
            {group ? group.name : "Loading group..."}
          </h2>
          {group?.description && (
            <p className="text-sm opacity-70">{group.description}</p>
          )}
        </div>
        <button
          type="button"
          className="text-sm underline opacity-70 hover:opacity-100"
          onClick={onClose}
        >
          Close
        </button>
      </div>

      {loading && !group && (
        <div className="text-sm opacity-70">Loading group details…</div>
      )}

      {error && (
        <div className="border border-red-500 bg-red-900/40 text-sm p-2 rounded">
          {error}
        </div>
      )}

      {/* Members */}
      <div>
        <h3 className="font-semibold mb-1">Members</h3>
        <ul className="text-sm space-y-1">
          {group?.members && group.members.length > 0 ? (
            group.members.map((m) => (
              <li key={m._id}>{m.name || m.email || m._id}</li>
            ))
          ) : (
            <li className="opacity-70">No members yet.</li>
          )}
        </ul>

        {isCreator && (
          <form
            onSubmit={handleAddMember}
            className="mt-2 flex flex-row gap-2 items-center"
          >
            <input
              type="email"
              required
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
              placeholder="Add member by email"
              className="flex-1 px-2 py-1 rounded bg-stone-900 border border-stone-600 text-sm"
            />
            <button
              type="submit"
              className="px-3 py-1 rounded bg-fuchsia-600 text-sm font-semibold"
            >
              Add
            </button>
          </form>
        )}
      </div>

      {/* Messages */}
      <div>
        <h3 className="font-semibold mb-1">Group chat</h3>

        {msgError && (
          <div className="border border-red-500 bg-red-900/40 text-sm p-2 rounded mb-2">
            {msgError}
          </div>
        )}

        <div className="max-h-64 overflow-y-auto border border-stone-700 rounded p-2 space-y-1 text-sm mb-2">
          {loadingMessages && messages.length === 0 && (
            <div className="opacity-70">Loading messages...</div>
          )}
          {messages.length === 0 && !loadingMessages && (
            <div className="opacity-70">
              No messages yet. Start the chat!
            </div>
          )}
          {messages.map((m) => (
            <div key={m._id} className="flex flex-col">
              <span className="font-semibold">
                {m.sender?.name || m.sender?.email || "Someone"}
              </span>
              <span>{m.text}</span>
              <span className="text-xs opacity-60">
                {new Date(m.createdAt).toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        <form
          onSubmit={handleSendMessage}
          className="flex flex-row gap-2 items-center"
        >
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-2 py-1 rounded bg-stone-900 border border-stone-600 text-sm"
          />
          <button
            type="submit"
            className="px-3 py-1 rounded bg-fuchsia-600 text-sm font-semibold"
          >
            Send
          </button>
        </form>
      </div>
    </section>
  );
}
