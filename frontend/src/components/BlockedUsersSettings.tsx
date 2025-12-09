import { useEffect, useState } from "react"
import { useAuthContext } from "~/api/hooks"
import { Button } from "../ui/Button"

interface BlockedUser {
  _id: string
  name: string
  email: string
}

export default function BlockedUsersSettings() {
  const auth = useAuthContext()
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([])
  const [loading, setLoading] = useState(false)

  // Fetch blocked users on component mount
  useEffect(() => {
    const fetchBlockedUsers = async () => {
      setLoading(true)
      try {
        const token = auth.user?.token
        const res = await fetch(`http://localhost:5050/api/users/blocked`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const json = await res.json()
        if (json.ok) {
          setBlockedUsers(json.data.blockedUsers)
        } else {
          console.error(json.error)
        }
      } catch (err) {
        console.error(err)
      }
      setLoading(false)
    }

    fetchBlockedUsers()
  }, [auth.user?.token])

  // Unblock user
  const unblockUser = async (userId: string) => {
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
        // Remove user from blockedUsers state
        setBlockedUsers(prev => prev.filter(u => u._id !== userId))
        // Optional: Update local auth state if you track blockedUsers there
        auth.user!.user.blockedUsers = auth.user!.user.blockedUsers.filter(id => id !== userId)
      } else {
        console.error(json.error)
      }
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return <p>Loading blocked users...</p>

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Blocked Users</h2>
      {blockedUsers.length === 0 ? (
        <p>No blocked users</p>
      ) : (
        <ul className="space-y-2">
          {blockedUsers.map(user => (
            <li key={user._id} className="flex justify-between items-center border p-2 rounded">
              <span>{user.name} ({user.email})</span>
              <Button variant="secondary" onPress={() => unblockUser(user._id)}>
                Unblock
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
