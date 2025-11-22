import { FormEvent, useState } from "react"
import { TextAreaField, TextField } from "../ui/TextField"
import { Button } from "../ui/Button"
import { Post, useAuthContext, useDeletePost, useEditPost } from "~/api/hooks"
import { formatDistanceToNow } from "date-fns"
import { Form } from "~/ui/Form"
import { MenuTrigger } from "react-aria-components"
import { Menu, MenuItem } from "~/ui/Menu"
import { EllipsisVertical, Eraser, Pencil } from "lucide-react"
import { StandardErrorBox } from "~/ui/ErrorBox"

export default function PostCard({ post }: { post: Post }) {
  const auth = useAuthContext()
  const [isEditing, setIsEditing] = useState(false)
  const [titleText, setTitleText] = useState(post.title)
  const [bodyText, setBodyText] = useState(post.body)
  const canEdit = auth.user?.user.id === post.author

  const editPost = useEditPost()
  const deletePost = useDeletePost()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!e.currentTarget.checkValidity()) {
      return
    }
    if (!titleText.trim().length || !bodyText.trim().length) {
      return
    }

    setIsEditing(false)
    try
    {
      await editPost.mutateAsync({ id: post._id, title: titleText, body: bodyText })
    }
    catch
    {
      setIsEditing(true)
    }
  }

  const edit = () => {
    setTitleText(post.title)
    setBodyText(post.body)
    setIsEditing(true)
  }

  const changePending = editPost.isPending || deletePost.isPending

  return (
    <div className="border border-2 shadow-md border-fuchsia-200 dark:border-stone-800 dark:bg-stone-800/50 bg-fuchsia-200/50 rounded-lg p-4">
      <div className="flex flex-row justify-between items-center">
        <div className="flex flex-row space-x-2 items-baseline">
          <strong>{post.authorName}</strong>
          <span className="text-sm opacity-50">{formatDistanceToNow(post.createdAt, { addSuffix: true })}</span>
          {post.edited && <span className="text-sm opacity-50 italic"> (Edited {formatDistanceToNow(post.updatedAt, { addSuffix: true })})</span>}
        </div>
        <MenuTrigger>
          <Button variant="icon"><EllipsisVertical /></Button>
          <Menu>
            <MenuItem isDisabled={!canEdit} onAction={() => edit()}><Pencil size={16} /> Edit</MenuItem>
            <MenuItem isDisabled={!canEdit} onAction={() => deletePost.mutate({ id: post._id })}><Eraser size={16} /> Delete</MenuItem>
          </Menu>
        </MenuTrigger>
      </div>

      {isEditing ? (
        <Form onSubmit={handleSubmit}>
          <TextField
            value={titleText}
            onChange={setTitleText}
            className="my-2"
            isRequired
          />
          <TextAreaField
            value={bodyText}
            onChange={setBodyText}
            isRequired
          />
          <StandardErrorBox explanation="Failed to edit post" error={editPost.error} />
          <div className="flex flex-row justify-end space-x-2">
            <Button type="submit" variant="secondary">Save</Button>
            <Button variant="secondary" onPress={() => setIsEditing(false)}>Cancel</Button>
          </div>
        </Form>
      ) : (
        <div className={changePending ? "opacity-50" : ""}>
          <h2 className="my-2 text-lg font-bold">{post.title}</h2>
          <p className="my-2">
            {post.body}
          </p>
        </div>
      )}
      <StandardErrorBox explanation="Failed to delete post" error={deletePost.error} />
    </div>
  );
}
