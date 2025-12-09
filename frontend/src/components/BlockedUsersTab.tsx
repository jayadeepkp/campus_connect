import { useEffect, useState } from "react"
import { useAuthContext } from "~/api/hooks"
import { Button } from "../ui/Button"
import { Modal, Dialog, Heading } from "../ui/Modal"

interface BlockedUser {
  _id: string
  name: string
  email: string
}

export default function BlockedUsersTab() {
  const auth = useAuthContext()
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([])
  const [loading, setLoading] = useState(false)
  const [unblockModalOpen, setUnblockModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<BlockedUser | null>(null)

  useEffect(() => {
    const fetchBlockedUsers = async () => {
      setLoading(true)
      try {
        const token = auth.user?.token
        const res = await fetch(`http://localhost:5050/api/users/blocked`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const json = await res.json()
        if (json.ok) setBlockedUsers(json.data.blockedUsers)
      } catch (err) {
        console.error(err)
      }
      setLoading(false)
    }
    fetchBlockedUsers()
  }, [auth.user?.token])

  const handleUnblock = async (userId: string) => {
    try {
      const token = auth.user?.token
      const res = await fetch(`http://localhost:5050/api/users/${userId}/unblock`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      })
      const json = await res.json()
      if (json.ok) {
        setBlockedUsers(prev => prev.filter(u => u._id !== userId))
        // Update auth state for dynamic feed update
        auth.user!.user.blockedUsers = auth.user!.user.blockedUsers.filter(id => id !== userId)
        setUnblockModalOpen(false)
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div>
      {loading ? (
        <p>Loading blocked users...</p>
      ) : blockedUsers.length === 0 ? (
        <p>No blocked users</p>
      ) : (
        <ul className="space-y-2">
          {blockedUsers.map(u => (
            <li key={u._id} className="flex justify-between items-center border p-2 rounded">
              <span>{u.name} ({u.email})</span>
              <Button
                variant="secondary"
                onPress={() => {
                  setSelectedUser(u)
                  setUnblockModalOpen(true)
                }}
              >
                Unblock
              </Button>
            </li>
          ))}
        </ul>
      )}

      {/* Unblock Confirmation Modal */}
      {selectedUser && (
        <Modal isOpen={unblockModalOpen} onOpenChange={setUnblockModalOpen} isDismissable>
          <Dialog>
            <Heading slot="title" className="text-xl font-bold pb-2">Unblock {selectedUser.name}?</Heading>
            <p>User will now be able to see your posts and message you. They won't be notified.</p>
            <div className="flex space-x-2 pt-4">
              <Button variant="destructive" onPress={() => handleUnblock(selectedUser._id)}>Confirm Unblock</Button>
              <Button variant="secondary" onPress={() => setUnblockModalOpen(false)}>Cancel</Button>
            </div>
          </Dialog>
        </Modal>
      )}
    </div>
  )
}
