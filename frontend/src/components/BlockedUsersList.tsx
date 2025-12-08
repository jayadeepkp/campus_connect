import BlockButton from "./BlockButton";

interface Props {
  blockedUsers: { _id: string; name: string; email: string }[];
  token: string;
  onUnblock?: (id: string) => void;
}

export default function BlockedUsersList({ blockedUsers, token, onUnblock }: Props) {
  return (
    <div>
      <h3>Blocked Users</h3>
      {blockedUsers.length === 0 ? <p>No blocked users</p> : (
        <ul>
          {blockedUsers.map(u => (
            <li key={u._id} className="flex items-center justify-between">
              <span>{u.name}</span>
              <BlockButton
                userId={u._id}
                blockedUsers={[u._id]}
                token={token}
                onChange={(blocked) => { if (!blocked && onUnblock) onUnblock(u._id); }}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
