import { useState } from "react";
import { Button } from "../ui/Button";

interface BlockButtonProps {
  userId: string;        // the user to block/unblock
  blockedUsers: string[]; // array of currently blocked user IDs
  token: string;
  onChange?: (blocked: boolean) => void; // optional callback
}

export default function BlockButton({ userId, blockedUsers, token, onChange }: BlockButtonProps) {
  const [loading, setLoading] = useState(false);
  const [isBlocked, setIsBlocked] = useState(blockedUsers.includes(userId));

  const toggleBlock = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5050/api/users/${userId}/block`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });

      const json = await res.json();
      if (json.ok) {
        setIsBlocked(json.data.blocked);
        if (onChange) onChange(json.data.blocked);
      } else {
        console.error(json.error);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <Button variant="secondary" isPending={loading} onPress={toggleBlock}>
      {isBlocked ? "Unblock" : "Block"}
    </Button>
  );
}
