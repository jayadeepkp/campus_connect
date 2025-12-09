import { useState } from "react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { Button } from "~/ui/Button"
import { useAuthContext } from "~/api/hooks"

export const Route = createFileRoute("/_authenticated/_layout/profile")({
  component: ProfilePage,
})

/* ----------------------------- Types ----------------------------- */

type EditableFieldProps = {
  label: string
  value?: string
  isEditing: boolean
  multiline?: boolean
}

/* ----------------------------- Page ----------------------------- */

function ProfilePage() {
  const { user } = useAuthContext()
  const [isEditing, setIsEditing] = useState(false)

  if (!user) {
    return <div className="p-6">Not authenticated</div>
  }

  const profile = user.user

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <div className="h-16 w-16 rounded-full bg-fuchsia-500 text-white flex items-center justify-center text-2xl font-bold">
          {profile.name?.[0]}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{profile.name}</h1>
          <p className="text-sm opacity-70">{profile.email}</p>
        </div>
      </div>

      {/* Profile Fields */}
      <div className="border rounded-lg p-4 space-y-4">
        <EditableField label="Major" value={profile.major} isEditing={isEditing} />
        <EditableField label="Department" value={profile.department} isEditing={isEditing} />
        <EditableField label="Year" value={profile.year} isEditing={isEditing} />
        <EditableField
          label="Bio"
          value={profile.bio}
          isEditing={isEditing}
          multiline
        />
      </div>

      {/* Stats */}
      {profile.postsCount !== undefined && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <Stat label="Posts" value={profile.postsCount} />
          <Stat label="Likes Given" value={profile.likesGivenCount} />
          <Stat label="Likes Received" value={profile.likesReceivedCount} />
          <Stat label="Comments" value={profile.commentsReceivedCount} />
        </div>
      )}

      {/* Actions */}

      <Link to="/"
      className="text-sm underline hover:text-fuchsia-600">
        ← Back
        </Link>

      <div className="flex items-center space-x-4">
        {isEditing ? (
          <>
            <Button onPress={() => setIsEditing(false)}>Save</Button>
            <Button variant="secondary" onPress={() => setIsEditing(false)}>
              Cancel
            </Button>
          </>
        ) : (
          <Button variant="secondary" onPress={() => setIsEditing(true)}>
            Edit Profile
          </Button>
        )}

        <Link to="/" className="text-sm underline">
          Settings
        </Link>
      </div>
    </div>
  )
}

/* ----------------------------- Components ----------------------------- */

function EditableField({
  label,
  value,
  isEditing,
  multiline,
}: EditableFieldProps) {
  const [localValue, setLocalValue] = useState(value ?? "")

  return (
    <div className="space-y-1">
      <div className="text-sm font-medium opacity-70">{label}</div>

      {!isEditing ? (
        <div className="text-gray-800">{value || "—"}</div>
      ) : multiline ? (
        <textarea
          className="w-full border rounded p-2"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
        />
      ) : (
        <input
          className="w-full border rounded p-2"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
        />
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value?: number }) {
  if (value === undefined) return null
  return (
    <div className="border rounded-lg p-3">
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs opacity-70">{label}</div>
    </div>
  )
}

