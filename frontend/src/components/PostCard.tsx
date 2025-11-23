import { FormEvent, useState } from "react"
import { TextAreaField, TextField } from "../ui/TextField"
import { Button } from "../ui/Button"
import { type Comment, Post, useAddComment, useAuthContext, useDeletePost, useEditPost, useToggleLike, useDeleteComment, useReplyToComment } from "~/api/hooks"
import { formatDistanceToNow } from "date-fns"
import { Form } from "~/ui/Form"
import { MenuTrigger, TooltipTrigger } from "react-aria-components"
import { Menu, MenuItem } from "~/ui/Menu"
import { EllipsisVertical, Eraser, Heart, MessageCircle, Pencil, Reply } from "lucide-react"
import { StandardErrorBox } from "~/ui/ErrorBox"
import { Tooltip } from "~/ui/Tooltip"
import { tv } from "tailwind-variants"

const commentStyles = tv({
  base: "border border-2 shadow-md border-fuchsia-200 dark:border-stone-800 dark:bg-stone-800/50 bg-fuchsia-200/50 rounded-lg",
  variants: {
    isPending: {
      true: "opacity-50",
    },
  },
})

function Comment({ post, comment }: { post: Post; comment: Comment }) {
  const auth = useAuthContext()
  const deleteComment = useDeleteComment()
  const replyToComment = useReplyToComment()
  const canEdit = auth.user?.user.id === comment.user
  const [isReplying, setIsReplying] = useState(false)
  const [replyText, setReplyText] = useState("")

  const handleSubmitReply = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!e.currentTarget.checkValidity()) {
      return
    }

    if (!replyText.trim().length) {
      return
    }

    await replyToComment.mutateAsync({ postId: post._id, commentId: comment._id, text: replyText })
    setReplyText("")
    setIsReplying(false)
  }

  return (
    <div className={commentStyles({ isPending: deleteComment.isPending || deleteComment.isSuccess })}>
      <div className="p-2 pb-0 flex flex-row justify-between items-center">
        <div className="flex flex-row space-x-2 items-baseline">
          <strong>{comment.userName}</strong>
          <span className="text-sm opacity-50">{formatDistanceToNow(comment.createdAt, { addSuffix: true })}</span>
        </div>
        <MenuTrigger>
          <Button variant="icon"><EllipsisVertical size={16} /></Button>
          <Menu>
            <MenuItem isDisabled={!canEdit} onAction={() => deleteComment.mutate({ postId: post._id, commentId: comment._id })}><Eraser size={16} /> Delete</MenuItem>
            <MenuItem onAction={() => setIsReplying(true)}><Reply size={16} /> Reply</MenuItem>
          </Menu>
        </MenuTrigger>
      </div>
      <div className="p-2">
        {comment.text}
      </div>
      {comment.replies.length > 0 &&
        <div className="border-t-2 border-fuchsia-200 dark:border-stone-800 p-4 flex flex-col space-y-2">
          {comment.replies.map(reply =>
            <div className={commentStyles()}>
              <div className="p-2">
                <div className="flex flex-row space-x-2 items-baseline">
                  <strong>{reply.userName}</strong>
                  <span className="text-sm opacity-50">{formatDistanceToNow(reply.createdAt, { addSuffix: true })}</span>
                </div>
                {reply.text}
              </div>
            </div>
          )}
        </div>
      }
      {isReplying &&
        <div className="border-t-2 border-fuchsia-200 dark:border-stone-800 p-4">
          <Form onSubmit={handleSubmitReply} className="flex flex-col space-y-2">
            <TextAreaField
              placeholder="Write a reply. Be nice!"
              value={replyText}
              onChange={setReplyText}
              isRequired
              isDisabled={replyToComment.isPending}
            />
            <div className="self-end flex flex-row space-x-2">
              <Button type="submit" variant="secondary" isPending={replyToComment.isPending}>Reply</Button>
              <Button variant="secondary" onPress={() => setIsReplying(false)}>Cancel</Button>
            </div>
            <StandardErrorBox explanation="Failed to submit reply:" error={replyToComment.error} />
          </Form>
        </div>
      }
    </div>
  )
}

export default function PostCard({ post }: { post: Post }) {
  const auth = useAuthContext()
  const [isEditing, setIsEditing] = useState(false)
  const [showingComments, setShowingComments] = useState(false)
  const [titleText, setTitleText] = useState(post.title)
  const [bodyText, setBodyText] = useState(post.body)
  const [commentText, setCommentText] = useState("")
  const canEdit = auth.user?.user.id === post.author

  const editPost = useEditPost()
  const deletePost = useDeletePost()
  const likePost = useToggleLike()
  const addComment = useAddComment()

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

  const handleSubmitComment = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!e.currentTarget.checkValidity()) {
      return
    }

    if (!commentText.trim().length) {
      return
    }

    await addComment.mutateAsync({ id: post._id, text: commentText })
    setCommentText("")
  }

  const edit = () => {
    setTitleText(post.title)
    setBodyText(post.body)
    setIsEditing(true)
  }

  const changePending = editPost.isPending || deletePost.isPending || likePost.isPending

  return (
    <div className="border border-2 shadow-md border-fuchsia-200 dark:border-stone-800 dark:bg-stone-800/50 bg-fuchsia-200/50 rounded-lg">
      <div className="flex flex-row justify-between items-center p-4 pb-0">
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
        <Form onSubmit={handleSubmit} className="p-4 pt-0">
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
        <div className={changePending ? "opacity-50 p-4 pt-0" : "p-4 pt-0"}>
          <h2 className="my-2 text-lg font-bold">{post.title}</h2>
          <p className="my-2">
            {post.body}
          </p>
          <div className="flex flex-row justify-end space-x-2">
            <TooltipTrigger delay={100}>
              <Button variant="icon" onPress={() => likePost.mutate({ id: post._id })}><Heart fill={post.likes.includes(auth.user!.user.id) ? "currentColor" : "none"} /> <span className="pl-2 text-lg">{post.likes.length}</span></Button>
              <Tooltip>
                {post.likes.length === 0 && "Nobody has liked this post so far. Be the first!"}
                {post.likes.length > 0 && (
                  <ul>
                    {post.likes.map(like => <li>{like}</li>)}
                  </ul>
                )}
              </Tooltip>
            </TooltipTrigger>
            <Button variant="icon" onPress={() => setShowingComments(it => !it)}><MessageCircle /> <span className="pl-2 text-lg">{post.comments.length}</span></Button>
          </div>
        </div>
      )}
      <StandardErrorBox explanation="Failed to delete post" error={deletePost.error} />
      {showingComments &&
        <>
          <div className="border-t-2 border-fuchsia-200 dark:border-stone-800 p-4">
            {post.comments.length === 0 && <div>Nobody has commented on this post so far. Be the first!</div>}
            <div className="flex flex-col space-y-2">
              {post.comments.map(comment => <Comment post={post} comment={comment} />)}
            </div>
          </div>
          <div className="border-t-2 border-fuchsia-200 dark:border-stone-800 p-4">
            <Form onSubmit={handleSubmitComment} className="flex flex-col space-y-2">
              <TextAreaField
                placeholder="Write a comment. Be nice!"
                value={commentText}
                onChange={setCommentText}
                isRequired
                isDisabled={addComment.isPending}
              />
              <Button className="self-end" type="submit" variant="secondary" isPending={addComment.isPending}>Comment</Button>
              <StandardErrorBox explanation="Failed to submit comment:" error={addComment.error} />
            </Form>
          </div>
        </>
      }
    </div>
  );
}
