import { createFileRoute, Outlet, useRouterState } from '@tanstack/react-router'
import { formatDistanceToNow } from 'date-fns';
import { Bell, BellDot, Check } from 'lucide-react';
import { useState } from 'react';
import { DialogTrigger, MenuTrigger } from 'react-aria-components';
import { tv } from 'tailwind-variants';
import { type Notification, useAuthContext, useGetMyNotifications, useLogout, useMarkAllNotificationsRead, useMarkNotificationRead } from '~/api/hooks';
import { CreateGroupForm } from '~/components/CreateGroupForm';
import { Button } from '~/ui/Button';
import { Dialog } from '~/ui/Dialog';
import { StandardErrorBox } from '~/ui/ErrorBox';
import { Link } from '~/ui/Link';
import { Menu, MenuItem, MenuLink } from '~/ui/Menu';
import { Popover } from '~/ui/Popover';
import { ProgressBar } from '~/ui/ProgressBar';

export const Route = createFileRoute('/_authenticated/_layout')({
  component: RouteComponent,
})

const notificationStyles = tv({
  base: "border border-2 shadow-md border-fuchsia-200 dark:border-stone-800 dark:bg-stone-800/50 bg-fuchsia-200/50 rounded-lg p-4",
  variants: {
    unread: {
      true: "border-l-fuchsia-500 dark:border-l-fuchsia-200",
    },
  },
});

function Notification({ notification }: { notification: Notification }) {
  const markAsRead = useMarkNotificationRead();

  return (
    <div className={notificationStyles({ unread: !notification.read })}>
      <div className="flex flex-col">
        <div>{notification.message}</div>
        <div className="flex flex-row justify-between items-end">
          <div className="text-sm opacity-50 py-1">
            {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
          </div>
          <Button
            variant="icon"
            onPress={() => markAsRead.mutate({ id: notification._id })}
          >
            <Check size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}

function NotificationMenu() {
  const { data, isPending, error } = useGetMyNotifications();
  const markAllAsRead = useMarkAllNotificationsRead();

  return (
    <DialogTrigger>
      <Button variant="icon" aria-label="Notifications">
        {data?.data.some((notification) => !notification.read) ? (
          <BellDot />
        ) : (
          <Bell />
        )}
      </Button>
      <Popover>
        <Dialog>
          {isPending && (
            <ProgressBar label="Loading notifications..." isIndeterminate />
          )}
          {data !== undefined && (
            <div className="flex flex-col space-y-2">
              {data.data.length === 0 && (
                <div>You don't have any notifications.</div>
              )}
              {data.data.map((notification) => (
                <Notification key={notification._id} notification={notification} />
              ))}
              {data.data.length > 0 && (
                <Button
                  variant="secondary"
                  onPress={() => markAllAsRead.mutate()}
                >
                  Mark all as read
                </Button>
              )}
            </div>
          )}
          <StandardErrorBox
            error={error}
            explanation="Failed to fetch notifications"
          />
        </Dialog>
      </Popover>
    </DialogTrigger>
  );
}

function RouteComponent() {
  const auth = useAuthContext();
  const logout = useLogout();
  const [createGroupOpen, setCreateGroupOpen] = useState(false)

  return (
    <>
      <CreateGroupForm isOpen={createGroupOpen} setOpen={setCreateGroupOpen} />

      <nav className="flex flex-row items-center justify-between bg-fuchsia-200 dark:bg-stone-800 p-2 px-6">
        <Link to="/" variant='title'>Campus Connect</Link>

        <div className="flex flex-row items-center space-x-2">
          <NotificationMenu />

          <MenuTrigger>
            <Button variant="icon" aria-label={auth.user!.user.name}>
              <div className="h-8 w-8 rounded-full bg-fuchsia-500 text-white flex items-center justify-center text-sm font-bold">
                {auth.user!.user.name[0]}
              </div>
            </Button>
            <Menu>
              <MenuLink to="/profile">Profile</MenuLink>
              <MenuItem onAction={() => setCreateGroupOpen(true)}>Create Group</MenuItem>
              <MenuItem onAction={() => logout.mutate()}>Log Out</MenuItem>
            </Menu>
          </MenuTrigger>
        </div>
      </nav>

      <Outlet />
    </>
  )
}
