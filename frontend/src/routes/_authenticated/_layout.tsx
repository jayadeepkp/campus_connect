import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router'
import { formatDistanceToNow } from 'date-fns';
import { Bell, BellDot, Check, MessagesSquare, Search, Users } from 'lucide-react';
import { createContext, FormEvent, useContext, useState } from 'react';
import { Autocomplete, DialogTrigger, Heading, MenuTrigger, OverlayTriggerStateContext, Text } from 'react-aria-components';
import { tv } from 'tailwind-variants';
import { type Notification, useAuthContext, useGetMyNotifications, useLogout, useMarkAllNotificationsRead, useMarkNotificationRead, useDiscoverUsers } from '~/api/hooks';
import { CreateGroupForm } from '~/components/CreateGroupForm';
import { DirectChatWindow } from '~/components/DirectChatWindow';
import { MyGroupsList } from '~/components/MyGroupsList';
import { Button } from '~/ui/Button';
import { Dialog } from '~/ui/Dialog';
import { StandardErrorBox } from '~/ui/ErrorBox';
import { Link } from '~/ui/Link';
import { ListBox, ListBoxItem } from '~/ui/ListBox';
import { Menu, MenuItem, MenuLink } from '~/ui/Menu';
import { Modal } from '~/ui/Modal';
import { Popover } from '~/ui/Popover';
import { ProgressBar } from '~/ui/ProgressBar';
import { SearchField } from '~/ui/SearchField';

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

function DiscoveryDialog() {
  const [str, setStr] = useState("")
  const { isLoading, error, data } = useDiscoverUsers(str)
  const items = data?.data ?? []
  const navigate = useNavigate()
  const state = useContext(OverlayTriggerStateContext)

  return (
    <div className="space-y-4">
      <Autocomplete>
        <SearchField aria-label="Search for users" placeholder="Search for users..." value={str} onChange={setStr} />
        <ListBox items={items} renderEmptyState={() => isLoading ? <ProgressBar
            label="Loading users..."
            className="mt-12"
            isIndeterminate
          /> : <div className="text-center opacity-80 p-4">Your search returned no results</div>}>
          {(item) =>
            <ListBoxItem key={item.id} onAction={() => { navigate({ to: '/profile/$userId', params: { userId: item.id } }); state?.close() }}>
              <div className="flex flex-row items-center space-x-4">
                <div className="h-8 w-8 rounded-full bg-fuchsia-500 text-white flex items-center justify-center text-sm font-bold">
                  {item.name[0]}
                </div>
                <div className="flex flex-col">
                  <Text slot="label" className="text-lg">{item.name}</Text>
                  <Text slot="description">{item.email} - {item.major}</Text>
                </div>
              </div>
            </ListBoxItem>
          }
        </ListBox>
      </Autocomplete>

      <StandardErrorBox explanation="Failed to search for users" error={error} />
    </div>
  )
}

function DiscoveryMenu() {
  return (
    <DialogTrigger>
      <Button variant='icon' aria-label='Discover users'>
        <Search />
      </Button>
      <Modal isDismissable>
        <Dialog>
          <Heading slot="title" className="text-xl font-bold pb-4">Discover Users</Heading>

          <DiscoveryDialog />
        </Dialog>
      </Modal>
    </DialogTrigger>
  )
}

function GroupMenu() {
  return (
    <DialogTrigger>
      <Button variant='icon' aria-label='My groups'>
        <Users />
      </Button>
      <Popover>
        <Dialog>
          <MyGroupsList />
        </Dialog>
      </Popover>
    </DialogTrigger>
  )
}

const DM_CONTACTS_KEY = "campus_connect_recent_dm_contacts";

function DirectMessagesPanel({ userEmail, setUserEmail }: { userEmail: string | null; setUserEmail(value: string | null): void }) {
  const [dmEmailInput, setDmEmailInput] = useState("");
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
      setUserEmail(null);
      return;
    }

    setUserEmail(trimmed);
    upsertDmContact(trimmed);
  }

  return (
    <div className="h-full w-full max-w-md bg-stone-900 flex flex-col">
      {/* header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-700">
        <div>
          <h2 className="font-semibold">Direct chat</h2>
          <p className="text-xs opacity-70">
            Send and receive direct messages with other users.
          </p>
        </div>
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
                  setUserEmail(email);
                  setDmError(null);
                }}
                className={`text-left px-2 py-1 rounded hover:bg-stone-800 ${
                  userEmail === email ? "bg-stone-800" : ""
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
        {userEmail ? (
          <DirectChatWindow otherUserEmail={userEmail} />
        ) : (
          <p className="text-sm opacity-70">
            Open a conversation above to start chatting.
          </p>
        )}
      </div>
    </div>
  )
}

function DirectMessagesMenu({ userEmail, setUserEmail, isOpen, setIsOpen }: { userEmail: string | null; setUserEmail(value: string | null): void; isOpen: boolean; setIsOpen(value: boolean): void }) {
  return (
    <DialogTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
      <Button variant='icon' aria-label='Direct messages'>
        <MessagesSquare />
      </Button>
      <Popover>
        <Dialog>
          <DirectMessagesPanel userEmail={userEmail} setUserEmail={setUserEmail} />
        </Dialog>
      </Popover>
    </DialogTrigger>
  )
}

type DirectMessagesContext = {
  setTargetEmail(value: string | null): void
}

export const DirectMessagesControl = createContext<DirectMessagesContext>(null!)

function RouteComponent() {
  const auth = useAuthContext();
  const logout = useLogout();
  const [createGroupOpen, setCreateGroupOpen] = useState(false)
  const [activeDmUserId, setActiveDmUserId] = useState<string | null>(null);
  const [dmsOpen, setDmsOpen] = useState(false)

  return (
    <>
      <CreateGroupForm isOpen={createGroupOpen} setOpen={setCreateGroupOpen} />

      <nav className="flex flex-row items-center justify-between bg-fuchsia-200 dark:bg-stone-800 p-2 px-6">
        <Link to="/" variant='title'>Campus Connect</Link>

        <div className="flex flex-row items-center space-x-2">
          <NotificationMenu />
          <DiscoveryMenu />
          <GroupMenu />
          <DirectMessagesMenu userEmail={activeDmUserId} setUserEmail={setActiveDmUserId} isOpen={dmsOpen} setIsOpen={setDmsOpen} />

          <MenuTrigger>
            <Button variant="icon" aria-label={auth.user!.user.name}>
              <div className="h-8 w-8 rounded-full bg-fuchsia-500 text-white flex items-center justify-center text-sm font-bold">
                {auth.user!.user.name[0]}
              </div>
            </Button>
            <Menu>
              <MenuLink to="/settings">Profile</MenuLink>
              <MenuItem onAction={() => setCreateGroupOpen(true)}>Create Group</MenuItem>
              <MenuItem onAction={() => logout.mutate()}>Log Out</MenuItem>
            </Menu>
          </MenuTrigger>
        </div>
      </nav>

      <DirectMessagesControl.Provider value={{ setTargetEmail: email => { setActiveDmUserId(email); setDmsOpen(true) } }}>
        <Outlet />
      </DirectMessagesControl.Provider>
    </>
  )
}
