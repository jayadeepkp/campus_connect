import { FormEvent, useState } from "react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { Button } from "~/ui/Button"
import { Profile, useAuthContext, useChangePassword, useDeleteAccount, useGetMyProfile, useUpdateProfile, useUpdateSettings } from "~/api/hooks"
import { TextField, TextAreaField } from "~/ui/TextField"
import { StandardErrorBox } from "~/ui/ErrorBox"
import { twMerge } from 'tailwind-merge'
import { Form } from "~/ui/Form"
import { Checkbox } from "~/ui/Checkbox"
import BlockedUsersTab from "~/components/BlockedUsersTab"
import { DialogTrigger, Heading } from "react-aria-components"
import { Modal } from "~/ui/Modal"
import { Dialog } from "~/ui/Dialog"

export const Route = createFileRoute("/_authenticated/_layout/settings")({
  component: ProfilePage,
  loader: () => ({
    title: 'Profile'
  }),
})

const borderClasses = "border border-2 shadow-md border-fuchsia-200 dark:border-stone-800 dark:bg-stone-800/50 bg-fuchsia-200/50 rounded-lg p-4"

/* ----------------------------- Types ----------------------------- */

type EditableFieldProps = {
  label: string
  value?: string
  isEditing: boolean
  multiline?: boolean
}

/* ----------------------------- Page ----------------------------- */

function ProfileFields({ profileData }: { profileData: Profile }) {
  const [major, setMajor] = useState(profileData.major)
  const [department, setDepartment] = useState(profileData.department)
  const [year, setYear] = useState(profileData.year)
  const [bio, setBio] = useState(profileData.bio)
  const updateProfile = useUpdateProfile()

  const dirty = major != profileData.major || department != profileData.department || year != profileData.year || bio != profileData.bio

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!e.currentTarget.checkValidity()) {
      return
    }

    const result = await updateProfile.mutateAsync({
      major,
      department,
      year,
      bio,
    })

    setMajor(result.data.major)
    setDepartment(result.data.department)
    setYear(result.data.year)
    setBio(result.data.bio)
  };

  return (
    <div className={borderClasses}>
      <Form onSubmit={handleSubmit}>
        <TextField label="Major" value={major} onChange={setMajor} placeholder="Unspecified" />
        <TextField label="Department" value={department} onChange={setDepartment} placeholder="Unspecified" />
        <TextField label="Year" value={year} onChange={setYear} placeholder="Unspecified" />
        <TextAreaField label="Bio" value={bio} onChange={setBio} placeholder="Write about yourself..." />

        <Button variant="secondary" type="submit" isPending={updateProfile.isPending} isDisabled={!dirty}>
          Save Profile
        </Button>

        <StandardErrorBox explanation="Failed to update profile" error={updateProfile.error} />
      </Form>
    </div>
  )
}

function NotificationSettings({ profileData }: { profileData: Profile }) {
  const settings = profileData.notificationSettings

  const [likes, setLikes] = useState(settings.likes)
  const [comments, setComments] = useState(settings.comments)
  const [replies, setReplies] = useState(settings.replies)
  const [system, setSystem] = useState(settings.system)

  const dirty = likes != settings.likes || comments != settings.comments || replies != settings.replies || system != settings.system

  const updateSettings = useUpdateSettings()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!e.currentTarget.checkValidity()) {
      return
    }

    const result = await updateSettings.mutateAsync({
      notificationSettings: {
        likes,
        comments,
        replies,
        system,
      }
    })

    setLikes(result.data.notificationSettings.likes)
    setComments(result.data.notificationSettings.comments)
    setReplies(result.data.notificationSettings.replies)
    setSystem(result.data.notificationSettings.system)
  }

  return (
    <div className={twMerge(borderClasses, "space-y-4")}>
      <Form onSubmit={handleSubmit}>
        <Checkbox isSelected={likes} onChange={setLikes}>Receive notifications for likes</Checkbox>
        <Checkbox isSelected={comments} onChange={setComments}>Receive notifications for comments</Checkbox>
        <Checkbox isSelected={replies} onChange={setReplies}>Receive notifications for replies</Checkbox>
        <Checkbox isSelected={system} onChange={setSystem}>Receive notifications for system alerts</Checkbox>

        <Button variant="secondary" type="submit" isPending={updateSettings.isPending} isDisabled={!dirty}>
          Save Settings
        </Button>

        <StandardErrorBox explanation="Failed to update notification settings" error={updateSettings.error} />
      </Form>
    </div>
  )
}

