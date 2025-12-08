import CreatePostForm from "~/components/CreatePostForm"
import PostCard from "~/components/PostCard"
import { CreateGroupForm } from "~/components/CreateGroupForm";
import { MyGroupsList } from "~/components/MyGroupsList";
import React, { useState } from "react";
import { Button } from "~/ui/Button";
import { createFileRoute } from '@tanstack/react-router'
import { type Notification, useAuthContext, useGetFeedPosts, useGetMyNotifications, useLogout, useMarkNotificationRead, useMarkAllNotificationsRead } from "~/api/hooks";
import { StandardErrorBox } from "~/ui/ErrorBox";
import { ProgressBar } from "~/ui/ProgressBar";
import { DialogTrigger } from "react-aria-components";
import { Bell, BellDot, Check } from "lucide-react";
import { Popover } from "~/ui/Popover";
import { Dialog } from "~/ui/Dialog";
import { tv } from "tailwind-variants";
import { formatDistanceToNow } from "date-fns";




export const Route = createFileRoute('/_authenticated/')({
  component: RouteComponent,
})

const notificationStyles = tv({
  base: "border border-2 shadow-md border-fuchsia-200 dark:border-stone-800 dark:bg-stone-800/50 bg-fuchsia-200/50 rounded-lg p-4",
  variants: {
    unread: {
      true: "border-l-fuchsia-500 dark:border-l-fuchsia-200",
    },
  },
})

function Notification({ notification }: { notification: Notification }) {
  const markAsRead = useMarkNotificationRead()

  return (
    <div className={notificationStyles({ unread: !notification.read })}>
      <div className="flex flex-col">
        <div>{notification.message}</div>
        <div className="flex flex-row justify-between items-end">
          <div className="text-sm opacity-50 py-1">{formatDistanceToNow(notification.createdAt, { addSuffix: true })}</div>
          <Button variant="icon" onPress={() => markAsRead.mutate({ id: notification._id })}><Check size={16} /></Button>
        </div>
      </div>
    </div>
  )
}

function NotificationMenu() {
  const { data, isPending, error } = useGetMyNotifications()
  const markAllAsRead = useMarkAllNotificationsRead()

  return (
    <DialogTrigger>
      <Button variant="icon" aria-label="Notifications">{data?.data.some(notification => !notification.read) ? <BellDot /> : <Bell />}</Button>
      <Popover>
        <Dialog>
          { isPending && <ProgressBar label="Loading notifications..." isIndeterminate /> }
          { data !== undefined &&
            <div className="flex flex-col space-y-2">
              {data.data.length === 0 &&
                <div>
                  You don't have any notifications.
                </div>
              }
              {data.data.map(notification => <Notification notification={notification} />)}
              {data.data.length > 0 &&
                <Button variant="secondary" onPress={() => markAllAsRead.mutate()}>Mark all as read</Button>
              }
            </div>
          }
          <StandardErrorBox error={error} explanation="Failed to fetch notifications" />
        </Dialog>
      </Popover>
    </DialogTrigger>
  )
}

function RouteComponent() {
  const auth = useAuthContext()
  const { isPending, data, error } = useGetFeedPosts()
  const logout = useLogout()
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  return (
    <>
      <nav className="flex flex-row items-center justify-between bg-fuchsia-200 dark:bg-stone-800 p-2">
        <span>Campus Connect, {auth.user!.user.name}</span>

        <div className="flex flex-row items-center space-x-2">
          <NotificationMenu />

          <Button
          variant="secondary"
          onPress={() => setShowCreateGroup(prev => !prev)}
          >
            {showCreateGroup ? "Close Group Form" : "Create Group"}
          </Button>

          <Button onPress={() => logout.mutate()}>
            Log Out
          </Button>
        </div>
      </nav>

      <div className="flex flex-col lg:w-full lg:max-w-2xl lg:mx-auto py-6">
        {/* Post creation form */}
        <CreatePostForm />
          {showCreateGroup && (
            <div className="mt-6">
            <CreateGroupForm />
            </div>
          )}
        <MyGroupsList />
            
        <StandardErrorBox error={error} explanation="Failed to load trending posts" className="mt-12" />

        {isPending && <ProgressBar label="Loading posts..." className="mt-12" isIndeterminate />}

        {data !== undefined &&
          <section className="pt-12 space-y-4">
            {data.data.length === 0 ? (
              <p>
                No posts yet — share something with your friends!
              </p>
            ) : (
              data.data.map((p) => (
                <PostCard
                  key={p._id}
                  post={p}
                />
              ))
            )}
          </section>
        }
      </div>
    </>

  )
}
