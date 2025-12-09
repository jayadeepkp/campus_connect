import { User } from "~/api/hooks";
import BlockButton from "./BlockButton";

export default function BlockedUsersList({ blockedUsers }: { blockedUsers: User[] }) {
  return (
    <div>
      <h3>Blocked Users</h3>
      {blockedUsers.length === 0 ? <p>No blocked users</p> : (
        <ul>
          {blockedUsers.map(u => (
            <li key={u.id} className="flex items-center justify-between">
              <span>{u.name}</span>
              <BlockButton
                userId={u.id}
                blockedUsers={[u.id]}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
