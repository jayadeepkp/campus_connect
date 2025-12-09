import { DialogTrigger, Heading } from "react-aria-components"
import { useGetBlockedUsers, useToggleBlock } from "~/api/hooks"
import { Button } from "~/ui/Button"
import { Dialog } from "~/ui/Dialog"
import { StandardErrorBox } from "~/ui/ErrorBox"
import { GridList, GridListItem } from "~/ui/GridList"
import { Modal } from "~/ui/Modal"
import { ProgressBar } from "~/ui/ProgressBar"

export default function BlockedUsersTab() {
  const blockedUsers = useGetBlockedUsers()
  const blockedUserData = blockedUsers.data?.data
  const toggleBlock = useToggleBlock()

  return (
    <>
      <StandardErrorBox
        error={blockedUsers.error}
        explanation="Failed to load blocked users"
        className="mt-12"
      />

      {blockedUsers.isPending && (
        <ProgressBar
          label="Loading blocked users..."
          className="mt-12"
          isIndeterminate
        />
      )}

      {blockedUserData &&
        <GridList items={blockedUserData}>
          {item =>
            <GridListItem>
              {item.name}
              <DialogTrigger>
                <Button variant="icon">Unblock</Button>
                <Modal isDismissable>
                  <Dialog>
                    <Heading slot="title" className="text-xl font-bold pb-4">Unblock {item.name}?</Heading>

                    <div className="p-4">
                      <p>
                        User will now be able to see your posts and message you. They won't be notified
                      </p>
                    </div>

                    <div className="flex flex-col space-y-2 pt-4">
                      <Button variant="primary" onPress={() => toggleBlock.mutate({ id: item.id })} isPending={toggleBlock.isPending}>
                        Unblock User
                      </Button>
                      <Button variant="secondary" slot="close">
                        Cancel
                      </Button>
                    </div>
                  </Dialog>
                </Modal>
              </DialogTrigger>
            </GridListItem>
          }
        </GridList>
      }
    </>
  )
}