function PasswordSettings() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")

  const changePassword = useChangePassword()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!e.currentTarget.checkValidity()) {
      return
    }

    await changePassword.mutateAsync({
      currentPassword,
      newPassword,
    })

    setCurrentPassword("")
    setNewPassword("")
  }

  return (
    <div className={twMerge(borderClasses, "space-y-4")}>
      <Form onSubmit={handleSubmit}>
        <TextField label="Current Password" type="password" value={currentPassword} onChange={setCurrentPassword} />
        <TextField label="New Password" type="password" value={newPassword} onChange={setNewPassword} />

        <Button variant="secondary" type="submit" isPending={changePassword.isPending} isDisabled={currentPassword.length === 0 || newPassword.length === 0}>
          Change Password
        </Button>

        <StandardErrorBox explanation="Failed to change password" error={changePassword.error} />
      </Form>
    </div>
  )
}

function BlockedUsers() {
  return (
    <div className={twMerge(borderClasses, "space-y-4")}>
      <BlockedUsersTab />
    </div>
  )
}

function DeleteAccount() {
  const deleteAccount = useDeleteAccount()

  return (
    <div className={twMerge(borderClasses, "space-y-4")}>
      <DialogTrigger>
        <Button variant="destructive">Delete Account</Button>
        <Modal isDismissable>
          <Dialog>
            <Heading slot="title" className="text-xl font-bold pb-4">Delete your account?</Heading>

            <div className="p-4">
              <p>
                This will remove all of your content, and cannot be reversed.
              </p>
            </div>

            <div className="flex flex-col space-y-2 pt-4">
              <Button variant="destructive" onPress={() => deleteAccount.mutate()} isPending={deleteAccount.isPending}>
                Delete Account
              </Button>
              <Button variant="secondary" slot="close">
                Cancel
              </Button>
            </div>
          </Dialog>
        </Modal>
      </DialogTrigger>
    </div>
  )
}

function ProfilePage() {
  const user = useAuthContext().user!.user
  const profile = useGetMyProfile()
  const profileData = profile.data?.data

  if (profile.isLoading) {
    return <p className="mt-8">Loading your profile…</p>;
  }

  if (profile.isError) {
    return <StandardErrorBox explanation="Failed to load profile" error={profile.error} />
  }

  if (profileData === undefined) {
    throw new Error("should be defined if it's not loading or errored")
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <div className="h-16 w-16 rounded-full bg-fuchsia-500 text-white flex items-center justify-center text-2xl font-bold">
          {user.name[0]}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{user.name}</h1>
          <p className="text-sm opacity-70">{user.email}</p>
        </div>
      </div>

      {/* Profile Fields */}
      <ProfileFields profileData={profileData} />

      {/* Actions */}
      <NotificationSettings profileData={profileData} />

      <PasswordSettings />

      <BlockedUsers />

      <DeleteAccount />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <Stat label="Posts" value={profileData.postsCount} />
        <Stat label="Likes Given" value={profileData.likesGivenCount} />
        <Stat label="Likes Received" value={profileData.likesReceivedCount} />
        <Stat label="Comments" value={profileData.commentsReceivedCount} />
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value?: number }) {
  if (value === undefined) return null
  return (
    <div className={borderClasses}>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs opacity-70">{label}</div>
    </div>
  )
}

