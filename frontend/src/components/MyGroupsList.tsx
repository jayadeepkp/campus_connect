import { DialogTrigger, Heading } from "react-aria-components";
import { useDeleteGroup, useListMyGroups } from "~/api/hooks";
import { Button } from "~/ui/Button";
import { Dialog } from "~/ui/Dialog";
import { StandardErrorBox } from "~/ui/ErrorBox";
import { Link } from "~/ui/Link";
import { Modal } from "~/ui/Modal";

export function MyGroupsList() {
  const myGroups = useListMyGroups()
  const deleteGroup = useDeleteGroup()

  if (myGroups.isLoading) {
    return <p className="mt-8">Loading your groups…</p>;
  }

  if (myGroups.isError) {
    return <StandardErrorBox explanation="Failed to load groups" error={myGroups.error} />
  }

  if (myGroups.data === undefined) {
    throw new Error("should be defined if it's not loading or errored")
  }

  if (myGroups.data.data.length === 0) {
    return null
  }

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-2">Your groups</h3>
      <ul className="space-y-2">
        {myGroups.data.data.map((g) => (
          <li
            key={g._id}
            className="border border-fuchsia-500/40 rounded px-3 py-2 flex justify-between items-start"
          >
            <div>
              <Link to="/groups/$groupId" params={{groupId: g._id}} className="font-medium">{g.name}</Link>
              {g.description && (
                <div className="text-sm opacity-70">{g.description}</div>
              )}
            </div>

            <DialogTrigger>
              <Button variant="icon">Delete Group</Button>
              <Modal isDismissable>
                <Dialog>
                  <Heading slot="title" className="text-xl font-bold pb-4">Confirm group deletion</Heading>
                  <p className="pb-4">
                    This will delete the <strong>{g.name}</strong> group forever. This is irreversible.
                  </p>
                  <div className="flex flex-col space-y-2">
                    <Button variant="destructive" type="submit" isPending={deleteGroup.isPending} onPress={() => deleteGroup.mutate({ id: g._id })}>Delete Group</Button>
                    <Button variant="secondary" slot="close">Cancel</Button>
                  </div>
                </Dialog>
              </Modal>
            </DialogTrigger>
          </li>
        ))}
      </ul>
    </div>
  );
}
