import { createFileRoute } from '@tanstack/react-router'
import { useGetPublicProfile } from '~/api/hooks';
import { StandardErrorBox } from '~/ui/ErrorBox';

export const Route = createFileRoute('/_authenticated/_layout/profile/$userId')(
  {
    component: RouteComponent,
  },
)

const borderClasses = "border border-2 shadow-md border-fuchsia-200 dark:border-stone-800 dark:bg-stone-800/50 bg-fuchsia-200/50 rounded-lg p-4"

function Field({ label, value }: { label: string; value: string }) {
  if (value === undefined) return null
  return (
    <div className={borderClasses}>
      <div className="text-xs opacity-70">{label}</div>
      <div className="text-xl font-bold">{value.trim().length === 0 ? "Unspecified" : value}</div>
    </div>
  )
}

function RouteComponent() {
  const id = Route.useParams().userId
  const profile = useGetPublicProfile(id)
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
          {profileData.name[0]}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{profileData.name}</h1>
          <p className="text-sm opacity-70">{profileData.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <Field label="Major" value={profileData.major} />
        <Field label="Department" value={profileData.department} />
        <Field label="Year" value={profileData.year} />
      </div>

      <div className={borderClasses}>
        {profileData.bio.trim().length === 0 ? "This user hasn't written a bio yet." : profileData.bio}
      </div>
    </div>
  )
}
