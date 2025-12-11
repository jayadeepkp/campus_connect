// frontend/src/components/DirectChatWindow.tsx
import React, {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  useAuthContext,
  useGetDirectMessages,
  useSendDirectMessage,
} from "~/api/hooks";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:5050";
const API_URL = `${API_BASE}/api`;

type Status = "idle" | "loading" | "sending";

interface DirectChatWindowProps {
  /**
   * OTHER user’s EMAIL address (e.g., "second.user@uky.edu").
   * We will resolve this to a MongoDB _id via the backend.
   */
  otherUserEmail: string;
}

export function DirectChatWindow({ otherUserEmail }: DirectChatWindowProps) {
  const auth = useAuthContext();

  if (!auth.user) {
    return (
      <div className="p-2 text-sm text-red-300">
        You must be logged in to use direct messages.
      </div>
    );
  }

  const myUserId = auth.user.user.id;
  const myEmail = auth.user.user.email;

  // Debug: see what we got from parent
  console.log("DirectChatWindow props:", { otherUserEmail, myUserId, myEmail });

  const [otherUserId, setOtherUserId] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  // 1) Resolve email → Mongo _id on mount / when email changes
  useEffect(() => {
    let cancelled = false;

    async function resolveUser() {
      try {
        setStatus("loading");
        setError(null);

        const res = await fetch(`${API_URL}/direct-messages/resolve-user`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth.user!.token}`,
          },
          body: JSON.stringify({ email: otherUserEmail }),
        });

        const json = await res.json();
        if (!json.ok) {
          if (!cancelled) {
            setError(json.error || "Unable to find that user.");
            setStatus("idle");
          }
          return;
        }

        if (!cancelled) {
          setOtherUserId(json.data.userId);
          setStatus("idle");
        }
      } catch (err) {
        console.error("resolve-user error:", err);
        if (!cancelled) {
          setError("Failed to resolve user by email.");
          setStatus("idle");
        }
      }
    }

    resolveUser();
    return () => {
      cancelled = true;
    };
  }, [otherUserEmail, auth.user]);

  // 2) Load conversation from backend (polling every 3s for "realtime")
  const {
    data: historyData,
    isLoading: historyLoading,
    error: historyError,
  } = useGetDirectMessages(otherUserId ?? "");

  const messages = historyData?.data ?? [];

  // scroll to bottom whenever messages change
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  // 3) Send messages via backend
  const sendMutation = useSendDirectMessage();

  function handleSend(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || !otherUserId) return;

    setStatus("sending");
    setError(null);

    sendMutation.mutate(
      {
        otherUserId,
        content: trimmed,
      },
      {
        onSuccess() {
          setInput("");
          setStatus("idle");
          // list auto refreshes via invalidateQueries inside the hook
        },
        onError(err: any) {
          console.error("send DM error:", err);
          setStatus("idle");
          setError("Something went wrong while sending your message.");
        },
      }
    );
  }

  const loading = status === "loading" || historyLoading;

  return (
    <div className="flex flex-col h-full">
      {/* tiny debug line */}
      <div className="text-[10px] text-stone-500 mb-1">
        DEBUG email = {otherUserEmail}, id = {otherUserId ?? "resolving…"}
      </div>

      {/* History */}
      <div className="flex-1 overflow-y-auto space-y-2 text-sm pr-1">
        {loading ? (
          <div className="opacity-70">Loading conversation…</div>
        ) : historyError ? (
          <div className="text-red-300 text-xs">
            Failed to load messages.
          </div>
        ) : messages.length === 0 ? (
          <div className="opacity-70">
            No messages yet. Say hi to start the conversation!
          </div>
        ) : (
          messages.map((m) => {
            const isMine = m.from === myUserId;
            return (
              <div
                key={m._id}
                className={`px-2 py-1 rounded border border-stone-700 bg-stone-900/60 max-w-[80%] ${
                  isMine ? "ml-auto text-right" : "mr-auto text-left"
                }`}
              >
                <div className="opacity-60 text-[0.65rem] mb-0.5">
                  {isMine ? "You" : otherUserEmail} ·{" "}
                  {new Date(m.createdAt).toLocaleTimeString()}
                </div>
                <div>{m.content}</div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {(error || sendMutation.isError) && (
        <div className="mt-2 rounded bg-red-900/70 text-xs text-red-100 px-2 py-1">
          {error || "Something went wrong."}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="mt-2 flex flex-row gap-2 items-center"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            otherUserId
              ? "Type a message…"
              : "Resolving user, please wait…"
          }
          className="flex-1 px-2 py-1 rounded bg-stone-900 border border-stone-600 text-sm"
          disabled={!otherUserId || status === "sending"}
        />
        <button
          type="submit"
          className="px-3 py-1 rounded bg-fuchsia-600 text-sm font-semibold disabled:opacity-60"
          disabled={!otherUserId || status === "sending"}
        >
          {status === "sending" ? "Sending…" : "Send"}
        </button>
      </form>
    </div>
  );
}