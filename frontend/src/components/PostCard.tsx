import { useState } from "react"
import { TextAreaField } from "../ui/TextField";
import { Button } from "../ui/Button";

export default function PostCard({ post, canEdit, onDelete, onEdit }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(post.content);

  const handleSave = () => {
    onEdit(editText);
    setIsEditing(false);
  };

  return (
    <div className="border border-2 shadow-md border-fuchsia-200 dark:border-stone-800 dark:bg-stone-800/50 bg-fuchsia-200/50 rounded-lg p-4">
      <p>
        <strong>{post.author}</strong>
      </p>

      {isEditing ? (
        <>
          <TextAreaField
            value={editText}
            onChange={setEditText}
            className="my-2"
          />
          <div className="flex flex-row space-x-2">
            <Button variant="secondary" onPress={handleSave}>Save</Button>
            <Button variant="secondary" onPress={() => setIsEditing(false)}>Cancel</Button>
          </div>
        </>
      ) : (
        <p className="my-2">
          {post.content}{" "}
          {post.edited && (
            <span className="opacity-50 italic"> (Edited)</span>
          )}
        </p>
      )}

      {canEdit && !isEditing && (
        <div className="flex flex-row space-x-2">
          <Button variant="secondary" onClick={() => setIsEditing(true)}>Edit</Button>
          <Button variant="secondary" onClick={onDelete} style={{ marginLeft: "1px" }}>
            Undo
          </Button>
        </div>
      )}
    </div>
  );
}
