import { Button } from "../ui/Button";
import { useToggleBlock } from "~/api/hooks";

interface BlockButtonProps {
  userId: string;        // the user to block/unblock
  blockedUsers: string[]; // array of currently blocked user IDs
}

export default function BlockButton({ userId, blockedUsers }: BlockButtonProps) {
  const isBlocked = blockedUsers.includes(userId)
  const toggleBlock = useToggleBlock()

  return (
    <Button variant="secondary" isPending={toggleBlock.isPending} onPress={() => toggleBlock.mutate({ id: userId })}>
      {isBlocked ? "Unblock" : "Block"}
    </Button>
  );
}
