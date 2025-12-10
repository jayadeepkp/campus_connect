import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useGetBlockedUsers, useUnblockUser } from '~/api/hooks'
import { Button } from '~/ui/Button'
import { Dialog } from '~/ui/Dialog'
import { ProgressBar } from '~/ui/ProgressBar'
import { StandardErrorBox } from '~/ui/ErrorBox'

export const Route = createFileRoute('/_authenticated/blocked')({
  component: BlockedPage,
})

function BlockedPage() {
  const { data, isPending, error } = useGetBlockedUsers()
  const unblockUser = useUnblockUser()

  const [selectedUser, setSelectedUser] = useState<{
    id: string
    name: string
  } | null>(null)

  if (isPending) {
    return <ProgressBar label="Loading blocked users..." isIndeterminate />
  }

  const blockedUsers = data?.data ?? []

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Blocked List of Users</h1>

      {blockedUsers.length === 0 && (
        <p className="opacity-60">You haven’t blocked any users.</p>
      )}

      <ul className="space-y-3">
        {blockedUsers.map((user) => (
          <li
            key={user._id}
            className="flex items-center justify-between rounded-lg border p-3"
          >
            <span>{user.name}</span>

            <Button
              variant="destructive"
              onPress={() =>
                setSelectedUser({ id: user._id, name: user.name })
              }
            >
              Unblock
            </Button>
          </li>
        ))}
      </ul>

      {selectedUser && (
        <Dialog>
          <div className="space-y-4 p-4 max-w-md">
            <p className="font-semibold">
              Are you sure you want to unblock {selectedUser.name}?
            </p>

            <p className="text-sm opacity-80">
              Doing so will allow them to interact with you and your posts again.
              They won’t be notified.
            </p>

            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onPress={() => setSelectedUser(null)}
              >
                No
              </Button>

              <Button
                onPress={() => {
                  unblockUser.mutate(selectedUser.id)
                  setSelectedUser(null)
                }}
              >
                Yes
              </Button>
            </div>
          </div>
        </Dialog>
      )}

      <StandardErrorBox
        error={error}
        explanation="Failed to load blocked users"
      />
    </div>
  )
}
