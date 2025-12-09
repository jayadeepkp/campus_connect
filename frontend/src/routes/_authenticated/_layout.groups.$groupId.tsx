import { createFileRoute } from '@tanstack/react-router'
import { Heading } from 'react-aria-components'
import { useGetGroup } from '~/api/hooks'
import { StandardErrorBox } from '~/ui/ErrorBox'
import { ProgressBar } from '~/ui/ProgressBar'
import { Tab, TabList, TabPanel, Tabs } from '~/ui/Tabs'

export const Route = createFileRoute('/_authenticated/_layout/groups/$groupId')({
  component: RouteComponent,
  loader: () => ({
    title: 'Group'
  }),
})

function RouteComponent() {
  const route = Route.useParams()
  const group = useGetGroup(route.groupId)
  const groupData = group.data?.data

  return (
    <div className="flex flex-col lg:w-full lg:max-w-2xl lg:mx-auto py-6">
      <StandardErrorBox
        error={group.error}
        explanation="Failed to load group"
        className="mt-12"
      />

      {group.isPending && (
        <ProgressBar
          label="Loading group..."
          className="mt-12"
          isIndeterminate
        />
      )}

      {groupData &&
        <>
          <Heading className="text-lg font-semibold">{groupData.name}</Heading>
          <p>{groupData.description}</p>

          <Tabs>
            <TabList aria-label="Group categories">
              <Tab id="messages">Messages</Tab>
              <Tab id="members">Members</Tab>
            </TabList>
            <TabPanel id="messages">
              w
            </TabPanel>
            <TabPanel id="members">
              <div>
                <ul className="text-sm space-y-1">
                  {groupData.members.length > 0 ? (
                    groupData.members.map((m) => (
                      <li key={m._id}>{m.name || m.email || m._id}</li>
                    ))
                  ) : (
                    <li className="opacity-70">No members yet.</li>
                  )}
                </ul>
              </div>
            </TabPanel>
          </Tabs>


        </>
      }
    </div>
  )
}
