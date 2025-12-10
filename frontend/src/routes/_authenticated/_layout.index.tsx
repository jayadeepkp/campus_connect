import React, { useState } from "react";
import type { FormEvent } from "react";
import CreatePostForm from "~/components/CreatePostForm";
import PostCard from "~/components/PostCard";
import { MyGroupsList } from "~/components/MyGroupsList";
import { createFileRoute } from "@tanstack/react-router";
import {
  useGetFeedPosts,
  OkResponse,
  Post,
  useGetTrendingPosts,
  useMyPosts,
} from "~/api/hooks";
import { StandardErrorBox } from "~/ui/ErrorBox";
import { ProgressBar } from "~/ui/ProgressBar";
import { Tab, TabList, TabPanel, Tabs } from "~/ui/Tabs";
import { UseQueryResult } from "@tanstack/react-query";
import { DirectChatWindow } from "~/components/DirectChatWindow";
import { Button } from "~/ui/Button";

export const Route = createFileRoute("/_authenticated/_layout/")({
  component: RouteComponent,
  loader: () => ({
    title: 'Campus Connect'
  }),
});
const DM_CONTACTS_KEY = "campus_connect_recent_dm_contacts";

function PostFeed({ posts }: { posts: UseQueryResult<OkResponse<Post[]>> }) {
  const { isPending, data, error } = posts;

  return (
    <>
      <StandardErrorBox
        error={error}
        explanation="Failed to load trending posts"
        className="mt-12"
      />

      {isPending && (
        <ProgressBar
          label="Loading posts..."
          className="mt-12"
          isIndeterminate
        />
      )}

      {data !== undefined && (
        <section className="space-y-4">
          {data.data.length === 0 ? (
            <p>No posts yet — share something with your friends!</p>
          ) : (
            data.data.map((p) => <PostCard key={p._id} post={p} />)
          )}
        </section>
      )}
    </>
  );
}

function RouteComponent() {
  const feedPosts = useGetFeedPosts();
  const trendingPosts = useGetTrendingPosts();
  const myPosts = useMyPosts();

  // --- Groups & DMs panel visibility ---
  const [showGroupsPanel, setShowGroupsPanel] = useState(false);
  const [showDmPanel, setShowDmPanel] = useState(false);

  // --- DM state: which email/thread is open ---
  const [dmEmailInput, setDmEmailInput] = useState("");
  const [activeDmUserId, setActiveDmUserId] = useState<string | null>(null);
  const [dmError, setDmError] = useState<string | null>(null);
  const [dmContacts, setDmContacts] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(DM_CONTACTS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed)
        ? parsed.filter((x: unknown): x is string => typeof x === "string")
        : [];
    } catch {
      return [];
    }
  });


function upsertDmContact(email: string) {
  setDmContacts((prev) => {
    // move to top & avoid duplicates
    const clean = prev.filter((e) => e !== email);
    const next = [email, ...clean];

    try {
      window.localStorage.setItem(DM_CONTACTS_KEY, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }

    return next;
  });
}

  function handleOpenChatByEmail(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = dmEmailInput.trim().toLowerCase();
    if (!trimmed) return;

    setDmError(null);

    if (!trimmed.endsWith("@uky.edu")) {
      setDmError("Please enter a valid uky.edu email address.");
      setActiveDmUserId(null);
      return;
    }

    setActiveDmUserId(trimmed);
    upsertDmContact(trimmed);
  }

  return (
    <>
      <div className="flex flex-col lg:w-full lg:max-w-2xl lg:mx-auto py-6">
        {/* Buttons to open Groups & DMs slide-in panels */}
        <div className="flex justify-end gap-2 mb-4">
          <Button variant="secondary" onPress={() => setShowGroupsPanel(true)}>
            Groups
          </Button>
          <Button variant="secondary" onPress={() => setShowDmPanel(true)}>
            DMs
          </Button>
        </div>

        {/* Post composer + tabs */}
        <CreatePostForm />

        <Tabs className="pt-12">
          <TabList aria-label="Post categories">
            <Tab id="trending">Hottest Posts</Tab>
            <Tab id="feed">Recent Posts</Tab>
            <Tab id="mine">My Posts</Tab>
          </TabList>
          <TabPanel id="trending">
            <PostFeed posts={trendingPosts} />
          </TabPanel>
          <TabPanel id="feed">
            <PostFeed posts={feedPosts} />
          </TabPanel>
          <TabPanel id="mine">
            <PostFeed posts={myPosts} />
          </TabPanel>
        </Tabs>
      </div>

      {/* --- Groups slide-in panel --- */}
      {showGroupsPanel && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/60">
          <div className="h-full w-full max-w-md bg-stone-900 border-l border-stone-700 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-stone-700">
              <div>
                <h2 className="font-semibold">Your groups</h2>
                <p className="text-xs opacity-70">
                  Groups you&apos;ve created or joined.
                </p>
              </div>
              <button
                type="button"
                className="p-1 rounded hover:bg-stone-800"
                onClick={() => setShowGroupsPanel(false)}
                aria-label="Close groups"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3">
              <MyGroupsList />
            </div>
          </div>
        </div>
      )}

      {/* --- DM slide-in panel --- */}
      {showDmPanel && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/60">
          <div className="h-full w-full max-w-md bg-stone-900 border-l border-stone-700 flex flex-col">
            {/* header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-stone-700">
              <div>
                <h2 className="font-semibold">Direct chat</h2>
                <p className="text-xs opacity-70">
                  Prototype for 1:1 messaging. History is saved in this browser.
                </p>
              </div>
              <button
                type="button"
                className="p-1 rounded hover:bg-stone-800"
                onClick={() => setShowDmPanel(false)}
                aria-label="Close direct messages"
              >
                ✕
              </button>
            </div>

            {/* recent chats list */}
            {dmContacts.length > 0 && (
              <div className="px-4 py-2 border-b border-stone-800 text-sm">
                <div className="mb-1 font-semibold text-xs opacity-70">
                  Recent chats
                </div>
                <div className="flex flex-col gap-1">
                  {dmContacts.map((email) => (
                    <button
                      key={email}
                      type="button"
                      onClick={() => {
                        setDmEmailInput(email);
                        setActiveDmUserId(email);
                        setDmError(null);
                      }}
                      className={`text-left px-2 py-1 rounded hover:bg-stone-800 ${
                        activeDmUserId === email ? "bg-stone-800" : ""
                      }`}
                    >
                      {email}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* email → open chat form */}
            <form
              onSubmit={handleOpenChatByEmail}
              className="flex flex-row gap-2 items-center px-4 py-3 border-b border-stone-800"
            >
              <input
                type="email"
                value={dmEmailInput}
                onChange={(e) => setDmEmailInput(e.target.value)}
                placeholder="friend@uky.edu"
                className="flex-1 px-2 py-1 rounded bg-stone-900 border border-stone-600 text-sm"
              />
              <Button type="submit" variant="secondary">
                Open
              </Button>
            </form>

            {dmError && (
              <div className="mx-4 mt-2 rounded bg-red-900/70 text-xs text-red-100 px-2 py-1">
                {dmError}
              </div>
            )}

            {/* chat body using DirectChatWindow */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {activeDmUserId ? (
                <DirectChatWindow otherUserId={activeDmUserId} />
              ) : (
                <p className="text-sm opacity-70">
                  Open a conversation above to start chatting.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}