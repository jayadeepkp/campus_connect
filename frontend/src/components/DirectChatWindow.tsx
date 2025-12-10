// frontend/src/components/DirectChatWindow.tsx
import React, {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useAuthContext } from "~/api/hooks";

type DirectMessage = {
  id: string;
  from: string;      // sender email (lowercased)
  content: string;
  createdAt: string;
};

type Status = "idle" | "sending";

/** Stable localStorage key for a 1:1 thread, independent of order. */
function getThreadKey(a: string, b: string): string {
  const [x, y] = [a.toLowerCase(), b.toLowerCase()].sort();
  return `dm:${x}:${y}`;
}

interface DirectChatWindowProps {
  /**
   * OTHER user’s email address (e.g., "hp@uky.edu").
   * The current user comes from the auth context.
   */
  otherUserId: string;
}

export function DirectChatWindow({ otherUserId }: DirectChatWindowProps) {
  const auth = useAuthContext();

  // current logged-in user’s email
  const myEmail = auth.user!.user.email.toLowerCase();
  const otherEmail = otherUserId.toLowerCase();

  const storageKey = getThreadKey(myEmail, otherEmail);

  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  // Load history from localStorage whenever the participants change
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) {
        setMessages([]);
        return;
      }
      const parsed = JSON.parse(raw) as DirectMessage[];
      setMessages(Array.isArray(parsed) ? parsed : []);
    } catch (e) {
      console.error("Failed to load DM history", e);
      setMessages([]);
    }
  }, [storageKey]);

  function persist(newMessages: DirectMessage[]) {
    setMessages(newMessages);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(newMessages));
    } catch (e) {
      console.error("Failed to save DM history", e);
    }
  }

  function handleSend(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    setStatus("sending");
    setError(null);

    try {
      const now = new Date().toISOString();
      const newMessage: DirectMessage = {
        id: `${now}-${Math.random().toString(36).slice(2)}`,
        from: myEmail,         // **always the sender’s email**
        content: trimmed,
        createdAt: now,
      };

      const next = [...messages, newMessage];
      persist(next);
      setInput("");
      setStatus("idle");
    } catch (err) {
      console.error(err);
      setStatus("idle");
      setError("Something went wrong while sending your message.");
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* History */}
      <div className="flex-1 overflow-y-auto space-y-2 text-sm pr-1">
        {messages.length === 0 ? (
          <div className="opacity-70">
            No messages yet. Say hi to start the conversation!
          </div>
        ) : (
          messages.map((m) => {
            const isMine = m.from.toLowerCase() === myEmail;
            return (
              <div
                key={m.id}
                className={`px-2 py-1 rounded border border-stone-700 bg-stone-900/60 max-w-[80%] ${
                  isMine ? "ml-auto text-right" : "mr-auto text-left"
                }`}
              >
                <div className="opacity-60 text-[0.65rem] mb-0.5">
                  {isMine ? "You" : otherEmail} ·{" "}
                  {new Date(m.createdAt).toLocaleTimeString()}
                </div>
                <div>{m.content}</div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="mt-2 rounded bg-red-900/70 text-xs text-red-100 px-2 py-1">
          {error}
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
          placeholder="Type a message…"
          className="flex-1 px-2 py-1 rounded bg-stone-900 border border-stone-600 text-sm"
        />
        <button
          type="submit"
          className="px-3 py-1 rounded bg-fuchsia-600 text-sm font-semibold disabled:opacity-60"
          disabled={status === "sending"}
        >
          {status === "sending" ? "Sending…" : "Send"}
        </button>
      </form>
    </div>
  );
}
